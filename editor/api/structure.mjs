/**
 * Deck structure API — keeps the narrative section map (e.g. ANSVA) in
 * `deck.config.json` in sync with the slides as they're created, deleted,
 * moved, or reordered.
 *
 * Model: each section is a contiguous positional range over slide `order`
 * numbers ({ id, label, start, end }). The set of sections always tiles the
 * deck end to end — section[0] starts at 1, each section starts right after
 * the previous one ends, and the last section ends at the slide count N.
 *
 * A slide's section is therefore decided by *where it sits* in the deck.
 * Consequences:
 *  - Reordering / moving slides leaves the boundaries untouched (N is
 *    unchanged) — a slide dragged across a boundary simply changes section.
 *  - Creating a slide shifts every boundary at or after the insert point so
 *    the surrounding sections keep the same slides; the new slide joins the
 *    section it was dropped into.
 *  - Deleting a slide shifts boundaries the other way.
 *
 * All boundary math lives in the pure functions (normalizeSections,
 * shiftOnInsert, shiftOnDelete, setBoundary) so they're trivially testable.
 * The deckDir-level helpers wrap them with config read/write.
 */

import fs from 'node:fs';
import path from 'node:path';
import { readSlides } from './renumber.mjs';
import { deckDir } from './decks.mjs';

const CONFIG_FILENAME = 'deck.config.json';

export function configPath(dir) {
  return path.join(dir, CONFIG_FILENAME);
}

export function readDeckConfig(dir) {
  const p = configPath(dir);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

export function writeDeckConfig(dir, config) {
  fs.writeFileSync(configPath(dir), JSON.stringify(config, null, 2) + '\n', 'utf8');
}

function slideCount(dir) {
  return readSlides(dir).length;
}

// ─── pure boundary math ──────────────────────────────────────────────────────

/**
 * Force a list of sections into a clean contiguous tiling of 1..n.
 *
 * Each section's `start` is treated as the *desired* boundary and clamped so
 * that boundaries are strictly increasing, the first section starts at 1, and
 * every section is left room for at least one slide. `end` is recomputed from
 * the next section's start (last section ends at n). Other keys (id, label…)
 * are preserved.
 */
export function normalizeSections(sections, n) {
  const k = sections.length;
  if (k === 0) return [];

  const starts = [];
  let prev = 0;
  for (let i = 0; i < k; i++) {
    const desired = Number.isFinite(sections[i].start) ? sections[i].start : i + 1;
    const lo = i === 0 ? 1 : prev + 1;
    // Leave room for the remaining (k - 1 - i) sections, each ≥ 1 slide.
    const hi = Math.max(lo, n - (k - 1 - i));
    // The first section always covers the deck start (slide 1).
    const start = i === 0 ? 1 : Math.min(Math.max(desired, lo), hi);
    starts.push(start);
    prev = start;
  }

  return sections.map((s, i) => ({
    ...s,
    start: starts[i],
    end: i < k - 1 ? starts[i + 1] - 1 : n,
  }));
}

/**
 * Shift boundaries after a slide is inserted at `position` (1-based order the
 * new slide takes). The new slide joins the section it landed in; later
 * sections move down by one. `newCount` is N *after* the insert.
 */
export function shiftOnInsert(sections, position, newCount) {
  const shifted = sections.map(s => ({
    ...s,
    start: s.start >= position ? s.start + 1 : s.start,
  }));
  return normalizeSections(shifted, newCount);
}

/**
 * Shift boundaries after the slide at `order` is deleted. `newCount` is N
 * *after* the delete.
 */
export function shiftOnDelete(sections, order, newCount) {
  const shifted = sections.map(s => ({
    ...s,
    start: s.start > order ? s.start - 1 : s.start,
  }));
  return normalizeSections(shifted, newCount);
}

/**
 * Move the boundary at the start of `index` to `newStart`, clamped to sit
 * strictly between its neighbours (it can't cross another boundary). The
 * first section's boundary (index 0) is pinned at 1 and can't move.
 */
export function setBoundary(sections, index, newStart, n) {
  const k = sections.length;
  if (index <= 0 || index >= k) return normalizeSections(sections, n);
  const lo = sections[index - 1].start + 1;
  const hi = index + 1 < k ? sections[index + 1].start - 1 : n;
  const clamped = Math.min(Math.max(newStart, lo), Math.max(lo, hi));
  const next = sections.map((s, i) => (i === index ? { ...s, start: clamped } : s));
  return normalizeSections(next, n);
}

// ─── deckDir-level helpers ─────────────────────────────────────────────────────

/** Read + normalize the structure for a deck, or null if it has none. */
export function getStructure(slug, decksRoot) {
  const dir = deckDir(slug, decksRoot);
  const cfg = readDeckConfig(dir);
  if (!cfg?.structure?.sections?.length) return null;
  const n = slideCount(dir);
  return {
    type: cfg.structure.type ?? null,
    slideCount: n,
    sections: normalizeSections(cfg.structure.sections, n),
  };
}

/** After a slide insert at `position`, re-tile the structure (no-op if none). */
export function syncStructureOnInsert(dir, position) {
  const cfg = readDeckConfig(dir);
  if (!cfg?.structure?.sections?.length) return;
  cfg.structure.sections = shiftOnInsert(cfg.structure.sections, position, slideCount(dir));
  writeDeckConfig(dir, cfg);
}

/** After a slide delete at `order`, re-tile the structure (no-op if none). */
export function syncStructureOnDelete(dir, order) {
  const cfg = readDeckConfig(dir);
  if (!cfg?.structure?.sections?.length) return;
  cfg.structure.sections = shiftOnDelete(cfg.structure.sections, order, slideCount(dir));
  writeDeckConfig(dir, cfg);
}

/** Move a section boundary and persist. Returns the new normalized structure. */
export function setStructureBoundary(slug, index, newStart, decksRoot) {
  const dir = deckDir(slug, decksRoot);
  const cfg = readDeckConfig(dir);
  if (!cfg?.structure?.sections?.length) throw new Error('Deck has no structure');
  const n = slideCount(dir);
  const normalized = normalizeSections(cfg.structure.sections, n);
  cfg.structure.sections = setBoundary(normalized, index, newStart, n);
  writeDeckConfig(dir, cfg);
  return getStructure(slug, decksRoot);
}
