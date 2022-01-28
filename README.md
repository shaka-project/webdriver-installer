# WebDriver Installer for NodeJS

Install the right WebDriver version for your local browsers, automatically.

This tool will check the versions of your local browsers, determine the correct
version of each corresponding WebDriver binary, and download and install the
driver binaries automatically.

It can be run as a command-line tool, or as a Node module.


## Installation

To install the tool globally for CLI usage:

```sh
npm install -g webdriver-installer
```


## CLI Usage

Here's an example of CLI usage:

```sh
webdriver-installer /path/to/webdriver-binaries/
```


## Module Usage

```js
const {installWebDrivers} = require('webdriver-installer');

async function foo() {
  const withLogging = true;
  await installWebDrivers('/path/to/webdriver-binaries/', withLogging);
}
```
