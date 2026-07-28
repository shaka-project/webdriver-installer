/*! @license
 * WebDriver Installer
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const childProcess = require('child_process');
const fetch = require('node-fetch');
const fs = require('fs');
const fsPromises = require('fs').promises;
const os = require('os');
const path = require('path');
const stream = require('stream');
const tar = require('tar-stream');
const util = require('util');
const yauzl = require('yauzl');
const zlib = require('zlib');

const pipeline = util.promisify(stream.pipeline);
const zipFromBuffer = util.promisify(yauzl.fromBuffer);

const WINDOWS_REGISTRY_APP_PATHS =
    'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\App\ Paths\\';

// Every command we run is a quick local probe: read a registry value, ask a
// binary for its version, ask an attached device what it has installed.  None
// of them should take more than a second or two.  But each one talks to
// something that can stop answering without ever failing: an unresponsive
// Android device over adb, an unhealthy OS service behind PowerShell, a
// launch-on-demand app behind osascript.  Without a limit, one sick component
// hangs the whole installation forever, which is much worse than skipping a
// browser.  Be generous, since a false timeout means a driver doesn't get
// installed, but do not wait indefinitely.
const COMMAND_TIMEOUT_MS = 60 * 1000;

// Version metadata requests are small.  This caps both the wait for a response
// and the time spent reading the body, so a connection that opens and then
// stalls cannot block us forever.
const FETCH_TIMEOUT_MS = 60 * 1000;

// Driver archives are a few megabytes, and may be pulled over a slow link, so
// they get a much larger budget than metadata requests.
const DOWNLOAD_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Forcibly kill a running command, and anything it spawned.
 *
 * On Windows, tools installed through Chocolatey (adb among them) run behind a
 * generated shim, so the process we started is only a launcher and the real
 * tool is its child.  Killing the launcher alone would leave the hung tool
 * running, which is the stray process this timeout exists to prevent.
 * taskkill /T covers the tree and /F forces it.
 *
 * Elsewhere, the wrappers we run into (the google-chrome shell script, for
 * example) exec the real binary in place, so there is no separate child.
 *
 * @param {!ChildProcess} child
 */
function killProcessTree(child) {
  // Tear down the pipes first.  We are waiting on the command's output streams
  // to close, and if it left a child of its own holding the write end open,
  // that never happens and killing the process alone would not unblock us.
  // child_process does the same thing in its own timeout handling.
  if (child.stdout) {
    child.stdout.destroy();
  }
  if (child.stderr) {
    child.stderr.destroy();
  }

  if (os.platform() == 'win32') {
    const root = process.env.SystemRoot || 'C:\\Windows';
    // Errors are ignored: by the time this runs, the process may already be
    // gone, and there is nothing useful to do about it either way.
    childProcess.execFile(
        `${root}\\System32\\taskkill.exe`,
        ['/pid', child.pid.toString(), '/t', '/f'],
        () => {});
  } else {
    child.kill('SIGKILL');
  }
}

/**
 * A static utility class for driver installers to use for common operations.
 */
class InstallerUtils {
  /**
   * Execute an external command to get a result containing .stdout and .stderr.
   * All output is interpretted as UTF-8.
   *
   * Throws if the command fails.  If the command does not exist, the thrown
   * error has .code == 'ENOENT'.  If the command runs longer than the timeout,
   * it is killed and the thrown error has .killed == true.
   *
   * @param {!Array<string>} args
   * @param {number=} timeoutMs
   * @return {!Promise<!Object>} as returned by child_process.spawn
   */
  static runCommand(args, timeoutMs=COMMAND_TIMEOUT_MS) {
    // NOTE: We run our own timer rather than passing execFile's "timeout"
    // option, because that option kills only the process we started, which on
    // Windows can be a shim wrapping the tool that is actually stuck.
    return new Promise((resolve, reject) => {
      let timedOut = false;
      let timer = null;

      const child = childProcess.execFile(
          args[0], args.slice(1), {encoding: 'utf8'},
          (error, stdout, stderr) => {
            clearTimeout(timer);

            if (!error) {
              resolve({stdout, stderr});
              return;
            }

            // Attach the output the same way util.promisify(execFile) would
            // have.  Callers below read .stderr off the thrown error.
            error.stdout = stdout;
            error.stderr = stderr;

            if (timedOut) {
              // Say what actually happened, so a hang is recognizable in a log
              // instead of looking like an ordinary command failure.  Callers
              // use .killed to tell the two apart.
              error.killed = true;
              error.message =
                  `Command timed out after ${timeoutMs / 1000}s: ` +
                  args.join(' ');
            }

            reject(error);
          });

      timer = setTimeout(() => {
        timedOut = true;
        killProcessTree(child);
      }, timeoutMs);
    });
  }

  /**
   * Execute a command and return its stdout.  If the command is missing,
   * returns null.  If the command fails, throws.
   *
   * @param {!Array<string>} args
   * @return {!Promise<?string>}
   */
  static async getCommandOutputOrNullIfMissing(args) {
    try {
      const result = await InstallerUtils.runCommand(args);
      // Success.  Return command's stdout.
      return result.stdout;
    } catch (error) {
      if (error.code == 'ENOENT') {
        // Command does not exist.
        return null;
      } else if (error.code == 'EACCES') {  // Missing "s" is not a typo!
        // Command is not executable.  This can happen after a failed run that
        // downloads something, but is interrupted before setting its
        // executable bit.
        return null;
      } else {
        // Command exists, but failed.
        throw error;
      }
    }
  }

  /**
   * Fetch a URL, throwing if the HTTP status code is not 2XX.
   *
   * @param {string} url
   * @param {number=} timeoutMs
   * @return {!Promise<!Response>}
   */
  static async fetchUrl(url, timeoutMs=FETCH_TIMEOUT_MS) {
    const response = await fetch(url, {timeout: timeoutMs});
    if (!response.ok) {
      throw new Error(
          `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
          { cause: response });
    }
    return response;
  }

  /**
   * Read a value from the Windows registry.  Returns null if not found.
   *
   * Uses PowerShell's registry provider.  We avoid WMI-based registry access
   * (as used by some libraries), which can hang indefinitely when a machine's
   * WMI provider is unhealthy and would block driver installation.
   *
   * @param {string} regPath  A registry path like "HKLM\\Software\\..."
   * @param {string} key  A value name, or "" for the key's default value.
   * @return {!Promise<?string>}
   */
  static async getWindowsRegistryVersion(regPath, key) {
    if (os.platform() != 'win32') {
      return null;
    }

    // Read the native view first, then the 32-bit (WOW6432Node) view, since the
    // value could be in either.
    const psPath = regPath.replace(/^HKLM\\/i, 'HKLM:\\');
    const psPaths = [psPath];
    const wowPath = psPath.replace(/^(HKLM:\\Software\\)/i, '$1WOW6432Node\\');
    if (wowPath != psPath) {
      psPaths.push(wowPath);
    }

    // PowerShell exposes a key's default value under the name "(default)".
    const valueName = key === '' ? '(default)' : key;

    for (const psRegPath of psPaths) {
      const result = await InstallerUtils.runCommand([
        'powershell',
        `(Get-ItemProperty -LiteralPath '${psRegPath}' ` +
            `-ErrorAction SilentlyContinue).'${valueName}'`,
      ]);
      const value = result.stdout.trim();
      if (value) {
        return value;
      }
    }

    return null;
  }

  /**
   * Test if a file exists.
   *
   * @param {filePath}
   * @return {!Promise<boolean}
   */
  static async fileExists(filePath) {
    try {
      await fsPromises.stat(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get a version number from the metadata of a Windows executable.
   *
   * @param {string} executablePath
   * @return {!Promise<?string>}
   */
  static async getWindowsExeVersion(executablePath) {
    if (os.platform() != 'win32') {
      return null;
    }

    if (!(await InstallerUtils.fileExists(executablePath))) {
      // No such file.
      // If it's a relative path, ask the registry for a full one.
      if (!executablePath.includes('/') && !executablePath.includes('\\')) {
        executablePath = await InstallerUtils.getWindowsRegistryVersion(
            WINDOWS_REGISTRY_APP_PATHS + executablePath,
            '');
        if (!executablePath ||
            !(await InstallerUtils.fileExists(executablePath))) {
          return null;
        }
      }
    }

    const result = await InstallerUtils.runCommand([
      'powershell',
      `(Get-Item "${executablePath}").VersionInfo.ProductVersion`,
    ]);

    const output = result.stdout.trim();
    if (output == '') {
      // No such metadata found by powershell.
      return null;
    }

    return output;
  }

  /**
   * Get the version of an installed app on macOS.
   *
   * @param {string} appName
   * @return {!Promise<?string>}
   */
  static async getMacAppVersion(appName) {
    if (os.platform() != 'darwin') {
      return null;
    }

    try {
      const result = await InstallerUtils.runCommand([
        'osascript', '-e', 
        `tell application "${appName}" to get version`,
      ]);
      return result.stdout.trim();
    } catch (error) {
      if (error.killed) {
        // A timeout is not the same as "no such app".  Let it propagate, so
        // that a hung osascript is reported instead of quietly skipping the
        // browser's driver.  See also the Firefox-specific workaround in
        // firefox.js, added for a hang of exactly this kind.
        throw error;
      }
      return null;
    }
  }

  /**
   * Get the version of an installed Android app on a connected device.
   *
   * @param {string} appReverseDomainName
   * @return {!Promise<?string>}
   */
  static async getAndroidAppVersion(appReverseDomainName) {
    let result;

    try {
      result = await InstallerUtils.runCommand([
        'adb', 'shell', 'dumpsys', `package ${appReverseDomainName}`,
      ]);
    } catch (error) {
      if (error.code == 'ENOENT') {
        // No adb, so no Android connection.
        return null;
      } else if (error.killed) {
        // adb stopped responding, which happens when a device is attached but
        // wedged.  runCommand already put the timeout into the message, so
        // propagate it rather than flattening it into the generic failure
        // below.
        throw error;
      } else if (error.code != 0) {
        if (error.stderr.includes('no devices')) {
          // No devices attached.
          return null;
        }

        // Otherwise, print the error output and raise an error.
        process.stderr.write(error.stderr);
        throw new Error(`Failed to communicate with adb!`);
      }
    }

    for (const line of result.stdout.split('\n')) {
      // Something like:
      //   versionName=1.2.3
      if (line.includes('versionName')) {
        return line.split('=')[1];
      }
    }

    return null;
  }

  /**
   * Fetch a version number from a URL.
   *
   * @param {string} url
   * @param {string=} encoding
   * @return {!Promise<?string>}
   */
  static async fetchVersionUrl(url, encoding='utf8') {
    const response = await InstallerUtils.fetchUrl(url);
    const data = Buffer.from(await response.arrayBuffer());
    // Decode the string, then remove any newlines.
    return data.toString(encoding).trim();
  }

  /**
   * Fetch a version number from a URL.  If not found, downgrade the major
   * version and try again.  If a WebDriver release lags the browser release
   * (which seems common), this will compensate.  Both Chrome and Edge use
   * this.
   *
   * @param {number} idealMajorVersion
   * @param {number} minMajorVersion
   * @param {function(number): string} urlFormatter
   * @param {string=} encoding
   * @return {!Promise<string>}
   */
  static async fetchVersionUrlWithAutomaticDowngrade(
      idealMajorVersion, minMajorVersion, urlFormatter, encoding) {
    let majorVersion = idealMajorVersion;
    let firstError = null;

    while (majorVersion >= minMajorVersion) {
      const versionUrl = urlFormatter(majorVersion);
      try {
        return await InstallerUtils.fetchVersionUrl(versionUrl, encoding);
      } catch (error) {
        if (error.cause?.status != 404) {
          // Any unexpected error (other than HTTP 404) is thrown immediately.
          throw error;
        }

        // Save the first error in case we run out this loop.  We'll throw this
        // one if none of the allowed versions can be found.
        if (firstError == null) {
          firstError = error;
        }

        // For 404 errors, decrease the major version, fall through, loop, and
        // try again.
        majorVersion--;
      }
    }

    // We tried all allowed versions.  Throw the initial error, which will have
    // details of the first URL we tried.
    throw firstError;
  }

  /**
   * Fetch the latest tag from a GitHub repo.
   *
   * @param {string} repo
   * @return {?string}
   */
  static async fetchLatestGitHubTag(repo) {
    // The GitHub API has rate limits, but this is public.  It will redirect to
    // a URL specific to the tag.
    const url = `https://github.com/${repo}/releases/latest`;
    const response = await fetch(
        url, {method: 'HEAD', timeout: FETCH_TIMEOUT_MS});
    // The redirected URL will be something like:
    //   "https://github.com/mozilla/geckodriver/releases/tag/v0.30.0"
    return response.url.split('/').pop();
  }

  /**
   * Find a specific entry in a zip file.
   *
   * @param {!YauzlZipFile} zipfile
   * @param {string} nameInArchive
   * @return {!Promise<!YauzlZipEntry>}
   */
  static findZipEntry(zipfile, nameInArchive) {
    return new Promise((resolve, reject) => {
      zipfile.on('entry', (entry) => {
        if (entry.fileName == nameInArchive) {
          // Found it!
          resolve(entry);
        } else {
          // Read the next one.
          zipfile.readEntry();
        }
      });
      zipfile.on('end', () => {
        // Reached the end without finding our target.
        reject(new Error(`Failed to find ${nameInArchive} in zip file!`));
      });
      // Kick-start the reading process.
      zipfile.readEntry();
    });
  }

  /**
   * Find a specific entry in a tar file.
   *
   * @param {!Buffer} buffer
   * @param {string} nameInArchive
   * @return {!Promise<!Stream>}
   */
  static findTarEntry(buffer, nameInArchive) {
    return new Promise((resolve, reject) => {
      const extract = tar.extract();

      extract.on('entry', (entry, stream, next) => {
        if (entry.name == nameInArchive) {
          // Found it!
          resolve(stream);
        } else {
          // Drain the stream so that tar parsing can continue.
          stream.on('end', next);
          stream.resume();
        }
      });

      extract.on('finish', () => {
        // Reached the end without finding our target.
        reject(new Error(`Failed to find ${nameInArchive} in tar file!`));
      });

      // Push the buffer through the decompression and extraction pipeline.
      const gunzip = zlib.createGunzip();
      gunzip.pipe(extract);
      gunzip.end(buffer);
    });
  }

  /**
   * Extract a file from an archive by URL.
   *
   * @param {string} url
   * @param {string} nameInArchive
   * @param {string} outputPath
   * @param {boolean} isZip
   */
  static async extractFromNetworkArchive(
      url, nameInArchive, outputPath, isZip) {
    const response = await InstallerUtils.fetchUrl(url, DOWNLOAD_TIMEOUT_MS);
    const buffer = Buffer.from(await response.arrayBuffer());

    // If the output file already exists, remove it before overwriting it.
    // This is important if it's a running executable.  Otherwise, we might get
    // permission errors overwriting it.  Unlinking it first will ensure the
    // newly-written file is a fresh filesystem inode that doesn't conflict
    // with what's running.
    if (await InstallerUtils.fileExists(outputPath)) {
      await fsPromises.unlink(outputPath);
    }

    if (isZip) {
      const zipfile = await zipFromBuffer(buffer, {
        lazyEntries: true,
      });
      const entry = await InstallerUtils.findZipEntry(zipfile, nameInArchive);
      const openReadStream = util.promisify(
          zipfile.openReadStream.bind(zipfile));
      await pipeline(
        await openReadStream(entry),
        fs.createWriteStream(outputPath),
      );
    } else {
      const stream = await InstallerUtils.findTarEntry(buffer, nameInArchive);
      await pipeline(
        stream,
        fs.createWriteStream(outputPath),
      );
    }
  }

  static async installBinary(
      url, nameInArchive, outputName, outputDirectory, isZip) {
    const outputPath = path.join(outputDirectory, outputName);
    await InstallerUtils.extractFromNetworkArchive(
        url, nameInArchive, outputPath, isZip);
    await fsPromises.chmod(outputPath, 0o755);
  }
}

module.exports = {InstallerUtils};
