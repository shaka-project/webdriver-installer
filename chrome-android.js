/*! @license
 * WebDriver Installer
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const {ChromeWebDriverInstaller} = require('./chrome.js');
const {InstallerUtils} = require('./utils.js');

/**
 * An installer for chromedriver for Chrome on Android.
 */
class ChromeAndroidWebDriverInstaller extends ChromeWebDriverInstaller {
  /** @return {string} */
  getBrowserName() {
    return 'Chrome on Android';
  }

  /** @return {string} */
  getDriverName() {
    return 'chromedriver-android';
  }

  /** @return {!Promise<?string>} */
  async getInstalledBrowserVersion() {
    return await InstallerUtils.getAndroidAppVersion('com.android.chrome');
  }
}

module.exports = {ChromeAndroidWebDriverInstaller};
