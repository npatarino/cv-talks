import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { expandDeckAssets, readDeckAsset } from '../../theme/lib/deck-assets.mjs';

let decks;
beforeEach(() => {
  decks = fs.mkdtempSync(path.join(os.tmpdir(), 'deck-assets-'));
  fs.mkdirSync(path.join(decks, 'd', 'slides', 'assets'), { recursive: true });
});
afterEach(() => { fs.rmSync(decks, { recursive: true, force: true }); });

const asset = (name, content) => fs.writeFileSync(path.join(decks, 'd', 'slides', 'assets', name), content);
const run = (html, input = 'decks/d/slides/x.md', output = '_site/x/index.html') =>
  expandDeckAssets(html, input, output, decks);

describe('expandDeckAssets', () => {
  it('expande assets/ a la ruta absoluta del deck en src, href y data-inline', () => {
    const out = run('<img src="assets/a.png"><a href="assets/b.pdf"></a>');
    expect(out).toContain('src="/talks/decks/d/assets/a.png"');
    expect(out).toContain('href="/talks/decks/d/assets/b.pdf"');
  });

  it('no toca páginas fuera de un deck ni salidas que no son .html', () => {
    const html = '<img src="assets/a.png">';
    expect(run(html, 'templates/x.md')).toBe(html);
    expect(run(html, 'decks/d/slides/x.md', '_site/x.txt')).toBe(html);
    expect(expandDeckAssets(html, undefined, undefined, decks)).toBe(html);
  });

  it('incrusta un SVG animado aunque no lleve data-inline, y traslada class/alt', () => {
    asset('a.svg', '<?xml version="1.0"?>\n<svg viewBox="0 0 1 1"><style>a{}</style></svg>');
    const out = run('<img src="assets/a.svg" class="big" alt="Logo">');
    expect(out).toMatch(/^<svg viewBox="0 0 1 1" class="big" role="img" aria-label="Logo">/);
    expect(out).not.toContain('<?xml');
    expect(out).not.toContain('<img');
  });

  it('deja como <img> un SVG estático sin data-inline, y lo incrusta con data-inline', () => {
    asset('s.svg', '<svg><path d="M0 0"/></svg>');
    expect(run('<img src="assets/s.svg">')).toContain('<img');
    expect(run('<img src="assets/s.svg" data-inline>')).toMatch(/^<svg>/);
  });

  it('incrusta fragmentos HTML con <div data-inline="assets/x.html">', () => {
    asset('f.html', '\n<p>hola</p>\n');
    expect(run('<div data-inline="assets/f.html"></div>')).toBe('<p>hola</p>');
  });

  it('si el asset no existe deja la etiqueta tal cual (con la ruta ya expandida)', () => {
    expect(run('<img src="assets/missing.svg">')).toBe('<img src="/talks/decks/d/assets/missing.svg">');
  });

  it('readDeckAsset busca primero en slides/assets y luego en assets', () => {
    fs.mkdirSync(path.join(decks, 'd', 'assets'));
    fs.writeFileSync(path.join(decks, 'd', 'assets', 'y.txt'), 'root');
    expect(readDeckAsset(decks, 'd', 'y.txt')).toBe('root');
    asset('y.txt', 'slides');
    expect(readDeckAsset(decks, 'd', 'y.txt')).toBe('slides');
    expect(readDeckAsset(decks, 'd', 'nope.txt')).toBeNull();
  });
});
