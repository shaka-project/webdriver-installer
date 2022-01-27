/*! @license
 * WebDriver Installer
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Throw an error if the subclass doesn't override an abstract method.
 */
function unimplemented(object, callee) {
  throw new Error(
      `Unimplemented: ${callee.name} in ${object.constructor.name}`);
}

/**
 * An abstract base class for WebDriver installers.
 */
class WebDriverInstallerBase {
  /** @return {string} */
  getBrowserName() {
    unimplemented(this, arguments.callee);
  }

  /** @return {string} */
  getDriverName() {
    unimplemented(this, arguments.callee);
  }

  /** @return {!Promise<?string>} */
  async getInstalledBrowserVersion() {
    unimplemented(this, arguments.callee);
  }

  /**
   * @param {string} outputDirectory
   * @return {!Promise<?string>}
   */
  async getInstalledDriverVersion(outputDirectory) {
    unimplemented(this, arguments.callee);
  }

  /**
   * @param {string} browserVersion
   * @return {!Promise<string>}
   */
  async getBestDriverVersion(browserVersion) {
    unimplemented(this, arguments.callee);
  }

  /**
   * @param {string} driverVersion
   * @param {string} outputDirectory
   * @return {!Promise}
   */
  async install(driverVersion, outputDirectory) {
    unimplemented(this, arguments.callee);
  }
}

module.exports = {WebDriverInstallerBase};
