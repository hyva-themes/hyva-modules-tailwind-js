# `hyva-tokens`

This command creates a `generated/hyva-tokens.css` from a design token input.

To run it, use: `npx hyva-tokens`.

After this, you can import this file into your Tailwind CSS like any other CSS file.

## Options

All options live under the `tokens` key of `hyva.config.json`.

| Key           | Default                                   | Description                                                           |
| ------------- | ----------------------------------------- | --------------------------------------------------------------------- |
| `src`         | `design.tokens.json`                      | The token file, either JSON or a Google Stitch Markdown export.       |
| `format`      | `default`, or `stitch` for a `.md` source | The token syntax of `src`, for example `figma`.                       |
| `values`      | (none)                                    | Tokens defined inline. Takes precedence over `src` when both are set. |
| `cssSelector` | `@theme`                                  | Where the variables are declared. Any selector or at-rule.            |
| `mediaDark`   | `@media (prefers-color-scheme: dark)`     | The wrapper for dark tokens, either an `@media` rule or a selector.   |
| `stripPrefix` | (none)                                    | A dotted key path to unwrap, such as `tokens.values`.                 |
| `rename`      | (none)                                    | A map of group names to rename, such as `{ "colors": "color" }`.      |

## Figma

If you use **Figma**, point `tokens.src` at the exported file.
Since the format of Figma is different, you also need to pass the `format` key with the value `figma`:

```json
{
    "tokens": {
        "src": "acme.figma-tokens.json",
        "format": "figma"
    }
}
```

## Google Stitch

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
Stitch exports the color group as `colors`, but it's automatically renamed to the singular `color` to match Hyvä's naming convention (`--color-primary` instead of `--colors-primary`), so no manual `rename` config is needed.

See [`examples/DESIGN.md`](../examples/DESIGN.md) for a complete example.

## Inline values

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

## CSS selector

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

The fonts from [`hyva-fonts`](./fonts.md) follow this selector too, unless a family sets its own.

## Unwrapping and renaming groups

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

## Dark mode

You can customize the dark mode wrapper used for dark tokens with `tokens.mediaDark`.
It accepts either a CSS `@media` rule or a CSS selector, and defaults to `@media (prefers-color-scheme: dark)`.
For example, to use a class-based dark mode strategy:

```json
{
    "tokens": {
        "mediaDark": ".dark"
    }
}
```
