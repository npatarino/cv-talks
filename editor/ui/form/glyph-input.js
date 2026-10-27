/** Campo "glyph" de un item: emoji, texto o imagen del deck (con vista previa). */

import { state } from '../state.js';
import { emit } from '../events.js';
import { IMAGE_EXT_RE, glyphToDisplay } from '../lib/glyph.mjs';
import { openAssetPicker } from '../assets/picker.js';

export function mkGlyphInput(rawValue, deckSlug) {
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
    const imgSrc = `${state.previewOrigin}/talks/decks/${deckSlug}/assets/${displayValue}`;
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
      preview.innerHTML = `<img src="${state.previewOrigin}/talks/decks/${deckSlug}/assets/${v}" alt="">`;
    } else {
      preview.textContent = v || '—';
    }
    emit('form:changed');
  });

  // Asset picker button
  const pickerBtn = document.createElement('button');
  pickerBtn.type = 'button';
  pickerBtn.className = 'rte-btn';
  pickerBtn.title = 'Pick from assets';
  pickerBtn.textContent = '🖼';

  let picker = null;
  pickerBtn.addEventListener('click', async () => {
    if (picker) { picker.close(); return; }
    picker = await openAssetPicker({
      anchor: pickerBtn,
      deckSlug,
      focusSearch: true,
      onClose: () => { picker = null; },
      onPick: (filename) => {
        input.value = filename;
        preview.innerHTML = `<img src="${state.previewOrigin}/talks/decks/${deckSlug}/assets/${filename}" alt="">`;
        emit('form:changed');
      },
    });
  });

  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:6px;align-items:center';
  row.appendChild(input);
  row.appendChild(pickerBtn);

  wrapper.appendChild(preview);
  wrapper.appendChild(row);
  return wrapper;
}
