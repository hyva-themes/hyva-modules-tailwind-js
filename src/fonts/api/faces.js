/**
 * Hyvä Themes - https://hyva.io
 * Copyright © Hyvä Themes. All rights reserved.
 * See COPYING.txt for license details.
 */

/**
 * Normalising the faces a provider resolved, whether it returned them as a
 * stylesheet or built them from a catalogue.
 */

/**
 * Read the numeric weights out of a `font-weight` value, which is either a
 * single weight ("400") or a variable range ("400 900").
 *
 * @param {string} value
 * @returns {number[]}
 */
export function parseWeights(value) {
    return String(value)
        .trim()
        .split(/\s+/)
        .map(Number)
        .filter((weight) => !Number.isNaN(weight));
}

/**
 * Collapse the faces of a variable font.
 *
 * A variable font is served as one file per subset and style covering the whole
 * weight axis, so a request for several weights returns the same URL over and
 * over. Those faces are merged into a single rule spanning the weight range.
 *
 * @param {Object[]} faces - Resolved faces.
 * @returns {Object[]} merged faces
 */
export function mergeVariableFaces(faces) {
    const merged = new Map();

    for (const face of faces) {
        const key = `${face.url}|${face.style}`;
        const existing = merged.get(key);

        if (!existing) {
            merged.set(key, { ...face, weights: parseWeights(face.weight) });
            continue;
        }

        existing.weights.push(...parseWeights(face.weight));
    }

    return [...merged.values()].map(({ weights, ...face }) => ({
        ...face,
        weight:
            Math.min(...weights) === Math.max(...weights)
                ? String(Math.min(...weights))
                : `${Math.min(...weights)} ${Math.max(...weights)}`,
    }));
}

/**
 * Sort faces so the generated stylesheet reads top down:
 * upright before italic, light before bold, subsets in the configured order.
 *
 * @param {Object[]} faces - Resolved faces.
 * @param {string[]} [subsets=[]] - Subsets in configuration order.
 * @returns {Object[]} sorted faces
 */
export function sortFaces(faces, subsets = []) {
    return [...faces].sort(
        (a, b) =>
            (a.style === "italic") - (b.style === "italic") ||
            parseWeights(a.weight)[0] - parseWeights(b.weight)[0] ||
            subsets.indexOf(a.subset) - subsets.indexOf(b.subset)
    );
}
