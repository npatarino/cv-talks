/**
 * Lista de slides (sidebar): cabeceras de sección, badges de estado y
 * drag & drop. Solo pinta y emite eventos ('slide:select', 'slide:drop',
 * 'section:move', 'slide:menu'); quien decide qué hacer es el controlador.
 */

import { dom } from './dom.js';
import { emit } from './events.js';
import { escHtml } from './lib/strings.mjs';
import { state } from './state.js';

// Colors for ANSVA (and any future) section ids
export const SECTION_COLORS = {
  A1: '#e05252', N: '#e08c3a', S: '#3aaa6e', V: '#3a82d4', A2: '#9b59b6',
  // Sub-sections inside Necesidad share its orange family.
  P1: '#d98023', P2: '#d98023', P3: '#d98023', PS: '#d98023',
  // fallback for unknown ids
  default: '#888',
};

export function renderSidebar() {
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

    item.addEventListener('click', () => emit('slide:select', slide.filename));
    item.addEventListener('contextmenu', e => {
      e.preventDefault();
      emit('slide:menu', { x: e.clientX, y: e.clientY, filename: slide.filename });
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
        emit('section:move', { index: idx, start: slide.order });
      } else {
        emit('slide:drop', slide.filename);
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
