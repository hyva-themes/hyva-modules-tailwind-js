/**
 * Hyvä Themes - https://hyva.io
 * Copyright © Hyvä Themes. All rights reserved.
 * See COPYING.txt for license details.
 */

import fs from "node:fs";
import path from "node:path";
import { cwd } from "node:process";
import { consoleWarn } from "./console.js";

/**
 * Finds the base directory of the project by checking for the presence of
 * 'app' and 'vendor' directories. Synchronous for performance and consistency.
 *
 * @param {string} dir - The starting directory to search from.
 * @returns {string|false} - The path to the base directory or false if not found.
 */
export function getBasePath(dir) {
    let currentDir = dir;
    while (true) {
        const hasApp = fs.existsSync(path.join(currentDir, "app"));
        const hasVendor = fs.existsSync(path.join(currentDir, "vendor"));
        if (hasApp && hasVendor) {
            return currentDir;
        }
        const parentDir = path.resolve(currentDir, "..");
        if (path.normalize(parentDir) === path.normalize(currentDir)) {
            return false;
        }
        currentDir = parentDir;
    }
}

/**
 * Returns the base path of the project, which is the directory containing both 'app' and 'vendor'.
 */
export const basePath = getBasePath(cwd());

/**
 * Returns a relative path from the current working directory (or a target folder) to a source path in the base directory.
 *
 * @param {string} src - The source path relative to the base directory.
 * @param {string} [targetFolder] - Optional target folder relative to cwd.
 * @returns {string} Relative path.
 */
export const getRelativePath = (src, targetFolder = "") => {
    const fromPath = targetFolder ? path.join(cwd(), targetFolder) : cwd();
    return path.relative(fromPath, path.join(basePath, src));
};

/**
 * Reads a JSON file and returns its parsed content.
 * If the file cannot be read, it returns an empty object and optionally logs a warning.
 *
 * @param {string} file - JSON file name
 * @param {Object} [options]
 * @param {string} [options.filePath=cwd()] - Directory where the file is located
 * @param {string} [options.errorMessage] - Message to display if the file cannot be read
 * @returns {Object} Parsed JSON object or an empty object if the file cannot be read
 */
export function getJsonFile(
    file,
    { filePath = cwd(), errorMessage = "" } = {}
) {
    try {
        if (!filePath) return {};
        const fileContent = fs.readFileSync(path.join(filePath, file), "utf8");
        return JSON.parse(fileContent);
    } catch (error) {
        if (errorMessage) {
            consoleWarn(errorMessage);
        }
        return {};
    }
}
