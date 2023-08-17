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
const VERSION_DATA_URL = 'https://googlechromelabs.github.io/chrome-for-testing/latest-versions-per-milestone-with-downloads.json';
// Chrome distribution changed in version 115.
const NEW_CHROME_DISTRIBUTION_VERSION = 115;

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
      return await InstallerUtils.getWindowsExeVersion('chrome.exe');
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
    const idealMajorVersion = parseInt(browserVersion.split('.')[0], 10);

    if (idealMajorVersion < NEW_CHROME_DISTRIBUTION_VERSION) {
      return await InstallerUtils.fetchVersionUrl(
          `${CDN_URL}/LATEST_RELEASE_${idealMajorVersion}`);
    } else {
      const data = await this.getVersionData_();

      // Fall back on the major version if necessary.
      // We haven't seen this become necessary yet since the new distribution
      // mechanism debuted, but better safe than sorry.
      let majorVersion = idealMajorVersion;
      while (majorVersion >= NEW_CHROME_DISTRIBUTION_VERSION) {
        if (majorVersion in data['milestones']) {
          return data['milestones'][majorVersion]['version'];
        }
        majorVersion -= 1;
      }

      throw new Error(`Unable to locate chromedriver ${idealMajorVersion}!`);
    }
  }

  /**
   * @param {string} driverVersion
   * @param {string} outputDirectory
   * @return {!Promise}
   */
  async install(driverVersion, outputDirectory) {
    const majorVersion = parseInt(driverVersion.split('.')[0], 10);

    if (majorVersion < NEW_CHROME_DISTRIBUTION_VERSION) {
      await this.installOld_(driverVersion, outputDirectory);
    } else {
      await this.installNew_(majorVersion, driverVersion, outputDirectory);
    }
  }

  /**
   * @param {string} driverVersion
   * @param {string} outputDirectory
   * @return {!Promise}
   */
  async installOld_(driverVersion, outputDirectory) {
    let platform;

    if (os.platform() == 'linux') {
      platform = 'linux64';
    } else if (os.platform() == 'darwin') {
      if (process.arch == 'arm64') {
        platform = 'mac_arm64';
      } else {
        platform = 'mac64';
      }
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

  /**
   * @param {number} majorVersion
   * @param {string} driverVersion
   * @param {string} outputDirectory
   * @return {!Promise}
   */
  async installNew_(majorVersion, driverVersion, outputDirectory) {
    let platform;

    if (os.platform() == 'linux') {
      platform = 'linux64';
    } else if (os.platform() == 'darwin') {
      if (process.arch == 'arm64') {
        platform = 'mac-arm64';
      } else {
        platform = 'mac-x64';
      }
    } else if (os.platform() == 'win32') {
      platform = 'win64';
    } else {
      throw new Error(`Unrecognized platform: ${os.platform()}`);
    }

    let binaryName = `chromedriver-${platform}/chromedriver`;
    if (os.platform() == 'win32') {
      binaryName += '.exe';
    }

    let outputName = this.getDriverName();
    if (os.platform() == 'win32') {
      outputName += '.exe';
    }

    const data = await this.getVersionData_();
    const downloads = data['milestones'][majorVersion]['downloads']['chromedriver'];

    let archiveUrl;
    for (const download of downloads) {
      if (download['platform'] == platform) {
        archiveUrl = download['url'];
        break;
      }
    }

    if (!archiveUrl) {
      throw new Error(
          `Unable to locate chromedriver ${majorVersion} for ${platform}!`);
    }

    return await InstallerUtils.installBinary(
        archiveUrl, binaryName, outputName,
        outputDirectory, /* isZip= */ true);
  }

  /**
   * @return {!Object}
   * @private
   */
  async getVersionData_() {
    if (!this.versionDataCache_) {
      const response = await InstallerUtils.fetchUrl(VERSION_DATA_URL);
      this.versionDataCache_ = await response.json();
    }

    return this.versionDataCache_;
  }
}

module.exports = {ChromeWebDriverInstaller};
