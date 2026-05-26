/**
 * PDF export — renders every slide in a deck at 1920×1080 with Playwright
 * and produces a multi-page PDF.
 *
 * Slides with progressive reveal (big-list, word-cloud, etc.) are rendered
 * with ?reveal=full so all items appear in the PDF.
 *
 * Strategy: build a temporary "print wrapper" HTML page that loads each slide
 * URL in an <iframe> sized 1920×1080, separated by CSS page breaks.
 * Playwright prints this wrapper to a multi-page PDF in one shot.
 */

import { chromium } from 'playwright';
import { listSlides } from './slides.mjs';

const SLIDE_W = 1920;
const SLIDE_H = 1080;

/**
 * Export all slides of a deck to a merged PDF buffer.
 * @param {string} slug
 * @param {string} [decksRoot]
 * @returns {Promise<Buffer>}
 */
export async function exportDeckPdf(slug, decksRoot) {
  const slides = listSlides(slug, decksRoot);
  if (!slides.length) throw new Error('No slides found in deck');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    // Phase 1 — screenshot every slide to a PNG buffer (avoids iframe cross-origin issues)
    const context = await browser.newContext({
      viewport: { width: SLIDE_W, height: SLIDE_H },
      deviceScaleFactor: 1,
    });

    const screenshots = [];
    for (const slide of slides) {
      const url = `${slide.previewUrl}?present=1&reveal=full`;
      const page = await context.newPage();
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 20_000 });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(150);
        const png = await page.screenshot({ type: 'png' });
        screenshots.push({ png, label: slide.label });
      } finally {
        await page.close();
      }
    }
    await context.close();

    // Phase 2 — build a wrapper page that embeds each PNG as a full-page image
    // and print it to a multi-page PDF.
    const pngB64 = screenshots.map(s => s.png.toString('base64'));

    const html = buildWrapperHtml(pngB64, SLIDE_W, SLIDE_H);

    const printContext = await browser.newContext({
      viewport: { width: SLIDE_W, height: SLIDE_H },
      deviceScaleFactor: 1,
    });
    const printPage = await printContext.newPage();
    await printPage.setContent(html, { waitUntil: 'load' });

    const pdf = await printPage.pdf({
      width:  `${SLIDE_W}px`,
      height: `${SLIDE_H}px`,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    await printPage.close();
    await printContext.close();

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

/**
 * Build an HTML page with one full-size PNG image per slide,
 * separated by CSS page breaks.
 */
function buildWrapperHtml(pngB64Array, w, h) {
  const pages = pngB64Array.map((b64, i) => `
    <div class="slide-page${i < pngB64Array.length - 1 ? '' : ' last'}">
      <img src="data:image/png;base64,${b64}" width="${w}" height="${h}" alt="">
    </div>`).join('\n');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #000; }
  .slide-page {
    width: ${w}px;
    height: ${h}px;
    overflow: hidden;
    page-break-after: always;
    break-after: page;
  }
  .slide-page.last {
    page-break-after: avoid;
    break-after: avoid;
  }
  .slide-page img {
    display: block;
    width: ${w}px;
    height: ${h}px;
  }
  @media print {
    @page {
      size: ${w}px ${h}px;
      margin: 0;
    }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
${pages}
</body>
</html>`;
}
