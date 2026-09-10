# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

-   Added `hyva-fonts`, a command that self hosts the fonts declared in the
    new `fonts` array of `hyva.config.json`.

    It generates `generated/hyva-fonts.css` with the `@font-face` rules and a
    `@theme` block exposing each family as a CSS variable, and downloads the
    font files into `web/fonts/generated`.

    Five providers are supported. `fontsource`, `google-fonts`, `bunny-fonts`
    and `fontshare` fetch `woff2` files, `local` uses font files you already
    have in `web/fonts`. They all take the same options, so switching between
    them only means changing `provider`.

    `fontsource` is the default, since it is built for self hosting, covers
    everything on Google Fonts, and publishes a catalogue that lets a wrong
    weight, style or subset be reported before anything is downloaded.

    Variable fonts are collapsed into a single `@font-face` per subset and
    style, so requesting several weights does not download the same file
    more than once.

    A family whose font files are already present, and whose config has not
    changed, is rebuilt from a `web/fonts/generated/hyva-fonts.json` manifest
    without contacting its provider, so a normal build makes no network
    requests and works offline.

    Only the `latin` subset is downloaded by default, matching the choice
    Fontsource itself makes. Ask for `subsets` explicitly to get more.

    A family can declare its CSS variable outside `@theme` with `cssSelector`,
    which both keeps it out of Tailwind's theme tree shaking and lets it feed
    a variable another stylesheet already expects, such as the `--h-family`
    of the `prose` module. Without it, a family follows `tokens.cssSelector`
    if the theme set one, and `@theme` otherwise.

    A family marked with `preload` is listed in a generated
    `web/fonts/generated/hyva-fonts-preload.xml`, a layout snippet to copy into
    the theme's `Magento_Theme/layout/default_head_blocks.xml`.

    That snippet carries a pair of `hyva-fonts` comments. Keep them, and the
    command rewrites the region between them on every run, so the preload
    hints stay in step with the configured fonts. The comments are the opt in,
    nothing outside them is ever touched, and a theme without them is left
    alone.

    An empty `generated/hyva-fonts.css` is written when no fonts are
    configured, so the import can be added up front and keeps working after
    the last font is removed.

    A provider that cannot be reached falls back to the font files already on
    disk. A family with neither is skipped with a warning, keeping its CSS
    variable so text falls back to the next font in the stack, and the rest of
    the stylesheet is still generated. Pass `--strict` to exit with an error
    on a warning instead.

## [1.4.0] - 2026-07-09

### Added

-   Added support for pointing `tokens.src` at a Google Stitch Markdown
    export instead of a JSON file.

    Only the YAML frontmatter is used, and the `colors` group is renamed
    to the singular `color` automatically, matching Hyvä's convention.

-   Added `stripPrefix` and `rename` options to the `tokens` config in
    `hyva.config.json`, to unwrap a wrapping key path and align group
    naming without needing a custom build step.

-   Added a default `theme.css`, providing a fallback design-token palette

    (`primary`, `secondary`, `background`, `surface`, `ink`, `ink-muted`) for themes that don't define their own.

    Colors are defined in `oklch`.
    `lighter`/`darker` styles are derived via `color-mix()` from the base color, so overriding `--color-primary`/`--color-secondary` keeps the tints in sync automatically.

- Added `DESIGN.md`, an example design-token file demonstrating the Hyvä/Tailwind naming convention for a project's own design tokens.

### Changed

-   Bumped `@fylgja/props-builder` to `^2.2.0`.

    Figma-syntax token conversion no longer auto-unwraps every
    structural group at every nesting level, since this sometimes
    removed too much in real-world token files. A top-level `other`
    group and a redundant nested color group are still handled
    automatically; use the `stripPrefix`/`rename` options above to
    unwrap anything else explicitly.

-   Renamed the `fg`/`fg-secondary` color tokens to `ink`/`ink-muted`,
    fixing a naming inconsistency in favor of a clearer design-token syntax.

    `ink` pairs naturally with `surface` (the ink sits on a surface), rather than standing alone as an unrelated abbreviation.

## [1.3.0] - 2026-03-02

### Added

-   Added `area` option to `hyva.config.json` tailwind config.

    Allows customization of the Magento view area used when resolving module CSS paths (defaults to `frontend`, e.g. set to `adminhtml` for admin themes).

-   Added `includeExternalModules` option to `hyva.config.json` tailwind config.

    Allows the auto-inclusion of external modules from `hyva-themes.json` to be disabled.

-   Added `keepSource` flag to `exclude` entries in `hyva.config.json`.

    Allows a module's `@source` statement to be preserved while its CSS imports are skipped.

-   Added Prose element modifier variants to `prose.css` (e.g. `prose-headings:`, `prose-a:`, `prose-p:`).

    Allows Tailwind utilities to be scoped to specific child elements inside a `.prose` block.

-   Added `mediaDark` option to `hyva.config.json` tokens config.

    Allows customization of the dark mode media query used when generating `hyva-tokens.css`.

- Added GitHub Actions CI workflow to run tests on push and pull requests to `main`.
- Added SECURITY.md for vulnerability reporting.

### Changed

-   The `.gitignore` wildcard check now scans up the full directory tree (up to `$HOME`) instead of only the project root.

    This means allow-list patterns in parent directories are also detected.

-   Allow form utilities to be imported separately for custom form setups.

    Improves reusability with the theme's input-group add-ons.

- `from-tokens.js` and `to-style.js` are now sourced directly from `@fylgja/props-builder` instead of maintained as local copies.
- Replaced Jest with Node.js built-in test runner (`node:test`), removing the Jest dev dependency.
- Publish workflow now requires all tests to pass before publishing to npm.

### Fixed

- Fixed an issue where invalid `hyva.config.json` files did not produce error messages.

## [1.2.4] - 2025-11-20

### Added

- Debug helper for .gitignore issues with Tailwind v4 and sources
- Debug helper for sources with a invalid path

### Fixed

- Issue when the theme value has no `src` key.

## [1.2.3] - 2025-11-20

### Fixed

- Missing import in the `util/file.js` (thanks to @julien-desiage)

## [1.2.2] - 2025-10-16

### Changed

- Make the prose table color not specific to a config, use browser colors by default

### Fixed

- Encode issue for radio icon

## [1.2.1] - 2025-10-15

### Fixed

- Missing folder in package list

## [1.2.0] - 2025-10-15

### Added

- Added a lightweight, customizable `prose` utility, serving as a minimal alternative to the official `@tailwindcss/typography` plugin.
- Included a lightweight `forms` stylesheet, providing an alternative to the `@tailwindcss/forms` plugin with a smaller footprint.
- Introduced fallback CSS for Tailwind v2/v3 utilities to ensure backward compatibility with older modules when migrating to Tailwind v4.

## [1.1.1] - 2025-08-29

### Fixed

- Token format, to default instead of Figma, this allows the use of simple tokens without using the format option

## [1.1.0] - 2025-08-29

### Added

- Support for ESM syntax
- Added new Node command `hyva-init`, creating a initial config file.
- Added new Node command `hyva-tokens`, for building Tailwind Tokens based on a Design Tokens file.
- Added new Node command `hyva-source`, for building Tailwind v4 sources for each Hyva compatible module.

### Changed

- Bumped minimal Node version to version 20 to match the Tailwind v4 version

## [1.0.11] - 2025-02-18

### Fixed

- Throw an error when building TailwindCSS without a hyva-themes.json file

## [1.0.10] - 2024-10-18

### Fixed

-   The 1.0.9 tag was on the wrong commit.

    Release 1.0.10 should reference the correct code version.


## [1.0.9] - 2024-10-18

### Added

- New functions `twVar()` and `twProps()`, for using CSS variables in TailwindCSS

## [1.0.8] - 2023-04-15

### Fixed

- Dynamically determining basePath (thanks to @thijsdewitt)

## [1.0.7] - 2023-04-15

### Added

- `excludeDirs` argument to `postcssImportHyvaModules()` function (thanks to @grimlink)

## [1.0.6] - 2023-04-15

Fixes and updates

## 1.0.0 - 2022-04-15

Initial Release 🎉

[unreleased]: https://github.com/hyva-themes/hyva-modules-tailwind-js/compare/1.4.0...HEAD
[1.4.0]: https://github.com/hyva-themes/hyva-modules-tailwind-js/compare/1.3.0...1.4.0
[1.3.0]: https://github.com/hyva-themes/hyva-modules-tailwind-js/compare/1.2.4...1.3.0
[1.2.4]: https://github.com/hyva-themes/hyva-modules-tailwind-js/compare/1.2.3...1.2.4
[1.2.3]: https://github.com/hyva-themes/hyva-modules-tailwind-js/compare/1.2.2...1.2.3
[1.2.2]: https://github.com/hyva-themes/hyva-modules-tailwind-js/compare/1.2.1...1.2.2
[1.2.1]: https://github.com/hyva-themes/hyva-modules-tailwind-js/compare/1.2.0...1.2.1
[1.2.0]: https://github.com/hyva-themes/hyva-modules-tailwind-js/compare/1.1.1...1.2.1
[1.1.1]: https://github.com/hyva-themes/hyva-modules-tailwind-js/compare/1.1.0...1.1.1
[1.1.0]: https://github.com/hyva-themes/hyva-modules-tailwind-js/compare/1.0.11...1.1.0
[1.0.11]: https://github.com/hyva-themes/hyva-modules-tailwind-js/compare/1.0.10...1.0.11
[1.0.10]: https://github.com/hyva-themes/hyva-modules-tailwind-js/compare/1.0.9...1.0.10
[1.0.9]: https://github.com/hyva-themes/hyva-modules-tailwind-js/compare/1.0.8...1.0.9
[1.0.8]: https://github.com/hyva-themes/hyva-modules-tailwind-js/compare/1.0.7...1.0.8
[1.0.7]: https://github.com/hyva-themes/hyva-modules-tailwind-js/compare/1.0.6...1.0.7
[1.0.6]: https://github.com/hyva-themes/hyva-modules-tailwind-js/compare/1.0.1...1.0.6
