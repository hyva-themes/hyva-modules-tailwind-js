#!/usr/bin/env node
/**
 * Hyvä Themes - https://hyva.io
 * Copyright © Hyvä Themes. All rights reserved.
 * See COPYING.txt for license details.
 */

import path from "node:path";
import { argv, cwd, exit } from "node:process";
import { consoleError, consoleWarn, getJsonFile } from "../src/utils/index.js";
import { generateFonts } from "../src/fonts/index.js";

const currentFolderName = path.basename(cwd());
if (currentFolderName !== "tailwind") {
    consoleError(
        `Hyvä Fonts should be run from a "tailwind" directory\nto ensure everything is generated in the correct location.`
    );
    exit(1);
}

const force = argv.includes("--force");
const strict = argv.includes("--strict");
const hyvaConfig = getJsonFile("hyva.config.json");

try {
    const result = await generateFonts(hyvaConfig, { tailwindDir: cwd(), force });

    if (!result.families.length) {
        // A theme without a "fonts" key is not using this command, so it has
        // nothing to be told. An empty one was written on purpose.
        if (hyvaConfig.fonts) {
            consoleWarn(
                'The "fonts" in hyva.config.json is empty, generated an empty generated/hyva-fonts.css.'
            );
        }
        exit(0);
    }

    for (const warning of result.warnings) {
        consoleWarn(`Warning: ${warning}`);
    }

    if (result.removed.length) {
        consoleWarn(`Removed ${result.removed.length} unused font files from web/fonts/generated.`);
    }

    if (result.warnings.length && strict) {
        consoleError(
            `${result.warnings.length} font families could not be generated as configured.`
        );
        exit(1);
    }
} catch (err) {
    consoleError("Failed to generate hyva-fonts.css:\n" + (err?.message ?? err));
    exit(1);
}
