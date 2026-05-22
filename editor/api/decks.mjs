/**
 * Decks API — list available decks and their metadata.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TALKS_ROOT = path.resolve(__dirname, '../..');
const DECKS_DIR = path.join(TALKS_ROOT, 'decks');

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
