/**
 * Los tres "tiles de acción" (subir, pegar, iconos) que abren cualquier
 * selector de assets.
 */

import { toast } from '../toast.js';
import { slugifyAssetName } from '../lib/strings.mjs';
import { pickImageFile, readClipboardImage, uploadAssetForDeck } from './upload.js';
import { openIconBrowser } from './icon-browser.js';

/**
 * Build the two "action tile" elements ("+ Upload" and "📋 Paste") that go
 * at the start of an asset picker grid. Each tile invokes the corresponding
 * upload flow and calls onComplete(filename) once a file is saved.
 */
export function buildAssetActionTiles(deckSlug, onComplete) {
  const uploadTile = document.createElement('div');
  uploadTile.className = 'asset-item asset-action';
  uploadTile.title = 'Upload image from your computer';
  uploadTile.innerHTML = `
    <div class="asset-action-icon">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 5v14M7 12l7-7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M5 22h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </div>
    <span>Upload…</span>`;

  const pasteTile = document.createElement('div');
  pasteTile.className = 'asset-item asset-action';
  pasteTile.title = 'Paste image from clipboard';
  pasteTile.innerHTML = `
    <div class="asset-action-icon">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="6" y="5" width="16" height="20" rx="2" stroke="currentColor" stroke-width="2"/>
        <rect x="10" y="3" width="8" height="4" rx="1" stroke="currentColor" stroke-width="2"/>
        <path d="M10 14h8M10 18h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </div>
    <span>Paste…</span>`;

  const browseTile = document.createElement('div');
  browseTile.className = 'asset-item asset-action';
  browseTile.title = 'Browse Design System Icons';
  browseTile.innerHTML = `
    <div class="asset-action-icon" style="font-size: 20px;">
      🎨
    </div>
    <span>Icons…</span>`;

  uploadTile.addEventListener('mousedown', async e => {
    e.preventDefault();
    const file = await pickImageFile();
    if (!file) return;
    const filename = await uploadAssetForDeck(
      deckSlug,
      file,
      file.type || 'image/png',
      slugifyAssetName(file.name),
    );
    if (filename) onComplete(filename);
  });

  pasteTile.addEventListener('mousedown', async e => {
    e.preventDefault();
    try {
      const result = await readClipboardImage();
      if (!result) { toast('No image in clipboard'); return; }
      const filename = await uploadAssetForDeck(
        deckSlug,
        result.blob,
        result.mimeType,
        `icon-${Date.now().toString(36)}`,
      );
      if (filename) onComplete(filename);
    } catch (e) {
      toast('Paste failed: ' + e.message, 'error');
    }
  });

  browseTile.addEventListener('mousedown', async e => {
    e.preventDefault();
    openIconBrowser(deckSlug, onComplete);
  });

  return [uploadTile, pasteTile, browseTile];
}
