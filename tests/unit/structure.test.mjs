import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  normalizeSections,
  shiftOnInsert,
  shiftOnDelete,
  setBoundary,
  readDeckConfig,
  writeDeckConfig,
  getStructure,
  syncStructureOnInsert,
  syncStructureOnDelete,
  setStructureBoundary,
} from '../../editor/api/structure.mjs';

// ─── fixtures ─────────────────────────────────────────────────────────────────

// The real productividad ANSVA map: 5 sections tiling 68 slides.
function ansva() {
  return [
    { id: 'A1', label: 'Atención',      start: 1,  end: 4  },
    { id: 'N',  label: 'Necesidad',     start: 5,  end: 19 },
    { id: 'S',  label: 'Solución',      start: 20, end: 42 },
    { id: 'V',  label: 'Visualización', start: 43, end: 59 },
    { id: 'A2', label: 'Acción',        start: 60, end: 68 },
  ];
}

const starts = secs => secs.map(s => s.start);
const ends = secs => secs.map(s => s.end);

/** A tiling is valid when it covers 1..n contiguously with no gaps/overlap. */
function isContiguousTiling(secs, n) {
  if (secs[0].start !== 1) return false;
  if (secs[secs.length - 1].end !== n) return false;
  for (let i = 1; i < secs.length; i++) {
    if (secs[i].start !== secs[i - 1].end + 1) return false;
  }
  return true;
}

// ─── normalizeSections ─────────────────────────────────────────────────────────

describe('normalizeSections', () => {
  it('leaves an already-valid tiling unchanged', () => {
    const out = normalizeSections(ansva(), 68);
    expect(starts(out)).toEqual([1, 5, 20, 43, 60]);
    expect(ends(out)).toEqual([4, 19, 42, 59, 68]);
  });

  it('preserves id and label', () => {
    const out = normalizeSections(ansva(), 68);
    expect(out[2].id).toBe('S');
    expect(out[2].label).toBe('Solución');
  });

  it('forces the first section to start at 1', () => {
    const secs = ansva();
    secs[0].start = 5;
    expect(normalizeSections(secs, 68)[0].start).toBe(1);
  });

  it('stretches the last section to cover N', () => {
    const out = normalizeSections(ansva(), 80);
    expect(out[4].end).toBe(80);
  });

  it('clamps a too-large boundary so each section keeps at least one slide', () => {
    const secs = ansva();
    secs[3].start = 999; // V wants to start past the end
    const out = normalizeSections(secs, 68);
    expect(isContiguousTiling(out, 68)).toBe(true);
    out.forEach(s => expect(s.end).toBeGreaterThanOrEqual(s.start));
  });
});

// ─── shiftOnInsert ──────────────────────────────────────────────────────────────

describe('shiftOnInsert', () => {
  it('grows the section the slide is inserted into and shifts later ones', () => {
    const out = shiftOnInsert(ansva(), 30, 69); // 30 is inside S (20-42)
    expect(starts(out)).toEqual([1, 5, 20, 44, 61]);
    expect(ends(out)).toEqual([4, 19, 43, 60, 69]);
    expect(isContiguousTiling(out, 69)).toBe(true);
  });

  it('joins the first section when inserting at the very front', () => {
    const out = shiftOnInsert(ansva(), 1, 69);
    expect(out[0].start).toBe(1);
    expect(out[0].end).toBe(5); // A1 grew from 4 to 5 slides
    expect(isContiguousTiling(out, 69)).toBe(true);
  });

  it('joins the last section when appending at the end', () => {
    const out = shiftOnInsert(ansva(), 69, 69);
    expect(out[4].start).toBe(60);
    expect(out[4].end).toBe(69); // A2 absorbed the appended slide
    expect(isContiguousTiling(out, 69)).toBe(true);
  });
});

// ─── shiftOnDelete ──────────────────────────────────────────────────────────────

describe('shiftOnDelete', () => {
  it('shrinks the section the slide was in and shifts later ones down', () => {
    const out = shiftOnDelete(ansva(), 30, 67); // 30 was inside S
    expect(starts(out)).toEqual([1, 5, 20, 42, 59]);
    expect(ends(out)).toEqual([4, 19, 41, 58, 67]);
    expect(isContiguousTiling(out, 67)).toBe(true);
  });

  it('keeps a section alive by absorbing the next slide when its only slide is deleted', () => {
    const secs = [
      { id: 'X', label: 'X', start: 1, end: 2 },
      { id: 'Y', label: 'Y', start: 3, end: 3 },
      { id: 'Z', label: 'Z', start: 4, end: 5 },
    ];
    const out = shiftOnDelete(secs, 3, 4); // delete Y's only slide
    expect(out).toHaveLength(3);
    expect(isContiguousTiling(out, 4)).toBe(true);
    out.forEach(s => expect(s.end).toBeGreaterThanOrEqual(s.start));
  });
});

// ─── setBoundary ────────────────────────────────────────────────────────────────

describe('setBoundary', () => {
  it('moves a section start within its neighbours', () => {
    const out = setBoundary(ansva(), 2, 25, 68); // S starts at 25 now
    expect(out[1].end).toBe(24); // N
    expect(out[2].start).toBe(25); // S
    expect(isContiguousTiling(out, 68)).toBe(true);
  });

  it('clamps so a boundary cannot cross the previous section', () => {
    const out = setBoundary(ansva(), 2, 1, 68); // try to drag S before N
    expect(out[2].start).toBe(6); // pinned to N.start + 1
  });

  it('clamps so a boundary cannot cross the next section', () => {
    const out = setBoundary(ansva(), 2, 999, 68); // try to drag S past V
    expect(out[2].start).toBe(42); // pinned to V.start - 1
  });

  it('refuses to move the first boundary (pinned at 1)', () => {
    const out = setBoundary(ansva(), 0, 10, 68);
    expect(out[0].start).toBe(1);
    expect(starts(out)).toEqual([1, 5, 20, 43, 60]);
  });
});

// ─── deckDir-level IO ─────────────────────────────────────────────────────────

function makeTmpDeck(slideCount, sections) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cv-talks-structure-'));
  for (let i = 1; i <= slideCount; i++) {
    const order = i;
    const yaml = `template: big-concept\nrecipe: canvas-quiet\norder: ${order}\nlabel: Slide ${order}\nvariant: default`;
    fs.writeFileSync(path.join(dir, `${String(order).padStart(2, '0')}-slide-${order}.md`), `---\n${yaml}\n---\n`, 'utf8');
  }
  if (sections) {
    writeDeckConfig(dir, { structure: { type: 'ANSVA', sections } });
  }
  return dir;
}

describe('deck.config IO', () => {
  let dir;
  afterEach(() => { if (dir) fs.rmSync(dir, { recursive: true, force: true }); });

  it('returns null when the deck has no config', () => {
    dir = makeTmpDeck(5, null);
    // getStructure is slug/decksRoot-based: parent dir is decksRoot, basename is slug
    const decksRoot = path.dirname(dir);
    expect(getStructure(path.basename(dir), decksRoot)).toBeNull();
  });

  it('reads and normalizes the structure against the real slide count', () => {
    dir = makeTmpDeck(10, [
      { id: 'A', label: 'A', start: 1, end: 3 },
      { id: 'B', label: 'B', start: 4, end: 99 }, // stale end
    ]);
    const decksRoot = path.dirname(dir);
    const s = getStructure(path.basename(dir), decksRoot);
    expect(s.slideCount).toBe(10);
    expect(s.sections[1].end).toBe(10); // healed to N
    expect(isContiguousTiling(s.sections, 10)).toBe(true);
  });

  it('syncStructureOnInsert persists shifted boundaries', () => {
    dir = makeTmpDeck(10, [
      { id: 'A', label: 'A', start: 1, end: 5 },
      { id: 'B', label: 'B', start: 6, end: 10 },
    ]);
    // Simulate that a slide was inserted at position 3 (deck now has 11 files).
    fs.writeFileSync(path.join(dir, `11-extra.md`), `---\norder: 11\n---\n`, 'utf8');
    syncStructureOnInsert(dir, 3);
    const cfg = readDeckConfig(dir);
    expect(cfg.structure.sections[0].end).toBe(6); // A grew (had slide at 3)
    expect(cfg.structure.sections[1].start).toBe(7);
    expect(cfg.structure.sections[1].end).toBe(11);
  });

  it('setStructureBoundary clamps and persists', () => {
    dir = makeTmpDeck(10, [
      { id: 'A', label: 'A', start: 1, end: 5 },
      { id: 'B', label: 'B', start: 6, end: 10 },
    ]);
    const decksRoot = path.dirname(dir);
    const slug = path.basename(dir);
    const s = setStructureBoundary(slug, 1, 4, decksRoot); // move B to start at 4
    expect(s.sections[0].end).toBe(3);
    expect(s.sections[1].start).toBe(4);
    // Persisted to disk
    expect(readDeckConfig(dir).structure.sections[1].start).toBe(4);
  });
});
