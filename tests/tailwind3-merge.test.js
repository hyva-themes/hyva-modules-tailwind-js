/**
 * Hyvä Themes - https://hyva.io
 * Copyright © Hyvä Themes. All rights reserved.
 * See COPYING.txt for license details.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { mergeTailwindConfig, hyvaThemesConfig, hyvaModuleDirs } = require("../src/index.cjs");

const sut = mergeTailwindConfig;

const v2Target = {
    purge: {
        content: ["../../**/*.phtml", "../../../magento2-theme-module/src/view/frontend/templates/**/*.phtml"],
        safelist: ["a", "b"],
    },
};

const v2ConfigModule = {
    purge: {
        content: ["../templates/**/*.phtml"],
        safelist: ["c", "d"],
    },
};

const v3Target = {
    content: ["../../**/*.js", "../../../templates/**/*.phtml"],
    safelist: ["e", "f"],
};

const v3ConfigModule = {
    content: ["../layout/**/*.xml"],
    safelist: ["g", "h"],
};

test("Merges v2 into v2", () => {
    const result = sut.mergeExtensionConfig("v2", v2Target, v2ConfigModule, __dirname);
    assert.deepEqual(result.purge.content, [
        "../../**/*.phtml",
        "../../../magento2-theme-module/src/view/frontend/templates/**/*.phtml",
        `${__dirname}/view/frontend/templates/**/*.phtml`,
    ]);
    assert.deepEqual(result.purge.safelist, ["a", "b", "c", "d"]);
});

test("Merges v2 into v3", () => {
    const result = sut.mergeExtensionConfig("v3", v3Target, v2ConfigModule, __dirname);
    assert.deepEqual(result.content, [
        "../../**/*.js",
        "../../../templates/**/*.phtml",
        `${__dirname}/view/frontend/templates/**/*.phtml`,
    ]);
    assert.deepEqual(result.safelist, ["e", "f", "c", "d"]);
});

test("Merges v3 into v2", () => {
    const result = sut.mergeExtensionConfig("v2", v2Target, v3ConfigModule, __dirname);
    assert.deepEqual(result.purge.content, [
        "../../**/*.phtml",
        "../../../magento2-theme-module/src/view/frontend/templates/**/*.phtml",
        `${__dirname}/view/frontend/layout/**/*.xml`,
    ]);
    assert.deepEqual(result.purge.safelist, ["a", "b", "g", "h"]);
});

test("Merges v3 into v3", () => {
    const result = sut.mergeExtensionConfig("v3", v3Target, v3ConfigModule, __dirname);
    assert.deepEqual(result.content, [
        "../../**/*.js",
        "../../../templates/**/*.phtml",
        `${__dirname}/view/frontend/layout/**/*.xml`,
    ]);
    assert.deepEqual(result.safelist, ["e", "f", "g", "h"]);
});

test("Exports hyva themes config", () => {
    assert.notEqual(hyvaThemesConfig, undefined);
});

test("Exports hyva module dirs", () => {
    assert.notEqual(hyvaModuleDirs, undefined);
});
