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
    return await InstallerUtils.getWindowsExeVersion(
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe');
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
    // Output is a string like "MSEdgeDriver 96.0.1054.62 (sha1)\n"
    return output ? output.trim().split(' ')[1] : null;
  }

  /**
   * @param {string} browserVersion
   * @return {!Promise<string>}
   */
  async getBestDriverVersion(browserVersion) {
    const majorVersion = browserVersion.split('.')[0];
    const versionUrl = `${CDN_URL}/LATEST_RELEASE_${majorVersion}`;
    return await InstallerUtils.fetchVersionUrl(versionUrl, 'UTF-16LE');
  }

  /**
   * @param {string} driverVersion
   * @param {string} outputDirectory
   * @param {string=} outputName
   * @return {!Promise}
   */
  async install(driverVersion, outputDirectory) {
    const archiveUrl = `${CDN_URL}/${driverVersion}/edgedriver_win64.zip`;
    const binaryName = 'msedgedriver.exe';
    const outputName = this.getDriverName() + '.exe';
    return await InstallerUtils.installBinary(
        archiveUrl, binaryName, outputName,
        outputDirectory, /* isZip= */ true);
  }
}

module.exports = {EdgeWebDriverInstaller};
