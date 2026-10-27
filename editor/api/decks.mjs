/**
 * Decks API — compatibilidad. El acceso a decks vive en store/deck-store.mjs.
 */

import fs from 'node:fs';
import path from 'node:path';
import { parseMd } from './frontmatter.mjs';
import { TALKS_ROOT, TEMPLATES_DIR, templatePreviewUrl } from '../config.mjs';

export { listDecks, deckDir } from './store/deck-store.mjs';
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
      previewUrl: templatePreviewUrl(fileSlug),
    };
  });
}
