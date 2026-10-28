/**
 * Formatea las slides de decks/ al estilo YAML canónico del editor.
 *
 * Hace parse → serialize de cada slide (las que lista el deck: decks/<slug>/slides/*.md
 * o decks/<slug>/*.md; los documentos auxiliares como analisis-*.md se ignoran).
 * Los ficheros ya canónicos no se reescriben, así que no genera ruido en git.
 *
 * Uso:
 *   bun run decks:format-check         # sale con 1 si alguna slide necesita formato (CI)
 *   bun run decks:format               # formatea todos los decks
 *   bun scripts/format-decks.mjs <slug>  # formatea un solo deck
 */

import fs from 'node:fs';
import path from 'node:path';
import { parseMd, serializeMd, splitFrontmatter } from '../editor/api/lib/frontmatter.mjs';
import { DECKS_DIR } from '../editor/config.mjs';
import { deckDir, listDeckSlugs, readSlides } from '../editor/api/store/deck-store.mjs';

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const targetDeck = args.find(a => !a.startsWith('--'));

const slugs = targetDeck ? [targetDeck] : listDeckSlugs();
if (targetDeck && !fs.existsSync(deckDir(targetDeck))) {
  console.error(`deck no encontrado: ${targetDeck}`);
  process.exit(1);
}

let changed = 0;
let checked = 0;
let failed = 0;

for (const slug of slugs) {
  for (const { filepath } of readSlides(deckDir(slug))) {
    const raw = fs.readFileSync(filepath, 'utf8');
    let canonical;
    try {
      // Sin bloque de frontmatter (p. ej. falta el `---` de cierre) parseMd devuelve
      // {} y serializar reescribiría el fichero entero como cuerpo: se rechaza.
      if (!splitFrontmatter(raw).yamlStr) throw new Error('no frontmatter block (¿falta el `---` de cierre?)');
      const { data, body } = parseMd(raw);
      canonical = serializeMd(data, body);
    } catch (e) {
      console.error(`  ✗ ${path.relative(DECKS_DIR, filepath)}: ${e.message}`);
      failed++;
      continue;
    }

    checked++;
    if (canonical === raw) continue;

    const rel = path.relative(DECKS_DIR, filepath);
    if (checkOnly) {
      console.log(`  needs formatting: ${rel}`);
    } else {
      fs.writeFileSync(filepath, canonical, 'utf8');
      console.log(`  formatted: ${rel}`);
    }
    changed++;
  }
}

if (checkOnly) {
  if (changed > 0) {
    console.log(`\n${changed} of ${checked} files need formatting. Run: bun run decks:format`);
    process.exit(1);
  }
  console.log(`${checked} files already canonical.`);
} else if (changed > 0) {
  console.log(`\nFormatted ${changed} of ${checked} files.`);
} else {
  console.log(`${checked} files already canonical. Nothing to do.`);
}

// Un fichero que no se puede formatear es un error también en modo escritura.
if (failed > 0) {
  console.error(`\n${failed} fichero(s) sin formatear por errores (ver arriba).`);
  process.exit(1);
}
