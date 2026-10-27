import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  deckDir, getSlideDir, readDeckConfig, writeDeckConfig, readSlideOrder,
  readSlides, listDecks, listDeckSlugs, deckMetaPath, listAssets, assetsDir,
} from '../../editor/api/store/deck-store.mjs';

let root;
beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'deck-store-')); });
afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

const mk = (slug) => { const d = path.join(root, slug); fs.mkdirSync(d, { recursive: true }); return d; };
const slide = (dir, name, extra = '') => fs.writeFileSync(path.join(dir, name), `---\ntemplate: cover\nlabel: ${name}\n${extra}---\n`);

describe('rutas', () => {
  it('deckDir cuelga de decksRoot y getSlideDir prefiere slides/', () => {
    expect(deckDir('x', root)).toBe(path.join(root, 'x'));
    const d = mk('a');
    expect(getSlideDir(d)).toBe(d);
    fs.mkdirSync(path.join(d, 'slides'));
    expect(getSlideDir(d)).toBe(path.join(d, 'slides'));
  });
});

describe('deck.config.json', () => {
  it('devuelve null si no existe y [] como orden', () => {
    const d = mk('a');
    expect(readDeckConfig(d)).toBeNull();
    expect(readSlideOrder(d)).toEqual([]);
  });

  it('escribe con sangría de 2 y salto de línea final, y se relee igual', () => {
    const d = mk('a');
    writeDeckConfig(d, { slides: ['a.md'], extra: { k: 1 } });
    const raw = fs.readFileSync(path.join(d, 'deck.config.json'), 'utf8');
    expect(raw.endsWith('}\n')).toBe(true);
    expect(raw).toContain('\n  "slides"');
    expect(readDeckConfig(d)).toEqual({ slides: ['a.md'], extra: { k: 1 } });
  });

  it('un JSON corrupto lanza en vez de tratarse como vacío', () => {
    const d = mk('a');
    fs.writeFileSync(path.join(d, 'deck.config.json'), '{ nope');
    expect(() => readDeckConfig(d)).toThrow(/Invalid JSON/);
  });
});

describe('readSlides', () => {
  it('ordena según el config, deja las no listadas al final y numera desde 1', () => {
    const d = mk('a');
    slide(d, 'b.md'); slide(d, 'a.md'); slide(d, 'z.md'); slide(d, 'index.md');
    writeDeckConfig(d, { slides: ['b.md', 'a.md'] });
    const s = readSlides(d);
    expect(s.map(x => x.filename)).toEqual(['b.md', 'a.md', 'z.md']);
    expect(s.map(x => x.data.order)).toEqual([1, 2, 3]);
  });

  it('devuelve [] si el deck no existe', () => {
    expect(readSlides(path.join(root, 'nope'))).toEqual([]);
  });
});

describe('listDecks', () => {
  it('lee metadatos de <slug>.json o .11tydata.json y la config', () => {
    const a = mk('a'); const b = mk('b'); mk('c');
    fs.writeFileSync(path.join(a, 'a.json'), JSON.stringify({ deck: { title: 'A' } }));
    fs.writeFileSync(path.join(b, 'b.11tydata.json'), JSON.stringify({ deck: { title: 'B' }, permalink: 'p' }));
    writeDeckConfig(a, { slides: [] });
    const decks = listDecks(root);
    expect(decks.map(d => d.slug).sort()).toEqual(['a', 'b', 'c']);
    const by = Object.fromEntries(decks.map(d => [d.slug, d]));
    expect(by.a.deck.title).toBe('A');
    expect(by.a.config).toEqual({ slides: [] });
    expect(by.b.deck.title).toBe('B');
    expect(by.b.permalink).toBe('p');
    expect(by.c.deck).toEqual({ title: 'c' });
    expect(by.c.config).toBeNull();
    expect(deckMetaPath('c', root)).toBeNull();
  });

  it('ignora ficheros sueltos y tolera que decks/ no exista', () => {
    fs.writeFileSync(path.join(root, 'file.txt'), '');
    expect(listDeckSlugs(root)).toEqual([]);
    expect(listDecks(path.join(root, 'nope'))).toEqual([]);
  });
});

describe('assets', () => {
  it('lista solo imágenes, ordenadas, junto a las slides', () => {
    const d = mk('a');
    fs.mkdirSync(path.join(d, 'slides', 'assets'), { recursive: true });
    for (const f of ['b.png', 'a.svg', 'notes.txt']) fs.writeFileSync(path.join(d, 'slides', 'assets', f), '');
    expect(assetsDir(d)).toBe(path.join(d, 'slides', 'assets'));
    expect(listAssets(d)).toEqual(['a.svg', 'b.png']);
  });

  it('devuelve [] si no hay carpeta', () => {
    expect(listAssets(mk('a'))).toEqual([]);
  });
});
