/**
 * Format all slide .md files in decks/ to canonical YAML style.
 *
 * Runs parse → serialize on every file. Files already in canonical form
 * are untouched (no write, no git noise). Files that differ get rewritten.
 *
 * Usage:
 *   bun run format            # format all decks
 *   bun run format --check    # exit 1 if any file needs formatting (CI)
 *   bun run format <slug>     # format a single deck
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMd, serializeMd } from '../editor/api/frontmatter.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DECKS_DIR = path.resolve(__dirname, '../decks');

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const targetDeck = args.find(a => !a.startsWith('--'));

const deckDirs = targetDeck
  ? [path.join(DECKS_DIR, targetDeck)]
  : fs.readdirSync(DECKS_DIR)
      .map(d => path.join(DECKS_DIR, d))
      .filter(d => fs.statSync(d).isDirectory());

let changed = 0;
let checked = 0;

for (const deckDir of deckDirs) {
  const files = fs.readdirSync(deckDir).filter(f => f.endsWith('.md')).sort();
  for (const file of files) {
    const filepath = path.join(deckDir, file);
    const raw = fs.readFileSync(filepath, 'utf8');
    let canonical;
    try {
      const { data, body } = parseMd(raw);
      canonical = serializeMd(data, body);
    } catch (e) {
      console.error(`  ✗ ${path.relative(DECKS_DIR, filepath)}: parse error — ${e.message}`);
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
    console.log(`\n${changed} of ${checked} files need formatting. Run: bun run format`);
    process.exit(1);
  } else {
    console.log(`${checked} files already canonical.`);
  }
} else {
  if (changed > 0) {
    console.log(`\nFormatted ${changed} of ${checked} files.`);
  } else {
    console.log(`${checked} files already canonical. Nothing to do.`);
  }
}
