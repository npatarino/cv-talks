/**
 * Slides API — CRUD operations on slides within a deck.
 */

import fs from 'node:fs';
import path from 'node:path';
import { parseMd, serializeMd } from './frontmatter.mjs';
import { readSlides, renumberSlides, deleteSlide, moveSlide, buildFilename, slugFromFilename } from './renumber.mjs';
import { deckDir } from './decks.mjs';

/**
 * List all slides in a deck, ordered by `order` frontmatter.
 */
export function listSlides(slug) {
  const dir = deckDir(slug);
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

/**
 * Get a single slide's full data.
 */
export function getSlide(slug, filename) {
  const filepath = path.join(deckDir(slug), filename);
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

/**
 * Create a new slide at a given position.
 * @param {string} slug - deck slug
 * @param {object} opts - { template, recipe, label, variant, position, fields, items }
 */
export function createSlide(slug, opts) {
  const dir = deckDir(slug);
  const slides = readSlides(dir);

  const position = Math.max(1, Math.min(slides.length + 1, opts.position ?? slides.length + 1));
  const slideSlug = opts.slug ?? slugify(opts.label ?? opts.template ?? 'slide');

  // Shift existing slides to make room
  const newOrderForExisting = slides.map((s, idx) => {
    const currentPos = idx + 1;
    if (currentPos >= position) return s.filename;
    return s.filename;
  });

  const data = {
    template: opts.template ?? 'big-concept',
    recipe: opts.recipe ?? 'canvas-quiet',
    order: position,
    label: opts.label ?? `Slide ${position}`,
    variant: opts.variant ?? 'default',
  };

  if (opts.fields) data.fields = opts.fields;
  if (opts.items) data.items = opts.items;

  // Write the new file temporarily with a high order number, then renumber all
  const tempOrder = slides.length + 99;
  data.order = tempOrder;
  const tempFilename = buildFilename(tempOrder, slideSlug);
  const tempPath = path.join(dir, tempFilename);
  fs.writeFileSync(tempPath, serializeMd(data, ''), 'utf8');

  // Now reorder: insert the new slide at the desired position
  const allSlides = readSlides(dir);
  const newIdx = allSlides.findIndex(s => s.filename === tempFilename);
  const reordered = [...allSlides];
  const [inserted] = reordered.splice(newIdx, 1);
  reordered.splice(position - 1, 0, inserted);

  renumberSlides(dir, reordered.map(s => s.filename));

  const finalFilename = buildFilename(position, slideSlug);
  return {
    filename: finalFilename,
    order: position,
    previewUrl: slidePreviewUrl(slug, finalFilename),
  };
}

/**
 * Update a slide's frontmatter and/or body.
 * @param {string} slug - deck slug
 * @param {string} filename - current filename
 * @param {object} updates - { data, body } (data is merged into existing frontmatter)
 * @returns {{ filename }} — potentially renamed if label changed slug
 */
export function updateSlide(slug, filename, updates) {
  const dir = deckDir(slug);
  const filepath = path.join(dir, filename);
  if (!fs.existsSync(filepath)) throw new Error(`Slide not found: ${filename}`);

  const raw = fs.readFileSync(filepath, 'utf8');
  const { data: existing, body: existingBody } = parseMd(raw);

  const newData = { ...existing, ...updates.data };
  const newBody = updates.body !== undefined ? updates.body : existingBody;

  fs.writeFileSync(filepath, serializeMd(newData, newBody), 'utf8');

  return { filename, previewUrl: slidePreviewUrl(slug, filename) };
}

/**
 * Delete a slide and renumber remaining slides.
 */
export function removeSlide(slug, filename) {
  const dir = deckDir(slug);
  return deleteSlide(dir, filename);
}

/**
 * Reorder slides in a deck by providing a new ordered array of filenames.
 */
export function reorderSlides(slug, filenameOrder) {
  const dir = deckDir(slug);
  return renumberSlides(dir, filenameOrder);
}

/**
 * Move a slide to a new 1-based position.
 */
export function moveSlideTo(slug, filename, toPosition) {
  const dir = deckDir(slug);
  return moveSlide(dir, filename, toPosition);
}

// ---------- helpers ----------

function slidePreviewUrl(slug, filename) {
  const fileSlug = filename.replace(/\.md$/, '');
  return `http://localhost:8080/talks/decks/${slug}/${fileSlug}/`;
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
