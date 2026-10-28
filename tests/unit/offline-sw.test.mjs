import { describe, it, expect } from 'vitest';
import {
  isHandled, cacheKey, cacheName, kindOf, extractUrls, warm, respond, shouldIntercept,
  installOfflineWorker, CACHE_PREFIX, OFFLINE_PATH, PROBE_HEADER, MISSING_HEADER,
} from '../../theme/assets/offline-sw.mjs';
import { fakeCaches, fakeSite, fakeWorkerScope, navRequest } from '../helpers/fake-sw-env.mjs';

const ORIGIN = 'https://talks.test';
const page = (path) => ORIGIN + path;

// ─── funciones puras ────────────────────────────────────────────────────────

describe('isHandled / cacheKey / cacheName', () => {
  it('gestiona solo /talks/, /design-system/ y /analytics/', () => {
    expect(isHandled('/talks/decks/x/deck/')).toBe(true);
    expect(isHandled('/design-system/tokens.css')).toBe(true);
    expect(isHandled('/analytics/snippet.js')).toBe(true);
    for (const p of ['/api/remote', '/', '/favicon.svg', '/sw.js', '/talk/x', '/editor/ui/app.js']) expect(isHandled(p), p).toBe(false);
  });

  it('la clave de caché descarta query y hash pero conserva la ruta', () => {
    expect(cacheKey(page('/talks/decks/x/cover/?present=1&reveal=full#/3'))).toBe(page('/talks/decks/x/cover/'));
    expect(cacheKey('/talks/a.css?v=2', ORIGIN)).toBe(page('/talks/a.css'));
  });

  it('el nombre de caché lleva el build', () => {
    expect(cacheName('abc123')).toBe(`${CACHE_PREFIX}abc123`);
  });
});

describe('kindOf', () => {
  it('prefiere el content-type', () => {
    expect(kindOf(page('/x'), 'text/html; charset=utf-8')).toBe('html');
    expect(kindOf(page('/x'), 'text/css')).toBe('css');
    expect(kindOf(page('/x'), 'application/javascript')).toBe('js');
    expect(kindOf(page('/x'), 'text/javascript; charset=utf-8')).toBe('js');
    expect(kindOf(page('/x.svg'), 'image/svg+xml')).toBe('html');
    expect(kindOf(page('/x.png'), 'image/png')).toBeNull();
    expect(kindOf(page('/x.otf'), 'font/otf')).toBeNull();
  });

  it('sin content-type útil usa la extensión', () => {
    expect(kindOf(page('/talks/decks/x/'), '')).toBe('html');
    expect(kindOf(page('/talks/a.html'), 'application/octet-stream')).toBe('html');
    expect(kindOf(page('/talks/a.css'), '')).toBe('css');
    expect(kindOf(page('/talks/a.mjs'), 'text/plain')).toBe('js');
    expect(kindOf(page('/talks/a.js'), '')).toBe('js');
    expect(kindOf(page('/talks/a.png'), '')).toBeNull();
  });
});

describe('extractUrls · html', () => {
  const base = page('/talks/decks/x/cover/');
  const html = `<!doctype html><html><head>
    <link rel="stylesheet" href="/talks/styles/tokens.css">
    <link rel="icon" href='/talks/assets/favicon.svg'>
    <link rel="stylesheet" href="https://fonts.example.com/x.css">
    <script src="/talks/assets/present.js"></script>
    <script defer src="/analytics/snippet.js"></script>
    <style>@font-face{src:url("/talks/styles/fonts/A.otf")}</style></head>
    <body style="background:url(/talks/decks/x/assets/bg.png)">
      <img src="/talks/decks/x/assets/a.svg?x=1#frag" srcset="/talks/decks/x/assets/a1.png 1x, /talks/decks/x/assets/a2.png 2x">
      <img src="data:image/png;base64,AAAA">
      <a href="/otro-sitio/pagina/">enlace fuera de los prefijos</a>
      <img src="assets/relativa.png">
      <iframe src="/talks/decks/x/embed/"></iframe>
      <img src="/fuera/de/prefijos.png">
      <script>window.__SLIDES__ = [{ url: "/talks/decks/x/cover/" }, { url: "/talks/decks/x/siguiente/" }];
        var s = document.createElement('script'); s.src = "/talks/assets/deck.js";</script>
    </body></html>`;
  const urls = extractUrls(html, base, 'html').map((u) => new URL(u).pathname);

  it('encuentra hojas de estilo, scripts, imágenes, srcset, iframes y url() de estilos', () => {
    expect(urls).toEqual(expect.arrayContaining([
      '/talks/styles/tokens.css', '/talks/assets/favicon.svg', '/talks/assets/present.js', '/analytics/snippet.js',
      '/talks/styles/fonts/A.otf', '/talks/decks/x/assets/bg.png', '/talks/decks/x/assets/a.svg',
      '/talks/decks/x/assets/a1.png', '/talks/decks/x/assets/a2.png', '/talks/decks/x/embed/',
    ]));
  });

  it('encuentra lo que un script carga o declara con rutas absolutas entre comillas', () => {
    expect(urls).toEqual(expect.arrayContaining(['/talks/assets/deck.js', '/talks/decks/x/siguiente/']));
  });

  it('resuelve rutas relativas contra la página', () => {
    expect(urls).toContain('/talks/decks/x/cover/assets/relativa.png');
  });

  it('ignora enlaces <a> fuera de los prefijos, orígenes ajenos, data: y rutas fuera de los prefijos', () => {
    expect(urls).not.toContain('/otro-sitio/pagina/');
    expect(urls.join(' ')).not.toContain('fonts.example.com');
    expect(urls.join(' ')).not.toContain('data:');
    expect(urls).not.toContain('/fuera/de/prefijos.png');
  });

  it('una ruta absoluta bajo los prefijos se sigue aunque esté en un <a> (acotado a /talks/, /design-system/ y /analytics/)', () => {
    const found = extractUrls('<a href="/talks/decks/x/otra/">otra</a>', base, 'html').map((u) => new URL(u).pathname);
    expect(found).toEqual(['/talks/decks/x/otra/']);
  });

  it('quita query y hash y no repite', () => {
    const all = extractUrls(html, base, 'html');
    expect(all.every((u) => !u.includes('?') && !u.includes('#'))).toBe(true);
    expect(new Set(all).size).toBe(all.length);
  });
});

describe('extractUrls · css y js', () => {
  it('css: url() y @import, resueltos contra la hoja', () => {
    const css = `@import url("/design-system/tokens.css"); @import "extra.css";
      @font-face { src: url(fonts/A.otf) format("opentype"), url('fonts/B.otf'); }
      .x { background: url(data:image/png;base64,AAA); } .y { background: url(#frag); }`;
    const urls = extractUrls(css, page('/talks/styles/base.css'), 'css').map((u) => new URL(u).pathname);
    expect(urls.sort()).toEqual(['/design-system/tokens.css', '/talks/styles/extra.css', '/talks/styles/fonts/A.otf', '/talks/styles/fonts/B.otf']);
  });

  it('js: imports estáticos, re-exports e imports dinámicos', () => {
    const js = `import { a } from "./remote-client.mjs";
      import * as b from './slide-url.mjs';
      import "./side-effect.mjs";
      export { c } from "./c.mjs";
      const d = await import('./dyn.mjs');
      import x from "https://cdn.example.com/x.js";`;
    const urls = extractUrls(js, page('/talks/assets/deck.js'), 'js').map((u) => new URL(u).pathname);
    expect(urls.sort()).toEqual(['/talks/assets/c.mjs', '/talks/assets/dyn.mjs', '/talks/assets/remote-client.mjs', '/talks/assets/side-effect.mjs', '/talks/assets/slide-url.mjs']);
  });

  it('un texto sin referencias no devuelve nada', () => {
    expect(extractUrls('', page('/talks/a/'), 'html')).toEqual([]);
    expect(extractUrls('const x = 1;', page('/talks/a.js'), 'js')).toEqual([]);
  });
});

// ─── rastreo ────────────────────────────────────────────────────────────────

function deckSite() {
  return fakeSite(ORIGIN, {
    '/talks/decks/x/deck/': { body: `<link rel="stylesheet" href="/talks/styles/base.css"><script>var s="/talks/assets/deck.js"; var m=["/talks/decks/x/cover/","/talks/decks/x/dos/"];</script>` },
    '/talks/decks/x/cover/': { body: `<link rel="stylesheet" href="/talks/styles/base.css"><img src="/talks/decks/x/assets/a.png">` },
    '/talks/decks/x/dos/': { body: `<link rel="stylesheet" href="/talks/styles/base.css"><img src="/talks/decks/x/assets/a.png">` },
    '/talks/styles/base.css': { type: 'text/css', body: `@font-face{src:url(fonts/A.otf)} @import "/design-system/tokens.css";` },
    '/design-system/tokens.css': { type: 'text/css', body: `:root{--a:1}` },
    '/talks/styles/fonts/A.otf': { type: 'font/otf', body: 'font-bytes' },
    '/talks/decks/x/assets/a.png': { type: 'image/png', body: 'png-bytes' },
    '/talks/assets/deck.js': { type: 'text/javascript', body: `import { r } from "./remote-client.mjs";` },
    '/talks/assets/remote-client.mjs': { type: 'text/javascript', body: `export const r = 1;` },
    [OFFLINE_PATH]: { body: `<h1>Sin conexión</h1><link rel="stylesheet" href="/talks/styles/base.css">` },
  });
}

describe('warm', () => {
  it('rastrea páginas, estilos, fuentes, scripts e imágenes sin repetir nada', async () => {
    const site = deckSite();
    const cache = await fakeCaches().open('c');
    const result = await warm({ cache, fetchFn: site.fetch, seeds: [page('/talks/decks/x/deck/?remote=1')], base: ORIGIN });
    const cached = (await cache.keys()).map((u) => new URL(u).pathname).sort();
    expect(cached).toEqual([
      '/design-system/tokens.css', '/talks/assets/deck.js', '/talks/assets/remote-client.mjs', '/talks/decks/x/assets/a.png',
      '/talks/decks/x/cover/', '/talks/decks/x/deck/', '/talks/decks/x/dos/', '/talks/styles/base.css', '/talks/styles/fonts/A.otf',
    ]);
    expect(result).toMatchObject({ done: 9, total: 9, failed: 0 });
    expect(new Set(site.urls).size).toBe(site.urls.length);   // cada URL, una sola vez
  });

  it('una segunda pasada no toca la red', async () => {
    const site = deckSite();
    const cache = await fakeCaches().open('c');
    await warm({ cache, fetchFn: site.fetch, seeds: [page('/talks/decks/x/deck/')], base: ORIGIN });
    site.reset();
    const again = await warm({ cache, fetchFn: site.fetch, seeds: [page('/talks/decks/x/deck/')], base: ORIGIN });
    expect(site.calls).toEqual([]);
    expect(again).toMatchObject({ done: 9, total: 9, failed: 0 });
  });

  it('descarga solo lo que falta', async () => {
    const site = deckSite();
    const cache = await fakeCaches().open('c');
    await warm({ cache, fetchFn: site.fetch, seeds: [page('/talks/decks/x/cover/')], base: ORIGIN });
    site.reset();
    await warm({ cache, fetchFn: site.fetch, seeds: [page('/talks/decks/x/deck/')], base: ORIGIN });
    expect(site.urls).not.toContain('/talks/decks/x/cover/');
    expect(site.urls).not.toContain('/talks/styles/base.css');
    expect(site.urls).toContain('/talks/decks/x/deck/');
  });

  it('el progreso nunca retrocede en "done" y termina con done == total', async () => {
    const site = deckSite();
    const cache = await fakeCaches().open('c');
    const seen = [];
    await warm({ cache, fetchFn: site.fetch, seeds: [page('/talks/decks/x/deck/')], base: ORIGIN, onProgress: (p) => seen.push(p), concurrency: 2 });
    for (let i = 1; i < seen.length; i++) expect(seen[i].done).toBeGreaterThanOrEqual(seen[i - 1].done);
    expect(seen.at(-1).done).toBe(seen.at(-1).total);
  });

  it('un error de red o un 5xx cuenta como fallo; un 404 se ignora', async () => {
    const site = deckSite();
    site.pages['/talks/decks/x/dos/'] = { body: 'boom', status: 503 };
    site.pages['/talks/decks/x/cover/'] = { body: `<img src="/talks/decks/x/assets/missing.png">` };   // 404
    const cache = await fakeCaches().open('c');
    const result = await warm({ cache, fetchFn: site.fetch, seeds: [page('/talks/decks/x/deck/')], base: ORIGIN });
    expect(result.failed).toBe(1);
    expect(result.failedUrls.map((u) => new URL(u).pathname)).toEqual(['/talks/decks/x/dos/']);

    const offline = deckSite();
    offline.down = true;
    const cache2 = await fakeCaches().open('c2');
    const r2 = await warm({ cache: cache2, fetchFn: offline.fetch, seeds: [page('/talks/decks/x/deck/')], base: ORIGIN });
    expect(r2).toMatchObject({ failed: 1, total: 1 });
  });

  it('recuerda los 404: la segunda pasada no los pide y, sin red, no cuentan como fallo', async () => {
    const site = deckSite();
    site.pages['/talks/decks/x/cover/'] = { body: `<img src="/talks/decks/x/assets/missing.png"><script>/* ver /talks/no/existe/ */</script>` };
    const cache = await fakeCaches().open('c');
    const first = await warm({ cache, fetchFn: site.fetch, seeds: [page('/talks/decks/x/deck/')], base: ORIGIN });
    expect(first.failed).toBe(0);
    const marker = await cache.match(page('/talks/decks/x/assets/missing.png'));
    expect(marker.status).toBe(404);
    expect(marker.headers.get(MISSING_HEADER)).toBe('1');

    site.reset();
    site.down = true;
    const offline = await warm({ cache, fetchFn: site.fetch, seeds: [page('/talks/decks/x/deck/')], base: ORIGIN });
    expect(site.calls).toEqual([]);
    expect(offline.failed).toBe(0);
  });

  it('no guarda respuestas redirigidas ni 404 como contenido', async () => {
    const site = deckSite();
    site.pages['/talks/decks/x/dos/'] = { body: 'ok pero redirigida', redirected: true };
    const cache = await fakeCaches().open('c');
    await warm({ cache, fetchFn: site.fetch, seeds: [page('/talks/decks/x/deck/')], base: ORIGIN });
    const keys = (await cache.keys()).map((u) => new URL(u).pathname);
    expect(keys).not.toContain('/talks/decks/x/dos/');
    expect(keys).toContain('/talks/decks/x/cover/');
  });

  it('respeta el límite de URLs y descarta semillas ajenas o inválidas', async () => {
    const site = deckSite();
    const cache = await fakeCaches().open('c');
    const r = await warm({ cache, fetchFn: site.fetch, seeds: ['https://otro.test/talks/x/', '::no-url::', '/api/remote', page('/talks/decks/x/deck/')], base: ORIGIN, limit: 3 });
    expect(r.total).toBe(3);
    expect(site.urls.every((p) => isHandled(p))).toBe(true);
  });
});

// ─── respuestas ─────────────────────────────────────────────────────────────

describe('respond', () => {
  const nav = (url) => navRequest(url);
  async function setup() {
    const site = deckSite();
    const cache = await fakeCaches().open('c');
    await warm({ cache, fetchFn: site.fetch, seeds: [page(OFFLINE_PATH), page('/talks/decks/x/deck/')], base: ORIGIN });
    site.reset();
    return { site, cache };
  }

  it('sirve de la caché sin tocar la red, ignorando la query', async () => {
    const { site, cache } = await setup();
    const res = await respond(new Request(page('/talks/decks/x/cover/?present=1&embedded=1&reveal=full')), { cache, fetchFn: site.fetch });
    expect(await res.text()).toContain('a.png');
    expect(site.calls).toEqual([]);
  });

  it('sirve de la caché aunque la red esté caída', async () => {
    const { site, cache } = await setup();
    site.down = true;
    const res = await respond(nav(page('/talks/decks/x/dos/')), { cache, fetchFn: site.fetch });
    expect(res.status).toBe(200);
    expect(res.headers.get('X-Offline-Fallback')).toBeNull();
  });

  it('si falta, va a la red y lo guarda para la próxima', async () => {
    const { site, cache } = await setup();
    site.pages['/talks/nueva/'] = { body: '<h1>nueva</h1>' };
    const first = await respond(nav(page('/talks/nueva/')), { cache, fetchFn: site.fetch });
    expect(await first.text()).toBe('<h1>nueva</h1>');
    site.down = true;
    const second = await respond(nav(page('/talks/nueva/')), { cache, fetchFn: site.fetch });
    expect(await second.text()).toBe('<h1>nueva</h1>');
  });

  it('sin red y sin caché, una navegación recibe la página de respaldo', async () => {
    const { site, cache } = await setup();
    site.down = true;
    const res = await respond(nav(page('/talks/decks/x/inexistente/')), { cache, fetchFn: site.fetch });
    expect(res.status).toBe(200);
    expect(res.headers.get('X-Offline-Fallback')).toBe('1');
    expect(await res.text()).toContain('Sin conexión');
  });

  it('un iframe también recibe la página de respaldo; un subrecurso, un error de red', async () => {
    const { site, cache } = await setup();
    site.down = true;
    const iframe = { url: page('/talks/decks/x/otra/'), method: 'GET', mode: 'same-origin', destination: 'iframe', headers: new Headers() };
    expect((await respond(iframe, { cache, fetchFn: site.fetch })).headers.get('X-Offline-Fallback')).toBe('1');
    const img = new Request(page('/talks/decks/x/assets/nueva.png'));
    expect((await respond(img, { cache, fetchFn: site.fetch })).type).toBe('error');
  });

  it('sin la página de respaldo cacheada devuelve un 503 de texto', async () => {
    const site = deckSite();
    site.down = true;
    const cache = await fakeCaches().open('vacia');
    const res = await respond(nav(page('/talks/x/')), { cache, fetchFn: site.fetch });
    expect(res.status).toBe(503);
  });

  it('no guarda respuestas de error', async () => {
    const { site, cache } = await setup();
    const res = await respond(new Request(page('/talks/no-existe/')), { cache, fetchFn: site.fetch });
    expect(res.status).toBe(404);
    expect((await cache.keys()).map((u) => new URL(u).pathname)).not.toContain('/talks/no-existe/');
  });

  it('un 404 recordado se sirve como 404, incluso sin red (no se confunde con «sin conexión»)', async () => {
    const { site, cache } = await setup();
    await cache.put(page('/talks/decks/x/roto/'), new Response(null, { status: 404, headers: { [MISSING_HEADER]: '1' } }));
    site.down = true;
    const res = await respond(nav(page('/talks/decks/x/roto/')), { cache, fetchFn: site.fetch });
    expect(res.status).toBe(404);
    expect(res.headers.get('X-Offline-Fallback')).toBeNull();
  });
});

describe('shouldIntercept', () => {
  const req = (url, init) => new Request(url, init);
  it('solo GET, mismo origen, prefijos gestionados y sin rango', () => {
    expect(shouldIntercept(req(page('/talks/a/')), ORIGIN)).toBe(true);
    expect(shouldIntercept(req(page('/talks/a/'), { method: 'POST' }), ORIGIN)).toBe(false);
    expect(shouldIntercept(req('https://otro.test/talks/a/'), ORIGIN)).toBe(false);
    expect(shouldIntercept(req(page('/api/remote?room=X')), ORIGIN)).toBe(false);
    expect(shouldIntercept(req(page('/talks/a.mp4'), { headers: { Range: 'bytes=0-10' } }), ORIGIN)).toBe(false);
  });
});

// ─── el worker completo ─────────────────────────────────────────────────────

describe('installOfflineWorker', () => {
  function boot(site = deckSite(), caches = fakeCaches()) {
    const env = fakeWorkerScope({ origin: ORIGIN, site, caches });
    installOfflineWorker(env.scope, { buildId: 'b1' });
    return { site, ...env };
  }

  it('install: guarda la página sin conexión (y sus estilos) y toma el control enseguida', async () => {
    const { dispatchExtendable, caches, scope } = boot();
    await dispatchExtendable('install');
    const cache = await caches.open(cacheName('b1'));
    const keys = (await cache.keys()).map((u) => new URL(u).pathname);
    expect(keys).toEqual(expect.arrayContaining([OFFLINE_PATH, '/talks/styles/base.css', '/talks/styles/fonts/A.otf']));
    expect(scope.skipWaitingCalled).toBe(true);
  });

  it('install falla si no se puede guardar la página sin conexión', async () => {
    const site = deckSite();
    site.down = true;
    const { dispatchExtendable, scope } = boot(site);
    await expect(dispatchExtendable('install')).rejects.toThrow(/sin conexión/);
    expect(scope.skipWaitingCalled).toBe(false);
  });

  it('activate: reclama las pestañas pero NO borra todavía las cachés de builds anteriores', async () => {
    const caches = fakeCaches();
    await caches.open(cacheName('viejo'));
    await caches.open(cacheName('b1'));
    await caches.open('otra-app-cache');
    const { dispatchExtendable, scope } = boot(deckSite(), caches);
    await dispatchExtendable('activate');
    expect((await caches.keys()).sort()).toEqual([cacheName('b1'), cacheName('viejo'), 'otra-app-cache'].sort());
    expect(scope.claimCalled).toBe(true);
  });

  it('tras un precalentado completo se borran las cachés de builds anteriores (y solo esas)', async () => {
    const caches = fakeCaches();
    await caches.open(cacheName('viejo'));
    await caches.open(cacheName('muy-viejo'));
    await caches.open('otra-app-cache');
    const { dispatchExtendable } = boot(deckSite(), caches);
    await dispatchExtendable('message', { data: { type: 'warm', urls: [page('/talks/decks/x/deck/')] } });
    expect((await caches.keys()).sort()).toEqual([cacheName('b1'), 'otra-app-cache'].sort());
  });

  it('con un precalentado incompleto las cachés anteriores se conservan', async () => {
    const caches = fakeCaches();
    await caches.open(cacheName('viejo'));
    const site = deckSite();
    site.pages['/talks/decks/x/dos/'] = { body: 'boom', status: 503 };
    const { dispatchExtendable } = boot(site, caches);
    await dispatchExtendable('message', { data: { type: 'warm', urls: [page('/talks/decks/x/deck/')] } });
    expect(await caches.keys()).toContain(cacheName('viejo'));
  });

  it('build nuevo con la red caída: sirve la página del build anterior en vez de «Sin conexión»', async () => {
    const caches = fakeCaches();
    const old = await caches.open(cacheName('viejo'));
    await old.put(page('/talks/decks/x/cover/'), new Response('<h1>portada vieja</h1>', { headers: { 'Content-Type': 'text/html' } }));
    const site = deckSite();
    const { dispatchExtendable, dispatchFetch } = boot(site, caches);
    await dispatchExtendable('install');           // el build nuevo solo tiene la página sin conexión
    site.down = true;
    const { response } = await dispatchFetch(navRequest(page('/talks/decks/x/cover/?reveal=1')));
    expect(await response.text()).toBe('<h1>portada vieja</h1>');
    expect(response.headers.get('X-Offline-Fallback')).toBeNull();
    // y lo que no está en ningún build sí cae a la página de respaldo
    const missing = await dispatchFetch(navRequest(page('/talks/decks/x/inexistente/')));
    expect(missing.response.headers.get('X-Offline-Fallback')).toBe('1');
  });

  it('con red, un build nuevo pide a la red (no usa el build anterior)', async () => {
    const caches = fakeCaches();
    const old = await caches.open(cacheName('viejo'));
    await old.put(page('/talks/decks/x/cover/'), new Response('<h1>portada vieja</h1>'));
    const site = deckSite();
    const { dispatchExtendable, dispatchFetch } = boot(site, caches);
    await dispatchExtendable('install');
    const { response } = await dispatchFetch(navRequest(page('/talks/decks/x/cover/')));
    expect(await response.text()).toContain('a.png');   // contenido del sitio actual
  });

  it('fetch: responde desde la caché, sin red, a las rutas gestionadas', async () => {
    const { dispatchExtendable, dispatchFetch, site } = boot();
    await dispatchExtendable('message', { data: { type: 'warm', urls: [page('/talks/decks/x/deck/')] } });
    site.reset();
    site.down = true;
    const { handled, response } = await dispatchFetch(navRequest(page('/talks/decks/x/cover/?reveal=1')));
    expect(handled).toBe(true);
    expect(await response.text()).toContain('a.png');
  });

  it('fetch: no toca /api/, otros orígenes ni peticiones no GET', async () => {
    const { dispatchFetch } = boot();
    for (const r of [new Request(page('/api/remote?room=A')), new Request('https://otro.test/talks/a/'), new Request(page('/talks/a/'), { method: 'POST' })]) {
      expect((await dispatchFetch(r)).handled, r.url).toBe(false);
    }
  });

  it('fetch: una petición con la cabecera de sondeo va siempre a la red y falla sin red', async () => {
    const { dispatchExtendable, dispatchFetch, site } = boot();
    await dispatchExtendable('message', { data: { type: 'warm', urls: [page('/talks/decks/x/cover/')] } });
    site.reset();
    const probe = () => new Request(page('/talks/decks/x/cover/'), { headers: { [PROBE_HEADER]: '1' } });
    const online = await dispatchFetch(probe());
    expect(online.handled).toBe(true);
    expect(site.urls).toEqual(['/talks/decks/x/cover/']);   // fue a la red aunque estaba en caché
    site.down = true;
    await expect(dispatchFetch(probe())).rejects.toThrow();
  });

  it('message warm: avisa del progreso y del final a las pestañas', async () => {
    const { dispatchExtendable, posted } = boot();
    await dispatchExtendable('message', { data: { type: 'warm', urls: [page('/talks/decks/x/deck/')] } });
    const done = posted.filter((m) => m.type === 'warm-done');
    expect(done).toHaveLength(1);
    expect(done[0]).toMatchObject({ done: 9, total: 9, failed: 0 });
    expect(posted.some((m) => m.type === 'warm-progress')).toBe(true);
  });

  it('message warm sin red: el aviso final trae los fallos', async () => {
    const site = deckSite();
    const { dispatchExtendable, posted } = boot(site);
    site.down = true;
    await dispatchExtendable('message', { data: { type: 'warm', urls: [page('/talks/decks/x/deck/')] } });
    expect(posted.find((m) => m.type === 'warm-done')).toMatchObject({ failed: 1 });
  });

  it('message clear: vacía las cachés propias, confirma por el puerto y deja de interceptar', async () => {
    const caches = fakeCaches();
    await caches.open('otra-app-cache');
    const { dispatchExtendable, dispatchFetch, site } = boot(deckSite(), caches);
    await dispatchExtendable('message', { data: { type: 'warm', urls: [page('/talks/decks/x/deck/')] } });
    expect((await caches.keys()).some((n) => n.startsWith(CACHE_PREFIX))).toBe(true);

    const replies = [];
    await dispatchExtendable('message', { data: { type: 'clear' }, ports: [{ postMessage: (m) => replies.push(m) }] });
    expect(await caches.keys()).toEqual(['otra-app-cache']);
    expect(replies).toEqual(['cleared']);

    site.reset();
    const after = await dispatchFetch(new Request(page('/talks/decks/x/cover/')));
    expect(after.handled).toBe(false);   // modo transparente: el navegador va a la red y no se vuelve a guardar nada
    expect(await caches.keys()).toEqual(['otra-app-cache']);
  });

  it('message clear sin puerto de respuesta no falla', async () => {
    const { dispatchExtendable } = boot();
    await expect(dispatchExtendable('message', { data: { type: 'clear' } })).resolves.toBeUndefined();
  });

  it('ignora mensajes que no entiende', async () => {
    const { dispatchExtendable, posted } = boot();
    await dispatchExtendable('message', { data: { type: 'otra-cosa' } });
    await dispatchExtendable('message', { data: null });
    await dispatchExtendable('message', { data: { type: 'warm', urls: 'no-array' } });
    expect(posted).toEqual([]);
  });

  it('dos warm seguidos se serializan: la segunda pasada no vuelve a descargar', async () => {
    const { dispatchExtendable, site } = boot();
    const msg = { data: { type: 'warm', urls: [page('/talks/decks/x/deck/')] } };
    await Promise.all([dispatchExtendable('message', msg), dispatchExtendable('message', msg)]);
    expect(new Set(site.urls).size).toBe(site.urls.length);
  });
});
