/**
 * Hyvä Themes - https://hyva.io
 * Copyright © Hyvä Themes. All rights reserved.
 * See COPYING.txt for license details.
 */

import { consoleError, consoleSuccess, consoleWarn } from "./console.js";
import { getBasePath, basePath, getRelativePath, getJsonFile } from "./file.js";
export {
    consoleError,
    consoleSuccess,
    consoleWarn,
    getBasePath,
    basePath,
    getRelativePath,
    getJsonFile,
};

export const cssVarRegex = /var\(--([a-zA-Z0-9-]+)\)/g;
export const tokenVarRegex = /\{([a-zA-Z0-9.-]+)\}/g;

/**
 * Convert a string to kebab case.
 *
 * @param {string} string
 * @returns {string} kebab case string
 */
export function kebabCase(string) {
	return string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * Flatten Object into a flat Object
 *
 * @source https://github.com/fylgja/fylgja/blob/main/props-builder/src/utils.js
 * @param {Object} obj - object to flatten
 * @param {string} separator - separator to use for the combined keys
 * @returns {Object} - flattened object
 */
export const flattenObj = (obj, separator = "-") => {
    let result = {};

    for (const i in obj) {
        if (typeof obj[i] === "object" && !Array.isArray(obj[i])) {
            const temp = flattenObj(obj[i]);
            for (const j in temp) {
                result[i + separator + j] = temp[j];
            }
        } else {
            result[i] = obj[i];
        }
    }

    return result;
};
