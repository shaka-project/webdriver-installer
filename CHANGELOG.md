# Changelog

## [1.2.0](https://github.com/shaka-project/webdriver-installer/compare/v1.1.11...v1.2.0) (2025-03-13)


### Features

* Add MS Edge support on Linux and Mac ([59505f4](https://github.com/shaka-project/webdriver-installer/commit/59505f49b94030c63377d72e2b4639093915ab3d))
* Make logging optional, export main ([1d7bb17](https://github.com/shaka-project/webdriver-installer/commit/1d7bb1755725a50b9c5a423c55402f6a84503919))


### Bug Fixes

* Choose platform-specific msedgedriver version ([#8](https://github.com/shaka-project/webdriver-installer/issues/8)) ([2e0e859](https://github.com/shaka-project/webdriver-installer/commit/2e0e8598f878c0c3fcd8ed55d4e830da398a891b))
* Fix Chromedriver download for version 115+ ([#28](https://github.com/shaka-project/webdriver-installer/issues/28)) ([1d17e40](https://github.com/shaka-project/webdriver-installer/commit/1d17e40c70be980067f4972d538ddb55db88c759))
* Fix CLI installation ([2f6b649](https://github.com/shaka-project/webdriver-installer/commit/2f6b649033312f778795b1372abfc0a175d70e61))
* Fix execution in node v12 ([9b06017](https://github.com/shaka-project/webdriver-installer/commit/9b06017b7c83ebfea1e600d7f667b2810ab05b5f))
* Fix failure to query registry for Firefox ([ce12f34](https://github.com/shaka-project/webdriver-installer/commit/ce12f347f96406cc1f0a219c4c44cd2a9b827254))
* Fix Firefox macOS hang ([#48](https://github.com/shaka-project/webdriver-installer/issues/48)) ([79bb757](https://github.com/shaka-project/webdriver-installer/commit/79bb757ada95351adfcea76ce1ab21e37d2f0cce)), closes [#47](https://github.com/shaka-project/webdriver-installer/issues/47)
* Fix GitHub API rate limit issues getting geckodriver release ([074beb7](https://github.com/shaka-project/webdriver-installer/commit/074beb79adf7d9807ab57b67c9edd26d9451270e))
* Fix msedgedriver version detection ([#20](https://github.com/shaka-project/webdriver-installer/issues/20)) ([3838b88](https://github.com/shaka-project/webdriver-installer/commit/3838b889772e2a0ce7167e9220969b25714f0d03))
* Fix unlinking existing binaries ([#12](https://github.com/shaka-project/webdriver-installer/issues/12)) ([8a43765](https://github.com/shaka-project/webdriver-installer/commit/8a43765b54fbbf164762f7a8edf52520b4d08059))
* Get the correct binary for Edge on M1 macs ([#30](https://github.com/shaka-project/webdriver-installer/issues/30)) ([b5303ea](https://github.com/shaka-project/webdriver-installer/commit/b5303ea26653cee24a122208a1e7088021a77ebe))
* Get the correct binary for Firefox on M1 macs ([#31](https://github.com/shaka-project/webdriver-installer/issues/31)) ([f0e5a7c](https://github.com/shaka-project/webdriver-installer/commit/f0e5a7cc8d7ccc8f367bcf9386c383645e16eb3d))
* Ignore errors executing non-executable drivers ([#23](https://github.com/shaka-project/webdriver-installer/issues/23)) ([07c8644](https://github.com/shaka-project/webdriver-installer/commit/07c864446e68e6f8714c3d1a899b42b2d0931aae)), closes [#22](https://github.com/shaka-project/webdriver-installer/issues/22)
* Improved error logging for CLI ([b588638](https://github.com/shaka-project/webdriver-installer/commit/b588638774526d621983e0b497aa85ab217fcc46))
* Make installation process error-resilient ([#45](https://github.com/shaka-project/webdriver-installer/issues/45)) ([b70732b](https://github.com/shaka-project/webdriver-installer/commit/b70732b1f6cfab0718cca742b5c0e61899dfd752))
* Make Windows browser version queries more robust ([85f3b27](https://github.com/shaka-project/webdriver-installer/commit/85f3b2796e06e1a0f2171b46beef73f6a0407ecb))
* Retry when WebDriver updates are not available yet ([#24](https://github.com/shaka-project/webdriver-installer/issues/24)) ([e0312c8](https://github.com/shaka-project/webdriver-installer/commit/e0312c89eab70bbb7241298846dff93e4a690753))
* Revert EdgeDriver 115+ workaround ([#35](https://github.com/shaka-project/webdriver-installer/issues/35)) ([6df9bc2](https://github.com/shaka-project/webdriver-installer/commit/6df9bc2ba996a022361a299d511b99e1ea815b79))
* Work around failure to launch Edge on Linux ([#32](https://github.com/shaka-project/webdriver-installer/issues/32)) ([ce45a24](https://github.com/shaka-project/webdriver-installer/commit/ce45a243e2d4e63ef32992607a1228d2b079d960))

## [1.1.11](https://github.com/shaka-project/webdriver-installer/compare/v1.1.10...v1.1.11) (2025-03-13)


### Bug Fixes

* Fix Firefox macOS hang ([#48](https://github.com/shaka-project/webdriver-installer/issues/48)) ([79bb757](https://github.com/shaka-project/webdriver-installer/commit/79bb757ada95351adfcea76ce1ab21e37d2f0cce)), closes [#47](https://github.com/shaka-project/webdriver-installer/issues/47)

## [1.1.10](https://github.com/shaka-project/webdriver-installer/compare/v1.1.9...v1.1.10) (2025-02-19)


### Bug Fixes

* Make installation process error-resilient ([#45](https://github.com/shaka-project/webdriver-installer/issues/45)) ([b70732b](https://github.com/shaka-project/webdriver-installer/commit/b70732b1f6cfab0718cca742b5c0e61899dfd752))

## [1.1.9](https://github.com/shaka-project/webdriver-installer/compare/v1.1.8...v1.1.9) (2023-09-07)


### Bug Fixes

* Revert EdgeDriver 115+ workaround ([#35](https://github.com/shaka-project/webdriver-installer/issues/35)) ([6df9bc2](https://github.com/shaka-project/webdriver-installer/commit/6df9bc2ba996a022361a299d511b99e1ea815b79))

## [1.1.8](https://github.com/shaka-project/webdriver-installer/compare/v1.1.7...v1.1.8) (2023-08-18)


### Bug Fixes

* Get the correct binary for Firefox on M1 macs ([#31](https://github.com/shaka-project/webdriver-installer/issues/31)) ([f0e5a7c](https://github.com/shaka-project/webdriver-installer/commit/f0e5a7cc8d7ccc8f367bcf9386c383645e16eb3d))
* Work around failure to launch Edge on Linux ([#32](https://github.com/shaka-project/webdriver-installer/issues/32)) ([ce45a24](https://github.com/shaka-project/webdriver-installer/commit/ce45a243e2d4e63ef32992607a1228d2b079d960))

## [1.1.7](https://github.com/shaka-project/webdriver-installer/compare/v1.1.6...v1.1.7) (2023-08-17)


### Bug Fixes

* Fix Chromedriver download for version 115+ ([#28](https://github.com/shaka-project/webdriver-installer/issues/28)) ([1d17e40](https://github.com/shaka-project/webdriver-installer/commit/1d17e40c70be980067f4972d538ddb55db88c759))
* Get the correct binary for Edge on M1 macs ([#30](https://github.com/shaka-project/webdriver-installer/issues/30)) ([b5303ea](https://github.com/shaka-project/webdriver-installer/commit/b5303ea26653cee24a122208a1e7088021a77ebe))

## [1.1.6](https://github.com/shaka-project/webdriver-installer/compare/v1.1.5...v1.1.6) (2023-07-19)


### Bug Fixes

* Ignore errors executing non-executable drivers ([#23](https://github.com/shaka-project/webdriver-installer/issues/23)) ([07c8644](https://github.com/shaka-project/webdriver-installer/commit/07c864446e68e6f8714c3d1a899b42b2d0931aae)), closes [#22](https://github.com/shaka-project/webdriver-installer/issues/22)
* Retry when WebDriver updates are not available yet ([#24](https://github.com/shaka-project/webdriver-installer/issues/24)) ([e0312c8](https://github.com/shaka-project/webdriver-installer/commit/e0312c89eab70bbb7241298846dff93e4a690753))

## [1.1.5](https://github.com/shaka-project/webdriver-installer/compare/v1.1.4...v1.1.5) (2022-12-14)


### Bug Fixes

* Fix msedgedriver version detection ([#20](https://github.com/shaka-project/webdriver-installer/issues/20)) ([3838b88](https://github.com/shaka-project/webdriver-installer/commit/3838b889772e2a0ce7167e9220969b25714f0d03))

### [1.1.4](https://github.com/shaka-project/webdriver-installer/compare/v1.1.3...v1.1.4) (2022-02-17)


### Bug Fixes

* Fix unlinking existing binaries ([#12](https://github.com/shaka-project/webdriver-installer/issues/12)) ([8a43765](https://github.com/shaka-project/webdriver-installer/commit/8a43765b54fbbf164762f7a8edf52520b4d08059))

### [1.1.3](https://github.com/shaka-project/webdriver-installer/compare/v1.1.2...v1.1.3) (2022-02-11)


### Bug Fixes

* Choose platform-specific msedgedriver version ([#8](https://github.com/shaka-project/webdriver-installer/issues/8)) ([2e0e859](https://github.com/shaka-project/webdriver-installer/commit/2e0e8598f878c0c3fcd8ed55d4e830da398a891b))


### [1.1.2](https://github.com/shaka-project/webdriver-installer/compare/v1.1.1...v1.1.2) (2022-02-03)


### Bug Fixes

* Fix CLI installation ([2f6b649](https://github.com/shaka-project/webdriver-installer/commit/2f6b649033312f778795b1372abfc0a175d70e61))

### [1.1.1](https://github.com/shaka-project/webdriver-installer/compare/v1.1.0...v1.1.1) (2022-02-03)


### Bug Fixes

* Make Windows browser version queries more robust ([85f3b27](https://github.com/shaka-project/webdriver-installer/commit/85f3b2796e06e1a0f2171b46beef73f6a0407ecb))

## [1.1.0](https://github.com/shaka-project/webdriver-installer/compare/v1.0.1...v1.1.0) (2022-02-03)


### Features

* Add MS Edge support on Linux and Mac ([59505f4](https://github.com/shaka-project/webdriver-installer/commit/59505f49b94030c63377d72e2b4639093915ab3d))


### Bug Fixes

* Fix GitHub API rate limit issues getting geckodriver release ([074beb7](https://github.com/shaka-project/webdriver-installer/commit/074beb79adf7d9807ab57b67c9edd26d9451270e))

## [1.0.1](https://github.com/shaka-project/webdriver-installer/compare/v1.0.0...v1.0.1) (2022-02-02)


### Bug Fixes

* Fix execution in node v12 ([9b06017](https://github.com/shaka-project/webdriver-installer/commit/9b06017b7c83ebfea1e600d7f667b2810ab05b5f))
* Fix failure to query registry for Firefox ([ce12f34](https://github.com/shaka-project/webdriver-installer/commit/ce12f347f96406cc1f0a219c4c44cd2a9b827254))
* Improved error logging for CLI ([b588638](https://github.com/shaka-project/webdriver-installer/commit/b588638774526d621983e0b497aa85ab217fcc46))


## [1.0.0](https://github.com/shaka-project/webdriver-installer/commits/v1.0.0) (2022-01-27)


### Features

* Support for Chrome, Chrome-android, Firefox, and Edge ([5f4cc57](https://github.com/shaka-project/webdriver-installer/commit/5f4cc578a8b911d5a6da26e46e9bf0fb95580606))
* Make logging optional, export main ([1d7bb17](https://github.com/shaka-project/webdriver-installer/commit/1d7bb1755725a50b9c5a423c55402f6a84503919))
