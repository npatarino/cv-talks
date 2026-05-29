import { chromium } from "playwright-core";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import http from "node:http";

const root = path.dirname(fileURLToPath(import.meta.url));
const site = path.join(root, "..", "_site");

// Path to a Chromium/Chrome binary. Override with CHROME_BIN when the
// Playwright-managed browser lives elsewhere (e.g. /opt/pw-browsers).
const EXE = process.env.CHROME_BIN
  || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

// Static server rooted at _site so absolute URLs (/design-system, /talks) resolve.
const MIME = {
  ".html": "text/html", ".css": "text/css", ".js": "text/javascript",
  ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp",
  ".woff2": "font/woff2", ".otf": "font/otf", ".ttf": "font/ttf",
  ".json": "application/json", ".webmanifest": "application/manifest+json",
};
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  const file = path.join(site, p);
  fs.readFile(file, (err, buf) => {
    if (err) { res.statusCode = 404; res.end("not found"); return; }
    res.setHeader("Content-Type", MIME[path.extname(file)] || "application/octet-stream");
    res.end(buf);
  });
});
await new Promise((r) => server.listen(0, r));
const PORT = server.address().port;
const base = `http://localhost:${PORT}`;

const variants = [
  { slug: "43-media-still",     name: "still" },
  { slug: "44-media-fullbleed", name: "fullbleed" },
  { slug: "45-media-split",     name: "split" },
];

const browser = await chromium.launch({ executablePath: EXE });
const page = await browser.newPage({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
});

const outDir = path.join(root, "..", "_mockup");
fs.mkdirSync(outDir, { recursive: true });

const shots = [];
for (const v of variants) {
  await page.goto(`${base}/talks/templates/${v.slug}/?present=1`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  const el = await page.$("section.slide");
  const out = path.join(outDir, v.name + ".png");
  await el.screenshot({ path: out });
  shots.push({ ...v, out });
  console.log("shot", v.name);
}

// Compose a labeled contact sheet (3 slides stacked) in one page.
const slideW = 1280;            // scaled-down slide width
const slideH = Math.round(slideW * 9 / 16);
const labels = {
  still: "A · still — fotograma enmarcado + subtítulo estilo cine",
  fullbleed: "B · fullbleed — imagen a sangre + titular CHANEY sobre scrim",
  split: "C · split — imagen a un lado + reacción editorial al otro",
};
const blocks = shots.map((s) => {
  const data = fs.readFileSync(s.out).toString("base64");
  return `
    <div class="card">
      <div class="lbl">${labels[s.name]}</div>
      <img src="data:image/png;base64,${data}" width="${slideW}" height="${slideH}">
    </div>`;
}).join("");

const sheet = `<!doctype html><html><head><meta charset="utf-8">
<style>
  body{margin:0;background:#0d0d0d;font-family:-apple-system,Segoe UI,Roboto,sans-serif;
       padding:56px 64px;width:${slideW + 128}px;}
  h1{color:#fafaf8;font-size:30px;margin:0 0 6px;letter-spacing:-0.01em;}
  .sub{color:#02b5b9;font-size:16px;letter-spacing:0.14em;text-transform:uppercase;margin:0 0 40px;}
  .card{margin-bottom:38px;}
  .lbl{color:#f9d71c;font-size:18px;letter-spacing:0.04em;margin:0 0 12px;font-weight:600;}
  img{display:block;border-radius:6px;box-shadow:0 18px 50px rgba(0,0,0,0.5);}
</style></head><body>
  <h1>Nuevo tipo de slide · <strong>media</strong></h1>
  <p class="sub">Screenshot / meme / fotograma — tres alternativas</p>
  ${blocks}
</body></html>`;

const sheetPath = path.join(outDir, "sheet.html");
fs.writeFileSync(sheetPath, sheet);
await page.goto("file://" + sheetPath);
await page.waitForTimeout(300);
const fullW = slideW + 128;
await page.setViewportSize({ width: fullW, height: 10 });
const finalPath = path.join(outDir, "media-variants.png");
await page.screenshot({ path: finalPath, fullPage: true });
console.log("FINAL", finalPath);

await browser.close();
server.close();
