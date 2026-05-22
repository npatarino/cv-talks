/**
 * Integration tests for editor/api/router.mjs
 *
 * Calls route() directly with real Request objects.
 * Slides API calls operate against a temporary directory injected via
 * vi.mock of decks.mjs — same approach as slides.test.mjs.
 * No HTTP server is started.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

let tmpRoot;

vi.mock('../../editor/api/decks.mjs', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    deckDir: (slug) => path.join(tmpRoot, slug),
  };
});

const { route } = await import('../../editor/api/router.mjs');

// ---------- helpers ----------

const BASE = 'http://localhost:3001';

function req(method, pathname, body) {
  const init = { method };
  if (body !== undefined) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(body);
  }
  return new Request(`${BASE}${pathname}`, init);
}

async function callRoute(method, pathname, body) {
  const res = await route(req(method, pathname, body), null, '');
  const data = await res.json();
  return { status: res.status, data };
}

function makeDeck(slug) {
  const dir = path.join(tmpRoot, slug);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function writeSlide(dir, filename, order, extra = {}) {
  const fields = { template: 'big-concept', recipe: 'canvas-quiet', order, label: `Slide ${order}`, variant: 'default', ...extra };
  const yaml = Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('\n');
  fs.writeFileSync(path.join(dir, filename), `---\n${yaml}\n---\n`, 'utf8');
}

beforeEach(() => {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cv-router-test-'));
});

afterEach(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

// ─── OPTIONS preflight ────────────────────────────────────────────────────────

describe('OPTIONS preflight', () => {
  it('returns 204 with CORS headers', async () => {
    const res = await route(req('OPTIONS', '/api/decks'), null, '');
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });
});

// ─── GET /api/decks ───────────────────────────────────────────────────────────

describe('GET /api/decks', () => {
  it('returns 200 with an array', async () => {
    const { status, data } = await callRoute('GET', '/api/decks');
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  it('includes real decks from the project', async () => {
    const { data } = await callRoute('GET', '/api/decks');
    const slugs = data.map(d => d.slug);
    expect(slugs).toContain('2026-03-productividad-toxica');
  });
});

// ─── GET /api/templates ───────────────────────────────────────────────────────

describe('GET /api/templates', () => {
  it('returns 200 with template metadata', async () => {
    const { status, data } = await callRoute('GET', '/api/templates');
    expect(status).toBe(200);
    expect(typeof data).toBe('object');
    expect(data).toHaveProperty('cover');
  });
});

// ─── GET /api/template-slides ─────────────────────────────────────────────────

describe('GET /api/template-slides', () => {
  it('returns 200 with at least 40 slides', async () => {
    const { status, data } = await callRoute('GET', '/api/template-slides');
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(40);
  });
});

// ─── GET /api/git-status ─────────────────────────────────────────────────────

describe('GET /api/git-status', () => {
  it('returns 200 with a modified array', async () => {
    const { status, data } = await callRoute('GET', '/api/git-status');
    expect(status).toBe(200);
    expect(Array.isArray(data.modified)).toBe(true);
  });
});

// ─── GET /api/decks/:slug/assets ─────────────────────────────────────────────

describe('GET /api/decks/:slug/assets', () => {
  it('returns empty array for deck without assets folder', async () => {
    const { status, data } = await callRoute('GET', '/api/decks/nonexistent-deck/assets');
    expect(status).toBe(200);
    expect(data).toEqual([]);
  });
});

// ─── GET /api/decks/:slug/slides ─────────────────────────────────────────────

describe('GET /api/decks/:slug/slides', () => {
  it('returns 200 with slide list', async () => {
    const dir = makeDeck('my-deck');
    writeSlide(dir, '01-cover.md', 1);
    writeSlide(dir, '02-concept.md', 2);

    const { status, data } = await callRoute('GET', '/api/decks/my-deck/slides');
    expect(status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0].filename).toBe('01-cover.md');
  });

  it('returns empty array for deck with no slides', async () => {
    makeDeck('empty-deck');
    const { status, data } = await callRoute('GET', '/api/decks/empty-deck/slides');
    expect(status).toBe(200);
    expect(data).toEqual([]);
  });
});

// ─── POST /api/decks/:slug/slides ────────────────────────────────────────────

describe('POST /api/decks/:slug/slides', () => {
  it('creates a slide and returns 201', async () => {
    makeDeck('my-deck');
    const { status, data } = await callRoute('POST', '/api/decks/my-deck/slides', {
      template: 'cover',
      recipe: 'canvas-quiet',
      label: 'New Cover',
      position: 1,
    });
    expect(status).toBe(201);
    expect(data.filename).toBeDefined();
    expect(data.order).toBe(1);
  });

  it('creates a file on disk', async () => {
    const dir = makeDeck('my-deck');
    await callRoute('POST', '/api/decks/my-deck/slides', {
      template: 'cover', label: 'Cover', position: 1,
    });
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
    expect(files).toHaveLength(1);
  });
});

// ─── GET /api/decks/:slug/slides/:filename ────────────────────────────────────

describe('GET /api/decks/:slug/slides/:filename', () => {
  it('returns 200 with slide data', async () => {
    const dir = makeDeck('my-deck');
    fs.writeFileSync(
      path.join(dir, '01-cover.md'),
      '---\ntemplate: cover\norder: 1\nlabel: Cover\nrecipe: canvas-quiet\nvariant: default\n---\n# Body\n',
      'utf8',
    );
    const { status, data } = await callRoute('GET', '/api/decks/my-deck/slides/01-cover.md');
    expect(status).toBe(200);
    expect(data.filename).toBe('01-cover.md');
    expect(data.data.template).toBe('cover');
    expect(data.body).toBe('# Body\n');
  });

  it('returns 404 for nonexistent slide', async () => {
    makeDeck('my-deck');
    const { status } = await callRoute('GET', '/api/decks/my-deck/slides/missing.md');
    expect(status).toBe(404);
  });
});

// ─── PUT /api/decks/:slug/slides/:filename ────────────────────────────────────

describe('PUT /api/decks/:slug/slides/:filename', () => {
  it('updates frontmatter and returns 200', async () => {
    const dir = makeDeck('my-deck');
    writeSlide(dir, '01-cover.md', 1, { label: 'Original' });

    const { status, data } = await callRoute('PUT', '/api/decks/my-deck/slides/01-cover.md', {
      data: { label: 'Updated' },
    });
    expect(status).toBe(200);
    expect(data.filename).toBe('01-cover.md');

    // Verify on disk
    const { data: saved } = await callRoute('GET', '/api/decks/my-deck/slides/01-cover.md');
    expect(saved.data.label).toBe('Updated');
  });

  it('returns 400 for nonexistent slide', async () => {
    makeDeck('my-deck');
    const { status } = await callRoute('PUT', '/api/decks/my-deck/slides/missing.md', { data: {} });
    expect(status).toBe(400);
  });
});

// ─── DELETE /api/decks/:slug/slides/:filename ─────────────────────────────────

describe('DELETE /api/decks/:slug/slides/:filename', () => {
  it('deletes slide and returns 200 with remaining list', async () => {
    const dir = makeDeck('my-deck');
    writeSlide(dir, '01-a.md', 1);
    writeSlide(dir, '02-b.md', 2);

    const { status, data } = await callRoute('DELETE', '/api/decks/my-deck/slides/01-a.md');
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(1);
    expect(fs.existsSync(path.join(dir, '01-a.md'))).toBe(false);
  });

  it('returns 404 for nonexistent slide', async () => {
    makeDeck('my-deck');
    const { status } = await callRoute('DELETE', '/api/decks/my-deck/slides/missing.md');
    expect(status).toBe(404);
  });
});

// ─── POST /api/decks/:slug/slides/:filename/move ──────────────────────────────

describe('POST /api/decks/:slug/slides/:filename/move', () => {
  it('moves slide to target position', async () => {
    const dir = makeDeck('my-deck');
    writeSlide(dir, '01-a.md', 1, { label: 'A' });
    writeSlide(dir, '02-b.md', 2, { label: 'B' });
    writeSlide(dir, '03-c.md', 3, { label: 'C' });

    const { status, data } = await callRoute(
      'POST', '/api/decks/my-deck/slides/01-a.md/move', { position: 3 },
    );
    expect(status).toBe(200);
    expect(data.map(s => s.slug)).toEqual(['b', 'c', 'a']);
  });
});

// ─── POST /api/decks/:slug/reorder ───────────────────────────────────────────

describe('POST /api/decks/:slug/reorder', () => {
  it('reorders slides by provided filename array', async () => {
    const dir = makeDeck('my-deck');
    writeSlide(dir, '01-a.md', 1, { label: 'A' });
    writeSlide(dir, '02-b.md', 2, { label: 'B' });
    writeSlide(dir, '03-c.md', 3, { label: 'C' });

    const { status, data } = await callRoute('POST', '/api/decks/my-deck/reorder', {
      order: ['03-c.md', '01-a.md', '02-b.md'],
    });
    expect(status).toBe(200);
    expect(data.map(s => s.slug)).toEqual(['c', 'a', 'b']);
  });
});

// ─── Unknown route ────────────────────────────────────────────────────────────

describe('Unknown routes', () => {
  it('returns 404 when no serveFile is provided', async () => {
    const res = await route(req('GET', '/unknown'), null, '');
    expect(res.status).toBe(404);
  });
});

// ─── Full CRUD workflow ───────────────────────────────────────────────────────

describe('Full CRUD workflow', () => {
  it('create → read → update → delete → verify renumbering', async () => {
    makeDeck('my-deck');

    // Create two slides
    await callRoute('POST', '/api/decks/my-deck/slides', { template: 'cover', label: 'First', position: 1 });
    await callRoute('POST', '/api/decks/my-deck/slides', { template: 'big-concept', label: 'Second', position: 2 });

    // Read list
    const { data: list } = await callRoute('GET', '/api/decks/my-deck/slides');
    expect(list).toHaveLength(2);
    const first = list[0];

    // Update
    await callRoute('PUT', `/api/decks/my-deck/slides/${first.filename}`, {
      data: { label: 'Updated First' },
    });
    const { data: updated } = await callRoute('GET', `/api/decks/my-deck/slides/${first.filename}`);
    expect(updated.data.label).toBe('Updated First');

    // Delete first slide
    await callRoute('DELETE', `/api/decks/my-deck/slides/${first.filename}`);

    // Verify renumbering — only one slide left, order = 1
    const { data: remaining } = await callRoute('GET', '/api/decks/my-deck/slides');
    expect(remaining).toHaveLength(1);
    expect(remaining[0].order).toBe(1);
  });
});
