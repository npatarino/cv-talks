// Remote control relay · /api/remote
//
// Un único estado compartido en Redis (Upstash vía Vercel Storage) para la sala
// fija KJ7M: { v, order, cmd: { id, action, order } }.
//   - El player publica dónde está:        POST { type: "state", order }
//   - El móvil publica navegación:         POST { type: "nav", action: "next"|"prev"|"goto", order }
//   - Cualquiera escucha cambios:          GET ?v=<última versión vista>
//     Long polling: si el estado no cambió, la petición espera (hasta 8 s) a que
//     cambie y responde entonces. Sin seguridad, a propósito: sala fija, sin auth.
//
// Sin KV_REST_API_URL (local), guarda el estado en memoria del proceso.

const ROOM = 'KJ7M';
const KEY = `remote:${ROOM}`;
const WAIT_MS = 8000;
const TICK_MS = 500;

const mem = { state: null };

async function redis(cmd) {
  const url = process.env.KV_REST_API_URL, token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  if (!r.ok) throw new Error(`redis ${r.status}`);
  return (await r.json()).result;
}

const hasKV = () => !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

async function readState() {
  if (!hasKV()) return mem.state;
  const raw = await redis(['GET', KEY]);
  return raw ? JSON.parse(raw) : null;
}

async function writeState(state) {
  if (!hasKV()) { mem.state = state; return; }
  await redis(['SET', KEY, JSON.stringify(state), 'EX', 60 * 60 * 24]);
}

function blank() { return { v: 0, order: null, cmd: null }; }

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
    const state = (await readState()) || blank();
    state.v += 1;
    if (body.type === 'nav' && ['next', 'prev', 'goto'].includes(body.action)) {
      state.cmd = { id: state.v, action: body.action, order: Number.isFinite(body.order) ? body.order : null };
    } else if (body.type === 'state' && Number.isFinite(body.order)) {
      state.order = body.order;
    } else {
      return res.status(400).json({ error: 'bad message' });
    }
    state.at = Date.now();
    await writeState(state);
    return res.status(200).json(state);
  }

  if (req.method === 'GET') {
    const since = Number(req.query?.v ?? -1);
    const deadline = Date.now() + WAIT_MS;
    let state = (await readState()) || blank();
    while (state.v <= since && Date.now() < deadline) {
      await sleep(TICK_MS);
      state = (await readState()) || blank();
    }
    return res.status(200).json(state);
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).end();
}
