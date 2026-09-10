/**
 * Hyvä Themes - https://hyva.io
 * Copyright © Hyvä Themes. All rights reserved.
 * See COPYING.txt for license details.
 */

import fs from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Records what a provider resolved, so a later run can rebuild the stylesheet
 * from the files already on disk instead of asking the provider again.
 *
 * It lives next to the font files because it describes them, and is only
 * useful when the two travel together.
 */
export const MANIFEST_FILE = "hyva-fonts.json";

const MANIFEST_VERSION = 1;

/**
 * Identify the part of a family's config that decides which faces a provider
 * returns. Presentation options such as `fallbacks` are left out, since those
 * are applied when the stylesheet is rendered and never need a new request.
 *
 * @param {Object} font - Normalized font family.
 * @returns {string} cache key
 */
export function cacheKey(font) {
    return [
        font.provider,
        font.id,
        font.styles?.join(","),
        font.weights?.map((weight) => weight.api).join(","),
        font.subsets?.join(","),
    ].join("|");
}

/**
 * Read the manifest from a theme's font folder.
 *
 * @param {string} generatedDir - Absolute path to "web/fonts/generated".
 * @returns {Object} the manifest, or an empty one when it is absent or unusable
 */
export function readManifest(generatedDir) {
    const file = path.join(generatedDir, MANIFEST_FILE);
    if (!existsSync(file)) return { version: MANIFEST_VERSION, families: {} };

    try {
        const manifest = JSON.parse(readFileSync(file, "utf8"));
        if (manifest.version !== MANIFEST_VERSION) throw new Error("version");
        return manifest;
    } catch {
        return { version: MANIFEST_VERSION, families: {} };
    }
}

/**
 * Write the manifest to a theme's font folder.
 *
 * @param {string} generatedDir - Absolute path to "web/fonts/generated".
 * @param {Object.<string, Object>} families - Entries keyed by CSS variable.
 * @returns {Promise<void>}
 */
export async function writeManifest(generatedDir, families) {
    await fs.mkdir(generatedDir, { recursive: true });
    await fs.writeFile(
        path.join(generatedDir, MANIFEST_FILE),
        `${JSON.stringify({ version: MANIFEST_VERSION, families }, null, 2)}\n`
    );
}

/**
 * Check that every file a set of faces refers to is present.
 *
 * @param {Object[]} faces
 * @param {string} fontsDir - Absolute path to "web/fonts".
 * @returns {boolean} true when nothing is missing
 */
export const facesArePresent = (faces, fontsDir) =>
    faces?.length > 0 &&
    faces.every((face) =>
        face.files.every((file) => existsSync(path.join(fontsDir, file)))
    );
