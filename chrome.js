/*! @license
 * WebDriver Installer
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const {WebDriverInstallerBase} = require('./base.js');
const {InstallerUtils} = require('./utils.js');

const os = require('os');
const path = require('path');

const CDN_URL = 'https://chromedriver.storage.googleapis.com';

/**
 * An installer for chromedriver for desktop Chrome.
 */
class ChromeWebDriverInstaller extends WebDriverInstallerBase {
  /** @return {string} */
  getBrowserName() {
    return 'Chrome';
  }

  /** @return {string} */
  getDriverName() {
    return 'chromedriver';
  }

  /** @return {!Promise<?string>} */
  async getInstalledBrowserVersion() {
    if (os.platform() == 'linux') {
      const output = await InstallerUtils.getCommandOutputOrNullIfMissing(
          ['google-chrome', '--version']);
      // Output is a string like "Google Chrome 96.0.4664.110\n"
      return output ? output.trim().split(' ')[2] : null;
    } else if (os.platform() == 'darwin') {
      return await InstallerUtils.getMacAppVersion('Google Chrome');
    } else if (os.platform() == 'win32') {
      return await InstallerUtils.getWindowsRegistryVersion(
          'HKEY_CURRENT_USER\\Software\\Google\\Chrome\\BLBeacon',
          'version');
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
    // turn something like "./chromedriver" into "chromedriver", which would
    // fail to execute.
    const outputPath = outputDirectory + path.sep + this.getDriverName();

    const output = await InstallerUtils.getCommandOutputOrNullIfMissing(
        [outputPath, '--version']);
    // Output is a string like "ChromeDriver 98.0.4758.48 (gitref)\n"
    return output ? output.trim().split(' ')[1] : null;
  }

  /**
   * @param {string} browserVersion
   * @return {!Promise<string>}
   */
  async getBestDriverVersion(browserVersion) {
    const majorVersion = browserVersion.split('.')[0];
    const versionUrl = `${CDN_URL}/LATEST_RELEASE_${majorVersion}`;
    return await InstallerUtils.fetchVersionUrl(versionUrl);
  }

  /**
   * @param {string} driverVersion
   * @param {string} outputDirectory
   * @param {string=} outputName
   * @return {!Promise}
   */
  async install(driverVersion, outputDirectory) {
    let platform;

    if (os.platform() == 'linux') {
      platform = 'linux64';
    } else if (os.platform() == 'darwin') {
      platform = 'mac64';
    } else if (os.platform() == 'win32') {
      platform = 'win32';
    } else {
      throw new Error(`Unrecognized platform: ${os.platform()}`);
    }

    const archiveUrl =
        `${CDN_URL}/${driverVersion}/chromedriver_${platform}.zip`;

    let binaryName = 'chromedriver';
    if (os.platform() == 'win32') {
      binaryName += '.exe';
    }

    let outputName = this.getDriverName();
    if (os.platform() == 'win32') {
      outputName += '.exe';
    }

    return await InstallerUtils.installBinary(
        archiveUrl, binaryName, outputName,
        outputDirectory, /* isZip= */ true);
  }
}

module.exports = {ChromeWebDriverInstaller};
