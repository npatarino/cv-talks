// Núcleo del Service Worker de la charla (módulo ES; lo carga /sw.js).
//
// Objetivo: que una charla en producción siga funcionando si el equipo pierde la
// red. El player pide precalentar el deck (mensaje `warm`); el worker rastrea las
// páginas y todo lo que cargan y lo deja en una caché propia de este build.
// Después sirve SIEMPRE desde esa caché y solo va a la red si no tiene el fichero.
//
//   · Un cache por build: `cv-talks-<buildId>`. Las cachés de builds anteriores se
//     borran solo cuando la del build actual está completa (un precalentado sin
//     fallos); hasta entonces quedan como último recurso: con la red caída, una
//     página vieja es mejor que ninguna.
//   · Solo se interceptan /talks/, /design-system/ y /analytics/. Nunca /api/
//     (el mando) ni otros orígenes.
//   · Sin red y sin caché, una navegación recibe la página «Sin conexión»
//     (/talks/offline/) en lugar del error del navegador.
//   · Las peticiones con cabecera X-Offline-Probe van siempre a la red: la página
//     de respaldo las usa para saber cuándo ha vuelto la conexión.
//   · El mensaje `clear` (desactivar el offline) vacía las cachés y deja al worker
//     en modo transparente: mientras siga controlando pestañas ya no sirve ni guarda nada.
//
// Todo el estado entra por parámetros (scope, caches, fetch) para poder probarlo
// con vitest sin un navegador.

export const CACHE_PREFIX = 'cv-talks-';
export const OFFLINE_PATH = '/talks/offline/';
export const PROBE_HEADER = 'x-offline-probe';
// Marca las entradas de caché que recuerdan un 404: así un sitio que no existe (p. ej. una
// ruta mencionada en un comentario) no se vuelve a pedir ni cuenta como fallo sin red.
export const MISSING_HEADER = 'x-cv-missing';
const HANDLED_PREFIXES = ['/talks/', '/design-system/', '/analytics/'];
const MAX_URLS = 3000;

// ─── Funciones puras ────────────────────────────────────────────────────────

/** ¿Es una ruta que el worker gestiona? */
export function isHandled(pathname) {
  return HANDLED_PREFIXES.some((p) => pathname.startsWith(p));
}

/** Clave de caché de una URL: sin query ni hash (las slides se piden con ?present=1&reveal=…). */
export function cacheKey(url, base) {
  const u = new URL(url, base);
  u.search = '';
  u.hash = '';
  return u.href;
}

export const cacheName = (buildId) => `${CACHE_PREFIX}${buildId}`;

/** Tipo de contenido que hay que rastrear: 'html', 'css', 'js' o null (binario). */
export function kindOf(url, contentType = '') {
  const ct = contentType.toLowerCase();
  if (ct.includes('html')) return 'html';
  if (ct.includes('css')) return 'css';
  if (ct.includes('javascript') || ct.includes('ecmascript')) return 'js';
  if (ct.includes('svg')) return 'html';
  if (ct && !ct.includes('octet-stream') && !ct.includes('text/plain')) return null;
  const path = new URL(url).pathname;
  if (path.endsWith('/') || /\.html?$/.test(path)) return 'html';
  if (path.endsWith('.css')) return 'css';
  if (/\.m?js$/.test(path)) return 'js';
  if (path.endsWith('.svg')) return 'html';
  return null;
}

const TAG_ATTRS = {
  link: ['href'],
  script: ['src'],
  img: ['src', 'srcset'],
  source: ['src', 'srcset'],
  video: ['src', 'poster'],
  audio: ['src'],
  iframe: ['src'],
  embed: ['src'],
  use: ['href', 'xlink:href'],
  image: ['href', 'xlink:href'],
};
const ATTR_RE = (name) => new RegExp(`(?:^|\\s)${name.replace(':', '\\:')}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i');
const TAG_RE = /<(link|script|img|source|video|audio|iframe|embed|use|image)\b([^>]*)>/gi;
const CSS_URL_RE = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)\s'"]+))\s*\)/gi;
const CSS_IMPORT_RE = /@import\s+(?:"([^"]+)"|'([^']+)')/gi;
// Rutas absolutas entre comillas hacia nuestros prefijos: cubre lo que un script
// carga dinámicamente (s.src = "/talks/assets/deck.js") y los manifiestos de slides.
const QUOTED_PATH_RE = /["'`](\/(?:talks|design-system|analytics)\/[^"'`\s<>?#)\\]*)/g;
const JS_IMPORT_RES = [
  /(?:import|export)\s[^'"`;]*?\sfrom\s*["']([^"']+)["']/g,
  /import\s*["']([^"']+)["']/g,
  /import\(\s*["']([^"']+)["']\s*\)/g,
];

/**
 * URLs de las que depende un documento, ya resueltas, del mismo origen, bajo los
 * prefijos gestionados y sin query/hash. Heurística por expresiones regulares:
 * suficiente porque el HTML lo genera Eleventy y el JS son nuestros módulos.
 *
 * @param {string} text
 * @param {string} baseUrl - URL del documento (para resolver las relativas)
 * @param {'html'|'css'|'js'} kind
 * @returns {string[]}
 */
export function extractUrls(text, baseUrl, kind) {
  const found = new Set();
  const base = new URL(baseUrl);
  const add = (raw) => {
    if (!raw) return;
    const value = raw.trim();
    if (!value || value.startsWith('#') || /^(data|javascript|blob|mailto|tel):/i.test(value)) return;
    let u;
    try { u = new URL(value, base); } catch { return; }
    if (u.origin !== base.origin || !isHandled(u.pathname)) return;
    u.search = '';
    u.hash = '';
    found.add(u.href);
  };
  const addAll = (re, text, groups = [1, 2, 3]) => {
    for (const m of text.matchAll(re)) for (const g of groups) if (m[g]) { add(m[g]); break; }
  };

  if (kind === 'html') {
    for (const m of text.matchAll(TAG_RE)) {
      const tag = m[1].toLowerCase();
      for (const attr of TAG_ATTRS[tag]) {
        const a = m[2].match(ATTR_RE(attr));
        const value = a && (a[1] ?? a[2]);
        if (!value) continue;
        if (attr === 'srcset') value.split(',').forEach((part) => add(part.trim().split(/\s+/)[0]));
        else add(value);
      }
    }
    addAll(CSS_URL_RE, text);     // style="…url()…" y <style>
    addAll(CSS_IMPORT_RE, text);
  }
  if (kind === 'css') {
    addAll(CSS_URL_RE, text);
    addAll(CSS_IMPORT_RE, text);
  }
  if (kind === 'js') {
    for (const re of JS_IMPORT_RES) addAll(re, text, [1]);
  }
  addAll(QUOTED_PATH_RE, text, [1]);
  return [...found];
}

// ─── Rastreo ────────────────────────────────────────────────────────────────

/**
 * Descarga las semillas y todo lo que cuelga de ellas a la caché. Lo ya cacheado
 * no se vuelve a pedir, pero sí se lee para seguir el grafo.
 *
 * Cuenta como fallo un error de red o un 5xx. Un 4xx no: es un enlace roto del
 * sitio, no un problema de conexión; se recuerda como «no existe» para no
 * volver a pedirlo (y no confundirlo con un fallo cuando se pierde la red).
 *
 * @returns {Promise<{done: number, total: number, failed: number, failedUrls: string[]}>}
 */
export async function warm({ cache, fetchFn, seeds, base, onProgress = () => {}, concurrency = 6, limit = MAX_URLS }) {
  const queue = [];
  const seen = new Set();
  const failedUrls = [];
  let done = 0;
  const enqueue = (url) => {
    const key = cacheKey(url, base);
    if (seen.has(key) || seen.size >= limit) return;
    seen.add(key);
    queue.push(key);
  };
  seeds.forEach((s) => {
    try {
      const u = new URL(s, base);
      if (u.origin === new URL(base).origin && isHandled(u.pathname)) enqueue(u.href);
    } catch { /* semilla inválida: se ignora */ }
  });

  const report = () => onProgress({ done, total: seen.size, failed: failedUrls.length });

  async function process(key) {
    let res = await cache.match(key);
    if (!res) {
      try {
        const net = await fetchFn(key, { cache: 'reload' });
        if (net.ok && net.type !== 'opaque') {
          // Una respuesta redirigida no puede servirse a una navegación: se rastrea pero no se guarda.
          if (!net.redirected) await cache.put(key, net.clone());
          res = net;
        } else if (net.status >= 500) {
          failedUrls.push(key);
        } else if (net.status >= 400) {
          await cache.put(key, new Response(null, { status: 404, headers: { [MISSING_HEADER]: '1' } }));
        }
      } catch {
        failedUrls.push(key);
      }
    }
    done++;
    if (!res || res.headers.get(MISSING_HEADER)) return;
    const kind = kindOf(key, res.headers.get('content-type') || '');
    if (!kind) return;
    const text = await res.clone().text();
    extractUrls(text, key, kind).forEach(enqueue);
  }

  async function worker() {
    while (queue.length) {
      await process(queue.shift());
      report();
    }
  }
  report();
  await Promise.all(Array.from({ length: concurrency }, worker));
  return { done, total: seen.size, failed: failedUrls.length, failedUrls };
}

// ─── Respuestas ─────────────────────────────────────────────────────────────

/** Respuesta sin red para peticiones que no están en caché. */
async function offlineResponse(cache, request) {
  const isPage = request.mode === 'navigate' || request.destination === 'document' || request.destination === 'iframe';
  if (!isPage) return Response.error();
  const page = await cache.match(cacheKey(OFFLINE_PATH, request.url));
  if (!page) return new Response('Sin conexión', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  return new Response(await page.text(), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Offline-Fallback': '1', 'Cache-Control': 'no-store' },
  });
}

/**
 * Cache primero. Si falta, red (y se guarda). Si la red falla: cachés de builds
 * anteriores y, en último término, la página de respaldo.
 *
 * @param {Request} request
 * @param {{cache: Cache, fetchFn: typeof fetch, staleCaches?: () => Promise<Cache[]>}} deps
 */
export async function respond(request, { cache, fetchFn, staleCaches = async () => [] }) {
  const key = cacheKey(request.url);
  const hit = await cache.match(key);
  if (hit) return hit;
  try {
    const net = await fetchFn(request);
    if (net.ok && net.type === 'basic' && net.status === 200 && !net.redirected) await cache.put(key, net.clone());
    return net;
  } catch {
    for (const old of await staleCaches()) {
      const stale = await old.match(key);
      if (stale && !stale.headers.get(MISSING_HEADER)) return stale;
    }
    return offlineResponse(cache, request);
  }
}

/** ¿Debe el worker responder a esta petición? */
export function shouldIntercept(request, origin) {
  if (request.method !== 'GET') return false;
  const url = new URL(request.url);
  if (url.origin !== origin || !isHandled(url.pathname)) return false;
  if (request.headers.has('range')) return false;   // la caché no sabe servir rangos
  return true;
}

// ─── Cableado del worker ────────────────────────────────────────────────────

/**
 * Registra los manejadores en el ámbito del worker.
 *
 * @param {ServiceWorkerGlobalScope} scope
 * @param {{buildId: string}} options
 */
export function installOfflineWorker(scope, { buildId }) {
  const name = cacheName(buildId);
  const origin = scope.location.origin;
  const fetchFn = (...args) => scope.fetch(...args);
  let queue = Promise.resolve();
  let disabled = false;

  async function broadcast(message) {
    const clients = await scope.clients.matchAll({ type: 'window', includeUncontrolled: true });
    clients.forEach((c) => c.postMessage(message));
  }

  const otherNames = async () => (await scope.caches.keys()).filter((n) => n.startsWith(CACHE_PREFIX) && n !== name);
  const staleCaches = async () => Promise.all((await otherNames()).map((n) => scope.caches.open(n)));
  const pruneOthers = async () => Promise.all((await otherNames()).map((n) => scope.caches.delete(n)));

  /** Precalienta las URLs; las peticiones se serializan para no duplicar descargas. */
  function warmUrls(seeds, { quiet = false } = {}) {
    const run = async () => {
      const cache = await scope.caches.open(name);
      let last = 0;
      const result = await warm({
        cache, fetchFn, seeds, base: origin,
        onProgress: (p) => {
          if (quiet || (Date.now() - last < 120 && p.done < p.total)) return;
          last = Date.now();
          broadcast({ type: 'warm-progress', ...p });
        },
      });
      // La caché de este build está completa: ya no hacen falta las de builds anteriores.
      if (!quiet && !result.failed) await pruneOthers();
      if (!quiet) broadcast({ type: 'warm-done', ...result });
      return result;
    };
    queue = queue.then(run, run);
    return queue;
  }

  scope.addEventListener('install', (event) => {
    event.waitUntil((async () => {
      const result = await warmUrls([OFFLINE_PATH], { quiet: true });
      if (result.failed) throw new Error('No se pudo guardar la página sin conexión');
      await scope.skipWaiting();
    })());
  });

  scope.addEventListener('activate', (event) => {
    event.waitUntil(scope.clients.claim());
  });

  scope.addEventListener('fetch', (event) => {
    const request = event.request;
    if (disabled || !shouldIntercept(request, origin)) return;
    if (request.headers.has(PROBE_HEADER)) {
      event.respondWith(fetchFn(request));   // siempre red: se usa para detectar la reconexión
      return;
    }
    event.respondWith((async () => respond(request, { cache: await scope.caches.open(name), fetchFn, staleCaches }))());
  });

  async function clearAll() {
    disabled = true;   // antes de borrar: si no, una petición en vuelo recrearía la caché
    const names = await scope.caches.keys();
    await Promise.all(names.filter((n) => n.startsWith(CACHE_PREFIX)).map((n) => scope.caches.delete(n)));
  }

  scope.addEventListener('message', (event) => {
    const msg = event.data;
    if (!msg) return;
    if (msg.type === 'warm' && Array.isArray(msg.urls)) {
      event.waitUntil(warmUrls(msg.urls));
    } else if (msg.type === 'clear') {
      event.waitUntil(clearAll().then(() => event.ports?.[0]?.postMessage('cleared')));
    }
  });
}
