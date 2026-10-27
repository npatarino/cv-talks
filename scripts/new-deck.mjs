#!/usr/bin/env node
// Crea un deck nuevo (metadatos, deck.config.json, páginas njk y slides/).
// Uso: node scripts/new-deck.mjs <slug> "<título>" ["<autor>"] [--subtitle "<texto>"] [--date YYYY-MM]
//   p. ej.: node scripts/new-deck.mjs mi-charla "Mi charla" "Nicolás Patarino"
// Después: node scripts/new-slide.mjs mi-charla cover "Portada"
// Reinicia `eleventy --serve` para que registre el deck.

import { parseArgs } from 'node:util';
import { createDeck } from '../editor/api/domain/decks.mjs';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { subtitle: { type: 'string' }, date: { type: 'string' } },
});
const [slug, title, author] = positionals;

if (!slug || !title) {
  console.error('uso: node scripts/new-deck.mjs <slug> "<título>" ["<autor>"] [--subtitle "<texto>"] [--date YYYY-MM]');
  process.exit(1);
}

try {
  const deck = createDeck(slug, { title, author, subtitle: values.subtitle, date: values.date });
  console.log(`creado decks/${deck.slug}/ (${deck.files.join(', ')})`);
  console.log(`siguiente: node scripts/new-slide.mjs ${deck.slug} cover "Portada"`);
  console.log('recuerda reiniciar `eleventy --serve` para que vea el deck nuevo.');
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
