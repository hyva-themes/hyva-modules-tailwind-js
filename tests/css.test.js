/**
 * Hyvä Themes - https://hyva.io
 * Copyright © Hyvä Themes. All rights reserved.
 * See COPYING.txt for license details.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { compile } from "tailwindcss";

const __dirname = dirname(fileURLToPath(import.meta.url));
const cssDir = resolve(__dirname, "../css");
const req = createRequire(import.meta.url);

const loadStylesheet = async (id, base) => {
    let file;
    if (id.startsWith(".")) {
        file = resolve(base, id);
    } else {
        try {
            file = req.resolve(`${id}/index.css`);
        } catch {
            file = req.resolve(id);
        }
    }
    const content = await readFile(file, "utf8");
    return { content, base: dirname(file) };
};

const build = async (candidates = []) => {
    const result = await compile('@import "tailwindcss"; @import "./index.css";', {
        base: cssDir,
        loadStylesheet,
    });
    return result.build(candidates);
};

test("css builds without errors", async () => {
    const css = await build();
    assert.ok(css.length > 0, "build should produce output");
});

test("prose-headings variant scopes utilities to heading elements", async () => {
    const css = await build(["prose-headings:font-bold"]);
    assert.ok(
        css.includes(":where(h1, h2, h3, h4, h5, h6)"),
        "should scope to heading elements"
    );
});
