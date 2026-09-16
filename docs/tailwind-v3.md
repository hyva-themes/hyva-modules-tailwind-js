# Tailwind v3

The following utilities are for **Tailwind v2** and **v3** projects. If you are on Tailwind v4, use [`hyva-sources`](../README.md#hyva-sources) and [`hyva-tokens`](./tokens.md) instead.

## `mergeTailwindConfig`

This function is used in **Tailwind v2** and **v3** for merging Tailwind configurations from Hyvä-compatible modules into your theme.

To use this module, import `mergeTailwindConfig` into your `tailwind.config.js` and wrap the exported module object in this function:

```js
const { mergeTailwindConfig } = require("@hyva-themes/hyva-modules");

module.exports = mergeTailwindConfig({
    // Your theme's Tailwind config here...
});
```

For more information on Tailwind merging,
please read our documentation at [docs.hyva.io](https://docs.hyva.io/hyva-themes/compatibility-modules/tailwind-config-merging.html).

## `postcssImportHyvaModules`

This is complementary to `mergeTailwindConfig`, but for CSS.

To use this module, import `postcssImportHyvaModules` into your `postcss.config.js` and include it in the list of plugins.

> [!IMPORTANT]
> The `hyva-modules` plugin must be placed before the `postcss-import` and `tailwindcss/nesting` plugins.

```js
const { postcssImportHyvaModules } = require("@hyva-themes/hyva-modules");

module.exports = {
    plugins: [
        postcssImportHyvaModules,
        require("postcss-import"),
        // ...other PostCSS plugins
    ],
};
```

For more information on CSS merging,
please read our documentation at [docs.hyva.io](https://docs.hyva.io/hyva-themes/compatibility-modules/tailwind-source-css-merging.html).

## `twVar` and `twProps`

You can opt into CSS variables in your Tailwind configuration using the `twVar` and `twProps` functions.

With `twVar`, you can add a CSS variable to one or more Tailwind CSS tokens. For example:

```js
const { twVar, mergeTailwindConfig } = require("@hyva-themes/hyva-modules");
const colors = require("tailwindcss/colors");

module.exports = mergeTailwindConfig({
    theme: {
        extend: {
            colors: {
                primary: {
                    lighter: twVar("primary-lighter", colors.blue["600"]),
                    DEFAULT: twVar("primary", colors.blue["700"]),
                    darker: twVar("primary-darker", colors.blue["800"]),
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

> The method for handling opacity with all color syntaxes is the same one Tailwind CSS v4 uses,
> the CSS function `color-mix()`, which makes a later upgrade easier.

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
const { twProps, mergeTailwindConfig } = require("@hyva-themes/hyva-modules");
const colors = require("tailwindcss/colors");

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
                primary: twProps(
                    {
                        lighter: colors.blue["600"],
                        DEFAULT: colors.blue["700"],
                        darker: colors.blue["800"],
                    },
                    "text-primary",
                ),
            },
        },
    },
    // The rest of your Tailwind config...
});
```

</details>

### How to apply `twProps` as a wrapper without applying it to all Tailwind CSS tokens

You can use `Object.assign()` to split two groups inside any Tailwind config group (e.g., `colors`),
so only one part gets the variables and the other part is left as is.

<details>
<summary>Code Sample</summary>

```js
const { twProps, mergeTailwindConfig } = require("@hyva-themes/hyva-modules");
const colors = require("tailwindcss/colors");

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
                },
            ),
        },
    },
    // The rest of your Tailwind config...
});
```

</details>

For more information on `twVar` and `twProps`,
please read our documentation at [docs.hyva.io](https://docs.hyva.io/hyva-themes/working-with-tailwindcss/css-variables-plus-tailwindcss.html#method-2-using-the-new-twprops-and-twvar-functions).
