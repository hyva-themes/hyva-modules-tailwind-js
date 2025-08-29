# Hyvä Themes Tailwind Utilities

[![Go to hyva.io](https://img.shields.io/badge/hyva.io-0A23B9?style=for-the-badge)](https://hyva.io)
[![NPM Version](https://img.shields.io/npm/v/%40hyva-themes%2Fhyva-modules?style=for-the-badge)](https://www.npmjs.com/package/@hyva-themes/hyva-modules)
[![GitHub License](https://img.shields.io/github/license/hyva-themes/hyva-modules-tailwind-js?style=for-the-badge&color=004d32)](https://github.com/hyva-themes/hyva-modules-tailwind-js/blob/main/LICENSE.md)

This NPM package is meant to be used with an installation of Hyvä.
If you're not sure what Hyvä is, please check out [hyva.io](https://www.hyva.io/) to learn more.

## Installation

> [!NOTE]
> If you are using Hyvä 1.1.14 or newer, this package is already included in your `package.json` file by default.

You can install `hyva-modules` via `npm` or other Node-based package managers like `pnpm`:

```sh
npm install @hyva-themes/hyva-modules
```

## Usage

This plugin provides multiple helper functions and Node scripts. Some are built for Tailwind CSS v3, and others for the future with Tailwind CSS v4.

Below is a list of each of these functions and their use cases.

### `mergeTailwindConfig`

This function is used in **Tailwind v2** and **v3** for merging Tailwind configurations from Hyvä-compatible modules into your theme.

To use this module, import `mergeTailwindConfig` into your `tailwind.config.js` and wrap the exported module object in this function:

```js
const { mergeTailwindConfig } = require('@hyva-themes/hyva-modules');

module.exports = mergeTailwindConfig({
  // Your theme's Tailwind config here...
});
```

For more information on Tailwind merging,
please read our documentation at [docs.hyva.io](https://docs.hyva.io/hyva-themes/compatibility-modules/tailwind-config-merging.html).

### `postcssImportHyvaModules`

This is complementary to `mergeTailwindConfig`, but for CSS.

To use this module, import `postcssImportHyvaModules` into your `postcss.config.js` and include it in the list of plugins.

> [!IMPORTANT]
> The `hyva-modules` plugin must be placed before the `postcss-import` and `tailwindcss/nesting` plugins.

```js
const { postcssImportHyvaModules } = require('@hyva-themes/hyva-modules');

module.exports = {
    plugins: [
        postcssImportHyvaModules,
        require('postcss-import'),
        // ...other PostCSS plugins
    ],
};
```

For more information on CSS merging,
please read our documentation at [docs.hyva.io](https://docs.hyva.io/hyva-themes/compatibility-modules/tailwind-source-css-merging.html).

### `twVar` and `twProps`

You can opt into CSS variables in your Tailwind configuration using the `twVar` and `twProps` functions.

With `twVar`, you can add a CSS variable to one or more Tailwind CSS tokens. For example:

```js
const { twVar, mergeTailwindConfig } = require('@hyva-themes/hyva-modules');
const colors = require('tailwindcss/colors');

module.exports = mergeTailwindConfig({
    theme: {
        extend: {
            colors: {
                primary: {
                    lighter: twVar('primary-lighter', colors.blue['600']),
                    DEFAULT: twVar('primary', colors.blue['700']),
                    darker: twVar('primary-darker', colors.blue['800']),
                },
            },
        },
    },
    // The rest of your Tailwind config...
});
```

This will render any Tailwind color utility class with the following CSS value:

```css
.bg-primary {
    --tw-bg-opacity: 1;
    background-color: color-mix(
        in srgb,
        var(--color-primary, #1d4ed8) calc(var(--tw-bg-opacity) * 100%),
        transparent
    );
}
```

> The method for handling opacity with all color syntaxes is based on the upcoming Tailwind CSS v4,
> which uses the CSS function `color-mix()` to make this possible.
> We have reused this to make the transition easier in the future.

You can change the value in your CSS or inline on the page with:

```css
:root {
    --color-primary: hsl(20 80% 50%);
}
```

If you don't want to set this for each Tailwind CSS token, we also offer the `twProps` function.
This acts as a wrapper and uses the keys as the name for the CSS variable.
For example, if `twProps` wraps `primary > lighter`, it will create the name `--primary-lighter`.

<details>
<summary>In this example, we can create the same effect as <code>twVar</code> with less effort:</summary>

```js
const { twProps, mergeTailwindConfig } = require('@hyva-themes/hyva-modules');
const colors = require('tailwindcss/colors');

module.exports = mergeTailwindConfig({
    theme: {
        extend: {
            colors: twProps({
                primary: {
                    lighter: colors.blue['600'],
                    DEFAULT: colors.blue['700'],
                    darker: colors.blue['800'],
                },
            }),
            textColors: {
                primary: twProps({
                    lighter: colors.blue['600'],
                    DEFAULT: colors.blue['700'],
                    darker: colors.blue['800'],
                }, 'text-primary'),
            },
        },
    },
    // The rest of your Tailwind config...
});
```

</details>

#### How to apply `twProps` as a wrapper without applying it to all Tailwind CSS tokens

You can use `Object.assign()` to split two groups inside any Tailwind config group (e.g., `colors`),
so only one part gets the variables and the other part is left as is.

<details>
<summary>Code Sample</summary>

```js
const { twProps, mergeTailwindConfig } = require('@hyva-themes/hyva-modules');
const colors = require('tailwindcss/colors');

module.exports = mergeTailwindConfig({
    theme: {
        extend: {
            colors: Object.assign(
                twProps({
                    primary: {
                        lighter: colors.blue['600'],
                        DEFAULT: colors.blue['700'],
                        darker: colors.blue['800'],
                    },
                    secondary: {
                        lighter: colors.blue['100'],
                        DEFAULT: colors.blue['200'],
                        darker: colors.blue['300'],
                    },
                }),
                {
                    background: {
                        lighter: colors.blue['100'],
                        DEFAULT: colors.blue['200'],
                        darker: colors.blue['300'],
                    },
                    green: colors.emerald,
                    yellow: colors.amber,
                    purple: colors.violet,
                }
            ),
        },
    },
    // The rest of your Tailwind config...
});
```

</details>

For more information on `twVar` and `twProps`,
please read our documentation at [docs.hyva.io](https://docs.hyva.io/hyva-themes/working-with-tailwindcss/css-variables-plus-tailwindcss.html#method-2-using-the-new-twprops-and-twvar-functions).

## Node Commands for Creating CSS for TailwindCSS

This solution makes our code more future-proof since we don't rely on any Tailwind CSS or PostCSS logic.
Making it independent of the bundler or a compiler allows us and you to use it with any stack.

This has been built for Tailwind v4 support,
since Tailwind v4 no longer has a JavaScript configuration and only CSS can be used.

### `hyva-init`

This command creates a `hyva.config.json` in the theme folder next to `package.json`.
This file is used to configure the other `hyva-*` commands.

To run it, use: `npx hyva-init`.

### `hyva-tokens`

This command creates a `generated/hyva-tokens.css` from a design token input.

To run it, use: `npx hyva-tokens`.

By default, this will look for a `design.tokens.json`,
but if you use **Figma**, you can configure it in `hyva.config.json` to use this file instead:

```json
{
    "tokens": {
        "src": "acme.figma-tokens.json",
        "format": "figma"
    }
}
```

Since the format of Figma is diffrent, you need to also pass the `format` key with the value `figma`.

If you only need a few simple tokens, you can also create the tokens directly in `hyva.config.json`:

```json
{
    "tokens": {
        "values": {
            "colors": {
                "primary": {
                    "lighter": "oklch(62.3% 0.214 259.815)",
                    "DEFAULT": "oklch(54.6% 0.245 262.881)",
                    "darker": "oklch(37.9% 0.146 265.522)"
                }
            }
        }
    }
}
```

By default, `generated/hyva-tokens.css` will be created in the Tailwind v4 syntax.
You can change the `cssSelector` to anything you want.
For example, you could use `:root` to add support for Tailwind v3:

```json
{
    "tokens": {
        "values": {
            "src": "...",
            "cssSelector": ":root"
        }
    }
}
```

After this, you can import this file into your Tailwind CSS like any other CSS file.

### `hyva-sources`

This is the replacement for `mergeTailwindConfig` and `postcssImportHyvaModules` in Tailwind v4 projects.
This command will create a `generated/hyva-source.css` in your project based on the Hyvä-compatible modules.

To run it, use: `npx hyva-sources`.

This uses the same `app/etc/hyva-themes.json` file as `mergeTailwindConfig` and `postcssImportHyvaModules`
and creates a CSS file using the Tailwind v4 syntax for importing and sourcing the module files.

Since this is now handled by this command, we have moved the exclusion of modules to `hyva.config.json`.

Just as with `postcssImportHyvaModules`, you provide a list of modules you want to exclude.

Since we have a bit more freedom, this command is not just for Hyvä-compatible modules.
You can even include extra paths. For example,
you don't need to include the parent theme manually; you can let this command handle that for you.

Here is an example config where you can see the exclude and include options in action:

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

## License

Hyvä Themes - https://hyva.io  
Copyright © Hyvä Themes 2022-present. All rights reserved.  
This library is distributed under the BSD-3-Clause license.

See the [LICENSE.md](LICENSE.md) file for more information.
