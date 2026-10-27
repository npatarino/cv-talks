/**
 * Estado de guardado: badge de cambios sin guardar, vista previa en vivo
 * (escritura a disco con debounce), estado de git por slide y barra de estado.
 */

import { getGitStatus, saveSlide } from './api-client.js';
import { $, dom } from './dom.js';
import { collectFormData } from './form/form.js';
import { renderSidebar } from './sidebar.js';
import { state } from './state.js';

export function markUnsaved() {
  state.hasUnsaved = true;
  setStatus('unsaved');

  // Mark this slide as dirty (yellow badge)
  if (state.selectedFilename) {
    state.dirtyFiles.add(state.selectedFilename);
    renderSidebar();
  }

  // Live preview: write to disk after 600ms so Eleventy rebuilds the iframe.
  // This is NOT a "save" — badge stays yellow, Save button required to confirm.
  clearTimeout(state.livePreviewTimer);
  if ($('toggle-live-preview')?.checked) {
    state.livePreviewTimer = setTimeout(() => previewWrite(), 150);
  }
}

export async function refreshGitStatus() {
  try {
    const { modified } = await getGitStatus();
    state.uncommittedFiles.clear();
    // Only consider files that are actual slide files (.md in decks/)
    modified
      .filter(f => f.startsWith('decks/') && f.endsWith('.md'))
      .forEach(f => {
        const basename = f.split('/').pop();
        if (basename) state.uncommittedFiles.add(basename);
      });
    // Rebuilding the list mid-drag removes the node being dragged (aborts the
    // drag in some browsers); the drop itself re-renders, so just skip it.
    if (state.draggingFilename == null && state.draggingSectionIndex == null) renderSidebar();
  } catch { /* git not available, ignore */ }
}

/** Write to disk silently for live preview — does NOT change save state or badge. */
async function previewWrite() {
  if (!state.selectedFilename || !state.currentDeck) return;
  const newData = collectFormData();
  if (!newData) return;
  try {
    await saveSlide(state.currentDeck, state.selectedFilename, newData);
    state.slideData = { ...state.slideData, data: newData };
    // Eleventy detects the file change and rebuilds — iframe updates automatically
  } catch { /* silent — user can still manually save */ }
}

export function setStatus(status) {
  const el = dom.saveStatus;
  el.className = '';
  if (status === 'saving') {
    el.className = 'status-saving'; el.textContent = 'Saving…';
    dom.btnSave.disabled = true;
  } else if (status === 'saved') {
    el.className = 'status-saved'; el.textContent = 'Saved';
    dom.btnSave.disabled = true;
    state.hasUnsaved = false;
    setTimeout(() => { if (!state.hasUnsaved) { el.className = 'status-idle'; el.textContent = 'All saved'; } }, 2000);
  } else if (status === 'unsaved') {
    el.className = 'status-unsaved'; el.textContent = 'Unsaved changes';
    dom.btnSave.disabled = false;
  } else if (status === 'error') {
    el.className = 'status-error'; el.textContent = 'Save failed';
    dom.btnSave.disabled = false;
  } else {
    el.className = 'status-idle'; el.textContent = 'All saved';
    dom.btnSave.disabled = true;
  }
}
