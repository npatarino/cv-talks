/** Constructores de los controles básicos del formulario de propiedades. */

import { dom } from '../dom.js';
import { state } from '../state.js';

export function addSection(title) {
  const el = document.createElement('div');
  el.className = 'section-title';
  el.textContent = title;
  dom.formBody.appendChild(el);
}

export function addField(label, input) {
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

export function mkInput(type, field, value, placeholder) {
  const el = document.createElement('input');
  el.type = type;
  el.dataset.field = field;
  el.value = value ?? '';
  if (placeholder) el.placeholder = placeholder;
  return el;
}

export function mkTextarea(field, value) {
  const el = document.createElement('textarea');
  el.dataset.field = field;
  el.value = value ?? '';
  el.className = 'code-field';
  el.rows = 6;
  el.spellcheck = false;
  return el;
}

export function mkSelect(field, options, current) {
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

export function mkCheckbox(field, checked) {
  const el = document.createElement('input');
  el.type = 'checkbox';
  el.dataset.field = field;
  el.checked = !!checked;
  el.className = 'switch-input';
  return el;
}

export function mkTemplateSelect(field, current) {
  return mkSelect(field, Object.keys(state.templates).map(t => ({ value: t, label: t })), current);
}

export function mkVariantSelect(field, template, current) {
  const variants = state.templates[template]?.variants ?? [{ name: 'default' }];
  return mkSelect(field, variants.map(v => ({ value: v.name, label: v.name + (v.usage ? ' — ' + v.usage.slice(0, 40) : '') })), current);
}

export function mkRecipeSelect(field, current) {
  const recipes = ['canvas-quiet', 'canvas-signal', 'paper', 'energy-loud', 'cool-fresh', 'critical'];
  return mkSelect(field, recipes.map(r => ({ value: r, label: r })), current);
}

