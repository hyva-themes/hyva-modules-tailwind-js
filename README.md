# Hyvä Themes Tailwind Utilities

[![Go to hyva.io](https://img.shields.io/badge/hyva.io-0A23B9)](https://hyva.io)
[![CI](https://img.shields.io/github/actions/workflow/status/hyva-themes/hyva-modules-tailwind-js/test.yml?label=&branch=main&logo=github&color=0A23B9&labelColor=2b1c2c)](https://github.com/hyva-themes/hyva-modules-tailwind-js/actions)
[![Version](https://img.shields.io/npm/v/%40hyva-themes%2Fhyva-modules?label=&logo=npm&color=0A23B9&labelColor=2b1c2c)](https://www.npmjs.com/package/@hyva-themes/hyva-modules)
[![License](https://img.shields.io/github/license/hyva-themes/hyva-modules-tailwind-js?color=004d32&labelColor=2b1c2c)](https://github.com/hyva-themes/hyva-modules-tailwind-js/blob/main/LICENSE.md)

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

This plugin provides multiple helper functions and Node scripts. Some are built for Tailwind CSS v4, and others are kept for backwards compatibility with Tailwind CSS v3.

Below is a list of each of these functions and their use cases.

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

If you use **Google Stitch**, point `tokens.src` at the exported Markdown file:

```json
{
    "tokens": {
        "src": "DESIGN.md"
    }
}
```

The `format` key can be omitted here, since a `.md` source is automatically treated as a Stitch export.
Only the YAML frontmatter block is used; the rest of the Markdown document (brand voice, component notes, ...) is ignored.
Every key in the frontmatter is turned into tokens, except for known metadata keys (`name`, `description`), which are dropped.
Stitch exports the color group as `colors`, but it's automatically renamed to the singular `color` to match Hyvä's naming convention (`--color-primary` instead of `--colors-primary`) — no manual `rename` config needed.

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

By default, `generated/hyva-tokens.css` will be created using `@theme` as the CSS selector, which is the Tailwind v4 syntax.
You can change the `cssSelector` to anything you want via `tokens.cssSelector`.
For example, use `:root` for Tailwind v3 compatibility:

```json
{
    "tokens": {
        "cssSelector": ":root"
    }
}
```

If your tokens source wraps the actual values in structural keys (for example a `tokens.values` wrapper coming from an external generator),
you can drop them with `tokens.stripPrefix`, and rename groups to match Hyvä's naming with `tokens.rename`:

```json
{
    "tokens": {
        "src": "acme.tokens.json",
        "stripPrefix": "tokens.values",
        "rename": {
            "colors": "color"
        }
    }
}
```

Given a `acme.tokens.json` like:

```json
{
    "$description": "Generated tokens, dropped automatically",
    "tokens": {
        "values": {
            "colors": {
                "primary": "#1d4ed8"
            }
        }
    }
}
```

This will generate `--color-primary: #1d4ed8;` instead of `--tokens-values-colors-primary: #1d4ed8;`.
Metadata keys such as `$description` are always dropped, since they are not valid CSS custom property names.

You can also customize the dark mode wrapper used for dark tokens with `tokens.mediaDark`.
It accepts either a CSS `@media` rule or a CSS selector, and defaults to `@media (prefers-color-scheme: dark)`.
For example, to use a class-based dark mode strategy:

```json
{
    "tokens": {
        "mediaDark": ".dark"
    }
}
```

After this, you can import this file into your Tailwind CSS like any other CSS file.

### `hyva-fonts`

This command creates a `generated/hyva-fonts.css` from a `fonts` configuration,
and downloads the font files into `web/fonts/generated` of your theme.

To run it, use: `npx hyva-fonts`.
It prints nothing when everything worked, only warnings and errors, the same as the other `hyva-*` commands.

Fonts are configured as an array of font families in `hyva.config.json`:

```json
{
    "fonts": [
        {
            "provider": "fontsource",
            "name": "Roboto",
            "cssVariable": "--font-roboto",
            "styles": ["normal", "italic"],
            "weights": ["300", "700"]
        }
    ]
}
```

This generates the `@font-face` rules for the self hosted font files,
plus a `@theme` block exposing every family as a CSS variable:

```css
@theme {
    --font-roboto: Roboto, sans-serif;
}
```

Import the result into your stylesheet, and the family is available as a Tailwind utility (`font-roboto`):

```css
@import "./generated/hyva-fonts.css";
```

The file is written even when no fonts are configured, so that import is safe to add up front
and keeps working after you remove your last font.

Nothing is loaded from a third party at runtime, since every font file is served from your own theme.

#### Options

| Key | Default | Description |
| --- | --- | --- |
| `provider` | `fontsource` | Where the font comes from. See the providers below. |
| `name` | (required) | The font family name, as the provider spells it. |
| `id` | slugified `name` | How the provider addresses the family in a URL. Only needed for a few `fontshare` families. |
| `cssVariable` | `--font-` plus the slugified `name` | The CSS variable holding the font stack. Leading dashes are optional. |
| `cssSelector` | `tokens.cssSelector`, else `@theme` | Where that variable is declared. Any selector or at-rule. |
| `styles` | `["normal"]` | Any combination of `normal` and `italic`. |
| `weights` | `["400"]` | The weights to download. |
| `subsets` | `["latin"]` | The character subsets to download. Ignored by `fontshare`. |
| `fallbacks` | `["sans-serif"]` | Appended to the font stack of the CSS variable. Use `[]` for none. |
| `display` | `swap` | The `font-display` of the generated `@font-face` rules. |
| `preload` | `false` | Include this family in the generated preload snippet. |
| `adjustFallback` | `true` | Match the fallback font's metrics to this family, so the page does not shift when the webfont loads. |

Only `woff2` is downloaded. Every browser in use supports it, so an older format only adds weight to your theme.

Only the `latin` subset is downloaded unless you ask for more, which is the same choice Fontsource makes.
Add `latin-ext` for most of the rest of Europe, or a script such as `cyrillic` or `greek`, as needed:

```json
{
    "fonts": [
        { "name": "Roboto", "subsets": ["latin", "latin-ext"] }
    ]
}
```

Every subset is a separate file with its own `unicode-range`, so a visitor only downloads the ones their text needs.
Asking for a subset a family does not have reports the ones it does.

#### Where the CSS variables go

By default the variables are declared in `@theme`, which is what turns them into Tailwind utilities.
Tailwind only keeps a `@theme` variable that something actually uses, either a `font-*` class in a template
or a `var(--font-*)` in your own CSS, the same as it does for the design tokens from `hyva-tokens`.

Use `cssSelector` to declare a family somewhere else instead. That output is plain CSS rather than a theme
variable, so it is always emitted, and it lets you feed a variable another stylesheet already expects.
For example, the `prose` module reads its heading font from `--h-family`:

```json
{
    "fonts": [
        {
            "name": "Pacifico",
            "cssVariable": "--h-family",
            "cssSelector": ".prose",
            "fallbacks": ["cursive"]
        }
    ]
}
```

```css
.prose {
    --h-family: Pacifico, cursive;
}
```

Families that share a selector are grouped into one block, and the `@font-face` rules are unaffected,
since those never depend on where the variable lives.

When a family does not set `cssSelector`, it falls back to `tokens.cssSelector` if your theme configured one,
and to `@theme` otherwise. So a Tailwind v3 theme that already moved its tokens to `:root` gets its fonts there
as well, without repeating itself:

```json
{
    "tokens": { "cssSelector": ":root" }
}
```

> [!NOTE]
> On a Tailwind v4 theme, a family outside `@theme` has no `font-*` utility, since only `@theme` creates one.
> Reference the variable directly in that case, as with `--h-family` above.

#### Providers

| `provider` | Catalogue | Notes |
| --- | --- | --- |
| `fontsource` | [Fontsource](https://fontsource.org/) | The default. Open source fonts, including everything on Google Fonts. Serves variable fonts. |
| `google-fonts` | [Google Fonts](https://fonts.google.com/) | Serves variable fonts. |
| `bunny-fonts` | [Bunny Fonts](https://fonts.bunny.net/) | The same catalogue as Google Fonts, without the tracking. Static files only. |
| `fontshare` | [Fontshare](https://www.fontshare.com/) | The ITF library, including Satoshi and General Sans. No subsets, static files only. |
| `local` | your theme | Font files you already have. |

Every provider takes the same options, so switching between them is a matter of changing `provider`.
Nothing else in the config has to change, unless the provider does not support the option.

`fontsource` is the default because it is built for self hosting.
It publishes a catalogue rather than a stylesheet, so a wrong weight, style or subset is
reported with the list of what the family does have, before anything is downloaded.
Its catalogue covers everything on Google Fonts, so `google-fonts` is mostly useful
for a family Fontsource has not packaged yet.

Adobe Fonts is not supported, since its license does not allow the font files to be self hosted.

`fontsource` and `fontshare` address a family by an id in a URL, derived from `name`
the same way as the CSS variable, so `IBM Plex Sans` becomes `ibm-plex-sans`.

For `fontsource` that derivation is exact for its whole catalogue, so you never need
to think about it. `fontshare` spells a few of its own ids inconsistently, so set `id`
for those:

```json
{
    "fonts": [
        { "provider": "fontshare", "name": "JetBrains Mono", "id": "jet-brains-mono" }
    ]
}
```

The `name` is always what ends up in the CSS, both in the `@font-face` rules and in the
font stack of the CSS variable, so `id` only changes where the files are fetched from.

#### Variable fonts

Most Google fonts are variable, which means a single file covers a whole weight axis.
Pass a range instead of separate weights to use it as one:

```json
{
    "fonts": [
        {
            "name": "Roboto",
            "weights": ["300 700"]
        }
    ]
}
```

Listing separate weights for a variable font works too.
The same file is served for each of them, so it is downloaded once and the `@font-face` rules are collapsed into a single weight range.

A variable file always covers the whole weight axis of the font,
so the generated `font-weight` is the range of the file rather than the range you asked for.

`bunny-fonts` and `fontshare` only serve static files, and reject a range with a message telling you to list the weights instead.

#### Local fonts

Use the `local` provider for a font you already have.
Nothing is downloaded, so you list the files yourself with a `variants` array.
Each `src` is resolved against the `web/fonts` folder of your theme:

```json
{
    "fonts": [
        {
            "provider": "local",
            "name": "Acme Sans",
            "variants": [
                { "weight": "400", "style": "normal", "src": "acme-sans-regular.woff2" },
                { "weight": "700", "style": "normal", "src": "acme-sans-bold.woff2" }
            ]
        }
    ]
}
```

Unlike a remote provider, a local variant may list several formats.
They end up in the `src` in the order you list them, so put `woff2` first:

```json
{
    "variants": [
        { "weight": "400", "src": ["acme-sans-regular.woff2", "acme-sans-regular.woff"] }
    ]
}
```

A variant also accepts `unicodeRange`, `stretch` and `display`.

#### Fallback fonts

While a webfont is still loading, text is drawn in the next font in the stack.
That font is a different width and height, so the page moves when the webfont arrives.

To stop that, the metrics of each family are read from the font file itself, and a second
`@font-face` is generated that stretches an already installed font to occupy the same space:

```css
@font-face {
    font-family: "Inter fallback";
    src: local("Arial"), local("Liberation Sans"), local("Arimo");
    size-adjust: 107.3%;
    ascent-override: 90.28%;
    descent-override: 22.48%;
    line-gap-override: 0%;
}

@theme {
    --font-sans: Inter, "Inter fallback", ui-sans-serif, system-ui, sans-serif;
}
```

Nothing is downloaded for this, it only reshapes a font the visitor already has,
and it is measured from the file on your disk so it works for a `local` font just as
well as one from a catalogue.

The font being matched is the first one in `fallbacks` that is recognised.
A generic name such as `sans-serif` stands in for a representative (`Arial` for
`sans-serif`, `Times New Roman` for `serif`, `Courier New` for `monospace`), so the
default already does something sensible. Naming a specific one is more accurate:

```json
{
    "fonts": [
        { "name": "Inter", "fallbacks": ["Arial", "sans-serif"] }
    ]
}
```

`Arial`, `Times New Roman`, `Courier New`, `Georgia`, `Verdana`, `Tahoma` and
`Trebuchet MS` are recognised, each together with the families that are metrically
compatible with it, so the adjustment still holds on a machine without the first one.

Set `adjustFallback` to `false` to leave the stack alone.
A family whose fallbacks are not recognised, such as `cursive`, is left alone anyway.

#### Preloading

A preloaded font starts downloading with the page rather than after the browser has read
your CSS, which removes the flash of fallback text for whatever is visible on load.

This cannot be generated into place, since preloading belongs to your theme's layout
rather than to its CSS. Mark a family with `preload` and the command writes a snippet
for you to copy:

```json
{
    "fonts": [
        { "name": "Inter", "cssVariable": "--font-sans", "preload": true }
    ]
}
```

That writes a `web/fonts/generated/hyva-fonts-preload.xml`, next to the font files it points at:

```xml
<page xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <head>
        <!-- hyva-fonts:start -->
        <!-- Inter -->
        <font src="fonts/generated/inter-latin-100-900-normal.woff2"/>
        <!-- hyva-fonts:end -->
    </head>
</page>
```

Copy the contents of the `head` into your theme's `Magento_Theme/layout/default_head_blocks.xml`,
creating that file if your theme does not have one.
Nothing reads the generated file itself, it is only there to copy from, and it is removed
again when no family asks to be preloaded.

The `src` paths are relative to your theme's `web` folder, which is what Magento resolves
a `font` element against, so they work unchanged from wherever you paste them.

#### Keeping the preload hints up to date

Keep the two `hyva-fonts` comments when you paste, and you only have to do this once.
On every run the command rewrites whatever sits between them, so adding or removing a
weight never leaves you preloading a file that is no longer there:

```xml
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <css src="css/styles.css"/>
        <!-- hyva-fonts:start -->
        <!-- Inter -->
        <font src="fonts/generated/inter-latin-100-900-normal.woff2"/>
        <!-- hyva-fonts:end -->
    </head>
```

The comments are the opt in, and the region between them is the only part of the file
that is ever touched. A theme without them, or without that layout file at all, is left
alone entirely. Removing the comments stops it, and removing `preload` from every family
empties the region but leaves the comments in place.

Anything ambiguous is refused rather than guessed at, since a broken layout file takes
the whole storefront with it. A missing comment, a duplicated one or the two in the wrong
order all report the problem and change nothing.

> [!NOTE]
> Your layout file is not a generated file, so this shows up in `git status` whenever your
> fonts change. It is only written when the result actually differs.

Magento's `font` element renders as a `link` with `rel="preload"`, `as="font"` and
`crossorigin="anonymous"`. That last attribute matters, since a font preloaded without it
is downloaded a second time when the `@font-face` uses it.

> [!IMPORTANT]
> Preload only what is needed to render the top of the page, usually a single body font.
> Every preload competes with the rest of the page for bandwidth, so preloading a font
> used further down makes the page slower rather than faster.

A family is preloaded with all of its files, so a family with several weights, styles or
subsets preloads all of them. Keep a preloaded family narrow. A variable font with one
subset is a single file, which is the ideal case.

#### Generated files

Downloaded fonts are written to `web/fonts/generated`, next to the `web/tailwind` folder this command runs from.
The name makes clear that the folder is managed by `hyva-fonts`, so files no longer covered by the config are removed.
Keep your own font files directly in `web/fonts`, where the `local` provider looks for them.

Next to the font files sit two more generated files.
`hyva-fonts.json` records what each provider returned, and is what allows a later run to
rebuild the stylesheet from the files already on disk, so keep it with them.
Commit both, or neither.
`hyva-fonts-preload.xml` is the snippet described above, and only appears when a family
asks to be preloaded.

#### Offline and repeat builds

A family whose font files are present, and whose config has not changed since they were fetched,
is rebuilt from `hyva-fonts.json` without contacting its provider at all.
A normal build therefore makes no network requests, and works with no connection.

Only a change that affects which files are needed causes a new request.
Changing `fallbacks`, `cssVariable` or `display` does not, since those are applied when the stylesheet is written.

When a request is needed and the provider cannot be reached, the font files already on disk are used,
and the command says so. If there are none, that family is skipped with a warning and the rest of the
stylesheet is still generated. Its CSS variable is still declared, so text falls back to the next font in
the stack instead of losing its styling:

```css
@theme {
    --font-roboto: Roboto, sans-serif;
}
```

The command succeeds in that case, so a warning never stops your CSS from building.
Use `npx hyva-fonts --strict` to exit with an error instead, which is what you want in CI.

Nothing is removed from `web/fonts/generated` after a warning, since a run that could not confirm every
family does not know which files are still needed.

Use `npx hyva-fonts --force` to ignore `hyva-fonts.json` and fetch everything again.


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

If you want to keep a module's `@source` for Tailwind class scanning but skip its CSS imports, add `keepSource: true` to the exclude entry:

```json
{
    "tailwind": {
        "exclude": [
            { "src": "vendor/hyva-themes/magento2-hyva-checkout/src", "keepSource": true }
        ]
    }
}
```

By default, module CSS files are resolved from the `view/frontend` area. You can change this with `tailwind.area` — for example, to target an admin theme:

```json
{
    "tailwind": {
        "area": "adminhtml"
    }
}
```

By default, external modules from `hyva-themes.json` are automatically included. You can disable this with `tailwind.includeExternalModules: false` to use only the modules listed under `tailwind.include`:

```json
{
    "tailwind": {
        "includeExternalModules": false,
        "include": [
            { "src": "app/code/Acme/HyvaModule" }
        ]
    }
}
```

## CSS Defaults

This package provides several optional CSS modules that offer default styling for common HTML elements.
They are optimized for TailwindCSS v4 and Hyvä Themes and serve as lightweight alternatives to official TailwindCSS plugins.

To use a module, add the corresponding `@import` rule to your stylesheet.

```css
/* Import all modules at once */
@import "@hyva-themes/hyva-modules/css";
```

Alternatively, you can import modules individually as needed.

### Theme

Provides default color tokens (`primary`, `secondary`, `background`, `surface`, `ink`, `ink-muted`) so a theme has a working palette before its own design tokens are generated via `hyva-tokens`.

Colors are defined in `oklch`, with `primary-lighter`/`primary-darker` (and the `secondary` equivalents) derived via `color-mix()` from the base color, so overriding `--color-primary`/`--color-secondary` keeps the tints in sync automatically.

```css
@import "@hyva-themes/hyva-modules/css/theme.css";
```

### Prose

A lightweight, unopinionated alternative to the `@tailwindcss/typography` plugin.
It provides sensible typographic defaults for long-form content (like CMS blocks) without imposing specific colors or a `max-width`.

```css
@import "@hyva-themes/hyva-modules/css/prose.css";
```

### Forms

A minimal alternative to the `@tailwindcss/forms` plugin, providing clean, basic styles for form elements.

```css
@import "@hyva-themes/hyva-modules/css/forms.css";
```

### Fallback

This module restores utility classes from older TailwindCSS versions (v2/v3) that have been removed in v4.
It ensures backward compatibility with older Hyvä compatibility modules and helps prevent compilation errors during upgrades.

```css
@import "@hyva-themes/hyva-modules/css/fallback.css";
```

## Tailwind v3

The following utilities are for **Tailwind v2** and **v3** projects. If you are on Tailwind v4, use `hyva-sources` and `hyva-tokens` instead.

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

### License

This package is licensed under the **Open Software License (OSL 3.0)**.

* **Copyright:** Copyright © 2020-present Hyvä Themes. All rights reserved.
* **License Text (OSL 3.0):** The full text of the OSL 3.0 license can be found in the `LICENSE.txt` file within this package, and is also available online at [http://opensource.org/licenses/osl-3.0.php](http://opensource.org/licenses/osl-3.0.php).
