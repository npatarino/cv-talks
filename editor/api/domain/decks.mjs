/**
 * Decks (dominio): crear un deck nuevo con la estructura que esperan Eleventy
 * y el editor. Lo usan scripts/new-deck.mjs y los tests.
 */

import fs from 'node:fs';
import path from 'node:path';
import { ConflictError, ValidationError } from './errors.mjs';
import { deckDir, writeDeckConfig, SLUG_RE } from '../store/deck-store.mjs';
import { DECKS_DIR } from '../../config.mjs';

const frontmatter = (lines) => `---\n${lines.join('\n')}\n---\n`;

/** Páginas njk que cada deck necesita: índice (TOC), player y speaker. */
function pages(slug) {
  const common = ['eleventyExcludeFromCollections: true', 'eleventyComputed:', '  layout: ""'];
  const slides = `{% set slides = collections["deck:${slug}"] %}`;
  return {
    'index.njk': frontmatter([`permalink: /talks/decks/${slug}/index.html`, ...common])
      + `{% set slug = "${slug}" %}\n${slides}\n{% include "deck-toc.njk" %}\n`,
    'deck.njk': frontmatter([`permalink: /talks/decks/${slug}/deck/index.html`, ...common])
      + `${slides}\n{% include "deck-player.njk" %}\n`,
    'speaker.njk': frontmatter([`permalink: /talks/decks/${slug}/speaker/index.html`, ...common])
      + `{% set slug = "${slug}" %}\n${slides}\n{% include "deck-speaker.njk" %}\n`,
  };
}

/** Metadatos de Eleventy del deck (`<slug>.11tydata.json`). */
function metadata(slug, { title, subtitle, author, date }) {
  return {
    tags: `${slug}-slide`,
    permalink: `talks/decks/${slug}/{{ page.fileSlug }}/index.html`,
    deck: {
      title,
      ...(subtitle ? { subtitle } : {}),
      author: author ?? '',
      date: date ?? new Date().toISOString().slice(0, 7),
    },
    eleventyComputed: {
      layout: '{% if template %}layouts/{{ template }}.njk{% else %}{{ layout }}{% endif %}',
      slideCss: '{% if template %}{{ template }}{% endif %}',
      effectiveMode: '{{ mode or site.mode }}',
    },
  };
}

/**
 * Crea un deck vacío: metadatos, config de orden, páginas njk y carpeta slides/.
 * Eleventy registra una colección por deck al arrancar, así que hay que
 * reiniciar `eleventy --serve` para que lo vea.
 *
 * @param {string} slug
 * @param {{title: string, subtitle?: string, author?: string, date?: string}} meta
 * @param {string} [decksRoot]
 * @returns {{slug: string, dir: string, files: string[]}}
 */
export function createDeck(slug, meta, decksRoot = DECKS_DIR) {
  if (typeof slug !== 'string' || !SLUG_RE.test(slug)) throw new ValidationError('Invalid deck slug');
  if (!meta?.title || typeof meta.title !== 'string') throw new ValidationError('Deck title is required');

  const dir = deckDir(slug, decksRoot);
  if (fs.existsSync(dir)) throw new ConflictError(`Deck already exists: ${slug}`);

  fs.mkdirSync(path.join(dir, 'slides'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'slides', '.gitkeep'), '');
  fs.writeFileSync(path.join(dir, `${slug}.11tydata.json`), JSON.stringify(metadata(slug, meta), null, 2) + '\n');
  writeDeckConfig(dir, { slides: [] });
  for (const [name, content] of Object.entries(pages(slug))) {
    fs.writeFileSync(path.join(dir, name), content);
  }

  return {
    slug,
    dir,
    files: [`${slug}.11tydata.json`, 'deck.config.json', 'index.njk', 'deck.njk', 'speaker.njk', 'slides/'],
  };
}
