/**
 * Hyvä Themes - https://hyva.io
 * Copyright © Hyvä Themes. All rights reserved.
 * See COPYING.txt for license details.
 */

import { mergeVariableFaces, sortFaces } from "./faces.js";

// These endpoints serve woff2 only to user agents they recognise as modern browsers.
export const BROWSER_USER_AGENT =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const FONT_FACE_REGEX = /(?:\/\*\s*([^*]*?)\s*\*\/\s*)?@font-face\s*\{([^}]*)\}/g;
const SOURCE_REGEX =
    /url\(\s*(['"]?)([^'")]+)\1\s*\)(?:\s*format\(\s*(['"]?)([^'")]+)\3\s*\))?/g;

/**
 * Pick the woff2 entry out of a `src` declaration.
 * Some endpoints list several formats, and only woff2 is self hosted.
 *
 * @param {string} src - The `src` declaration value.
 * @returns {string|null} absolute URL, or null when there is no woff2
 */
export function pickWoff2(src) {
    const sources = [...src.matchAll(SOURCE_REGEX)].map(([, , url, , format]) => ({
        url: url.startsWith("//") ? `https:${url}` : url,
        format,
    }));
    const woff2 = sources.find((source) => source.format === "woff2");
    return woff2?.url ?? null;
}

/**
 * Parse the @font-face rules of a stylesheet served by a font endpoint.
 *
 * @param {string} css - The stylesheet.
 * @param {Object} [options]
 * @param {boolean} [options.subsets=true] - Read the subset from the comment
 *        above each rule. Endpoints without subsets put other text there.
 * @returns {Object[]} parsed faces
 */
export function parseFontFaces(css, { subsets = true } = {}) {
    const faces = [];

    for (const [, comment, body] of css.matchAll(FONT_FACE_REGEX)) {
        const declarations = {};
        for (const declaration of body.split(";")) {
            const separator = declaration.indexOf(":");
            if (separator === -1) continue;
            const property = declaration.slice(0, separator).trim().toLowerCase();
            declarations[property] = declaration.slice(separator + 1).trim();
        }

        const url = declarations.src && pickWoff2(declarations.src);
        if (!url) continue;

        faces.push({
            subset: subsets ? comment || "all" : undefined,
            family: declarations["font-family"]?.replace(/^['"]|['"]$/g, ""),
            style: declarations["font-style"] ?? "normal",
            weight: declarations["font-weight"] ?? "400",
            stretch: declarations["font-stretch"],
            unicodeRange: declarations["unicode-range"],
            url,
        });
    }

    return faces;
}

/**
 * Describe why an endpoint did not return the requested font.
 *
 * Google answers with an HTML error page, Bunny with a CSS comment and a 200
 * status, so both shapes are checked.
 *
 * @param {string} body - The response body.
 * @returns {string} a hint, or an empty string when the body looks fine
 */
export function describeFailure(body) {
    const comment = body.match(/Details:\s*([^*\n]+)/)?.[1]?.trim();
    if (comment) return comment;

    const title = body.match(/<title>([^<]+)<\/title>/)?.[1] ?? "";
    const requested = body.match(/Requested:\s*([^<]+)/)?.[1]?.trim() ?? "";
    return [title, requested && `Requested: ${requested}`].filter(Boolean).join(" - ");
}

/**
 * Request a stylesheet from a font endpoint and turn it into faces.
 *
 * @param {Object} font - Normalized font family.
 * @param {Object} options
 * @param {string} options.url - The request URL.
 * @param {string} options.label - The provider name, used in error messages.
 * @param {typeof fetch} options.fetchImpl
 * @param {boolean} [options.subsets=true] - Whether the endpoint serves subsets.
 * @returns {Promise<Object[]>} faces
 */
export async function fetchCssFaces(font, { url, label, fetchImpl, subsets = true }) {
    const response = await fetchImpl(url, {
        headers: { "user-agent": BROWSER_USER_AGENT },
    });
    const body = await response.text();
    const hint = describeFailure(body);

    if (!response.ok) {
        throw new Error(
            `${label} rejected "${font.name}" (HTTP ${response.status})${hint ? `: ${hint}` : "."}\n${url}`
        );
    }

    const faces = parseFontFaces(body, { subsets });

    if (!faces.length) {
        throw new Error(
            `${label} returned no woff2 files for "${font.name}"${hint ? `: ${hint}` : "."}\n${url}`
        );
    }

    if (!subsets) return sortFaces(mergeVariableFaces(faces));

    const wanted = faces.filter((face) => font.subsets.includes(face.subset));
    if (!wanted.length) {
        const available = [...new Set(faces.map((face) => face.subset))];
        throw new Error(
            `"${font.name}" has no ${font.subsets.join(", ")} subset. Available subsets: ${available.join(", ")}.`
        );
    }

    return sortFaces(mergeVariableFaces(wanted), font.subsets);
}
