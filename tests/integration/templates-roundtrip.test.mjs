/**
 * Integration test: every template and deck slide must parse and re-serialize
 * back to an equivalent structure without data loss.
 *
 * This guards against parser regressions when real content is involved.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { parseMd, serializeMd } from '../../editor/api/lib/frontmatter.mjs';

// Parser YAML de referencia (el que usa Eleventy): nuestro parser propio debe
// coincidir con él en todos los ficheros reales, antes y después de serializar.
const matter = createRequire(import.meta.url)('gray-matter');
const asRef = (v) => JSON.parse(JSON.stringify(v, (k, x) => (x instanceof Date ? x.toISOString() : x)));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const TEMPLATES_DIR = path.join(ROOT, 'templates');
const DECKS_DIR = path.join(ROOT, 'decks');

function collectMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.isDirectory()) return collectMarkdownFiles(path.join(dir, entry.name));
    if (entry.name.endsWith('.md') && entry.name !== 'index.md') {
      return [path.join(dir, entry.name)];
    }
    return [];
  });
}

const templateFiles = collectMarkdownFiles(TEMPLATES_DIR);
const deckFiles = collectMarkdownFiles(DECKS_DIR).filter(f => f.includes('/slides/'));

describe('Template files — parse/serialize round-trip', () => {
  it('finds at least 40 template files', () => {
    expect(templateFiles.length).toBeGreaterThanOrEqual(40);
  });

  for (const filepath of templateFiles) {
    const rel = path.relative(ROOT, filepath);
    it(`round-trips: ${rel}`, () => {
      const original = fs.readFileSync(filepath, 'utf8');
      const { data, body } = parseMd(original);

      // Core fields must be present
      expect(data.template, `${rel}: missing template`).toBeDefined();
      expect(typeof data.order, `${rel}: order must be a number`).toBe('number');

      // Re-serialize and re-parse: data must be identical
      const reserialized = serializeMd(data, body);
      const { data: data2, body: body2 } = parseMd(reserialized);

      expect(data2, `${rel}: data round-trip failed`).toEqual(data);
      expect(body2, `${rel}: body round-trip failed`).toBe(body);
    });
  }
});

describe('Deck slide files — parse/serialize round-trip', () => {
  it('finds at least 1 deck slide', () => {
    expect(deckFiles.length).toBeGreaterThan(0);
  });

  for (const filepath of deckFiles) {
    const rel = path.relative(ROOT, filepath);
    it(`round-trips: ${rel}`, () => {
      const original = fs.readFileSync(filepath, 'utf8');
      const { data, body } = parseMd(original);

      expect(data.template, `${rel}: missing template`).toBeDefined();

      const reserialized = serializeMd(data, body);
      const { data: data2, body: body2 } = parseMd(reserialized);

      expect(data2, `${rel}: data round-trip failed`).toEqual(data);
      expect(body2, `${rel}: body round-trip failed`).toBe(body);
    });
  }
});

describe('Our parser agrees with the real YAML parser (gray-matter)', () => {
  for (const filepath of [...templateFiles, ...deckFiles]) {
    const rel = path.relative(ROOT, filepath);
    it(`agrees: ${rel}`, () => {
      const original = fs.readFileSync(filepath, 'utf8');
      const ref = matter(original);
      const ours = parseMd(original);
      expect(asRef(ours.data), `${rel}: parse differs from gray-matter`).toEqual(asRef(ref.data));
      expect(ours.body, `${rel}: body differs from gray-matter`).toBe(ref.content);

      const reserialized = serializeMd(ours.data, ours.body);
      const ref2 = matter(reserialized);
      expect(asRef(ref2.data), `${rel}: serialized output reads differently in gray-matter`).toEqual(asRef(ref.data));
      expect(ref2.content, `${rel}: serialized body differs`).toBe(ref.content);
    });
  }
});
