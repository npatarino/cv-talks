/**
 * Scaffold de templates: esqueleto vacío (fields/items) de un template, usado
 * para sembrar slides nuevas y para reformar el formulario al cambiar de template.
 */

import fs from 'node:fs';
import path from 'node:path';
import { parseMd } from '../lib/frontmatter.mjs';
import { TEMPLATES_DIR } from '../../config.mjs';

/**
 * Read the template gallery slide matching `template`/`variant` and return
 * a blanked-out copy of its `fields` and `items` — same keys/structure, but
 * with all text content replaced by empty strings. Used as the scaffold for
 * a newly-created slide so the editor form has something to render.
 *
 * Falls back to a sibling variant ("default" or the first available) when
 * the exact pair isn't on disk. Returns null when the template has no
 * scaffold file at all (synthetic templates).
 *
 * Exported so tests can call it directly. `templatesDir` is overridable
 * for testing without monkey-patching paths.
 */
export function loadTemplateScaffold(template, variant, templatesDir = TEMPLATES_DIR) {
  if (!fs.existsSync(templatesDir)) return null;

  const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.md'));
  // Prefer exact match, then "<template>-default", then any matching template.
  const candidates = [
    f => f.endsWith(`-${template}-${variant}.md`) || f === `${template}-${variant}.md`,
    f => f.endsWith(`-${template}-default.md`) || f === `${template}-default.md`,
    f => f.includes(`-${template}-`) || f.startsWith(`${template}-`),
  ];

  let match = null;
  for (const pred of candidates) {
    match = files.find(pred);
    if (match) break;
  }
  if (!match) return null;

  const raw = fs.readFileSync(path.join(templatesDir, match), 'utf8');
  const { data } = parseMd(raw);
  return {
    fields: data.fields ? blankFields(data.fields) : undefined,
    items:  Array.isArray(data.items) ? blankItems(data.items) : undefined,
    itemsMarkdown: (data.template === 'big-list' || data.itemsMarkdown !== undefined) ? '' : undefined,
  };
}

/** Recursively blank string-valued props inside a fields object. */
function blankFields(fields) {
  const out = {};
  for (const [key, val] of Object.entries(fields)) {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      // Preserve { content, meta } shape; clear content only.
      out[key] = { ...val, content: '' };
    } else {
      out[key] = '';
    }
  }
  return out;
}

/** Blank the text-bearing keys in each item, preserving structure (sub-arrays, etc). */
function blankItems(items) {
  return items.map(item => {
    if (item == null || typeof item !== 'object') return { text: '' };
    return blankItem(item);
  });
}

function blankItem(item) {
  const out = {};
  for (const [key, val] of Object.entries(item)) {
    if (typeof val === 'string') {
      // Preserve enum-ish flags ('state', 'n' numbering) and keep glyph empty.
      if (key === 'state') out[key] = val;
      else out[key] = '';
    } else if (Array.isArray(val)) {
      out[key] = val.map(v => (typeof v === 'object' && v !== null) ? blankItem(v) : '');
    } else if (val && typeof val === 'object') {
      out[key] = blankItem(val);
    } else {
      out[key] = val;
    }
  }
  return out;
}
