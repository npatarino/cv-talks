/**
 * cv-talks Slide Editor — Main Application Logic
 */

import { extractSvgFromText } from './clipboard-svg.mjs';
import { buildAssetInsertHTML, buildAssetSrc, mergeFields, defaultInsertPosition } from './editor-helpers.mjs';

const API = '';

// Loaded async from /api/templates
const TMPL = {};

// ---- State ----
const state = {
  decks: [],
  currentDeck: null,
  currentConfig: null,   // deck.config.json content, or null
  slides: [],
  selectedFilename: null,
  slideData: null,
  hasUnsaved: false,
  draggingFilename: null,
  dragOverFilename: null,
  // Per-slide badges
  dirtyFiles: new Set(),       // unsaved form changes (yellow)
  uncommittedFiles: new Set(), // saved but not committed (teal)
  livePreviewTimer: null,
};

// ---- DOM refs ----
const $ = id => document.getElementById(id);
const dom = {
  deckSelector: $('deck-selector'),
  deckTitle: $('deck-title'),
  slideList: $('slide-list'),
  previewScaler: $('preview-scaler'),
  previewFrame: $('preview-frame'),
  previewPlaceholder: $('preview-placeholder'),
  previewLabel: $('preview-label'),
  previewContainer: $('preview-container'),
  formBody: $('form-body'),
  saveStatus: $('save-status'),
  btnSave: $('btn-save'),
  btnAddSlide: $('btn-add-slide'),
  btnRevert: $('btn-revert'),
  btnMoveUp: $('btn-move-up'),
  btnMoveDown: $('btn-move-down'),
  btnDeleteSlide: $('btn-delete-slide'),
  btnExportPdf: $('btn-export-pdf'),
  notesPanel: $('notes-panel'),
  notesTextarea: $('notes-textarea'),
  btnNotesToggle: $('btn-notes-toggle'),
  notesResizeHandle: $('notes-resize-handle'),
  modalAdd: $('modal-add'),
  modalConfirm: $('modal-confirm'),
  newTemplate: $('new-template'),
  newVariant: $('new-variant'),
  newRecipe: $('new-recipe'),
  newLabel: $('new-label'),
  newPosition: $('new-position'),
  confirmMessage: $('confirm-message'),
};

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

// ---- API ----

async function apiFetch(path, opts = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(data.error || res.statusText);
  }
  return res.json();
}

// ---- Toast ----

function toast(message, type = '') {
  const el = document.createElement('div');
  el.className = `toast${type ? ' ' + type : ''}`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ---- Deck loading ----

async function loadDecks() {
  const decks = await apiFetch('/api/decks');
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
    state.dirtyFiles.clear();
    state.uncommittedFiles.clear();
    dom.btnExportPdf.disabled = true;
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
  clearTimeout(state.livePreviewTimer);
  dom.deckSelector.value = slug;
  const deck = state.decks.find(d => d.slug === slug);
  dom.deckTitle.textContent = deck?.deck?.title ?? slug;
  state.currentConfig = deck?.config ?? null;
  await loadSlides();
  if (state.slides.length > 0) {
    const byOrder = initialOrder != null && state.slides.find(s => s.order === initialOrder);
    await selectSlide(byOrder ? byOrder.filename : state.slides[0].filename);
  }
}

async function loadSlides() {
  if (!state.currentDeck) return;
  const slides = await apiFetch(`/api/decks/${state.currentDeck}/slides`);
  state.slides = slides;
  renderSidebar();
  refreshGitStatus();
}

// ---- Slide selection ----

async function selectSlide(filename) {
  state.selectedFilename = filename;
  state.hasUnsaved = false;
  setStatus(false);
  pushUrlState(state.currentDeck, filename);
  const slide = await apiFetch(`/api/decks/${state.currentDeck}/slides/${filename}`);
  state.slideData = slide;
  updatePreview(slide);
  renderForm(slide);
  renderSidebar();
  updateSlideActions();
}

function updatePreview(slide) {
  dom.previewLabel.textContent = `${slide.data.order}. ${slide.data.label}`;
  dom.previewPlaceholder.style.display = 'none';
  dom.previewScaler.style.display = 'block';
  dom.previewFrame.src = slide.previewUrl;
  // Scale after content loads (and on every subsequent live-reload)
  dom.previewFrame.onload = scalePreview;
  scalePreview();
}

function clearPreview() {
  dom.previewScaler.style.display = 'none';
  dom.previewPlaceholder.style.display = 'flex';
  dom.previewFrame.src = 'about:blank';
  dom.previewLabel.textContent = 'No slide selected';
}

function clearForm() {
  dom.formBody.innerHTML = '<div class="empty-state">Select a slide to edit</div>';
  dom.notesTextarea.value = '';
  dom.notesTextarea.disabled = true;
}

// ---- Sidebar ----

// Colors for ANSVA (and any future) section ids
const SECTION_COLORS = {
  A1: '#e05252', N: '#e08c3a', S: '#3aaa6e', V: '#3a82d4', A2: '#9b59b6',
  // fallback for unknown ids
  default: '#888',
};

function getSectionForOrder(order) {
  const sections = state.currentConfig?.structure?.sections;
  if (!sections) return null;
  return sections.find(s => order >= s.start && order <= s.end) ?? null;
}

function renderSidebar() {
  if (!state.currentDeck || state.slides.length === 0) {
    dom.slideList.innerHTML = '<div class="empty-state">No slides</div>';
    return;
  }
  dom.slideList.innerHTML = '';
  let lastSectionId = null;
  state.slides.forEach(slide => {
    // Inject section header when entering a new section
    const section = getSectionForOrder(slide.order);
    if (section && section.id !== lastSectionId) {
      lastSectionId = section.id;
      const color = SECTION_COLORS[section.id] ?? SECTION_COLORS.default;
      const header = document.createElement('div');
      header.className = 'section-header';
      header.innerHTML = `
        <span class="section-badge" style="background:${color}">${section.id.replace(/\d+$/, '')}</span>
        <span class="section-name">${escHtml(section.label)}</span>`;
      dom.slideList.appendChild(header);
    }

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
    item.addEventListener('dragstart', e => { state.draggingFilename = slide.filename; e.dataTransfer.effectAllowed = 'move'; renderSidebar(); });
    item.addEventListener('dragover', e => { e.preventDefault(); if (state.dragOverFilename !== slide.filename) { state.dragOverFilename = slide.filename; renderSidebar(); } });
    item.addEventListener('dragleave', () => { if (state.dragOverFilename === slide.filename) { state.dragOverFilename = null; renderSidebar(); } });
    item.addEventListener('drop', e => { e.preventDefault(); handleDrop(slide.filename); });
    item.addEventListener('dragend', () => { state.draggingFilename = null; state.dragOverFilename = null; renderSidebar(); });

    dom.slideList.appendChild(item);
  });
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
    await apiFetch(`/api/decks/${state.currentDeck}/reorder`, {
      method: 'POST',
      body: JSON.stringify({ order: newOrder }),
    });
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
    await apiFetch(`/api/decks/${state.currentDeck}/slides/${state.selectedFilename}/move`, {
      method: 'POST',
      body: JSON.stringify({ position: toPosition }),
    });
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
    const slide = await apiFetch(
      `/api/decks/${state.currentDeck}/slides/${state.selectedFilename}/git-revert`,
      { method: 'POST' }
    );

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
        if (rteEl.innerHTML !== freshValue) rteEl.innerHTML = freshValue;
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

function renderForm(slide) {
  const { data } = slide;
  dom.formBody.innerHTML = '';

  addSection('Slide Meta');
  addField('Label', mkInput('text', 'label', data.label ?? '', 'Slide label…'));
  addField('Template', mkTemplateSelect('template', data.template));
  addField('Variant', mkVariantSelect('variant', data.template, data.variant ?? 'default'));
  addField('Recipe', mkRecipeSelect('recipe', data.recipe ?? 'canvas-quiet'));

  // Fields-based content — rich text editor
  if (data.fields && typeof data.fields === 'object') {
    addSection('Fields');
    for (const [key, fieldObj] of Object.entries(data.fields)) {
      const content = typeof fieldObj === 'object' ? (fieldObj?.content ?? '') : String(fieldObj ?? '');
      const meta = typeof fieldObj === 'object' ? (fieldObj?.meta ?? key) : key;
      const rte = mkRichTextEditor(`fields.${key}`, content, state.currentDeck);
      const wrapper = addField(key, rte);
      if (meta !== key) {
        const m = document.createElement('span');
        m.className = 'field-meta';
        m.textContent = meta;
        wrapper.appendChild(m);
      }
    }
  }

  // Items-based content
  if (Array.isArray(data.items)) {
    addSection('Items');
    renderItemsEditor(data.items, data.template, data.variant ?? 'default');
  }

  addSection('Advanced');
  addField('Mode override', mkSelect('mode', [
    { value: '', label: '(inherit)' },
    { value: 'content', label: 'content' },
    { value: 'meta', label: 'meta' },
  ], data.mode ?? ''));

  // Load speaker notes
  dom.notesTextarea.value = data.notes ?? '';
  dom.notesTextarea.disabled = false;

  // Mark unsaved on any change (RTEs handle markUnsaved themselves via input event)
  dom.formBody.querySelectorAll('input, textarea, select').forEach(el => {
    el.addEventListener('input', markUnsaved);
    if (el.dataset.field === 'template') {
      el.addEventListener('change', () => onTemplateChange(el.value));
    }
    if (el.dataset.field === 'variant') {
      el.addEventListener('change', () => onVariantChange(el.value));
    }
  });
}

/**
 * Reshape the form when the user picks a different template. Fetches the
 * scaffold for the new template, copies over any fields/items that survive
 * the key intersection with the current slide, and re-renders.
 *
 * The slide on disk keeps its old shape until the user hits Save — until then
 * the user can still switch back without losing data (form state is held in
 * `state.slideData`).
 */
async function onTemplateChange(newTemplate) {
  const current = collectFormData();
  if (!current) return;

  // Variant always resets to "default" — the previous variant only makes sense
  // within the previous template's variant set.
  const newVariant = 'default';

  let scaffold;
  try {
    scaffold = await apiFetch(`/api/template-scaffold?template=${encodeURIComponent(newTemplate)}&variant=${encodeURIComponent(newVariant)}`);
  } catch (e) {
    toast('Failed to load template scaffold: ' + e.message, 'error');
    return;
  }

  const merged = {
    ...current,
    template: newTemplate,
    variant: newVariant,
  };

  // Re-shape fields: start from the scaffold, copy over any matching keys
  // from the previous slide (preserves content where the new template
  // expects the same field name, e.g. `title`).
  if (scaffold.fields) {
    merged.fields = mergeFields(scaffold.fields, current.fields);
  } else {
    delete merged.fields;
  }

  if (scaffold.items) {
    // For items there's no meaningful key intersection (an array of glyphs
    // doesn't map to an array of {text} items), so reset to the scaffold's
    // shape. Length comes from the scaffold too.
    merged.items = scaffold.items;
  } else {
    delete merged.items;
  }

  // Mutate in-place so the re-render sees the new shape.
  state.slideData = { ...state.slideData, data: merged };
  renderForm(state.slideData);
  markUnsaved();
}

/** Same reshape, but only for variant changes (template stays the same). */
async function onVariantChange(newVariant) {
  const current = collectFormData();
  if (!current) return;
  const template = current.template;

  let scaffold;
  try {
    scaffold = await apiFetch(`/api/template-scaffold?template=${encodeURIComponent(template)}&variant=${encodeURIComponent(newVariant)}`);
  } catch {
    // Variant changes shouldn't be fatal — just mark unsaved and let the user save.
    markUnsaved();
    return;
  }

  const merged = { ...current, variant: newVariant };
  if (scaffold.fields) merged.fields = mergeFields(scaffold.fields, current.fields);
  // For variants we keep existing items as-is — different variants of the same
  // template (e.g. big-list numeric/bullets/checklist) share the items shape
  // closely enough that wiping would surprise the user.

  state.slideData = { ...state.slideData, data: merged };
  renderForm(state.slideData);
  markUnsaved();
}


function addSection(title) {
  const el = document.createElement('div');
  el.className = 'section-title';
  el.textContent = title;
  dom.formBody.appendChild(el);
}

function addField(label, input) {
  // Use div instead of label when input is an RTE wrapper (contenteditable inside)
  const isRTE = input.classList?.contains('rte-wrapper');
  const wrapper = document.createElement(isRTE ? 'div' : 'label');
  wrapper.className = 'form-field';
  const lbl = document.createElement('span');
  lbl.className = 'field-label';
  lbl.textContent = label;
  wrapper.appendChild(lbl);
  wrapper.appendChild(input);
  dom.formBody.appendChild(wrapper);
  return wrapper;
}

function mkInput(type, field, value, placeholder) {
  const el = document.createElement('input');
  el.type = type;
  el.dataset.field = field;
  el.value = value ?? '';
  if (placeholder) el.placeholder = placeholder;
  return el;
}

function mkTextarea(field, value) {
  const el = document.createElement('textarea');
  el.dataset.field = field;
  el.value = value ?? '';
  el.className = 'code-field';
  return el;
}

function mkSelect(field, options, current) {
  const el = document.createElement('select');
  el.dataset.field = field;
  options.forEach(({ value, label }) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    opt.selected = value === current;
    el.appendChild(opt);
  });
  return el;
}

function mkTemplateSelect(field, current) {
  return mkSelect(field, Object.keys(TMPL).map(t => ({ value: t, label: t })), current);
}

function mkVariantSelect(field, template, current) {
  const variants = TMPL[template]?.variants ?? [{ name: 'default' }];
  return mkSelect(field, variants.map(v => ({ value: v.name, label: v.name + (v.usage ? ' — ' + v.usage.slice(0, 40) : '') })), current);
}

function mkRecipeSelect(field, current) {
  const recipes = ['canvas-quiet', 'canvas-signal', 'paper', 'energy-loud', 'cool-fresh', 'critical'];
  return mkSelect(field, recipes.map(r => ({ value: r, label: r })), current);
}

// ---- Asset upload helpers ----

/**
 * Pick a file via <input type=file>. Resolves with the File, or null if cancelled.
 */
function pickImageFile() {
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
async function readClipboardImage() {
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


/** Slugify a filename for use as asset basename. */
function slugifyAssetName(name) {
  return name
    .toLowerCase()
    .replace(/\.[^.]+$/, '')          // strip extension
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'image';
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
async function uploadAssetForDeck(deckSlug, blob, mimeType, suggestedName) {
  const basename = await promptAssetName(suggestedName);
  if (!basename) return null;

  const dataBase64 = await blobToBase64(blob);
  try {
    const result = await apiFetch(`/api/decks/${deckSlug}/assets`, {
      method: 'POST',
      body: JSON.stringify({ basename, mimeType, dataBase64 }),
    });
    toast(result.resized ? `Saved (resized): ${result.filename}` : `Saved: ${result.filename}`, 'success');
    return result.filename;
  } catch (e) {
    toast('Upload failed: ' + e.message, 'error');
    return null;
  }
}

/**
 * Build the two "action tile" elements ("+ Upload" and "📋 Paste") that go
 * at the start of an asset picker grid. Each tile invokes the corresponding
 * upload flow and calls onComplete(filename) once a file is saved.
 */
function buildAssetActionTiles(deckSlug, onComplete) {
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

  return [uploadTile, pasteTile];
}

// ---- Rich text editor ----

function mkRichTextEditor(field, htmlValue, deckSlug) {
  const wrapper = document.createElement('div');
  wrapper.className = 'rte-wrapper';

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'rte-toolbar';

  const btns = [
    { cmd: 'em',      label: '<em>I</em>',          title: 'Italic / em' },
    { cmd: 'strong',  label: '<strong>B</strong>',   title: 'Bold / strong' },
    { cmd: 'sep' },
    { cmd: 'br',      label: '↵',                    title: 'Line break' },
    { cmd: 'sep' },
    { cmd: 'img',     label: '🖼 Image',              title: 'Insert image from assets' },
    { cmd: 'sep' },
    { cmd: 'clear',   label: '✕',                    title: 'Remove formatting from selection' },
  ];

  btns.forEach(({ cmd, label, title }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    if (cmd === 'sep') { btn.className = 'rte-btn sep'; btn.setAttribute('tabindex', '-1'); toolbar.appendChild(btn); return; }
    btn.className = 'rte-btn';
    btn.innerHTML = label;
    btn.title = title;
    btn.dataset.cmd = cmd;
    toolbar.appendChild(btn);
  });

  // Editor
  const editor = document.createElement('div');
  editor.className = 'rte-editor';
  editor.contentEditable = 'true';
  editor.dataset.field = field;
  editor.innerHTML = htmlValue ?? '';

  // Keep a saved selection reference for when picker opens
  let savedRange = null;

  function saveSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editor.contains(sel.anchorNode)) {
      savedRange = sel.getRangeAt(0).cloneRange();
    }
  }

  function restoreSelection() {
    if (!savedRange) return;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedRange);
  }

  editor.addEventListener('keyup', saveSelection);
  editor.addEventListener('mouseup', saveSelection);
  editor.addEventListener('input', markUnsaved);

  // Prevent paste from bringing in external styles
  editor.addEventListener('paste', e => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  });

  // Prevent Enter from creating <div> — insert <br> instead
  editor.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      restoreSelection();
      insertBR();
    }
  });

  function toggleWrap(tag) {
    // Don't need restoreSelection — e.preventDefault() on mousedown keeps the selection
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);

    // Check if the selection's anchor is already inside a <tag> element
    let node = range.commonAncestorContainer;
    if (node.nodeType === 3) node = node.parentElement;
    let existingEl = null;
    while (node && node !== editor) {
      if (node.tagName && node.tagName.toLowerCase() === tag) { existingEl = node; break; }
      node = node.parentElement;
    }

    if (existingEl) {
      // Unwrap: replace the element with its children
      const parent = existingEl.parentNode;
      const frag = document.createDocumentFragment();
      while (existingEl.firstChild) frag.appendChild(existingEl.firstChild);
      parent.replaceChild(frag, existingEl);
    } else {
      // Wrap
      try {
        const el = document.createElement(tag);
        range.surroundContents(el);
        // Reselect the wrapped content
        sel.removeAllRanges();
        const r = document.createRange();
        r.selectNodeContents(el);
        sel.addRange(r);
      } catch {
        // Selection spans multiple nodes — fallback to execCommand
        document.execCommand(tag === 'strong' ? 'bold' : 'italic');
      }
    }
    markUnsaved();
  }

  function insertBR() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const br = document.createElement('br');
    range.insertNode(br);
    // Move cursor after the br
    range.setStartAfter(br);
    range.setEndAfter(br);
    sel.removeAllRanges();
    sel.addRange(range);
    markUnsaved();
  }

  function clearFormat() {
    document.execCommand('removeFormat');
    // Also unwrap any <em>/<strong> that removeFormat might miss
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      let node = range.commonAncestorContainer;
      if (node.nodeType === 3) node = node.parentElement;
      ['em', 'strong', 'b', 'i'].forEach(tag => {
        if (node.tagName && node.tagName.toLowerCase() === tag) {
          const parent = node.parentNode;
          const frag = document.createDocumentFragment();
          while (node.firstChild) frag.appendChild(node.firstChild);
          parent.replaceChild(frag, node);
        }
      });
    }
    markUnsaved();
  }

  // Asset picker
  let pickerEl = null;

  async function openAssetPicker() {
    saveSelection();
    closePicker();

    const assets = await apiFetch(`/api/decks/${deckSlug}/assets`).catch(() => []);

    pickerEl = document.createElement('div');
    pickerEl.className = 'asset-picker';

    const grid = document.createElement('div');
    grid.className = 'asset-grid';

    function insertAsset(filename) {
      restoreSelection();
      const imgTag = buildAssetInsertHTML(buildAssetSrc(deckSlug, filename));
      document.execCommand('insertHTML', false, imgTag);
      markUnsaved();
      closePicker();
    }

    // Action tiles (upload, paste) come first
    buildAssetActionTiles(deckSlug, filename => insertAsset(filename))
      .forEach(tile => grid.appendChild(tile));

    assets.forEach(filename => {
      const src = `/talks/decks/${deckSlug}/assets/${filename}`;
      const item = document.createElement('div');
      item.className = 'asset-item';
      item.title = filename;
      item.innerHTML = `<img src="http://localhost:8080${src}" alt="${filename}"><span>${filename}</span>`;
      item.addEventListener('mousedown', e => {
        e.preventDefault();
        insertAsset(filename);
      });
      grid.appendChild(item);
    });

    pickerEl.appendChild(grid);

    // Position below the toolbar button
    const imgBtn = toolbar.querySelector('[data-cmd="img"]');
    const btnRect = imgBtn.getBoundingClientRect();
    pickerEl.style.position = 'fixed';
    pickerEl.style.top = (btnRect.bottom + 4) + 'px';
    pickerEl.style.left = Math.min(btnRect.left, window.innerWidth - 270) + 'px';
    document.body.appendChild(pickerEl);

    setTimeout(() => document.addEventListener('mousedown', outsideClick), 0);
  }

  function outsideClick(e) {
    if (pickerEl && !pickerEl.contains(e.target)) closePicker();
  }

  function closePicker() {
    if (pickerEl) { pickerEl.remove(); pickerEl = null; }
    document.removeEventListener('mousedown', outsideClick);
  }

  // Toolbar button handlers
  // e.preventDefault() keeps the editor focused and selection intact — no editor.focus() needed
  toolbar.addEventListener('mousedown', e => {
    const btn = e.target.closest('[data-cmd]');
    if (!btn) return;
    const cmd = btn.dataset.cmd;
    if (cmd === 'img') { e.preventDefault(); openAssetPicker(); return; }
    e.preventDefault();
    switch (cmd) {
      case 'em':     toggleWrap('em'); break;
      case 'strong': toggleWrap('strong'); break;
      case 'br':     insertBR(); break;
      case 'clear':  clearFormat(); break;
    }
  });

  wrapper.appendChild(toolbar);
  wrapper.appendChild(editor);
  return wrapper;
}

/** Normalize contenteditable HTML back to clean slide HTML */
function cleanHTML(html) {
  return html
    // Normalize bold/italic from browser defaults
    .replace(/<b(\s[^>]*)?>/gi, '<strong$1>')
    .replace(/<\/b>/gi, '</strong>')
    .replace(/<i(\s[^>]*)?>/gi, '<em$1>')
    .replace(/<\/i>/gi, '</em>')
    // Remove contenteditable artifacts: <div>, <p> → flatten with <br>
    .replace(/<div>/gi, '')
    .replace(/<\/div>/gi, '<br>')
    .replace(/<p>/gi, '')
    .replace(/<\/p>/gi, '<br>')
    // Strip trailing <br> at end
    .replace(/(<br\s*\/?>\s*)+$/, '')
    // Remove style attributes added by execCommand
    .replace(/ style="[^"]*"/gi, '')
    .trim();
}

// ---- Glyph field helpers ----

const IMAGE_EXT_RE = /\.(png|jpg|jpeg|svg|gif|webp|avif)$/i;
const IMG_ASSETS_RE = /^<img\s[^>]*src="[^"]*\/assets\/([^"]+)"[^>]*>$/i;

/** Extract display value from a glyph — filename or emoji/symbol */
function glyphToDisplay(raw) {
  const m = (raw ?? '').match(IMG_ASSETS_RE);
  return m ? m[1] : (raw ?? '');
}

/** Convert display value back to glyph storage format */
function displayToGlyph(display, deckSlug) {
  if (!display) return '';
  if (display.startsWith('<')) return display; // already HTML
  if (IMAGE_EXT_RE.test(display)) {
    return `<img src="/talks/decks/${deckSlug}/assets/${display}" alt="">`;
  }
  return display; // emoji or plain text
}

function mkGlyphInput(rawValue, deckSlug) {
  const displayValue = glyphToDisplay(rawValue);
  const isImage = IMAGE_EXT_RE.test(displayValue);

  const wrapper = document.createElement('div');
  wrapper.className = 'glyph-input-wrap';
  wrapper.setAttribute('data-item-field', 'glyph');
  wrapper.setAttribute('data-glyph-wrapper', 'true');

  // Preview
  const preview = document.createElement('div');
  preview.className = 'glyph-preview';
  if (isImage && deckSlug) {
    const imgSrc = `http://localhost:8080/talks/decks/${deckSlug}/assets/${displayValue}`;
    preview.innerHTML = `<img src="${imgSrc}" alt="">`;
  } else {
    preview.textContent = displayValue || '—';
  }

  // Text input (shows just the filename or emoji)
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'glyph-text-input';
  input.placeholder = 'emoji or image.png';
  input.value = displayValue;
  input.addEventListener('input', () => {
    const v = input.value.trim();
    if (IMAGE_EXT_RE.test(v) && deckSlug) {
      preview.innerHTML = `<img src="http://localhost:8080/talks/decks/${deckSlug}/assets/${v}" alt="">`;
    } else {
      preview.textContent = v || '—';
    }
    markUnsaved();
  });

  // Asset picker button
  const pickerBtn = document.createElement('button');
  pickerBtn.type = 'button';
  pickerBtn.className = 'rte-btn';
  pickerBtn.title = 'Pick from assets';
  pickerBtn.textContent = '🖼';

  let pickerEl = null;
  let outsideClick = null;
  pickerBtn.addEventListener('click', async () => {
    if (pickerEl) { pickerEl.remove(); pickerEl = null; return; }
    const assets = await apiFetch(`/api/decks/${deckSlug}/assets`).catch(() => []);

    pickerEl = document.createElement('div');
    pickerEl.className = 'asset-picker';
    const grid = document.createElement('div');
    grid.className = 'asset-grid';

    function pickAsset(filename) {
      input.value = filename;
      preview.innerHTML = `<img src="http://localhost:8080/talks/decks/${deckSlug}/assets/${filename}" alt="">`;
      markUnsaved();
      pickerEl.remove(); pickerEl = null;
      if (outsideClick) document.removeEventListener('mousedown', outsideClick);
    }

    buildAssetActionTiles(deckSlug, filename => pickAsset(filename))
      .forEach(tile => grid.appendChild(tile));

    assets.forEach(filename => {
      const item2 = document.createElement('div');
      item2.className = 'asset-item';
      item2.title = filename;
      item2.innerHTML = `<img src="http://localhost:8080/talks/decks/${deckSlug}/assets/${filename}" alt="${filename}"><span>${filename}</span>`;
      item2.addEventListener('click', () => pickAsset(filename));
      grid.appendChild(item2);
    });
    pickerEl.appendChild(grid);
    const btnRect = pickerBtn.getBoundingClientRect();
    pickerEl.style.cssText = `position:fixed;top:${btnRect.bottom + 4}px;left:${Math.min(btnRect.left, window.innerWidth - 270)}px;z-index:200`;
    document.body.appendChild(pickerEl);
    outsideClick = e => { if (pickerEl && !pickerEl.contains(e.target)) { pickerEl.remove(); pickerEl = null; document.removeEventListener('mousedown', outsideClick); } };
    setTimeout(() => document.addEventListener('mousedown', outsideClick), 0);
  });

  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:6px;align-items:center';
  row.appendChild(input);
  row.appendChild(pickerBtn);

  wrapper.appendChild(preview);
  wrapper.appendChild(row);
  return wrapper;
}

// ---- Items editor ----

function renderItemsEditor(items, template, variant) {
  const container = document.createElement('div');
  container.className = 'items-list';
  container.setAttribute('data-items-list', 'true');
  items.forEach((item, idx) => addItemRow(container, item, idx, template, variant, state.currentDeck));
  const addBtn = mkAddItemBtn(container, items, template, variant);
  container.appendChild(addBtn);
  dom.formBody.appendChild(container);
}

function mkAddItemBtn(container, items, template, variant) {
  const btn = document.createElement('button');
  btn.className = 'btn-add-item';
  btn.textContent = '+ Add item';
  btn.addEventListener('click', () => {
    const item = emptyItem(template, variant);
    items.push(item);
    btn.remove();
    addItemRow(container, item, items.length - 1, template, variant, state.currentDeck);
    container.appendChild(mkAddItemBtn(container, items, template, variant));
    markUnsaved();
  });
  return btn;
}

function emptyItem(template, variant) {
  if (template === 'big-list') {
    if (variant === 'glossary') return { term: '', desc: '' };
    if (variant === 'checklist') return { text: '', state: 'todo' };
    return { text: '' };
  }
  if (template === 'icon') return { glyph: '' };
  if (template === 'three-ideas') return { title: '', desc: '' };
  if (template === 'agenda') return { content: '' };
  return { text: '' };
}

function addItemRow(container, item, idx, template, variant, deckSlug) {
  const row = document.createElement('div');
  row.className = 'item-row';
  row.dataset.itemIndex = idx;

  const header = document.createElement('div');
  header.className = 'item-header';
  header.innerHTML = `
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style="color:#666">
      <circle cx="3" cy="2" r="1" fill="currentColor"/><circle cx="7" cy="2" r="1" fill="currentColor"/>
      <circle cx="3" cy="5" r="1" fill="currentColor"/><circle cx="7" cy="5" r="1" fill="currentColor"/>
      <circle cx="3" cy="8" r="1" fill="currentColor"/><circle cx="7" cy="8" r="1" fill="currentColor"/>
    </svg>
    <span class="item-index">${idx + 1}</span>`;

  const delBtn = document.createElement('button');
  delBtn.className = 'btn-icon btn-danger';
  delBtn.style.marginLeft = 'auto';
  delBtn.title = 'Remove item';
  delBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M4.5 3V2h3v1M4 3l.5 6.5h3L8 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`;
  delBtn.addEventListener('click', () => {
    row.remove();
    container.querySelectorAll('.item-row').forEach((r, i) => {
      const sp = r.querySelector('.item-index');
      if (sp) sp.textContent = i + 1;
      r.dataset.itemIndex = i;
    });
    markUnsaved();
  });
  header.appendChild(delBtn);
  row.appendChild(header);

  const fields = document.createElement('div');
  fields.className = 'item-fields';
  const keys = Object.keys(item).filter(k => !k.startsWith('_'));
  (keys.length > 0 ? keys : ['text']).forEach(key => {
    const lbl = document.createElement('span');
    lbl.className = 'field-label';
    lbl.textContent = key;

    let inputEl;
    if (key === 'glyph') {
      inputEl = mkGlyphInput(item[key] ?? '', deckSlug);
    } else {
      inputEl = document.createElement('textarea');
      inputEl.dataset.itemField = key;
      inputEl.value = item[key] ?? '';
      inputEl.rows = 2;
      inputEl.style.minHeight = '40px';
      inputEl.addEventListener('input', markUnsaved);
    }

    const w = document.createElement('div');
    w.style.cssText = 'display:flex;flex-direction:column;gap:3px';
    w.appendChild(lbl);
    w.appendChild(inputEl);
    fields.appendChild(w);
  });
  row.appendChild(fields);

  const addBtn = container.querySelector('.btn-add-item');
  if (addBtn) container.insertBefore(row, addBtn);
  else container.appendChild(row);
}

// ---- Collect form data ----

function collectFormData() {
  if (!state.slideData) return null;
  const existing = JSON.parse(JSON.stringify(state.slideData.data));
  const newData = { ...existing };

  dom.formBody.querySelectorAll('[data-field]').forEach(el => {
    const field = el.dataset.field;
    // contenteditable RTE div uses innerHTML; inputs/selects use value
    const val = el.contentEditable === 'true' ? cleanHTML(el.innerHTML) : el.value;
    if (field.startsWith('fields.')) {
      const key = field.slice('fields.'.length);
      if (!newData.fields) newData.fields = {};
      const old = existing.fields?.[key];
      newData.fields[key] = (typeof old === 'object' && old !== null)
        ? { ...old, content: val }
        : val;
    } else if (field === 'mode' && val === '') {
      delete newData.mode;
    } else {
      newData[field] = val;
    }
  });

  // Speaker notes
  const notesVal = dom.notesTextarea.value;
  if (notesVal.trim()) {
    newData.notes = notesVal;
  } else {
    delete newData.notes;
  }

  // Items
  const container = dom.formBody.querySelector('[data-items-list]');
  if (container) {
    const rows = container.querySelectorAll('.item-row');
    newData.items = [...rows].map(row => {
      const item = {};
      row.querySelectorAll('[data-item-field]').forEach(el => {
        const key = el.dataset.itemField;
        if (el.dataset.glyphWrapper) {
          const textInput = el.querySelector('.glyph-text-input');
          item[key] = displayToGlyph(textInput?.value ?? '', state.currentDeck);
        } else {
          item[key] = el.value;
        }
      });
      return item;
    });
  }

  return newData;
}

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
    state.livePreviewTimer = setTimeout(() => previewWrite(), 600);
  }
}

async function refreshGitStatus() {
  try {
    const { modified } = await apiFetch('/api/git-status');
    state.uncommittedFiles.clear();
    // Only consider files that are actual slide files (.md in decks/)
    modified
      .filter(f => f.startsWith('decks/') && f.endsWith('.md'))
      .forEach(f => {
        const basename = f.split('/').pop();
        if (basename) state.uncommittedFiles.add(basename);
      });
    renderSidebar();
  } catch { /* git not available, ignore */ }
}

/** Write to disk silently for live preview — does NOT change save state or badge. */
async function previewWrite() {
  if (!state.selectedFilename || !state.currentDeck) return;
  const newData = collectFormData();
  if (!newData) return;
  try {
    await apiFetch(`/api/decks/${state.currentDeck}/slides/${state.selectedFilename}`, {
      method: 'PUT',
      body: JSON.stringify({ data: newData }),
    });
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
    await apiFetch(`/api/decks/${state.currentDeck}/slides/${savedFilename}`, {
      method: 'PUT',
      body: JSON.stringify({ data: newData }),
    });
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
      tmplSlides = await apiFetch('/api/template-slides');
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
    const result = await apiFetch(`/api/decks/${state.currentDeck}/slides`, {
      method: 'POST',
      body: JSON.stringify({ template, variant, recipe, label, position }),
    });
    await loadSlides();
    await selectSlide(result.filename);
    toast('Slide added');
  } catch (e) {
    toast('Add failed: ' + e.message, 'error');
  }
}

// ---- Delete slide ----

let pendingDelete = null;

function confirmDelete(filename) {
  const target = filename ?? state.selectedFilename;
  if (!target) return;
  const slide = state.slides.find(s => s.filename === target);
  pendingDelete = target;
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

async function doDelete() {
  if (!pendingDelete) return;
  const fn = pendingDelete;
  pendingDelete = null;
  dom.modalConfirm.hidden = true;
  try {
    await apiFetch(`/api/decks/${state.currentDeck}/slides/${fn}`, { method: 'DELETE' });
    await loadSlides();
    if (state.slides.length > 0) {
      await selectSlide(state.slides[0].filename);
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
    const res = await fetch(`/api/decks/${state.currentDeck}/export-pdf`, { method: 'POST' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(data.error || res.statusText);
    }
    const blob = await res.blob();
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

// ---- Helpers ----

function escHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function closeModals() {
  dom.modalAdd.hidden = true;
  dom.modalConfirm.hidden = true;
  pendingDelete = null;
  if (zoomPopup) zoomPopup.style.display = 'none';
  closeSlideContextMenu();
}

// ---- Event wiring ----

function wireEvents() {
  dom.deckSelector.addEventListener('change', e => selectDeck(e.target.value));
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
    const meta = await apiFetch('/api/templates');
    Object.assign(TMPL, meta);
  } catch {
    ['cover','big-concept','big-stat','quote','three-ideas','big-list','agenda','matrix',
     'roadmap','code-block','chart','comparison-table','kpi-grid','concept-shift',
     'resource-cards','speaker-bio','stack','faq','closing-qr','closing-socials',
     'demo','social-embed','icon','word-cloud'].forEach(n => {
      TMPL[n] = { variants: [{ name: 'default' }] };
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
