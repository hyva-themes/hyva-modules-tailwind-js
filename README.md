# Hyvä Themes Tailwind Utilities

[![Go to hyva.io](https://img.shields.io/badge/hyva.io-0A23B9?style=for-the-badge)](https://hyva.io)
[![CI](https://img.shields.io/github/actions/workflow/status/hyva-themes/hyva-modules-tailwind-js/test.yml?label=&branch=main&logo=github&labelColor=2b1c2c&style=for-the-badge)](https://github.com/hyva-themes/hyva-modules-tailwind-js/actions)
[![Version](https://img.shields.io/npm/v/%40hyva-themes%2Fhyva-modules?label=&logo=npm&color=0A23B9&labelColor=2b1c2c&style=for-the-badge)](https://www.npmjs.com/package/@hyva-themes/hyva-modules)
[![License](https://img.shields.io/github/license/hyva-themes/hyva-modules-tailwind-js?color=004d32&labelColor=2b1c2c&style=for-the-badge)](https://github.com/hyva-themes/hyva-modules-tailwind-js/blob/main/LICENSE.txt)

This NPM package is meant to be used with an installation of Hyvä.
If you're not sure what Hyvä is, please check out [hyva.io](https://www.hyva.io/) to learn more.

It provides Node commands and CSS defaults for Tailwind CSS v4,
and keeps the helper functions for Tailwind CSS v3 for backwards compatibility.

## Installation

> [!NOTE]
> If you are using Hyvä 1.1.14 or newer, this package is already included in your `package.json` file by default.

You can install `hyva-modules` via `npm` or other Node-based package managers like `pnpm`:

```sh
npm install @hyva-themes/hyva-modules
```

## Node Commands

Tailwind v4 no longer has a JavaScript configuration, so these commands generate CSS instead.
They don't rely on any Tailwind CSS or PostCSS logic, which makes them independent of the bundler or compiler you use.

Every command is configured through a `hyva.config.json` next to your theme's `package.json`,
and prints nothing when everything worked, only warnings and errors.

| Command | Output | Documentation |
| --- | --- | --- |
| `hyva-init` | `hyva.config.json` | [below](#hyva-init) |
| `hyva-sources` | `generated/hyva-source.css` | [below](#hyva-sources) |
| `hyva-tokens` | `generated/hyva-tokens.css` | [docs/tokens.md](https://github.com/hyva-themes/hyva-modules-tailwind-js/blob/main/docs/tokens.md) |
| `hyva-fonts` | `generated/hyva-fonts.css` and `web/fonts/generated` | [docs/fonts.md](https://github.com/hyva-themes/hyva-modules-tailwind-js/blob/main/docs/fonts.md) |

### `hyva-init`

This command creates a `hyva.config.json` in the theme folder next to `package.json`.
This file is used to configure the other `hyva-*` commands.

To run it, use: `npx hyva-init`.

### `hyva-sources`

This is the replacement for `mergeTailwindConfig` and `postcssImportHyvaModules` in Tailwind v4 projects.
This command will create a `generated/hyva-source.css` in your project based on the Hyvä-compatible modules.

To run it, use: `npx hyva-sources`.

This uses the same `app/etc/hyva-themes.json` file as `mergeTailwindConfig` and `postcssImportHyvaModules`
and creates a CSS file using the Tailwind v4 syntax for importing and sourcing the module files.

The command is not limited to Hyvä-compatible modules, you can include extra paths as well.
For example, you don't need to include the parent theme manually; you can let this command handle that for you.
Modules you don't want are excluded in the same config:

```json
{
    "tailwind": {
        "include": [
            { "src": "app/code/Acme/hyva-module" },
            { "src": "vendor/hyva-themes/magento2-default-theme" }
        ],
        "exclude": [
            { "src": "vendor/hyva-themes/magento2-hyva-checkout/src" }
        ]
    }
}
```

| Key | Default | Description |
| --- | --- | --- |
| `include` | `[]` | Extra paths to import and source, each as `{ "src": "..." }`. |
| `exclude` | `[]` | Modules to skip, each as `{ "src": "..." }`. Add `"keepSource": true` to keep its `@source` for class scanning while skipping its CSS imports. |
| `area` | `frontend` | The `view` area module CSS is resolved from, for example `adminhtml` for an admin theme. |
| `includeExternalModules` | `true` | Include the modules from `hyva-themes.json`. Set to `false` to use only `include`. |

### `hyva-tokens`

Generates Tailwind theme variables from a design token file, a Figma or Google Stitch export,
or values written directly in `hyva.config.json`.

```json
{
    "tokens": {
        "src": "acme.figma-tokens.json",
        "format": "figma"
    }
}
```

See [docs/tokens.md](https://github.com/hyva-themes/hyva-modules-tailwind-js/blob/main/docs/tokens.md) for all options.

### `hyva-fonts`

Self hosts the fonts of your theme. Fonts are fetched from `fontsource`, `google-fonts`, `bunny-fonts`
or `fontshare`, or taken from the theme itself, and exposed as Tailwind font utilities.

```json
{
    "fonts": [
        {
            "name": "Roboto",
            "cssVariable": "--font-roboto",
            "weights": ["300", "700"]
        }
    ]
}
```

It also generates metric adjusted fallback fonts and a preload snippet,
and a repeat build makes no network requests.
See [docs/fonts.md](https://github.com/hyva-themes/hyva-modules-tailwind-js/blob/main/docs/fonts.md) for all options.

## CSS Defaults

Optional CSS modules with default styling for common HTML elements,
serving as lightweight alternatives to the official Tailwind CSS plugins.

```css
/* Import all modules at once */
@import "@hyva-themes/hyva-modules/css";
```

| Module | Provides |
| --- | --- |
| `theme.css` | A default color palette, used until your own design tokens are generated. |
| `prose.css` | Typography for long form content, an alternative to `@tailwindcss/typography`. |
| `forms.css` | Basic form element styles, an alternative to `@tailwindcss/forms`. |
| `validation.css` | Error styles for invalid fields, and utilities for their messages. |
| `progress.css` | A consistent `<progress>` element across browsers. |
| `fallback.css` | Tailwind v2 and v3 utilities that were removed in v4. |

Each module can also be imported on its own, such as `@hyva-themes/hyva-modules/css/prose.css`.
See [docs/css.md](https://github.com/hyva-themes/hyva-modules-tailwind-js/blob/main/docs/css.md) for the variables and options of every module.

## Tailwind v3

These helpers are for **Tailwind v2** and **v3** projects.
If you are on Tailwind v4, use `hyva-sources` and `hyva-tokens` instead.

| Function | Purpose |
| --- | --- |
| `mergeTailwindConfig` | Merges the Tailwind config of Hyvä-compatible modules into your theme's `tailwind.config.js`. |
| `postcssImportHyvaModules` | The PostCSS counterpart, importing the CSS of those modules. |
| `twVar` and `twProps` | Backs Tailwind config values with CSS variables. |

See [docs/tailwind-v3.md](https://github.com/hyva-themes/hyva-modules-tailwind-js/blob/main/docs/tailwind-v3.md) for usage.

## License

This package is licensed under the **Open Software License (OSL 3.0)**.

* **Copyright:** Copyright © 2020-present Hyvä Themes. All rights reserved.
* **License Text (OSL 3.0):** The full text of the OSL 3.0 license can be found in the `LICENSE.txt` file within this package, and is also available online at [http://opensource.org/licenses/osl-3.0.php](http://opensource.org/licenses/osl-3.0.php).
