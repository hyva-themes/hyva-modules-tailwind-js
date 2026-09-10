/**
 * Hyvä Themes - https://hyva.io
 * Copyright © Hyvä Themes. All rights reserved.
 * See COPYING.txt for license details.
 */

import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Fonts you already have. There is nothing to request, so each variant lists
 * its own files, resolved against the theme's "web/fonts" folder.
 */
export default {
    id: "local",
    label: "Local",
    remote: false,
    subsets: false,
    variable: true,
    resolve(font, { fontsDir }) {
        const missing = [];

        const faces = font.variants.map((variant) => {
            for (const file of variant.src) {
                if (!existsSync(path.join(fontsDir, file))) missing.push(file);
            }

            return {
                family: font.name,
                style: variant.style,
                weight: variant.weight.css,
                stretch: variant.stretch,
                display: variant.display,
                unicodeRange: variant.unicodeRange,
                files: variant.src.map((file) => file.split(path.sep).join("/")),
            };
        });

        if (missing.length) {
            throw new Error(
                `Missing font files for "${font.name}" in ${fontsDir}:\n  ${missing.join("\n  ")}`
            );
        }

        return faces;
    },
};
