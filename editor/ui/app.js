/**
 * cv-talks Slide Editor — arranque y cableado.
 *
 * Los elementos del DOM están en dom.js, el estado en state.js, las llamadas
 * HTTP en api-client.js y cada vista/operación en su módulo; aquí solo se
 * conectan los controles de index.html con ellas.
 */

import { getConfig, getTemplates } from './api-client.js';
import {
  addSlide,
  canNavigateSlides,
  closeModals,
  confirmDelete,
  doDelete,
  initController,
  loadDecks,
  moveSelected,
  navigateSlides,
  revertSlide,
  saveCurrentSlide,
  selectDeck,
} from './controller.js';
import { exportPdf, presentDeck, presentDeckWithPhone } from './deck-actions.js';
import { $, dom } from './dom.js';
import { openAddModal, renderGallery } from './gallery.js';
import { openMarkdownViewer } from './markdown-viewer.js';
import { initNotes } from './notes.js';
import { initPreview } from './preview.js';
import { state } from './state.js';
import { toast } from './toast.js';

// ---- Event wiring ----

function wireEvents() {
  dom.deckSelector.addEventListener('change', e => selectDeck(e.target.value));
  dom.btnViewMd?.addEventListener('click', openMarkdownViewer);
  dom.btnPresent.addEventListener('click', presentDeck);
  dom.btnPresentPhone.addEventListener('click', presentDeckWithPhone);
  dom.btnExportPdf.addEventListener('click', exportPdf);
  dom.btnSave.addEventListener('click', () => saveCurrentSlide());
  dom.btnRevert.addEventListener('click', revertSlide);
  dom.btnAddSlide.addEventListener('click', () => {
    if (!state.currentDeck) { toast('Select a deck first'); return; }
    openAddModal().catch(e => toast('Failed to open: ' + e.message, 'error'));
  });
  dom.btnMoveUp.addEventListener('click', () => moveSelected('up'));
  dom.btnMoveDown.addEventListener('click', () => moveSelected('down'));
  dom.btnDeleteSlide.addEventListener('click', () => confirmDelete());
  $('gallery-search').addEventListener('input', e => renderGallery(e.target.value));
  $('btn-add-confirm').addEventListener('click', addSlide);
  document.querySelectorAll('.modal-close').forEach(el => el.addEventListener('click', closeModals));
  document.querySelectorAll('.modal-backdrop').forEach(el => el.addEventListener('click', closeModals));
  $('btn-confirm-cancel').addEventListener('click', closeModals);
  $('btn-confirm-ok').addEventListener('click', doDelete);
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); if (!dom.btnSave.disabled) saveCurrentSlide(); }
    if (e.key === 'Escape') closeModals();
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      if (canNavigateSlides(e)) {
        e.preventDefault();
        navigateSlides(e.key === 'ArrowDown' ? 1 : -1);
      }
    }
  });
}

// ---- Init ----

async function init() {
  initController();
  initPreview();
  initNotes();
  wireEvents();
  try {
    state.previewOrigin = (await getConfig()).previewOrigin;
  } catch { /* se queda con el origen por defecto */ }
  try {
    const meta = await getTemplates();
    Object.assign(state.templates, meta);
  } catch {
    ['cover','big-concept','big-stat','quote','three-ideas','big-list','agenda','matrix',
     'roadmap','code-block','chart','comparison-table','kpi-grid','concept-shift',
     'resource-cards','speaker-bio','stack','faq','closing-qr','closing-socials',
     'demo','social-embed','icon','word-cloud'].forEach(n => {
      state.templates[n] = { variants: [{ name: 'default' }] };
    });
  }
  // Template gallery loads lazily when modal opens
  await loadDecks();

  // Restore deck + slide from URL hash: #/{slug}/{order}
  const m = location.hash.match(/^#\/([^/]+)(?:\/(\d+))?$/);
  if (m) {
    const [, slug, orderStr] = m;
    if (state.decks.find(d => d.slug === slug)) {
      await selectDeck(slug, orderStr ? Number(orderStr) : null);
      return;
    }
  }
}

init().catch(e => console.error('Editor init failed:', e));
