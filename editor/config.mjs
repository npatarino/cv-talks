/**
 * Configuración compartida del editor: rutas absolutas y origen del preview.
 * Ningún otro módulo debe derivar estas rutas por su cuenta.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export const TALKS_ROOT = path.resolve(here, '..');
export const DECKS_DIR = path.join(TALKS_ROOT, 'decks');
export const TEMPLATES_DIR = path.join(TALKS_ROOT, 'templates');
export const TEMPLATES_META_PATH = path.join(TALKS_ROOT, '_data', 'templates.json');
export const DESIGN_SYSTEM_ICONS_DIR = path.join(
  TALKS_ROOT, 'node_modules', '@chimichurricode', 'design-system', 'assets', 'icons',
);

/** Dónde sirve Eleventy el preview. Sobrescribible con ELEVENTY_URL. */
export const PREVIEW_ORIGIN = (process.env.ELEVENTY_URL || 'http://localhost:8080').replace(/\/+$/, '');

export const slidePreviewUrl = (slug, fileSlug) => `${PREVIEW_ORIGIN}/talks/decks/${slug}/${fileSlug}/`;
export const templatePreviewUrl = (fileSlug) => `${PREVIEW_ORIGIN}/talks/templates/${fileSlug}/`;
