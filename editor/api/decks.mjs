/**
 * Decks API — list available decks and their metadata.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMd } from './frontmatter.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TALKS_ROOT = path.resolve(__dirname, '../..');
const DECKS_DIR = path.join(TALKS_ROOT, 'decks');
const TEMPLATES_DIR = path.join(TALKS_ROOT, 'templates');

/**
 * List all available decks with their metadata.
 */
export function listDecks() {
  if (!fs.existsSync(DECKS_DIR)) return [];

  return fs.readdirSync(DECKS_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => {
      const slug = e.name;
      const metaPath = path.join(DECKS_DIR, slug, `${slug}.json`);
      const meta = fs.existsSync(metaPath)
        ? JSON.parse(fs.readFileSync(metaPath, 'utf8'))
        : {};
      return {
        slug,
        deck: meta.deck ?? { title: slug },
        permalink: meta.permalink ?? `talks/decks/${slug}/{{ page.fileSlug }}/index.html`,
      };
    });
}

/**
 * Get the absolute path to a deck's directory.
 */
export function deckDir(slug) {
  return path.join(DECKS_DIR, slug);
}

export { TALKS_ROOT };

/**
 * List all template slides with their preview URLs and metadata.
 * Groups them by template name.
 */
export function listTemplateSlides() {
  if (!fs.existsSync(TEMPLATES_DIR)) return [];

  const files = fs.readdirSync(TEMPLATES_DIR)
    .filter(f => f.endsWith('.md') && f !== 'templates.json')
    .sort();

  return files.map(filename => {
    const filepath = path.join(TEMPLATES_DIR, filename);
    const raw = fs.readFileSync(filepath, 'utf8');
    const { data } = parseMd(raw);
    const fileSlug = filename.replace(/\.md$/, '');
    return {
      filename,
      fileSlug,
      template: data.template ?? '',
      variant: data.variant ?? 'default',
      recipe: data.recipe ?? 'canvas-quiet',
      label: data.label ?? fileSlug,
      order: data.order ?? 0,
      previewUrl: `http://localhost:8080/talks/templates/${fileSlug}/`,
    };
  });
}
