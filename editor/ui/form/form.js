/**
 * Formulario de propiedades de la slide seleccionada: se construye a partir de
 * los datos (renderForm), se lee de vuelta (collectFormData) y se reforma al
 * cambiar de template o variante. Avisa de cualquier cambio con 'form:changed'.
 */

import { dom } from '../dom.js';
import { state } from '../state.js';
import { emit } from '../events.js';
import { toast } from '../toast.js';
import { getTemplateScaffold } from '../api-client.js';
import { mergeFields } from '../lib/editor-helpers.mjs';
import { displayToGlyph } from '../lib/glyph.mjs';
import { TEMPLATE_OPTIONAL_FIELDS, isRawHtmlField, structuredItemsToMarkdown } from '../lib/template-rules.mjs';
import { addSection, addField, mkInput, mkTextarea, mkSelect, mkCheckbox, mkTemplateSelect, mkVariantSelect, mkRecipeSelect } from './controls.js';
import { mkRichTextEditor, cleanHTML } from './rich-text.js';
import { renderItemsEditor } from './items-editor.js';

export function renderForm(slide) {
  const { data } = slide;
  if (state.fieldStashFor !== state.selectedFilename) { state.fieldStash = {}; state.fieldStashFor = state.selectedFilename; }
  stashFields(data.fields);
  dom.formBody.innerHTML = '';

  addSection('Slide Meta');
  addField('Label', mkInput('text', 'label', data.label ?? '', 'Slide label…'));
  addField('Template', mkTemplateSelect('template', data.template));
  addField('Variant', mkVariantSelect('variant', data.template, data.variant ?? 'default'));
  addField('Recipe', mkRecipeSelect('recipe', data.recipe ?? 'canvas-quiet'));

  // Fields-based content — rich text editor
  if (data.fields && typeof data.fields === 'object') {
    addSection('Fields');

    // Surface template-optional fields the slide doesn't have yet (e.g. the
    // big-concept `icon`), rendered first so they sit above the title — which
    // is exactly where they render on the slide.
    const optional = TEMPLATE_OPTIONAL_FIELDS[data.template] || {};
    const entries = [
      ...Object.entries(optional).filter(([k]) => !(k in data.fields)),
      ...Object.entries(data.fields),
    ];

    for (const [key, fieldObj] of entries) {
      const content = typeof fieldObj === 'object' ? (fieldObj?.content ?? '') : String(fieldObj ?? '');
      const meta = typeof fieldObj === 'object' ? (fieldObj?.meta ?? key) : key;
      // Raw HTML/JS blocks (animated backgrounds, embeds, positioned markup)
      // must NOT go through the contenteditable RTE: a `position:absolute`
      // child escapes into the panel as an invisible overlay that swallows all
      // pointer events (freezing the whole editor), and cleanHTML() would strip
      // its style/script on save. Edit those as plain code instead.
      const input = isRawHtmlField(content, meta)
        ? mkTextarea(`fields.${key}`, content)
        : mkRichTextEditor(`fields.${key}`, content, state.currentDeck, meta);
      const wrapper = addField(key, input);
      if (meta !== key) {
        const m = document.createElement('span');
        m.className = 'field-meta';
        m.textContent = meta;
        wrapper.appendChild(m);
      }
    }

    // big-concept: opt-in switch to recolor the icon to the recipe text color.
    if (data.template === 'big-concept') {
      addField('Tint icon to text color', mkCheckbox('iconTint', data.iconTint));
    }
  }

  // Items-based content
  if (data.template === 'big-list') {
    addSection('Items (Markdown)');
    if (!data.itemsMarkdown && Array.isArray(data.items)) {
      data.itemsMarkdown = structuredItemsToMarkdown(data.items, data.variant ?? 'default');
    }
    const textarea = document.createElement('textarea');
    textarea.className = 'form-control textarea-markdown-list';
    textarea.style.fontFamily = 'monospace';
    textarea.style.fontSize = '14px';
    textarea.style.lineHeight = '1.5';
    textarea.style.minHeight = '200px';
    textarea.style.width = '100%';
    textarea.style.padding = '10px';
    textarea.style.boxSizing = 'border-box';
    textarea.style.border = '1px solid var(--border-color, #ccc)';
    textarea.style.borderRadius = '4px';
    textarea.value = data.itemsMarkdown ?? '';
    textarea.dataset.field = 'itemsMarkdown';
    
    addField('List Content', textarea);
  } else if (Array.isArray(data.items)) {
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

  // Mark unsaved on any change (RTEs emit their own events)
  dom.formBody.querySelectorAll('input, textarea, select').forEach(el => {
    el.addEventListener('input', () => emit('form:changed'));
    if (el.dataset.field === 'template') {
      el.addEventListener('change', () => onTemplateChange(el.value));
    }
    if (el.dataset.field === 'variant') {
      el.addEventListener('change', () => onVariantChange(el.value));
    }
  });
}

export function collectFormData() {
  if (!state.slideData) return null;
  const existing = JSON.parse(JSON.stringify(state.slideData.data));
  const newData = { ...existing };

  dom.formBody.querySelectorAll('[data-field]').forEach(el => {
    const field = el.dataset.field;
    // contenteditable RTE div uses innerHTML; image-only RTEs also use innerHTML; inputs/selects use value
    const isRteDiv = el.classList.contains('rte-editor');
    const isCheckbox = el.type === 'checkbox';
    const val = isRteDiv ? cleanHTML(el.innerHTML) : (isCheckbox ? el.checked : el.value);
    if (field.startsWith('fields.')) {
      const key = field.slice('fields.'.length);
      if (!newData.fields) newData.fields = {};
      const old = existing.fields?.[key];
      if (typeof old === 'object' && old !== null) {
        newData.fields[key] = { ...old, content: val };
      } else if (el.dataset.meta) {
        // Newly-added field (not in the slide before): keep the { content, meta }
        // shape templates expect, using the meta carried by the editor element.
        newData.fields[key] = { content: val, meta: el.dataset.meta };
      } else {
        newData.fields[key] = val;
      }
    } else if (field === 'mode' && val === '') {
      delete newData.mode;
    } else if (isCheckbox) {
      // Boolean flags (e.g. iconTint): persist only when on, to keep frontmatter clean.
      if (val) newData[field] = true; else delete newData[field];
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
      const item = row._itemRef ? { ...row._itemRef } : {};
      row.querySelectorAll('[data-item-field]').forEach(el => {
        const key = el.dataset.itemField;
        if (el.dataset.glyphWrapper) {
          const textInput = el.querySelector('.glyph-text-input');
          item[key] = displayToGlyph(textInput?.value ?? '');
        } else {
          item[key] = el.value;
        }
      });
      return item;
    });
  }

  // Drop empty template-optional fields so slides that don't use them (e.g. a
  // big-concept without an icon) don't accumulate blank entries in the .md.
  const optional = TEMPLATE_OPTIONAL_FIELDS[newData.template] || {};
  for (const k of Object.keys(optional)) {
    const f = newData.fields?.[k];
    const content = (f && typeof f === 'object') ? (f.content ?? '') : (f ?? '');
    if (newData.fields && !String(content).trim()) delete newData.fields[k];
  }

  if (newData.template === 'big-list') {
    delete newData.items;
  }

  return newData;
}

export function clearForm() {
  dom.formBody.innerHTML = '<div class="empty-state">Select a slide to edit</div>';
  dom.notesTextarea.value = '';
  dom.notesTextarea.disabled = true;
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
/** Fields seen for the open slide, so switching template/variant and back never
 *  loses content that the intermediate template didn't have a field for. */
function stashFields(fields) {
  if (!state.fieldStash) state.fieldStash = {};
  if (fields && typeof fields === 'object') {
    for (const [k, v] of Object.entries(fields)) {
      const content = typeof v === 'object' ? (v?.content ?? '') : String(v ?? '');
      if (content !== '') state.fieldStash[k] = v;
    }
  }
  return state.fieldStash;
}

async function onTemplateChange(newTemplate) {
  const current = collectFormData();
  if (!current) return;
  const remembered = { ...stashFields(current.fields), ...(current.fields ?? {}) };

  // Variant always resets to "default" — the previous variant only makes sense
  // within the previous template's variant set.
  const newVariant = 'default';

  let scaffold;
  try {
    scaffold = await getTemplateScaffold(newTemplate, newVariant);
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
    merged.fields = mergeFields(scaffold.fields, remembered);
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

  if (scaffold.itemsMarkdown !== undefined) {
    merged.itemsMarkdown = scaffold.itemsMarkdown;
  } else {
    delete merged.itemsMarkdown;
  }

  // Mutate in-place so the re-render sees the new shape.
  state.slideData = { ...state.slideData, data: merged };
  renderForm(state.slideData);
  emit('form:changed');
}

/** Same reshape, but only for variant changes (template stays the same). */
async function onVariantChange(newVariant) {
  const current = collectFormData();
  if (!current) return;
  const template = current.template;
  const remembered = { ...stashFields(current.fields), ...(current.fields ?? {}) };

  let scaffold;
  try {
    scaffold = await getTemplateScaffold(template, newVariant);
  } catch {
    // Variant changes shouldn't be fatal — just mark unsaved and let the user save.
    emit('form:changed');
    return;
  }

  const merged = { ...current, variant: newVariant };
  if (scaffold.fields) merged.fields = mergeFields(scaffold.fields, remembered);
  // For variants we keep existing items as-is — different variants of the same
  // template (e.g. big-list numeric/bullets/checklist) share the items shape
  // closely enough that wiping would surprise the user.

  if (scaffold.itemsMarkdown !== undefined) {
    if (merged.itemsMarkdown === undefined) {
      merged.itemsMarkdown = scaffold.itemsMarkdown;
    }
  } else {
    delete merged.itemsMarkdown;
  }

  state.slideData = { ...state.slideData, data: merged };
  renderForm(state.slideData);
  emit('form:changed');
}
