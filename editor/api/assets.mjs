/**
 * Asset uploads — accepts an image (binary buffer) and writes it into the
 * deck's `assets/` directory.
 *
 * Images larger than MAX_ICON_WIDTH px on the long edge are downscaled with
 * Playwright (canvas) — slides only need ~icon-sized assets, so we cap the
 * dimensions to keep file size reasonable. Skips resize when not needed.
 */

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { deckDir } from './decks.mjs';

const MAX_ICON_WIDTH = 512;

const EXT_BY_MIME = {
  'image/png':  'png',
  'image/jpeg': 'jpg',
  'image/jpg':  'jpg',
  'image/webp': 'webp',
  'image/gif':  'gif',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
};

/**
 * @param {string} slug
 * @param {object} opts
 * @param {string} opts.basename   - desired filename without extension (already slugified)
 * @param {string} opts.mimeType
 * @param {Buffer|Uint8Array} opts.buffer
 * @param {string} [decksRoot]
 * @returns {Promise<{filename: string, resized: boolean}>}
 */
export async function uploadAsset(slug, opts, decksRoot) {
  const { basename, mimeType, buffer } = opts;
  if (!basename || !/^[a-z0-9][a-z0-9_.-]*$/i.test(basename)) {
    throw new Error('Invalid basename');
  }
  const ext = EXT_BY_MIME[mimeType];
  if (!ext) throw new Error(`Unsupported image type: ${mimeType}`);

  const assetsDir = path.join(deckDir(slug, decksRoot), 'assets');
  fs.mkdirSync(assetsDir, { recursive: true });

  const filename = `${basename}.${ext}`;
  const targetPath = path.join(assetsDir, filename);
  if (fs.existsSync(targetPath)) {
    throw new Error(`File already exists: ${filename}`);
  }

  let finalBuffer = Buffer.from(buffer);
  let resized = false;

  // Only raster formats can be resized this way — SVG passes through untouched.
  const isRaster = ['png', 'jpg', 'webp', 'avif', 'gif'].includes(ext);
  if (isRaster) {
    const resizedBuf = await maybeResize(finalBuffer, mimeType, MAX_ICON_WIDTH);
    if (resizedBuf) {
      finalBuffer = resizedBuf;
      resized = true;
    }
  }

  fs.writeFileSync(targetPath, finalBuffer);
  return { filename, resized };
}

/**
 * Returns a resized PNG buffer if the source image's width exceeds maxWidth.
 * Returns null if no resize is needed.
 *
 * Uses a headless Playwright page with <canvas> — no native deps. Slow-ish
 * (~1–2s for browser launch) but only fires when actually needed.
 */
async function maybeResize(buffer, mimeType, maxWidth) {
  const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const result = await page.evaluate(async ({ dataUrl, maxWidth }) => {
      const img = new Image();
      img.src = dataUrl;
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = () => rej(new Error('Image decode failed'));
      });
      if (img.naturalWidth <= maxWidth) return null; // signal: no resize
      const scale = maxWidth / img.naturalWidth;
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);
      // Always emit PNG — lossless, preserves transparency for icons.
      return canvas.toDataURL('image/png');
    }, { dataUrl, maxWidth });

    if (!result) return null;
    const b64 = result.split(',', 2)[1];
    return Buffer.from(b64, 'base64');
  } finally {
    await browser.close();
  }
}
