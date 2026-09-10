/**
 * Hyvä Themes - https://hyva.io
 * Copyright © Hyvä Themes. All rights reserved.
 * See COPYING.txt for license details.
 */

import { fetchCssFaces } from "./stylesheet.js";

/**
 * Build a request for the CSS2 API, which Google Fonts introduced and
 * Bunny Fonts implements as a drop in replacement.
 *
 * @param {string} endpoint - The API endpoint.
 * @param {Object} font - Normalized font family.
 * @returns {string} request URL
 */
export function buildRequestUrl(endpoint, font) {
    const family = font.name.trim().replace(/\s+/g, "+");
    const italic = font.styles.includes("italic");
    const normal = font.styles.includes("normal");
    const weights = font.weights.map((weight) => weight.api);

    let axis;
    if (italic) {
        const tuples = [];
        if (normal) tuples.push(...weights.map((weight) => `0,${weight}`));
        tuples.push(...weights.map((weight) => `1,${weight}`));
        axis = `ital,wght@${tuples.join(";")}`;
    } else {
        axis = `wght@${weights.join(";")}`;
    }

    return `${endpoint}?family=${family}:${axis}&display=${encodeURIComponent(font.display)}`;
}

/**
 * Create a provider backed by the CSS2 API.
 *
 * @param {Object} options
 * @param {string} options.id - The `provider` value in hyva.config.json.
 * @param {string} options.label - Human readable name, used in error messages.
 * @param {string} options.endpoint - The API endpoint.
 * @param {boolean} options.variable - Whether the endpoint serves variable fonts.
 * @param {string} [options.note] - Extra guidance shown with a validation error.
 * @returns {Object} provider
 */
export function createCss2Provider({ id, label, endpoint, variable, note }) {
    return {
        id,
        label,
        remote: true,
        subsets: true,
        variable,
        note,
        buildRequestUrl: (font) => buildRequestUrl(endpoint, font),
        resolve: (font, { fetchImpl }) =>
            fetchCssFaces(font, {
                url: buildRequestUrl(endpoint, font),
                label,
                fetchImpl,
            }),
    };
}
