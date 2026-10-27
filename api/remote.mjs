// Remote control relay · /api/remote  (v2)
//
// Modelo
//   · Sala (room): una por pestaña de player. El player la crea al arrancar el
//     mando y recibe un `hostToken`. Nadie más conoce ese token.
//   · Código de emparejamiento: 6 caracteres, un solo uso, caduca a los 10 min.
//     Lo pide el host (al pulsar R), se muestra como QR + texto; el móvil lo
//     canjea y recibe un `controllerToken` propio. Un código ya canjeado o
//     caducado no vale para nadie más, así que el QR puede verse en pantalla
//     sin que el público pueda colarse después.
//   · Toda lectura y escritura exige un token válido de esa sala.
//
// Estado en Redis (Upstash vía Vercel Storage), un hash por sala:
//   remote:room:<id>  { v, order, cmd, host, ctl, created }
//     v       versión (HINCRBY) para el long polling
//     order   dónde está el player
//     cmd     última orden del móvil, JSON {id, action, order}
//     host    hostToken
//     ctl     JSON array de controllerTokens
//   remote:code:<CODE> → id de sala, EX 600. Se canjea con GETDEL (atómico).
//
// Mensajes
//   POST {type:"create"}                              → {room, hostToken, code, codeTtl}
//   POST {type:"pair",   room, token}                 → {code, codeTtl}        (host)
//   POST {type:"claim",  code}                        → {room, controllerToken, order}
//   POST {type:"state",  room, token, order}          (host)
//   POST {type:"nav",    room, token, action, order}  (controller) action: next|prev|goto
//   POST {type:"revoke", room, token}                 (host) expulsa todos los móviles
//   POST {type:"leave",  room, token}                 (controller) se da de baja
//   GET  ?room=&token=&v=<última versión vista>       long poll (hasta 8 s, tick 200 ms)
//        → {v, order, cmd, controllers, role}
//   404 {error:"no-room"|"bad-code"} · 403 {error:"bad-token"}
//
// Sin KV_REST_API_URL (local / tests), el estado vive en memoria del proceso
// con un mini-Redis que entiende los mismos comandos: una sola ruta de código.

import { randomBytes, timingSafeEqual } from 'node:crypto';

const ROOM_TTL = 60 * 60 * 12;   // 12 h sin actividad
const CODE_TTL = 60 * 10;        // 10 min
const MAX_CONTROLLERS = 5;
const WAIT_MS = 8000;
const TICK_MS = 200;
const CODE_LEN = 6;
// Sin 0/O/1/I para que se pueda teclear sin dudas. 32 símbolos → byte % 32 es uniforme.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const K = {
  room: (id) => `remote:room:${id}`,
  code: (c) => `remote:code:${c}`,
};

// ─── Redis ──────────────────────────────────────────────────────────────────

const hasKV = () => !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

async function kvPipeline(cmds) {
  const r = await fetch(`${process.env.KV_REST_API_URL}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds),
  });
  if (!r.ok) throw new Error(`redis ${r.status}`);
  return (await r.json()).map((x) => x.result);
}

// Mini-Redis en memoria: HGETALL/HSET/HINCRBY/EXPIRE/SET EX/GETDEL/DEL con TTL.
// Devuelve las mismas formas que la REST API de Upstash (HGETALL plano).
export function memoryRedis() {
  const db = new Map();
  const exp = new Map();
  const get = (k) => {
    const e = exp.get(k);
    if (e != null && e <= Date.now()) { db.delete(k); exp.delete(k); }
    return db.get(k);
  };
  const hash = (k) => { let h = get(k); if (!h) { h = new Map(); db.set(k, h); } return h; };
  const run = ([c, k, ...a]) => {
    switch (c) {
      case 'HGETALL': { const h = get(k); return h instanceof Map ? [...h].flat() : []; }
      case 'HSET': { const h = hash(k); for (let i = 0; i < a.length; i += 2) h.set(a[i], String(a[i + 1])); return a.length / 2; }
      case 'HINCRBY': { const h = hash(k); const n = (Number(h.get(a[0])) || 0) + Number(a[1]); h.set(a[0], String(n)); return n; }
      case 'EXPIRE': { if (get(k) === undefined) return 0; exp.set(k, Date.now() + Number(a[0]) * 1000); return 1; }
      case 'SET': { db.set(k, String(a[0])); if (a[1] === 'EX') exp.set(k, Date.now() + Number(a[2]) * 1000); else exp.delete(k); return 'OK'; }
      case 'GETDEL': { const v = get(k); db.delete(k); exp.delete(k); return typeof v === 'string' ? v : null; }
      case 'DEL': { const had = get(k) !== undefined; db.delete(k); exp.delete(k); return had ? 1 : 0; }
      default: throw new Error(`memoryRedis: ${c} no soportado`);
    }
  };
  return async (cmds) => cmds.map(run);
}

let memory = null;
function pipeline(cmds) {
  if (hasKV()) return kvPipeline(cmds);
  if (!memory) memory = memoryRedis();
  return memory(cmds);
}

/** Solo para tests: descarta el estado en memoria. */
export function __resetMemory() { memory = null; }

// ─── Helpers ────────────────────────────────────────────────────────────────

function randomCode(len = CODE_LEN) {
  const bytes = randomBytes(len);
  let s = '';
  for (const b of bytes) s += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return s;
}
const newToken = () => randomBytes(24).toString('base64url');
const normalizeCode = (c) => String(c ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const isRoomId = (r) => typeof r === 'string' && /^[A-Z2-9]{8}$/.test(r);

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ba = Buffer.from(a), bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

function parseRoom(flat) {
  if (!Array.isArray(flat) || flat.length === 0) return null;
  const h = {};
  for (let i = 0; i < flat.length; i += 2) h[flat[i]] = flat[i + 1];
  let ctl = [];
  try { ctl = JSON.parse(h.ctl || '[]'); } catch { ctl = []; }
  return {
    v: Number(h.v) || 0,
    order: h.order == null ? null : Number(h.order),
    cmd: h.cmd ? JSON.parse(h.cmd) : null,
    host: h.host || '',
    ctl: Array.isArray(ctl) ? ctl : [],
  };
}

async function readRoom(id) {
  if (!isRoomId(id)) return null;
  const [flat] = await pipeline([['HGETALL', K.room(id)]]);
  return parseRoom(flat);
}

function roleOf(room, token) {
  if (safeEqual(room.host, token)) return 'host';
  if (room.ctl.some((t) => safeEqual(t, token))) return 'controller';
  return null;
}

async function issueCode(roomId) {
  const code = randomCode();
  await pipeline([['SET', K.code(code), roomId, 'EX', CODE_TTL], ['EXPIRE', K.room(roomId), ROOM_TTL]]);
  return { code, codeTtl: CODE_TTL };
}

/** Escribe campos en la sala, sube la versión y renueva el TTL en un viaje. */
function writeRoom(id, fields) {
  const cmds = [];
  if (fields && Object.keys(fields).length) cmds.push(['HSET', K.room(id), ...Object.entries(fields).flat()]);
  cmds.push(['HINCRBY', K.room(id), 'v', 1], ['EXPIRE', K.room(id), ROOM_TTL]);
  return pipeline(cmds);
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
const publicState = (room, role) => ({
  v: room.v, order: room.order, cmd: room.cmd, controllers: room.ctl.length, role,
});

// ─── Handler ────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    body = body || {};
    const now = Date.now();

    if (body.type === 'create') {
      const room = randomCode(8);
      const hostToken = newToken();
      await pipeline([
        ['HSET', K.room(room), 'v', 0, 'host', hostToken, 'ctl', '[]', 'created', now],
        ['EXPIRE', K.room(room), ROOM_TTL],
      ]);
      const { code, codeTtl } = await issueCode(room);
      return res.status(201).json({ room, hostToken, code, codeTtl });
    }

    if (body.type === 'claim') {
      const code = normalizeCode(body.code);
      if (code.length !== CODE_LEN) return res.status(404).json({ error: 'bad-code' });
      const [roomId] = await pipeline([['GETDEL', K.code(code)]]);
      const room = roomId ? await readRoom(roomId) : null;
      if (!room) return res.status(404).json({ error: 'bad-code' });
      const controllerToken = newToken();
      const ctl = [...room.ctl, controllerToken].slice(-MAX_CONTROLLERS);
      await writeRoom(roomId, { ctl: JSON.stringify(ctl) });
      return res.status(200).json({ room: roomId, controllerToken, order: room.order });
    }

    // El resto exige sala + token.
    const room = await readRoom(body.room);
    if (!room) return res.status(404).json({ error: 'no-room' });
    const role = roleOf(room, body.token);
    if (!role) return res.status(403).json({ error: 'bad-token' });
    const id = body.room;

    if (body.type === 'pair' && role === 'host') {
      return res.status(200).json(await issueCode(id));
    }
    if (body.type === 'state' && role === 'host' && Number.isFinite(body.order)) {
      await writeRoom(id, { order: String(body.order) });
      return res.status(200).json({ ok: true, at: now });
    }
    if (body.type === 'nav' && role === 'controller' && ['next', 'prev', 'goto'].includes(body.action)) {
      const cmd = { id: `${now}-${randomCode(4)}`, action: body.action, order: Number.isFinite(body.order) ? body.order : null };
      await writeRoom(id, { cmd: JSON.stringify(cmd) });
      return res.status(200).json({ ok: true, at: now });
    }
    if (body.type === 'revoke' && role === 'host') {
      await writeRoom(id, { ctl: '[]' });
      return res.status(200).json({ ok: true, controllers: 0 });
    }
    if (body.type === 'leave' && role === 'controller') {
      const ctl = room.ctl.filter((t) => !safeEqual(t, body.token));
      await writeRoom(id, { ctl: JSON.stringify(ctl) });
      return res.status(200).json({ ok: true, controllers: ctl.length });
    }
    return res.status(400).json({ error: 'bad message' });
  }

  if (req.method === 'GET') {
    const q = req.query || {};
    const id = String(q.room ?? '');
    const token = String(q.token ?? '');
    const since = Number(q.v ?? -1);
    const deadline = Date.now() + WAIT_MS;

    let room = await readRoom(id);
    if (!room) return res.status(404).json({ error: 'no-room' });
    const role = roleOf(room, token);
    if (!role) return res.status(403).json({ error: 'bad-token' });

    while (room.v <= since && Date.now() < deadline) {
      await sleep(TICK_MS);
      room = await readRoom(id);
      if (!room) return res.status(404).json({ error: 'no-room' });
      // Si el host nos ha expulsado mientras esperábamos, que el móvil lo sepa ya.
      if (!roleOf(room, token)) return res.status(403).json({ error: 'bad-token' });
    }
    return res.status(200).json(publicState(room, role));
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).end();
}
