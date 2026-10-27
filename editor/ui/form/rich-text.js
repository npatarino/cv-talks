/**
 * Editor de texto enriquecido de los campos de una slide (contenteditable con
 * negrita/cursiva, salto de línea e inserción de imágenes del deck).
 */

import { state } from '../state.js';
import { emit } from '../events.js';
import { buildAssetInsertHTML, buildAssetSrc } from '../editor-helpers.mjs';
import { toEditorHTML as toEditorHTMLFor, cleanHTML as cleanHTMLFor } from '../lib/html-transform.mjs';
import { openAssetPicker } from '../assets/picker.js';

/** Stored slide HTML → editor-renderable HTML. */
export function toEditorHTML(html) {
  return toEditorHTMLFor(html, state.currentDeck, state.previewOrigin);
}

/** Editor HTML → clean slide HTML. */
export function cleanHTML(html) {
  return cleanHTMLFor(html, state.previewOrigin);
}

export function mkRichTextEditor(field, htmlValue, deckSlug, meta) {
  const isImageOnly = meta === 'Image_Src';
  const wrapper = document.createElement('div');
  wrapper.className = 'rte-wrapper';

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'rte-toolbar';

  // Image-only fields show only the image picker; no text formatting controls.
  const btns = isImageOnly ? [
    { cmd: 'img',   label: '🖼 Image', title: 'Select image from assets' },
    { cmd: 'sep' },
    { cmd: 'clear', label: '✕',       title: 'Clear image' },
  ] : [
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
  editor.className = 'rte-editor' + (isImageOnly ? ' rte-editor--image-only' : '');
  editor.contentEditable = isImageOnly ? 'false' : 'true';
  editor.dataset.field = field;
  if (meta) editor.dataset.meta = meta;
  editor.innerHTML = toEditorHTML(htmlValue);

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
  editor.addEventListener('input', () => emit('form:changed'));

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
    emit('form:changed');
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
    emit('form:changed');
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
    emit('form:changed');
  }

  // Asset picker (compartido con el campo glyph)
  let picker = null;

  function insertAsset(filename) {
    const html = toEditorHTML(buildAssetInsertHTML(buildAssetSrc(deckSlug, filename)));

    // Image-only fields (e.g. the big-concept `icon`) hold a single image —
    // replace whatever's there rather than appending.
    if (isImageOnly) {
      editor.innerHTML = html;
      emit('form:changed');
        return;
    }

    // Insert via the Range API rather than execCommand: the latter silently
    // does nothing when the editor isn't the focused element (e.g. after the
    // icon-browser modal closed), which is exactly when picks were getting
    // lost — never inserted, never saved.
    editor.focus();
    const sel = window.getSelection();
    const range = (savedRange && editor.contains(savedRange.commonAncestorContainer))
      ? savedRange
      : null;

    if (range) {
      sel.removeAllRanges();
      sel.addRange(range);
      range.deleteContents();
      const frag = range.createContextualFragment(html);
      const last = frag.lastChild;
      range.insertNode(frag);
      if (last) {
        const after = document.createRange();
        after.setStartAfter(last);
        after.collapse(true);
        sel.removeAllRanges();
        sel.addRange(after);
        savedRange = after.cloneRange();
      }
    } else {
      editor.insertAdjacentHTML('beforeend', html);
    }

    emit('form:changed');
  }

  async function openPicker() {
    saveSelection();
    picker?.close();
    picker = await openAssetPicker({
      anchor: toolbar.querySelector('[data-cmd="img"]'),
      deckSlug,
      onPick: insertAsset,
      onClose: () => { picker = null; },
    });
  }

  // Toolbar button handlers
  // e.preventDefault() keeps the editor focused and selection intact — no editor.focus() needed
  toolbar.addEventListener('mousedown', e => {
    const btn = e.target.closest('[data-cmd]');
    if (!btn) return;
    const cmd = btn.dataset.cmd;
    if (cmd === 'img') { e.preventDefault(); openPicker(); return; }
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
