#!/usr/bin/env bun
/**
 * cv-talks Slide Editor Server
 *
 * Serves the editor UI on :3001 and provides a REST API for slide CRUD.
 * Only intended for local development — never deploy this.
 *
 * Usage:
 *   bun editor/server.mjs
 *
 * Then open http://localhost:3001
 * Run Eleventy separately: bun run serve  (on :8080)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { listDecks, listTemplateSlides } from './api/decks.mjs';
import {
  listSlides,
  getSlide,
  createSlide,
  updateSlide,
  removeSlide,
  reorderSlides,
  moveSlideTo,
} from './api/slides.mjs';
import { getTemplatesMeta } from './api/templates.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UI_DIR = path.join(__dirname, 'ui');
const PORT = 3001;

// ---------- routing ----------

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

function err(message, status = 400) {
  return json({ error: message }, status);
}

async function route(req) {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const method = req.method;

  // OPTIONS preflight
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // ---- API routes ----

  // GET /api/decks
  if (method === 'GET' && pathname === '/api/decks') {
    return json(listDecks());
  }

  // GET /api/templates
  if (method === 'GET' && pathname === '/api/templates') {
    return json(getTemplatesMeta());
  }

  // GET /api/template-slides
  if (method === 'GET' && pathname === '/api/template-slides') {
    return json(listTemplateSlides());
  }

  // GET /api/decks/:slug/assets — list image files in deck assets folder
  const assetsMatch = pathname.match(/^\/api\/decks\/([^/]+)\/assets$/);
  if (method === 'GET' && assetsMatch) {
    const [, slug] = assetsMatch;
    const dir = path.join(UI_DIR.replace('/editor/ui', ''), 'decks', slug, 'assets');
    try {
      const files = fs.readdirSync(dir).filter(f =>
        /\.(png|jpg|jpeg|svg|gif|webp|avif)$/i.test(f)
      ).sort();
      return json(files);
    } catch { return json([]); }
  }

  // GET /api/git-status — returns list of modified file paths relative to repo root
  if (method === 'GET' && pathname === '/api/git-status') {
    try {
      const result = spawnSync('git', ['diff', '--name-only', 'HEAD'], {
        cwd: UI_DIR.replace('/editor/ui', ''),
        encoding: 'utf8',
      });
      // Also include untracked files that are not ignored
      const untracked = spawnSync('git', ['ls-files', '--others', '--exclude-standard'], {
        cwd: UI_DIR.replace('/editor/ui', ''),
        encoding: 'utf8',
      });
      const modified = (result.stdout || '').trim().split('\n').filter(Boolean);
      const newFiles = (untracked.stdout || '').trim().split('\n').filter(Boolean);
      return json({ modified: [...modified, ...newFiles] });
    } catch (e) {
      return json({ modified: [] });
    }
  }

  // GET /api/decks/:slug/slides
  const slidesMatch = pathname.match(/^\/api\/decks\/([^/]+)\/slides$/);
  if (method === 'GET' && slidesMatch) {
    const [, slug] = slidesMatch;
    try { return json(listSlides(slug)); }
    catch (e) { return err(e.message, 404); }
  }

  // POST /api/decks/:slug/slides
  if (method === 'POST' && slidesMatch) {
    const [, slug] = slidesMatch;
    try {
      const body = await req.json();
      const result = createSlide(slug, body);
      return json(result, 201);
    } catch (e) { return err(e.message); }
  }

  // POST /api/decks/:slug/reorder
  const reorderMatch = pathname.match(/^\/api\/decks\/([^/]+)\/reorder$/);
  if (method === 'POST' && reorderMatch) {
    const [, slug] = reorderMatch;
    try {
      const { order } = await req.json();
      const result = reorderSlides(slug, order);
      return json(result);
    } catch (e) { return err(e.message); }
  }

  // GET /api/decks/:slug/slides/:filename
  const slideMatch = pathname.match(/^\/api\/decks\/([^/]+)\/slides\/([^/]+)$/);
  if (method === 'GET' && slideMatch) {
    const [, slug, filename] = slideMatch;
    try { return json(getSlide(slug, filename)); }
    catch (e) { return err(e.message, 404); }
  }

  // PUT /api/decks/:slug/slides/:filename
  if (method === 'PUT' && slideMatch) {
    const [, slug, filename] = slideMatch;
    try {
      const body = await req.json();
      return json(updateSlide(slug, filename, body));
    } catch (e) { return err(e.message); }
  }

  // DELETE /api/decks/:slug/slides/:filename
  if (method === 'DELETE' && slideMatch) {
    const [, slug, filename] = slideMatch;
    try {
      const result = removeSlide(slug, filename);
      return json(result);
    } catch (e) { return err(e.message, 404); }
  }

  // POST /api/decks/:slug/slides/:filename/move
  const moveMatch = pathname.match(/^\/api\/decks\/([^/]+)\/slides\/([^/]+)\/move$/);
  if (method === 'POST' && moveMatch) {
    const [, slug, filename] = moveMatch;
    try {
      const { position } = await req.json();
      return json(moveSlideTo(slug, filename, position));
    } catch (e) { return err(e.message); }
  }

  // ---- Static file serving ----
  if (pathname === '/' || pathname === '') {
    return serveFile(path.join(UI_DIR, 'index.html'));
  }

  // Static assets under /editor/ prefix or bare filenames
  const staticPath = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  const fullPath = path.join(UI_DIR, staticPath);
  return serveFile(fullPath);
}

async function serveFile(filePath) {
  try {
    const file = Bun.file(filePath);
    if (!(await file.exists())) {
      return new Response('Not found', { status: 404 });
    }
    return new Response(file);
  } catch {
    return new Response('Not found', { status: 404 });
  }
}

// ---------- start ----------

const server = Bun.serve({
  port: PORT,
  fetch: async (req) => {
    try {
      return await route(req);
    } catch (e) {
      console.error('Unhandled error:', e);
      return err('Internal server error', 500);
    }
  },
});

console.log(`
╔════════════════════════════════════════╗
║  cv-talks Slide Editor                 ║
║  http://localhost:${PORT}                  ║
╠════════════════════════════════════════╣
║  Make sure Eleventy is running on :8080 ║
║  bun run serve  (in another terminal)  ║
╚════════════════════════════════════════╝
`);
