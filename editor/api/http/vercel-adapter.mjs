/**
 * Ejecuta un handler estilo Vercel (req, res) sobre un Request de Bun y
 * devuelve un Response. Solo cubre lo que usa api/remote.mjs: query, body
 * JSON, setHeader/status/json/end.
 */
export async function adaptVercel(handler, req, url) {
  let body = null;
  if (req.method === 'POST') { try { body = await req.json(); } catch { body = {}; } }
  const vreq = { method: req.method, query: Object.fromEntries(url.searchParams), body };
  const headers = {};
  let status = 200, payload = null;
  const vres = {
    setHeader(k, v) { headers[k] = v; },
    status(c) { status = c; return vres; },
    json(d) { payload = JSON.stringify(d); headers['Content-Type'] = 'application/json'; return vres; },
    end() { return vres; },
  };
  await handler(vreq, vres);
  return new Response(payload, { status, headers });
}
