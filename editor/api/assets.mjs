/**
 * Asset uploads — accepts an image (binary buffer) and writes it into the
 * deck's `assets/` directory.
 *
 * Images larger than MAX_ICON_WIDTH px on the long edge are downscaled with
 * Playwright (canvas) — slides only need ~icon-sized assets, so we cap the
 * dimensions to keep file size reasonable. The image width is read straight
 * from the file header first, so the (slow) browser only launches when a
 * resize is actually required; small images and headers we can't parse never
 * pay for it.
 */

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { deckDir } from './decks.mjs';
import { getSlideDir } from './renumber.mjs';

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

  const baseDir = deckDir(slug, decksRoot);
  const assetsDir = path.join(getSlideDir(baseDir), 'assets');
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
    // Read the width from the file header first. When we can see the image is
    // already within the cap, skip the browser entirely. When the header is a
    // format we can't parse (null), fall back to the browser, which decodes it
    // properly and re-checks the size before doing any work.
    const width = imageWidthFromHeader(finalBuffer);
    if (width === null || width > MAX_ICON_WIDTH) {
      const resizedBuf = await maybeResize(finalBuffer, mimeType, MAX_ICON_WIDTH);
      if (resizedBuf) {
        finalBuffer = resizedBuf;
        resized = true;
      }
    }
  }

  fs.writeFileSync(targetPath, finalBuffer);
  return { filename, resized };
}

/**
 * Read the pixel width of an image straight from its file header, without
 * decoding it. Supports PNG, GIF, and JPEG (the icon formats slides use).
 * Returns the width in pixels, or null when the format/header can't be parsed
 * (the caller then falls back to the browser path).
 *
 * Exported for unit testing.
 */
export function imageWidthFromHeader(buffer) {
  try {
    // PNG — 8-byte signature, then IHDR (length+type) with width at byte 16.
    if (buffer.length >= 24 &&
        buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      return buffer.readUInt32BE(16);
    }
    // GIF — "GIF87a"/"GIF89a", logical screen width is a little-endian u16 at 6.
    if (buffer.length >= 10 &&
        buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      return buffer.readUInt16LE(6);
    }
    // JPEG — walk the marker segments to the start-of-frame (SOFn) header.
    if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
      let i = 2;
      while (i + 9 < buffer.length) {
        if (buffer[i] !== 0xff) { i++; continue; }
        let marker = buffer[i + 1];
        while (marker === 0xff && i + 2 < buffer.length) { i++; marker = buffer[i + 1]; }
        // Standalone markers carry no length: SOI/EOI, RSTn, TEM.
        if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
          i += 2;
          continue;
        }
        const segLen = buffer.readUInt16BE(i + 2);
        // SOFn frame headers (0xC0–0xCF) carry the dimensions, except the
        // non-frame markers DHT(C4), JPG(C8), DAC(CC). Layout after the marker:
        // length(2) precision(1) height(2) width(2).
        const isSOF = marker >= 0xc0 && marker <= 0xcf &&
          marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
        if (isSOF) return buffer.readUInt16BE(i + 7);
        i += 2 + segLen;
      }
    }
  } catch {
    // Malformed header — treat as unknown.
  }
  return null;
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
