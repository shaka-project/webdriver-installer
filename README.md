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


## Firefox Snap Packages on Linux

Snap packages of Firefox (the default on Ubuntu 22.04+) can't see the host's
`/tmp`, where geckodriver creates temporary Firefox profiles by default.  See
[Mozilla bug 1819377](https://bugzilla.mozilla.org/show_bug.cgi?id=1819377).

When the default Firefox is a snap, this tool installs the real driver as
`geckodriver-bin`, and installs `geckodriver` as a small wrapper script that
points geckodriver's temporary directory at `~/snap/firefox/common/`, which the
snap can access.  An explicit `--profile-root` argument to geckodriver still
takes precedence.
