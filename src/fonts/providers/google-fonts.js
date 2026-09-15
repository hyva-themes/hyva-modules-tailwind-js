/**
 * Hyvä Themes - https://hyva.io
 * Copyright © Hyvä Themes. All rights reserved.
 * See COPYING.txt for license details.
 */

import { createCss2Provider } from "../api/css2.js";

export default createCss2Provider({
    id: "google-fonts",
    label: "Google Fonts",
    endpoint: "https://fonts.googleapis.com/css2",
    variable: true,
});
