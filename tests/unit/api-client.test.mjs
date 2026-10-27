import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as api from '../../editor/ui/api-client.js';

let calls;
function stubFetch(handler = () => ({ body: { ok: true } })) {
  calls = [];
  vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
    calls.push({ url, method: init.method ?? 'GET', body: init.body === undefined ? undefined : JSON.parse(init.body), headers: init.headers });
    const { status = 200, body = {}, text, blob, statusText = '' } = handler(url, init) ?? {};
    return {
      ok: status >= 200 && status < 300, status, statusText,
      json: async () => { if (body === Error) throw new Error('no json'); return body; },
      text: async () => text ?? '',
      blob: async () => blob ?? new Blob(['pdf']),
    };
  }));
}
beforeEach(() => stubFetch());
afterEach(() => vi.unstubAllGlobals());

describe('api-client: URLs y cuerpos', () => {
  it('lecturas GET', async () => {
    await api.getConfig(); await api.getDecks(); await api.getTemplates(); await api.getTemplateSlides();
    await api.getDesignSystemIcons(); await api.getGitStatus();
    expect(calls.map(c => [c.method, c.url])).toEqual([
      ['GET', '/api/config'], ['GET', '/api/decks'], ['GET', '/api/templates'], ['GET', '/api/template-slides'],
      ['GET', '/api/design-system/icons'], ['GET', '/api/git-status'],
    ]);
  });

  it('el scaffold codifica template y variante', async () => {
    await api.getTemplateScaffold('big list', 'a&b');
    expect(calls[0].url).toBe('/api/template-scaffold?template=big%20list&variant=a%26b');
  });

  it('slides: listar, leer, guardar, borrar', async () => {
    await api.getSlides('d'); await api.getSlide('d', 'a.md'); await api.saveSlide('d', 'a.md', { label: 'x' }); await api.deleteSlide('d', 'a.md');
    expect(calls.map(c => [c.method, c.url, c.body])).toEqual([
      ['GET', '/api/decks/d/slides', undefined],
      ['GET', '/api/decks/d/slides/a.md', undefined],
      ['PUT', '/api/decks/d/slides/a.md', { data: { label: 'x' } }],
      ['DELETE', '/api/decks/d/slides/a.md', undefined],
    ]);
  });

  it('crear, reordenar, mover y revertir', async () => {
    await api.createSlide('d', { template: 'cover' });
    await api.reorderSlides('d', ['b.md', 'a.md']);
    await api.moveSlide('d', 'a.md', 3);
    await api.revertSlide('d', 'a.md');
    expect(calls.map(c => [c.method, c.url, c.body])).toEqual([
      ['POST', '/api/decks/d/slides', { template: 'cover' }],
      ['POST', '/api/decks/d/reorder', { order: ['b.md', 'a.md'] }],
      ['POST', '/api/decks/d/slides/a.md/move', { position: 3 }],
      ['POST', '/api/decks/d/slides/a.md/git-revert', undefined],
    ]);
  });

  it('estructura y assets', async () => {
    await api.getStructure('d'); await api.moveSectionBoundary('d', 2, 9);
    await api.getAssets('d'); await api.uploadAsset('d', { basename: 'b', mimeType: 'image/png', dataBase64: 'AA==', extra: 1 });
    expect(calls.map(c => [c.method, c.url, c.body])).toEqual([
      ['GET', '/api/decks/d/structure', undefined],
      ['POST', '/api/decks/d/structure/boundary', { index: 2, start: 9 }],
      ['GET', '/api/decks/d/assets', undefined],
      ['POST', '/api/decks/d/assets', { basename: 'b', mimeType: 'image/png', dataBase64: 'AA==' }],
    ]);
  });

  it('getSlideRaw devuelve texto y exportPdf un Blob', async () => {
    stubFetch(() => ({ text: '---\nlabel: x\n---\n' }));
    expect(await api.getSlideRaw('d', 'a.md')).toBe('---\nlabel: x\n---\n');
    expect(calls[0].url).toBe('/api/decks/d/slides/a.md/raw');
    const blob = await api.exportPdf('d');
    expect(blob).toBeInstanceOf(Blob);
    expect(calls[1]).toMatchObject({ method: 'POST', url: '/api/decks/d/export-pdf' });
  });

  it('envía siempre Content-Type JSON', async () => {
    await api.getDecks();
    expect(calls[0].headers).toEqual({ 'Content-Type': 'application/json' });
  });

  it('codifica slug y filename en la ruta', async () => {
    await api.getSlide('a b', 'x/y.md');
    expect(calls[0].url).toBe('/api/decks/a%20b/slides/x%2Fy.md');
  });
});

describe('api-client: errores', () => {
  it('lanza Error con el mensaje del servidor', async () => {
    stubFetch(() => ({ status: 404, body: { error: 'Slide not found: x.md' } }));
    await expect(api.getSlide('d', 'x.md')).rejects.toThrow('Slide not found: x.md');
  });

  it('usa statusText si el cuerpo no es JSON', async () => {
    stubFetch(() => ({ status: 502, statusText: 'Bad Gateway', body: Error }));
    await expect(api.getDecks()).rejects.toThrow('Bad Gateway');
  });

  it('exportPdf y getSlideRaw también lanzan en errores', async () => {
    stubFetch(() => ({ status: 500, body: { error: 'No slides found in deck' } }));
    await expect(api.exportPdf('d')).rejects.toThrow('No slides found in deck');
    await expect(api.getSlideRaw('d', 'a.md')).rejects.toThrow('No slides found in deck');
  });
});
