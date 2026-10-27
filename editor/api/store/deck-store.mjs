/**
 * Deck store — único módulo que sabe dónde vive un deck en disco y cómo se
 * leen y escriben sus ficheros (`deck.config.json`, metadatos, slides, assets).
 *
 * Todo acepta `decksRoot` opcional para que los tests apunten a un tmpdir.
 */

import fs from 'node:fs';
import path from 'node:path';
import { parseMd } from '../lib/frontmatter.mjs';
import { DECKS_DIR } from '../../config.mjs';

export const CONFIG_FILENAME = 'deck.config.json';
export const SLUG_RE = /^[a-z0-9][a-z0-9_.-]*$/i;
export const SLIDE_FILE_RE = /^[a-z0-9_-]+\.md$/i;
export const ASSET_FILE_RE = /\.(png|jpg|jpeg|svg|gif|webp|avif)$/i;

// ─── rutas ───────────────────────────────────────────────────────────────────

/** Ruta absoluta del directorio de un deck. */
export function deckDir(slug, decksRoot = DECKS_DIR) {
  return path.join(decksRoot, slug);
}

/** Directorio con los .md: `slides/` si existe, si no la raíz del deck. */
export function getSlideDir(dir) {
  const slidesDir = path.join(dir, 'slides');
  return fs.existsSync(slidesDir) ? slidesDir : dir;
}

export function configPath(dir) {
  return path.join(dir, CONFIG_FILENAME);
}

// ─── deck.config.json ────────────────────────────────────────────────────────

/** Config del deck, o null si no existe. Un JSON corrupto lanza (no se pisa). */
export function readDeckConfig(dir) {
  const p = configPath(dir);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    throw new Error(`Invalid JSON in ${p}: ${e.message}`);
  }
}

export function writeDeckConfig(dir, config) {
  fs.writeFileSync(configPath(dir), JSON.stringify(config, null, 2) + '\n', 'utf8');
}

/** Nombres de fichero en el orden del deck (vacío si no hay config). */
export function readSlideOrder(dir) {
  return readDeckConfig(dir)?.slides ?? [];
}

// ─── slides ──────────────────────────────────────────────────────────────────

/**
 * Slides del deck ordenadas según `deck.config.json`; las que no aparecen van
 * al final. `data.order` se calcula (1-based) y no se lee del frontmatter.
 */
export function readSlides(dir) {
  if (!fs.existsSync(dir)) return [];

  const slideOrder = readSlideOrder(dir);
  const targetDir = getSlideDir(dir);
  const files = fs.readdirSync(targetDir).filter(f =>
    f.endsWith('.md') && f !== 'index.md' && SLIDE_FILE_RE.test(f));

  const slides = files.map(filename => {
    const filepath = path.join(targetDir, filename);
    const { data, body } = parseMd(fs.readFileSync(filepath, 'utf8'));
    const idx = slideOrder.indexOf(filename);
    return { filename, filepath, data, body, _order: idx === -1 ? Infinity : idx };
  });

  slides.sort((a, b) => a._order - b._order);
  return slides.map((s, i) => { s.data.order = i + 1; return s; });
}

// ─── decks ───────────────────────────────────────────────────────────────────

/** Fichero de metadatos de Eleventy del deck (`<slug>.json` o `.11tydata.json`), o null. */
export function deckMetaPath(slug, decksRoot = DECKS_DIR) {
  const dir = deckDir(slug, decksRoot);
  for (const name of [`${slug}.json`, `${slug}.11tydata.json`]) {
    const p = path.join(dir, name);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/** Slugs de todos los decks (carpetas dentro de decks/). */
export function listDeckSlugs(decksRoot = DECKS_DIR) {
  if (!fs.existsSync(decksRoot)) return [];
  return fs.readdirSync(decksRoot, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);
}

/** Decks con sus metadatos y config. */
export function listDecks(decksRoot = DECKS_DIR) {
  return listDeckSlugs(decksRoot).map(slug => {
    const metaPath = deckMetaPath(slug, decksRoot);
    const meta = metaPath ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : {};
    return {
      slug,
      deck: meta.deck ?? { title: slug },
      permalink: meta.permalink ?? `talks/decks/${slug}/{{ page.fileSlug }}/index.html`,
      config: readDeckConfig(deckDir(slug, decksRoot)),
    };
  });
}

// ─── assets ──────────────────────────────────────────────────────────────────

/** Directorio de assets del deck (junto a las slides, donde escribe uploadAsset). */
export function assetsDir(dir) {
  return path.join(getSlideDir(dir), 'assets');
}

/** Imágenes disponibles en el deck, ordenadas. */
export function listAssets(dir) {
  try {
    return fs.readdirSync(assetsDir(dir)).filter(f => ASSET_FILE_RE.test(f)).sort();
  } catch {
    return [];
  }
}
