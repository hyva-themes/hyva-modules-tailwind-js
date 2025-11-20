# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

[unreleased]: https://github.com/hyva-themes/hyva-modules-tailwind-js/compare/1.2.3...HEAD

## [1.2.3] - 2025-11-20

[1.2.3]: https://github.com/hyva-themes/hyva-modules-tailwind-js/compare/1.2.2...1.2.3

### Fixed

- Missing import in the `util/file.js` (thanks to @julien-desiage)

## [1.2.2] - 2025-10-16

[1.2.2]: https://github.com/hyva-themes/hyva-modules-tailwind-js/compare/1.2.1...1.2.2

### Changed

- Make the prose table color not specific to a config, use browser colors by default

### Fixed

- Encode issue for radio icon

## [1.2.1] - 2025-10-15

[1.2.1]: https://github.com/hyva-themes/hyva-modules-tailwind-js/compare/1.2.0...1.2.1

### Fixed

- Missing folder in package list

## [1.2.0] - 2025-10-15

[1.2.0]: https://github.com/hyva-themes/hyva-modules-tailwind-js/compare/1.1.1...1.2.1

### Added

- Added a lightweight, customizable `prose` utility, serving as a minimal alternative to the official `@tailwindcss/typography` plugin.
- Included a lightweight `forms` stylesheet, providing an alternative to the `@tailwindcss/forms` plugin with a smaller footprint.
- Introduced fallback CSS for Tailwind v2/v3 utilities to ensure backward compatibility with older modules when migrating to Tailwind v4.

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

