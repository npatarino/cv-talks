/**
 * Controlador: orquesta decks, selección y operaciones sobre slides (guardar,
 * añadir, duplicar, borrar, reordenar, revertir) coordinando API, estado y
 * vistas. Las vistas le hablan mediante eventos (ver events.js).
 */

import {
  createSlide as createSlideApi,
  deleteSlide,
  getDecks,
  getSlide,
  getSlides,
  getStructure,
  moveSectionBoundary as moveSectionBoundaryApi,
  moveSlide,
  reorderSlides,
  revertSlide as revertSlideApi,
  saveSlide,
} from './api-client.js';
import { closeSlideContextMenu, openSlideContextMenu } from './context-menu.js';
import { $, dom } from './dom.js';
import { on } from './events.js';
import { clearForm, collectFormData, renderForm } from './form/form.js';
import { toEditorHTML } from './form/rich-text.js';
import { hideZoomPopup } from './gallery.js';
import { escHtml } from './lib/strings.mjs';
import { clearPreview, updatePreview } from './preview.js';
import { markUnsaved, refreshGitStatus, setStatus } from './save.js';
import { renderSidebar } from './sidebar.js';
import { state } from './state.js';
import { toast } from './toast.js';

export async function loadDecks() {
  const decks = await getDecks();
  state.decks = decks;
  dom.deckSelector.innerHTML =
    '<option value="">— select a deck —</option>' +
    decks.map(d => `<option value="${d.slug}">${escHtml(d.deck?.title ?? d.slug)}</option>`).join('');
}

function pushUrlState(slug, filename) {
  let hash = '';
  if (slug) {
    const slide = filename && state.slides.find(s => s.filename === filename);
    hash = slide ? `#/${slug}/${slide.order}` : `#/${slug}`;
  }
  history.replaceState(null, '', location.pathname + hash);
}

export async function selectDeck(slug, initialOrder) {
  if (!slug) {
    state.currentDeck = null;
    state.slides = [];
    state.selectedFilename = null;
    state.structure = null;
    state.dirtyFiles.clear();
    state.uncommittedFiles.clear();
    dom.btnExportPdf.disabled = true;
    dom.btnPresent.disabled = true;
    dom.btnPresentPhone.disabled = true;
    pushUrlState(null);
    renderSidebar();
    clearPreview();
    clearForm();
    return;
  }
  state.currentDeck = slug;
  state.dirtyFiles.clear();
  state.uncommittedFiles.clear();
  dom.btnExportPdf.disabled = false;
  dom.btnPresent.disabled = false;
  dom.btnPresentPhone.disabled = false;
  clearTimeout(state.livePreviewTimer);
  dom.deckSelector.value = slug;
  const deck = state.decks.find(d => d.slug === slug);
  dom.deckTitle.textContent = deck?.deck?.title ?? slug;
  await loadSlides();
  if (state.slides.length > 0) {
    const byOrder = initialOrder != null && state.slides.find(s => s.order === initialOrder);
    await selectSlide(byOrder ? byOrder.filename : state.slides[0].filename);
  }
}

export async function loadSlides() {
  if (!state.currentDeck) return;
  const slides = await getSlides(state.currentDeck);
  state.slides = slides;
  await loadStructure();
  renderSidebar();
  refreshGitStatus();
}

/** Load the deck's narrative structure (ANSVA…). Null when the deck has none. */
export async function loadStructure() {
  if (!state.currentDeck) { state.structure = null; return; }
  try {
    state.structure = await getStructure(state.currentDeck);
  } catch {
    state.structure = null; // deck has no structure — sidebar renders flat
  }
}

export async function selectSlide(filename) {
  state.selectedFilename = filename;
  state.hasUnsaved = false;
  setStatus(false);
  pushUrlState(state.currentDeck, filename);
  const slide = await getSlide(state.currentDeck, filename);
  state.slideData = slide;
  updatePreview(slide);
  renderForm(slide);
  renderSidebar();
  updateSlideActions();
}

/**
 * True when ArrowUp/ArrowDown should move the slide selection: a slide is
 * selected, focus isn't in a text field/contenteditable, and no modal or
 * picker is open (so we don't hijack their own keyboard handling).
 */
export function canNavigateSlides(e) {
  if (!state.selectedFilename || !state.slides?.length) return false;
  const el = e.target;
  const tag = el?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el?.isContentEditable) return false;
  if (!dom.modalAdd.hidden || !dom.modalConfirm.hidden) return false;
  if (document.querySelector('.icon-browser-modal, .asset-picker, .context-menu')) return false;
  return true;
}

/** Move the slide selection by `delta` (e.g. -1 up, +1 down) and reveal it. */
export async function navigateSlides(delta) {
  const idx = state.slides.findIndex(s => s.filename === state.selectedFilename);
  if (idx === -1) return;
  const nextIdx = idx + delta;
  if (nextIdx < 0 || nextIdx >= state.slides.length) return;
  await selectSlide(state.slides[nextIdx].filename);
  const el = dom.slideList.querySelector('.slide-item.selected');
  if (el) el.scrollIntoView({ block: 'center' });
}

/** Persist a moved section boundary (its new first-slide order). */
export async function moveSectionBoundary(index, startOrder) {
  if (!state.currentDeck) return;
  try {
    setStatus('saving');
    state.structure = await moveSectionBoundaryApi(state.currentDeck, index, startOrder);
    renderSidebar();
    setStatus('saved');
    toast('Section boundary moved');
  } catch (e) {
    toast('Move boundary failed: ' + e.message, 'error');
    setStatus(false);
    renderSidebar();
  }
}

export async function handleDrop(targetFilename) {
  const sourceFilename = state.draggingFilename;
  state.draggingFilename = null;
  state.dragOverFilename = null;
  if (!sourceFilename || sourceFilename === targetFilename) { renderSidebar(); return; }

  const newOrder = state.slides.map(s => s.filename);
  const fromIdx = newOrder.indexOf(sourceFilename);
  const toIdx = newOrder.indexOf(targetFilename);
  newOrder.splice(fromIdx, 1);
  newOrder.splice(toIdx, 0, sourceFilename);

  try {
    setStatus('saving');
    await reorderSlides(state.currentDeck, newOrder);
    const sourceSlug = sourceFilename.replace(/^\d+-/, '');
    await loadSlides();
    // Find renamed slide (slug portion preserved)
    const updated = state.slides.find(s => s.filename.replace(/^\d+-/, '') === sourceSlug);
    if (updated && state.selectedFilename) {
      const selectedSlug = state.selectedFilename.replace(/^\d+-/, '');
      const reselect = state.slides.find(s => s.filename.replace(/^\d+-/, '') === selectedSlug);
      if (reselect) { state.selectedFilename = reselect.filename; renderSidebar(); }
    }
    setStatus('saved');
    toast('Slides reordered');
  } catch (e) {
    toast('Reorder failed: ' + e.message, 'error');
    setStatus(false);
    renderSidebar();
  }
}

export async function moveSelected(direction) {
  if (!state.selectedFilename) return;
  const idx = state.slides.findIndex(s => s.filename === state.selectedFilename);
  if (idx === -1) return;
  if (direction === 'up' && idx === 0) return;
  if (direction === 'down' && idx === state.slides.length - 1) return;

  const toPosition = direction === 'up' ? idx : idx + 2;
  try {
    setStatus('saving');
    await moveSlide(state.currentDeck, state.selectedFilename, toPosition);
    const oldSlug = state.selectedFilename.replace(/^\d+-/, '');
    await loadSlides();
    const updated = state.slides.find(s => s.filename.replace(/^\d+-/, '') === oldSlug);
    if (updated) { state.selectedFilename = updated.filename; renderSidebar(); updateSlideActions(); }
    setStatus('saved');
  } catch (e) {
    toast('Move failed: ' + e.message, 'error');
    setStatus(false);
  }
}

export function updateSlideActions() {
  const idx = state.slides.findIndex(s => s.filename === state.selectedFilename);
  const hasSlide = idx >= 0;
  dom.btnMoveUp.disabled = idx <= 0;
  dom.btnMoveDown.disabled = !hasSlide || idx >= state.slides.length - 1;
  dom.btnDeleteSlide.disabled = !hasSlide;
  dom.btnRevert.disabled = !hasSlide;  // always available when a slide is selected
}

export async function revertSlide() {
  if (!state.selectedFilename || !state.currentDeck) return;
  try {
    // Run git checkout HEAD -- file on the server
    const slide = await revertSlideApi(state.currentDeck, state.selectedFilename);

    state.slideData = slide;
    state.dirtyFiles.delete(state.selectedFilename);
    state.uncommittedFiles.delete(state.selectedFilename);
    state.hasUnsaved = false;
    setStatus(false);

    renderForm(slide);
    renderSidebar();
    updateSlideActions();

    // Force update any contenteditable RTEs
    dom.formBody.querySelectorAll('[data-field][contenteditable]').forEach(rteEl => {
      const field = rteEl.dataset.field;
      if (field.startsWith('fields.')) {
        const key = field.slice('fields.'.length);
        const fieldObj = slide.data.fields?.[key];
        const freshValue = typeof fieldObj === 'object' ? (fieldObj?.content ?? '') : String(fieldObj ?? '');
        const display = toEditorHTML(freshValue);
        if (rteEl.innerHTML !== display) rteEl.innerHTML = display;
      }
    });

    dom.formBody.classList.add('form-reverted');
    setTimeout(() => dom.formBody.classList.remove('form-reverted'), 700);

    toast('Reverted to git HEAD', 'success');
    // Eleventy will detect the file change and rebuild the preview automatically
    setTimeout(refreshGitStatus, 1000);
  } catch (e) {
    toast('Git revert failed: ' + e.message, 'error');
  }
}

export async function saveCurrentSlide(silent = false) {
  if (!state.selectedFilename || !state.currentDeck) return;
  const newData = collectFormData();
  if (!newData) return;
  const savedFilename = state.selectedFilename;
  try {
    setStatus('saving');
    await saveSlide(state.currentDeck, savedFilename, newData);
    // Clear dirty badge, add uncommitted badge
    state.dirtyFiles.delete(savedFilename);
    state.uncommittedFiles.add(savedFilename);

    await loadSlides();
    // Reload the iframe after a short delay — Eleventy will have rebuilt by then
    // (Eleventy's live-reload also fires automatically, this is a fallback)
    setTimeout(() => {
      if (dom.previewFrame.src && dom.previewFrame.src !== 'about:blank') {
        dom.previewFrame.src = dom.previewFrame.src;
      }
    }, 800);
    state.slideData = { ...state.slideData, data: newData };
    setStatus('saved');
    if (!silent) toast('Saved', 'success');
    // Refresh git status after a short delay (Eleventy may still be building)
    setTimeout(refreshGitStatus, 1500);
  } catch (e) {
    setStatus('error');
    if (!silent) toast('Save failed: ' + e.message, 'error');
  }
}

export async function addSlide() {
  const template = dom.newTemplate.value;
  const variant = dom.newVariant.value;
  if (!template) { toast('Select a template first'); return; }

  const recipe = $('new-recipe').value;
  const label = dom.newLabel.value.trim() || `${template} · ${state.slides.length + 1}`;
  const position = parseInt(dom.newPosition.value) || state.slides.length + 1;
  dom.modalAdd.hidden = true;
  try {
    const result = await createSlideApi(state.currentDeck, { template, variant, recipe, label, position });
    await loadSlides();
    await selectSlide(result.filename);
    toast('Slide added');
  } catch (e) {
    toast('Add failed: ' + e.message, 'error');
  }
}

export function confirmDelete(filename) {
  const target = filename ?? state.selectedFilename;
  if (!target) return;
  const slide = state.slides.find(s => s.filename === target);
  state.pendingDelete = target;
  dom.confirmMessage.textContent = `Delete "${slide?.label ?? target}"? This cannot be undone.`;
  dom.modalConfirm.hidden = false;
}

export async function duplicateSlide(filename) {
  try {
    const slide = await getSlide(state.currentDeck, filename);
    if (!slide) return;

    const idx = state.slides.findIndex(s => s.filename === filename);
    const pos = idx !== -1 ? idx + 2 : undefined;

    const res = await createSlideApi(state.currentDeck, {
      ...slide.data,
      slug: filename.replace(/\.md$/, ''),
      position: pos,
    });
    await loadSlides();
    selectSlide(res.filename);
  } catch (err) {
    toast('Failed to duplicate slide: ' + err.message, 'error');
  }
}

export async function doDelete() {
  if (!state.pendingDelete) return;
  const fn = state.pendingDelete;
  state.pendingDelete = null;
  dom.modalConfirm.hidden = true;

  const deletedIdx = state.slides.findIndex(s => s.filename === fn);

  try {
    await deleteSlide(state.currentDeck, fn);
    await loadSlides();
    if (state.slides.length > 0) {
      const nextIdx = deletedIdx > 0 ? deletedIdx - 1 : 0;
      await selectSlide(state.slides[nextIdx].filename);
    } else {
      state.selectedFilename = null;
      state.slideData = null;
      clearPreview();
      clearForm();
      updateSlideActions();
    }
    toast('Slide deleted');
  } catch (e) {
    toast('Delete failed: ' + e.message, 'error');
  }
}

export function closeModals() {
  dom.modalAdd.hidden = true;
  dom.modalConfirm.hidden = true;
  state.pendingDelete = null;
  hideZoomPopup();
  closeSlideContextMenu();
}


/** Conecta los eventos de las vistas con las operaciones del controlador. */
export function initController() {
  on('form:changed', markUnsaved);
  on('slide:select', selectSlide);
  on('slide:drop', handleDrop);
  on('section:move', ({ index, start }) => moveSectionBoundary(index, start));
  on('slide:menu', ({ x, y, filename }) =>
    openSlideContextMenu(x, y, filename, { onDuplicate: duplicateSlide, onDelete: confirmDelete }));
}
