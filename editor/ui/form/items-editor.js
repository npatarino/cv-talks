/** Editor de la lista `items` de los templates que la usan (una fila por item). */

import { dom } from '../dom.js';
import { state } from '../state.js';
import { emit } from '../events.js';
import { emptyItem } from '../lib/template-rules.mjs';
import { mkGlyphInput } from './glyph-input.js';

export function renderItemsEditor(items, template, variant) {
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
    emit('form:changed');
  });
  return btn;
}

function addItemRow(container, item, idx, template, variant, deckSlug) {
  const row = document.createElement('div');
  row.className = 'item-row';
  row.dataset.itemIndex = idx;
  row._itemRef = item; // Store reference to preserve complex/unrendered properties

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
    emit('form:changed');
  });
  header.appendChild(delBtn);
  row.appendChild(header);

  const fields = document.createElement('div');
  fields.className = 'item-fields';
  const keys = Object.keys(item).filter(k => !k.startsWith('_') && k !== 'sub');
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
      inputEl.addEventListener('input', () => emit('form:changed'));
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
