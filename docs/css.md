# CSS Defaults

This package provides several optional CSS modules that offer default styling for common HTML elements.
They are built for Tailwind CSS v4 and Hyvä Themes, and serve as lightweight alternatives to the official Tailwind CSS plugins.

Import all modules at once:

```css
@import "@hyva-themes/hyva-modules/css";
```

Or import only the modules you need:

```css
@import "@hyva-themes/hyva-modules/css/theme.css";
@import "@hyva-themes/hyva-modules/css/prose.css";
@import "@hyva-themes/hyva-modules/css/forms.css";
@import "@hyva-themes/hyva-modules/css/validation.css";
@import "@hyva-themes/hyva-modules/css/progress.css";
@import "@hyva-themes/hyva-modules/css/fallback.css";
```

Every module is customized through CSS variables, so nothing needs to be overridden with a more specific selector.

## Theme

Provides a default color palette, so a theme has working colors before its own design tokens are generated with [`hyva-tokens`](./tokens.md).

| Variable                    | Default                                  |
| --------------------------- | ---------------------------------------- |
| `--color-primary`           | `oklch(46% 0.2 265)`                     |
| `--color-primary-lighter`   | `--color-primary` mixed with 20% white   |
| `--color-primary-darker`    | `--color-primary` mixed with 20% black   |
| `--color-on-primary`        | `--color-white`                          |
| `--color-secondary`         | `oklch(53% 0.15 150)`                    |
| `--color-secondary-lighter` | `--color-secondary` mixed with 20% white |
| `--color-secondary-darker`  | `--color-secondary` mixed with 20% black |
| `--color-on-secondary`      | `--color-white`                          |
| `--color-background`        | `--color-gray-50`                        |
| `--color-surface`           | `--color-white`                          |
| `--color-ink`               | `--color-gray-950`                       |
| `--color-ink-muted`         | `--color-gray-600`                       |

The `lighter` and `darker` tints are derived with `color-mix()`, so overriding only the base color keeps them in sync:

```css
@theme {
    --color-primary: oklch(55% 0.2 30);
}
```

The `on-*` colors are meant for text placed on top of that color, such as `bg-primary text-on-primary`.

## Prose

A lightweight, unopinionated alternative to the `@tailwindcss/typography` plugin.
It provides typographic defaults for long form content, like CMS blocks, without imposing specific colors or a `max-width`.
Its defaults are inspired by [`@fylgja/base`](https://www.npmjs.com/package/@fylgja/base).

```html
<div class="prose">
    <h2>Title</h2>
    <p class="lead">An introduction in a larger font size.</p>
    <p>Content with a <a href="#">link</a>.</p>
</div>
```

It styles headings, paragraphs, lists (including `ol[type]`), blockquotes, links, tables and horizontal rules.
The first and last child lose their outer margin, so the block fits flush in its container.
Every rule uses `:where()`, so any utility on a child element still wins.

### Variables

| Variable                   | Default                            | Description                                            |
| -------------------------- | ---------------------------------- | ------------------------------------------------------ |
| `--text-flow`              | `1em 1rem`                         | Block margin of headings, paragraphs, lists and `pre`. |
| `--separator-flow`         | `2.5em`                            | Block margin of `blockquote`, `figure` and `hr`.       |
| `--h-color`                | `initial`                          | Heading color.                                         |
| `--h-family`               | `initial`                          | Heading font family.                                   |
| `--h-size`                 | `1.125em`                          | Font size of `h5` and `h6`.                            |
| `--h1-size` to `--h4-size` | `3em`, `2em`, `1.625em`, `1.375em` | Font size per heading level.                           |
| `--h-weight`               | `600`                              | Heading font weight.                                   |
| `--h-line`                 | `1.1`                              | Heading line height.                                   |
| `--marker-color`           | `--color-primary`                  | Color of list markers.                                 |
| `--link-color`             | `--color-primary`                  | Link color.                                            |
| `--link-weight`            | `500`                              | Link font weight.                                      |
| `--blockquote-color`       | `--color-primary`                  | Color of the blockquote border.                        |
| `--table-py`               | `--spacing(3)`                     | Block padding of table cells.                          |
| `--table-px`               | `--spacing(2)`                     | Inline padding of table cells.                         |
| `--table-stroke`           | `--color-gray-400`                 | Table border color.                                    |
| `--table-bg`               | `canvas`                           | Table cell background.                                 |
| `--table-color`            | `canvastext`                       | Table cell text color.                                 |

Set them on the element for a single block, or in your stylesheet for every `prose` block:

```html
<div class="prose [--link-color:var(--color-secondary)]"></div>
```

```css
.prose {
    --h-family: var(--font-heading);
    --h-color: var(--color-ink);
}
```

To set `--h-family` from a font managed by `hyva-fonts`, see [Where the CSS variables go](./fonts.md#where-the-css-variables-go).

### Element modifiers

Use a `prose-*` variant to apply a utility to every matching child element:

```html
<div
    class="prose prose-headings:text-ink prose-a:underline prose-img:rounded-lg"
></div>
```

| Variant                                                                        | Targets            |
| ------------------------------------------------------------------------------ | ------------------ |
| `prose-headings`                                                               | `h1` to `h6`       |
| `prose-h1` to `prose-h6`                                                       | That heading level |
| `prose-lead`                                                                   | `.lead`            |
| `prose-p`, `prose-a`, `prose-strong`, `prose-em`                               | That element       |
| `prose-blockquote`, `prose-code`, `prose-pre`, `prose-hr`                      | That element       |
| `prose-ul`, `prose-ol`, `prose-li`                                             | That element       |
| `prose-table`, `prose-th`, `prose-td`                                          | That element       |
| `prose-img`, `prose-figure`, `prose-figcaption`, `prose-video`, `prose-iframe` | That element       |

## Forms

A minimal alternative to the `@tailwindcss/forms` plugin.
It is a port of that plugin, with improvements from [`@fylgja/base`](https://www.npmjs.com/package/@fylgja/base) that make the forms smaller and easier to adjust.
It only adds what the Tailwind v4 preflight does not already cover.

Styled without any class:

- **Text fields:** `input` without a `type`, the text like types (`text`, `email`, `url`, `password`, `number`, `search`, `tel`) and the date and time types.
- **`textarea` and `select`:** a single `select` gets a chevron icon, which flips side in a right to left layout.
- **Checkboxes and radios:** including the `:checked` and `:indeterminate` states.

The `form-input`, `form-textarea`, `form-select`, `form-multiselect`, `form-checkbox` and `form-radio` classes
apply the same styles to other elements, matching the class names of `@tailwindcss/forms`.

On focus, the border and outline switch to `--form-active-color`.

### Variables

The variables are declared in `@theme`, so override them in your own `@theme` block:

| Variable               | Default            | Description                                    |
| ---------------------- | ------------------ | ---------------------------------------------- |
| `--form-py`            | `--spacing(2)`     | Block padding of text fields.                  |
| `--form-px`            | `--spacing(3)`     | Inline padding of text fields.                 |
| `--form-radius`        | `--radius-lg`      | Border radius of text fields.                  |
| `--form-stroke`        | `--color-gray-400` | Border color.                                  |
| `--form-bg`            | `--color-white`    | Background color.                              |
| `--form-color`         | `--color-ink`      | Text color.                                    |
| `--form-active-color`  | `--color-primary`  | Focus color, and the fill of checked controls. |
| `--select-icon`        | chevron SVG        | The `select` icon, as a `url()`.               |
| `--select-icon-size`   | `1.25em`           | Size of the `select` icon.                     |
| `--select-icon-offset` | `0.8rem`           | Distance of the `select` icon from the edge.   |

```css
@theme {
    --form-radius: var(--radius-sm);
    --form-active-color: var(--color-secondary);
}
```

### Building your own form components

The base styles of `forms.css` come from two utilities, `form-input-field` for text fields and `form-input-control` for checkboxes and radios.
They are not meant as classes in your templates, but as a starting point for your own form components,
so those share the same defaults and follow every `--form-*` variable.

Hyvä uses this for the add-ons of an input group, the text or icon placed next to a field:

```css
@layer components {
    .form-input-addon {
        @apply form-input-field;

        &:first-child {
            padding-inline-end: 0;
            border-inline-end: 0;
        }

        &:last-child {
            padding-inline-start: 0;
            border-inline-start: 0;
        }
    }
}
```

The utilities can be imported without the element styles, for a theme that styles its form elements another way.
The `--form-*` variables are declared in `forms.css`, so declare them yourself in that case:

```css
@import "@hyva-themes/hyva-modules/css/form-input.css";

@theme {
    --form-py: --spacing(2);
    --form-px: --spacing(3);
    --form-radius: var(--radius-lg);
    --form-stroke: var(--color-gray-400);
    --form-bg: var(--color-white);
    --form-color: var(--color-ink);
}
```

## Form Validation

Styles invalid form fields, and the messages next to them.
It builds on the variables of [Forms](#forms), so import both.

A field is invalid when it matches `:user-invalid`, which the browser only applies after the user has interacted with it,
or when it has `aria-invalid="true"` set by your own validation.
While it is not focused, its border and outline switch to `--form-error-color`.
An `.input-group` containing an invalid field is marked as a whole, and so is a `fieldset` with `aria-invalid="true"`.

```html
<label for="email">Email</label>
<input id="email" type="email" required aria-describedby="email-error" />
<p id="email-error" class="form-error-text">Enter a valid email address.</p>
<p class="form-info-text">We never share your email.</p>
```

| Utility           | Style                                         |
| ----------------- | --------------------------------------------- |
| `form-error-text` | Smaller, bolder text in `--form-error-color`. |
| `form-info-text`  | Smaller, italic text in `--form-info-color`.  |

| Variable             | Default                       |
| -------------------- | ----------------------------- |
| `--form-error-color` | `--color-red-600`             |
| `--form-info-color`  | `currentcolor` at 64% opacity |

## Progress

Gives the `<progress>` element a consistent look across browsers: a full width, rounded bar
on a subtle track. The value animates when it changes, unless the user prefers reduced motion.

```html
<progress value="40" max="100"></progress>
```

| Variable                | Default           |
| ----------------------- | ----------------- |
| `--progress-bar-color`  | `--color-primary` |
| `--progress-bar-radius` | `9999px`          |

The variables are set on the element, so change them with a utility or your own selector:

```html
<progress
    class="[--progress-bar-color:var(--color-secondary)] h-2"
    value="40"
    max="100"
></progress>
```

## Fallback

Restores utilities from Tailwind v2 and v3 that were removed in v4, so older Hyvä compatibility modules still compile.
Avoid them in new code.

- `bg-opacity-*`, `text-opacity-*`, `border-opacity-*`, `divide-opacity-*`, `ring-opacity-*`, `placeholder-opacity-*`
- `flex-shrink`, `flex-shrink-0`, `flex-grow`, `flex-grow-0`
- `overflow-ellipsis`
- `decoration-slice`, `decoration-clone`
