/**
 * Hyvä Themes - https://hyva.io
 * Copyright © Hyvä Themes. All rights reserved.
 * See COPYING.txt for license details.
 */

import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { FONT_EXTENSIONS, normalizeFonts } from "./config.js";
import { getProvider } from "./providers/index.js";
import { renderFontsCss } from "./css.js";
import { PRELOAD_FILE, renderPreloadXml } from "./preload.js";
import { updateLayout } from "./layout.js";
import { buildFallbackFace } from "./fallback.js";
import {
    MANIFEST_FILE,
    cacheKey,
    facesArePresent,
    readManifest,
    writeManifest,
} from "./manifest.js";

export { normalizeFonts, slugify } from "./config.js";
export { renderFontsCss, renderFontFace } from "./css.js";
export { providers, providerIds } from "./providers/index.js";
export { MANIFEST_FILE, cacheKey } from "./manifest.js";
export { PRELOAD_FILE, LAYOUT_TARGET, MARKER_START, MARKER_END, renderPreloadXml } from "./preload.js";
export { injectPreload, updateLayout } from "./layout.js";

/**
 * Sub folder of "web/fonts" holding the downloaded font files,
 * so it is obvious to the user that its contents are generated.
 */
export const GENERATED_DIR = "generated";

/**
 * Path from the compiled stylesheet in "web/css" to the theme's "web/fonts".
 */
export const FONTS_URL_BASE = "../fonts";

const DOWNLOAD_CONCURRENCY = 6;

/**
 * Run an async worker over a list with a fixed number of parallel workers.
 *
 * @template T
 * @param {T[]} items
 * @param {number} limit
 * @param {(item: T) => Promise<void>} worker
 * @returns {Promise<void>}
 */
async function eachWithConcurrency(items, limit, worker) {
    let index = 0;
    const runners = Array.from(
        { length: Math.min(limit, items.length) },
        async () => {
            while (index < items.length) {
                await worker(items[index++]);
            }
        }
    );
    await Promise.all(runners);
}

/**
 * Build the file name a downloaded font file is stored under.
 *
 * @param {Object} font - Normalized font family.
 * @param {Object} face - Face returned by a remote provider.
 * @returns {string} file name, including its extension
 */
function downloadFileName(font, face) {
    const extension = face.url.split("?")[0].split(".").pop().toLowerCase();
    const weight = String(face.weight).trim().replace(/\s+/g, "-");
    return [font.slug, face.subset, weight, face.style]
        .filter(Boolean)
        .join("-")
        .concat(`.${extension}`);
}

/**
 * Download a font file, reporting failure instead of throwing so one
 * unreachable file cannot take the whole stylesheet down with it.
 *
 * @param {Object} download
 * @param {string} download.url
 * @param {string} download.file - Path relative to "web/fonts".
 * @param {Object} options
 * @param {string} options.fontsDir
 * @param {typeof fetch} options.fetchImpl
 * @param {Map<string, string>} options.failed - Collects file to reason.
 * @returns {Promise<void>}
 */
async function download({ url, file }, { fontsDir, fetchImpl, failed }) {
    try {
        const response = await fetchImpl(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await fs.writeFile(
            path.join(fontsDir, file),
            Buffer.from(await response.arrayBuffer())
        );
    } catch (error) {
        failed.set(file, `${url} (${error.message})`);
    }
}

/**
 * Resolve every configured family into faces.
 *
 * A family whose files are already on disk, and whose config has not changed
 * since they were fetched, is rebuilt from the manifest without touching the
 * network. Anything else is requested from its provider, and a provider that
 * cannot be reached falls back to the files already present. Only a family
 * with neither is dropped, with a warning, so the rest of the stylesheet is
 * still generated.
 *
 * @param {Object[]} fonts - Normalized font families.
 * @param {Object} options
 * @param {string} options.fontsDir - Absolute path to the theme's "web/fonts" folder.
 * @param {boolean} [options.force=false] - Ignore the manifest and re-download.
 * @param {typeof fetch} [options.fetchImpl] - Injectable fetch, used by the tests.
 * @returns {Promise<{ families: Object[], files: Set<string>, downloaded: number,
 *          cached: number, warnings: string[] }>}
 */
export async function resolveFonts(fonts, { fontsDir, force = false, fetchImpl = fetch }) {
    const generatedDir = path.join(fontsDir, GENERATED_DIR);
    const manifest = readManifest(generatedDir);
    // A variable font serves one file for every weight, so the same URL must
    // map to a single local file instead of one copy per face.
    const filesByUrl = new Map();
    const downloads = [];
    const families = [];
    const entries = {};
    const warnings = [];
    let cached = 0;

    for (const font of fonts) {
        const provider = getProvider(font.provider);
        const previous = manifest.families?.[font.cssVariable];
        const reusable =
            provider.remote &&
            previous?.key === cacheKey(font) &&
            facesArePresent(previous.faces, fontsDir);

        if (reusable && !force) {
            families.push({ ...font, faces: previous.faces });
            entries[font.cssVariable] = previous;
            cached++;
            continue;
        }

        try {
            const resolved = provider.remote
                ? await provider.resolve(font, { fetchImpl })
                : provider.resolve(font, { fontsDir });

            families.push({
                ...font,
                faces: resolved.map((face) => {
                    if (!provider.remote) return face;

                    let file = filesByUrl.get(face.url);
                    if (!file) {
                        file = `${GENERATED_DIR}/${downloadFileName(font, face)}`;
                        filesByUrl.set(face.url, file);
                        downloads.push({ url: face.url, file });
                    }
                    return { ...face, files: [file] };
                }),
            });
        } catch (error) {
            if (facesArePresent(previous?.faces, fontsDir)) {
                warnings.push(
                    `Could not reach ${provider.label} for "${font.name}", using the font files already in web/fonts/${GENERATED_DIR}.\n  ${error.message}`
                );
                families.push({ ...font, faces: previous.faces });
                entries[font.cssVariable] = previous;
                continue;
            }

            warnings.push(
                `Skipped "${font.name}", it has no font files and could not be resolved.\n  ${error.message}`
            );
            families.push({ ...font, faces: [] });
        }
    }

    const pending = downloads.filter(
        ({ file }) => force || !existsSync(path.join(fontsDir, file))
    );

    if (pending.length) await fs.mkdir(generatedDir, { recursive: true });

    const failed = new Map();
    await eachWithConcurrency(pending, DOWNLOAD_CONCURRENCY, (item) =>
        download(item, { fontsDir, fetchImpl, failed })
    );

    // Faces whose file never arrived are dropped rather than left pointing at
    // a URL that is not there, which would only surface as a 404 in the browser.
    for (const family of families) {
        const usable = family.faces.filter((face) =>
            face.files.every((file) => !failed.has(file))
        );

        if (usable.length !== family.faces.length) {
            const missing = family.faces
                .flatMap((face) => face.files)
                .filter((file) => failed.has(file));
            warnings.push(
                `Could not download ${missing.length} font file(s) for "${family.name}".\n  ${[...new Set(missing.map((file) => failed.get(file)))].join("\n  ")}`
            );
            family.faces = usable;
        }

        if (family.faces.length && getProvider(family.provider).remote) {
            entries[family.cssVariable] = {
                key: cacheKey(family),
                faces: family.faces,
            };
        }
    }

    await writeManifest(generatedDir, entries);

    return {
        families,
        files: new Set(
            Object.values(entries).flatMap((entry) =>
                entry.faces.flatMap((face) => face.files.map((file) => path.basename(file)))
            )
        ),
        downloaded: pending.length - failed.size,
        cached,
        warnings,
    };
}

/**
 * Delete files in "web/fonts/generated" that the current config no longer uses.
 *
 * @param {string} fontsDir - Absolute path to the theme's "web/fonts" folder.
 * @param {Set<string>} keep - File names to keep.
 * @returns {Promise<string[]>} removed file names
 */
export async function pruneGeneratedFonts(fontsDir, keep) {
    const generatedDir = path.join(fontsDir, GENERATED_DIR);
    if (!existsSync(generatedDir)) return [];

    const entries = await fs.readdir(generatedDir, { withFileTypes: true });
    const stale = entries
        .filter(
            (entry) =>
                entry.isFile() &&
                entry.name !== MANIFEST_FILE &&
                FONT_EXTENSIONS.includes(entry.name.split(".").pop().toLowerCase()) &&
                !keep.has(entry.name)
        )
        .map((entry) => entry.name);

    await Promise.all(
        stale.map((name) => fs.rm(path.join(generatedDir, name), { force: true }))
    );

    return stale;
}

/**
 * Generate the font stylesheet and font files for a theme.
 *
 * @param {Object} [config] - Parsed hyva.config.json.
 * @param {Object} options
 * @param {string} options.tailwindDir - Absolute path to the theme's "web/tailwind" folder.
 * @param {string} [options.fontsDir] - Absolute path to the theme's "web/fonts" folder.
 * @param {string} [options.themeDir] - Absolute path to the theme root, holding its layout files.
 * @param {boolean} [options.force=false] - Ignore the manifest and re-download.
 * @param {typeof fetch} [options.fetchImpl] - Injectable fetch, used by the tests.
 * @returns {Promise<{ css: string, preload: string|null, layout: Object|null,
 *          families: Object[], downloaded: number, cached: number,
 *          removed: string[], warnings: string[] }>}
 */
export async function generateFonts(
    config = {},
    {
        tailwindDir,
        fontsDir = path.resolve(tailwindDir, "../fonts"),
        themeDir = path.resolve(tailwindDir, "../.."),
        force = false,
        fetchImpl = fetch,
    }
) {
    const { fonts, errors } = normalizeFonts(config.fonts);

    if (errors.length) {
        throw new Error(`Invalid "fonts" configuration:\n  ${errors.join("\n  ")}`);
    }

    // An empty stylesheet is still written when nothing is configured, so a
    // theme that imports it keeps building after its last font is removed.
    const { families, files, downloaded, cached, warnings } = fonts.length
        ? await resolveFonts(fonts, { fontsDir, force, fetchImpl })
        : { families: [], files: new Set(), downloaded: 0, cached: 0, warnings: [] };

    const withUrls = families.map((family) => ({
        ...family,
        // Measured from the file on disk, so it works offline and covers a
        // local font just as well as one from a catalogue.
        fallbackFace:
            family.adjustFallback && family.faces.length
                ? buildFallbackFace(
                      family,
                      path.join(fontsDir, family.faces[0].files[0])
                  )
                : null,
        faces: family.faces.map((face) => ({
            ...face,
            // The configured name and font-display always win, so every
            // provider behaves the same, and the family in the @font-face can
            // never drift from the one the CSS variable refers to.
            family: family.name,
            display: face.display ?? family.display,
            files: face.files.map((file) => `${FONTS_URL_BASE}/${file}`),
        })),
    }));

    // Reuse the tokens selector, so a Tailwind v3 theme that generates its
    // tokens into ":root" gets its font variables in the same place.
    const css = renderFontsCss(withUrls, {
        cssSelector: config.tokens?.cssSelector,
    });

    const generatedDir = path.join(tailwindDir, "generated");
    await fs.mkdir(generatedDir, { recursive: true });
    await fs.writeFile(path.join(generatedDir, "hyva-fonts.css"), css);

    // Kept with the font files it points at rather than with the stylesheet,
    // and removed rather than left behind when nothing asks to be preloaded,
    // so a stale copy cannot be pasted into a theme long after the fact.
    const preload = renderPreloadXml(families);
    const preloadFile = path.join(fontsDir, GENERATED_DIR, PRELOAD_FILE);
    if (preload) {
        await fs.mkdir(path.join(fontsDir, GENERATED_DIR), { recursive: true });
        await fs.writeFile(preloadFile, preload);
    } else {
        await fs.rm(preloadFile, { force: true });
    }

    // Pruning needs to know the complete desired state. After a warning it is
    // not known, so the files stay put rather than risk deleting a font that
    // this run simply could not confirm.
    const removed = warnings.length ? [] : await pruneGeneratedFonts(fontsDir, files);

    // The markers in the theme's layout file are the opt in. Without them
    // nothing is touched, and the generated snippet is all the user gets.
    let layout = null;
    try {
        layout = await updateLayout(families, { themeDir });
    } catch (error) {
        warnings.push(
            `Could not update the preload hints in the theme's layout file.\n  ${error.message}`
        );
    }

    return { css, preload, layout, families: withUrls, downloaded, cached, removed, warnings };
}
