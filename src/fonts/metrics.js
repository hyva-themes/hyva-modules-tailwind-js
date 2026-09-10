/**
 * Hyvä Themes - https://hyva.io
 * Copyright © Hyvä Themes. All rights reserved.
 * See COPYING.txt for license details.
 */

import { brotliDecompressSync } from "node:zlib";
import { readFileSync } from "node:fs";

/**
 * Reading the metrics a font declares about itself, so a fallback can be
 * adjusted to occupy the same space and the page does not shift when the
 * webfont arrives.
 */

// The 63 tags a woff2 table directory can refer to by index, in spec order.
const KNOWN_TAGS = [
    "cmap", "head", "hhea", "hmtx", "maxp", "name", "OS/2", "post",
    "cvt ", "fpgm", "glyf", "loca", "prep", "CFF ", "VORG", "EBDT",
    "EBLC", "gasp", "hdmx", "kern", "LTSH", "PCLT", "VDMX", "vhea",
    "vmtx", "BASE", "GDEF", "GPOS", "GSUB", "EBSC", "JSTF", "MATH",
    "CBDT", "CBLC", "COLR", "CPAL", "SVG ", "sbix", "acnt", "avar",
    "bdat", "bloc", "bsln", "cvar", "fdsc", "feat", "fmtx", "fvar",
    "gvar", "hsty", "just", "lcar", "mort", "morx", "opbd", "prop",
    "trak", "Zapf", "Silf", "Glat", "Gloc", "Feat", "Sill",
];

/**
 * How often each character appears in English, used to weight the average
 * character width. The OS/2 table has a field for this, but fonts disagree
 * on what it means, so it is measured from the advance widths instead.
 */
const WEIGHTINGS = {
    a: 0.0668, b: 0.0122, c: 0.0228, d: 0.0348, e: 0.1039, f: 0.0182,
    g: 0.0165, h: 0.0499, i: 0.057, j: 0.001, k: 0.0063, l: 0.033,
    m: 0.0197, n: 0.0552, o: 0.0614, p: 0.0158, q: 0.0008, r: 0.049,
    s: 0.0518, t: 0.0741, u: 0.0226, v: 0.008, w: 0.0193, x: 0.0015,
    y: 0.0161, z: 0.0007, " ": 0.1818,
};

const WEIGHTING_TOTAL = Object.values(WEIGHTINGS).reduce((sum, n) => sum + n, 0);

/**
 * Read a UIntBase128, the variable length integer a woff2 directory uses.
 *
 * @param {Buffer} buf
 * @param {number} pos
 * @returns {[number, number]} the value and the position after it
 */
function readBase128(buf, pos) {
    let value = 0;
    for (let i = 0; i < 5; i++) {
        const byte = buf[pos++];
        value = (value << 7) | (byte & 0x7f);
        if ((byte & 0x80) === 0) return [value, pos];
    }
    throw new Error("Invalid UIntBase128");
}

/**
 * Split a woff2 into its tables.
 *
 * Everything is Brotli compressed as one stream, and the directory gives the
 * length of each table within it. `glyf` and `loca` are stored transformed,
 * which does not matter here since the metrics live elsewhere.
 *
 * @param {Buffer} buf
 * @returns {Object.<string, Buffer>} tables by tag
 */
function readWoff2(buf) {
    const numTables = buf.readUInt16BE(12);
    const totalCompressedSize = buf.readUInt32BE(20);
    const entries = [];
    let pos = 48;

    for (let i = 0; i < numTables; i++) {
        const flags = buf[pos++];
        const index = flags & 0x3f;
        let tag;

        if (index === 63) {
            tag = buf.toString("latin1", pos, pos + 4).trim();
            pos += 4;
        } else {
            tag = KNOWN_TAGS[index].trim();
        }

        let length;
        [length, pos] = readBase128(buf, pos);

        const version = flags >> 6;
        const transformed =
            tag === "glyf" || tag === "loca" ? version === 0 : version !== 0;
        if (transformed) [length, pos] = readBase128(buf, pos);

        entries.push({ tag, length, transformed });
    }

    const data = brotliDecompressSync(buf.subarray(pos, pos + totalCompressedSize));
    const tables = {};
    let offset = 0;

    for (const entry of entries) {
        // A transformed table is not in the layout this reads, so it is skipped
        // rather than handed over in a shape the caller cannot use.
        if (!entry.transformed) {
            tables[entry.tag] = data.subarray(offset, offset + entry.length);
        }
        offset += entry.length;
    }

    return tables;
}

/**
 * Split a plain TrueType or OpenType font into its tables.
 *
 * @param {Buffer} buf
 * @returns {Object.<string, Buffer>} tables by tag
 */
function readSfnt(buf) {
    const numTables = buf.readUInt16BE(4);
    const tables = {};

    for (let i = 0; i < numTables; i++) {
        const entry = 12 + i * 16;
        const tag = buf.toString("latin1", entry, entry + 4).trim();
        const offset = buf.readUInt32BE(entry + 8);
        tables[tag] = buf.subarray(offset, offset + buf.readUInt32BE(entry + 12));
    }

    return tables;
}

/**
 * Look a code point up in a format 4 cmap subtable.
 *
 * @param {Buffer} table
 * @param {number} code
 * @returns {number} glyph id, 0 when absent
 */
function lookupFormat4(table, code) {
    const segCount = table.readUInt16BE(6) / 2;
    const end = 14;
    const start = end + segCount * 2 + 2;
    const delta = start + segCount * 2;
    const range = delta + segCount * 2;

    for (let i = 0; i < segCount; i++) {
        if (table.readUInt16BE(end + i * 2) < code) continue;
        if (table.readUInt16BE(start + i * 2) > code) return 0;

        const rangeOffset = table.readUInt16BE(range + i * 2);
        if (rangeOffset === 0) {
            return (code + table.readInt16BE(delta + i * 2)) & 0xffff;
        }

        const at =
            range + i * 2 + rangeOffset + (code - table.readUInt16BE(start + i * 2)) * 2;
        const glyph = table.readUInt16BE(at);
        return glyph === 0 ? 0 : (glyph + table.readInt16BE(delta + i * 2)) & 0xffff;
    }

    return 0;
}

/**
 * Look a code point up in a format 12 cmap subtable.
 *
 * @param {Buffer} table
 * @param {number} code
 * @returns {number} glyph id, 0 when absent
 */
function lookupFormat12(table, code) {
    const groups = table.readUInt32BE(12);

    for (let i = 0; i < groups; i++) {
        const group = 16 + i * 12;
        if (code >= table.readUInt32BE(group) && code <= table.readUInt32BE(group + 4)) {
            return table.readUInt32BE(group + 8) + (code - table.readUInt32BE(group));
        }
    }

    return 0;
}

/**
 * Pick the Unicode cmap subtable to read code points from.
 *
 * @param {Buffer} cmap
 * @returns {{ table: Buffer, format: number }|null}
 */
function unicodeSubtable(cmap) {
    let chosen = null;

    for (let i = 0; i < cmap.readUInt16BE(2); i++) {
        const record = 4 + i * 8;
        const platform = cmap.readUInt16BE(record);
        const encoding = cmap.readUInt16BE(record + 2);
        const isUnicode =
            platform === 0 || (platform === 3 && (encoding === 1 || encoding === 10));
        if (!isUnicode) continue;

        const table = cmap.subarray(cmap.readUInt32BE(record + 4));
        const format = table.readUInt16BE(0);
        // Format 12 covers the whole range, so it wins when both are present.
        if (format === 12) chosen = { table, format };
        else if (format === 4 && !chosen) chosen = { table, format };
    }

    return chosen;
}

/**
 * Measure the average character width, weighted by how often each character
 * appears in English.
 *
 * @param {Object.<string, Buffer>} tables
 * @returns {number|null} width in font units, or null when it cannot be read
 */
function averageWidth(tables) {
    const { cmap, hmtx, hhea } = { cmap: tables.cmap, hmtx: tables.hmtx, hhea: tables.hhea };
    if (!cmap || !hmtx || !hhea) return null;

    const subtable = unicodeSubtable(cmap);
    if (!subtable) return null;

    const numHMetrics = hhea.readUInt16BE(34);
    let total = 0;

    for (const [character, weight] of Object.entries(WEIGHTINGS)) {
        const glyph =
            subtable.format === 12
                ? lookupFormat12(subtable.table, character.codePointAt(0))
                : lookupFormat4(subtable.table, character.codePointAt(0));
        if (!glyph) return null;

        const at = Math.min(glyph, numHMetrics - 1) * 4;
        if (at + 2 > hmtx.length) return null;
        total += hmtx.readUInt16BE(at) * weight;
    }

    return Math.round(total / WEIGHTING_TOTAL);
}

/**
 * Read the metrics of a font file.
 *
 * @param {string} file - Absolute path to a woff2, ttf or otf.
 * @returns {{ unitsPerEm: number, ascent: number, descent: number,
 *          lineGap: number, xWidthAvg: number }|null} null when unreadable
 */
export function readMetrics(file) {
    try {
        const buf = readFileSync(file);
        const signature = buf.toString("latin1", 0, 4);

        if (signature === "wOFF") return null;
        const tables = signature === "wOF2" ? readWoff2(buf) : readSfnt(buf);

        const head = tables.head;
        const hhea = tables.hhea;
        const os2 = tables["OS/2"];
        if (!head || !hhea) return null;

        // A font sets USE_TYPO_METRICS when its OS/2 typo values are the ones
        // it wants line boxes built from, otherwise hhea is authoritative.
        const useTypo = os2 && os2.readUInt16BE(62) & (1 << 7);
        const xWidthAvg = averageWidth(tables);
        if (!xWidthAvg) return null;

        return {
            unitsPerEm: head.readUInt16BE(18),
            ascent: useTypo ? os2.readInt16BE(68) : hhea.readInt16BE(4),
            descent: useTypo ? os2.readInt16BE(70) : hhea.readInt16BE(6),
            lineGap: useTypo ? os2.readInt16BE(72) : hhea.readInt16BE(8),
            xWidthAvg,
        };
    } catch {
        return null;
    }
}
