/**
 * Hyvä Themes - https://hyva.io
 * Copyright © Hyvä Themes. All rights reserved.
 * See COPYING.txt for license details.
 */

import { DEFAULT_PROVIDER, getProvider, providerIds } from "./providers/index.js";

export { DEFAULT_PROVIDER };
export const DEFAULT_STYLES = ["normal"];
export const DEFAULT_WEIGHTS = ["400"];
export const DEFAULT_SUBSETS = ["latin"];
export const DEFAULT_DISPLAY = "swap";
export const DEFAULT_FALLBACKS = ["sans-serif"];

export const FONT_EXTENSIONS = ["woff2", "woff", "ttf", "otf", "eot", "svg"];

const FORMATS = {
    woff2: "woff2",
    woff: "woff",
    ttf: "truetype",
    otf: "opentype",
    eot: "embedded-opentype",
    svg: "svg",
};

/**
 * Turn a font family name into a lowercase, dash separated slug.
 *
 * Words are only split on the separators already in the name, never inside a
 * word, so "JetBrains Mono" stays "jetbrains-mono". That is how the catalogues
 * spell their ids, and splitting it further breaks every family written that
 * way, such as DejaVu Sans and McLaren.
 *
 * @param {string} value
 * @returns {string} slug
 */
export function slugify(value) {
    return String(value)
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/**
 * Look up the CSS `format()` hint for a font file.
 *
 * @param {string} file - File name or path.
 * @returns {string|null} format hint or null when the extension is unknown
 */
export function formatFromFile(file) {
    const extension = file.split("?")[0].split(".").pop()?.toLowerCase();
    return FORMATS[extension] ?? null;
}

/**
 * Normalize a weight into both the value used in the Google Fonts API
 * and the value used in the generated CSS and file names.
 *
 * A range like "300 700" or "300..700" describes a variable font axis.
 *
 * @param {string|number} weight
 * @returns {{ api: string, css: string, slug: string }}
 */
export function normalizeWeight(weight) {
    const value = String(weight).trim();
    const range = value.split(/\s*(?:\.\.|\s|-)\s*/).filter(Boolean);

    if (range.length > 1) {
        return {
            api: `${range[0]}..${range[1]}`,
            css: `${range[0]} ${range[1]}`,
            slug: `${range[0]}-${range[1]}`,
        };
    }

    return { api: value, css: value, slug: value };
}

const toArray = (value) =>
    value === undefined || value === null
        ? []
        : Array.isArray(value)
          ? value
          : [value];

/**
 * Validate and fill in the defaults for a single `fonts` entry.
 *
 * @param {Object} font - Raw entry from hyva.config.json.
 * @param {number} index - Position in the `fonts` array, used for error messages.
 * @param {string[]} errors - Collects validation errors.
 * @returns {Object|null} normalized font family or null when invalid
 */
function normalizeFont(font, index, errors) {
    const label = `fonts[${index}]`;

    if (!font || typeof font !== "object" || Array.isArray(font)) {
        errors.push(`${label} must be an object.`);
        return null;
    }

    const providerId = font.provider ?? DEFAULT_PROVIDER;
    const provider = getProvider(providerId);
    if (!provider) {
        errors.push(
            `${label}.provider "${providerId}" is not supported, use one of: ${providerIds.join(", ")}.`
        );
        return null;
    }

    const name = typeof font.name === "string" ? font.name.trim() : "";
    if (!name) {
        errors.push(`${label}.name is required.`);
        return null;
    }

    const cssVariable = font.cssVariable?.trim()
        ? font.cssVariable.trim().replace(/^(?:--)?/, "--")
        : `--font-${slugify(name)}`;

    const base = {
        provider: providerId,
        name,
        cssVariable,
        cssSelector: font.cssSelector?.trim() || undefined,
        preload: font.preload === true,
        adjustFallback: font.adjustFallback !== false,
        slug: slugify(name),
        // Providers that address a family by an id in a URL derive it from the
        // name, which `id` overrides for the rare family whose id differs.
        id: font.id?.trim() || slugify(name),
        display: font.display ?? DEFAULT_DISPLAY,
        fallbacks: toArray(font.fallbacks ?? DEFAULT_FALLBACKS).map(String),
    };

    if (!provider.remote) {
        const variants = toArray(font.variants)
            .map((variant, variantIndex) => {
                const variantLabel = `${label}.variants[${variantIndex}]`;
                const src = toArray(variant?.src).map(String).filter(Boolean);

                if (!src.length) {
                    errors.push(`${variantLabel}.src is required.`);
                    return null;
                }

                const unknown = src.filter((file) => !formatFromFile(file));
                if (unknown.length) {
                    errors.push(
                        `${variantLabel}.src has files with an unknown font format: ${unknown.join(", ")}.`
                    );
                    return null;
                }

                return {
                    weight: normalizeWeight(variant.weight ?? DEFAULT_WEIGHTS[0]),
                    style: variant.style ?? DEFAULT_STYLES[0],
                    stretch: variant.stretch,
                    unicodeRange: variant.unicodeRange,
                    display: variant.display ?? base.display,
                    src,
                };
            })
            .filter(Boolean);

        if (!variants.length) {
            errors.push(
                `${label}.variants is required for the "local" provider, and must list at least one variant.`
            );
            return null;
        }

        return { ...base, variants };
    }

    const styles = toArray(font.styles).length
        ? toArray(font.styles).map((style) => String(style).trim())
        : DEFAULT_STYLES;
    const invalidStyles = styles.filter(
        (style) => !["normal", "italic"].includes(style)
    );
    if (invalidStyles.length) {
        errors.push(
            `${label}.styles only supports "normal" and "italic", received: ${invalidStyles.join(", ")}.`
        );
        return null;
    }

    const weights = (
        toArray(font.weights).length ? toArray(font.weights) : DEFAULT_WEIGHTS
    ).map(normalizeWeight);

    const ranges = weights.filter((weight) => weight.css.includes(" "));
    if (ranges.length && !provider.variable) {
        errors.push(
            `${label}.weights uses the range ${ranges.map((weight) => `"${weight.css}"`).join(", ")}, which ${provider.label} does not serve. ${provider.note}`
        );
        return null;
    }

    return {
        ...base,
        styles,
        weights,
        subsets: provider.subsets
            ? toArray(font.subsets).length
                ? toArray(font.subsets).map(String)
                : DEFAULT_SUBSETS
            : [],
    };
}

/**
 * Validate and normalize the `fonts` array of hyva.config.json.
 *
 * @param {Array} fonts - Raw `fonts` config.
 * @returns {{ fonts: Object[], errors: string[] }}
 */
export function normalizeFonts(fonts) {
    if (!fonts) return { fonts: [], errors: [] };

    if (!Array.isArray(fonts)) {
        return { fonts: [], errors: ['"fonts" must be an array of font families.'] };
    }

    const errors = [];
    const normalized = fonts
        .map((font, index) => normalizeFont(font, index, errors))
        .filter(Boolean);

    const seen = new Set();
    for (const font of normalized) {
        if (seen.has(font.cssVariable)) {
            errors.push(
                `Duplicate cssVariable "${font.cssVariable}", set a unique cssVariable for "${font.name}".`
            );
        }
        seen.add(font.cssVariable);
    }

    return { fonts: normalized, errors };
}
