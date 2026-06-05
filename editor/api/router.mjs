/**
 * HTTP request router for the cv-talks editor API.
 *
 * Pure function: receives a Request, returns a Promise<Response>.
 * serveFile is injected so the router stays testable outside Bun.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { listDecks, listTemplateSlides, deckDir, TALKS_ROOT } from './decks.mjs';
import { exportDeckPdf } from './pdf.mjs';
import { uploadAsset } from './assets.mjs';
import { getSlideDir } from './renumber.mjs';
import {
  listSlides,
  getSlide,
  createSlide,
  updateSlide,
  removeSlide,
  reorderSlides,
  moveSlideTo,
  loadTemplateScaffold,
} from './slides.mjs';
import { getTemplatesMeta } from './templates.mjs';
import { getStructure, setStructureBoundary } from './structure.mjs';
import { listDesignSystemIcons } from './design-system.mjs';

// ---------- response helpers ----------

export function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

export function err(message, status = 400) {
  return json({ error: message }, status);
}

// ---------- helpers ----------

/** Guard against path traversal in URL slug segments. */
function validSlug(s) {
  return typeof s === 'string' && /^[a-z0-9][a-z0-9_.-]*$/i.test(s) ? s : null;
}

// ---------- router ----------

/**
 * @param {Request} req
 * @param {(filePath: string) => Promise<Response>} serveFile - injected file server
 * @param {string} [uiDir] - path to the editor UI directory
 * @param {string} [decksRoot] - override decks root for testing
 */
export async function route(req, serveFile, uiDir = '', decksRoot = undefined) {
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

  if (method === 'GET' && pathname === '/api/decks') {
    return json(listDecks());
  }

  if (method === 'GET' && pathname === '/api/templates') {
    return json(getTemplatesMeta());
  }

  if (method === 'GET' && pathname === '/api/template-slides') {
    return json(listTemplateSlides());
  }

  if (method === 'GET' && pathname === '/api/design-system/icons') {
    try {
      return json(await listDesignSystemIcons());
    } catch (e) {
      return err(e.message, 500);
    }
  }

  // GET /api/template-scaffold?template=X&variant=Y
  // Returns { fields?, items? } with empty content — used by the editor when
  // the user changes a slide's template so the form can re-render against the
  // new template's shape.
  if (method === 'GET' && pathname === '/api/template-scaffold') {
    const template = url.searchParams.get('template');
    const variant = url.searchParams.get('variant') ?? 'default';
    if (!template) return err('Missing template parameter');
    const scaffold = loadTemplateScaffold(template, variant);
    return json(scaffold ?? { fields: undefined, items: undefined });
  }

  // GET /api/decks/:slug/assets
  const assetsMatch = pathname.match(/^\/api\/decks\/([^/]+)\/assets$/);
  if (method === 'GET' && assetsMatch) {
    const [, rawSlug] = assetsMatch;
    const slug = validSlug(rawSlug);
    if (!slug) return err('Invalid deck slug', 400);
    // Assets live alongside the slides (decks/<slug>/slides/assets), which is
    // also where uploadAsset writes them — mirror getSlideDir so the listing
    // matches what's actually on disk.
    const dir = path.join(getSlideDir(deckDir(slug, decksRoot)), 'assets');
    try {
      const files = fs.readdirSync(dir)
        .filter(f => /\.(png|jpg|jpeg|svg|gif|webp|avif)$/i.test(f))
        .sort();
      return json(files);
    } catch { return json([]); }
  }

  // POST /api/decks/:slug/assets — upload a new image
  // Body: { basename: string, mimeType: string, dataBase64: string }
  if (method === 'POST' && assetsMatch) {
    const [, rawSlug] = assetsMatch;
    const slug = validSlug(rawSlug);
    if (!slug) return err('Invalid deck slug', 400);
    try {
      const { basename, mimeType, dataBase64 } = await req.json();
      if (typeof basename !== 'string' || typeof mimeType !== 'string' || typeof dataBase64 !== 'string') {
        return err('Missing basename, mimeType, or dataBase64');
      }
      const buffer = Buffer.from(dataBase64, 'base64');
      const result = await uploadAsset(slug, { basename, mimeType, buffer }, decksRoot);
      return json(result, 201);
    } catch (e) {
      return err(e.message);
    }
  }

  // GET /api/git-status
  if (method === 'GET' && pathname === '/api/git-status') {
    try {
      const modified = spawnSync('git', ['diff', '--name-only', 'HEAD'], {
        cwd: TALKS_ROOT, encoding: 'utf8',
      });
      const untracked = spawnSync('git', ['ls-files', '--others', '--exclude-standard'], {
        cwd: TALKS_ROOT, encoding: 'utf8',
      });
      return json({
        modified: [
          ...(modified.stdout || '').trim().split('\n').filter(Boolean),
          ...(untracked.stdout || '').trim().split('\n').filter(Boolean),
        ],
      });
    } catch { return json({ modified: [] }); }
  }

  // GET /api/decks/:slug/structure — narrative section map (or null)
  const structureMatch = pathname.match(/^\/api\/decks\/([^/]+)\/structure$/);
  if (method === 'GET' && structureMatch) {
    const slug = validSlug(structureMatch[1]);
    if (!slug) return err('Invalid deck slug', 400);
    try { return json(getStructure(slug, decksRoot)); }
    catch (e) { return err(e.message, 404); }
  }

  // POST /api/decks/:slug/structure/boundary — move where a section starts.
  // Body: { index: number, start: number }
  const boundaryMatch = pathname.match(/^\/api\/decks\/([^/]+)\/structure\/boundary$/);
  if (method === 'POST' && boundaryMatch) {
    const slug = validSlug(boundaryMatch[1]);
    if (!slug) return err('Invalid deck slug', 400);
    try {
      const { index, start } = await req.json();
      if (typeof index !== 'number' || typeof start !== 'number') {
        return err('index and start must be numbers');
      }
      return json(setStructureBoundary(slug, index, start, decksRoot));
    } catch (e) { return err(e.message); }
  }

  // /api/decks/:slug/slides[/:filename]
  const slidesMatch = pathname.match(/^\/api\/decks\/([^/]+)\/slides$/);
  const slideMatch  = pathname.match(/^\/api\/decks\/([^/]+)\/slides\/([^/]+)$/);

  if (method === 'GET' && slidesMatch) {
    const [, rawSlug] = slidesMatch;
    const slug = validSlug(rawSlug);
    if (!slug) return err('Invalid deck slug', 400);
    try { return json(listSlides(slug, decksRoot)); }
    catch (e) { return err(e.message, 404); }
  }

  if (method === 'POST' && slidesMatch) {
    const [, rawSlug] = slidesMatch;
    const slug = validSlug(rawSlug);
    if (!slug) return err('Invalid deck slug', 400);
    try {
      const body = await req.json();
      return json(createSlide(slug, body, decksRoot), 201);
    } catch (e) { return err(e.message); }
  }

  // POST /api/decks/:slug/reorder
  const reorderMatch = pathname.match(/^\/api\/decks\/([^/]+)\/reorder$/);
  if (method === 'POST' && reorderMatch) {
    const [, rawSlug] = reorderMatch;
    const slug = validSlug(rawSlug);
    if (!slug) return err('Invalid deck slug', 400);
    try {
      const { order } = await req.json();
      if (!Array.isArray(order) || !order.every(f => typeof f === 'string')) {
        return err('order must be an array of filenames');
      }
      return json(reorderSlides(slug, order, decksRoot));
    } catch (e) { return err(e.message); }
  }

  if (method === 'GET' && slideMatch) {
    const [, rawSlug, filename] = slideMatch;
    const slug = validSlug(rawSlug);
    if (!slug) return err('Invalid deck slug', 400);
    try { return json(getSlide(slug, filename, decksRoot)); }
    catch (e) { return err(e.message, 404); }
  }

  if (method === 'PUT' && slideMatch) {
    const [, rawSlug, filename] = slideMatch;
    const slug = validSlug(rawSlug);
    if (!slug) return err('Invalid deck slug', 400);
    try {
      const body = await req.json();
      return json(updateSlide(slug, filename, body, decksRoot));
    } catch (e) { return err(e.message); }
  }

  // POST /api/decks/:slug/slides/:filename/git-revert
  const gitRevertMatch = pathname.match(/^\/api\/decks\/([^/]+)\/slides\/([^/]+)\/git-revert$/);
  if (method === 'POST' && gitRevertMatch) {
    const [, rawSlug, filename] = gitRevertMatch;
    const slug = validSlug(rawSlug);
    if (!slug) return err('Invalid deck slug', 400);
    const slidesDirAbs = path.join(TALKS_ROOT, 'decks', slug, 'slides');
    const hasSlidesDir = fs.existsSync(slidesDirAbs);
    const relPath = hasSlidesDir ? `decks/${slug}/slides/${filename}` : `decks/${slug}/${filename}`;
    const result = spawnSync('git', ['checkout', 'HEAD', '--', relPath], {
      cwd: TALKS_ROOT, encoding: 'utf8',
    });
    if (result.status !== 0) {
      return err(result.stderr || 'git checkout failed');
    }
    try { return json(getSlide(slug, filename, decksRoot)); }
    catch { return json({ ok: true }); }
  }

  // DELETE /api/decks/:slug/slides/:filename
  if (method === 'DELETE' && slideMatch) {
    const [, rawSlug, filename] = slideMatch;
    const slug = validSlug(rawSlug);
    if (!slug) return err('Invalid deck slug', 400);
    try { return json(removeSlide(slug, filename, decksRoot)); }
    catch (e) { return err(e.message, 404); }
  }

  // POST /api/decks/:slug/slides/:filename/move
  const moveMatch = pathname.match(/^\/api\/decks\/([^/]+)\/slides\/([^/]+)\/move$/);
  if (method === 'POST' && moveMatch) {
    const [, rawSlug, filename] = moveMatch;
    const slug = validSlug(rawSlug);
    if (!slug) return err('Invalid deck slug', 400);
    try {
      const { position } = await req.json();
      if (typeof position !== 'number') {
        return err('position must be a number');
      }
      return json(moveSlideTo(slug, filename, position, decksRoot));
    } catch (e) { return err(e.message); }
  }

  // POST /api/decks/:slug/export-pdf
  const exportPdfMatch = pathname.match(/^\/api\/decks\/([^/]+)\/export-pdf$/);
  if (method === 'POST' && exportPdfMatch) {
    const [, rawSlug] = exportPdfMatch;
    const slug = validSlug(rawSlug);
    if (!slug) return err('Invalid deck slug', 400);
    try {
      const pdfBuffer = await exportDeckPdf(slug, decksRoot);
      return new Response(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${slug}.pdf"`,
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (e) {
      return err(e.message, 500);
    }
  }

  // ---- Static file serving ----
  if (serveFile) {
    if (pathname === '/' || pathname === '') {
      return serveFile(path.join(uiDir, 'index.html'));
    }
    const staticPath = pathname.startsWith('/') ? pathname.slice(1) : pathname;
    return serveFile(path.join(uiDir, staticPath));
  }

  return new Response('Not found', { status: 404 });
}
