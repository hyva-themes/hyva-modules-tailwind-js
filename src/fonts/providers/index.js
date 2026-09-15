/**
 * Hyvä Themes - https://hyva.io
 * Copyright © Hyvä Themes. All rights reserved.
 * See COPYING.txt for license details.
 */

import googleFonts from "./google-fonts.js";
import bunnyFonts from "./bunny-fonts.js";
import fontshare from "./fontshare.js";
import fontsource from "./fontsource.js";
import local from "./local.js";

/**
 * Every provider, keyed by the `provider` value in hyva.config.json.
 *
 * A provider is a module in this folder default exporting an object with:
 *
 *   id        the `provider` value in hyva.config.json
 *   label     human readable name, used in error messages
 *   remote    whether resolving it needs the network
 *   subsets   whether the endpoint serves character subsets
 *   variable  whether the endpoint serves variable fonts
 *   note      extra guidance shown when a capability is missing
 *   resolve   (font, { fetchImpl } | { fontsDir }) => faces
 *
 * The capability flags are read during validation, so a config asking for
 * something a provider cannot do is refused before any request is made.
 *
 * A provider returns faces and nothing else. Downloading, naming, caching and
 * rendering are the same for all of them. Everything shared lives in ../api,
 * so a new endpoint that speaks the CSS2 syntax is a two line file built with
 * `createCss2Provider`, and one with its own shape still gets the stylesheet
 * parsing and face normalising for free.
 *
 * Adobe Fonts is deliberately absent, since its license does not allow the
 * font files to be self hosted.
 */
export const providers = Object.fromEntries(
    [googleFonts, bunnyFonts, fontshare, fontsource, local].map((provider) => [
        provider.id,
        provider,
    ])
);

export const providerIds = Object.keys(providers);

export const DEFAULT_PROVIDER = fontsource.id;

/**
 * Look up a provider.
 *
 * @param {string} id
 * @returns {Object|undefined} provider
 */
export const getProvider = (id) => providers[id];
