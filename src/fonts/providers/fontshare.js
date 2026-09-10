/**
 * Hyvä Themes - https://hyva.io
 * Copyright © Hyvä Themes. All rights reserved.
 * See COPYING.txt for license details.
 */

import { parseWeights } from "../api/faces.js";
import { fetchCssFaces } from "../api/stylesheet.js";

const ENDPOINT = "https://api.fontshare.com/v2/css";
const LABEL = "Fontshare";

/**
 * Build a Fontshare request.
 *
 * Fontshare identifies a variant by a number where the italic of a weight is
 * that weight plus one, so 400 is upright and 401 is italic.
 *
 * @param {Object} font - Normalized font family.
 * @returns {string} request URL
 */
export function buildRequestUrl(font) {
    const variants = font.styles.flatMap((style) =>
        font.weights.map(
            (weight) => Number(weight.api) + (style === "italic" ? 1 : 0)
        )
    );

    return `${ENDPOINT}?f[]=${font.id}@${[...new Set(variants)].sort((a, b) => a - b).join(",")}`;
}

/**
 * Fontshare drops variants it does not have instead of failing, so the
 * response is checked against what was asked for.
 *
 * @param {Object} font - Normalized font family.
 * @param {Object[]} faces - Resolved faces.
 * @returns {void}
 */
function assertComplete(font, faces) {
    const found = new Set(
        faces.map((face) => `${parseWeights(face.weight)[0]}-${face.style}`)
    );
    const missing = font.styles.flatMap((style) =>
        font.weights
            .filter((weight) => !found.has(`${Number(weight.api)}-${style}`))
            .map((weight) => `${weight.css} ${style}`)
    );

    if (missing.length) {
        throw new Error(
            `${LABEL} has no ${missing.join(", ")} for "${font.name}".\n${buildRequestUrl(font)}`
        );
    }
}

export default {
    id: "fontshare",
    label: LABEL,
    remote: true,
    // Fontshare serves one file per family covering every character it has.
    subsets: false,
    variable: false,
    note: "Fontshare serves static files only, list the weights you need instead of a range.",
    buildRequestUrl,
    async resolve(font, { fetchImpl }) {
        const faces = await fetchCssFaces(font, {
            url: buildRequestUrl(font),
            label: LABEL,
            fetchImpl,
            subsets: false,
        });
        assertComplete(font, faces);
        return faces;
    },
};
