import { describe, it, expect, beforeEach } from 'vitest';
import handler, { memoryRedis, __resetMemory } from '../../api/remote.mjs';

// ─── Harness: req/res mínimos al estilo Vercel ──────────────────────────────

function call(method, { body, query } = {}) {
  const res = {
    statusCode: 200, headers: {}, body: undefined,
    setHeader(k, v) { this.headers[k] = v; },
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
    end() { return this; },
  };
  return handler({ method, body, query }, res).then(() => res);
}
const post = (body) => call('POST', { body });
const get = (query) => call('GET', { query });

beforeEach(() => { __resetMemory(); });

// ─── memoryRedis ────────────────────────────────────────────────────────────

describe('memoryRedis', () => {
  it('HGETALL devuelve plano y vacío si no existe', async () => {
    const r = memoryRedis();
    expect(await r([['HGETALL', 'x']])).toEqual([[]]);
    await r([['HSET', 'x', 'a', 1, 'b', 'two']]);
    expect(await r([['HGETALL', 'x']])).toEqual([['a', '1', 'b', 'two']]);
  });

  it('GETDEL es de un solo uso', async () => {
    const r = memoryRedis();
    await r([['SET', 'c', 'ROOM', 'EX', 10]]);
    expect(await r([['GETDEL', 'c'], ['GETDEL', 'c']])).toEqual(['ROOM', null]);
  });

  it('EXPIRE caduca la clave', async () => {
    const r = memoryRedis();
    await r([['SET', 'k', 'v', 'EX', -1]]);
    expect(await r([['GETDEL', 'k']])).toEqual([null]);
  });
});

// ─── Emparejamiento ─────────────────────────────────────────────────────────

describe('create + claim', () => {
  it('crea salas distintas por cada player', async () => {
    const a = await post({ type: 'create' });
    const b = await post({ type: 'create' });
    expect(a.statusCode).toBe(201);
    expect(a.body.room).toMatch(/^[A-Z2-9]{8}$/);
    expect(a.body.code).toMatch(/^[A-Z2-9]{6}$/);
    expect(a.body.room).not.toBe(b.body.room);
    expect(a.body.hostToken).not.toBe(b.body.hostToken);
  });

  it('el código se canjea una sola vez y da un token de mando', async () => {
    const { body: h } = await post({ type: 'create' });
    const c1 = await post({ type: 'claim', code: h.code.toLowerCase() });
    expect(c1.statusCode).toBe(200);
    expect(c1.body.room).toBe(h.room);
    expect(c1.body.controllerToken).toBeTruthy();
    const c2 = await post({ type: 'claim', code: h.code });
    expect(c2.statusCode).toBe(404);
    expect(c2.body.error).toBe('bad-code');
  });

  it('rechaza códigos inventados o mal formados', async () => {
    expect((await post({ type: 'claim', code: 'ZZZZZZ' })).statusCode).toBe(404);
    expect((await post({ type: 'claim', code: 'AB' })).statusCode).toBe(404);
    expect((await post({ type: 'claim' })).statusCode).toBe(404);
  });

  it('el host puede pedir más códigos; los móviles se acumulan', async () => {
    const { body: h } = await post({ type: 'create' });
    const p = await post({ type: 'pair', room: h.room, token: h.hostToken });
    expect(p.statusCode).toBe(200);
    expect(p.body.code).not.toBe(h.code);
    await post({ type: 'claim', code: h.code });
    await post({ type: 'claim', code: p.body.code });
    const st = await get({ room: h.room, token: h.hostToken, v: -1 });
    expect(st.body.controllers).toBe(2);
  });

  it('solo el host puede pedir códigos', async () => {
    const { body: h } = await post({ type: 'create' });
    const { body: c } = await post({ type: 'claim', code: h.code });
    const p = await post({ type: 'pair', room: h.room, token: c.controllerToken });
    expect(p.statusCode).toBe(400);
  });
});

// ─── Autorización ───────────────────────────────────────────────────────────

describe('auth', () => {
  it('GET sin sala → 404, con token malo → 403', async () => {
    expect((await get({ room: 'NOPE', token: 'x' })).statusCode).toBe(404);
    const { body: h } = await post({ type: 'create' });
    const bad = await get({ room: h.room, token: 'not-the-token', v: -1 });
    expect(bad.statusCode).toBe(403);
    expect(bad.body.error).toBe('bad-token');
  });

  it('un móvil no puede publicar state ni un host navegar', async () => {
    const { body: h } = await post({ type: 'create' });
    const { body: c } = await post({ type: 'claim', code: h.code });
    expect((await post({ type: 'state', room: h.room, token: c.controllerToken, order: 3 })).statusCode).toBe(400);
    expect((await post({ type: 'nav', room: h.room, token: h.hostToken, action: 'next' })).statusCode).toBe(400);
  });

  it('un token de otra sala no vale', async () => {
    const { body: a } = await post({ type: 'create' });
    const { body: b } = await post({ type: 'create' });
    expect((await post({ type: 'state', room: a.room, token: b.hostToken, order: 1 })).statusCode).toBe(403);
  });
});

// ─── Flujo de navegación ────────────────────────────────────────────────────

describe('state + nav + poll', () => {
  it('el player publica dónde está y el móvil lo ve', async () => {
    const { body: h } = await post({ type: 'create' });
    const { body: c } = await post({ type: 'claim', code: h.code });
    await post({ type: 'state', room: h.room, token: h.hostToken, order: 7 });
    const st = await get({ room: h.room, token: c.controllerToken, v: -1 });
    expect(st.statusCode).toBe(200);
    expect(st.body.order).toBe(7);
    expect(st.body.role).toBe('controller');
  });

  it('el móvil manda next/prev/goto y el player lo recibe con ids distintos', async () => {
    const { body: h } = await post({ type: 'create' });
    const { body: c } = await post({ type: 'claim', code: h.code });
    await post({ type: 'nav', room: h.room, token: c.controllerToken, action: 'next' });
    const s1 = await get({ room: h.room, token: h.hostToken, v: -1 });
    expect(s1.body.cmd).toMatchObject({ action: 'next', order: null });
    await post({ type: 'nav', room: h.room, token: c.controllerToken, action: 'goto', order: 12 });
    const s2 = await get({ room: h.room, token: h.hostToken, v: s1.body.v });
    expect(s2.body.v).toBeGreaterThan(s1.body.v);
    expect(s2.body.cmd).toMatchObject({ action: 'goto', order: 12 });
    expect(s2.body.cmd.id).not.toBe(s1.body.cmd.id);
  });

  it('el claim sube la versión para que el player cierre el panel', async () => {
    const { body: h } = await post({ type: 'create' });
    const s0 = await get({ room: h.room, token: h.hostToken, v: -1 });
    await post({ type: 'claim', code: h.code });
    const s1 = await get({ room: h.room, token: h.hostToken, v: s0.body.v });
    expect(s1.body.v).toBeGreaterThan(s0.body.v);
    expect(s1.body.controllers).toBe(1);
  });

  it('rechaza acciones desconocidas', async () => {
    const { body: h } = await post({ type: 'create' });
    const { body: c } = await post({ type: 'claim', code: h.code });
    expect((await post({ type: 'nav', room: h.room, token: c.controllerToken, action: 'explode' })).statusCode).toBe(400);
  });
});

// ─── Revocar / salir ────────────────────────────────────────────────────────

describe('revoke + leave', () => {
  it('revoke expulsa a los móviles: su siguiente lectura es 403', async () => {
    const { body: h } = await post({ type: 'create' });
    const { body: c } = await post({ type: 'claim', code: h.code });
    const r = await post({ type: 'revoke', room: h.room, token: h.hostToken });
    expect(r.body.controllers).toBe(0);
    expect((await get({ room: h.room, token: c.controllerToken, v: -1 })).statusCode).toBe(403);
    // El host sigue dentro.
    expect((await get({ room: h.room, token: h.hostToken, v: -1 })).statusCode).toBe(200);
  });

  it('leave da de baja solo a ese móvil', async () => {
    const { body: h } = await post({ type: 'create' });
    const { body: p } = await post({ type: 'pair', room: h.room, token: h.hostToken });
    const { body: c1 } = await post({ type: 'claim', code: h.code });
    const { body: c2 } = await post({ type: 'claim', code: p.code });
    const l = await post({ type: 'leave', room: h.room, token: c1.controllerToken });
    expect(l.body.controllers).toBe(1);
    expect((await get({ room: h.room, token: c1.controllerToken, v: -1 })).statusCode).toBe(403);
    expect((await get({ room: h.room, token: c2.controllerToken, v: -1 })).statusCode).toBe(200);
  });
});

describe('misc', () => {
  it('OPTIONS → 204 con CORS, otros métodos → 405', async () => {
    const o = await call('OPTIONS');
    expect(o.statusCode).toBe(204);
    expect(o.headers['Access-Control-Allow-Origin']).toBe('*');
    expect((await call('DELETE')).statusCode).toBe(405);
  });
});
