import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createDeck } from '../../editor/api/domain/decks.mjs';
import { createSlide, listSlides } from '../../editor/api/domain/slides.mjs';
import { listDecks, readSlides } from '../../editor/api/store/deck-store.mjs';
import { TALKS_ROOT } from '../../editor/config.mjs';

let root;
beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'create-deck-')); });
afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

describe('createDeck', () => {
  it('crea metadatos, config vacía, páginas njk y slides/', () => {
    const { dir, files } = createDeck('mi-charla', { title: 'Mi charla', author: 'Yo', date: '2026-10' }, root);
    expect(files).toContain('mi-charla.11tydata.json');
    for (const f of ['mi-charla.11tydata.json', 'deck.config.json', 'index.njk', 'deck.njk', 'speaker.njk', 'slides/.gitkeep']) {
      expect(fs.existsSync(path.join(dir, f)), f).toBe(true);
    }
    const meta = JSON.parse(fs.readFileSync(path.join(dir, 'mi-charla.11tydata.json'), 'utf8'));
    expect(meta.tags).toBe('mi-charla-slide');
    expect(meta.permalink).toBe('talks/decks/mi-charla/{{ page.fileSlug }}/index.html');
    expect(meta.deck).toEqual({ title: 'Mi charla', author: 'Yo', date: '2026-10' });
    expect(JSON.parse(fs.readFileSync(path.join(dir, 'deck.config.json'), 'utf8'))).toEqual({ slides: [] });
  });

  it('el editor lo ve como un deck normal y se le pueden añadir slides', () => {
    createDeck('mi-charla', { title: 'Mi charla' }, root);
    expect(listDecks(root).map(d => [d.slug, d.deck.title])).toEqual([['mi-charla', 'Mi charla']]);
    expect(readSlides(path.join(root, 'mi-charla'))).toEqual([]);

    createSlide('mi-charla', { template: 'cover', label: 'Portada' }, root);
    createSlide('mi-charla', { template: 'big-concept', label: 'Idea', position: 1 }, root);
    expect(listSlides('mi-charla', root).map(s => [s.order, s.label])).toEqual([[1, 'Idea'], [2, 'Portada']]);
    // las slides van a slides/, no a la raíz del deck
    expect(fs.existsSync(path.join(root, 'mi-charla', 'slides', 'portada.md'))).toBe(true);
  });

  it('las páginas njk son idénticas a las de un deck real', () => {
    const real = path.join(TALKS_ROOT, 'decks', 'el-programador-consciente');
    const { dir } = createDeck('el-programador-consciente', { title: 'x' }, root);
    for (const f of ['index.njk', 'deck.njk', 'speaker.njk']) {
      expect(fs.readFileSync(path.join(dir, f), 'utf8'), f).toBe(fs.readFileSync(path.join(real, f), 'utf8'));
    }
    const mine = JSON.parse(fs.readFileSync(path.join(dir, 'el-programador-consciente.11tydata.json'), 'utf8'));
    const theirs = JSON.parse(fs.readFileSync(path.join(real, 'el-programador-consciente.11tydata.json'), 'utf8'));
    expect(mine.eleventyComputed).toEqual(theirs.eleventyComputed);
    expect(mine.tags).toBe(theirs.tags);
    expect(mine.permalink).toBe(theirs.permalink);
  });

  it('rechaza slugs inválidos, título vacío y decks que ya existen', () => {
    expect(() => createDeck('../x', { title: 't' }, root)).toThrow(/Invalid deck slug/);
    expect(() => createDeck('ok', { title: '' }, root)).toThrow(/title/);
    createDeck('ok', { title: 't' }, root);
    expect(() => createDeck('ok', { title: 't' }, root)).toThrow(/already exists/);
    try { createDeck('ok', { title: 't' }, root); } catch (e) { expect(e.status).toBe(409); }
  });
});
