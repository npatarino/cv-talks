import { describe, it, expect } from 'vitest';
import { createRelay, createSessionStore, createPoller } from '../../theme/assets/remote-client.mjs';
import { indexByOrder, revealFor, embeddedSrc, hudText, pad2 } from '../../theme/assets/slide-url.mjs';

const res = (status, body) => ({ status, ok: status >= 200 && status < 300, json: async () => body });

function memoryStorage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    dump: () => Object.fromEntries(m),
  };
}

describe('createRelay', () => {
  it('post envía JSON y devuelve el cuerpo', async () => {
    const calls = [];
    const relay = createRelay('/api/remote', async (url, init) => { calls.push([url, init]); return res(200, { ok: 1 }); });
    expect(await relay.post({ type: 'create' })).toEqual({ ok: 1 });
    expect(calls[0][0]).toBe('/api/remote');
    expect(calls[0][1].method).toBe('POST');
    expect(JSON.parse(calls[0][1].body)).toEqual({ type: 'create' });
  });

  it('post lanza con status y mensaje del servidor si no es 2xx', async () => {
    const relay = createRelay('/x', async () => res(404, { error: 'bad-code' }));
    await expect(relay.post({})).rejects.toMatchObject({ message: 'bad-code', status: 404 });
    const relay2 = createRelay('/x', async () => ({ status: 500, ok: false, json: async () => { throw new Error('no json'); } }));
    await expect(relay2.post({})).rejects.toMatchObject({ message: 'remote 500', status: 500 });
  });

  it('poll codifica sala/token y no usa caché', async () => {
    let seen;
    const relay = createRelay('/api/remote', async (url, init) => { seen = [url, init]; return res(200, {}); });
    await relay.poll({ room: 'AB CD', token: 't/k' }, 7);
    expect(seen[0]).toBe('/api/remote?room=AB%20CD&token=t%2Fk&v=7');
    expect(seen[1]).toEqual({ cache: 'no-store' });
  });
});

describe('createSessionStore', () => {
  it('carga una sesión guardada con el nombre de token indicado', () => {
    const st = memoryStorage({ k: JSON.stringify({ room: 'R', hostToken: 'T' }) });
    expect(createSessionStore(st, 'k', 'hostToken').get()).toEqual({ room: 'R', token: 'T' });
    expect(createSessionStore(st, 'k', 'token').get()).toBeNull();
  });

  it('ignora datos corruptos o incompletos', () => {
    expect(createSessionStore(memoryStorage({ k: '{nope' }), 'k', 'token').get()).toBeNull();
    expect(createSessionStore(memoryStorage({ k: JSON.stringify({ room: 'R' }) }), 'k', 'token').get()).toBeNull();
    expect(createSessionStore(memoryStorage(), 'k', 'token').get()).toBeNull();
  });

  it('set persiste con el nombre original del campo y clear lo borra', () => {
    const st = memoryStorage();
    const s = createSessionStore(st, 'k', 'hostToken');
    s.set({ room: 'R', token: 'T' });
    expect(JSON.parse(st.dump().k)).toEqual({ room: 'R', hostToken: 'T' });
    expect(s.get()).toEqual({ room: 'R', token: 'T' });
    s.clear();
    expect(st.dump().k).toBeUndefined();
    expect(s.get()).toBeNull();
  });

  it('funciona aunque el storage lance (modo privado)', () => {
    const broken = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() { throw new Error('x'); } };
    const s = createSessionStore(broken, 'k', 'token');
    expect(s.get()).toBeNull();
    s.set({ room: 'R', token: 'T' });
    expect(s.get()).toEqual({ room: 'R', token: 'T' });
    s.clear();
    expect(s.get()).toBeNull();
  });
});

describe('createPoller', () => {
  const fakeRelay = (responses) => {
    const seenV = [];
    return { seenV, poll: async (_s, v) => { seenV.push(v); const r = responses.shift(); if (r instanceof Error) throw r; return r; } };
  };

  it('entrega estados con first=true solo en el primero y pasa la versión vista', async () => {
    let session = { room: 'R', token: 'T' };
    const relay = fakeRelay([res(200, { v: 3, order: 1 }), res(200, { v: 4, order: 2 })]);
    const seen = [];
    await new Promise((done) => {
      const p = createPoller({
        relay, getSession: () => session,
        onState(st, first) { seen.push([st.v, first]); if (seen.length === 2) { session = null; done(); } },
      });
      p.start();
    });
    expect(seen).toEqual([[3, true], [4, false]]);
    expect(relay.seenV).toEqual([-1, 3]);
  });

  it('reintenta tras un fallo de red o un error del servidor avisando con onOffline', async () => {
    let session = { room: 'R', token: 'T' };
    const relay = fakeRelay([new Error('network'), res(500, {}), res(200, { v: 1 })]);
    let offline = 0;
    await new Promise((done) => {
      createPoller({
        relay, getSession: () => session, retryMs: 1,
        onOffline: () => { offline++; },
        onState() { session = null; done(); },
      }).start();
    });
    expect(offline).toBe(2);
  });

  it('con 404/403 reinicia la versión, llama a onLost y sigue con la sesión nueva', async () => {
    let session = { room: 'OLD', token: 'T' };
    const polled = [];
    const relay = {
      poll: async (s, v) => {
        polled.push([s.room, v]);
        if (s.room === 'OLD') return res(404, { error: 'no-room' });
        return res(200, { v: 0 });
      },
    };
    const lost = [];
    await new Promise((done) => {
      createPoller({
        relay, getSession: () => session,
        async onLost(status) { lost.push(status); session = { room: 'NEW', token: 'T2' }; },
        onState(_st, first) { expect(first).toBe(true); session = null; done(); },
      }).start();
    });
    expect(lost).toEqual([404]);
    expect(polled).toEqual([['OLD', -1], ['NEW', -1]]);
  });

  it('termina si onLost deja la sesión vacía y puede arrancar otra vez', async () => {
    let session = { room: 'R', token: 'T' };
    const relay = fakeRelay([res(403, {}), res(200, { v: 1 })]);
    const p = createPoller({ relay, getSession: () => session, onLost: async () => { session = null; }, onState() {} });
    p.start();
    await new Promise((r) => setTimeout(r, 10));
    expect(p.running).toBe(false);
    session = { room: 'R', token: 'T' };
    let got = false;
    const p2 = createPoller({ relay, getSession: () => session, onState() { got = true; session = null; } });
    p2.start();
    await new Promise((r) => setTimeout(r, 10));
    expect(got).toBe(true);
  });

  it('start es idempotente mientras corre', async () => {
    let session = { room: 'R', token: 'T' };
    let polls = 0;
    const relay = { poll: async () => { polls++; await new Promise((r) => setTimeout(r, 5)); session = null; return res(200, { v: 0 }); } };
    const p = createPoller({ relay, getSession: () => session, onState() {} });
    p.start(); p.start(); p.start();
    await new Promise((r) => setTimeout(r, 30));
    expect(polls).toBe(1);
  });

  it('reset hace que el siguiente estado cuente como first', async () => {
    let session = { room: 'R', token: 'T' };
    const relay = fakeRelay([res(200, { v: 5 }), res(200, { v: 6 })]);
    const flags = [];
    let p;
    await new Promise((done) => {
      p = createPoller({
        relay, getSession: () => session,
        onState(_st, first) { flags.push(first); if (flags.length === 1) p.reset(); else { session = null; done(); } },
      });
      p.start();
    });
    expect(flags).toEqual([true, true]);
    expect(relay.seenV).toEqual([-1, -1]);
  });
});

describe('slide-url', () => {
  const slides = [
    { order: 1, url: '/a/', label: 'Uno' },
    { order: 2, url: '/b/', label: 'Dos', revealStart: 0 },
    { order: 12, url: '/c/', label: 'Doce' },
  ];

  it('pad2 e indexByOrder', () => {
    expect(pad2(3)).toBe('03');
    expect(pad2(12)).toBe('12');
    expect(indexByOrder(slides, 12)).toBe(2);
    expect(indexByOrder(slides, 99)).toBe(-1);
  });

  it('revealFor: override > revealStart > "1"', () => {
    expect(revealFor(slides[0])).toBe('1');
    expect(revealFor(slides[1])).toBe('0');
    expect(revealFor(slides[1], 'full')).toBe('full');
  });

  it('embeddedSrc conserva el orden de parámetros', () => {
    expect(embeddedSrc(slides[0], '1')).toBe('/a/?present=1&embedded=1&reveal=1');
  });

  it('hudText usa el order de la última slide como total', () => {
    expect(hudText(slides[0], slides)).toBe('01 / 12 · Uno');
  });
});
