#!/usr/bin/env node
/*! @license
 * WebDriver Installer
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const {ChromeWebDriverInstaller} = require('./chrome.js');
const {ChromeAndroidWebDriverInstaller} = require('./chrome-android.js');
const {FirefoxWebDriverInstaller} = require('./firefox.js');
const {EdgeWebDriverInstaller} = require('./edge.js');

const INSTALLER_CLASSES = [
  ChromeWebDriverInstaller,
  ChromeAndroidWebDriverInstaller,
  FirefoxWebDriverInstaller,
  EdgeWebDriverInstaller,
];

/**
 * Install drivers to match all detected browsers.
 *
 * @param {string=} outputDirectory  Defaults to ./
 * @param {boolean=} logging
 * @return {!Promise}
 */
async function main(outputDirectory='.', logging=true) {
  if (logging) {
    console.log(`Installing binaries to ${outputDirectory}`);
  }

  for (const InstallerClass of INSTALLER_CLASSES) {
    const installer = new InstallerClass();
    const browserName = installer.getBrowserName();
    const driverName = installer.getDriverName();
    const browserVersion = await installer.getInstalledBrowserVersion();

    if (browserVersion == null) {
      if (logging) {
        console.log(`${browserName} not found.`);
      }
    } else {
      const installedDriverVersion =
          await installer.getInstalledDriverVersion(outputDirectory);
      const bestDriverVersion =
          await installer.getBestDriverVersion(browserVersion);

      if (installedDriverVersion == bestDriverVersion) {
        if (logging) {
          console.log(
              `Version ${installedDriverVersion} of ${driverName} already` +
              ` installed for ${browserName} version ${browserVersion}`);
        }
      } else {
        await installer.install(bestDriverVersion, outputDirectory);
        if (logging) {
          console.log(
              `Installed version ${bestDriverVersion} of ${driverName}` +
              ` for ${browserName} version ${browserVersion}`);
        }
      }
    }
  }
}

if (require.main == module) {
  // Skip argv[0], which is node, and argv[1], which is this script name.
  const args = process.argv.slice(2);

  const HELP_ARGS = ['--help', '-h', '-?'];
  if (args.length > 1 || HELP_ARGS.includes(args[0])) {
    process.stderr.write(`Usage: ${process.argv[1]} [OUTPUT_DIR]\n`);
    process.exit(1);
  }

  (async () => {
    try {
      await main(args[0]);
      process.exit(0);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  })();
} else {
  module.exports = {installWebDrivers: main};
}
