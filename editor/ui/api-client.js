/**
 * Cliente de la API del editor. Único sitio con URLs y formas de petición:
 * el resto de la UI llama a funciones con nombre. Todas lanzan Error con el
 * mensaje del servidor si la respuesta no es 2xx.
 */

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(data.error || res.statusText);
  }
  return res;
}

const json = async (path, opts) => (await request(path, opts)).json();
const enc = encodeURIComponent;
const deck = (slug) => `/api/decks/${enc(slug)}`;
const slide = (slug, filename) => `${deck(slug)}/slides/${enc(filename)}`;

// ─── configuración y catálogo ────────────────────────────────────────────────
export const getConfig = () => json('/api/config');
export const getDecks = () => json('/api/decks');
export const getTemplates = () => json('/api/templates');
export const getTemplateSlides = () => json('/api/template-slides');
export const getTemplateScaffold = (template, variant) =>
  json(`/api/template-scaffold?template=${enc(template)}&variant=${enc(variant)}`);
export const getDesignSystemIcons = () => json('/api/design-system/icons');
export const getGitStatus = () => json('/api/git-status');

// ─── slides ──────────────────────────────────────────────────────────────────
export const getSlides = (slug) => json(`${deck(slug)}/slides`);
export const getSlide = (slug, filename) => json(slide(slug, filename));
export const getSlideRaw = async (slug, filename) => (await request(`${slide(slug, filename)}/raw`)).text();
export const createSlide = (slug, body) => json(`${deck(slug)}/slides`, { method: 'POST', body });
export const saveSlide = (slug, filename, data) => json(slide(slug, filename), { method: 'PUT', body: { data } });
export const deleteSlide = (slug, filename) => json(slide(slug, filename), { method: 'DELETE' });
export const reorderSlides = (slug, order) => json(`${deck(slug)}/reorder`, { method: 'POST', body: { order } });
export const moveSlide = (slug, filename, position) =>
  json(`${slide(slug, filename)}/move`, { method: 'POST', body: { position } });
export const revertSlide = (slug, filename) => json(`${slide(slug, filename)}/git-revert`, { method: 'POST' });

// ─── estructura narrativa ────────────────────────────────────────────────────
export const getStructure = (slug) => json(`${deck(slug)}/structure`);
export const moveSectionBoundary = (slug, index, start) =>
  json(`${deck(slug)}/structure/boundary`, { method: 'POST', body: { index, start } });

// ─── assets y export ─────────────────────────────────────────────────────────
export const getAssets = (slug) => json(`${deck(slug)}/assets`);
export const uploadAsset = (slug, { basename, mimeType, dataBase64 }) =>
  json(`${deck(slug)}/assets`, { method: 'POST', body: { basename, mimeType, dataBase64 } });
export const exportPdf = async (slug) => (await request(`${deck(slug)}/export-pdf`, { method: 'POST' })).blob();
