# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

[unreleased]: https://github.com/hyva-themes/hyva-modules-tailwind-js/compare/1.1.1...HEAD

## [1.1.1] - 2025-08-29

[1.1.1]: https://github.com/hyva-themes/hyva-modules-tailwind-js/compare/1.1.0...1.1.1

### Fixed

- Token format, to default instead of Figma, this allows the use of simple tokens without using the format option

## [1.1.0] - 2025-08-29

[1.1.0]: https://github.com/hyva-themes/hyva-modules-tailwind-js/compare/1.0.11...1.1.0

### Added

- Support for ESM syntax
- Added new Node command `hyva-init`, creating a initial config file.
- Added new Node command `hyva-tokens`, for building Tailwind Tokens based on a Design Tokens file.
- Added new Node command `hyva-source`, for building Tailwind v4 sources for each Hyva compatible module.

### Changed

- Bumped minimal Node version to version 20 to match the Tailwind v4 version

## [1.0.11] - 2025-02-18

[1.0.11]: https://github.com/hyva-themes/hyva-modules-tailwind-js/compare/1.0.10...1.0.11

### Fixed

- Throw an error when building TailwindCSS without a hyva-themes.json file

## [1.0.10] - 2024-10-18

[1.0.10]: https://github.com/hyva-themes/hyva-modules-tailwind-js/compare/1.0.9...1.0.10

### Fixed
The 1.0.9 tag was on the wrong commit. Release 1.0.10 should reference the correct code version.


## [1.0.9] - 2024-10-18

[1.0.9]: https://github.com/hyva-themes/hyva-modules-tailwind-js/compare/1.0.8...1.0.9

### Added

- New functions `twVar()` and `twProps()`, for using CSS variables in TailwindCSS

## [1.0.8] - 2023-04-15

[1.0.8]: https://github.com/hyva-themes/hyva-modules-tailwind-js/compare/1.0.7...1.0.8

### Fixed

- Dynamically determining basePath (thanks to @thijsdewitt)

## [1.0.7] - 2023-04-15

[1.0.7]: https://github.com/hyva-themes/hyva-modules-tailwind-js/compare/1.0.6...1.0.7

### Added

- `excludeDirs` argument to `postcssImportHyvaModules()` function (thanks to @grimlink)

## [1.0.6] - 2023-04-15

[1.0.6]: https://github.com/hyva-themes/hyva-modules-tailwind-js/compare/1.0.1...1.0.6

Fixes and updates

## 1.0.0 - 2022-04-15

Initial Release 🎉

