/**
 * Hyvä Themes - https://hyva.io
 * Copyright © Hyvä Themes 2022-present. All rights reserved.
 * This library is distributed under the BSD-3-Clause license.
 */

const deepmerge = require('deepmerge')
const fs = require('fs')
const path = require('path');
const {cwd} = require('process');

// Determine Magento base dir by searching for parent dir containing an app/ and a vendor/ folder
const basePath = (function findBaseDirPath(dir) {
  const isBaseDir = fs.existsSync(path.join(dir, 'app')) && fs.existsSync(path.join(dir, 'vendor'))
  const bp = path.join(dir, '..')

  // FS root?
  if (path.normalize(bp) === path.normalize(dir)) {
    return false;
  }

  return isBaseDir ? dir : findBaseDirPath(bp);
})(cwd())

const hyvaThemeJsonInModule = 'app/etc/hyva-themes.json';

const tailwindDir = cwd();

// Global variable with prefix to use inside extensions tailwind.config.js file to require installed node modules.
// Usage example: const colors = require(`${themeDirRequire}/tailwindcss/colors`);
global.themeDirRequire = `${tailwindDir}/node_modules`

/**
 * Set the purge content as absolute paths on configClone in targetVersion structure
 */
function copyPurgeContentInTargetVersion(targetVersion, extensionConfig, configClone, pathToModule) {
  const pathsInModule = extensionConfig.purge && extensionConfig.purge.content
    ? extensionConfig.purge.content
    : (extensionConfig.content || []);

  if (pathsInModule.length === 0) {
    return;
  }

  // Prepend each content config record from module with the path to the module view/frontend/tailwind directory
  const fullPaths = pathsInModule.map(item => path.join(pathToModule, 'view/frontend/tailwind', item));

  // Set purge content in target version configuration structure
  if (targetVersion === 'v3') {
    configClone.content = fullPaths;
  } else {
    if (!configClone.purge) configClone.purge = {};
    configClone.purge.content = fullPaths;
  }
}

/**
 * Set the extensionConfig safelist on configClone in targetVersion structure
 */
function copySafelistInTargetVersion(targetVersion, extensionConfig, configClone) {
  const safelist = extensionConfig.purge && extensionConfig.purge.safelist
    ? extensionConfig.purge.safelist
    : (extensionConfig.safelist || []);

  if (safelist.length === 0) {
    return;
  }

  // Set safelist in target version configuration structure
  if (targetVersion === 'v3') {
    configClone.safelist = safelist;
  } else {
    if (!configClone.purge) configClone.purge = {};
    configClone.purge.safelist = safelist;
  }
}

function buildModuleConfigForVersion(targetVersion, extensionConfig, modulePath) {

  // Use a clone of the config object to avoid deepmerge concatenating the arrays multiple times.
  // The reason is require(moduleConfigFile) always returns the same instance on multiple calls,
  // and mutating it is a lasting side effect that affects the return value of subsequent
  // require() calls for the same file.

  // Create shallow clone of extensionConfig without content, safelist and purge
  const {content, safelist, purge, ...configClone} = extensionConfig;

  copyPurgeContentInTargetVersion(targetVersion, extensionConfig, configClone, modulePath);
  copySafelistInTargetVersion(targetVersion, extensionConfig, configClone);

  // Currently only purge.content and purge.safelist are supported.
  // Not supported configurations:
  // purge.enabled, purge.transform, purge.extract, purge.preserveHtmlElements, purge.layers, purge.mode
  // purge.options.*

  return configClone;
}

function mergeExtensionConfig(targetVersion, mergeTarget, extensionConfig, modulePath) {
  const toMerge = buildModuleConfigForVersion(targetVersion, extensionConfig, modulePath);

  return deepmerge(mergeTarget, toMerge);
}

/** @type {Object|boolean} */
const hyvaThemesConfig = basePath
  ? JSON.parse(fs.readFileSync(path.join(basePath, hyvaThemeJsonInModule)))
  : false;

/**
 * Add the full path to each path in a array
 *
 * @param {string[]} paths - to add the basePath to
 * @param {string} key - key from paths to use
 * @returns string[] | []
 */
function setFullPaths(paths, key = '') {
  return Object.values(paths || []).map((module) => path.join(basePath, key ? module[key] : module));
}

const hyvaModuleDirs = hyvaThemesConfig && setFullPaths(hyvaThemesConfig.extensions, 'src');

function mergeTailwindConfig(baseConfig) {

  if (!basePath) {
    // Since this is a new feature, we're not gonna display any error messages.
    // console.log(
    //     '\x1b[36mwarn\x1b[0m - File \'hyva-themes.json\' not found.',
    //     'Run \x1b[36mbin/magento hyva:config:generate\x1b[0m and try again.'
    // );
    return baseConfig;
  }

  // Tailwind v2 uses config.purge.content, v3 uses config.content.
  const targetTailwindVersion = baseConfig.purge ? 'v2' : 'v3';

  let mergeConfig = {};

  for (const modulePath of hyvaModuleDirs) {
    const moduleConfigFile = path.join(modulePath, 'view/frontend/tailwind/tailwind.config.js');

    if (fs.existsSync(moduleConfigFile)) {
      const extensionConfig = require(moduleConfigFile)

      // Merge the tailwind configuration from modules
      mergeConfig = mergeExtensionConfig(targetTailwindVersion, mergeConfig, extensionConfig, modulePath)
    }
  }

  // Merge theme config last so it takes precedence over all module configurations
  return deepmerge(mergeConfig, baseConfig)
}

/**
 * PostCSS plugin to import Tailwind CSS files from Hyva modules.
 *
 * @typedef {Object} PostCSSPlugin
 * @param {Object} opts - Options object.
 * @param {string[]} [opts.hyvaModuleDirs=[]] - Directories to search for Hyva modules.
 * @param {string[]} [opts.excludeDirs=[]] - Directories to exclude.
 * @returns {Object} PostCSS plugin object.
 */
const postcssImportHyvaModules = (opts = {}) => {
  const includeDirs = (opts.hyvaModuleDirs && setFullPaths(opts.hyvaModuleDirs)) || hyvaModuleDirs || [];
  const excludeDirs = (opts.excludeDirs && setFullPaths(opts.excludeDirs)) || [];
  const moduleDirs = includeDirs.filter((value) => !excludeDirs.includes(value));
  const cssPath = 'view/frontend/tailwind/tailwind-source.css';

  return {
    postcssPlugin: 'hyva-postcss-in-modules',
    Once(root, postcss) {
      moduleDirs.forEach((moduleDir) => {
        const moduleTailwindSourceCss = path.join(moduleDir, cssPath);

        if (fs.existsSync(moduleTailwindSourceCss)) {
          const importRule = new postcss.AtRule({name: 'import', params: `"${moduleTailwindSourceCss}"`});

          importRule.source = root.source;
          root.append(importRule);
        }
      });
    }
  }
};
postcssImportHyvaModules.postcss = true;

// For testing
mergeTailwindConfig.mergeExtensionConfig = mergeExtensionConfig;

module.exports = {
  // Function to merge TailwindCSS configurations from modules
  mergeTailwindConfig,
  // Postcss plugin to add @import nodes for all tailwind-source.css files in modules
  postcssImportHyvaModules,
  // Parsed contents of the app/etc/hyva-themes.json file (or false)
  hyvaThemesConfig,
  // Array of absolute paths to Hyvä modules
  hyvaModuleDirs
}
