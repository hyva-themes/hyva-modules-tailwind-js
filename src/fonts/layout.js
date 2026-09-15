/**
 * Hyvä Themes - https://hyva.io
 * Copyright © Hyvä Themes. All rights reserved.
 * See COPYING.txt for license details.
 */

import fs from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { LAYOUT_TARGET, MARKER_END, MARKER_START, fontElements } from "./preload.js";

const DEFAULT_INDENT = "        ";

const markerPattern = (name) => new RegExp(`<!--\\s*${name}\\s*-->`, "g");

/**
 * Read the indentation the start marker sits on, so the injected elements
 * line up with it. Falls back when the marker shares its line with something
 * else, since whatever precedes it is not indentation.
 *
 * @param {string} xml
 * @param {number} index - Offset of the start marker.
 * @returns {string} indentation
 */
function indentAt(xml, index) {
    const lineStart = xml.lastIndexOf("\n", index) + 1;
    const before = xml.slice(lineStart, index);
    return /^\s*$/.test(before) ? before : DEFAULT_INDENT;
}

/**
 * Replace the region between the two markers with the given lines.
 *
 * Only the bytes between the markers are ever touched. A layout file without
 * both markers is not opted in and is left alone, and anything ambiguous is
 * refused rather than guessed at, since a malformed layout file breaks the
 * whole storefront.
 *
 * @param {string} xml - The layout file.
 * @param {string[]} lines - Elements to place between the markers.
 * @returns {{ xml: string, changed: boolean }|null} null when not opted in
 * @throws {Error} when the markers are unusable
 */
export function injectPreload(xml, lines) {
    const starts = [...xml.matchAll(markerPattern(MARKER_START))];
    const ends = [...xml.matchAll(markerPattern(MARKER_END))];

    if (!starts.length && !ends.length) return null;

    if (starts.length !== 1 || ends.length !== 1) {
        throw new Error(
            `Expected one "${MARKER_START}" and one "${MARKER_END}" comment, found ${starts.length} and ${ends.length}.`
        );
    }

    const [start] = starts;
    const [end] = ends;
    const from = start.index + start[0].length;

    if (end.index < from) {
        throw new Error(
            `The "${MARKER_END}" comment comes before "${MARKER_START}".`
        );
    }

    const indent = indentAt(xml, start.index);
    const region = lines.length
        ? `\n${lines.map((line) => indent + line).join("\n")}\n${indent}`
        : `\n${indent}`;

    if (xml.slice(from, end.index) === region) return { xml, changed: false };

    return {
        xml: `${xml.slice(0, from)}${region}${xml.slice(end.index)}`,
        changed: true,
    };
}

/**
 * Keep the preload hints in a theme's layout file up to date.
 *
 * The markers are the opt in. A theme without them, or without the layout
 * file at all, is left untouched and told nothing, since the generated
 * snippet already explains how to opt in.
 *
 * @param {Object[]} families - Resolved families, with `files` relative to
 *        the theme's "web/fonts" folder.
 * @param {Object} options
 * @param {string} options.themeDir - Absolute path to the theme root.
 * @param {string} [options.file=LAYOUT_TARGET] - Layout file, relative to the theme.
 * @returns {Promise<{ file: string, count: number, changed: boolean }|null>} the
 *          state of the managed region, or null when the theme did not opt in
 * @throws {Error} when the markers are unusable
 */
export async function updateLayout(families, { themeDir, file = LAYOUT_TARGET }) {
    const layoutFile = path.join(themeDir, file);
    if (!existsSync(layoutFile)) return null;

    const lines = fontElements(families);
    const result = injectPreload(readFileSync(layoutFile, "utf8"), lines);

    if (!result) return null;

    if (result.changed) await fs.writeFile(layoutFile, result.xml);

    return {
        file,
        count: lines.filter((line) => line.startsWith("<font")).length,
        changed: result.changed,
    };
}
