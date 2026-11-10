/**
 * Configuración de Eleventy (ESM).
 *
 * La lectura de decks (lista, metadatos, orden de slides) viene del store del
 * editor, para que Eleventy y el editor compartan una sola implementación.
 * La lógica con entidad propia vive en theme/lib/.
 */

import fs from 'node:fs';
import path from 'node:path';
import { renderSEOHeadHTML } from '@chimichurricode/design-system/seo/render-head';
import { buildJsonLd } from '@chimichurricode/design-system/seo';
import { DECKS_DIR } from './editor/config.mjs';
import { deckDir, deckMetaPath, listDeckSlugs, readSlideOrder } from './editor/api/store/deck-store.mjs';
import { expandDeckAssets } from './theme/lib/deck-assets.mjs';
import { parseBigList } from './theme/lib/big-list.mjs';
import { groupTalks } from './theme/lib/talks.mjs';

export default function (eleventyConfig) {
  eleventyConfig.addFilter('seoHead', (props) => renderSEOHeadHTML(props));
  eleventyConfig.addFilter('seoJsonLd', (data, kind, siteId) =>
    buildJsonLd({ kind, siteId: siteId || 'talks', data }));

  eleventyConfig.addTransform('deckAssets', function (content) {
    return expandDeckAssets(content, this.page?.inputPath, this.page?.outputPath, DECKS_DIR);
  });

  eleventyConfig.addFilter('parseBigList', parseBigList);

  eleventyConfig.addPassthroughCopy({ 'theme/styles': 'talks/styles' });
  eleventyConfig.addPassthroughCopy({ 'theme/assets': 'talks/assets' });

  const slugs = listDeckSlugs(DECKS_DIR);

  // Assets de cada deck: decks/<slug>/assets o decks/<slug>/slides/assets.
  for (const slug of slugs) {
    const assetsDir = path.join(DECKS_DIR, slug, 'assets');
    const slidesAssetsDir = path.join(DECKS_DIR, slug, 'slides', 'assets');
    if (fs.existsSync(assetsDir)) {
      eleventyConfig.addPassthroughCopy({ [`decks/${slug}/assets`]: `talks/decks/${slug}/assets` });
    } else if (fs.existsSync(slidesAssetsDir)) {
      eleventyConfig.addPassthroughCopy({ [`decks/${slug}/slides/assets`]: `talks/decks/${slug}/assets` });
    }
  }

  eleventyConfig.addPassthroughCopy({
    'node_modules/@chimichurricode/design-system/dist': 'design-system',
  });
  eleventyConfig.addPassthroughCopy({
    'node_modules/@chimichurricode/analytics/dist': 'analytics',
  });

  eleventyConfig.addCollection('templates', (api) =>
    api.getFilteredByGlob('templates/*.md').sort((a, b) => a.data.order - b.data.order));

  // Una colección por deck, ordenada según deck.config.json (las no listadas, al final).
  for (const slug of slugs) {
    eleventyConfig.addCollection(`deck:${slug}`, (api) => {
      const slideOrder = readSlideOrder(deckDir(slug, DECKS_DIR));
      const position = (item) => {
        const i = slideOrder.indexOf(path.basename(item.inputPath));
        return i === -1 ? Infinity : i;
      };
      return api
        .getFilteredByGlob([`decks/${slug}/*.md`, `decks/${slug}/slides/*.md`])
        .sort((a, b) => position(a) - position(b));
    });
  }

  const readDecks = () =>
    listDeckSlugs(DECKS_DIR).map((slug) => {
      const metaPath = deckMetaPath(slug, DECKS_DIR);
      const raw = metaPath ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : {};
      return { slug, ...(raw.deck || {}) };
    });
  eleventyConfig.addGlobalData('decks', readDecks);
  // Charlas: una por `deck.talk`, con todas sus ediciones (ver theme/lib/talks.mjs).
  eleventyConfig.addGlobalData('talks', () => groupTalks(readDecks()));

  eleventyConfig.ignores.add('node_modules/**');
  eleventyConfig.ignores.add('README.md');
  eleventyConfig.ignores.add('scripts/**');
  // Repo-only docs and agent skills: not part of the published site.
  eleventyConfig.ignores.add('docs/**');
  eleventyConfig.ignores.add('.agents/**');
  eleventyConfig.ignores.add('.claude/**');
  // The editor UI is served by editor/server.mjs from editor/ui, never from _site.
  eleventyConfig.ignores.add('editor/**');

  return {
    dir: {
      input: '.',
      includes: 'theme/_includes',
      data: '_data',
      output: '_site',
    },
    templateFormats: ['md', 'njk', 'html'],
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
  };
}
