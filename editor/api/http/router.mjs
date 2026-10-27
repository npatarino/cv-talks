/**
 * Router HTTP del editor.
 *
 * Una tabla de rutas `[método, patrón, handler]`. El router parsea y valida los
 * parámetros de ruta (`:slug`, `:filename`), ejecuta el handler y convierte su
 * resultado o su error en una Response. Los handlers devuelven datos (o una
 * Response si necesitan controlar status/cabeceras) y lanzan errores tipados.
 *
 * `route` es una función pura Request → Promise<Response>; `serveFile` se
 * inyecta para que el router sea testeable fuera de Bun.
 */

import path from 'node:path';
import remoteHandler from '../../../api/remote.mjs';
import { json, err, fail, text, preflight } from './respond.mjs';
import * as v from './validate.mjs';
import { adaptVercel } from './vercel-adapter.mjs';
import { statusOf, ValidationError } from '../domain/errors.mjs';
import { listDecks, deckDir, listAssets, getSlideDir } from '../store/deck-store.mjs';
import { modifiedFiles, revertFile } from '../store/git.mjs';
import { listTemplateSlides, getTemplatesMeta } from '../domain/templates.mjs';
import { exportDeckPdf } from '../pdf.mjs';
import { uploadAsset } from '../assets.mjs';
import {
  listSlides, getSlide, getSlideRaw, createSlide, updateSlide,
  removeSlide, reorderSlides, moveSlideTo,
} from '../slides.mjs';
import { loadTemplateScaffold } from '../domain/scaffold.mjs';
import { getStructure, setStructureBoundary } from '../structure.mjs';
import { listDesignSystemIcons } from '../design-system.mjs';

export { json, err, adaptVercel };

// ─── tabla de rutas ──────────────────────────────────────────────────────────

const routes = [];

/** Registra una ruta. `:nombre` captura un segmento y se valida por nombre. */
function on(method, pattern, handler) {
  const names = [];
  const re = new RegExp('^' + pattern.replace(/:([a-z]+)/gi, (_, n) => { names.push(n); return '([^/]+)'; }) + '$');
  routes.push({ method, re, names, handler });
}

// Handlers reciben { req, url, params, decksRoot } y devuelven datos o Response.
const dir = ({ params, decksRoot }) => deckDir(params.slug, decksRoot);
const body = async ({ req }) => v.object(await v.readJson(req));

on('GET', '/api/decks', () => listDecks());
on('GET', '/api/templates', () => getTemplatesMeta());
on('GET', '/api/template-slides', () => listTemplateSlides());
on('GET', '/api/design-system/icons', () => listDesignSystemIcons());
on('GET', '/api/git-status', () => ({ modified: modifiedFiles() }));

// Esqueleto vacío de un template, para reformar el formulario al cambiar de template.
on('GET', '/api/template-scaffold', ({ url }) => {
  const template = url.searchParams.get('template');
  if (!template) throw new ValidationError('Missing template parameter');
  const variant = url.searchParams.get('variant') ?? 'default';
  return loadTemplateScaffold(template, variant) ?? { fields: undefined, items: undefined };
});

on('GET', '/api/decks/:slug/assets', (ctx) => listAssets(dir(ctx)));
on('POST', '/api/decks/:slug/assets', async (ctx) => {
  // Body: { basename, mimeType, dataBase64 }
  const b = v.strings(await body(ctx), ['basename', 'mimeType', 'dataBase64'], 'Missing basename, mimeType, or dataBase64');
  const buffer = Buffer.from(b.dataBase64, 'base64');
  const result = await uploadAsset(ctx.params.slug, { basename: b.basename, mimeType: b.mimeType, buffer }, ctx.decksRoot);
  return json(result, 201);
});

// Mapa de secciones narrativas (o null).
on('GET', '/api/decks/:slug/structure', ({ params, decksRoot }) => getStructure(params.slug, decksRoot));
on('POST', '/api/decks/:slug/structure/boundary', async (ctx) => {
  const b = await body(ctx);
  v.number(b.index, 'index and start must be numbers');
  v.number(b.start, 'index and start must be numbers');
  return setStructureBoundary(ctx.params.slug, b.index, b.start, ctx.decksRoot);
});

on('GET', '/api/decks/:slug/slides', ({ params, decksRoot }) => listSlides(params.slug, decksRoot));
on('POST', '/api/decks/:slug/slides', async (ctx) =>
  json(createSlide(ctx.params.slug, await body(ctx), ctx.decksRoot), 201));

on('POST', '/api/decks/:slug/reorder', async (ctx) => {
  const { order } = await body(ctx);
  v.stringArray(order, 'order must be an array of filenames');
  return reorderSlides(ctx.params.slug, order, ctx.decksRoot);
});

on('GET', '/api/decks/:slug/slides/:filename/raw', ({ params, decksRoot }) =>
  text(getSlideRaw(params.slug, params.filename, decksRoot)));
on('GET', '/api/decks/:slug/slides/:filename', ({ params, decksRoot }) =>
  getSlide(params.slug, params.filename, decksRoot));
on('PUT', '/api/decks/:slug/slides/:filename', async (ctx) =>
  updateSlide(ctx.params.slug, ctx.params.filename, await body(ctx), ctx.decksRoot));
on('DELETE', '/api/decks/:slug/slides/:filename', ({ params, decksRoot }) =>
  removeSlide(params.slug, params.filename, decksRoot));

on('POST', '/api/decks/:slug/slides/:filename/move', async (ctx) => {
  const { position } = await body(ctx);
  v.number(position, 'position must be a number');
  return moveSlideTo(ctx.params.slug, ctx.params.filename, position, ctx.decksRoot);
});

on('POST', '/api/decks/:slug/slides/:filename/git-revert', ({ params, decksRoot }) => {
  revertFile(path.join(getSlideDir(deckDir(params.slug, decksRoot)), params.filename));
  try { return getSlide(params.slug, params.filename, decksRoot); }
  catch { return { ok: true }; }
});

on('POST', '/api/decks/:slug/export-pdf', async ({ params, decksRoot }) => {
  const pdf = await exportDeckPdf(listSlides(params.slug, decksRoot));
  return new Response(pdf, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${params.slug}.pdf"`,
      'Access-Control-Allow-Origin': '*',
    },
  });
});

// ─── despacho ────────────────────────────────────────────────────────────────

/**
 * @param {Request} req
 * @param {(filePath: string) => Promise<Response>} serveFile - servidor de ficheros inyectado
 * @param {string} [uiDir] - directorio de la UI del editor
 * @param {string} [decksRoot] - raíz de decks alternativa (tests)
 */
export async function route(req, serveFile, uiDir = '', decksRoot = undefined) {
  const url = new URL(req.url);
  const { pathname } = url;
  const method = req.method;

  if (method === 'OPTIONS') return preflight();

  // Relay del mando a distancia: el mismo handler que en Vercel (api/remote.mjs)
  // pero en memoria. El player lo usa con ?api=http://localhost:3001/api/remote.
  if (pathname === '/api/remote') return adaptVercel(remoteHandler, req, url);

  for (const r of routes) {
    if (r.method !== method) continue;
    const m = pathname.match(r.re);
    if (!m) continue;
    try {
      const params = {};
      r.names.forEach((name, i) => {
        params[name] = v.PARAM_VALIDATORS[name] ? v.PARAM_VALIDATORS[name](m[i + 1]) : m[i + 1];
      });
      const out = await r.handler({ req, url, params, decksRoot });
      return out instanceof Response ? out : json(out);
    } catch (e) {
      if (!Number.isInteger(statusOf(e, NaN))) console.error(`[editor] ${method} ${pathname}:`, e);
      return fail(e, 500);
    }
  }

  // Ficheros estáticos de la UI.
  if (serveFile) {
    const rel = pathname === '/' || pathname === '' ? 'index.html' : pathname.replace(/^\//, '');
    const target = path.join(uiDir, rel);
    if (uiDir && path.relative(uiDir, target).startsWith('..')) return new Response('Not found', { status: 404 });
    return serveFile(target);
  }

  return new Response('Not found', { status: 404 });
}
