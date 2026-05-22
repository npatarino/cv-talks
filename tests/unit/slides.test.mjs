import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// We need to intercept deckDir() to point to our tmpdir.
// slides.mjs imports deckDir from decks.mjs at module load time,
// so we mock the module before importing slides.mjs.

let tmpRoot;

vi.mock('../../editor/api/decks.mjs', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    deckDir: (slug) => path.join(tmpRoot, slug),
  };
});

const { listSlides, getSlide, createSlide, updateSlide, removeSlide, reorderSlides, moveSlideTo } =
  await import('../../editor/api/slides.mjs');

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeTmpDeck(slug = 'test-deck') {
  const dir = path.join(tmpRoot, slug);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function writeSlide(dir, filename, order, extra = {}) {
  const data = {
    template: 'big-concept',
    recipe: 'canvas-quiet',
    order,
    label: `Slide ${order}`,
    variant: 'default',
    ...extra,
  };
  const yaml = Object.entries(data)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
  fs.writeFileSync(path.join(dir, filename), `---\n${yaml}\n---\n`, 'utf8');
}

beforeEach(() => {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cv-slides-test-'));
});

afterEach(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

// ─── listSlides ───────────────────────────────────────────────────────────────

describe('listSlides', () => {
  it('returns summary list sorted by order', () => {
    const dir = makeTmpDeck();
    writeSlide(dir, '01-cover.md', 1, { template: 'cover', label: 'Cover slide' });
    writeSlide(dir, '02-concept.md', 2, { template: 'big-concept', label: 'Big concept' });

    const result = listSlides('test-deck');
    expect(result).toHaveLength(2);
    expect(result[0].filename).toBe('01-cover.md');
    expect(result[0].order).toBe(1);
    expect(result[0].template).toBe('cover');
    expect(result[0].label).toBe('Cover slide');
    expect(result[1].filename).toBe('02-concept.md');
  });

  it('includes previewUrl for each slide', () => {
    const dir = makeTmpDeck();
    writeSlide(dir, '01-cover.md', 1);
    const [slide] = listSlides('test-deck');
    expect(slide.previewUrl).toContain('test-deck');
    expect(slide.previewUrl).toContain('01-cover');
  });

  it('returns empty array for empty deck', () => {
    makeTmpDeck();
    expect(listSlides('test-deck')).toEqual([]);
  });
});

// ─── getSlide ─────────────────────────────────────────────────────────────────

describe('getSlide', () => {
  it('returns full data including frontmatter and body', () => {
    const dir = makeTmpDeck();
    fs.writeFileSync(
      path.join(dir, '01-cover.md'),
      '---\ntemplate: cover\norder: 1\nlabel: Cover\nrecipe: canvas-quiet\nvariant: default\n---\n# My body\n',
      'utf8',
    );
    const result = getSlide('test-deck', '01-cover.md');
    expect(result.filename).toBe('01-cover.md');
    expect(result.data.template).toBe('cover');
    expect(result.body).toBe('# My body\n');
    expect(result.previewUrl).toBeDefined();
  });

  it('throws when slide does not exist', () => {
    makeTmpDeck();
    expect(() => getSlide('test-deck', 'missing.md')).toThrow('Slide not found');
  });
});

// ─── createSlide ─────────────────────────────────────────────────────────────

describe('createSlide', () => {
  it('creates a slide file on disk', () => {
    const dir = makeTmpDeck();
    createSlide('test-deck', { template: 'cover', recipe: 'canvas-quiet', label: 'New Cover', position: 1 });
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
    expect(files).toHaveLength(1);
  });

  it('returns filename, order, and previewUrl', () => {
    makeTmpDeck();
    const result = createSlide('test-deck', { template: 'cover', label: 'New Slide', position: 1 });
    expect(result.filename).toBeDefined();
    expect(result.order).toBe(1);
    expect(result.previewUrl).toBeDefined();
  });

  it('inserts slide at the requested position', () => {
    const dir = makeTmpDeck();
    writeSlide(dir, '01-a.md', 1, { label: 'A' });
    writeSlide(dir, '02-b.md', 2, { label: 'B' });

    createSlide('test-deck', { template: 'cover', label: 'New', position: 2 });

    const slides = listSlides('test-deck');
    expect(slides).toHaveLength(3);
    expect(slides[1].label).toBe('New');
  });

  it('appends to end when no position given', () => {
    const dir = makeTmpDeck();
    writeSlide(dir, '01-a.md', 1);
    writeSlide(dir, '02-b.md', 2);

    const result = createSlide('test-deck', { template: 'cover', label: 'End slide' });
    expect(result.order).toBe(3);
  });

  it('stores fields in frontmatter when provided', () => {
    const dir = makeTmpDeck();
    createSlide('test-deck', {
      template: 'cover',
      label: 'Cover',
      fields: { title: { content: 'Hello', meta: 'Title_Text' } },
    });
    const slides = readSlidesFromDir(dir);
    expect(slides[0].data.fields.title.content).toBe('Hello');
  });
});

// ─── updateSlide ─────────────────────────────────────────────────────────────

describe('updateSlide', () => {
  it('merges new data into existing frontmatter', () => {
    const dir = makeTmpDeck();
    writeSlide(dir, '01-cover.md', 1, { label: 'Old label' });

    updateSlide('test-deck', '01-cover.md', { data: { label: 'New label' } });

    const slide = getSlide('test-deck', '01-cover.md');
    expect(slide.data.label).toBe('New label');
    expect(slide.data.template).toBe('big-concept'); // preserved
  });

  it('updates body independently from data', () => {
    const dir = makeTmpDeck();
    writeSlide(dir, '01-cover.md', 1);

    updateSlide('test-deck', '01-cover.md', { body: '# New body\n' });

    const slide = getSlide('test-deck', '01-cover.md');
    expect(slide.body).toBe('# New body\n');
  });

  it('preserves body when not included in updates', () => {
    const dir = makeTmpDeck();
    fs.writeFileSync(
      path.join(dir, '01-cover.md'),
      '---\ntemplate: cover\norder: 1\nlabel: L\nrecipe: canvas-quiet\nvariant: default\n---\n# Existing\n',
      'utf8',
    );

    updateSlide('test-deck', '01-cover.md', { data: { label: 'Updated' } });

    const slide = getSlide('test-deck', '01-cover.md');
    expect(slide.body).toBe('# Existing\n');
  });

  it('returns filename and previewUrl', () => {
    const dir = makeTmpDeck();
    writeSlide(dir, '01-cover.md', 1);

    const result = updateSlide('test-deck', '01-cover.md', { data: {} });
    expect(result.filename).toBe('01-cover.md');
    expect(result.previewUrl).toBeDefined();
  });

  it('throws when slide does not exist', () => {
    makeTmpDeck();
    expect(() => updateSlide('test-deck', 'missing.md', { data: {} })).toThrow('Slide not found');
  });
});

// ─── removeSlide ─────────────────────────────────────────────────────────────

describe('removeSlide', () => {
  it('deletes the slide from disk', () => {
    const dir = makeTmpDeck();
    writeSlide(dir, '01-a.md', 1);
    writeSlide(dir, '02-b.md', 2);

    removeSlide('test-deck', '01-a.md');

    expect(fs.existsSync(path.join(dir, '01-a.md'))).toBe(false);
  });

  it('renumbers remaining slides', () => {
    const dir = makeTmpDeck();
    writeSlide(dir, '01-a.md', 1);
    writeSlide(dir, '02-b.md', 2);
    writeSlide(dir, '03-c.md', 3);

    removeSlide('test-deck', '02-b.md');

    const slides = listSlides('test-deck');
    expect(slides.map(s => s.order)).toEqual([1, 2]);
  });
});

// ─── reorderSlides ────────────────────────────────────────────────────────────

describe('reorderSlides', () => {
  it('reorders slides by provided filename array', () => {
    const dir = makeTmpDeck();
    writeSlide(dir, '01-a.md', 1);
    writeSlide(dir, '02-b.md', 2);
    writeSlide(dir, '03-c.md', 3);

    reorderSlides('test-deck', ['03-c.md', '01-a.md', '02-b.md']);

    const slides = listSlides('test-deck');
    expect(slides.map(s => s.label)).toEqual(['Slide 3', 'Slide 1', 'Slide 2']);
  });
});

// ─── moveSlideTo ─────────────────────────────────────────────────────────────

describe('moveSlideTo', () => {
  it('moves slide to specified position', () => {
    const dir = makeTmpDeck();
    writeSlide(dir, '01-a.md', 1, { label: 'A' });
    writeSlide(dir, '02-b.md', 2, { label: 'B' });
    writeSlide(dir, '03-c.md', 3, { label: 'C' });

    moveSlideTo('test-deck', '01-a.md', 3);

    const slides = listSlides('test-deck');
    expect(slides.map(s => s.label)).toEqual(['B', 'C', 'A']);
  });
});

// ─── local helper (avoids coupling to slides.mjs internals) ──────────────────

function readSlidesFromDir(dir) {
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const raw = fs.readFileSync(path.join(dir, f), 'utf8');
      const { parseMd } = require('../../editor/api/frontmatter.mjs');
      return { filename: f, ...parseMd(raw) };
    });
}
