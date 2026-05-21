#!/usr/bin/env node
/**
 * Capture before/after screenshots of every web migrated by the
 * migrate-webs-to-recipes plan. Lives next to screenshot-templates.mjs
 * because it reuses the same headless-Chrome + python http.server harness.
 *
 * Usage:
 *   node packages/talks/scripts/screenshot-webs.mjs --web blog --target baseline
 *   node packages/talks/scripts/screenshot-webs.mjs --web blog --target current
 *   node packages/talks/scripts/screenshot-webs.mjs --web all  --target current
 *
 * Output:
 *   packages/<web>/tests/snapshots/<target>/<page>--<viewport>.png
 *
 * Conventions:
 *   - <page> mirrors the URL path with `/` → `_` and the empty root → `index`.
 *   - <viewport> is `desktop` (1280×800) or `mobile` (375×812). Both captured.
 *   - The output dir is gitignored at packages/<web>/.gitignore (caller
 *     responsibility to add the entry; the talks harness does the same).
 *
 * Requirements:
 *   - The web must already be built. The script does NOT call `npm run build`
 *     itself; baselines are meant to capture the pre-migration state, current
 *     captures the post-migration state, so the caller controls what's on disk.
 *   - Each web's static output must live at packages/<web>/dist/. SSR webs
 *     (recall-for-papers via Vercel adapter) currently aren't supported and
 *     are skipped with a warning — capture those manually for now.
 *
 * Implementation notes:
 *   - We start one python3 -m http.server per web on its own port. Static
 *     output already has absolute paths like /fonts/* so a flat server works.
 *   - For each .html under dist/, we compute its URL path and capture both
 *     viewports. Headless Chrome needs --window-size and a --virtual-time-budget
 *     so web fonts load before snapshot.
 *   - Parallelism is intra-web: one python server, multiple chrome workers.
 */

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "../../..");

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 375, height: 812 },
};
const VIRTUAL_TIME_BUDGET_MS = 4000;
// Per-Chrome wall-clock timeout. Headless Chrome occasionally hangs on
// pages with heavy JS or slow third-party requests; without a timeout the
// whole capture run wedges. 20s is far above the typical 1-2s capture.
const CHROME_TIMEOUT_MS = 20_000;
const PARALLELISM = 4;

// Static webs only. recall-for-papers is SSR (Vercel) and skipped.
const WEBS = {
  blog:                  { dist: "packages/blog/dist",                  port: 9101 },
  techconf:              { dist: "packages/techconf/dist",              port: 9102 },
  "simple-pdf-converter":{ dist: "packages/simple-pdf-converter/dist",  port: 9103 },
  "simple-scrum-poker":  { dist: "packages/simple-scrum-poker/dist",    port: 9104 },
};
const SSR_WEBS = new Set(["recall-for-papers"]);

const args = parseArgs(process.argv.slice(2));
const target = args.target || "baseline";
const webArg = args.web || "all";

main().catch((err) => {
  console.error("✗", err.message);
  process.exitCode = 1;
});

async function main() {
  if (!existsSync(CHROME)) {
    throw new Error(`Google Chrome not found at ${CHROME}`);
  }
  if (!["baseline", "current"].includes(target)) {
    throw new Error(`--target must be 'baseline' or 'current' (got '${target}')`);
  }

  const list = webArg === "all" ? Object.keys(WEBS) : [webArg];
  for (const web of list) {
    if (SSR_WEBS.has(web)) {
      console.warn(`⚠ ${web}: SSR build, skipping (capture manually).`);
      continue;
    }
    if (!(web in WEBS)) {
      throw new Error(`Unknown web '${web}'. Known: ${Object.keys(WEBS).join(", ")}, or 'all'.`);
    }
    await captureWeb(web);
  }
}

async function captureWeb(web) {
  const { dist, port } = WEBS[web];
  const distAbs = resolve(REPO_ROOT, dist);
  if (!existsSync(distAbs)) {
    throw new Error(`${web}: dist not found at ${distAbs}. Run \`npm --workspace @chimi/${web} run build\` first.`);
  }
  const outRoot = resolve(REPO_ROOT, `packages/${web}/tests/snapshots/${target}`);
  mkdirSync(outRoot, { recursive: true });

  const pages = listHtmlPages(distAbs);
  if (pages.length === 0) {
    console.warn(`⚠ ${web}: no .html pages found under ${distAbs}`);
    return;
  }
  console.log(`→ ${web}: capturing ${pages.length} page(s) × ${Object.keys(VIEWPORTS).length} viewport(s) → ${relative(REPO_ROOT, outRoot)}/`);

  const server = await startServer(distAbs, port);
  try {
    const queue = [];
    for (const urlPath of pages) {
      for (const [vp, dims] of Object.entries(VIEWPORTS)) {
        queue.push({ urlPath, vp, dims });
      }
    }
    const workers = Array.from({ length: PARALLELISM }, () => worker(queue, web, outRoot, port));
    await Promise.all(workers);
    console.log(`✓ ${web}: ${pages.length} page(s) captured`);
  } finally {
    server.kill();
  }
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--target") out.target = argv[++i];
    else if (a === "--web") out.web = argv[++i];
    else if (a === "--help" || a === "-h") {
      console.log("Usage: screenshot-webs.mjs --web <name|all> --target baseline|current");
      process.exit(0);
    }
  }
  return out;
}

function listHtmlPages(distAbs) {
  const out = [];
  const stack = [distAbs];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (!entry.name.endsWith(".html")) continue;
      const rel = relative(distAbs, full).split("\\").join("/");
      const urlPath = "/" + rel.replace(/index\.html$/, "").replace(/\.html$/, "/");
      out.push(urlPath.length === 0 ? "/" : urlPath);
    }
  }
  return out.sort();
}

function startServer(cwd, port) {
  return new Promise((resolveStart, rejectStart) => {
    const proc = spawn("python3", ["-m", "http.server", String(port)], {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });
    proc.on("error", rejectStart);
    let ready = false;
    const onReady = () => {
      if (ready) return;
      ready = true;
      resolveStart(proc);
    };
    proc.stderr.on("data", (chunk) => {
      const s = chunk.toString();
      if (s.includes("Serving HTTP on")) onReady();
    });
    setTimeout(onReady, 600);
  });
}

async function worker(queue, web, outRoot, port) {
  while (queue.length) {
    const job = queue.shift();
    if (!job) return;
    const url = `http://localhost:${port}${job.urlPath}`;
    const slug = pageSlug(job.urlPath);
    const out = resolve(outRoot, `${slug}--${job.vp}.png`);
    process.stdout.write(`  · ${web} ${job.urlPath} (${job.vp})\n`);
    await captureOne(url, out, job.dims);
  }
}

function pageSlug(urlPath) {
  if (urlPath === "/") return "index";
  return urlPath
    .replace(/^\/|\/$/g, "")
    .replace(/\//g, "_")
    .replace(/[^a-z0-9_-]/gi, "_") || "index";
}

function captureOne(url, outPath, viewport) {
  return new Promise((resolveCap) => {
    const proc = spawn(
      CHROME,
      [
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--no-sandbox",
        `--window-size=${viewport.width},${viewport.height}`,
        `--virtual-time-budget=${VIRTUAL_TIME_BUDGET_MS}`,
        `--screenshot=${outPath}`,
        url,
      ],
      { stdio: ["ignore", "ignore", "pipe"] }
    );
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try { proc.kill("SIGKILL"); } catch {}
      console.warn(`  ⚠ chrome timeout (${CHROME_TIMEOUT_MS}ms) for ${url}`);
      resolveCap();
    }, CHROME_TIMEOUT_MS);
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolveCap();
    };
    proc.on("error", finish);
    proc.on("exit", finish);
  });
}

// Used implicitly by readdirSync; kept here so node knows it's not unused.
void statSync;
