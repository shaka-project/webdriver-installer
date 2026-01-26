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

  /**
   * Get installed Opera browser version.
   * Handles macOS, Linux (including Snap), and Windows.
   */
  async getInstalledBrowserVersion() {
    if (os.platform() === 'darwin') {
      // Try common macOS bundle names
      return (
        await InstallerUtils.getMacAppVersion('Opera') ||
        await InstallerUtils.getMacAppVersion('Opera Stable')
      );
    }

    if (os.platform() === 'linux') {
      // Try Snap installation first
      let version = await InstallerUtils.getCommandOutputOrNullIfMissing(
        ['/snap/bin/opera', '--version']
      );
      if (!version) {
        // Fallback to PATH
        version = await InstallerUtils.getCommandOutputOrNullIfMissing(
          ['opera', '--version']
        );
      }
      // return only version number
      return version ? version.trim().split(' ')[0] : null;
    }

    if (os.platform() === 'win32') {
      // Try standard paths
      const possiblePaths = [
        'C:\\Program Files\\Opera\\opera.exe',
        'C:\\Program Files (x86)\\Opera\\opera.exe',
        'C:\\Users\\' + os.userInfo().username + '\\AppData\\Local\\Programs\\Opera\\opera.exe',
      ];

      for (const exePath of possiblePaths) {
        const version = await InstallerUtils.getWindowsExeVersion(exePath);
        if (version) {
          return version;
        }
      }

      // Fallback to PATH
      return await InstallerUtils.getWindowsExeVersion('opera.exe');
    }

    throw new Error(`Unsupported platform: ${os.platform()}`);
  }

  /**
   * Get installed OperaDriver version from output directory.
   */
  async getInstalledDriverVersion(outputDirectory) {
    let outputPath = path.join(outputDirectory, this.getDriverName());
    if (os.platform() === 'win32') {
      outputPath += '.exe';
    }

    const output = await InstallerUtils.getCommandOutputOrNullIfMissing(
      [outputPath, '--version']
    );
    // Example: "operadriver 114.0.5735.90 (...)"
    return output ? output.trim().split(' ')[1] : null;
  }

  /**
   * Always fetch the latest OperaDriver release from GitHub.
   * This avoids 404 errors if the installed Opera version
   * does not have a matching driver.
   */
  async getBestDriverVersion(_browserVersion) {
    const tag = await InstallerUtils.fetchLatestGitHubTag(
      'operasoftware/operachromiumdriver'
    );

    // tag example: "v114.0.5735.90"
    return tag.replace(/^v\.?/, '');
  }

  /**
   * Install the OperaDriver binary for the current platform.
   */
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
      `v.${driverVersion}/operadriver_${platform}.zip`;

    // IMPORTANT: operadriver is inside a folder in the zip
    const nameInArchive = `operadriver_${platform}/${binaryName}`;

    let outputName = this.getDriverName();
    if (os.platform() === 'win32') {
      outputName += '.exe';
    }

    // Install binary from network archive
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
