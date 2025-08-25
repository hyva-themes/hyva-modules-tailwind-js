#!/usr/bin/env node

import fs from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { cwd, exit } from "node:process";
import {
    consoleError,
    consoleWarn,
    consoleSuccess,
} from "../src/utils/index.js";

const sampleConfig = {
    tailwind: {
        include: [
            {
                src: "app/code",
            },
            {
                src: "vendor/hyva-themes/magento2-default-theme",
            },
        ],
        exclude: [],
    },
};
const configFilePath = path.join(cwd(), "hyva.config.json");

(async () => {
    try {
        await fs.access(configFilePath, constants.F_OK);
        consoleWarn("hyva.config.json already exists. Exiting.");
        exit(0);
    } catch (error) {
        if (error.code === "ENOENT") {
            try {
                await fs.writeFile(
                    configFilePath,
                    JSON.stringify(sampleConfig, null, 2)
                );
                consoleSuccess("hyva.config.json created successfully.");
            } catch (writeError) {
                consoleError(`Failed to write hyva.config.json: ${writeError}`);
                exit(1);
            }
        } else {
            consoleError(`Error checking for hyva.config.json: ${error}`);
            exit(1);
        }
    }
})();
