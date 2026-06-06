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
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
  fs.writeFileSync(path.join(dir, filename), `---\n${yaml}\n---\n`, 'utf8');

  // Sync to deck.config.json
  const configPath = path.join(dir, 'deck.config.json');
  let config = { slides: [] };
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
  if (!config.slides.includes(filename)) {
    config.slides.push(filename);
  }
  // Sort the slides in config by reading order frontmatter
  config.slides.sort((a, b) => {
    const aContent = fs.readFileSync(path.join(dir, a), 'utf8');
    const bContent = fs.readFileSync(path.join(dir, b), 'utf8');
    const aOrder = parseInt(aContent.match(/order:\s*(\d+)/)?.[1] ?? '999', 10);
    const bOrder = parseInt(bContent.match(/order:\s*(\d+)/)?.[1] ?? '999', 10);
    return aOrder - bOrder;
  });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
}

// ─── slugFromFilename ─────────────────────────────────────────────────────────

describe('slugFromFilename', () => {
  it('extracts slug from filename', () => {
    expect(slugFromFilename('cover-default.md')).toBe('cover-default');
    expect(slugFromFilename('my-slide.md')).toBe('my-slide');
  });
});

// ─── buildFilename ────────────────────────────────────────────────────────────

describe('buildFilename', () => {
  it('returns slug with .md extension', () => {
    expect(buildFilename(1, 'cover-default')).toBe('cover-default.md');
    expect(buildFilename(10, 'my-slide')).toBe('my-slide.md');
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

  it('reads and sorts slides by config order', () => {
    writeSlide(dir, 'third.md', 3);
    writeSlide(dir, 'first.md', 1);
    writeSlide(dir, 'second.md', 2);
    const slides = readSlides(dir);
    expect(slides.map(s => s.filename)).toEqual(['first.md', 'second.md', 'third.md']);
  });

  it('ignores index.md', () => {
    writeSlide(dir, 'slide.md', 1);
    fs.writeFileSync(path.join(dir, 'index.md'), '# index', 'utf8');
    const slides = readSlides(dir);
    expect(slides).toHaveLength(1);
    expect(slides[0].filename).toBe('slide.md');
  });

  it('includes data and body on each slide', () => {
    writeSlide(dir, 'slide.md', 1);
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
    writeSlide(dir, 'a.md', 1);
    writeSlide(dir, 'b.md', 2);
    writeSlide(dir, 'c.md', 3);
    const result = renumberSlides(dir);
    expect(result.map(s => s.order)).toEqual([1, 2, 3]);
    expect(result.map(s => s.filename)).toEqual(['a.md', 'b.md', 'c.md']);
  });

  it('fixes gaps in order values', () => {
    writeSlide(dir, 'a.md', 1);
    writeSlide(dir, 'b.md', 5);
    writeSlide(dir, 'c.md', 10);
    const result = renumberSlides(dir);
    expect(result.map(s => s.order)).toEqual([1, 2, 3]);
  });

  it('reorders when newOrder array is provided', () => {
    writeSlide(dir, 'a.md', 1);
    writeSlide(dir, 'b.md', 2);
    writeSlide(dir, 'c.md', 3);
    const result = renumberSlides(dir, ['c.md', 'a.md', 'b.md']);
    expect(result.map(s => s.slug)).toEqual(['c', 'a', 'b']);
    expect(result.map(s => s.order)).toEqual([1, 2, 3]);
  });
});

// ─── deleteSlide ─────────────────────────────────────────────────────────────

describe('deleteSlide', () => {
  let dir;
  beforeEach(() => { dir = makeTmpDeck(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it('deletes the file from disk', () => {
    writeSlide(dir, 'a.md', 1);
    writeSlide(dir, 'b.md', 2);
    deleteSlide(dir, 'a.md');
    expect(fs.existsSync(path.join(dir, 'a.md'))).toBe(false);
  });

  it('renumbers remaining slides after deletion', () => {
    writeSlide(dir, 'a.md', 1);
    writeSlide(dir, 'b.md', 2);
    writeSlide(dir, 'c.md', 3);
    const result = deleteSlide(dir, 'b.md');
    expect(result.map(s => s.order)).toEqual([1, 2]);
    expect(result.map(s => s.slug)).toEqual(['a', 'c']);
  });

  it('returns empty array after deleting the only slide', () => {
    writeSlide(dir, 'a.md', 1);
    const result = deleteSlide(dir, 'a.md');
    expect(result).toEqual([]);
  });
});

// ─── moveSlide ────────────────────────────────────────────────────────────────

describe('moveSlide', () => {
  let dir;
  beforeEach(() => { dir = makeTmpDeck(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it('moves a slide from first to last position', () => {
    writeSlide(dir, 'a.md', 1);
    writeSlide(dir, 'b.md', 2);
    writeSlide(dir, 'c.md', 3);
    const result = moveSlide(dir, 'a.md', 3);
    expect(result.map(s => s.slug)).toEqual(['b', 'c', 'a']);
  });

  it('moves a slide from last to first position', () => {
    writeSlide(dir, 'a.md', 1);
    writeSlide(dir, 'b.md', 2);
    writeSlide(dir, 'c.md', 3);
    const result = moveSlide(dir, 'c.md', 1);
    expect(result.map(s => s.slug)).toEqual(['c', 'a', 'b']);
  });

  it('moves a middle slide down', () => {
    writeSlide(dir, 'a.md', 1);
    writeSlide(dir, 'b.md', 2);
    writeSlide(dir, 'c.md', 3);
    const result = moveSlide(dir, 'b.md', 3);
    expect(result.map(s => s.slug)).toEqual(['a', 'c', 'b']);
  });

  it('clamps out-of-bounds position to last', () => {
    writeSlide(dir, 'a.md', 1);
    writeSlide(dir, 'b.md', 2);
    const result = moveSlide(dir, 'a.md', 99);
    expect(result.map(s => s.slug)).toEqual(['b', 'a']);
  });

  it('clamps out-of-bounds position to first', () => {
    writeSlide(dir, 'a.md', 1);
    writeSlide(dir, 'b.md', 2);
    const result = moveSlide(dir, 'b.md', 0);
    expect(result.map(s => s.slug)).toEqual(['b', 'a']);
  });

  it('throws when slide not found', () => {
    writeSlide(dir, 'a.md', 1);
    expect(() => moveSlide(dir, 'nonexistent.md', 1)).toThrow(/Slide not found/);
  });

  it('renumbers all slides after move', () => {
    writeSlide(dir, 'a.md', 1);
    writeSlide(dir, 'b.md', 2);
    writeSlide(dir, 'c.md', 3);
    const result = moveSlide(dir, 'a.md', 2);
    expect(result.every((s, i) => s.order === i + 1)).toBe(true);
  });
});
