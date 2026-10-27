/**
 * cv-talks Slide Editor — Main Application Logic
 */

import { $, dom } from './dom.js';
import { state } from './state.js';
import { toast } from './toast.js';
import {
  getConfig, getDecks, getTemplates, getTemplateSlides, getTemplateScaffold, getDesignSystemIcons, getGitStatus,
  getSlides, getSlide, getSlideRaw, createSlide as createSlideApi, saveSlide, deleteSlide, reorderSlides,
  moveSlide, revertSlide as revertSlideApi, getStructure, moveSectionBoundary as moveSectionBoundaryApi,
  getAssets, uploadAsset as uploadAssetApi, exportPdf as exportPdfApi,
} from './api-client.js';
import { defaultInsertPosition } from './editor-helpers.mjs';
import { escHtml } from './lib/strings.mjs';
import { renderForm, collectFormData, clearForm } from './form/form.js';
import { toEditorHTML } from './form/rich-text.js';
import { on } from './events.js';




// ---- Preview scaling ----

function scalePreview() {
  if (!dom.previewScaler || dom.previewScaler.style.display === 'none') return;
  const c = dom.previewContainer;
  const pad = 40;
  const availW = c.clientWidth - pad;
  const availH = c.clientHeight - pad;
  const scale = Math.min(availW / 1920, availH / 1080);
  const displayW = Math.round(1920 * scale);
  const displayH = Math.round(1080 * scale);
  dom.previewScaler.style.width  = displayW + 'px';
  dom.previewScaler.style.height = displayH + 'px';
  dom.previewFrame.style.transform = `scale(${scale})`;
}

new ResizeObserver(scalePreview).observe(document.getElementById('preview-container'));





// ---- Deck loading ----

async function loadDecks() {
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

async function selectDeck(slug, initialOrder) {
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

async function loadSlides() {
  if (!state.currentDeck) return;
  const slides = await getSlides(state.currentDeck);
  state.slides = slides;
  await loadStructure();
  renderSidebar();
  refreshGitStatus();
}

/** Load the deck's narrative structure (ANSVA…). Null when the deck has none. */
async function loadStructure() {
  if (!state.currentDeck) { state.structure = null; return; }
  try {
    state.structure = await getStructure(state.currentDeck);
  } catch {
    state.structure = null; // deck has no structure — sidebar renders flat
  }
}

// ---- Slide selection ----

async function selectSlide(filename) {
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
function canNavigateSlides(e) {
  if (!state.selectedFilename || !state.slides?.length) return false;
  const el = e.target;
  const tag = el?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el?.isContentEditable) return false;
  if (!dom.modalAdd.hidden || !dom.modalConfirm.hidden) return false;
  if (document.querySelector('.icon-browser-modal, .asset-picker, .context-menu')) return false;
  return true;
}

/** Move the slide selection by `delta` (e.g. -1 up, +1 down) and reveal it. */
async function navigateSlides(delta) {
  const idx = state.slides.findIndex(s => s.filename === state.selectedFilename);
  if (idx === -1) return;
  const nextIdx = idx + delta;
  if (nextIdx < 0 || nextIdx >= state.slides.length) return;
  await selectSlide(state.slides[nextIdx].filename);
  const el = dom.slideList.querySelector('.slide-item.selected');
  if (el) el.scrollIntoView({ block: 'center' });
}

function updatePreview(slide) {
  // El orden viene de deck.config.json (no del frontmatter), así que usamos la
  // posición real en la lista en vez de `data.order`, que suele ser undefined.
  const pos = state.slides.findIndex(s => s.filename === slide.filename);
  dom.previewLabel.textContent = (pos >= 0 ? `${pos + 1} · ` : '') + (slide.data.label ?? '');
  dom.previewPlaceholder.style.display = 'none';
  dom.previewScaler.style.display = 'block';
  dom.previewFrame.src = slide.previewUrl;
  // Scale after content loads (and on every subsequent live-reload)
  dom.previewFrame.onload = scalePreview;
  scalePreview();
}

/** Abre un modal con el markdown crudo de la slide seleccionada. */
async function openMarkdownViewer() {
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

function clearPreview() {
  dom.previewScaler.style.display = 'none';
  dom.previewPlaceholder.style.display = 'flex';
  dom.previewFrame.src = 'about:blank';
  dom.previewLabel.textContent = 'No slide selected';
}


// ---- Sidebar ----

// Colors for ANSVA (and any future) section ids
const SECTION_COLORS = {
  A1: '#e05252', N: '#e08c3a', S: '#3aaa6e', V: '#3a82d4', A2: '#9b59b6',
  // Sub-sections inside Necesidad share its orange family.
  P1: '#d98023', P2: '#d98023', P3: '#d98023', PS: '#d98023',
  // fallback for unknown ids
  default: '#888',
};

function renderSidebar() {
  if (!state.currentDeck || state.slides.length === 0) {
    dom.slideList.innerHTML = '<div class="empty-state">No slides</div>';
    return;
  }
  dom.slideList.innerHTML = '';
  hideSectionTooltip();

  // Map slide order → the section that starts there, so we can drop a section
  // header in front of the slide that opens each section.
  const sections = state.structure?.sections ?? [];
  const sectionStarts = new Map();
  sections.forEach((s, i) => sectionStarts.set(s.start, { section: s, index: i }));

  // Nested sub-sections (e.g. the three problems inside Necesidad) keyed by
  // the slide order they start on, so we can drop an indented header there.
  const childStarts = new Map();
  sections.forEach(s => (s.children ?? []).forEach(c => childStarts.set(c.start, c)));

  state.slides.forEach(slide => {
    const sec = sectionStarts.get(slide.order);
    if (sec) dom.slideList.appendChild(makeSectionHeader(sec.section, sec.index));

    const child = childStarts.get(slide.order);
    if (child) dom.slideList.appendChild(makeSubSectionHeader(child));

    const item = document.createElement('div');
    item.className = [
      'slide-item',
      slide.filename === state.selectedFilename ? 'selected' : '',
      slide.filename === state.draggingFilename ? 'dragging' : '',
      slide.filename === state.dragOverFilename ? 'drag-over' : '',
    ].filter(Boolean).join(' ');
    item.dataset.filename = slide.filename;
    item.draggable = true;
    const isDirty = state.dirtyFiles.has(slide.filename);
    const isUncommitted = !isDirty && state.uncommittedFiles.has(slide.filename);
    const badge = isDirty
      ? '<span class="slide-badge badge-dirty" title="Unsaved changes"></span>'
      : isUncommitted
        ? '<span class="slide-badge badge-uncommitted" title="Saved, not committed"></span>'
        : '';

    item.innerHTML = `
      <span class="drag-handle" title="Drag to reorder">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="4" cy="2.5" r="1" fill="currentColor"/><circle cx="8" cy="2.5" r="1" fill="currentColor"/>
          <circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="8" cy="6" r="1" fill="currentColor"/>
          <circle cx="4" cy="9.5" r="1" fill="currentColor"/><circle cx="8" cy="9.5" r="1" fill="currentColor"/>
        </svg>
      </span>
      <span class="slide-order">${slide.order}</span>
      <div class="slide-info">
        <span class="slide-label" title="${escHtml(slide.label)}">${escHtml(slide.label)}</span>
        <span class="slide-meta">${slide.template}${slide.variant && slide.variant !== 'default' ? ' · ' + slide.variant : ''}</span>
      </div>
      ${badge}`;

    item.addEventListener('click', () => selectSlide(slide.filename));
    item.addEventListener('contextmenu', e => {
      e.preventDefault();
      openSlideContextMenu(e.clientX, e.clientY, slide.filename);
    });
    // NOTE: never call renderSidebar() mid-drag — rebuilding the list removes
    // the node the browser is dragging and aborts the drag (so drop never
    // fires). During a drag we only toggle CSS classes on the live nodes; the
    // full re-render happens once on drop.
    item.addEventListener('dragstart', e => {
      state.draggingFilename = slide.filename;
      state.draggingSectionIndex = null;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', slide.filename); // required by Firefox
      requestAnimationFrame(() => item.classList.add('dragging'));
    });
    item.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (state.dragOverFilename !== slide.filename) {
        state.dragOverFilename = slide.filename;
        dom.slideList.querySelectorAll('.slide-item.drag-over')
          .forEach(el => el.classList.remove('drag-over'));
        item.classList.add('drag-over');
      }
    });
    item.addEventListener('dragleave', () => {
      item.classList.remove('drag-over');
      if (state.dragOverFilename === slide.filename) state.dragOverFilename = null;
    });
    item.addEventListener('drop', e => {
      e.preventDefault();
      // Dropping a section header onto a slide moves that section's start here.
      if (state.draggingSectionIndex != null) {
        const idx = state.draggingSectionIndex;
        state.draggingSectionIndex = null;
        state.dragOverFilename = null;
        moveSectionBoundary(idx, slide.order);
      } else {
        handleDrop(slide.filename);
      }
    });
    item.addEventListener('dragend', () => {
      state.draggingFilename = null;
      state.dragOverFilename = null;
      state.draggingSectionIndex = null;
      item.classList.remove('dragging');
      dom.slideList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    });

    dom.slideList.appendChild(item);
  });

  const selectedEl = dom.slideList.querySelector('.slide-item.selected');
  if (selectedEl) {
    selectedEl.scrollIntoView({ block: 'center' });
  }
}

/**
 * Build a section header row for the sidebar. Headers mark where each
 * narrative section (ANSVA…) begins. Every header except the first is
 * draggable: drop it onto a slide to make that slide the section's first one.
 */
function makeSectionHeader(section, index) {
  const header = document.createElement('div');
  header.className = 'section-header' + (index === 0 ? ' first' : '');
  header.dataset.sectionIndex = index;
  const count = section.end - section.start + 1;

  const grip = index > 0
    ? `<span class="section-grip" title="Drag onto a slide to move where this section starts">
         <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
           <circle cx="3" cy="2" r="1" fill="currentColor"/><circle cx="7" cy="2" r="1" fill="currentColor"/>
           <circle cx="3" cy="5" r="1" fill="currentColor"/><circle cx="7" cy="5" r="1" fill="currentColor"/>
           <circle cx="3" cy="8" r="1" fill="currentColor"/><circle cx="7" cy="8" r="1" fill="currentColor"/>
         </svg>
       </span>`
    : '<span class="section-grip placeholder"></span>';

  const color = SECTION_COLORS[section.id] ?? SECTION_COLORS.default;
  const badgeText = (section.id ?? '').replace(/\d+$/, '');
  header.innerHTML = `
    ${grip}
    <span class="section-badge" style="background:${color}">${escHtml(badgeText)}</span>
    <span class="section-name">${escHtml(section.label ?? '')}</span>
    <span class="section-count" title="${count} slide${count === 1 ? '' : 's'}">${count}</span>`;

  // Hover tooltip with the section's description (more context than the label).
  attachSectionTooltip(header, section.label ?? '', section.description);

  if (index > 0) {
    header.draggable = true;
    header.addEventListener('dragstart', e => {
      state.draggingSectionIndex = index;
      state.draggingFilename = null;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', `section:${index}`); // required by Firefox
    });
    // Clean up after the drag without rebuilding the list mid-gesture. A
    // successful drop re-renders via moveSectionBoundary; a cancelled drop
    // just clears the highlight on the live nodes.
    header.addEventListener('dragend', () => {
      state.draggingSectionIndex = null;
      state.dragOverFilename = null;
      dom.slideList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    });
  }
  return header;
}

/** Indented header for a nested sub-section (e.g. the problems in Necesidad). */
function makeSubSectionHeader(child) {
  const header = document.createElement('div');
  header.className = 'section-header sub';
  const count = child.end - child.start + 1;
  const color = SECTION_COLORS[child.id] ?? SECTION_COLORS.default;
  header.innerHTML = `
    <span class="section-grip placeholder"></span>
    <span class="section-badge sub" style="background:${color}">${escHtml(child.id ?? '')}</span>
    <span class="section-name">${escHtml(child.label ?? '')}</span>
    <span class="section-count" title="${count} slide${count === 1 ? '' : 's'}">${count}</span>`;
  attachSectionTooltip(header, child.label ?? '', child.description);
  return header;
}

// ── Section hover tooltip ────────────────────────────────────────────────────
let sectionTooltipEl = null;

function showSectionTooltip(anchor, label, description) {
  hideSectionTooltip();
  const tip = document.createElement('div');
  tip.className = 'section-tooltip';
  tip.innerHTML = `<strong>${escHtml(label)}</strong>${description ? `<span>${escHtml(description)}</span>` : ''}`;
  document.body.appendChild(tip);
  const r = anchor.getBoundingClientRect();
  let left = r.right + 8;
  let top = r.top;
  const tr = tip.getBoundingClientRect();
  if (left + tr.width > window.innerWidth - 8) left = r.left - tr.width - 8;
  if (top + tr.height > window.innerHeight - 8) top = window.innerHeight - tr.height - 8;
  tip.style.left = Math.max(8, left) + 'px';
  tip.style.top = Math.max(8, top) + 'px';
  sectionTooltipEl = tip;
}

function hideSectionTooltip() {
  if (sectionTooltipEl) { sectionTooltipEl.remove(); sectionTooltipEl = null; }
}

function attachSectionTooltip(el, label, description) {
  el.addEventListener('mouseenter', () => showSectionTooltip(el, label, description));
  el.addEventListener('mouseleave', hideSectionTooltip);
}

/** Persist a moved section boundary (its new first-slide order). */
async function moveSectionBoundary(index, startOrder) {
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

async function handleDrop(targetFilename) {
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

// ---- Move up/down ----

async function moveSelected(direction) {
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

function updateSlideActions() {
  const idx = state.slides.findIndex(s => s.filename === state.selectedFilename);
  const hasSlide = idx >= 0;
  dom.btnMoveUp.disabled = idx <= 0;
  dom.btnMoveDown.disabled = !hasSlide || idx >= state.slides.length - 1;
  dom.btnDeleteSlide.disabled = !hasSlide;
  dom.btnRevert.disabled = !hasSlide;  // always available when a slide is selected
}

async function revertSlide() {
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

// ---- Form rendering ----

















// ---- Asset upload helpers ----









// ---- Icon Browser Modal ----


// ---- Rich text editor ----






// ---- Glyph field helpers ----





// ---- Items editor ----





// ---- Collect form data ----


// ---- Save ----

function markUnsaved() {
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

async function refreshGitStatus() {
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

function setStatus(status) {
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

async function saveCurrentSlide(silent = false) {
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

// ---- Add slide modal — gallery ----

// Template slides cache
let tmplSlides = [];
let selectedTmplCard = null;

async function openAddModal() {
  dom.newTemplate.value = '';
  dom.newVariant.value = '';
  dom.newLabel.value = '';
  // Default: insert right after the currently selected slide. Falls back to the
  // end of the deck if no slide is selected (e.g. empty deck).
  dom.newPosition.value = defaultInsertPosition(state.slides, state.selectedFilename);
  $('btn-add-confirm').disabled = true;
  selectedTmplCard = null;

  // Reset selected preview
  const wrap = $('selected-preview-wrap');
  wrap.innerHTML = '<div class="selected-preview-placeholder">Select a template</div>';

  dom.modalAdd.hidden = false;
  $('gallery-search').value = '';
  $('gallery-search').focus();

  // Load template slides (cached after first load)
  if (tmplSlides.length === 0) {
    try {
      tmplSlides = await getTemplateSlides();
    } catch (e) {
      $('gallery-grid').innerHTML = `<div class="gallery-loading">Failed to load: ${escHtml(e.message)}</div>`;
      return;
    }
  }
  renderGallery('');
}

function renderGallery(query) {
  const grid = $('gallery-grid');
  grid.innerHTML = '';

  const q = query.toLowerCase().trim();
  const filtered = q
    ? tmplSlides.filter(t => t.template.includes(q) || t.variant.includes(q) || t.label.toLowerCase().includes(q))
    : tmplSlides;

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="gallery-loading">No templates found</div>';
    return;
  }

  // Group by template name
  const groups = {};
  filtered.forEach(t => {
    if (!groups[t.template]) groups[t.template] = [];
    groups[t.template].push(t);
  });

  for (const [tmplName, slides] of Object.entries(groups)) {
    const lbl = document.createElement('div');
    lbl.className = 'gallery-group-label';
    lbl.textContent = tmplName;
    grid.appendChild(lbl);

    slides.forEach(slide => {
      const card = buildTmplCard(slide);
      grid.appendChild(card);
    });
  }
}

// Shared zoom popup (reused across all cards)
let zoomPopup = null;
let zoomIframe = null;
let zoomHideTimer = null;

function ensureZoomPopup() {
  if (zoomPopup) return;
  zoomPopup = document.createElement('div');
  zoomPopup.className = 'tmpl-zoom-popup';
  zoomPopup.style.display = 'none';
  zoomIframe = document.createElement('iframe');
  zoomIframe.setAttribute('sandbox', 'allow-same-origin allow-scripts');
  zoomPopup.appendChild(zoomIframe);
  document.body.appendChild(zoomPopup);
}

function showZoom(slide, card) {
  ensureZoomPopup();
  clearTimeout(zoomHideTimer);
  zoomIframe.src = slide.previewUrl;
  zoomPopup.style.display = 'block';
  positionZoom(card);
}

function positionZoom(card) {
  if (!zoomPopup) return;
  const rect = card.getBoundingClientRect();
  const popW = 640, popH = 360;
  const vpW = window.innerWidth, vpH = window.innerHeight;

  // Try right of card, fall back to left
  let left = rect.right + 12;
  if (left + popW > vpW - 8) left = rect.left - popW - 12;
  if (left < 8) left = 8;

  // Vertically center on card, clamp to viewport
  let top = rect.top + rect.height / 2 - popH / 2;
  top = Math.max(8, Math.min(vpH - popH - 8, top));

  zoomPopup.style.left = left + 'px';
  zoomPopup.style.top = top + 'px';
  zoomPopup.style.width = popW + 'px';
  zoomPopup.style.height = popH + 'px';
}

function hideZoom() {
  clearTimeout(zoomHideTimer);
  zoomHideTimer = setTimeout(() => {
    if (zoomPopup) zoomPopup.style.display = 'none';
  }, 120);
}

function buildTmplCard(slide) {
  const card = document.createElement('div');
  card.className = 'tmpl-card';
  card.dataset.template = slide.template;
  card.dataset.variant = slide.variant;

  // Scaled iframe preview (thumbnail in the card)
  const previewWrap = document.createElement('div');
  previewWrap.className = 'tmpl-card-preview';

  const iframe = document.createElement('iframe');
  iframe.src = slide.previewUrl;
  iframe.title = slide.label;
  iframe.setAttribute('loading', 'lazy');
  iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts');

  function scaleIframe() {
    const w = previewWrap.clientWidth || 300;
    const scale = w / 1920;
    iframe.style.transform = `scale(${scale})`;
  }

  const ro = new ResizeObserver(scaleIframe);
  ro.observe(previewWrap);
  iframe.addEventListener('load', scaleIframe);

  previewWrap.appendChild(iframe);
  card.appendChild(previewWrap);

  const info = document.createElement('div');
  info.className = 'tmpl-card-info';
  info.innerHTML = `
    <div class="tmpl-card-label" title="${escHtml(slide.label)}">${escHtml(slide.label)}</div>
    ${slide.variant !== 'default' ? `<div class="tmpl-card-meta">${escHtml(slide.variant)}</div>` : ''}
  `;
  card.appendChild(info);

  card.addEventListener('click', () => selectTmplCard(card, slide));

  // Hover zoom
  card.addEventListener('mouseenter', () => showZoom(slide, card));
  card.addEventListener('mouseleave', hideZoom);
  card.addEventListener('mousemove', () => positionZoom(card));

  return card;
}

function selectTmplCard(card, slide) {
  // Deselect previous
  if (selectedTmplCard) selectedTmplCard.classList.remove('selected');
  selectedTmplCard = card;
  card.classList.add('selected');

  // Store selection
  dom.newTemplate.value = slide.template;
  dom.newVariant.value = slide.variant;
  if (!dom.newLabel.value) {
    dom.newLabel.value = slide.template + ' · ' + (state.slides.length + 1);
  }

  // Big preview in the config panel
  const wrap = $('selected-preview-wrap');
  wrap.innerHTML = '';
  const bigIframe = document.createElement('iframe');
  bigIframe.src = slide.previewUrl;
  bigIframe.setAttribute('sandbox', 'allow-same-origin allow-scripts');
  bigIframe.style.cssText = 'position:absolute;top:0;left:0;width:1920px;height:1080px;border:none;pointer-events:none;';

  function scaleBig() {
    const w = wrap.clientWidth || 260;
    const scale = w / 1920;
    bigIframe.style.transform = `scale(${scale})`;
  }
  const ro = new ResizeObserver(scaleBig);
  ro.observe(wrap);
  bigIframe.addEventListener('load', scaleBig);
  wrap.appendChild(bigIframe);

  $('btn-add-confirm').disabled = false;
  dom.newLabel.focus();
}

async function addSlide() {
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

// ---- Delete slide ----

function confirmDelete(filename) {
  const target = filename ?? state.selectedFilename;
  if (!target) return;
  const slide = state.slides.find(s => s.filename === target);
  state.pendingDelete = target;
  dom.confirmMessage.textContent = `Delete "${slide?.label ?? target}"? This cannot be undone.`;
  dom.modalConfirm.hidden = false;
}

// ---- Slide context menu (right-click on sidebar) ----

let contextMenuEl = null;

function closeSlideContextMenu() {
  if (contextMenuEl) {
    contextMenuEl.remove();
    contextMenuEl = null;
    document.removeEventListener('mousedown', onContextOutside, true);
    document.removeEventListener('keydown', onContextEscape, true);
    window.removeEventListener('scroll', closeSlideContextMenu, true);
  }
}

function onContextOutside(e) {
  if (contextMenuEl && !contextMenuEl.contains(e.target)) closeSlideContextMenu();
}

function onContextEscape(e) {
  if (e.key === 'Escape') closeSlideContextMenu();
}

function openSlideContextMenu(x, y, filename) {
  closeSlideContextMenu();
  const menu = document.createElement('div');
  menu.className = 'context-menu';

  const items = [
    {
      label: 'Duplicate slide',
      icon: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 4h5v8h-5zM6.5 2h5v8h-5z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      action: () => duplicateSlide(filename),
    },
    {
      label: 'Delete slide',
      danger: true,
      icon: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.7 7.5h6.6L11 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      action: () => confirmDelete(filename),
    },
  ];

  items.forEach(({ label, danger, icon, action }) => {
    const btn = document.createElement('button');
    btn.className = 'context-menu-item' + (danger ? ' danger' : '');
    btn.innerHTML = `${icon}<span>${label}</span>`;
    btn.addEventListener('click', () => {
      closeSlideContextMenu();
      action();
    });
    menu.appendChild(btn);
  });

  // Position before measuring — set visibility hidden first so we can read
  // the size without flashing the menu off-screen.
  menu.style.visibility = 'hidden';
  menu.style.position = 'fixed';
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  document.body.appendChild(menu);

  // Clamp to viewport
  const rect = menu.getBoundingClientRect();
  let left = x, top = y;
  if (left + rect.width > window.innerWidth - 8) left = window.innerWidth - rect.width - 8;
  if (top + rect.height > window.innerHeight - 8) top = window.innerHeight - rect.height - 8;
  menu.style.left = left + 'px';
  menu.style.top = top + 'px';
  menu.style.visibility = '';

  contextMenuEl = menu;
  // Use capture phase so outside-click closes even when other handlers stop propagation.
  document.addEventListener('mousedown', onContextOutside, true);
  document.addEventListener('keydown', onContextEscape, true);
  window.addEventListener('scroll', closeSlideContextMenu, true);
}

async function duplicateSlide(filename) {
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

async function doDelete() {
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

// ---- PDF export ----

async function exportPdf() {
  if (!state.currentDeck) return;
  const btn = dom.btnExportPdf;
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="animation:spin 1s linear infinite">
      <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.4" stroke-dasharray="20" stroke-dashoffset="10"/>
    </svg>
    <span>Exporting…</span>`;

  try {
    const blob = await exportPdfApi(state.currentDeck);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.currentDeck}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    toast('PDF exported', 'success');
  } catch (e) {
    toast('PDF export failed: ' + e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

async function presentDeck() {
  if (!state.currentDeck || state.slides.length === 0) return;
  const slide = state.slides.find(s => s.filename === state.selectedFilename) || state.slides[0];
  let baseUrl = window.location.origin;
  if (slide.previewUrl && slide.previewUrl.includes('/talks/')) {
    baseUrl = slide.previewUrl.split('/talks/')[0];
  }
  const playerUrl = `${baseUrl}/talks/decks/${state.currentDeck}/deck/#/${slide.order}`;
  window.open(playerUrl, '_blank');
}

/** Present online (talks.chimi.pro) with the phone remote enabled: opens the
 *  player with ?remote=1, which creates a private room on load. Press R in the
 *  player to show the one-time pairing code + QR for the phone. */
const PUBLIC_SITE = 'https://talks.chimi.pro';
function presentDeckWithPhone() {
  if (!state.currentDeck || state.slides.length === 0) return;
  const slide = state.slides.find(s => s.filename === state.selectedFilename) || state.slides[0];
  const playerUrl = `${PUBLIC_SITE}/talks/decks/${state.currentDeck}/deck/?remote=1#/${slide.order}`;
  window.open(playerUrl, '_blank');
  toast('Player abierto con mando. Pulsa R en el player para ver el código y el QR del móvil.', 'success');
}

// ---- Helpers ----


function closeModals() {
  dom.modalAdd.hidden = true;
  dom.modalConfirm.hidden = true;
  state.pendingDelete = null;
  if (zoomPopup) zoomPopup.style.display = 'none';
  closeSlideContextMenu();
}

// ---- Event wiring ----

function wireEvents() {
  on('form:changed', markUnsaved);
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

  // Speaker notes: toggle collapse
  dom.btnNotesToggle.addEventListener('click', () => {
    dom.notesPanel.classList.toggle('collapsed');
    const collapsed = dom.notesPanel.classList.contains('collapsed');
    localStorage.setItem('notesPanelCollapsed', collapsed ? '1' : '0');
  });
  if (localStorage.getItem('notesPanelCollapsed') === '1') {
    dom.notesPanel.classList.add('collapsed');
  }

  // Speaker notes: mark unsaved on input
  dom.notesTextarea.addEventListener('input', markUnsaved);

  // Speaker notes: drag-to-resize
  dom.notesResizeHandle.addEventListener('mousedown', e => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = dom.notesPanel.offsetHeight;
    function onMove(ev) {
      const delta = startY - ev.clientY;
      const newH = Math.max(36, startH + delta);
      dom.notesPanel.style.height = newH + 'px';
      if (newH > 36) dom.notesPanel.classList.remove('collapsed');
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      localStorage.setItem('notesPanelHeight', dom.notesPanel.offsetHeight + 'px');
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
  const savedH = localStorage.getItem('notesPanelHeight');
  if (savedH) dom.notesPanel.style.height = savedH;
}

// ---- Init ----

async function init() {
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
