import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  slugFromFilename,
  buildFilename,
  readSlides,
  renumberSlides,
  deleteSlide,
  moveSlide,
} from '../../editor/api/renumber.mjs';

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeTmpDeck() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cv-talks-test-'));
}

function writeSlide(dir, filename, order, extra = {}) {
  const data = { template: 'big-concept', recipe: 'canvas-quiet', order, label: `Slide ${order}`, variant: 'default', ...extra };
  const yaml = Object.entries(data)
    .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : v}`)
    .join('\n');
  fs.writeFileSync(path.join(dir, filename), `---\n${yaml}\n---\n`, 'utf8');
}

// ─── slugFromFilename ─────────────────────────────────────────────────────────

describe('slugFromFilename', () => {
  it('extracts slug from standard filename', () => {
    expect(slugFromFilename('01-cover-default.md')).toBe('cover-default');
  });

  it('extracts slug with dashes in the name', () => {
    expect(slugFromFilename('12-big-concept-divider.md')).toBe('big-concept-divider');
  });

  it('returns filename without .md if no numeric prefix', () => {
    expect(slugFromFilename('no-prefix.md')).toBe('no-prefix');
  });

  it('handles two-digit prefix', () => {
    expect(slugFromFilename('42-my-slide.md')).toBe('my-slide');
  });

  it('handles large order numbers', () => {
    expect(slugFromFilename('99-last-slide.md')).toBe('last-slide');
  });
});

// ─── buildFilename ────────────────────────────────────────────────────────────

describe('buildFilename', () => {
  it('pads single-digit orders to 2 digits', () => {
    expect(buildFilename(1, 'cover-default')).toBe('01-cover-default.md');
  });

  it('does not double-pad two-digit orders', () => {
    expect(buildFilename(10, 'my-slide')).toBe('10-my-slide.md');
  });

  it('handles order 99', () => {
    expect(buildFilename(99, 'last-slide')).toBe('99-last-slide.md');
  });

  it('concatenates order and slug with dash', () => {
    expect(buildFilename(5, 'big-list')).toBe('05-big-list.md');
  });
});

// ─── readSlides ───────────────────────────────────────────────────────────────

describe('readSlides', () => {
  let dir;
  beforeEach(() => { dir = makeTmpDeck(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it('returns empty array for empty directory', () => {
    expect(readSlides(dir)).toEqual([]);
  });

  it('returns empty array for non-existent directory', () => {
    expect(readSlides('/tmp/__does_not_exist_cv_talks__')).toEqual([]);
  });

  it('reads and sorts slides by order frontmatter', () => {
    writeSlide(dir, '03-third.md', 3);
    writeSlide(dir, '01-first.md', 1);
    writeSlide(dir, '02-second.md', 2);
    const slides = readSlides(dir);
    expect(slides.map(s => s.filename)).toEqual(['01-first.md', '02-second.md', '03-third.md']);
  });

  it('ignores index.md', () => {
    writeSlide(dir, '01-slide.md', 1);
    fs.writeFileSync(path.join(dir, 'index.md'), '# index', 'utf8');
    const slides = readSlides(dir);
    expect(slides).toHaveLength(1);
    expect(slides[0].filename).toBe('01-slide.md');
  });

  it('ignores files without numeric prefix', () => {
    writeSlide(dir, '01-valid.md', 1);
    fs.writeFileSync(path.join(dir, 'readme.md'), 'readme', 'utf8');
    const slides = readSlides(dir);
    expect(slides).toHaveLength(1);
  });

  it('includes data and body on each slide', () => {
    writeSlide(dir, '01-slide.md', 1);
    const [slide] = readSlides(dir);
    expect(slide.data).toBeDefined();
    expect(slide.data.order).toBe(1);
    expect(slide.body).toBeDefined();
  });
});

// ─── renumberSlides ───────────────────────────────────────────────────────────

describe('renumberSlides', () => {
  let dir;
  beforeEach(() => { dir = makeTmpDeck(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it('returns empty array for empty deck', () => {
    expect(renumberSlides(dir)).toEqual([]);
  });

  it('renumbers slides 1, 2, 3 from existing order', () => {
    writeSlide(dir, '01-a.md', 1);
    writeSlide(dir, '02-b.md', 2);
    writeSlide(dir, '03-c.md', 3);
    const result = renumberSlides(dir);
    expect(result.map(s => s.order)).toEqual([1, 2, 3]);
    expect(result.map(s => s.filename)).toEqual(['01-a.md', '02-b.md', '03-c.md']);
  });

  it('fixes gaps in order values', () => {
    writeSlide(dir, '01-a.md', 1);
    writeSlide(dir, '05-b.md', 5);
    writeSlide(dir, '10-c.md', 10);
    const result = renumberSlides(dir);
    expect(result.map(s => s.order)).toEqual([1, 2, 3]);
  });

  it('renames files to match new order', () => {
    writeSlide(dir, '01-a.md', 1);
    writeSlide(dir, '05-b.md', 5);
    renumberSlides(dir);
    const files = fs.readdirSync(dir).sort();
    expect(files).toEqual(['01-a.md', '02-b.md']);
  });

  it('updates order field in frontmatter after renumbering', () => {
    writeSlide(dir, '01-a.md', 1);
    writeSlide(dir, '05-b.md', 5);
    renumberSlides(dir);
    const slides = readSlides(dir);
    expect(slides[1].data.order).toBe(2);
  });

  it('reorders when newOrder array is provided', () => {
    writeSlide(dir, '01-a.md', 1);
    writeSlide(dir, '02-b.md', 2);
    writeSlide(dir, '03-c.md', 3);
    const result = renumberSlides(dir, ['03-c.md', '01-a.md', '02-b.md']);
    expect(result.map(s => s.slug)).toEqual(['c', 'a', 'b']);
    expect(result.map(s => s.order)).toEqual([1, 2, 3]);
  });

  it('preserves slug portion of filename during rename', () => {
    writeSlide(dir, '01-cover-default.md', 1);
    writeSlide(dir, '05-big-concept-divider.md', 5);
    const result = renumberSlides(dir);
    expect(result[1].filename).toBe('02-big-concept-divider.md');
  });
});

// ─── deleteSlide ─────────────────────────────────────────────────────────────

describe('deleteSlide', () => {
  let dir;
  beforeEach(() => { dir = makeTmpDeck(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it('deletes the file from disk', () => {
    writeSlide(dir, '01-a.md', 1);
    writeSlide(dir, '02-b.md', 2);
    deleteSlide(dir, '01-a.md');
    expect(fs.existsSync(path.join(dir, '01-a.md'))).toBe(false);
  });

  it('renumbers remaining slides after deletion', () => {
    writeSlide(dir, '01-a.md', 1);
    writeSlide(dir, '02-b.md', 2);
    writeSlide(dir, '03-c.md', 3);
    const result = deleteSlide(dir, '02-b.md');
    expect(result.map(s => s.order)).toEqual([1, 2]);
    expect(result.map(s => s.slug)).toEqual(['a', 'c']);
  });

  it('throws when slide not found', () => {
    expect(() => deleteSlide(dir, 'nonexistent.md')).toThrow('Slide not found');
  });

  it('returns empty array after deleting the only slide', () => {
    writeSlide(dir, '01-a.md', 1);
    const result = deleteSlide(dir, '01-a.md');
    expect(result).toEqual([]);
  });
});

// ─── moveSlide ────────────────────────────────────────────────────────────────

describe('moveSlide', () => {
  let dir;
  beforeEach(() => { dir = makeTmpDeck(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it('moves a slide from first to last position', () => {
    writeSlide(dir, '01-a.md', 1);
    writeSlide(dir, '02-b.md', 2);
    writeSlide(dir, '03-c.md', 3);
    const result = moveSlide(dir, '01-a.md', 3);
    expect(result.map(s => s.slug)).toEqual(['b', 'c', 'a']);
  });

  it('moves a slide from last to first position', () => {
    writeSlide(dir, '01-a.md', 1);
    writeSlide(dir, '02-b.md', 2);
    writeSlide(dir, '03-c.md', 3);
    const result = moveSlide(dir, '03-c.md', 1);
    expect(result.map(s => s.slug)).toEqual(['c', 'a', 'b']);
  });

  it('moves a middle slide down', () => {
    writeSlide(dir, '01-a.md', 1);
    writeSlide(dir, '02-b.md', 2);
    writeSlide(dir, '03-c.md', 3);
    const result = moveSlide(dir, '02-b.md', 3);
    expect(result.map(s => s.slug)).toEqual(['a', 'c', 'b']);
  });

  it('clamps out-of-bounds position to last', () => {
    writeSlide(dir, '01-a.md', 1);
    writeSlide(dir, '02-b.md', 2);
    const result = moveSlide(dir, '01-a.md', 99);
    expect(result.map(s => s.slug)).toEqual(['b', 'a']);
  });

  it('clamps out-of-bounds position to first', () => {
    writeSlide(dir, '01-a.md', 1);
    writeSlide(dir, '02-b.md', 2);
    const result = moveSlide(dir, '02-b.md', 0);
    expect(result.map(s => s.slug)).toEqual(['b', 'a']);
  });

  it('throws when slide not found', () => {
    writeSlide(dir, '01-a.md', 1);
    expect(() => moveSlide(dir, 'nonexistent.md', 1)).toThrow('Slide not found');
  });

  it('renumbers all slides after move', () => {
    writeSlide(dir, '01-a.md', 1);
    writeSlide(dir, '02-b.md', 2);
    writeSlide(dir, '03-c.md', 3);
    const result = moveSlide(dir, '01-a.md', 2);
    expect(result.every((s, i) => s.order === i + 1)).toBe(true);
  });
});
