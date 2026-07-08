---
name: Hyvä Default System
colors:
  primary:
    lighter: '#4d6ebd'
    DEFAULT: '#0030a1'
    darker: '#002271'
  on-primary: '#ffffff'
  secondary:
    lighter: '#4d9a6d'
    DEFAULT: '#006e2e'
    darker: '#004d20'
  on-secondary: '#ffffff'
  surface: '#ffffff'
  surface-dim: '#f8fafc'
  ink: '#020617'
  ink-muted: '#475569'
form:
  bg: '#ffffff'
  color: '#1a1b23'
  stroke: '#747685'
  radius: 0.5rem
  active-color: '#0030a1'
fontFamily:
  sans: Inter
---

## Brand & Style

This design system is engineered for a high-performance, tech-forward experience, targeting software engineering, data analytics, and modern fintech platforms. The brand personality is efficient, precise, and authoritative. It evokes an emotional response of trust, speed, and clarity.

The visual style is **Corporate / Modern** with a **Minimalist** finish. It prioritizes information density and logical flow, utilizing a clean, digital-first aesthetic. The design relies on systematic alignment and high-contrast focal points to guide the user through complex workflows without unnecessary visual noise.

This design system inherits its base tokens — breakpoints, spacing scale, shadows, and anything else not listed above — directly from Tailwind CSS. The frontmatter only lists the values that override Tailwind's defaults for this brand; everything else follows Tailwind as-is.

## Colors

The palette is anchored in a deep, authoritative **Hyvä Blue** (Primary), representing stability and high-performance logic. This is supported by a vibrant **Hyvä Green** (Secondary) used for success states and growth-oriented structural elements.

The neutral palette is derived semantically to provide a foundation for borders and secondary text. The default mode is **light**, utilizing clean white surfaces and subtle tonal containers to maintain a focused, high-productivity environment.

## Typography

The typographic system is unified under the highly legible and geometric **Inter** typeface for all levels of the hierarchy. This single-family approach ensures maximum clarity across complex data sets and interface labels.

Headlines use a bold weight to establish clear hierarchy. Body text, labels, and every other level use normal weight and normal letter-spacing — no tracking tricks — keeping the system easy to scan at any size.

## Layout & Spacing

Containers use Tailwind's fixed-width breakpoint scale (`sm`, `md`, `lg`, `xl`, `2xl`) — at each breakpoint the container snaps to that breakpoint's own fixed max-width rather than stretching full-bleed. The grid inside that container is fluid: columns and gutters resize to fill the available width at every breakpoint rather than following a fixed pixel-based column count.

Spacing follows the `spacing` token above, ensuring consistent vertical rhythm across all components.

## Elevation & Depth

Visual hierarchy is established primarily through **Tonal Layers** and **Low-Contrast Outlines**. Depth is used purposefully to separate functional areas rather than for decorative effect.

The system uses subtle background shifts to indicate content grouping. When interaction requires floating elements like menus, use **Ambient Shadows**: diffused, low-opacity shadows (5%) to maintain the clean, flat aesthetic of the interface. Borders are 1px width in a neutral tone to maintain a crisp appearance.

## Shapes

The shape language is **Rounded**, utilizing a 0.5rem (8px) base radius. This provides a friendly, modern feel that offsets the technical nature of the typography and layout. Larger containers and cards may use `rounded-lg` (1rem) to soften their presence, while small utility components like checkboxes strictly follow the 8px base radius.

## Components

### Buttons
Buttons come in three variants. `.btn-primary` is a solid Hyvä Blue fill with `on-primary` (white) text, lightening to `primary-lighter` on hover. `.btn-secondary` is outlined with a 2px `primary-lighter` border on an `on-primary` background and `primary-darker` text, filling solid Hyvä Blue with white text when pressed. The unmodified `.btn` base has no border and a soft, primary-tinted background (10% Hyvä Blue, deepening to 20%/30% on hover/active) for lower-emphasis actions. All variants share `rounded-lg` (1rem) corners, a 2px border width, and 0.5rem vertical / 1rem horizontal padding; `.btn-size-lg` and `.btn-size-sm` scale that padding and text size up or down. Disabled buttons always fall back to a neutral gray border, background, and text, regardless of variant.

### Chips & Tags
Chips use a light tonal background with Hyvä Green text. They have a higher roundedness (pill-style) than standard buttons to suggest an easily scannable, interactive object.

### Lists
Lists use 1px dividers. Interactive list items should have a subtle hover state to indicate the target area.

### Input Fields
Text inputs, textareas, and selects use a `form-bg` background, `form-color` text, and a 1px `form-stroke` border, padded 0.5rem vertically / 0.75rem horizontally, and rounded with `rounded-lg` (0.5rem) to match the Shapes section. On focus, both the border and a tight 1px outline (flush against the field, not offset) switch to `form-active-color` (Hyvä Blue). Selects add a chevron icon inset 0.8rem from the edge. Required fields are marked with a small red asterisk after the label.

### Cards
Cards are defined by a 1px `card-stroke` border in a neutral tone and a light `card-bg` background rather than heavy shadows, with `rounded-lg` (0.5rem) corners and 1.5rem of internal padding to maintain the focused breathability of the system. Interactive cards drop the border and pick up a soft shadow on hover or focus instead.

### Checkboxes & Radios
Checkboxes and radios are 1.125rem square with a 2px `form-stroke` border, `form-bg` background, and `form-color` icon color (radios are fully rounded). When checked, the border disappears and the whole control fills solid `form-active-color` (Hyvä Blue) with a white check or dot icon; focus adds a 2px outline, offset 2px, in `form-active-color`.

### Switches
Toggle switches (`[role="switch"]`) are a 2.25rem × 1.25rem fully-rounded track with a 2px border. Off, the track uses the standard `form-bg`/`form-stroke` input colors with a `form-stroke`-colored thumb; on, the track fills solid `form-active-color` with a `form-bg` (white) thumb that slides 1rem to sit flush with the opposite edge (mirrored in RTL).

### Swatches
Swatches are a minimum 2.25rem square with a 1px `form-stroke` border and `form-bg` background (or a supplied image/color), padded 0.1875rem vertically and 0.375rem horizontally, and rounded `0.5em` by default. Visual (color/image) swatches use a pill-like `5rem` radius instead with tighter horizontal padding. On hover, checked, selected, or focus, the border switches to `form-active-color`, with checked/selected states adding a matching inset ring and focus adding a 2px outline. Disabled swatches get a dashed, faded border and reduced-opacity content instead.
