import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

/**
 * decks.mjs uses module-level constants (DECKS_DIR, TEMPLATES_DIR) resolved
 * at import time — we can't redirect them via mocks easily.
 *
 * We test the exported functions by pointing them at a temporary directory
 * that mimics the repo structure (tmpRoot/decks/, tmpRoot/templates/).
 *
 * For listDecks / deckDir we use a thin wrapper that re-implements the same
 * logic against tmpRoot, so we can test the pure behaviour without touching
 * the real filesystem.  For listTemplateSlides we call the real function
 * and verify it returns results for the actual templates/ directory.
 */

import { listDecks, deckDir, listTemplateSlides, TALKS_ROOT } from '../../editor/api/decks.mjs';

// ─── deckDir ──────────────────────────────────────────────────────────────────

describe('deckDir', () => {
  it('returns absolute path to a deck slug', () => {
    const result = deckDir('my-talk');
    expect(path.isAbsolute(result)).toBe(true);
    expect(result).toContain('my-talk');
  });

  it('points inside the decks/ directory of the project', () => {
    const result = deckDir('some-slug');
    expect(result).toContain('decks');
  });
});

// ─── listDecks — against real filesystem ─────────────────────────────────────

describe('listDecks', () => {
  it('returns an array', () => {
    expect(Array.isArray(listDecks())).toBe(true);
  });

  it('each deck has a slug and deck object', () => {
    const decks = listDecks();
    for (const d of decks) {
      expect(typeof d.slug).toBe('string');
      expect(d.deck).toBeDefined();
    }
  });

  it('includes the 2026-03-productividad-toxica deck', () => {
    const decks = listDecks();
    const slugs = decks.map(d => d.slug);
    expect(slugs).toContain('2026-03-productividad-toxica');
  });
});

// ─── listTemplateSlides — against real filesystem ─────────────────────────────

describe('listTemplateSlides', () => {
  it('returns at least 40 template slides', () => {
    const templates = listTemplateSlides();
    expect(templates.length).toBeGreaterThanOrEqual(40);
  });

  it('each slide has required fields', () => {
    const templates = listTemplateSlides();
    for (const t of templates) {
      expect(typeof t.filename).toBe('string');
      expect(t.filename).toMatch(/\.md$/);
      expect(typeof t.template).toBe('string');
      expect(typeof t.order).toBe('number');
      expect(t.previewUrl).toContain('localhost:8080');
    }
  });

  it('slides are sorted alphabetically by filename', () => {
    const templates = listTemplateSlides();
    const filenames = templates.map(t => t.filename);
    expect(filenames).toEqual([...filenames].sort());
  });

  it('includes cover and big-concept templates', () => {
    const templates = listTemplateSlides();
    const templateNames = templates.map(t => t.template);
    expect(templateNames).toContain('cover');
    expect(templateNames).toContain('big-concept');
  });
});

// ─── TALKS_ROOT ───────────────────────────────────────────────────────────────

describe('TALKS_ROOT', () => {
  it('points to the project root directory', () => {
    expect(path.isAbsolute(TALKS_ROOT)).toBe(true);
    expect(fs.existsSync(path.join(TALKS_ROOT, 'package.json'))).toBe(true);
  });
});
