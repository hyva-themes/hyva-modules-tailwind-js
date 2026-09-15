/**
 * Hyvä Themes - https://hyva.io
 * Copyright © Hyvä Themes. All rights reserved.
 * See COPYING.txt for license details.
 */

import { readMetrics } from "./metrics.js";

/**
 * Metrics of the fonts a visitor is likely to already have, measured with
 * the same code that measures a webfont so the two are comparable.
 *
 * Each entry lists the families that are metrically compatible with it, so
 * the adjusted face still matches on a machine without the first one.
 */
const SYSTEM_FONTS = {
    arial: {
        local: ["Arial", "Liberation Sans", "Arimo"],
        unitsPerEm: 2048, ascent: 1854, descent: -434, lineGap: 67, xWidthAvg: 904,
    },
    "times new roman": {
        local: ["Times New Roman", "Liberation Serif", "Tinos"],
        unitsPerEm: 2048, ascent: 1825, descent: -443, lineGap: 87, xWidthAvg: 819,
    },
    "courier new": {
        local: ["Courier New", "Liberation Mono", "Cousine"],
        unitsPerEm: 2048, ascent: 1705, descent: -615, lineGap: 0, xWidthAvg: 1229,
    },
    georgia: {
        local: ["Georgia", "Gelasio"],
        unitsPerEm: 2048, ascent: 1878, descent: -449, lineGap: 0, xWidthAvg: 899,
    },
    verdana: {
        local: ["Verdana", "DejaVu Sans"],
        unitsPerEm: 2048, ascent: 2059, descent: -430, lineGap: 0, xWidthAvg: 1041,
    },
    tahoma: {
        local: ["Tahoma"],
        unitsPerEm: 2048, ascent: 2049, descent: -423, lineGap: 0, xWidthAvg: 912,
    },
    "trebuchet ms": {
        local: ["Trebuchet MS"],
        unitsPerEm: 2048, ascent: 1923, descent: -455, lineGap: 0, xWidthAvg: 929,
    },
};

/** The font a generic family name stands in for when nothing else is named. */
const GENERIC_FONTS = {
    "sans-serif": "arial",
    "ui-sans-serif": "arial",
    "system-ui": "arial",
    serif: "times new roman",
    "ui-serif": "times new roman",
    monospace: "courier new",
    "ui-monospace": "courier new",
};

const percent = (value) => `${Math.round(value * 10000) / 100}%`;

/**
 * Choose which of a family's fallbacks to adjust.
 *
 * A named font is preferred over a generic one, since that is what the
 * visitor will actually see, and a generic stands in for a representative.
 *
 * @param {string[]} fallbacks - The configured font stack, without the family.
 * @returns {Object|null} the system font to match, or null when none is known
 */
export function pickFallback(fallbacks) {
    const named = fallbacks
        .map((name) => SYSTEM_FONTS[name.toLowerCase().replace(/^['"]|['"]$/g, "")])
        .find(Boolean);
    if (named) return named;

    const generic = fallbacks
        .map((name) => GENERIC_FONTS[name.toLowerCase()])
        .find(Boolean);
    return generic ? SYSTEM_FONTS[generic] : null;
}

/**
 * Build a face that makes a locally installed font take up the same space as
 * the webfont, so swapping one for the other does not move the page.
 *
 * @param {Object} family - Resolved family, with `faces` and `fallbacks`.
 * @param {string} file - Absolute path to the font file to measure.
 * @returns {Object|null} the adjusted face, or null when it cannot be built
 */
export function buildFallbackFace(family, file) {
    const fallback = pickFallback(family.fallbacks);
    if (!fallback) return null;

    const metrics = readMetrics(file);
    if (!metrics) return null;

    // How much wider or narrower the webfont is than the font standing in for
    // it. Everything else is expressed relative to that, since the overrides
    // apply to the already scaled font.
    const sizeAdjust =
        metrics.xWidthAvg / metrics.unitsPerEm / (fallback.xWidthAvg / fallback.unitsPerEm);
    const scaled = metrics.unitsPerEm * sizeAdjust;

    return {
        family: `${family.name} fallback`,
        local: fallback.local,
        sizeAdjust: percent(sizeAdjust),
        ascentOverride: percent(metrics.ascent / scaled),
        descentOverride: percent(Math.abs(metrics.descent) / scaled),
        lineGapOverride: percent(metrics.lineGap / scaled),
    };
}
