# WebDriver Installer - Agent Guide

WebDriver Installer is a Node.js tool and library that detects locally
installed browsers and downloads the matching WebDriver binary for each.
See [README.md](README.md) for full details.

## Attribution

Read [AGENT-ATTRIBUTION.md](AGENT-ATTRIBUTION.md) for attribution details.

## Workflow

**Install dependencies:**
```shell
npm ci
```

**Run the installer** (installs drivers to the given directory):
```shell
node ./main.js /path/to/output/
```

There is no build step.  The project is plain JavaScript.

## Testing

There is no unit test suite. The CI workflow (`test-gha.yaml`) runs a live
integration test: it installs real browsers on Linux, macOS, and Windows
runners and verifies that the driver binaries are downloaded and functional.

To verify a change locally, run `node ./main.js` if you have browsers
installed. CI will perform more comprehensive cross-platform checks on your
PR.

## Code Style

There is no linter configured. Follow the conventions visible in the existing
code:

- 2-space indentation
- Single-quoted strings
- JSDoc comments on all exported classes and public methods
- `async`/`await` throughout; no raw Promise chains
- Static utility methods on `InstallerUtils`; browser-specific logic in
  subclasses of `WebDriverInstallerBase`

## Cross-platform Constraints

Each browser installer has separate code paths for Linux, macOS, and Windows.
Version detection, binary location, and download format all vary by browser
and OS. Do not assume that logic which works on one OS applies to another
unless you have evidence in the code. Agents run on a single OS at a time and
cannot verify cross-platform behavior in a single session -- note any
untested platforms in your PR description.

**Adding a new browser:** subclass `WebDriverInstallerBase` (see `base.js`)
and register the new class in the `INSTALLER_CLASSES` array in `main.js`.

## Directory Structure

The project is flat -- all source files are in the repository root.

```
main.js              Entry point; CLI and exported installWebDrivers() function
base.js              Abstract base class WebDriverInstallerBase
utils.js             Static utility class InstallerUtils (fetch, archive, OS helpers)
chrome.js            Chrome desktop installer
chrome-android.js    Chrome for Android installer (requires adb)
firefox.js           Firefox installer
edge.js              Microsoft Edge installer
opera.js             Opera installer
```

## Release Process

Versions and `CHANGELOG.md` are managed automatically by
[release-please](https://github.com/googleapis/release-please). Do not
manually bump the version in `package.json` or edit `CHANGELOG.md`.
