# `hyva-fonts`

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

## Options

| Key              | Default                             | Description                                                                                          |
| ---------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `provider`       | `fontsource`                        | Where the font comes from. See the providers below.                                                  |
| `name`           | (required)                          | The font family name, as the provider spells it.                                                     |
| `id`             | slugified `name`                    | How the provider addresses the family in a URL. Only needed for a few `fontshare` families.          |
| `cssVariable`    | `--font-` plus the slugified `name` | The CSS variable holding the font stack. Leading dashes are optional.                                |
| `cssSelector`    | `tokens.cssSelector`, else `@theme` | Where that variable is declared. Any selector or at-rule.                                            |
| `styles`         | `["normal"]`                        | Any combination of `normal` and `italic`.                                                            |
| `weights`        | `["400"]`                           | The weights to download.                                                                             |
| `subsets`        | `["latin"]`                         | The character subsets to download. Ignored by `fontshare`.                                           |
| `fallbacks`      | `["sans-serif"]`                    | Appended to the font stack of the CSS variable. Use `[]` for none.                                   |
| `display`        | `swap`                              | The `font-display` of the generated `@font-face` rules.                                              |
| `preload`        | `false`                             | Include this family in the generated preload snippet.                                                |
| `adjustFallback` | `true`                              | Match the fallback font's metrics to this family, so the page does not shift when the webfont loads. |

Only `woff2` is downloaded. Every browser in use supports it, so an older format only adds weight to your theme.

Only the `latin` subset is downloaded unless you ask for more, which is the same choice Fontsource makes.
Add `latin-ext` for most of the rest of Europe, or a script such as `cyrillic` or `greek`, as needed:

```json
{
    "fonts": [{ "name": "Roboto", "subsets": ["latin", "latin-ext"] }]
}
```

Every subset is a separate file with its own `unicode-range`, so a visitor only downloads the ones their text needs.
Asking for a subset a family does not have reports the ones it does.

## Where the CSS variables go

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

## Providers

| `provider`     | Catalogue                                 | Notes                                                                                        |
| -------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------- |
| `fontsource`   | [Fontsource](https://fontsource.org/)     | The default. Open source fonts, including everything on Google Fonts. Serves variable fonts. |
| `google-fonts` | [Google Fonts](https://fonts.google.com/) | Serves variable fonts.                                                                       |
| `bunny-fonts`  | [Bunny Fonts](https://fonts.bunny.net/)   | The same catalogue as Google Fonts, without the tracking. Static files only.                 |
| `fontshare`    | [Fontshare](https://www.fontshare.com/)   | The ITF library, including Satoshi and General Sans. No subsets, static files only.          |
| `local`        | your theme                                | Font files you already have.                                                                 |

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
        {
            "provider": "fontshare",
            "name": "JetBrains Mono",
            "id": "jet-brains-mono"
        }
    ]
}
```

The `name` is always what ends up in the CSS, both in the `@font-face` rules and in the
font stack of the CSS variable, so `id` only changes where the files are fetched from.

## Variable fonts

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

## Local fonts

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
                {
                    "weight": "400",
                    "style": "normal",
                    "src": "acme-sans-regular.woff2"
                },
                {
                    "weight": "700",
                    "style": "normal",
                    "src": "acme-sans-bold.woff2"
                }
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
        {
            "weight": "400",
            "src": ["acme-sans-regular.woff2", "acme-sans-regular.woff"]
        }
    ]
}
```

A variant also accepts `unicodeRange`, `stretch` and `display`.

## Fallback fonts

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
    "fonts": [{ "name": "Inter", "fallbacks": ["Arial", "sans-serif"] }]
}
```

`Arial`, `Times New Roman`, `Courier New`, `Georgia`, `Verdana`, `Tahoma` and
`Trebuchet MS` are recognised, each together with the families that are metrically
compatible with it, so the adjustment still holds on a machine without the first one.

Set `adjustFallback` to `false` to leave the stack alone.
A family whose fallbacks are not recognised, such as `cursive`, is left alone anyway.

## Preloading

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

## Keeping the preload hints up to date

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

## Generated files

Downloaded fonts are written to `web/fonts/generated`, next to the `web/tailwind` folder this command runs from.
The name makes clear that the folder is managed by `hyva-fonts`, so files no longer covered by the config are removed.
Keep your own font files directly in `web/fonts`, where the `local` provider looks for them.

Next to the font files sit two more generated files.
`hyva-fonts.json` records what each provider returned, and is what allows a later run to
rebuild the stylesheet from the files already on disk, so keep it with them.
Commit both, or neither.
`hyva-fonts-preload.xml` is the snippet described above, and only appears when a family
asks to be preloaded.

## Offline and repeat builds

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
