// Remote control relay · /api/remote
//
// Estado compartido en Redis (Upstash vía Vercel Storage) para la sala fija KJ7M,
// en tres claves: remote:KJ7M:v (versión, INCR), :order (dónde está el player) y
// :cmd (última orden del móvil, JSON {id, action, order}).
//   - El player publica dónde está:   POST { type: "state", order }
//   - El móvil publica navegación:    POST { type: "nav", action: "next"|"prev"|"goto", order }
//   - Cualquiera escucha cambios:     GET ?v=<última versión vista>
//     Long polling: si no hay cambios, espera (hasta 8 s) comprobando cada 200 ms.
// Cada operación es un único viaje a Redis (pipeline / MGET). Sin seguridad, a propósito.
// Sin KV_REST_API_URL (local), el estado vive en memoria del proceso.

const ROOM = 'KJ7M';
const K = { v: `remote:${ROOM}:v`, order: `remote:${ROOM}:order`, cmd: `remote:${ROOM}:cmd` };
const TTL = 60 * 60 * 24;
const WAIT_MS = 8000;
const TICK_MS = 200;

const mem = { v: 0, order: null, cmd: null };
const hasKV = () => !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

async function pipeline(cmds) {
  const r = await fetch(`${process.env.KV_REST_API_URL}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds),
  });
  if (!r.ok) throw new Error(`redis ${r.status}`);
  return (await r.json()).map((x) => x.result);
}

async function readState() {
  if (!hasKV()) return { ...mem };
  const [[v, order, cmd]] = await pipeline([['MGET', K.v, K.order, K.cmd]]);
  return { v: Number(v) || 0, order: order == null ? null : Number(order), cmd: cmd ? JSON.parse(cmd) : null };
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

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
    if (body.type === 'nav' && ['next', 'prev', 'goto'].includes(body.action)) {
      const cmd = { id: now, action: body.action, order: Number.isFinite(body.order) ? body.order : null };
      if (hasKV()) await pipeline([['INCR', K.v], ['SET', K.cmd, JSON.stringify(cmd), 'EX', TTL], ['EXPIRE', K.v, TTL]]);
      else { mem.v += 1; mem.cmd = cmd; }
    } else if (body.type === 'state' && Number.isFinite(body.order)) {
      if (hasKV()) await pipeline([['INCR', K.v], ['SET', K.order, String(body.order), 'EX', TTL], ['EXPIRE', K.v, TTL]]);
      else { mem.v += 1; mem.order = body.order; }
    } else {
      return res.status(400).json({ error: 'bad message' });
    }
    return res.status(200).json({ ok: true, at: now });
  }

  if (req.method === 'GET') {
    const since = Number(req.query?.v ?? -1);
    const deadline = Date.now() + WAIT_MS;
    let state = await readState();
    while (state.v <= since && Date.now() < deadline) {
      await sleep(TICK_MS);
      state = await readState();
    }
    return res.status(200).json(state);
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).end();
}
