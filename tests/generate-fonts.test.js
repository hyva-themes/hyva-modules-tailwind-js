/**
 * Hyvä Themes - https://hyva.io
 * Copyright © Hyvä Themes. All rights reserved.
 * See COPYING.txt for license details.
 */

import { test, describe, beforeEach, after } from "node:test";
import { spawn } from "node:child_process";
import { brotliCompressSync } from "node:zlib";
import assert from "node:assert/strict";
import { readFile, readdir, rm, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeFonts, slugify } from "../src/fonts/config.js";
import { mergeVariableFaces } from "../src/fonts/api/faces.js";
import { parseFontFaces } from "../src/fonts/api/stylesheet.js";
import { providers } from "../src/fonts/providers/index.js";
import { generateFonts } from "../src/fonts/index.js";
import { readMetrics } from "../src/fonts/metrics.js";
import { buildFallbackFace, pickFallback } from "../src/fonts/fallback.js";
import { renderFallbackFace } from "../src/fonts/css.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const themeDir = resolve(__dirname, "fixtures/fonts-theme");
const tailwindDir = resolve(themeDir, "web/tailwind");
const fontsDir = resolve(themeDir, "web/fonts");
const generatedDir = resolve(fontsDir, "generated");
const cssFile = resolve(tailwindDir, "generated/hyva-fonts.css");

const googleFontsCss = `
/* latin-ext */
@font-face {
  font-family: 'Acme Sans';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/acmesans/v1/latin-ext-400.woff2) format('woff2');
  unicode-range: U+0100-02BA;
}
/* latin */
@font-face {
  font-family: 'Acme Sans';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/acmesans/v1/latin-400.woff2) format('woff2');
  unicode-range: U+0000-00FF;
}
/* latin */
@font-face {
  font-family: 'Acme Sans';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/acmesans/v1/latin-700.woff2) format('woff2');
  unicode-range: U+0000-00FF;
}
/* latin */
@font-face {
  font-family: 'Acme Sans';
  font-style: italic;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/acmesans/v1/latin-400-italic.woff2) format('woff2');
  unicode-range: U+0000-00FF;
}
`;

/**
 * Keep only the @font-face rules matching the axis of a CSS2 request,
 * so the mock responds like the real API instead of serving every rule.
 *
 * @param {string} url - The CSS2 request URL.
 * @returns {string} stylesheet
 */
const respondToAxis = (url) => {
    const axis = decodeURIComponent(url).split(":")[2].split("&")[0];
    const wanted = new Set(
        axis.replace(/^(?:ital,)?wght@/, "").split(";").map((tuple) => {
            const [italic, weight] = tuple.includes(",")
                ? tuple.split(",")
                : ["0", tuple];
            return `${italic === "1" ? "italic" : "normal"}-${weight}`;
        })
    );

    return googleFontsCss
        .split(/(?=\/\* )/)
        .filter((rule) => {
            const style = rule.match(/font-style:\s*(\w+)/)?.[1];
            const weight = rule.match(/font-weight:\s*([\d ]+)/)?.[1]?.trim();
            return wanted.has(`${style}-${weight}`);
        })
        .join("");
};

/** Records every request, serves the stylesheet above and dummy font files. */
const createFetchMock = () => {
    const requests = [];
    const fetchImpl = async (url) => {
        requests.push(url);
        if (url.startsWith("https://fonts.googleapis.com")) {
            return { ok: true, status: 200, text: async () => respondToAxis(url) };
        }
        return {
            ok: true,
            status: 200,
            arrayBuffer: async () => new TextEncoder().encode(url).buffer,
        };
    };
    return { fetchImpl, requests };
};

/** The font files in web/fonts/generated, without the manifest. */
const fontFiles = async () =>
    (await readdir(generatedDir)).filter((file) => file.endsWith(".woff2")).sort();

/**
 * Assert that a run warned about something instead of failing outright.
 *
 * @param {Object} result - The result of `run`.
 * @param {RegExp} expected - Pattern the warning must match.
 * @returns {void}
 */
const assertWarns = (result, expected) => {
    assert.equal(result.warnings.length, 1, `expected one warning, got ${JSON.stringify(result.warnings)}`);
    assert.match(result.warnings[0], expected);
};

const run = (config, options = {}) => {
    const { fetchImpl, requests } = options.mock ?? createFetchMock();
    return generateFonts(config, { tailwindDir, fontsDir, fetchImpl, ...options }).then(
        (result) => (result ? { ...result, requests } : result)
    );
};

beforeEach(async () => {
    await rm(themeDir, { recursive: true, force: true });
    await mkdir(tailwindDir, { recursive: true });
    await mkdir(fontsDir, { recursive: true });
});

after(async () => {
    await rm(themeDir, { recursive: true, force: true });
});

describe("config", () => {
    test("derives a css variable from the font name", () => {
        const { fonts } = normalizeFonts([{ name: "IBM Plex Sans" }]);
        assert.equal(fonts[0].cssVariable, "--font-ibm-plex-sans");
    });

    test("keeps an explicit css variable and adds the missing dashes", () => {
        const { fonts } = normalizeFonts([
            { name: "Roboto", cssVariable: "--font-body" },
            { name: "Lora", cssVariable: "font-heading" },
        ]);
        assert.equal(fonts[0].cssVariable, "--font-body");
        assert.equal(fonts[1].cssVariable, "--font-heading");
    });

    test("defaults to fontsource, normal, 400 and the latin subset", () => {
        const { fonts } = normalizeFonts([{ name: "Roboto" }]);
        assert.equal(fonts[0].provider, "fontsource");
        assert.deepEqual(fonts[0].styles, ["normal"]);
        assert.deepEqual(
            fonts[0].weights.map((weight) => weight.css),
            ["400"]
        );
        assert.deepEqual(fonts[0].subsets, ["latin"]);
        assert.equal(fonts[0].display, "swap");
    });

    test("reads a weight range as a variable font axis", () => {
        const { fonts } = normalizeFonts([{ name: "Roboto", weights: ["300 700"] }]);
        assert.equal(fonts[0].weights[0].api, "300..700");
        assert.equal(fonts[0].weights[0].css, "300 700");
    });

    test("reports every invalid entry at once", () => {
        const { errors } = normalizeFonts([
            { provider: "typekit", name: "Roboto" },
            { name: "" },
            { name: "Lora", styles: ["oblique"] },
            { provider: "local", name: "Acme" },
        ]);
        assert.equal(errors.length, 4);
        assert.match(errors[0], /provider "typekit" is not supported/);
        assert.match(errors[1], /name is required/);
        assert.match(errors[2], /only supports "normal" and "italic"/);
        assert.match(errors[3], /variants is required/);
    });

    test("reports duplicate css variables", () => {
        const { errors } = normalizeFonts([{ name: "Roboto" }, { name: "roboto" }]);
        assert.match(errors[0], /Duplicate cssVariable "--font-roboto"/);
    });

    test("derives the provider id from the name, and lets id override it", () => {
        const { fonts } = normalizeFonts([
            { name: "IBM Plex Sans" },
            { name: "Acme", cssVariable: "--font-acme-two", id: "acme-grotesk" },
        ]);
        assert.equal(fonts[0].id, "ibm-plex-sans");
        assert.equal(fonts[1].id, "acme-grotesk");
    });

    test("slugifies on the separators in the name, not inside a word", () => {
        assert.equal(slugify("Jost*"), "jost");
        assert.equal(slugify("Crète Sans"), "crete-sans");
        assert.equal(slugify("JetBrains Mono"), "jetbrains-mono");
        assert.equal(slugify("DejaVu Sans"), "dejavu-sans");
        assert.equal(slugify("iA Writer Duo"), "ia-writer-duo");
    });
});

describe("css2 api", () => {
    const font = (overrides) =>
        normalizeFonts([{ provider: "google-fonts", name: "Acme Sans", ...overrides }]).fonts[0];
    const buildRequestUrl = (value) => providers["google-fonts"].buildRequestUrl(value);

    test("requests a single axis when there is no italic", () => {
        assert.match(
            buildRequestUrl(font({ weights: ["400", "700"] })),
            /family=Acme\+Sans:wght@400;700&display=swap$/
        );
    });

    test("requests ital tuples when italic is included", () => {
        assert.match(
            buildRequestUrl(font({ weights: ["400", "700"], styles: ["normal", "italic"] })),
            /family=Acme\+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap$/
        );
    });

    test("merges the faces of a variable font into one weight range", () => {
        const faces = mergeVariableFaces([
            { url: "a.woff2", style: "normal", weight: "300" },
            { url: "a.woff2", style: "normal", weight: "700" },
            { url: "b.woff2", style: "italic", weight: "400" },
        ]);
        assert.equal(faces.length, 2);
        assert.equal(faces[0].weight, "300 700");
        assert.equal(faces[1].weight, "400");
    });

    test("reads the subset from the comment above each rule", () => {
        const faces = parseFontFaces(googleFontsCss);
        assert.deepEqual(
            [...new Set(faces.map((face) => face.subset))],
            ["latin-ext", "latin"]
        );
        assert.equal(faces[0].family, "Acme Sans");
        assert.equal(faces[0].unicodeRange, "U+0100-02BA");
    });
});

describe("generate", () => {
    test("writes an empty stylesheet when no fonts are configured", async () => {
        const result = await run({});

        assert.deepEqual(result.families, []);
        const css = await readFile(cssFile, "utf8");
        assert.ok(css.includes("No \"fonts\" are configured"), "should explain why it is empty");
        assert.ok(!css.includes("@font-face"));
        assert.ok(!css.includes("@theme"));
    });

    test("throws on an invalid configuration", async () => {
        await assert.rejects(
            () => run({ fonts: [{ name: "Roboto", styles: ["oblique"] }] }),
            /Invalid "fonts" configuration/
        );
    });

    test("downloads the font files into web/fonts/generated", async () => {
        const result = await run({
            fonts: [{ provider: "google-fonts", name: "Acme Sans", weights: ["400", "700"], styles: ["normal", "italic"] }],
        });

        assert.equal(result.downloaded, 3);
        assert.deepEqual(await fontFiles(), [
            "acme-sans-latin-400-italic.woff2",
            "acme-sans-latin-400-normal.woff2",
            "acme-sans-latin-700-normal.woff2",
        ]);
    });

    test("references the fonts relative to the compiled stylesheet in web/css", async () => {
        await run({ fonts: [{ provider: "google-fonts", name: "Acme Sans" }] });
        const css = await readFile(cssFile, "utf8");
        assert.ok(
            css.includes('src: url("../fonts/generated/acme-sans-latin-400-normal.woff2") format("woff2")'),
            "should point at ../fonts/generated"
        );
    });

    test("exposes every family as a theme variable", async () => {
        await run({
            fonts: [
                { provider: "google-fonts", name: "Acme Sans" },
                {
                    provider: "google-fonts",
                    name: "Acme Sans",
                    cssVariable: "--font-heading",
                    fallbacks: ["Georgia", "serif"],
                },
            ],
        });
        const css = await readFile(cssFile, "utf8");
        assert.ok(css.includes("@theme {"), "should contain @theme selector");
        assert.ok(css.includes('--font-acme-sans: "Acme Sans", sans-serif;'));
        assert.ok(css.includes('--font-heading: "Acme Sans", Georgia, serif;'));
    });

    test("puts a family in its own cssSelector when it names one", async () => {
        await run({
            fonts: [
                { provider: "google-fonts", name: "Acme Sans" },
                {
                    provider: "google-fonts",
                    name: "Acme Sans",
                    cssVariable: "--h-family",
                    cssSelector: ".prose",
                    fallbacks: ["serif"],
                },
            ],
        });

        const css = await readFile(cssFile, "utf8");
        assert.ok(
            css.includes('@theme {\n    --font-acme-sans: "Acme Sans", sans-serif;\n}'),
            "the default selector keeps the families that did not name one"
        );
        assert.ok(
            css.includes('.prose {\n    --h-family: "Acme Sans", serif;\n}'),
            "the named selector gets its own block"
        );
    });

    test("groups families that share a cssSelector into one block", async () => {
        await run({
            fonts: [
                { provider: "google-fonts", name: "Acme Sans", cssSelector: ".prose" },
                {
                    provider: "google-fonts",
                    name: "Acme Sans",
                    cssVariable: "--h-family",
                    cssSelector: ".prose",
                },
            ],
        });

        const css = await readFile(cssFile, "utf8");
        assert.equal(css.match(/\.prose \{/g).length, 1, "should emit one block");
        assert.ok(css.includes("--font-acme-sans:"));
        assert.ok(css.includes("--h-family:"));
        assert.ok(!css.includes("@theme"), "nothing is left for the default selector");
    });

    test("does not ask the provider again when only the cssSelector changed", async () => {
        const font = { provider: "google-fonts", name: "Acme Sans" };
        await run({ fonts: [font] });
        const second = await run(
            { fonts: [{ ...font, cssSelector: ":root" }] },
            { mock: { fetchImpl: async () => { throw new Error("offline"); }, requests: [] } }
        );

        assert.equal(second.cached, 1);
        assert.ok((await readFile(cssFile, "utf8")).includes(":root {"));
    });

    test("follows the tokens cssSelector for Tailwind v3 themes", async () => {
        await run({ tokens: { cssSelector: ":root" }, fonts: [{ provider: "google-fonts", name: "Acme Sans" }] });
        const css = await readFile(cssFile, "utf8");
        assert.ok(css.includes(":root {"), "should contain :root selector");
    });

    test("skips files that were already downloaded", async () => {
        const config = { fonts: [{ provider: "google-fonts", name: "Acme Sans" }] };
        await run(config);
        const second = await run(config);

        assert.equal(second.downloaded, 0);
        assert.equal(
            second.requests.filter((url) => url.includes("gstatic")).length,
            0,
            "should not re-download font files"
        );
    });

    test("re-downloads when forced", async () => {
        const config = { fonts: [{ provider: "google-fonts", name: "Acme Sans" }] };
        await run(config);
        assert.equal((await run(config, { force: true })).downloaded, 1);
    });

    test("removes font files the configuration no longer uses", async () => {
        await mkdir(generatedDir, { recursive: true });
        await writeFile(resolve(generatedDir, "old-font.woff2"), "stale");

        const result = await run({ fonts: [{ provider: "google-fonts", name: "Acme Sans" }] });

        assert.deepEqual(result.removed, ["old-font.woff2"]);
        assert.ok(!(await fontFiles()).includes("old-font.woff2"));
    });

    test("leaves local font files alone", async () => {
        await writeFile(resolve(fontsDir, "acme-icons.woff2"), "font");
        await writeFile(resolve(fontsDir, "acme-icons.woff"), "font");

        const result = await run({
            fonts: [
                {
                    provider: "local",
                    name: "Acme Icons",
                    fallbacks: [],
                    variants: [{ weight: "400", src: ["acme-icons.woff2", "acme-icons.woff"] }],
                },
            ],
        });

        assert.equal(result.downloaded, 0);
        assert.equal(result.requests.length, 0, "local fonts should not hit the network");

        const css = await readFile(cssFile, "utf8");
        assert.ok(
            css.includes(
                'src: url("../fonts/acme-icons.woff2") format("woff2"),\n         url("../fonts/acme-icons.woff") format("woff")'
            ),
            "should list both formats in source order"
        );
        assert.ok(css.includes('--font-acme-icons: "Acme Icons";'));
    });

    test("warns and drops the family when a local font file is missing", async () => {
        const result = await run({
            fonts: [
                {
                    provider: "local",
                    name: "Acme Icons",
                    variants: [{ src: "acme-icons.woff2" }],
                },
            ],
        });

        assertWarns(result, /Skipped "Acme Icons".*Missing font files/s);
        const css = await readFile(cssFile, "utf8");
        assert.ok(!css.includes("@font-face"), "should not reference a file that is not there");
        assert.ok(
            css.includes('--font-acme-icons: "Acme Icons", sans-serif;'),
            "should still declare the stack so the fallback is used"
        );
    });

    test("reports the reason Google Fonts rejected a family", async () => {
        const mock = {
            fetchImpl: async () => ({
                ok: false,
                status: 400,
                text: async () => "<title>400: Font family not found</title>",
            }),
            requests: [],
        };
        assertWarns(
            await run({ fonts: [{ provider: "google-fonts", name: "NotAFont" }] }, { mock }),
            /Google Fonts rejected "NotAFont" \(HTTP 400\): 400: Font family not found/
        );
    });

    test("reports when a subset is not available", async () => {
        assertWarns(
            await run({ fonts: [{ provider: "google-fonts", name: "Acme Sans", subsets: ["cyrillic"] }] }),
            /has no cyrillic subset\. Available subsets: latin-ext, latin\./
        );
    });
});

const bunnyCss = `
/* latin */
@font-face {
  font-family: 'Acme Sans';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.bunny.net/acme-sans/files/acme-sans-latin-400-normal.woff2) format('woff2'), url(https://fonts.bunny.net/acme-sans/files/acme-sans-latin-400-normal.woff) format('woff');
  unicode-range: U+0000-00FF;
}
`;

const fontshareCss = `
/* Acme Sans */
@font-face {
  font-family: 'Acme Sans';
  src: url('//cdn.fontshare.com/wf/AAA/BBB/CCC.woff2') format('woff2'),
       url('//cdn.fontshare.com/wf/AAA/BBB/CCC.woff') format('woff'),
       url('//cdn.fontshare.com/wf/AAA/BBB/CCC.ttf') format('truetype');
  font-weight: 400;
  font-display: swap;
  font-style: normal;
}
@font-face {
  font-family: 'Acme Sans';
  src: url('//cdn.fontshare.com/wf/DDD/EEE/FFF.woff2') format('woff2'),
       url('//cdn.fontshare.com/wf/DDD/EEE/FFF.woff') format('woff');
  font-weight: 400;
  font-display: swap;
  font-style: italic;
}
`;

const fontsourceMeta = {
    id: "acme-sans",
    family: "Acme Sans",
    subsets: ["latin", "latin-ext"],
    weights: [400, 700],
    styles: ["normal", "italic"],
    variable: true,
    unicodeRange: { latin: "U+0000-00FF", "latin-ext": "U+0100-02BA" },
};

/**
 * Serves a fixed stylesheet or JSON body, and dummy font files for anything else.
 *
 * @param {Object.<string, unknown>} routes - Matched as a substring of the URL.
 * @returns {{ fetchImpl: typeof fetch, requests: string[] }}
 */
const createRouteMock = (routes) => {
    const requests = [];
    const fetchImpl = async (url) => {
        requests.push(url);
        const match = Object.keys(routes).find((route) => url.includes(route));

        if (match) {
            const body = routes[match];
            if (typeof body === "number") return { ok: false, status: body, text: async () => "" };
            return typeof body === "string"
                ? { ok: true, status: 200, text: async () => body }
                : { ok: true, status: 200, json: async () => body };
        }

        return {
            ok: true,
            status: 200,
            arrayBuffer: async () => new TextEncoder().encode(url).buffer,
        };
    };
    return { fetchImpl, requests };
};

describe("bunny fonts", () => {
    test("requests the bunny endpoint with the css2 syntax", () => {
        const { fonts } = normalizeFonts([
            { provider: "bunny-fonts", name: "Acme Sans", weights: ["400", "700"] },
        ]);
        assert.equal(
            providers["bunny-fonts"].buildRequestUrl(fonts[0]),
            "https://fonts.bunny.net/css2?family=Acme+Sans:wght@400;700&display=swap"
        );
    });

    test("rejects a weight range, since bunny only serves static files", () => {
        const { errors } = normalizeFonts([
            { provider: "bunny-fonts", name: "Acme Sans", weights: ["300 700"] },
        ]);
        assert.match(errors[0], /"300 700", which Bunny Fonts does not serve/);
    });

    test("takes the woff2 out of a multi format src", async () => {
        const mock = createRouteMock({ "fonts.bunny.net/css2": bunnyCss });
        await run(
            { fonts: [{ provider: "bunny-fonts", name: "Acme Sans", subsets: ["latin"] }] },
            { mock }
        );

        const css = await readFile(cssFile, "utf8");
        assert.ok(css.includes('format("woff2")'));
        assert.ok(!css.includes('format("woff")'), "should not keep the woff fallback");
        assert.deepEqual(await fontFiles(), ["acme-sans-latin-400-normal.woff2"]);
    });

    test("reports the error bunny returns with a 200 status", async () => {
        const mock = createRouteMock({
            "fonts.bunny.net/css2":
                "/*\n    Error: API Error \n    Details: Please specify a valid font on the 'family' parameter. \n*/",
        });
        assertWarns(
            await run({ fonts: [{ provider: "bunny-fonts", name: "NotAFont" }] }, { mock }),
            /Bunny Fonts returned no woff2 files for "NotAFont": Please specify a valid font/
        );
    });
});

describe("fontshare", () => {
    test("numbers a variant as the weight, plus one for italic", () => {
        const { fonts } = normalizeFonts([
            {
                provider: "fontshare",
                name: "Acme Sans",
                weights: ["400", "700"],
                styles: ["normal", "italic"],
            },
        ]);
        assert.equal(
            providers.fontshare.buildRequestUrl(fonts[0]),
            "https://api.fontshare.com/v2/css?f[]=acme-sans@400,401,700,701"
        );
    });

    test("ignores subsets, since fontshare serves one file per variant", async () => {
        const mock = createRouteMock({ "api.fontshare.com": fontshareCss });
        await run(
            {
                fonts: [
                    {
                        provider: "fontshare",
                        name: "Acme Sans",
                        styles: ["normal", "italic"],
                        subsets: ["latin"],
                    },
                ],
            },
            { mock }
        );

        assert.deepEqual(await fontFiles(), [
            "acme-sans-400-italic.woff2",
            "acme-sans-400-normal.woff2",
        ]);
    });

    test("makes the protocol relative cdn url absolute", async () => {
        const mock = createRouteMock({ "api.fontshare.com": fontshareCss });
        const result = await run(
            { fonts: [{ provider: "fontshare", name: "Acme Sans" }] },
            { mock }
        );
        assert.ok(
            result.requests.some((url) => url === "https://cdn.fontshare.com/wf/AAA/BBB/CCC.woff2"),
            "should download over https"
        );
    });

    test("fails when fontshare silently drops a requested variant", async () => {
        const mock = createRouteMock({ "api.fontshare.com": fontshareCss });
        assertWarns(
            await run(
                { fonts: [{ provider: "fontshare", name: "Acme Sans", weights: ["400", "900"] }] },
                { mock }
            ),
            /Fontshare has no 900 normal for "Acme Sans"/
        );
    });
});

describe("fontsource", () => {
    const routes = (overrides = {}) =>
        createRouteMock({
            "/v1/fonts/acme-sans": fontsourceMeta,
            "/v1/variable/acme-sans": { family: "Acme Sans", axes: { wght: { min: "100", max: "900" } } },
            ...overrides,
        });

    test("builds the file urls from the catalogue metadata", async () => {
        const mock = routes();
        await run(
            {
                fonts: [
                    {
                        provider: "fontsource",
                        name: "Acme Sans",
                        weights: ["400", "700"],
                        subsets: ["latin"],
                    },
                ],
            },
            { mock }
        );

        assert.ok(
            mock.requests.includes(
                "https://cdn.jsdelivr.net/fontsource/fonts/acme-sans@latest/latin-400-normal.woff2"
            )
        );
        const css = await readFile(cssFile, "utf8");
        assert.ok(css.includes("unicode-range: U+0000-00FF;"), "should reuse the api unicode range");
    });

    test("uses the variable file and its real axis for a weight range", async () => {
        const mock = routes();
        await run(
            {
                fonts: [
                    { provider: "fontsource", name: "Acme Sans", weights: ["300 700"], subsets: ["latin"] },
                ],
            },
            { mock }
        );

        assert.ok(
            mock.requests.includes(
                "https://cdn.jsdelivr.net/fontsource/fonts/acme-sans:vf@latest/latin-wght-normal.woff2"
            )
        );
        const css = await readFile(cssFile, "utf8");
        assert.ok(css.includes("font-weight: 100 900;"), "should declare the axis of the file");
    });

    test("keeps the configured name when id points at another family", async () => {
        const mock = createRouteMock({
            "/v1/fonts/acme-grotesk": { ...fontsourceMeta, id: "acme-grotesk", family: "Something Else" },
        });
        await run(
            { fonts: [{ provider: "fontsource", name: "Acme Sans", id: "acme-grotesk", subsets: ["latin"] }] },
            { mock }
        );

        const css = await readFile(cssFile, "utf8");
        assert.ok(css.includes('font-family: "Acme Sans";'), "@font-face should use the configured name");
        assert.ok(css.includes('--font-acme-sans: "Acme Sans", sans-serif;'));
        assert.ok(!css.includes("Something Else"), "should not leak the catalogue name");
    });

    test("reports an unknown font id", async () => {
        const mock = createRouteMock({ "/v1/fonts/acme-sans": 404 });
        assertWarns(
            await run({ fonts: [{ provider: "fontsource", name: "Acme Sans" }] }, { mock }),
            /Fontsource has no font with the id "acme-sans", derived from "Acme Sans"/
        );
    });

    test("reports a weight the family does not have", async () => {
        assertWarns(
            await run(
                { fonts: [{ provider: "fontsource", name: "Acme Sans", weights: ["900"] }] },
                { mock: routes() }
            ),
            /has no 900 weight\. Available weights: 400, 700\./
        );
    });

    test("reports a subset the family does not have", async () => {
        assertWarns(
            await run(
                { fonts: [{ provider: "fontsource", name: "Acme Sans", subsets: ["cyrillic"] }] },
                { mock: routes() }
            ),
            /has no cyrillic subset\. Available subsets: latin, latin-ext\./
        );
    });

    test("reports a weight range on a static family", async () => {
        const mock = routes({ "/v1/fonts/acme-sans": { ...fontsourceMeta, variable: false } });
        assertWarns(
            await run(
                { fonts: [{ provider: "fontsource", name: "Acme Sans", weights: ["300 700"] }] },
                { mock }
            ),
            /is not a variable font, list the weights you need instead of a range/
        );
    });
});

describe("font-display", () => {
    test("the configured display wins over the one the endpoint returned", async () => {
        const mock = createRouteMock({ "fonts.bunny.net/css2": bunnyCss });
        await run(
            {
                fonts: [
                    { provider: "bunny-fonts", name: "Acme Sans", display: "optional", subsets: ["latin"] },
                ],
            },
            { mock }
        );
        const css = await readFile(cssFile, "utf8");
        assert.ok(css.includes("font-display: optional;"));
        assert.ok(!css.includes("font-display: swap;"));
    });
});

describe("offline", () => {
    const google = { provider: "google-fonts", name: "Acme Sans" };
    const offline = {
        fetchImpl: async () => {
            throw new Error("getaddrinfo ENOTFOUND");
        },
        requests: [],
    };

    test("rebuilds from the files on disk without asking the provider again", async () => {
        await run({ fonts: [google] });
        const second = await run({ fonts: [google] }, { mock: offline });

        assert.equal(second.cached, 1);
        assert.deepEqual(second.warnings, []);
        assert.ok((await readFile(cssFile, "utf8")).includes("@font-face"));
    });

    test("asks the provider again when the family config changed", async () => {
        await run({ fonts: [google] });
        const second = await run({ fonts: [{ ...google, weights: ["700"] }] });

        assert.equal(second.cached, 0);
        assert.ok(second.requests.some((url) => url.includes("googleapis")));
    });

    test("does not ask again when only the presentation changed", async () => {
        await run({ fonts: [google] });
        const second = await run(
            { fonts: [{ ...google, fallbacks: ["Georgia", "serif"], display: "optional" }] },
            { mock: offline }
        );

        assert.equal(second.cached, 1);
        const css = await readFile(cssFile, "utf8");
        assert.ok(css.includes("font-display: optional;"));
        assert.ok(css.includes('--font-acme-sans: "Acme Sans", Georgia, serif;'));
    });

    test("asks the provider again when a font file was deleted", async () => {
        await run({ fonts: [google] });
        await rm(resolve(generatedDir, (await fontFiles())[0]));
        const second = await run({ fonts: [google] });

        assert.equal(second.cached, 0);
        assert.ok(second.requests.some((url) => url.includes("googleapis")));
    });

    test("falls back to the files on disk when the provider is unreachable", async () => {
        await run({ fonts: [google] });
        // A changed config forces a request, which then cannot be made.
        const second = await run(
            { fonts: [{ ...google, weights: ["700"] }] },
            { mock: offline }
        );

        assertWarns(second, /Could not reach Google Fonts for "Acme Sans", using the font files already/);
        assert.ok((await readFile(cssFile, "utf8")).includes("@font-face"));
    });

    test("keeps the other families when one cannot be resolved", async () => {
        const { fetchImpl, requests } = createFetchMock();
        const mock = {
            requests,
            fetchImpl: async (url, options) =>
                url.includes("family=Broken")
                    ? { ok: false, status: 500, text: async () => "" }
                    : fetchImpl(url, options),
        };
        const result = await run(
            { fonts: [google, { provider: "google-fonts", name: "Broken", cssVariable: "--font-broken" }] },
            { mock }
        );

        assertWarns(result, /Skipped "Broken"/);
        const css = await readFile(cssFile, "utf8");
        assert.ok(css.includes('font-family: "Acme Sans"'), "the healthy family is still generated");
        assert.ok(css.includes('--font-broken: Broken, sans-serif;'), "the stack falls back");
        assert.ok(!css.includes("font-family: Broken;"), "no @font-face without files");
    });

    test("keeps the font files when a family could not be confirmed", async () => {
        await run({ fonts: [google] });
        const before = await fontFiles();

        const result = await run({ fonts: [{ ...google, name: "Other" }] }, { mock: offline });

        assert.deepEqual(result.removed, [], "pruning is skipped after a warning");
        assert.deepEqual(await fontFiles(), before);
    });

    test("drops a face whose file could not be downloaded", async () => {
        const wide = { ...google, subsets: ["latin", "latin-ext"] };
        const { fetchImpl, requests } = createFetchMock();
        const mock = {
            requests,
            fetchImpl: async (url, options) =>
                url.includes("latin-ext")
                    ? { ok: false, status: 503, text: async () => "" }
                    : fetchImpl(url, options),
        };

        const result = await run({ fonts: [wide] }, { mock });

        assertWarns(result, /Could not download 1 font file\(s\) for "Acme Sans"/);
        assert.equal(result.families[0].faces.length, 1);
        assert.ok(!(await readFile(cssFile, "utf8")).includes("latin-ext"));
    });

    test("ignores the manifest when forced", async () => {
        await run({ fonts: [google] });
        const second = await run({ fonts: [google] }, { force: true });

        assert.equal(second.cached, 0);
        assert.equal(second.downloaded, 1);
    });
});

describe("preload", () => {
    const preloadFile = resolve(generatedDir, "hyva-fonts-preload.xml");

    test("writes nothing when no family asks to be preloaded", async () => {
        const result = await run({ fonts: [{ provider: "google-fonts", name: "Acme Sans" }] });

        assert.equal(result.preload, null);
        assert.equal(existsSync(preloadFile), false);
    });

    test("lists only the families that asked for it", async () => {
        await run({
            fonts: [
                { provider: "google-fonts", name: "Acme Sans", preload: true },
                { provider: "google-fonts", name: "Acme Sans", cssVariable: "--font-two" },
            ],
        });

        const xml = await readFile(preloadFile, "utf8");
        assert.equal(
            xml.match(/<font /g).length,
            1,
            "the family without preload should not be listed"
        );
        assert.ok(
            xml.includes('<font src="fonts/generated/acme-sans-latin-400-normal.woff2"/>'),
            "src should be relative to the theme's web folder"
        );
        assert.ok(
            xml.includes("urn:magento:framework:View/Layout/etc/page_configuration.xsd"),
            "should be a valid page configuration document"
        );
    });

    test("preloads a local font from where it actually lives", async () => {
        await writeFile(resolve(fontsDir, "acme-icons.woff2"), "font");
        await run({
            fonts: [
                {
                    provider: "local",
                    name: "Acme Icons",
                    preload: true,
                    variants: [{ src: "acme-icons.woff2" }],
                },
            ],
        });

        const xml = await readFile(preloadFile, "utf8");
        assert.ok(xml.includes('<font src="fonts/acme-icons.woff2"/>'), xml);
    });

    test("lists every file of a family only once", async () => {
        await run({
            fonts: [
                {
                    provider: "google-fonts",
                    name: "Acme Sans",
                    subsets: ["latin", "latin-ext"],
                    weights: ["400", "700"],
                    preload: true,
                },
            ],
        });

        const xml = await readFile(preloadFile, "utf8");
        const sources = xml.match(/src="[^"]+"/g);
        assert.deepEqual(sources, [...new Set(sources)], "no file should be listed twice");
    });

    test("removes a stale file when preloading is turned off", async () => {
        const font = { provider: "google-fonts", name: "Acme Sans", preload: true };
        await run({ fonts: [font] });
        assert.ok(existsSync(preloadFile));

        await run({ fonts: [{ ...font, preload: false }] });
        assert.equal(existsSync(preloadFile), false);
    });

    test("does not ask the provider again when only preload changed", async () => {
        const font = { provider: "google-fonts", name: "Acme Sans" };
        await run({ fonts: [font] });
        const second = await run(
            { fonts: [{ ...font, preload: true }] },
            { mock: { fetchImpl: async () => { throw new Error("offline"); }, requests: [] } }
        );

        assert.equal(second.cached, 1);
        assert.ok(existsSync(preloadFile));
    });

    test("survives pruning, since it lives in the folder that gets pruned", async () => {
        const font = { provider: "google-fonts", name: "Acme Sans", preload: true };
        await run({ fonts: [{ ...font, weights: ["400", "700"] }] });

        // Dropping a weight makes its file stale, which triggers a prune.
        const result = await run({ fonts: [font] });

        assert.deepEqual(result.removed, ["acme-sans-latin-700-normal.woff2"]);
        assert.ok(existsSync(preloadFile), "the snippet should not be pruned");
        assert.ok(existsSync(resolve(generatedDir, "hyva-fonts.json")), "nor the manifest");
    });

    test("does not list a family that was skipped", async () => {
        const mock = createRouteMock({ "/v1/fonts/acme-sans": 404 });
        const result = await run(
            { fonts: [{ provider: "fontsource", name: "Acme Sans", preload: true }] },
            { mock }
        );

        assert.equal(result.preload, null, "nothing to preload without files");
        assert.equal(existsSync(preloadFile), false);
    });
});

describe("layout injection", () => {
    const layoutFile = resolve(themeDir, "Magento_Theme/layout/default_head_blocks.xml");
    const preloaded = { provider: "google-fonts", name: "Acme Sans", preload: true };

    /** Write a layout file, optionally with the markers already in place. */
    const writeLayout = async (body) => {
        await mkdir(dirname(layoutFile), { recursive: true });
        await writeFile(
            layoutFile,
            `<?xml version="1.0"?>\n<page>\n    <head>\n        <css src="css/styles.css"/>\n${body}    </head>\n</page>\n`
        );
    };

    const markers = "        <!-- hyva-fonts:start -->\n        <!-- hyva-fonts:end -->\n";

    test("leaves a theme without the layout file alone", async () => {
        const result = await run({ fonts: [preloaded] });

        assert.equal(result.layout, null);
        assert.deepEqual(result.warnings, []);
    });

    test("leaves a layout file without the markers alone", async () => {
        await writeLayout("");
        const before = await readFile(layoutFile, "utf8");

        const result = await run({ fonts: [preloaded] });

        assert.equal(result.layout, null);
        assert.deepEqual(result.warnings, []);
        assert.equal(await readFile(layoutFile, "utf8"), before);
    });

    test("fills the region between the markers", async () => {
        await writeLayout(markers);

        const result = await run({ fonts: [preloaded] });

        assert.equal(result.layout.count, 1);
        const xml = await readFile(layoutFile, "utf8");
        assert.ok(
            xml.includes(
                '        <!-- hyva-fonts:start -->\n' +
                    '        <!-- Acme Sans -->\n' +
                    '        <font src="fonts/generated/acme-sans-latin-400-normal.woff2"/>\n' +
                    '        <!-- hyva-fonts:end -->'
            ),
            xml
        );
    });

    test("touches nothing outside the markers", async () => {
        await writeLayout(markers);
        const before = await readFile(layoutFile, "utf8");

        await run({ fonts: [preloaded] });

        const after = await readFile(layoutFile, "utf8");
        const outside = (xml) => [
            xml.slice(0, xml.indexOf("<!-- hyva-fonts:start -->")),
            xml.slice(xml.indexOf("<!-- hyva-fonts:end -->")),
        ];
        assert.deepEqual(outside(after), outside(before));
        assert.ok(after.includes('<css src="css/styles.css"/>'), "the theme's own head is intact");
    });

    test("replaces what it wrote last time instead of appending", async () => {
        await writeLayout(markers);
        await run({ fonts: [preloaded] });
        await run({ fonts: [{ ...preloaded, weights: ["700"] }] });

        const xml = await readFile(layoutFile, "utf8");
        assert.equal(xml.match(/<font /g).length, 1, "should not accumulate");
        assert.ok(xml.includes("acme-sans-latin-700-normal.woff2"));
        assert.ok(!xml.includes("acme-sans-latin-400-normal.woff2"));
    });

    test("empties the region when nothing is preloaded any more", async () => {
        await writeLayout(markers);
        await run({ fonts: [preloaded] });

        const result = await run({ fonts: [{ ...preloaded, preload: false }] });

        assert.equal(result.layout.count, 0);
        assert.equal(result.layout.changed, true);
        const xml = await readFile(layoutFile, "utf8");
        assert.ok(!xml.includes("<font "), "no stale preload should survive");
        assert.ok(xml.includes("<!-- hyva-fonts:start -->"), "the markers stay, they are the opt in");
    });

    test("does not rewrite the file when nothing changed", async () => {
        await writeLayout(markers);
        await run({ fonts: [preloaded] });

        const result = await run({ fonts: [preloaded] });

        assert.equal(result.layout.changed, false, "an unchanged file should not be written");
    });

    test("keeps the indentation the markers sit on", async () => {
        await mkdir(dirname(layoutFile), { recursive: true });
        await writeFile(
            layoutFile,
            '<page>\n  <head>\n    <!-- hyva-fonts:start -->\n    <!-- hyva-fonts:end -->\n  </head>\n</page>\n'
        );

        await run({ fonts: [preloaded] });

        const xml = await readFile(layoutFile, "utf8");
        assert.ok(xml.includes('\n    <font src="fonts/generated/'), xml);
    });

    test("refuses a file with only one marker", async () => {
        await writeLayout("        <!-- hyva-fonts:start -->\n");

        const result = await run({ fonts: [preloaded] });

        assertWarns(result, /Expected one "hyva-fonts:start" and one "hyva-fonts:end" comment, found 1 and 0/);
        assert.ok(!(await readFile(layoutFile, "utf8")).includes("<font "));
    });

    test("refuses a file with duplicated markers", async () => {
        await writeLayout(markers + markers);

        const result = await run({ fonts: [preloaded] });

        assertWarns(result, /found 2 and 2/);
        assert.ok(!(await readFile(layoutFile, "utf8")).includes("<font "));
    });

    test("refuses markers in the wrong order", async () => {
        await writeLayout("        <!-- hyva-fonts:end -->\n        <!-- hyva-fonts:start -->\n");

        const result = await run({ fonts: [preloaded] });

        assertWarns(result, /comes before "hyva-fonts:start"/);
        assert.ok(!(await readFile(layoutFile, "utf8")).includes("<font "));
    });

    test("matches markers however they are spaced", async () => {
        await writeLayout("        <!--hyva-fonts:start-->\n        <!--   hyva-fonts:end   -->\n");

        const result = await run({ fonts: [preloaded] });

        assert.equal(result.layout.count, 1);
    });
});

describe("command output", () => {
    const binPath = resolve(__dirname, "../bin/generate-fonts.js");

    /** Run the real command against the fixture theme. */
    const runCommand = (config) =>
        new Promise(async (done, fail) => {
            await writeFile(
                resolve(tailwindDir, "hyva.config.json"),
                JSON.stringify(config, null, 4)
            );
            const child = spawn(process.execPath, [binPath], { cwd: tailwindDir });
            let output = "";
            child.stdout.on("data", (data) => (output += data));
            child.stderr.on("data", (data) => (output += data));
            child.on("close", (code) => done({ code, output: output.trim() }));
            child.on("error", fail);
        });

    test("says nothing when there is no fonts key", async () => {
        const result = await runCommand({ tokens: { values: {} } });

        assert.equal(result.code, 0);
        assert.equal(result.output, "", result.output);
    });

    test("warns when the fonts key is there but empty", async () => {
        const result = await runCommand({ fonts: [] });

        assert.equal(result.code, 0);
        assert.match(result.output, /The "fonts" in hyva\.config\.json is empty/);
    });

    test("says nothing on a run that worked", async () => {
        await writeFile(resolve(fontsDir, "acme.woff2"), "font");

        const result = await runCommand({
            fonts: [{ provider: "local", name: "Acme", variants: [{ src: "acme.woff2" }] }],
        });

        assert.equal(result.code, 0);
        assert.equal(result.output, "", result.output);
    });

    test("reports an invalid configuration and fails", async () => {
        const result = await runCommand({ fonts: [{ name: "Acme", styles: ["oblique"] }] });

        assert.equal(result.code, 1);
        assert.match(result.output, /only supports "normal" and "italic"/);
    });
});

describe("fallback metrics", () => {
    const UNITS_PER_EM = 1000;
    const ADVANCE = 1000;
    const GLYPHS = 92;

    /** A cmap mapping every character from space to "z" onto its own glyph. */
    const cmapTable = () => {
        const segCount = 2;
        const table = Buffer.alloc(16 + segCount * 8);
        table.writeUInt16BE(4, 0);
        table.writeUInt16BE(table.length, 2);
        table.writeUInt16BE(segCount * 2, 6);
        table.writeUInt16BE(0x7a, 14);
        table.writeUInt16BE(0xffff, 16);
        table.writeUInt16BE(0x20, 20);
        table.writeUInt16BE(0xffff, 22);
        table.writeInt16BE(1 - 0x20, 24);
        table.writeInt16BE(1, 26);

        const cmap = Buffer.alloc(12 + table.length);
        cmap.writeUInt16BE(1, 2);
        cmap.writeUInt16BE(3, 4);
        cmap.writeUInt16BE(1, 6);
        cmap.writeUInt32BE(12, 8);
        table.copy(cmap, 12);
        return cmap;
    };

    /** The tables of a font whose every glyph is exactly ADVANCE wide. */
    const fontTables = () => {
        const head = Buffer.alloc(54);
        head.writeUInt16BE(UNITS_PER_EM, 18);

        const hhea = Buffer.alloc(36);
        hhea.writeInt16BE(800, 4);
        hhea.writeInt16BE(-200, 6);
        hhea.writeInt16BE(0, 8);
        hhea.writeUInt16BE(GLYPHS, 34);

        const hmtx = Buffer.alloc(GLYPHS * 4);
        for (let i = 0; i < GLYPHS; i++) hmtx.writeUInt16BE(ADVANCE, i * 4);

        return [
            ["cmap", cmapTable()],
            ["head", head],
            ["hhea", hhea],
            ["hmtx", hmtx],
            ["OS/2", Buffer.alloc(96)],
        ];
    };

    /** Pack the tables as a plain TrueType font. */
    const buildSfnt = () => {
        const tables = fontTables();
        const header = Buffer.alloc(12 + tables.length * 16);
        header.writeUInt32BE(0x00010000, 0);
        header.writeUInt16BE(tables.length, 4);

        let offset = header.length;
        const body = [];
        tables.forEach(([tag, data], i) => {
            const entry = 12 + i * 16;
            header.write(tag.padEnd(4), entry, "latin1");
            header.writeUInt32BE(offset, entry + 8);
            header.writeUInt32BE(data.length, entry + 12);
            offset += data.length;
            body.push(data);
        });

        return Buffer.concat([header, ...body]);
    };

    /** Pack the same tables as a woff2, which is what a provider serves. */
    const buildWoff2 = () => {
        const tables = fontTables();
        const indexes = { cmap: 0, head: 1, hhea: 2, hmtx: 3, "OS/2": 6 };

        const base128 = (value) => {
            const bytes = [];
            do {
                bytes.unshift(value & 0x7f);
                value >>>= 7;
            } while (value);
            for (let i = 0; i < bytes.length - 1; i++) bytes[i] |= 0x80;
            return Buffer.from(bytes);
        };

        const directory = Buffer.concat(
            tables.map(([tag, data]) =>
                Buffer.concat([Buffer.from([indexes[tag]]), base128(data.length)])
            )
        );
        const compressed = brotliCompressSync(
            Buffer.concat(tables.map(([, data]) => data))
        );

        const header = Buffer.alloc(48);
        header.write("wOF2", 0, "latin1");
        header.writeUInt16BE(tables.length, 12);
        header.writeUInt32BE(compressed.length, 20);

        return Buffer.concat([header, directory, compressed]);
    };

    test("reads the metrics of a plain TrueType font", async () => {
        const file = resolve(fontsDir, "synthetic.ttf");
        await writeFile(file, buildSfnt());

        assert.deepEqual(readMetrics(file), {
            unitsPerEm: 1000,
            ascent: 800,
            descent: -200,
            lineGap: 0,
            xWidthAvg: 1000,
        });
    });

    test("reads the metrics of a woff2, which is compressed", async () => {
        const file = resolve(fontsDir, "synthetic.woff2");
        await writeFile(file, buildWoff2());

        assert.deepEqual(readMetrics(file), {
            unitsPerEm: 1000,
            ascent: 800,
            descent: -200,
            lineGap: 0,
            xWidthAvg: 1000,
        });
    });

    test("returns nothing for a file that is not a font", async () => {
        const file = resolve(fontsDir, "not-a-font.woff2");
        await writeFile(file, "this is not a font");

        assert.equal(readMetrics(file), null);
    });

    test("prefers a named fallback over a generic one", () => {
        assert.deepEqual(pickFallback(["Georgia", "sans-serif"]).local, ["Georgia", "Gelasio"]);
        assert.deepEqual(pickFallback(['"Trebuchet MS"']).local, ["Trebuchet MS"]);
    });

    test("stands a representative in for a generic fallback", () => {
        assert.equal(pickFallback(["sans-serif"]).local[0], "Arial");
        assert.equal(pickFallback(["serif"]).local[0], "Times New Roman");
        assert.equal(pickFallback(["ui-monospace", "monospace"]).local[0], "Courier New");
    });

    test("has nothing to match a fallback it does not know", () => {
        assert.equal(pickFallback(["cursive"]), null);
        assert.equal(pickFallback([]), null);
    });

    test("scales the overrides by how much wider the webfont is", async () => {
        const file = resolve(fontsDir, "synthetic.ttf");
        await writeFile(file, buildSfnt());

        const face = buildFallbackFace(
            { name: "Acme Sans", fallbacks: ["sans-serif"] },
            file
        );

        // Arial averages 904 per 2048 units, the synthetic font 1000 per 1000,
        // so it is 2.2655 times as wide and every override is divided by that.
        assert.equal(face.family, "Acme Sans fallback");
        assert.equal(face.sizeAdjust, "226.55%");
        assert.equal(face.ascentOverride, "35.31%");
        assert.equal(face.descentOverride, "8.83%");
        assert.equal(face.lineGapOverride, "0%");
    });

    test("renders the adjusted face", () => {
        const css = renderFallbackFace({
            family: "Acme Sans fallback",
            local: ["Arial", "Arimo"],
            sizeAdjust: "107.3%",
            ascentOverride: "90.28%",
            descentOverride: "22.48%",
            lineGapOverride: "0%",
        });

        assert.ok(css.includes('font-family: "Acme Sans fallback";'));
        assert.ok(css.includes('src: local("Arial"), local("Arimo");'));
        assert.ok(css.includes("size-adjust: 107.3%;"));
        assert.ok(css.includes("ascent-override: 90.28%;"));
    });

    test("puts the adjusted face into the stack, before the fallbacks", async () => {
        await writeFile(resolve(fontsDir, "acme.woff2"), buildWoff2());
        await run({
            fonts: [
                {
                    provider: "local",
                    name: "Acme",
                    fallbacks: ["Arial", "sans-serif"],
                    variants: [{ src: "acme.woff2" }],
                },
            ],
        });

        const css = await readFile(cssFile, "utf8");
        assert.ok(css.includes('font-family: "Acme fallback";'), css);
        assert.ok(css.includes('--font-acme: Acme, "Acme fallback", Arial, sans-serif;'), css);
    });

    test("leaves the stack alone when adjustFallback is off", async () => {
        await writeFile(resolve(fontsDir, "acme.woff2"), buildWoff2());
        await run({
            fonts: [
                {
                    provider: "local",
                    name: "Acme",
                    adjustFallback: false,
                    variants: [{ src: "acme.woff2" }],
                },
            ],
        });

        const css = await readFile(cssFile, "utf8");
        assert.ok(!css.includes("fallback"), css);
        assert.ok(css.includes("--font-acme: Acme, sans-serif;"));
    });

    test("skips the adjusted face when the font cannot be measured", async () => {
        await writeFile(resolve(fontsDir, "acme.woff2"), "not a font");
        const result = await run({
            fonts: [
                {
                    provider: "local",
                    name: "Acme",
                    variants: [{ src: "acme.woff2" }],
                },
            ],
        });

        assert.deepEqual(result.warnings, [], "an unmeasurable font is not a problem");
        assert.equal(result.families[0].fallbackFace, null);
        assert.ok((await readFile(cssFile, "utf8")).includes("--font-acme: Acme, sans-serif;"));
    });
});
