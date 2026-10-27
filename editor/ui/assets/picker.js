/**
 * Selector de assets del deck (popup con buscador y rejilla). Lo comparten el
 * editor de texto enriquecido y el campo glyph de los items; antes eran dos
 * copias casi idénticas.
 */

import { state } from '../state.js';
import { getAssets } from '../api-client.js';
import { escHtml } from '../lib/strings.mjs';
import { buildAssetActionTiles } from './tiles.js';

/**
 * Abre el selector bajo `anchor` y devuelve { close }.
 *
 * @param {object} o
 * @param {HTMLElement} o.anchor - botón bajo el que se coloca
 * @param {string} o.deckSlug
 * @param {(filename: string) => void} o.onPick - se llama tras cerrar el selector
 * @param {() => void} [o.onClose] - al cerrarse (por elección, clic fuera o close())
 * @param {boolean} [o.focusSearch] - enfocar el buscador (no hacerlo si hay que conservar
 *   la selección de un contenteditable)
 */
export async function openAssetPicker({ anchor, deckSlug, onPick, onClose, focusSearch = false }) {
  const assets = await getAssets(deckSlug).catch(() => []);

  const el = document.createElement('div');
  el.className = 'asset-picker';

  const search = document.createElement('input');
  search.type = 'text';
  search.className = 'asset-picker-search';
  search.placeholder = 'Search by name…';

  const grid = document.createElement('div');
  grid.className = 'asset-grid';

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    el.remove();
    document.removeEventListener('mousedown', outsideClick);
    onClose?.();
  }
  function outsideClick(e) {
    if (!el.contains(e.target)) close();
  }
  // Las subidas pueden terminar con el selector ya cerrado (el modal de iconos
  // cuenta como "fuera"): elegir tras cerrar sigue entregando el asset.
  function pick(filename) {
    close();
    onPick(filename);
  }

  function renderGrid(query) {
    grid.innerHTML = '';
    // Action tiles (upload, paste, icons) come first
    buildAssetActionTiles(deckSlug, pick).forEach(tile => grid.appendChild(tile));

    const q = query ? query.toLowerCase() : '';
    assets.filter(f => !q || f.toLowerCase().includes(q)).forEach(filename => {
      const item = document.createElement('div');
      item.className = 'asset-item';
      item.title = filename;
      item.innerHTML = `<img src="${state.previewOrigin}/talks/decks/${deckSlug}/assets/${filename}" alt="${escHtml(filename)}"><span>${escHtml(filename)}</span>`;
      // preventDefault evita que el clic robe el foco (y la selección) al editor.
      item.addEventListener('mousedown', e => {
        e.preventDefault();
        pick(filename);
      });
      grid.appendChild(item);
    });
  }

  search.addEventListener('input', () => renderGrid(search.value));
  renderGrid('');

  el.appendChild(search);
  el.appendChild(grid);

  const rect = anchor.getBoundingClientRect();
  el.style.cssText = `position:fixed;top:${rect.bottom + 4}px;left:${Math.min(rect.left, window.innerWidth - 270)}px;z-index:200`;
  document.body.appendChild(el);
  if (focusSearch) search.focus();

  setTimeout(() => { if (!closed) document.addEventListener('mousedown', outsideClick); }, 0);
  return { close };
}
