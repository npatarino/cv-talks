/**
 * Renumber slides in a deck after add, move, or delete operations.
 *
 * Rules:
 * - `order` in frontmatter is the authoritative sort key.
 * - Filename prefix (`01-`, `02-`, ...) must always match `order`.
 * - The slug portion (everything after the first number prefix and dash) is preserved.
 * - Files are renamed to `{order padded 2}-{slug}.md`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { parseMd, serializeMd } from './frontmatter.mjs';

const SLIDE_FILE_RE = /^(\d+)-(.+)\.md$/;

/**
 * Get all slide files in a deck directory, sorted by current order frontmatter.
 * Returns array of { filename, filepath, data, body } objects.
 */
export function readSlides(deckDir) {
  if (!fs.existsSync(deckDir)) return [];

  const files = fs.readdirSync(deckDir).filter(f => {
    if (!f.endsWith('.md')) return false;
    if (f === 'index.md') return false;
    return SLIDE_FILE_RE.test(f);
  });

  const slides = files.map(filename => {
    const filepath = path.join(deckDir, filename);
    const raw = fs.readFileSync(filepath, 'utf8');
    const { data, body } = parseMd(raw);
    return { filename, filepath, data, body };
  });

  return slides.sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0));
}

/**
 * Extract the slug portion from a filename (strips numeric prefix).
 * `01-viernes-1530.md` → `viernes-1530`
 */
export function slugFromFilename(filename) {
  const match = filename.match(SLIDE_FILE_RE);
  if (!match) return filename.replace(/\.md$/, '');
  return match[2];
}

/**
 * Build a filename from order + slug.
 * order=3, slug='my-slide' → '03-my-slide.md'
 */
export function buildFilename(order, slug) {
  return `${String(order).padStart(2, '0')}-${slug}.md`;
}

/**
 * Renumber all slides in a deck so that order values are 1, 2, 3, ...
 * matching their sort position.
 *
 * Also renames files to match.
 *
 * @param {string} deckDir - absolute path to the deck directory
 * @param {string[]} [newOrder] - optional array of filenames in the desired order.
 *   If omitted, current order frontmatter values are used to determine sort.
 */
export function renumberSlides(deckDir, newOrder) {
  const slides = readSlides(deckDir);
  if (slides.length === 0) return [];

  let sorted;
  if (newOrder && newOrder.length > 0) {
    // Reorder by the provided filename sequence
    const byFilename = Object.fromEntries(slides.map(s => [s.filename, s]));
    sorted = newOrder
      .map(fn => byFilename[fn])
      .filter(Boolean);
    // Append any slides not in newOrder at the end (shouldn't happen normally)
    const provided = new Set(newOrder);
    for (const s of slides) {
      if (!provided.has(s.filename)) sorted.push(s);
    }
  } else {
    sorted = slides;
  }

  const result = [];

  // Two-pass rename to avoid conflicts when swapping filenames
  // Pass 1: rename all to temp names
  const tempNames = [];
  for (let i = 0; i < sorted.length; i++) {
    const slide = sorted[i];
    const newOrder = i + 1;
    const slug = slugFromFilename(slide.filename);
    const newFilename = buildFilename(newOrder, slug);
    const tempFilename = `__tmp_${i}__${newFilename}`;
    const tempPath = path.join(deckDir, tempFilename);
    fs.renameSync(slide.filepath, tempPath);
    tempNames.push({ tempPath, tempFilename, newFilename, newOrder, slide, slug });
  }

  // Pass 2: rename from temp to final + update frontmatter
  for (const { tempPath, newFilename, newOrder: order, slide, slug } of tempNames) {
    const finalPath = path.join(deckDir, newFilename);
    const newData = { ...slide.data, order };
    const newContent = serializeMd(newData, slide.body);
    fs.writeFileSync(tempPath, newContent, 'utf8');
    fs.renameSync(tempPath, finalPath);
    result.push({ filename: newFilename, order, slug, filepath: finalPath });
  }

  return result;
}

/**
 * Delete a slide file and renumber the remaining slides.
 * @returns {Array} - updated slide list after renumbering
 */
export function deleteSlide(deckDir, filename) {
  const filepath = path.join(deckDir, filename);
  if (!fs.existsSync(filepath)) throw new Error(`Slide not found: ${filename}`);
  fs.unlinkSync(filepath);
  return renumberSlides(deckDir);
}

/**
 * Move a slide to a new position (1-based) and renumber all slides.
 * @param {string} deckDir
 * @param {string} filename - the slide to move
 * @param {number} toPosition - 1-based target position
 * @returns {Array} - updated slide list
 */
export function moveSlide(deckDir, filename, toPosition) {
  const slides = readSlides(deckDir);
  const fromIdx = slides.findIndex(s => s.filename === filename);
  if (fromIdx === -1) throw new Error(`Slide not found: ${filename}`);

  const toIdx = Math.max(0, Math.min(slides.length - 1, toPosition - 1));
  const [moved] = slides.splice(fromIdx, 1);
  slides.splice(toIdx, 0, moved);

  return renumberSlides(deckDir, slides.map(s => s.filename));
}
