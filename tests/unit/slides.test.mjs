import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { parseMd } from '../../editor/api/frontmatter.mjs';
import { listSlides, getSlide, createSlide, updateSlide, removeSlide, reorderSlides, moveSlideTo } from '../../editor/api/slides.mjs';

// ─── helpers ─────────────────────────────────────────────────────────────────

let tmpRoot;

function makeDeck(slug = 'test-deck') {
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
  const yaml = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join('\n');
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
    const dir = makeDeck();
    writeSlide(dir, '01-cover.md', 1, { template: 'cover', label: 'Cover slide' });
    writeSlide(dir, '02-concept.md', 2, { template: 'big-concept', label: 'Big concept' });

    const result = listSlides('test-deck', tmpRoot);
    expect(result).toHaveLength(2);
    expect(result[0].filename).toBe('01-cover.md');
    expect(result[0].order).toBe(1);
    expect(result[0].template).toBe('cover');
    expect(result[0].label).toBe('Cover slide');
    expect(result[1].filename).toBe('02-concept.md');
  });

  it('includes previewUrl for each slide', () => {
    const dir = makeDeck();
    writeSlide(dir, '01-cover.md', 1);
    const [slide] = listSlides('test-deck', tmpRoot);
    expect(slide.previewUrl).toContain('test-deck');
    expect(slide.previewUrl).toContain('01-cover');
  });

  it('returns empty array for empty deck', () => {
    makeDeck();
    expect(listSlides('test-deck', tmpRoot)).toEqual([]);
  });
});

// ─── getSlide ─────────────────────────────────────────────────────────────────

describe('getSlide', () => {
  it('returns full data including frontmatter and body', () => {
    const dir = makeDeck();
    fs.writeFileSync(
      path.join(dir, '01-cover.md'),
      '---\ntemplate: cover\norder: 1\nlabel: Cover\nrecipe: canvas-quiet\nvariant: default\n---\n# My body\n',
      'utf8',
    );
    const result = getSlide('test-deck', '01-cover.md', tmpRoot);
    expect(result.filename).toBe('01-cover.md');
    expect(result.data.template).toBe('cover');
    expect(result.body).toBe('# My body\n');
    expect(result.previewUrl).toBeDefined();
  });

  it('throws when slide does not exist', () => {
    makeDeck();
    expect(() => getSlide('test-deck', 'missing.md', tmpRoot)).toThrow('Slide not found');
  });
});

// ─── createSlide ─────────────────────────────────────────────────────────────

describe('createSlide', () => {
  it('creates a slide file on disk', () => {
    const dir = makeDeck();
    createSlide('test-deck', { template: 'cover', recipe: 'canvas-quiet', label: 'New Cover', position: 1 }, tmpRoot);
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
    expect(files).toHaveLength(1);
  });

  it('returns filename, order, and previewUrl', () => {
    makeDeck();
    const result = createSlide('test-deck', { template: 'cover', label: 'New Slide', position: 1 }, tmpRoot);
    expect(result.filename).toBeDefined();
    expect(result.order).toBe(1);
    expect(result.previewUrl).toBeDefined();
  });

  it('inserts slide at the requested position', () => {
    const dir = makeDeck();
    writeSlide(dir, '01-a.md', 1, { label: 'A' });
    writeSlide(dir, '02-b.md', 2, { label: 'B' });

    createSlide('test-deck', { template: 'cover', label: 'New', position: 2 }, tmpRoot);

    const slides = listSlides('test-deck', tmpRoot);
    expect(slides).toHaveLength(3);
    expect(slides[1].label).toBe('New');
  });

  it('appends to end when no position given', () => {
    const dir = makeDeck();
    writeSlide(dir, '01-a.md', 1);
    writeSlide(dir, '02-b.md', 2);

    const result = createSlide('test-deck', { template: 'cover', label: 'End slide' }, tmpRoot);
    expect(result.order).toBe(3);
  });

  it('stores fields in frontmatter when provided', () => {
    const dir = makeDeck();
    createSlide('test-deck', {
      template: 'cover',
      label: 'Cover',
      fields: { title: { content: 'Hello', meta: 'Title_Text' } },
    }, tmpRoot);
    const [slide] = fs.readdirSync(dir).filter(f => f.endsWith('.md')).map(f => {
      const raw = fs.readFileSync(path.join(dir, f), 'utf8');
      return parseMd(raw);
    });
    expect(slide.data.fields.title.content).toBe('Hello');
  });
});

// ─── updateSlide ─────────────────────────────────────────────────────────────

describe('updateSlide', () => {
  it('merges new data into existing frontmatter', () => {
    const dir = makeDeck();
    writeSlide(dir, '01-cover.md', 1, { label: 'Old label' });

    updateSlide('test-deck', '01-cover.md', { data: { label: 'New label' } }, tmpRoot);

    const slide = getSlide('test-deck', '01-cover.md', tmpRoot);
    expect(slide.data.label).toBe('New label');
    expect(slide.data.template).toBe('big-concept'); // preserved
  });

  it('updates body independently from data', () => {
    const dir = makeDeck();
    writeSlide(dir, '01-cover.md', 1);

    updateSlide('test-deck', '01-cover.md', { body: '# New body\n' }, tmpRoot);

    const slide = getSlide('test-deck', '01-cover.md', tmpRoot);
    expect(slide.body).toBe('# New body\n');
  });

  it('preserves body when not included in updates', () => {
    const dir = makeDeck();
    fs.writeFileSync(
      path.join(dir, '01-cover.md'),
      '---\ntemplate: cover\norder: 1\nlabel: L\nrecipe: canvas-quiet\nvariant: default\n---\n# Existing\n',
      'utf8',
    );

    updateSlide('test-deck', '01-cover.md', { data: { label: 'Updated' } }, tmpRoot);

    const slide = getSlide('test-deck', '01-cover.md', tmpRoot);
    expect(slide.body).toBe('# Existing\n');
  });

  it('returns filename and previewUrl', () => {
    const dir = makeDeck();
    writeSlide(dir, '01-cover.md', 1);

    const result = updateSlide('test-deck', '01-cover.md', { data: {} }, tmpRoot);
    expect(result.filename).toBe('01-cover.md');
    expect(result.previewUrl).toBeDefined();
  });

  it('throws when slide does not exist', () => {
    makeDeck();
    expect(() => updateSlide('test-deck', 'missing.md', { data: {} }, tmpRoot)).toThrow('Slide not found');
  });
});

// ─── removeSlide ─────────────────────────────────────────────────────────────

describe('removeSlide', () => {
  it('deletes the slide from disk', () => {
    const dir = makeDeck();
    writeSlide(dir, '01-a.md', 1);
    writeSlide(dir, '02-b.md', 2);

    removeSlide('test-deck', '01-a.md', tmpRoot);

    expect(fs.existsSync(path.join(dir, '01-a.md'))).toBe(false);
  });

  it('renumbers remaining slides', () => {
    const dir = makeDeck();
    writeSlide(dir, '01-a.md', 1);
    writeSlide(dir, '02-b.md', 2);
    writeSlide(dir, '03-c.md', 3);

    removeSlide('test-deck', '02-b.md', tmpRoot);

    const slides = listSlides('test-deck', tmpRoot);
    expect(slides.map(s => s.order)).toEqual([1, 2]);
  });
});

// ─── reorderSlides ────────────────────────────────────────────────────────────

describe('reorderSlides', () => {
  it('reorders slides by provided filename array', () => {
    const dir = makeDeck();
    writeSlide(dir, '01-a.md', 1);
    writeSlide(dir, '02-b.md', 2);
    writeSlide(dir, '03-c.md', 3);

    reorderSlides('test-deck', ['03-c.md', '01-a.md', '02-b.md'], tmpRoot);

    const slides = listSlides('test-deck', tmpRoot);
    expect(slides.map(s => s.label)).toEqual(['Slide 3', 'Slide 1', 'Slide 2']);
  });
});

// ─── moveSlideTo ─────────────────────────────────────────────────────────────

describe('moveSlideTo', () => {
  it('moves slide to specified position', () => {
    const dir = makeDeck();
    writeSlide(dir, '01-a.md', 1, { label: 'A' });
    writeSlide(dir, '02-b.md', 2, { label: 'B' });
    writeSlide(dir, '03-c.md', 3, { label: 'C' });

    moveSlideTo('test-deck', '01-a.md', 3, tmpRoot);

    const slides = listSlides('test-deck', tmpRoot);
    expect(slides.map(s => s.label)).toEqual(['B', 'C', 'A']);
  });
});
