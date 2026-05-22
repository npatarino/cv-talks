/**
 * Slides API — CRUD operations on slides within a deck.
 *
 * All exported functions accept an optional `decksRoot` as their last
 * parameter so tests can redirect to a tmpdir without vi.mock.
 */

import fs from 'node:fs';
import path from 'node:path';
import { parseMd, serializeMd } from './frontmatter.mjs';
import { readSlides, renumberSlides, deleteSlide, moveSlide, buildFilename, slugFromFilename } from './renumber.mjs';
import { deckDir } from './decks.mjs';

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
  const filepath = path.join(deckDir(slug, decksRoot), filename);
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
  const slideSlug = opts.slug ?? slugify(opts.label ?? opts.template ?? 'slide');

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

  // Reorder: insert the new slide at the desired position
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

export function updateSlide(slug, filename, updates, decksRoot) {
  const dir = deckDir(slug, decksRoot);
  const filepath = path.join(dir, filename);
  if (!fs.existsSync(filepath)) throw new Error(`Slide not found: ${filename}`);

  const raw = fs.readFileSync(filepath, 'utf8');
  const { data: existing, body: existingBody } = parseMd(raw);

  const newData = { ...existing, ...updates.data };
  const newBody = updates.body !== undefined ? updates.body : existingBody;

  fs.writeFileSync(filepath, serializeMd(newData, newBody), 'utf8');

  return { filename, previewUrl: slidePreviewUrl(slug, filename) };
}

export function removeSlide(slug, filename, decksRoot) {
  return deleteSlide(deckDir(slug, decksRoot), filename);
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
