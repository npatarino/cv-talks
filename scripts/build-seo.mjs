#!/usr/bin/env node
/**
 * @file `build-seo` — talks (Eleventy) SEO post-build assets.
 *
 * Eleventy emits HTML into `_site/` but doesn't ship the per-web SEO
 * assets the linter expects (favicons, OG fallback, manifest, sitemap,
 * robots). This script runs *after* `eleventy` and writes every SEO
 * asset the cross-web SEO contract requires:
 *
 *   - copies favicon/icon/og assets from `@chimi/design-system`
 *   - renders `_site/manifest.webmanifest`
 *   - renders `_site/robots.txt`
 *   - emits `_site/sitemap.xml` from the public landing pages
 *     (anything in `_site/` that isn't marked `chimi-seo-skip`).
 *
 * The sitemap uses `buildSitemapEntries` + `renderSitemapXml` so the
 * output matches the rest of the monorepo (Astro projects emit a
 * sitemap-index.xml via `@astrojs/sitemap`; talks emits a single
 * `sitemap.xml` because we have a small, finite URL set).
 */

import { readdir, readFile, writeFile, copyFile, mkdir } from "node:fs/promises";
import { resolve, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { defaultsForSite } from "@chimichurricode/design-system/seo/defaults";
import { renderManifestJson } from "@chimichurricode/design-system/seo/manifest";
import { renderRobotsTxt } from "@chimichurricode/design-system/seo/robots";
import {
  buildSitemapEntries,
  renderSitemapXml,
} from "@chimichurricode/design-system/seo/sitemap";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), "..");
const SITE_DIR = resolve(REPO_ROOT, "_site");
const DS_ROOT = resolve(REPO_ROOT, "node_modules/@chimichurricode/design-system");
const ICONS_DIR = resolve(DS_ROOT, "assets/icons");
const OG_DIR = resolve(DS_ROOT, "assets/og");

const ICON_FILES = [
  "favicon.svg",
  "favicon-32x32.png",
  "apple-touch-icon.png",
  "mask-icon.svg",
  "icon-192.png",
  "icon-512.png",
];

async function copyIcons() {
  for (const f of ICON_FILES) {
    await copyFile(resolve(ICONS_DIR, f), resolve(SITE_DIR, f));
  }
  console.log(`[talks/build-seo] icons → _site/`);
}

async function copyOg() {
  const ogDir = resolve(SITE_DIR, "og");
  await mkdir(ogDir, { recursive: true });
  await copyFile(resolve(OG_DIR, "talks.webp"), resolve(ogDir, "talks.webp"));
  console.log(`[talks/build-seo] og/talks.webp → _site/og/`);
}

async function writeManifest() {
  const out = resolve(SITE_DIR, "manifest.webmanifest");
  await writeFile(out, renderManifestJson("talks"));
  console.log(`[talks/build-seo] manifest.webmanifest → _site/`);
}

async function writeRobots() {
  const d = defaultsForSite("talks");
  const out = resolve(SITE_DIR, "robots.txt");
  await writeFile(
    out,
    renderRobotsTxt("talks", {
      sitemapUrl: `${d.canonicalBase}/sitemap.xml`,
    }),
  );
  console.log(`[talks/build-seo] robots.txt → _site/`);
}

/**
 * Walk `_site/` and return a list of `{ rel, html }` for every
 * `*.html` file (relative path uses POSIX separators).
 *
 * @returns {Promise<{ rel: string; html: string }[]>}
 */
async function walkHtml() {
  /** @type {{ rel: string; html: string }[]} */
  const out = [];
  /** @param {string} dir */
  async function recur(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const abs = resolve(dir, e.name);
      if (e.isDirectory()) {
        await recur(abs);
        continue;
      }
      if (!e.name.endsWith(".html")) continue;
      const rel = relative(SITE_DIR, abs).split(sep).join("/");
      const html = await readFile(abs, "utf8");
      out.push({ rel, html });
    }
  }
  await recur(SITE_DIR);
  return out;
}

/**
 * Convert `index.html` files into directory paths suitable as
 * `SitemapInput` (`{ path }`) for `buildSitemapEntries`. Excludes
 * pages marked `chimi-seo-skip` and any noindexed pages.
 *
 * @param {{ rel: string; html: string }[]} pages
 * @returns {{ path: string }[]}
 */
function pagesToSitemapInputs(pages) {
  const seen = new Set();
  /** @type {{ path: string }[]} */
  const out = [];
  for (const { rel, html } of pages) {
    if (/<meta\s+name=["']chimi-seo-skip["']/i.test(html)) continue;
    if (/<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(html)) {
      continue;
    }
    let path = "/" + rel.replace(/index\.html$/, "");
    path = path.replace(/\/+$/, "/");
    if (seen.has(path)) continue;
    seen.add(path);
    out.push({ path });
  }
  return out;
}

async function writeSitemap() {
  const pages = await walkHtml();
  const inputs = pagesToSitemapInputs(pages);
  const entries = buildSitemapEntries("talks", inputs);
  const xml = renderSitemapXml(entries);
  const out = resolve(SITE_DIR, "sitemap.xml");
  await writeFile(out, xml);
  console.log(`[talks/build-seo] sitemap.xml → _site/ (${entries.length} URL(s))`);
}

await copyIcons();
await copyOg();
await writeManifest();
await writeRobots();
await writeSitemap();
console.log(`[talks/build-seo] done`);
