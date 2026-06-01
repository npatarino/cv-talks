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

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { route, err } from './api/router.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UI_DIR = path.join(__dirname, 'ui');
const PORT = 3001;

async function serveFile(filePath) {
  try {
    const file = Bun.file(filePath);
    if (!(await file.exists())) {
      return new Response('Not found', { status: 404 });
    }
    // The editor is a local dev tool — never let the browser (or a port-forward
    // proxy) serve a stale app.js/styles.css after an edit. no-store guarantees
    // a fresh fetch on every reload.
    return new Response(file, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}

const server = Bun.serve({
  port: PORT,
  // PDF export can take 30–120s depending on deck size (Playwright + Chromium).
  // Bun's default idleTimeout is 10s, which is too short for that operation.
  idleTimeout: 255,
  fetch: async (req) => {
    try {
      return await route(req, serveFile, UI_DIR);
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
