/** Modal con el markdown crudo de la slide seleccionada. */

import { getSlideRaw } from './api-client.js';
import { state } from './state.js';
import { toast } from './toast.js';

/** Abre un modal con el markdown crudo de la slide seleccionada. */
export async function openMarkdownViewer() {
  if (!state.currentDeck || !state.selectedFilename) return;
  let text;
  try { text = await getSlideRaw(state.currentDeck, state.selectedFilename); }
  catch (e) { toast('Could not load markdown: ' + e.message, 'error'); return; }
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  const modal = document.createElement('div');
  modal.className = 'icon-browser-modal md-viewer';
  const header = document.createElement('div');
  header.className = 'icon-browser-header';
  const title = document.createElement('span');
  title.className = 'form-label';
  title.textContent = state.selectedFilename;
  const copyBtn = document.createElement('button');
  copyBtn.type = 'button'; copyBtn.className = 'btn-secondary'; copyBtn.textContent = 'Copy';
  copyBtn.onclick = () => navigator.clipboard?.writeText(text);
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button'; closeBtn.className = 'icon-browser-close'; closeBtn.textContent = '✕';
  function close() { backdrop.remove(); document.removeEventListener('keydown', onKey); }
  function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); close(); } }
  closeBtn.onclick = close;
  backdrop.addEventListener('mousedown', e => { if (e.target === backdrop) close(); });
  document.addEventListener('keydown', onKey);
  header.append(title, copyBtn, closeBtn);
  const pre = document.createElement('pre');
  pre.className = 'md-viewer-pre';
  pre.textContent = text;
  modal.append(header, pre);
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
}
