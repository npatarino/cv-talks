import { describe, it, expect } from 'vitest';
import { parseBigList } from '../../theme/lib/big-list.mjs';

describe('parseBigList', () => {
  it('devuelve [] para vacío o undefined', () => {
    expect(parseBigList('')).toEqual([]);
    expect(parseBigList(undefined)).toEqual([]);
    expect(parseBigList('\n  \n')).toEqual([]);
  });

  it('viñetas: un item por línea, sin numeración', () => {
    expect(parseBigList('- uno\n* dos\n+ tres')).toEqual([
      { text: 'uno' }, { text: 'dos' }, { text: 'tres' },
    ]);
  });

  it('listas ordenadas conservan el marcador en n', () => {
    expect(parseBigList('1. uno\n2) dos\na. tres')).toEqual([
      { text: 'uno', n: '1' }, { text: 'dos', n: '2' }, { text: 'tres', n: 'a' },
    ]);
  });

  it('checklist: [ ] todo, [x] done, [-] fail, y quita la casilla del texto', () => {
    expect(parseBigList('- [ ] a\n- [x] b\n- [X] c\n- [-] d')).toEqual([
      { text: 'a', state: 'todo' },
      { text: 'b', state: 'done' },
      { text: 'c', state: 'done' },
      { text: 'd', state: 'fail' },
    ]);
  });

  it('glosario: **término**: descripción y término sin negrita', () => {
    const [a, b] = parseBigList('* **API**: interfaz\n* Cache: memoria rápida');
    expect(a).toMatchObject({ term: 'API', desc: 'interfaz' });
    expect(b).toMatchObject({ term: 'Cache', desc: 'memoria rápida' });
  });

  it('una URL no se interpreta como término de glosario', () => {
    const [a] = parseBigList('- https://example.com');
    expect(a.term).toBeUndefined();
    expect(a.text).toBe('https://example.com');
  });

  it('sub-items (4+ espacios) cuelgan del último item de primer nivel', () => {
    expect(parseBigList('1. padre\n    a. hijo\n    b. otro')).toEqual([
      { text: 'padre', n: '1', sub: [{ n: 'a', text: 'hijo' }, { n: 'b', text: 'otro' }] },
    ]);
  });

  it('un sub-item sin padre se promociona a primer nivel', () => {
    expect(parseBigList('    - huérfano')).toEqual([{ text: 'huérfano' }]);
  });

  it('las líneas de continuación se añaden al texto del item', () => {
    expect(parseBigList('- uno\n  sigue aquí')).toEqual([{ text: 'uno sigue aquí' }]);
  });

  it('acepta saltos de línea CRLF', () => {
    expect(parseBigList('- a\r\n- b')).toEqual([{ text: 'a' }, { text: 'b' }]);
  });
});
