/**
 * Templates: metadatos de la galería (_data/templates.json) y listado de las
 * slides de ejemplo de templates/.
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { parseMd } from '../lib/frontmatter.mjs';
import { TEMPLATES_DIR, TEMPLATES_META_PATH, templatePreviewUrl } from '../../config.mjs';

const require = createRequire(import.meta.url);

export function getTemplatesMeta() {
  return require(TEMPLATES_META_PATH);
}

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
