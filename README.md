# Hyvä Themes Tailwind Utilities

This NPM package is mend to be used with a installation of Hyvä.
Not sure what Hyvä is, then please check out https://www.hyva.io/ to learn more.

## Installation

> [!NOTE]
> If you are using Hyvä 1.1.14 or newer it will already be included in the `package.json` file by default.

You can install hyva-modules via npm or other Node-based package managers like pnpm:

```sh
npm install @hyva-themes/hyva-modules
```

## Usage

This plugin has multiple helper functions and node script you can use, some are build for Tailwind v3 and others for the future with Tailwind v4.

Down here you will find a list of each of these functions and where you can use them.

### `mergeTailwindConfig`

This functions is used in **Tailwind v2** and **Tailwind v3** for merging Tailwind Configs from Hyvä Compatible modules in to your theme.

To use this module you need to import the `mergeTailwindConfig` in to your `tailwind.config.js` and wrap the module exported object in this function;

```js
const { mergeTailwindConfig } = require('@hyva-themes/hyva-modules');

module.exports = mergeTailwindConfig({
  // theme tailwind config here ...
})
```

For more information on Tailwind Merging, please read our docs at [docs.hyva.io](https://docs.hyva.io/hyva-themes/compatibility-modules/tailwind-config-merging.html)

### `postcssImportHyvaModules`

This is complementary to the `mergeTailwindConfig`, only now for CSS.

To use this module you need to import the `postcssImportHyvaModules` in to your `postcss.config.js` and include it into the list of plugin.

> [!Important]
> The hyva-modules plugin has to go before the `postcss-import` and `tailwindcss/nesting` plugins!

```js
const { postcssImportHyvaModules } = require('@hyva-themes/hyva-modules');

module.exports = {
    plugins: [
        postcssImportHyvaModules,
        require('postcss-import'),
        ...other PostCSS plugins...
    ]
}
```

For more information on CSS Mergin, please read our docs at [docs.hyva.io](https://docs.hyva.io/hyva-themes/compatibility-modules/tailwind-source-css-merging.html)

### `twVar` and `twProps`

You can opt into CSS variables in your tailwind configuration using the twVar and twProps function.

With `twVar` you can add a CSS variable to one or more TailwindCSS tokens, for example like this:

```js
const { twVar, mergeTailwindConfig } = require('@hyva-themes/hyva-modules');

module.exports = mergeTailwindConfig({
    theme: {
        extend: {
            colors: {
                primary: {
                    lighter: twVar('primary-lighter', colors.blue["600"]),
                    DEFAULT: twVar('primary', colors.blue["700"]),
                    darker: twVar('primary-darker', colors.blue["800"]),
                },
            }
        }
    }
    // The rest of your tailwind config...
})
```

this will render any Tailwind color utility class with the following CSS value:

```css
.bg-primary {
    --tw-bg-opacity: 1;
    background-color: color-mix(in srgb, var(--color-primary, #1d4ed8) calc(var(--tw-bg-opacity) * 100%), transparent);
}
```

> The method for handling opacity with all color syntaxes is based on the upcoming TailwindCSS v4,
> here they use the CSS function `color-mix()` to make this possible,
> we have reused this to make that transition easier in the future.

And with this you can change the value in your CSS or inline in the page with:

```css
:root {
    --color-primary: hsl(20 80% 50%);
}
```

Now if you don't want to set this for each TailwindCSS token we also offer the functions `twProps`.
This acts as a wrapper and will use the keys as the name for the CSS variable, so if the twProps wraps `primary > lighter` it will create the name `--primary-lighter`.

<details><summary>In this example we can create the same effect as `twVar` with less effort</summary>

```js
const { twProps, mergeTailwindConfig } = require('@hyva-themes/hyva-modules');

module.exports = mergeTailwindConfig({
    theme: {
        extend: {
            colors: twProps({
                primary: {
                    lighter: colors.blue["600"],
                    DEFAULT: colors.blue["700"],
                    darker: colors.blue["800"],
                },
            }),
            textColors: {
                primary: twProps({
                    lighter: colors.blue["600"],
                    DEFAULT: colors.blue["700"],
                    darker: colors.blue["800"],
                }, 'text-primary'),
            }
        }
    }
    // The rest of your tailwind config...
})
```

</details>

**Important to note:**

- `twVar` only works with string values.
- `twProps` can be used on any level of your Tailwind config, but it only works with string values.
- `twProps` is best used inside the [reference function method](https://tailwindcss.com/docs/theme#referencing-other-values).

#### How to only apply `twProps` as wrapper but don't apply it to all TailwindCSS tokens

You can use `Object.assign()` to split 2 groups inside any Tailwind config group, e.g. `colors`,
so only one part gets the variables and the other part is left as is.

<details><summary>Code Sample</summary>

```js
const { twProps, mergeTailwindConfig } = require('@hyva-themes/hyva-modules');

module.exports = mergeTailwindConfig({
    theme: {
        extend: {
            colors: Object.assign(
                twProps({
                    primary: {
                        lighter: colors.blue["600"],
                        DEFAULT: colors.blue["700"],
                        darker: colors.blue["800"],
                    },
                    secondary: {
                        lighter: colors.blue["100"],
                        DEFAULT: colors.blue["200"],
                        darker: colors.blue["300"],
                    },
                }),
                {
                    background: {
                        lighter: colors.blue["100"],
                        DEFAULT: colors.blue["200"],
                        darker: colors.blue["300"],
                    },
                    green: colors.emerald,
                    yellow: colors.amber,
                    purple: colors.violet,
                }
            ),
        }
    }
    // The rest of your tailwind config...
})
```

</details>

For more information on `twVar` and `twProps`, please read our docs at [docs.hyva.io](https://docs.hyva.io/hyva-themes/working-with-tailwindcss/css-variables-plus-tailwindcss.html#method-2-using-the-new-twprops-and-twvar-functions)

## NPX Commands for creating CSS to be used with Tailwind

This solution makes our code more futere proof since we don't rely on any TailwindCSS or PostCSS logic.

Making it not dependend on the bundler or a compiler is allowing us and you to use it with any stack.

This has been build for Tailwind v4 support, since Tailwind v4 does not have a javascript config anymore.

And only CSS can be used.

### `hyva-init`

This command creates a `hyva.config.json` in the theme folder next to the `package.json`, this file is used with the other command options and allows you to configure the way certain things work.

To run it use: `npx hyva-init`.

### `hyva-tokens`

This command creates a `generated/hyva-tokens.css` from a design token input.

To run it use: `npx hyva-tokens`.

By default this will look for a `design.tokens.json`, but if you use **Figma** you can configure it in the `hyva.config.json` to use this file instead.

```json
{
    "tokens": {
        "src": "acme.figma-tokens.json",
    }
}
```

If you only need a few simple tokens, you can also create the tokens directly in the `hyva.config.json`:

```json
{
    "tokens": {
        "values": {
            "colors": {
                "primary": {
                    "lighter": "oklch(62.3% 0.214 259.815)",
                    "DEFAULT": "oklch(54.6% 0.245 262.881)",
                    "darker": "oklch(37.9% 0.146 265.522)",
                },
            }
        },
    }
}
```

By default the `generated/hyva-tokens.css` will be created in the Tailwind v4 syntax, you can change the `cssSelector` to anything you want, so for example you could use `:root` to add support for Tailwind v3.

```json
{
    "tokens": {
        "values": {
            "src": "...",
            "cssSelector": ":root"
        },
    }
}
```

After this you can import this file into your Tailwind CSS, like any other CSS file.

### `hyva-sources`

This is the replacement for `mergeTailwindConfig` and `postcssImportHyvaModules` in Tailwind v4 projects.

This command will create a `generated/hyva-source.css` in your project based on the Hyvä Compatible modules.

To run it use: `npx hyva-sources`.

This uses the same file as the `mergeTailwindConfig` and `postcssImportHyvaModules`, the `app/etc/hyva-themes.json`,
and creates a CSS file using the Tailwind v4 syntax for importing and sourcing the modules files.

Since this now handled by this command we have moved the excluding of modules to the `hyva.config.json`.

Same as done in the `postcssImportHyvaModules` you give a list of modules you want to exclude.

Since we have a bit more freedom this command is not just made for Hyvä Compatible modules and you can even include extra paths, for example you don't need to include the parent theme manually, you can let this command handle that for you.

Here is a example config, where you can see the exclude and include options in action:

```json
{
    "tailwind": {
        "include": [
            { "src": "app/code/Acme/hyva-module" },
            { "src": "vendor/hyva-themes/magento2-default-theme" },
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
