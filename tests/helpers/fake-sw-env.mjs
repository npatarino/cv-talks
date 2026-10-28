/**
 * Entorno falso para probar el Service Worker sin navegador: una Cache API en
 * memoria, un "sitio" que responde a fetch y un ámbito de worker que registra
 * sus manejadores y permite dispararlos.
 */

function makeCache() {
  const store = new Map();
  const keyOf = (req) => (typeof req === 'string' ? req : req.url);
  return {
    store,
    async match(req) { const r = store.get(keyOf(req)); return r ? r.clone() : undefined; },
    async put(req, res) { store.set(keyOf(req), res); },
    async delete(req) { return store.delete(keyOf(req)); },
    async keys() { return [...store.keys()]; },
  };
}

export function fakeCaches() {
  const stores = new Map();
  return {
    stores,
    async open(name) { if (!stores.has(name)) stores.set(name, makeCache()); return stores.get(name); },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
  };
}

/**
 * Sitio falso. `pages` mapea ruta → { body, type?, status?, redirected? }.
 * `site.down = true` simula la pérdida de red (fetch rechaza).
 */
export function fakeSite(origin, pages) {
  const site = {
    origin, pages, down: false, calls: [],
    async fetch(input) {
      const url = typeof input === 'string' ? input : input.url;
      site.calls.push(url);
      if (site.down) throw new TypeError('Failed to fetch');
      const path = new URL(url).pathname;
      const page = site.pages[path];
      if (!page) return new Response('not found', { status: 404 });
      const res = new Response(page.body, { status: page.status ?? 200, headers: { 'Content-Type': page.type ?? 'text/html; charset=utf-8' } });
      Object.defineProperty(res, 'type', { value: 'basic' });
      if (page.redirected) Object.defineProperty(res, 'redirected', { value: true });
      return res;
    },
    get urls() { return site.calls.map((u) => new URL(u).pathname); },
    reset() { site.calls = []; },
  };
  return site;
}

/** Ámbito de worker falso: registra listeners y devuelve helpers para dispararlos. */
export function fakeWorkerScope({ origin = 'https://talks.test', site, caches = fakeCaches() } = {}) {
  const listeners = {};
  const posted = [];
  const clientList = [{ postMessage: (m) => posted.push(m) }];
  const scope = {
    location: { origin },
    caches,
    fetch: (...a) => site.fetch(...a),
    skipWaitingCalled: false,
    claimCalled: false,
    skipWaiting() { scope.skipWaitingCalled = true; return Promise.resolve(); },
    clients: {
      matchAll: async () => clientList,
      claim: async () => { scope.claimCalled = true; },
    },
    addEventListener(type, fn) { listeners[type] = fn; },
  };
  /** Dispara un evento ExtendableEvent y devuelve la promesa que pasó a waitUntil. */
  async function dispatchExtendable(type, props = {}) {
    let pending = Promise.resolve();
    listeners[type]({ ...props, waitUntil: (p) => { pending = p; } });
    await pending;
  }
  /** Dispara un fetch; devuelve { handled, response }. */
  async function dispatchFetch(request) {
    let responded = null;
    listeners.fetch({ request, respondWith: (p) => { responded = p; } });
    return responded ? { handled: true, response: await responded } : { handled: false, response: null };
  }
  return { scope, posted, dispatchExtendable, dispatchFetch, caches };
}

/**
 * Petición de navegación (o de iframe). `new Request(url, { mode: 'navigate' })`
 * no es construible fuera de un navegador, así que se simula con un objeto igual.
 */
export function navRequest(url, { destination = 'document', headers = {} } = {}) {
  return { url, method: 'GET', mode: 'navigate', destination, headers: new Headers(headers) };
}
