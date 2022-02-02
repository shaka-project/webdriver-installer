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

const execFile = util.promisify(childProcess.execFile);
const pipeline = util.promisify(stream.pipeline);
const zipFromBuffer = util.promisify(yauzl.fromBuffer);

/**
 * A static utility class for driver installers to use for common operations.
 */
class InstallerUtils {
  /**
   * Execute an external command to get a result containing .stdout and .stderr.
   * All output is interpretted as UTF-8.
   *
   * Throws if the command fails.  If the command does not exist, the thrown
   * error has .code == 'ENOENT'.
   *
   * @param {!Array<string>} args
   * @return {!Promise<!Object>} as returned by child_process.spawn
   */
  static async runCommand(args) {
    return await execFile(args[0], args.slice(1), {encoding: 'utf8'});
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
   * @return {!Promise<!Response>}
   */
  static async fetchUrl(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
          `Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    return response;
  }

  /**
   * Get a version number from the Windows registry.
   *
   * @param {string} path
   * @param {string} key
   * @return {!Promise<?string>}
   */
  static async getWindowsRegistryVersion(path, key) {
    if (os.platform() != 'win32') {
      return null;
    }

    const result = await InstallerUtils.runCommand([
      'reg', 'query', path, '/v', key,
    ]);

    // Find the line with the key in it.  For "version", it would look something
    // like this:
    //     version    REG_SZ    94.0.4606.61
    for (const line of result.stdout.split('\n')) {
      if (line[0] == ' ' && line.includes(key)) {
        // Find the section that starts with a number.
        for (const section of line.split(' ')) {
          if (section[0] >= '0' && section[0] <= '9') {
            return section;
          }
        }
      }
    }

    // Not found.
    return null;
  }

  /**
   * Test if a file exists.
   *
   * @param {path}
   * @return {!Promise<boolean}
   */
  static async fileExists(path) {
    try {
      await fsPromises.stat(path);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get a version number from the metadata of a Windows executable.
   *
   * @param {string} path
   * @return {!Promise<?string>}
   */
  static async getWindowsExeVersion(path) {
    if (os.platform() != 'win32') {
      return null;
    }

    if (!(await InstallerUtils.fileExists(path))) {
      // No such file.  Avoid the need to parse "not found" errors from
      // powershell output.
      return null;
    }

    const result = await InstallerUtils.runCommand([
      'powershell',
      `(Get-Item "${path}").VersionInfo.ProductVersion`,
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
   * Fetch a version number from a URL.  Both Chrome and Edge use this.
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
   * Fetch the latest tag from a GitHub repo.
   *
   * @param {string} repo
   * @return {?string}
   */
  static async fetchLatestGitHubTag(repo) {
    const url = `https://api.github.com/repos/${repo}/releases/latest`;
    const response = await InstallerUtils.fetchUrl(url);
    const releaseMetadata = await response.json();
    return releaseMetadata['tag_name'];
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
    const response = await InstallerUtils.fetchUrl(url);
    const buffer = Buffer.from(await response.arrayBuffer());

    // If the output file already exists, remove it before overwriting it.
    // This is important if it's a running executable.  Otherwise, we might get
    // permission errors overwriting it.  Unlinking it first will ensure the
    // newly-written file is a fresh filesystem inode that doesn't conflict
    // with what's running.
    if (await InstallerUtils.fileExists(path)) {
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
