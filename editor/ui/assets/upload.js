/**
 * Subida de imágenes al deck: elegir fichero, leer del portapapeles (incluido
 * SVG copiado como texto), pedir un nombre y enviarlo al servidor.
 */

import { extractSvgFromText } from '../lib/clipboard-svg.mjs';
import { slugifyAssetName } from '../lib/strings.mjs';
import { uploadAsset as uploadAssetApi } from '../api-client.js';
import { toast } from '../toast.js';

/**
 * Pick a file via <input type=file>. Resolves with the File, or null if cancelled.
 */
export function pickImageFile() {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml,image/avif';
    input.addEventListener('change', () => resolve(input.files?.[0] ?? null));
    // If the user closes the dialog without picking, `change` never fires.
    // We rely on the next picker action to clean up — no leak.
    input.click();
  });
}

/**
 * Read an image from the clipboard. Returns { blob, mimeType } or null if no image.
 *
 * Handles three cases:
 *  1. Raster images (PNG/JPG/WEBP/GIF/AVIF) — exposed by the browser as
 *     `image/*` blobs via `ClipboardItem.getType()`.
 *  2. SVG as `image/svg+xml` blob — rare in practice but covered for
 *     completeness.
 *  3. SVG copied as text (the common case from Figma, design tools, or
 *     "Copy SVG" buttons) — the clipboard exposes it via `text/plain` or
 *     `text/html`; we sniff the payload to detect `<svg ...>` markup and
 *     wrap it in a synthetic blob.
 */
export async function readClipboardImage() {
  if (!navigator.clipboard?.read) {
    throw new Error('Clipboard API not available');
  }
  const items = await navigator.clipboard.read();

  // Pass 1 — direct image blob (raster or vector).
  for (const item of items) {
    const imageType = item.types.find(t => t.startsWith('image/'));
    if (imageType) {
      const blob = await item.getType(imageType);
      return { blob, mimeType: imageType };
    }
  }

  // Pass 2 — SVG copied as text. Prefer text/plain because text/html often
  // wraps the SVG in <html><body> boilerplate or strips it entirely.
  for (const item of items) {
    for (const textType of ['text/plain', 'text/html']) {
      if (!item.types.includes(textType)) continue;
      const blob = await item.getType(textType);
      const text = await blob.text();
      const svgMarkup = extractSvgFromText(text);
      if (svgMarkup) {
        return {
          blob: new Blob([svgMarkup], { type: 'image/svg+xml' }),
          mimeType: 'image/svg+xml',
        };
      }
    }
  }

  return null;
}

/** Convert a Blob to base64 (without the data URL prefix). */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const result = r.result;
      const comma = result.indexOf(',');
      resolve(result.slice(comma + 1));
    };
    r.onerror = () => reject(new Error('Failed to read file'));
    r.readAsDataURL(blob);
  });
}

/**
 * Modal that prompts the user for a basename. Resolves with the basename
 * (already slugified) or null if cancelled.
 */
function promptAssetName(suggested) {
  return new Promise(resolve => {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal';
    backdrop.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content modal-sm">
        <div class="modal-header"><h2>Name this image</h2></div>
        <div class="modal-body">
          <label class="form-field" style="display:flex;flex-direction:column;gap:6px">
            <span class="field-label">Filename (without extension)</span>
            <input type="text" id="asset-name-input" autocomplete="off">
          </label>
          <p style="margin-top:8px;font-size:12px;color:var(--text-secondary,#888)">
            Use lowercase letters, numbers, and hyphens. Will be resized to 512px if larger.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" data-action="cancel">Cancel</button>
          <button class="btn-primary" data-action="ok">Save</button>
        </div>
      </div>`;
    document.body.appendChild(backdrop);

    const input = backdrop.querySelector('#asset-name-input');
    input.value = suggested;
    input.focus();
    input.select();

    function close(value) {
      backdrop.remove();
      document.removeEventListener('keydown', onKey);
      resolve(value);
    }
    function onKey(e) {
      if (e.key === 'Escape') close(null);
      if (e.key === 'Enter') submit();
    }
    function submit() {
      const slug = slugifyAssetName(input.value);
      if (!slug) { input.focus(); return; }
      close(slug);
    }
    backdrop.querySelector('[data-action=cancel]').addEventListener('click', () => close(null));
    backdrop.querySelector('.modal-backdrop').addEventListener('click', () => close(null));
    backdrop.querySelector('[data-action=ok]').addEventListener('click', submit);
    document.addEventListener('keydown', onKey);
  });
}

/**
 * Upload an asset blob to the server. Returns the saved filename.
 * Prompts for a name (suggested via `suggestedName`) and asks for confirmation.
 * Returns null if the user cancels.
 */
export async function uploadAssetForDeck(deckSlug, blob, mimeType, suggestedName) {
  const basename = await promptAssetName(suggestedName);
  if (!basename) return null;

  const dataBase64 = await blobToBase64(blob);
  try {
    const result = await uploadAssetApi(deckSlug, { basename, mimeType, dataBase64 });
    toast(result.resized ? `Saved (resized): ${result.filename}` : `Saved: ${result.filename}`, 'success');
    return result.filename;
  } catch (e) {
    toast('Upload failed: ' + e.message, 'error');
    return null;
  }
}
