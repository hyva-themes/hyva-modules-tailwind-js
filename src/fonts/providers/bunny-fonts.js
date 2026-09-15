/**
 * Hyvä Themes - https://hyva.io
 * Copyright © Hyvä Themes. All rights reserved.
 * See COPYING.txt for license details.
 */

import { createCss2Provider } from "../api/css2.js";

export default createCss2Provider({
    id: "bunny-fonts",
    label: "Bunny Fonts",
    endpoint: "https://fonts.bunny.net/css2",
    // Bunny mirrors the Google Fonts catalogue as static files, so a weight
    // range is expanded into one file per weight step instead of one axis.
    variable: false,
    note: "Bunny Fonts serves static files only, list the weights you need instead of a range.",
});
