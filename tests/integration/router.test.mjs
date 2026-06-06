/**
 * Integration tests for editor/api/router.mjs
 *
 * Calls route() directly with real Request objects.
 * Uses the decksRoot parameter to redirect filesystem operations
 * to a temporary directory — no vi.mock needed.
 * No HTTP server is started.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { route } from '../../editor/api/router.mjs';

// ---------- helpers ----------

const BASE = 'http://localhost:3001';

let tmpRoot;

function req(method, pathname, body) {
  const init = { method };
  if (body !== undefined) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(body);
  }
  return new Request(`${BASE}${pathname}`, init);
}

async function call(method, pathname, body) {
  const res = await route(req(method, pathname, body), null, '', tmpRoot);
  const data = await res.json();
  return { status: res.status, data };
}

function makeDeck(slug) {
  const dir = path.join(tmpRoot, slug);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function writeSlide(dir, filename, order, extra = {}) {
  const body = extra.body || '';
  const fields = { template: 'big-concept', recipe: 'canvas-quiet', order, label: `Slide ${order}`, variant: 'default', ...extra };
  delete fields.body;
  const yaml = Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('\n');
  fs.writeFileSync(path.join(dir, filename), `---\n${yaml}\n---\n${body}`, 'utf8');

  // Sync to deck.config.json
  const configPath = path.join(dir, 'deck.config.json');
  let config = { slides: [] };
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
  if (!config.slides.includes(filename)) {
    config.slides.push(filename);
  }
  // Sort by order frontmatter
  config.slides.sort((a, b) => {
    const aContent = fs.readFileSync(path.join(dir, a), 'utf8');
    const bContent = fs.readFileSync(path.join(dir, b), 'utf8');
    const aOrder = parseInt(aContent.match(/order:\s*(\d+)/)?.[1] ?? '999', 10);
    const bOrder = parseInt(bContent.match(/order:\s*(\d+)/)?.[1] ?? '999', 10);
    return aOrder - bOrder;
  });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
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
    const res = await route(req('OPTIONS', '/api/decks'), null, '', tmpRoot);
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });
});

// ─── GET /api/decks ───────────────────────────────────────────────────────────

describe('GET /api/decks', () => {
  it('returns 200 with an array', async () => {
    const { status, data } = await call('GET', '/api/decks');
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  it('includes real decks from the project', async () => {
    const { data } = await call('GET', '/api/decks');
    const slugs = data.map(d => d.slug);
    expect(slugs).toContain('el-mito-de-la-productividad-toxica');
  });
});

// ─── GET /api/templates ───────────────────────────────────────────────────────

describe('GET /api/templates', () => {
  it('returns 200 with template metadata', async () => {
    const { status, data } = await call('GET', '/api/templates');
    expect(status).toBe(200);
    expect(typeof data).toBe('object');
    expect(data).toHaveProperty('cover');
  });
});

// ─── GET /api/template-scaffold ───────────────────────────────────────────────

describe('GET /api/template-scaffold', () => {
  it('returns fields with blank content for big-concept', async () => {
    const { status, data } = await call('GET', '/api/template-scaffold?template=big-concept&variant=default');
    expect(status).toBe(200);
    expect(data.fields).toBeDefined();
    expect(data.fields.title.content).toBe('');
    expect(data.fields.note.content).toBe('');
  });

  it('returns blanked itemsMarkdown for big-list', async () => {
    const { status, data } = await call('GET', '/api/template-scaffold?template=big-list&variant=numeric');
    expect(status).toBe(200);
    expect(data.itemsMarkdown).toBe('');
    expect(data.items).toBeUndefined();
  });

  it('falls back to variant=default when variant is omitted', async () => {
    const { status, data } = await call('GET', '/api/template-scaffold?template=big-concept');
    expect(status).toBe(200);
    expect(data.fields).toBeDefined();
  });

  it('returns 400 when template is missing', async () => {
    const { status } = await call('GET', '/api/template-scaffold');
    expect(status).toBe(400);
  });

  it('returns empty scaffold for an unknown template', async () => {
    const { status, data } = await call('GET', '/api/template-scaffold?template=does-not-exist');
    expect(status).toBe(200);
    // No fields/items — caller is expected to handle the empty case.
    expect(data.fields).toBeUndefined();
    expect(data.items).toBeUndefined();
  });
});

// ─── GET /api/template-slides ─────────────────────────────────────────────────

describe('GET /api/template-slides', () => {
  it('returns 200 with at least 40 slides', async () => {
    const { status, data } = await call('GET', '/api/template-slides');
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(40);
  });
});

// ─── GET /api/git-status ─────────────────────────────────────────────────────

describe('GET /api/git-status', () => {
  it('returns 200 with a modified array', async () => {
    const { status, data } = await call('GET', '/api/git-status');
    expect(status).toBe(200);
    expect(Array.isArray(data.modified)).toBe(true);
  });
});

// ─── GET /api/decks/:slug/assets ─────────────────────────────────────────────

describe('GET /api/decks/:slug/assets', () => {
  it('returns empty array for deck without assets folder', async () => {
    const { status, data } = await call('GET', '/api/decks/nonexistent-deck/assets');
    expect(status).toBe(200);
    expect(data).toEqual([]);
  });
});

// ─── POST /api/decks/:slug/assets — upload ───────────────────────────────────

describe('POST /api/decks/:slug/assets', () => {
  // 1x1 transparent PNG — well under the 512px resize threshold so no browser is launched.
  const PNG_1x1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

  it('uploads a small PNG and returns 201', async () => {
    makeDeck('my-deck');
    const { status, data } = await call('POST', '/api/decks/my-deck/assets', {
      basename: 'tiny',
      mimeType: 'image/png',
      dataBase64: PNG_1x1,
    });
    expect(status).toBe(201);
    expect(data.filename).toBe('tiny.png');
    expect(data.resized).toBe(false);
  });

  it('writes the file to the deck assets directory', async () => {
    const dir = makeDeck('my-deck');
    await call('POST', '/api/decks/my-deck/assets', {
      basename: 'icon',
      mimeType: 'image/png',
      dataBase64: PNG_1x1,
    });
    expect(fs.existsSync(path.join(dir, 'assets', 'icon.png'))).toBe(true);
  });

  it('subsequent GET /assets includes the uploaded file', async () => {
    makeDeck('my-deck');
    await call('POST', '/api/decks/my-deck/assets', {
      basename: 'star',
      mimeType: 'image/png',
      dataBase64: PNG_1x1,
    });
    const { data } = await call('GET', '/api/decks/my-deck/assets');
    expect(data).toContain('star.png');
  });

  it('returns 400 when basename is missing', async () => {
    makeDeck('my-deck');
    const { status } = await call('POST', '/api/decks/my-deck/assets', {
      mimeType: 'image/png',
      dataBase64: PNG_1x1,
    });
    expect(status).toBe(400);
  });

  it('returns 400 when basename contains a slash', async () => {
    makeDeck('my-deck');
    const { status, data } = await call('POST', '/api/decks/my-deck/assets', {
      basename: '../escape',
      mimeType: 'image/png',
      dataBase64: PNG_1x1,
    });
    expect(status).toBe(400);
    expect(data.error).toMatch(/Invalid basename/);
  });

  it('returns 400 for unsupported mime type', async () => {
    makeDeck('my-deck');
    const { status, data } = await call('POST', '/api/decks/my-deck/assets', {
      basename: 'doc',
      mimeType: 'application/pdf',
      dataBase64: PNG_1x1,
    });
    expect(status).toBe(400);
    expect(data.error).toMatch(/Unsupported image type/);
  });

  it('returns 400 when uploading a duplicate basename', async () => {
    makeDeck('my-deck');
    await call('POST', '/api/decks/my-deck/assets', {
      basename: 'dup', mimeType: 'image/png', dataBase64: PNG_1x1,
    });
    const { status, data } = await call('POST', '/api/decks/my-deck/assets', {
      basename: 'dup', mimeType: 'image/png', dataBase64: PNG_1x1,
    });
    expect(status).toBe(400);
    expect(data.error).toMatch(/already exists/);
  });
});

// ─── POST /api/decks/:slug/export-pdf ────────────────────────────────────────

describe('POST /api/decks/:slug/export-pdf', () => {
  // Skipped by default — full export launches Chromium and depends on a running
  // Eleventy server at :8080 to serve the slide previewUrl. Run manually when
  // verifying the PDF pipeline end-to-end.
  it.skip('exports a deck to a PDF buffer', async () => {
    const dir = makeDeck('my-deck');
    writeSlide(dir, '01-cover.md', 1);
    const res = await route(req('POST', '/api/decks/my-deck/export-pdf'), null, '', tmpRoot);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(0);
    // %PDF header
    const head = Buffer.from(buf.slice(0, 4)).toString('ascii');
    expect(head).toBe('%PDF');
  }, 60_000);

  it('returns 500 when deck has no slides', async () => {
    makeDeck('empty-deck');
    const res = await route(req('POST', '/api/decks/empty-deck/export-pdf'), null, '', tmpRoot);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toMatch(/No slides/);
  });

  it('returns 400 for invalid slug', async () => {
    const res = await route(req('POST', '/api/decks/..bad/export-pdf'), null, '', tmpRoot);
    expect(res.status).toBe(400);
  });
});

// ─── GET /api/decks/:slug/slides ─────────────────────────────────────────────

describe('GET /api/decks/:slug/slides', () => {
  it('returns 200 with slide list', async () => {
    const dir = makeDeck('my-deck');
    writeSlide(dir, 'cover.md', 1);
    writeSlide(dir, 'concept.md', 2);

    const { status, data } = await call('GET', '/api/decks/my-deck/slides');
    expect(status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0].filename).toBe('cover.md');
  });

  it('returns empty array for deck with no slides', async () => {
    makeDeck('empty-deck');
    const { status, data } = await call('GET', '/api/decks/empty-deck/slides');
    expect(status).toBe(200);
    expect(data).toEqual([]);
  });
});

// ─── POST /api/decks/:slug/slides ────────────────────────────────────────────

describe('POST /api/decks/:slug/slides', () => {
  it('creates a slide and returns 201', async () => {
    makeDeck('my-deck');
    const { status, data } = await call('POST', '/api/decks/my-deck/slides', {
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
    await call('POST', '/api/decks/my-deck/slides', {
      template: 'cover', label: 'Cover', position: 1,
    });
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
    expect(files).toHaveLength(1);
  });
});

describe('POST /api/decks/:slug/slides — scaffolds fields/items', () => {
  it('seeds empty fields from the template gallery for big-concept', async () => {
    makeDeck('my-deck');
    const { status, data } = await call('POST', '/api/decks/my-deck/slides', {
      template: 'big-concept', variant: 'default', label: 'Empty',
    });
    expect(status).toBe(201);

    const { data: saved } = await call('GET', `/api/decks/my-deck/slides/${data.filename}`);
    // big-concept default has `title` and `note` fields.
    expect(saved.data.fields).toBeDefined();
    expect(saved.data.fields.title).toBeDefined();
    expect(saved.data.fields.title.content).toBe('');
    expect(saved.data.fields.note).toBeDefined();
    expect(saved.data.fields.note.content).toBe('');
  });

  it('seeds empty itemsMarkdown string for big-list', async () => {
    makeDeck('my-deck');
    const { data } = await call('POST', '/api/decks/my-deck/slides', {
      template: 'big-list', variant: 'numeric', label: 'Empty list',
    });
    const { data: saved } = await call('GET', `/api/decks/my-deck/slides/${data.filename}`);
    expect(saved.data.itemsMarkdown).toBe('');
    expect(saved.data.items).toBeUndefined();
  });

  it('explicit fields override the scaffold', async () => {
    makeDeck('my-deck');
    const { data } = await call('POST', '/api/decks/my-deck/slides', {
      template: 'big-concept',
      label: 'With content',
      fields: { title: { content: 'Hello', meta: 'Title_Text' } },
    });
    const { data: saved } = await call('GET', `/api/decks/my-deck/slides/${data.filename}`);
    expect(saved.data.fields.title.content).toBe('Hello');
    // Caller fields fully replace the scaffold — no `note` here.
    expect(saved.data.fields.note).toBeUndefined();
  });
});

describe('POST /api/decks/:slug/slides — insert at intermediate position', () => {
  it('inserts after the currently-selected slide and renumbers the rest', async () => {
    // Setup: three slides already in the deck.
    const dir = makeDeck('my-deck');
    writeSlide(dir, 'a.md', 1, { label: 'A' });
    writeSlide(dir, 'b.md', 2, { label: 'B' });
    writeSlide(dir, 'c.md', 3, { label: 'C' });

    // Simulating the new UI behavior: user has slide B (index 1) selected and clicks
    // "+ Add slide" — the modal pre-fills position with idx+2 = 3 (just after B).
    const { status, data } = await call('POST', '/api/decks/my-deck/slides', {
      template: 'big-concept',
      label: 'Between B and C',
      position: 3,
    });
    expect(status).toBe(201);
    expect(data.order).toBe(3);

    // All four slides should now be present with sequential orders 1..4.
    const { data: list } = await call('GET', '/api/decks/my-deck/slides');
    expect(list).toHaveLength(4);
    expect(list.map(s => s.order)).toEqual([1, 2, 3, 4]);
    expect(list.map(s => s.label)).toEqual(['A', 'B', 'Between B and C', 'C']);

    // The slides config should be updated in the new order
    const config = JSON.parse(fs.readFileSync(path.join(dir, 'deck.config.json'), 'utf8'));
    expect(config.slides).toEqual(['a.md', 'b.md', 'between-b-and-c.md', 'c.md']);
  });

  it('inserts at the start when position is 1', async () => {
    const dir = makeDeck('my-deck');
    writeSlide(dir, '01-a.md', 1, { label: 'A' });
    writeSlide(dir, '02-b.md', 2, { label: 'B' });

    await call('POST', '/api/decks/my-deck/slides', {
      template: 'cover', label: 'New First', position: 1,
    });

    const { data: list } = await call('GET', '/api/decks/my-deck/slides');
    expect(list).toHaveLength(3);
    expect(list.map(s => s.label)).toEqual(['New First', 'A', 'B']);
    expect(list.map(s => s.order)).toEqual([1, 2, 3]);
  });

  it('appends at end when position equals slides.length + 1', async () => {
    const dir = makeDeck('my-deck');
    writeSlide(dir, '01-a.md', 1, { label: 'A' });
    writeSlide(dir, '02-b.md', 2, { label: 'B' });

    await call('POST', '/api/decks/my-deck/slides', {
      template: 'cover', label: 'Tail', position: 3,
    });

    const { data: list } = await call('GET', '/api/decks/my-deck/slides');
    expect(list).toHaveLength(3);
    expect(list[2].label).toBe('Tail');
    expect(list[2].order).toBe(3);
  });

  it('clamps position above slides.length + 1 to end', async () => {
    const dir = makeDeck('my-deck');
    writeSlide(dir, '01-a.md', 1);
    writeSlide(dir, '02-b.md', 2);

    await call('POST', '/api/decks/my-deck/slides', {
      template: 'cover', label: 'X', position: 99,
    });

    const { data: list } = await call('GET', '/api/decks/my-deck/slides');
    expect(list).toHaveLength(3);
    expect(list[2].label).toBe('X');
  });
});

// ─── GET /api/decks/:slug/slides/:filename ────────────────────────────────────

describe('GET /api/decks/:slug/slides/:filename', () => {
  it('returns 200 with slide data', async () => {
    const dir = makeDeck('my-deck');
    writeSlide(dir, 'cover.md', 1, { template: 'cover', label: 'Cover', body: '# Body\n' });
    const { status, data } = await call('GET', '/api/decks/my-deck/slides/cover.md');
    expect(status).toBe(200);
    expect(data.filename).toBe('cover.md');
    expect(data.data.template).toBe('cover');
    expect(data.body).toBe('# Body\n');
  });

  it('returns 404 for nonexistent slide', async () => {
    makeDeck('my-deck');
    const { status } = await call('GET', '/api/decks/my-deck/slides/missing.md');
    expect(status).toBe(404);
  });
});

// ─── PUT /api/decks/:slug/slides/:filename ────────────────────────────────────

describe('PUT /api/decks/:slug/slides/:filename', () => {
  it('updates frontmatter and returns 200', async () => {
    const dir = makeDeck('my-deck');
    writeSlide(dir, 'cover.md', 1, { label: 'Original' });

    const { status, data } = await call('PUT', '/api/decks/my-deck/slides/cover.md', {
      data: { label: 'Updated' },
    });
    expect(status).toBe(200);
    expect(data.filename).toBe('cover.md');

    const { data: saved } = await call('GET', '/api/decks/my-deck/slides/cover.md');
    expect(saved.data.label).toBe('Updated');
  });

  it('returns 400 for nonexistent slide', async () => {
    makeDeck('my-deck');
    const { status } = await call('PUT', '/api/decks/my-deck/slides/missing.md', { data: {} });
    expect(status).toBe(400);
  });
});

// ─── DELETE /api/decks/:slug/slides/:filename ─────────────────────────────────

describe('DELETE /api/decks/:slug/slides/:filename', () => {
  it('deletes slide and returns 200 with remaining list', async () => {
    const dir = makeDeck('my-deck');
    writeSlide(dir, 'a.md', 1);
    writeSlide(dir, 'b.md', 2);

    const { status, data } = await call('DELETE', '/api/decks/my-deck/slides/a.md');
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(1);
    expect(fs.existsSync(path.join(dir, 'a.md'))).toBe(false);
  });

  it('returns 404 for nonexistent slide', async () => {
    makeDeck('my-deck');
    const { status } = await call('DELETE', '/api/decks/my-deck/slides/missing.md');
    expect(status).toBe(404);
  });
});

// ─── POST /api/decks/:slug/slides/:filename/move ──────────────────────────────

describe('POST /api/decks/:slug/slides/:filename/move', () => {
  it('moves slide to target position', async () => {
    const dir = makeDeck('my-deck');
    writeSlide(dir, 'a.md', 1, { label: 'A' });
    writeSlide(dir, 'b.md', 2, { label: 'B' });
    writeSlide(dir, 'c.md', 3, { label: 'C' });

    const { status, data } = await call(
      'POST', '/api/decks/my-deck/slides/a.md/move', { position: 3 },
    );
    expect(status).toBe(200);
    expect(data.map(s => s.slug)).toEqual(['b', 'c', 'a']);
  });
});

// ─── POST /api/decks/:slug/reorder ───────────────────────────────────────────

describe('POST /api/decks/:slug/reorder', () => {
  it('reorders slides by provided filename array', async () => {
    const dir = makeDeck('my-deck');
    writeSlide(dir, 'a.md', 1, { label: 'A' });
    writeSlide(dir, 'b.md', 2, { label: 'B' });
    writeSlide(dir, 'c.md', 3, { label: 'C' });

    const { status, data } = await call('POST', '/api/decks/my-deck/reorder', {
      order: ['c.md', 'a.md', 'b.md'],
    });
    expect(status).toBe(200);
    expect(data.map(s => s.slug)).toEqual(['c', 'a', 'b']);
  });
});

// ─── Input validation ─────────────────────────────────────────────────────────

describe('Input validation', () => {
  it('POST reorder returns 400 when order is not an array', async () => {
    makeDeck('my-deck');
    const { status } = await call('POST', '/api/decks/my-deck/reorder', { order: 'not-an-array' });
    expect(status).toBe(400);
  });

  it('POST move returns 400 when position is not a number', async () => {
    const dir = makeDeck('my-deck');
    writeSlide(dir, '01-a.md', 1);
    const { status } = await call('POST', '/api/decks/my-deck/slides/01-a.md/move', { position: 'first' });
    expect(status).toBe(400);
  });
});

// ─── Unknown route ────────────────────────────────────────────────────────────

describe('Unknown routes', () => {
  it('returns 404 when no serveFile is provided', async () => {
    const res = await route(req('GET', '/unknown'), null, '', tmpRoot);
    expect(res.status).toBe(404);
  });
});

// ─── Full CRUD workflow ───────────────────────────────────────────────────────

describe('Full CRUD workflow', () => {
  it('create → read → update → delete → verify renumbering', async () => {
    makeDeck('my-deck');

    await call('POST', '/api/decks/my-deck/slides', { template: 'cover', label: 'First', position: 1 });
    await call('POST', '/api/decks/my-deck/slides', { template: 'big-concept', label: 'Second', position: 2 });

    const { data: list } = await call('GET', '/api/decks/my-deck/slides');
    expect(list).toHaveLength(2);
    const first = list[0];

    await call('PUT', `/api/decks/my-deck/slides/${first.filename}`, {
      data: { label: 'Updated First' },
    });
    const { data: updated } = await call('GET', `/api/decks/my-deck/slides/${first.filename}`);
    expect(updated.data.label).toBe('Updated First');

    await call('DELETE', `/api/decks/my-deck/slides/${first.filename}`);

    const { data: remaining } = await call('GET', '/api/decks/my-deck/slides');
    expect(remaining).toHaveLength(1);
    expect(remaining[0].order).toBe(1);
  });
});

// ─── deck structure (ANSVA) ────────────────────────────────────────────────────

describe('deck structure routes', () => {
  function seedStructuredDeck(slug, slideCount, sections) {
    const dir = makeDeck(slug);
    for (let i = 1; i <= slideCount; i++) {
      writeSlide(dir, `${String(i).padStart(2, '0')}-slide-${i}.md`, i);
    }
    fs.writeFileSync(
      path.join(dir, 'deck.config.json'),
      JSON.stringify({ structure: { type: 'ANSVA', sections } }, null, 2),
      'utf8',
    );
    return dir;
  }

  it('GET /structure returns null when the deck has no config', async () => {
    const dir = makeDeck('plain');
    writeSlide(dir, '01-a.md', 1);
    const { status, data } = await call('GET', '/api/decks/plain/structure');
    expect(status).toBe(200);
    expect(data).toBeNull();
  });

  it('GET /structure returns the normalized section map', async () => {
    seedStructuredDeck('d', 10, [
      { id: 'A', label: 'A', start: 1, end: 3 },
      { id: 'B', label: 'B', start: 4, end: 10 },
    ]);
    const { data } = await call('GET', '/api/decks/d/structure');
    expect(data.type).toBe('ANSVA');
    expect(data.slideCount).toBe(10);
    expect(data.sections.map(s => s.start)).toEqual([1, 4]);
    expect(data.sections[1].end).toBe(10);
  });

  it('POST /structure/boundary moves and persists a boundary', async () => {
    seedStructuredDeck('d', 10, [
      { id: 'A', label: 'A', start: 1, end: 5 },
      { id: 'B', label: 'B', start: 6, end: 10 },
    ]);
    const { status, data } = await call('POST', '/api/decks/d/structure/boundary', { index: 1, start: 4 });
    expect(status).toBe(200);
    expect(data.sections[0].end).toBe(3);
    expect(data.sections[1].start).toBe(4);
  });

  it('POST /structure/boundary rejects non-numeric input', async () => {
    seedStructuredDeck('d', 5, [{ id: 'A', label: 'A', start: 1, end: 5 }]);
    const { status } = await call('POST', '/api/decks/d/structure/boundary', { index: 'x', start: 2 });
    expect(status).toBe(400);
  });

  it('creating a slide shifts the structure so it keeps tiling the deck', async () => {
    seedStructuredDeck('d', 10, [
      { id: 'A', label: 'A', start: 1, end: 5 },
      { id: 'B', label: 'B', start: 6, end: 10 },
    ]);
    await call('POST', '/api/decks/d/slides', { template: 'cover', label: 'New', position: 3 });
    const { data } = await call('GET', '/api/decks/d/structure');
    expect(data.slideCount).toBe(11);
    expect(data.sections[0].end).toBe(6);  // A grew (slide inserted at 3)
    expect(data.sections[1].start).toBe(7);
    expect(data.sections[1].end).toBe(11);
  });

  it('deleting a slide shifts the structure back', async () => {
    const dir = seedStructuredDeck('d', 10, [
      { id: 'A', label: 'A', start: 1, end: 5 },
      { id: 'B', label: 'B', start: 6, end: 10 },
    ]);
    const { data: list } = await call('GET', '/api/decks/d/slides');
    const third = list[2]; // order 3, inside A
    await call('DELETE', `/api/decks/d/slides/${third.filename}`);
    const { data } = await call('GET', '/api/decks/d/structure');
    expect(data.slideCount).toBe(9);
    expect(data.sections[0].end).toBe(4); // A shrank
    expect(data.sections[1].start).toBe(5);
  });
});
