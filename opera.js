/*! @license
 * WebDriver Installer
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const {WebDriverInstallerBase} = require('./base.js');
const {InstallerUtils} = require('./utils.js');

const os = require('os');
const path = require('path');

class OperaWebDriverInstaller extends WebDriverInstallerBase {
  getBrowserName() {
    return 'Opera';
  }

  getDriverName() {
    return 'operadriver';
  }

  async getInstalledBrowserVersion() {
    if (os.platform() === 'darwin') {
      // Try common bundle names
      return (
        await InstallerUtils.getMacAppVersion('Opera') ||
        await InstallerUtils.getMacAppVersion('Opera Stable')
      );
    }

    if (os.platform() === 'linux') {
      const output = await InstallerUtils.getCommandOutputOrNullIfMissing(
        ['opera', '--version']
      );
      return output ? output.trim().split(' ')[1] : null;
    }

    if (os.platform() === 'win32') {
      return await InstallerUtils.getWindowsExeVersion('opera.exe');
    }

    throw new Error(`Unsupported platform: ${os.platform()}`);
  }

  async getInstalledDriverVersion(outputDirectory) {
    const outputPath = outputDirectory + path.sep + this.getDriverName();
    const output = await InstallerUtils.getCommandOutputOrNullIfMissing(
      [outputPath, '--version']
    );

    // Example:
    // "operadriver 114.0.5735.90 (....)"
    return output ? output.trim().split(' ')[1] : null;
  }

  async getBestDriverVersion(_browserVersion) {
    const tag = await InstallerUtils.fetchLatestGitHubTag(
      'operasoftware/operachromiumdriver'
    );

    // tag example: "v114.0.5735.90"
    return tag.replace(/^v\.?/, '');
  }

  async install(driverVersion, outputDirectory) {
    let platform;
    let binaryName = 'operadriver';

    if (os.platform() === 'linux') {
      platform = 'linux64';
    } else if (os.platform() === 'darwin') {
      platform = 'mac64';
    } else if (os.platform() === 'win32') {
      platform = 'win64';
      binaryName += '.exe';
    } else {
      throw new Error(`Unsupported platform: ${os.platform()}`);
    }

    const archiveUrl =
      `https://github.com/operasoftware/operachromiumdriver/releases/download/` +
      `v${driverVersion}/operadriver_${platform}.zip`;

    // IMPORTANT: operadriver is inside a folder in the zip
    const nameInArchive = `operadriver_${platform}/${binaryName}`;

    let outputName = this.getDriverName();
    if (os.platform() === 'win32') {
      outputName += '.exe';
    }

    return InstallerUtils.installBinary(
      archiveUrl,
      nameInArchive,
      outputName,
      outputDirectory,
      /* isZip */ true
    );
  }
}

module.exports = {OperaWebDriverInstaller};
