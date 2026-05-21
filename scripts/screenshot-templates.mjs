#!/usr/bin/env node
/**
 * Capture screenshots of slides, web pages, or arbitrary URLs at multiple
 * viewports. Originally a slide-only harness used to validate the recipe
 * migration; extended in W7 of the responsive-webs-mobile-first change to
 * cover webs at mobile / tablet / desktop sizes.
 *
 * Usage
 * -----
 *   # Slides (back-compatible default — captures every template at desktop)
 *   node packages/talks/scripts/screenshot-templates.mjs
 *   node packages/talks/scripts/screenshot-templates.mjs --target current
 *   node packages/talks/scripts/screenshot-templates.mjs --slug 14-big-stat-default
 *
 *   # Slides at multiple viewports (use this to QA viewer-mobile mode)
 *   node packages/talks/scripts/screenshot-templates.mjs \
 *     --source slides --viewports mobile,tablet,desktop
 *
 *   # An arbitrary URL captured at all three viewports
 *   node packages/talks/scripts/screenshot-templates.mjs \
 *     --source http://localhost:4321/blog/ \
 *     --viewports all --target current
 *
 *   # The webs roster (called from `npm run screenshots:webs` at the root)
 *   node packages/talks/scripts/screenshot-templates.mjs \
 *     --source web --viewports mobile,tablet,desktop --target current
 *
 * Flags
 * -----
 *   --source <slides|web|<url>>
 *       What to capture. Defaults to `slides` for back-compat with the
 *       `npm run snapshot:baseline|current` scripts. `web` requires the
 *       per-web dev servers to be running on their canonical ports — see
 *       packages/design-system/responsive.md for the table. A literal URL
 *       captures only that page.
 *   --viewports <list>
 *       Comma-separated viewports. Allowed: mobile, tablet, desktop, all.
 *       Defaults to `desktop` for slides (back-compat) and to all three
 *       for `web`/`<url>`. Each viewport produces its own screenshot file.
 *   --target <name>
 *       Output subdir under `packages/talks/tests/snapshots/`. Default
 *       `baseline`. Multi-viewport runs save under
 *       `<target>/<viewport>/<slug>.png` so adding viewports doesn't
 *       clobber existing baselines.
 *   --slug <slug>
 *       Capture a single slide template by name. Slides only.
 *
 * Note: the harness deviates from the W7 plan's wording (`--target` for
 * source type) because `--target` was already in use as the output dir
 * name in the prior snapshot:baseline / snapshot:current workflow.
 * Renaming would have broken the existing scripts and any local muscle
 * memory; instead, this version adds `--source` for the new dimension.
 */

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "../../..");
const SITE_DIR = resolve(REPO_ROOT, "_site");
const TEMPLATES_DIR = resolve(REPO_ROOT, "packages/talks/templates");
const SNAPSHOTS_ROOT = resolve(REPO_ROOT, "packages/talks/tests/snapshots");

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const SLIDE_PORT = 9000;
const VIRTUAL_TIME_BUDGET_MS = 4000;
const PARALLELISM = 6;

const VIEWPORTS = {
  mobile:  { width:  375, height:  812 },
  tablet:  { width:  768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
};

// Each web is expected to be running on its canonical dev-server port.
// Override with `--source <url>` if you want to capture a single URL.
const WEB_TARGETS = [
  { id: "blog",        url: "http://localhost:4321/",          pages: ["", "blog/", "sobre-mi/", "mentorias/", "contacto/"] },
  { id: "techconf",    url: "http://localhost:4322/",          pages: ["", "calendar/", "map/", "insights/"] },
  { id: "rfp",         url: "http://localhost:4323/",          pages: ["", "about/"] },
  { id: "pdf",         url: "http://localhost:4324/",          pages: ["", "pdf-to-images/"] },
  { id: "poker",       url: "http://localhost:4325/",          pages: ["", "join/"] },
];

const args = parseArgs(process.argv.slice(2));
const target = args.target || "baseline";
const source = args.source || "slides";
const slugFilter = args.slug || null;
const outRoot = resolve(SNAPSHOTS_ROOT, target);

const viewports = resolveViewports(args.viewports, source);

main().catch((err) => {
  console.error("✗", err.message);
  process.exitCode = 1;
});

async function main() {
  if (!existsSync(CHROME)) {
    throw new Error(`Google Chrome not found at ${CHROME}. Install Chrome or update the CHROME path.`);
  }

  mkdirSync(outRoot, { recursive: true });

  if (source === "slides") {
    return runSlides();
  }
  if (source === "web") {
    return runWebs();
  }
  // Otherwise treat --source as a literal URL.
  return runUrl(source);
}

function resolveViewports(raw, srcKind) {
  if (!raw) {
    // Back-compat: slides default to desktop only; web/url defaults to all.
    return srcKind === "slides" ? ["desktop"] : ["mobile", "tablet", "desktop"];
  }
  if (raw === "all") return ["mobile", "tablet", "desktop"];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--target") out.target = argv[++i];
    else if (a === "--slug") out.slug = argv[++i];
    else if (a === "--source") out.source = argv[++i];
    else if (a === "--viewports") out.viewports = argv[++i];
    else if (a === "--help" || a === "-h") {
      printHelp();
      process.exit(0);
    }
  }
  return out;
}

function printHelp() {
  console.log(`Usage: screenshot-templates.mjs [options]

  --target <name>         Output dir under tests/snapshots/ (default: baseline)
  --source <slides|web|<url>>
                          What to capture. Default: slides.
  --viewports <list>      Comma list of mobile,tablet,desktop, or 'all'.
                          Default: desktop for slides; all for web/url.
  --slug <slug>           Capture only this template (slides source only).
  --help                  Show this help.`);
}

// ────────────────────────────────────────────────────────────────────────
// Source: slides — captures every template (or a single --slug match)
// ────────────────────────────────────────────────────────────────────────
async function runSlides() {
  if (!existsSync(SITE_DIR)) {
    throw new Error(`_site/ not found at ${SITE_DIR}. Run \`npm run build:talks\` first.`);
  }
  const slugs = listSlugs(slugFilter);
  if (slugs.length === 0) {
    throw new Error(slugFilter ? `No template matches "${slugFilter}"` : "No templates found");
  }

  console.log(`→ Capturing ${slugs.length} template(s) at ${viewports.length} viewport(s) → ${outRoot}/`);

  const server = await startStaticServer(SITE_DIR, SLIDE_PORT);
  try {
    for (const vp of viewports) {
      const viewportDir = viewports.length === 1 ? outRoot : resolve(outRoot, vp);
      mkdirSync(viewportDir, { recursive: true });
      await captureSlugs(slugs, vp, viewportDir);
    }
    console.log(`✓ Done.`);
  } finally {
    server.kill();
  }
}

function listSlugs(filter) {
  const entries = readdirSync(TEMPLATES_DIR)
    .filter((f) => f.endsWith(".md") && f !== "templates.json")
    .map((f) => f.replace(/\.md$/, ""))
    .sort();
  return filter ? entries.filter((s) => s === filter) : entries;
}

async function captureSlugs(slugs, viewportName, dir) {
  const viewport = VIEWPORTS[viewportName];
  if (!viewport) throw new Error(`Unknown viewport: ${viewportName}`);
  const queue = slugs.slice();
  const workers = Array.from({ length: PARALLELISM }, () =>
    worker(queue, async (slug) => {
      // For slides, viewer-mobile mode is exposed via ?view=mobile so the
      // mobile viewport screenshot reflects the actual mobile render.
      const qs = viewportName === "mobile" ? "?view=mobile" : "";
      const url = `http://localhost:${SLIDE_PORT}/talks/templates/${slug}/${qs}`;
      const out = resolve(dir, `${slug}.png`);
      process.stdout.write(`  · [${viewportName}] ${slug}\n`);
      await captureOne(url, out, viewport);
    })
  );
  await Promise.all(workers);
}

// ────────────────────────────────────────────────────────────────────────
// Source: web — iterates the WEB_TARGETS roster and captures each page
// at the requested viewports. Expects each web's dev server to be up.
// ────────────────────────────────────────────────────────────────────────
async function runWebs() {
  console.log(`→ Capturing ${WEB_TARGETS.length} web(s) at ${viewports.length} viewport(s) → ${outRoot}/`);

  for (const web of WEB_TARGETS) {
    const reachable = await isReachable(web.url);
    if (!reachable) {
      console.warn(`  ⚠ ${web.id} dev server not reachable at ${web.url} — skipping. Start it with \`npm run dev:${web.id}\`.`);
      continue;
    }
    for (const vp of viewports) {
      const viewportDir = resolve(outRoot, vp, web.id);
      mkdirSync(viewportDir, { recursive: true });
      const viewport = VIEWPORTS[vp];
      if (!viewport) throw new Error(`Unknown viewport: ${vp}`);
      for (const path of web.pages) {
        const url = web.url + path;
        const slug = path === "" ? "home" : path.replace(/\/$/, "").replace(/\//g, "-");
        const out = resolve(viewportDir, `${slug}.png`);
        process.stdout.write(`  · [${vp}] ${web.id}/${slug}\n`);
        await captureOne(url, out, viewport);
      }
    }
  }
  console.log(`✓ Done.`);
}

// ────────────────────────────────────────────────────────────────────────
// Source: <url> — single literal URL at the requested viewports
// ────────────────────────────────────────────────────────────────────────
async function runUrl(url) {
  if (!/^https?:\/\//.test(url)) {
    throw new Error(`--source must be 'slides', 'web', or an absolute URL (got: ${url})`);
  }
  console.log(`→ Capturing ${url} at ${viewports.length} viewport(s) → ${outRoot}/`);

  const slug = url
    .replace(/^https?:\/\//, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/(^-|-$)/g, "")
    .toLowerCase()
    .slice(0, 80) || "page";

  for (const vp of viewports) {
    const viewportDir = viewports.length === 1 ? outRoot : resolve(outRoot, vp);
    mkdirSync(viewportDir, { recursive: true });
    const viewport = VIEWPORTS[vp];
    if (!viewport) throw new Error(`Unknown viewport: ${vp}`);
    const out = resolve(viewportDir, `${slug}.png`);
    process.stdout.write(`  · [${vp}] ${slug}\n`);
    await captureOne(url, out, viewport);
  }
  console.log(`✓ Done.`);
}

// ────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────
async function isReachable(url) {
  try {
    const res = await fetch(url, { method: "HEAD" }).catch(() => null);
    return res != null;
  } catch {
    return false;
  }
}

function startStaticServer(dir, port) {
  return new Promise((resolveStart, rejectStart) => {
    const proc = spawn("python3", ["-m", "http.server", String(port)], {
      cwd: dir,
      stdio: ["ignore", "pipe", "pipe"],
    });
    proc.on("error", rejectStart);
    let ready = false;
    const onReady = () => { if (!ready) { ready = true; resolveStart(proc); } };
    proc.stderr.on("data", (chunk) => {
      if (chunk.toString().includes("Serving HTTP on")) onReady();
    });
    setTimeout(onReady, 600);
  });
}

async function worker(queue, run) {
  while (queue.length) {
    const slug = queue.shift();
    if (!slug) return;
    await run(slug);
  }
}

function captureOne(url, outPath, viewport) {
  return new Promise((resolveCap, rejectCap) => {
    const proc = spawn(
      CHROME,
      [
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        `--window-size=${viewport.width},${viewport.height}`,
        `--virtual-time-budget=${VIRTUAL_TIME_BUDGET_MS}`,
        `--screenshot=${outPath}`,
        url,
      ],
      { stdio: ["ignore", "ignore", "pipe"] }
    );
    proc.on("error", rejectCap);
    proc.on("exit", (code) => {
      if (code === 0) resolveCap();
      else rejectCap(new Error(`Chrome exited with code ${code} for ${url}`));
    });
  });
}
