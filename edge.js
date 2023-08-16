/*! @license
 * WebDriver Installer
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const {WebDriverInstallerBase} = require('./base.js');
const {InstallerUtils} = require('./utils.js');

const os = require('os');
const path = require('path');

const CDN_URL = 'https://msedgedriver.azureedge.net/';

/**
 * An installer for msedgedriver for desktop Edge.
 */
class EdgeWebDriverInstaller extends WebDriverInstallerBase {
  /** @return {string} */
  getBrowserName() {
    return 'Edge';
  }

  /** @return {string} */
  getDriverName() {
    return 'msedgedriver';
  }

  /** @return {!Promise<?string>} */
  async getInstalledBrowserVersion() {
    if (os.platform() == 'linux') {
      const output = await InstallerUtils.getCommandOutputOrNullIfMissing(
          ['microsoft-edge', '--version']);
      // Output is a string like "Microsoft Edge 97.0.1072.76\n"
      return output ? output.trim().split(' ')[2] : null;
    } else if (os.platform() == 'darwin') {
      return await InstallerUtils.getMacAppVersion('Microsoft Edge');
    } else if (os.platform() == 'win32') {
      return await InstallerUtils.getWindowsExeVersion('msedge.exe');
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
    // turn something like "./msedgedriver" into "msedgedriver", which would
    // fail to execute.
    const outputPath = outputDirectory + path.sep + this.getDriverName();

    const output = await InstallerUtils.getCommandOutputOrNullIfMissing(
        [outputPath, '--version']);
    // Output is a string like "Microsoft Edge WebDriver 108.0.1462.46 ...\n"
    return output ? output.trim().split(' ')[3] : null;
  }

  /**
   * @param {string} browserVersion
   * @return {!Promise<string>}
   */
  async getBestDriverVersion(browserVersion) {
    const idealMajorVersion = parseInt(browserVersion.split('.')[0], 10);

    let platform;
    if (os.platform() == 'linux') {
      platform = 'LINUX';
    } else if (os.platform() == 'darwin') {
      platform = 'MACOS';
    } else if (os.platform() == 'win32') {
      platform = 'WINDOWS';
    } else {
      throw new Error(`Unrecognized platform: ${os.platform()}`);
    }

    const urlFormatter = (majorVersion) => {
      return `${CDN_URL}/LATEST_RELEASE_${majorVersion}_${platform}`;
    };

    return await InstallerUtils.fetchVersionUrlWithAutomaticDowngrade(
        idealMajorVersion,
        /* minMajorVersion */ idealMajorVersion - 2,
        urlFormatter,
        'UTF-16LE');
  }

  /**
   * @param {string} driverVersion
   * @param {string} outputDirectory
   * @return {!Promise}
   */
  async install(driverVersion, outputDirectory) {
    let platform;

    if (os.platform() == 'linux') {
      platform = 'linux64';
    } else if (os.platform() == 'darwin') {
      platform = 'mac64';
    } else if (os.platform() == 'win32') {
      platform = 'win64';
    } else {
      throw new Error(`Unrecognized platform: ${os.platform()}`);
    }

    const archiveUrl = `${CDN_URL}/${driverVersion}/edgedriver_${platform}.zip`;

    let binaryName = 'msedgedriver';
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

module.exports = {EdgeWebDriverInstaller};
