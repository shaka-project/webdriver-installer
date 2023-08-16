/*! @license
 * WebDriver Installer
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const {WebDriverInstallerBase} = require('./base.js');
const {InstallerUtils} = require('./utils.js');

const os = require('os');
const path = require('path');

/**
 * An installer for chromedriver for desktop Firefox.
 */
class FirefoxWebDriverInstaller extends WebDriverInstallerBase {
  /** @return {string} */
  getBrowserName() {
    return 'Firefox';
  }

  /** @return {string} */
  getDriverName() {
    return 'geckodriver';
  }

  /** @return {!Promise<?string>} */
  async getInstalledBrowserVersion() {
    if (os.platform() == 'linux') {
      const output = await InstallerUtils.getCommandOutputOrNullIfMissing(
          ['firefox', '-v']);
      // Output is a string like "Mozilla Firefox 96.0"
      return output ? output.trim().split(' ')[2] : null;
    } else if (os.platform() == 'darwin') {
      return await InstallerUtils.getMacAppVersion('Firefox');
    } else if (os.platform() == 'win32') {
      return await InstallerUtils.getWindowsExeVersion('firefox.exe');
    } else {
      throw new Error(`Unrecognized platform: ${os.platform()}`);
    }
  }

  /**
   * @param {string} outputDirectory
   * @return {!Promise<?string>}
   */
  async getInstalledDriverVersion(outputDirectory) {
    // NOTE: Using path.join here would also normalize the path, which would
    // turn something like "./geckodriver" into "geckodriver", which would
    // fail to execute.
    const outputPath = outputDirectory + path.sep + this.getDriverName();

    const output = await InstallerUtils.getCommandOutputOrNullIfMissing(
        [outputPath, '--version']);
    // Output is a string like "geckodriver 0.30.0 (sha1 date)\n"
    return output ? output.trim().split(' ')[1] : null;
  }

  /**
   * @param {string} browserVersion
   * @return {!Promise<string>}
   */
  async getBestDriverVersion(browserVersion) {
    // NOTE: geckodriver is currently independent of Firefox versions.
    const tag =
        await InstallerUtils.fetchLatestGitHubTag('mozilla/geckodriver');
    // NOTE: tags start with "v", but the version number reported by the binary
    // does not.  So that they can be directly compared, strip the "v" from the
    // tag.
    console.assert(tag[0] == 'v');
    return tag.substr(1);
  }

  /**
   * @param {string} driverVersion
   * @param {string} outputDirectory
   * @return {!Promise}
   */
  async install(driverVersion, outputDirectory) {
    let platform;
    let extension;
    let isZip;

    if (os.platform() == 'linux') {
      platform = 'linux64';
      extension = 'tar.gz';
      isZip = false;
    } else if (os.platform() == 'darwin') {
      platform = 'macos';
      extension = 'tar.gz';
      isZip = false;
    } else if (os.platform() == 'win32') {
      platform = 'win64';
      extension = 'zip';
      isZip = true;
    } else {
      throw new Error(`Unrecognized platform: ${os.platform()}`);
    }

    const archiveUrl =
        'https://github.com/mozilla/geckodriver/releases/download' +
        `/v${driverVersion}` +
        `/geckodriver-v${driverVersion}-${platform}.${extension}`;

    let binaryName = 'geckodriver';
    if (os.platform() == 'win32') {
      binaryName += '.exe';
    }

    let outputName = this.getDriverName();
    if (os.platform() == 'win32') {
      outputName += '.exe';
    }

    return await InstallerUtils.installBinary(
        archiveUrl, binaryName, outputName,
        outputDirectory, isZip);
  }
}

module.exports = {FirefoxWebDriverInstaller};
