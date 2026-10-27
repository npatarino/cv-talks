/**
 * Modal "Add slide": galería de templates con zoom al pasar el ratón, y el
 * panel de configuración (recipe, etiqueta, posición) de la nueva slide.
 */

import { getTemplateSlides } from './api-client.js';
import { $, dom } from './dom.js';
import { defaultInsertPosition } from './lib/editor-helpers.mjs';
import { escHtml } from './lib/strings.mjs';
import { state } from './state.js';

// Plantillas disponibles y selección actual (se cargan al abrir el modal la primera vez).
let tmplSlides = [];
let selectedTmplCard = null;

export async function openAddModal() {
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

export function renderGallery(query) {
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

/** Oculta el popup de zoom (al cerrar el modal). */
export function hideZoomPopup() {
  if (zoomPopup) zoomPopup.style.display = 'none';
}
