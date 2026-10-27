#!/usr/bin/env node
// Añade una slide a un deck usando el mismo código que el editor (createSlide):
// siembra los campos vacíos del template y la inserta en deck.config.json.
// Uso: node scripts/new-slide.mjs <deck> <template> ["<label>"] [--variant V] [--recipe R] [--position N] [--slug S]
//   p. ej.: node scripts/new-slide.mjs mi-charla big-stat "Latencia" --position 5

import { parseArgs } from 'node:util';
import { createSlide } from '../editor/api/domain/slides.mjs';
import { getTemplatesMeta } from '../editor/api/domain/templates.mjs';
import { listDeckSlugs } from '../editor/api/store/deck-store.mjs';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    variant: { type: 'string' },
    recipe: { type: 'string' },
    position: { type: 'string' },
    slug: { type: 'string' },
  },
});
const [deck, template, label] = positionals;

const usage = () => {
  console.error('uso: node scripts/new-slide.mjs <deck> <template> ["<label>"] [--variant V] [--recipe R] [--position N] [--slug S]');
  console.error(`templates: ${Object.keys(getTemplatesMeta()).join(', ')}`);
  process.exit(1);
};

if (!deck || !template) usage();
if (!listDeckSlugs().includes(deck)) {
  console.error(`deck no encontrado: ${deck}. Decks: ${listDeckSlugs().join(', ')}\nCréalo con node scripts/new-deck.mjs`);
  process.exit(1);
}
if (!getTemplatesMeta()[template]) {
  console.error(`template desconocido: ${template}`);
  usage();
}

try {
  const slide = createSlide(deck, {
    template,
    label,
    variant: values.variant,
    recipe: values.recipe,
    slug: values.slug,
    position: values.position ? Number(values.position) : undefined,
  });
  console.log(`creado decks/${deck}/slides/${slide.filename} (posición ${slide.order})`);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
