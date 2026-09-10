/**
 * Hyvä Themes - https://hyva.io
 * Copyright © Hyvä Themes. All rights reserved.
 * See COPYING.txt for license details.
 */

import { mergeVariableFaces, sortFaces } from "../api/faces.js";

const API = "https://api.fontsource.org/v1";
const CDN = "https://cdn.jsdelivr.net/fontsource/fonts";
const LABEL = "Fontsource";

/**
 * Read JSON from the Fontsource API.
 *
 * @param {string} url
 * @param {typeof fetch} fetchImpl
 * @param {string} notFound - Message thrown on a 404.
 * @returns {Promise<Object>} parsed body
 */
async function getJson(url, fetchImpl, notFound) {
    const response = await fetchImpl(url);

    if (response.status === 404) throw new Error(notFound);
    if (!response.ok) {
        throw new Error(`${LABEL} returned HTTP ${response.status} for ${url}.`);
    }

    return response.json();
}

/**
 * Build the CDN URL of a single font file.
 *
 * @param {Object} options
 * @param {string} options.id - The Fontsource font id.
 * @param {string} options.subset
 * @param {string} options.style
 * @param {string|number} [options.weight] - Omitted for a variable font.
 * @returns {string} file URL
 */
export function buildFileUrl({ id, subset, style, weight }) {
    return weight === undefined
        ? `${CDN}/${id}:vf@latest/${subset}-wght-${style}.woff2`
        : `${CDN}/${id}@latest/${subset}-${weight}-${style}.woff2`;
}

/**
 * Fontsource publishes its catalogue as metadata rather than a stylesheet,
 * so the faces are built from the API response instead of parsed from CSS.
 */
export default {
    id: "fontsource",
    label: LABEL,
    remote: true,
    subsets: true,
    variable: true,
    async resolve(font, { fetchImpl }) {
        const id = font.id;
        const meta = await getJson(
            `${API}/fonts/${id}`,
            fetchImpl,
            `${LABEL} has no font with the id "${id}", derived from "${font.name}".\nSearch the catalogue at https://fontsource.org/`
        );

        const missingSubsets = font.subsets.filter(
            (subset) => !meta.subsets.includes(subset)
        );
        if (missingSubsets.length) {
            throw new Error(
                `"${font.name}" has no ${missingSubsets.join(", ")} subset. Available subsets: ${meta.subsets.join(", ")}.`
            );
        }

        const missingStyles = font.styles.filter(
            (style) => !meta.styles.includes(style)
        );
        if (missingStyles.length) {
            throw new Error(
                `"${font.name}" has no ${missingStyles.join(", ")} style. Available styles: ${meta.styles.join(", ")}.`
            );
        }

        const ranges = font.weights.filter((weight) => weight.css.includes(" "));
        if (ranges.length && !meta.variable) {
            throw new Error(
                `"${font.name}" is not a variable font, list the weights you need instead of a range. Available weights: ${meta.weights.join(", ")}.`
            );
        }

        const missingWeights = font.weights.filter(
            (weight) =>
                !weight.css.includes(" ") && !meta.weights.includes(Number(weight.api))
        );
        if (missingWeights.length) {
            throw new Error(
                `"${font.name}" has no ${missingWeights.map((weight) => weight.css).join(", ")} weight. Available weights: ${meta.weights.join(", ")}.`
            );
        }

        // A variable file always covers the full axis, so the range it is
        // declared with comes from the font rather than from the config.
        const axis = ranges.length
            ? (await getJson(`${API}/variable/${id}`, fetchImpl, `${LABEL} has no variable metadata for "${id}".`)).axes.wght
            : null;

        const faces = font.styles.flatMap((style) =>
            font.weights.flatMap((weight) =>
                font.subsets.map((subset) => {
                    const variable = weight.css.includes(" ");
                    return {
                        family: meta.family,
                        style,
                        weight: variable ? `${axis.min} ${axis.max}` : weight.css,
                        subset,
                        unicodeRange: meta.unicodeRange?.[subset],
                        url: buildFileUrl({
                            id,
                            subset,
                            style,
                            weight: variable ? undefined : weight.api,
                        }),
                    };
                })
            )
        );

        return sortFaces(mergeVariableFaces(faces), font.subsets);
    },
};
