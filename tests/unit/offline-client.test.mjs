import { describe, it, expect } from 'vitest';
import { offlineEnabled, describeStatus, renderOfflineStatus, startOffline } from '../../theme/assets/offline.mjs';
import { CACHE_PREFIX } from '../../theme/assets/offline-sw.mjs';

const loc = (href) => { const u = new URL(href); return { href: u.href, search: u.search, hostname: u.hostname }; };

describe('offlineEnabled', () => {
  it('se activa en producción y se desactiva en local', () => {
    expect(offlineEnabled(loc('https://talks.chimi.pro/talks/decks/x/deck/'))).toBe(true);
    expect(offlineEnabled(loc('https://preview-abc.vercel.app/talks/decks/x/deck/'))).toBe(true);
    for (const h of ['http://localhost:8080/', 'http://127.0.0.1:8080/', 'http://[::1]:8080/', 'http://talks.localhost:8080/']) {
      expect(offlineEnabled(loc(h)), h).toBe(false);
    }
  });

  it('?offline=1 lo fuerza en local y ?offline=0 lo apaga en producción', () => {
    expect(offlineEnabled(loc('http://localhost:8080/x/?offline=1'))).toBe(true);
    expect(offlineEnabled(loc('https://talks.chimi.pro/x/?offline=0'))).toBe(false);
    expect(offlineEnabled(loc('https://talks.chimi.pro/x/?offline=maybe'))).toBe(true);
  });
});

describe('describeStatus / renderOfflineStatus', () => {
  it('un texto y un nivel por estado', () => {
    expect(describeStatus({ state: 'registering' })).toEqual({ text: 'offline …', level: 'busy' });
    expect(describeStatus({ state: 'warming', pct: 37 })).toEqual({ text: 'offline 37%', level: 'busy' });
    expect(describeStatus({ state: 'ready' })).toEqual({ text: 'offline ✓', level: 'ok' });
    expect(describeStatus({ state: 'partial', failed: 3 })).toEqual({ text: 'offline ✗ 3', level: 'bad' });
    expect(describeStatus({ state: 'updated' })).toEqual({ text: 'offline ↻ recarga', level: 'warn' });
    expect(describeStatus({ state: 'unsupported' }).level).toBe('bad');
    expect(describeStatus({ state: 'error' }).level).toBe('bad');
    expect(describeStatus({ state: 'off' })).toEqual({ text: '', level: 'off' });
  });

  it('pinta el texto, el nivel y oculta el elemento si no hay nada que decir', () => {
    const el = { dataset: {}, textContent: '', hidden: true };
    renderOfflineStatus(el, { state: 'ready' });
    expect(el).toMatchObject({ textContent: 'offline ✓', hidden: false, dataset: { state: 'ok' } });
    renderOfflineStatus(el, { state: 'off' });
    expect(el.hidden).toBe(true);
    expect(() => renderOfflineStatus(null, { state: 'ready' })).not.toThrow();
  });
});

// ─── startOffline con un navigator falso ────────────────────────────────────

function fakeEnv({ hasController = false, regs = [], registerFails = false, cacheNames = [] } = {}) {
  const listeners = {};
  const winListeners = {};
  const posted = [];
  const worker = { postMessage: (m) => posted.push(m) };
  const registered = [];
  const sw = {
    controller: hasController ? worker : null,   // el controlador es el worker que registra lo que se le envía
    ready: Promise.resolve({ active: worker }),
    register: async (url, opts) => { registered.push([url, opts]); if (registerFails) throw new Error('boom'); return {}; },
    getRegistrations: async () => regs,
    addEventListener: (t, f) => { (listeners[t] ||= []).push(f); },
  };
  const deleted = [];
  const caches = { keys: async () => cacheNames, delete: async (n) => { deleted.push(n); return true; } };
  return {
    nav: { serviceWorker: sw }, sw, worker, posted, registered, deleted, caches,
    win: { isSecureContext: true, addEventListener: (t, f) => { (winListeners[t] ||= []).push(f); } },
    fromWorker: (data) => (listeners.message || []).forEach((f) => f({ data })),
    controllerChange: () => (listeners.controllerchange || []).forEach((f) => f()),
    goOnline: () => (winListeners.online || []).forEach((f) => f()),
  };
}
const PROD = loc('https://talks.chimi.pro/talks/decks/x/deck/?remote=1');
const URLS = ['/talks/decks/x/deck/', '/talks/decks/x/speaker/', '/talks/decks/x/cover/'];

async function run(env, extra = {}) {
  const statuses = [];
  const api = await startOffline({ urls: URLS, onStatus: (s) => statuses.push(s), nav: env.nav, loc: PROD, win: env.win, cacheStorage: env.caches, ...extra });
  return { statuses, api };
}

describe('startOffline', () => {
  it('registra el worker como módulo con scope raíz y le pide guardar las páginas (URLs absolutas)', async () => {
    const env = fakeEnv();
    await run(env);
    expect(env.registered).toEqual([['/sw.js', { type: 'module', scope: '/' }]]);
    expect(env.posted).toEqual([{ type: 'warm', urls: URLS.map((u) => `https://talks.chimi.pro${u}`) }]);
  });

  it('empieza en "registering" y sigue el progreso hasta "ready"', async () => {
    const env = fakeEnv();
    const { statuses } = await run(env);
    expect(statuses[0]).toEqual({ state: 'registering' });
    env.fromWorker({ type: 'warm-progress', done: 10, total: 40, failed: 0 });
    env.fromWorker({ type: 'warm-progress', done: 40, total: 40, failed: 0 });
    env.fromWorker({ type: 'warm-done', done: 40, total: 40, failed: 0 });
    expect(statuses.slice(1).map((s) => [s.state, s.pct])).toEqual([['warming', 25], ['warming', 99], ['ready', undefined]]);
    expect(statuses.at(-1)).toMatchObject({ state: 'ready', total: 40 });
  });

  it('el porcentaje no retrocede aunque el total crezca al descubrir ficheros', async () => {
    const env = fakeEnv();
    const { statuses } = await run(env);
    env.fromWorker({ type: 'warm-progress', done: 8, total: 10, failed: 0 });    // 80 %
    env.fromWorker({ type: 'warm-progress', done: 9, total: 60, failed: 0 });    // 15 % real
    const pcts = statuses.filter((s) => s.state === 'warming').map((s) => s.pct);
    expect(pcts).toEqual([80, 80]);
  });

  it('con fallos termina en "partial" y reintenta al volver la red', async () => {
    const env = fakeEnv();
    const { statuses } = await run(env);
    env.posted.length = 0;
    env.fromWorker({ type: 'warm-done', done: 40, total: 40, failed: 3 });
    expect(statuses.at(-1)).toMatchObject({ state: 'partial', failed: 3 });
    env.goOnline();
    expect(env.posted).toHaveLength(1);
    expect(env.posted[0].type).toBe('warm');
  });

  it('volver la red no hace nada si ya estaba todo guardado', async () => {
    const env = fakeEnv();
    await run(env);
    env.posted.length = 0;
    env.fromWorker({ type: 'warm-done', done: 40, total: 40, failed: 0 });
    env.goOnline();
    expect(env.posted).toEqual([]);
  });

  it('un cambio de controlador es "updated" solo si ya había uno (versión nueva); la primera instalación no', async () => {
    const first = fakeEnv({ hasController: false });
    const a = await run(first);
    first.controllerChange();
    expect(a.statuses.some((s) => s.state === 'updated')).toBe(false);

    const second = fakeEnv({ hasController: true });
    const b = await run(second);
    second.controllerChange();
    expect(b.statuses.at(-1)).toEqual({ state: 'updated' });
  });

  it('en una primera visita solo el primer cambio de controlador es la instalación: el siguiente es una versión nueva', async () => {
    const env = fakeEnv({ hasController: false });
    const { statuses } = await run(env);
    env.sw.controller = env.worker;      // el worker recién instalado toma el control
    env.controllerChange();
    expect(statuses.some((s) => s.state === 'updated')).toBe(false);
    env.controllerChange();              // se publica una versión nueva y toma el control otro worker
    expect(statuses.at(-1)).toEqual({ state: 'updated' });
  });

  it('con una versión nueva se vuelve a guardar en segundo plano y, terminado, sigue pidiendo recargar', async () => {
    const env = fakeEnv({ hasController: true });
    const { statuses } = await run(env);
    env.posted.length = 0;
    env.controllerChange();
    expect(env.posted.map((m) => m.type)).toEqual(['warm']);

    env.fromWorker({ type: 'warm-done', done: 50, total: 50, failed: 0 });
    expect(statuses.at(-1)).toMatchObject({ state: 'updated' });   // no vuelve a «ready»: la página es de la versión anterior

    env.fromWorker({ type: 'warm-done', done: 50, total: 50, failed: 2 });
    expect(statuses.at(-1)).toMatchObject({ state: 'partial', failed: 2 });   // un fallo real pesa más que el aviso
  });

  it('si el registro falla, estado "error" y sin lanzar', async () => {
    const env = fakeEnv({ registerFails: true });
    const { statuses } = await run(env);
    expect(statuses.at(-1)).toEqual({ state: 'error' });
    expect(env.posted).toEqual([]);
  });

  it('sin Service Worker o sin contexto seguro: "unsupported"', async () => {
    const statuses = [];
    await startOffline({ urls: URLS, onStatus: (s) => statuses.push(s), nav: {}, loc: PROD, win: { isSecureContext: true }, cacheStorage: undefined });
    expect(statuses).toEqual([{ state: 'unsupported' }]);

    const env = fakeEnv();
    const s2 = [];
    await startOffline({ urls: URLS, onStatus: (s) => s2.push(s), nav: env.nav, loc: PROD, win: { isSecureContext: false, addEventListener() {} }, cacheStorage: env.caches });
    expect(s2).toEqual([{ state: 'unsupported' }]);
    expect(env.registered).toEqual([]);
  });

  it('en local (o con ?offline=0) no registra nada: pide al worker vaciarse, lo desregistra y borra solo sus cachés', async () => {
    const events = [];
    const answering = (scriptURL) => ({
      scriptURL,
      postMessage(msg, ports) { events.push(`clear:${msg.type}`); ports[0].postMessage('cleared'); },
    });
    const mine = { active: answering('http://localhost:8080/sw.js'), unregister: async () => { events.push('unregister:mine'); } };
    const other = { active: answering('http://localhost:8080/otro.js'), unregister: async () => { events.push('unregister:other'); } };
    const env = fakeEnv({ regs: [mine, other], cacheNames: [`${CACHE_PREFIX}abc`, 'cache-ajena', `${CACHE_PREFIX}def`] });
    const statuses = [];
    await startOffline({ urls: URLS, onStatus: (s) => statuses.push(s), nav: env.nav, loc: loc('http://localhost:8080/talks/decks/x/deck/'), win: env.win, cacheStorage: env.caches });
    expect(statuses).toEqual([{ state: 'off' }]);
    expect(env.registered).toEqual([]);
    expect(events).toEqual(['clear:clear', 'unregister:mine']);   // primero se le avisa, luego se desregistra
    expect(env.deleted).toEqual([`${CACHE_PREFIX}abc`, `${CACHE_PREFIX}def`]);
  });

  it('si el worker no contesta, la limpieza sigue tras un tiempo de espera', async () => {
    const silent = { scriptURL: 'http://localhost:8080/sw.js', postMessage() { /* nunca responde */ } };
    const reg = { active: silent, unregister: async () => { reg.done = true; } };
    const env = fakeEnv({ regs: [reg] });
    const started = Date.now();
    await startOffline({ urls: URLS, onStatus() {}, nav: env.nav, loc: loc('http://localhost:8080/x/?offline=0'), win: env.win, cacheStorage: env.caches });
    expect(reg.done).toBe(true);
    expect(Date.now() - started).toBeGreaterThanOrEqual(1400);
  }, 10_000);

  it('la limpieza tolera un navegador sin Service Worker ni Cache API', async () => {
    const statuses = [];
    await startOffline({ urls: URLS, onStatus: (s) => statuses.push(s), nav: {}, loc: loc('http://localhost:8080/x/'), win: {}, cacheStorage: undefined });
    expect(statuses).toEqual([{ state: 'off' }]);
  });
});
