/**
 * Slides API — CRUD operations on slides within a deck.
 *
 * All exported functions accept an optional `decksRoot` as their last
 * parameter so tests can redirect to a tmpdir without vi.mock.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMd, serializeMd } from './frontmatter.mjs';
import { readSlides, renumberSlides, deleteSlide, moveSlide, buildFilename, slugFromFilename, getSlideDir } from './renumber.mjs';
import { deckDir } from './decks.mjs';
import { syncStructureOnInsert, syncStructureOnDelete } from './structure.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, '../../templates');

export function listSlides(slug, decksRoot) {
  const dir = deckDir(slug, decksRoot);
  return readSlides(dir).map(s => ({
    filename: s.filename,
    order: s.data.order,
    label: s.data.label ?? '',
    template: s.data.template ?? '',
    recipe: s.data.recipe ?? '',
    variant: s.data.variant ?? 'default',
    previewUrl: slidePreviewUrl(slug, s.filename),
  }));
}

export function getSlide(slug, filename, decksRoot) {
  const filepath = path.join(getSlideDir(deckDir(slug, decksRoot)), filename);
  if (!fs.existsSync(filepath)) throw new Error(`Slide not found: ${filename}`);
  const raw = fs.readFileSync(filepath, 'utf8');
  const { data, body } = parseMd(raw);
  return {
    filename,
    data,
    body,
    previewUrl: slidePreviewUrl(slug, filename),
  };
}

export function createSlide(slug, opts, decksRoot) {
  const dir = deckDir(slug, decksRoot);
  const slides = readSlides(dir);

  const position = Math.max(1, Math.min(slides.length + 1, opts.position ?? slides.length + 1));
  let baseSlug = opts.slug ?? slugify(opts.label ?? opts.template ?? 'slide');

  const existingFilenames = new Set(slides.map(s => s.filename));
  let slideSlug = baseSlug;
  let counter = 2;
  while (existingFilenames.has(buildFilename(position, slideSlug))) {
    slideSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  const data = {
    template: opts.template ?? 'big-concept',
    recipe: opts.recipe ?? 'canvas-quiet',
        label: opts.label ?? `Slide ${position}`,
    variant: opts.variant ?? 'default',
  };

  // Seed fields/items from the matching template scaffold when the caller
  // didn't supply them. This gives newly-created slides an empty-but-valid
  // structure that the editor form can render (rather than a bare meta-only
  // slide where the right-hand panel shows no content fields).
  const scaffold = loadTemplateScaffold(data.template, data.variant, TEMPLATES_DIR);
  if (opts.fields) data.fields = opts.fields;
  else if (scaffold?.fields) data.fields = scaffold.fields;
  if (opts.items) data.items = opts.items;
  else if (scaffold?.items) data.items = scaffold.items;
  if (opts.itemsMarkdown !== undefined) data.itemsMarkdown = opts.itemsMarkdown;
  else if (scaffold?.itemsMarkdown !== undefined) data.itemsMarkdown = scaffold.itemsMarkdown;

  // Carry over optional top-level keys when provided (e.g. duplicating a slide
  // should preserve its speaker notes, mode override, and flags like iconTint).
  if (opts.notes != null) data.notes = opts.notes;
  if (opts.mode != null) data.mode = opts.mode;
  if (opts.iconTint != null) data.iconTint = opts.iconTint;

  // Write the new file temporarily with a high order number, then renumber all
  const tempOrder = slides.length + 99;
  const tempFilename = buildFilename(tempOrder, slideSlug);
  const tempPath = path.join(getSlideDir(dir), tempFilename);
  fs.writeFileSync(tempPath, serializeMd(data, ''), 'utf8');

  // Reorder: insert the new slide at the desired position
  const allSlides = readSlides(dir);
  const newIdx = allSlides.findIndex(s => s.filename === tempFilename);
  const reordered = [...allSlides];
  const [inserted] = reordered.splice(newIdx, 1);
  reordered.splice(position - 1, 0, inserted);

  renumberSlides(dir, reordered.map(s => s.filename));

  // Keep the narrative structure (e.g. ANSVA) tiling the deck: the new slide
  // joins the section it was inserted into; later sections shift down by one.
  syncStructureOnInsert(dir, position);

  const finalFilename = buildFilename(position, slideSlug);
  return {
    filename: finalFilename,
    order: position,
    previewUrl: slidePreviewUrl(slug, finalFilename),
  };
}

export function updateSlide(slug, filename, updates, decksRoot) {
  const dir = deckDir(slug, decksRoot);
  const filepath = path.join(getSlideDir(dir), filename);
  if (!fs.existsSync(filepath)) throw new Error(`Slide not found: ${filename}`);

  const raw = fs.readFileSync(filepath, 'utf8');
  const { data: existing, body: existingBody } = parseMd(raw);

  const newData = { ...existing, ...updates.data };
  const newBody = updates.body !== undefined ? updates.body : existingBody;

  fs.writeFileSync(filepath, serializeMd(newData, newBody), 'utf8');

  return { filename, previewUrl: slidePreviewUrl(slug, filename) };
}

export function removeSlide(slug, filename, decksRoot) {
  const dir = deckDir(slug, decksRoot);
  // Capture the slide's order before deletion so the structure can shift
  // boundaries to match the renumbered deck.
  const target = readSlides(dir).find(s => s.filename === filename);
  const order = target?.data.order;
  const result = deleteSlide(dir, filename);
  if (order != null) syncStructureOnDelete(dir, order);
  return result;
}

export function reorderSlides(slug, filenameOrder, decksRoot) {
  return renumberSlides(deckDir(slug, decksRoot), filenameOrder);
}

export function moveSlideTo(slug, filename, toPosition, decksRoot) {
  return moveSlide(deckDir(slug, decksRoot), filename, toPosition);
}

// ---------- helpers ----------

function slidePreviewUrl(slug, filename) {
  const fileSlug = filename.replace(/\.md$/, '');
  return `http://localhost:8080/talks/decks/${slug}/${fileSlug}/`;
}

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

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}
