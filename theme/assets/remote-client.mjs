// Cliente del relay del mando (/api/remote), compartido por el player (host) y
// el móvil (controller). Sin DOM: relay HTTP, sesión persistida y bucle de
// long polling con reconexión. Ver api/remote.mjs para el protocolo.

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

/**
 * Cliente HTTP del relay.
 * @param {string} api - URL del endpoint (p. ej. "/api/remote")
 * @param {typeof fetch} [fetchFn] - inyectable para tests
 */
export function createRelay(api, fetchFn = (...args) => fetch(...args)) {
  /** POST de un mensaje; lanza Error con `.status` si la respuesta no es 2xx. */
  async function post(body) {
    const r = await fetchFn(api, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(data.error || `remote ${r.status}`), { status: r.status });
    return data;
  }

  /** Long poll del estado de la sala. Devuelve la Response cruda. */
  function poll(session, v) {
    const q = `room=${encodeURIComponent(session.room)}&token=${encodeURIComponent(session.token)}&v=${v}`;
    return fetchFn(`${api}?${q}`, { cache: "no-store" });
  }

  return { post, poll };
}

/**
 * Sesión {room, token} persistida en un Storage (sessionStorage/localStorage).
 * `tokenField` es el nombre con el que se guarda el token ("hostToken" en el
 * player, "token" en el móvil); en memoria siempre es `token`.
 */
export function createSessionStore(storage, key, tokenField) {
  let session = null;
  try {
    const raw = JSON.parse(storage.getItem(key));
    if (raw && raw.room && raw[tokenField]) session = { room: raw.room, token: raw[tokenField] };
  } catch (_) { session = null; }

  const persist = () => {
    try {
      if (session) storage.setItem(key, JSON.stringify({ room: session.room, [tokenField]: session.token }));
      else storage.removeItem(key);
    } catch (_) {}
  };

  return {
    get: () => session,
    set(s) { session = s; persist(); },
    clear() { session = null; persist(); },
  };
}

/**
 * Bucle de long polling sobre la sesión actual.
 *
 * - `onState(st, first)`: llega cada estado; `first` es true en el primero tras
 *   (re)conectar, útil para ignorar órdenes anteriores.
 * - `onOffline()`: fallo de red o respuesta de error; reintenta tras `retryMs`.
 * - `onLost(status)`: 404 (sala caducada) o 403 (token revocado). La versión se
 *   reinicia antes de llamarlo. El bucle sigue si el handler deja una sesión
 *   nueva, y termina si la deja vacía.
 *
 * El bucle termina solo cuando `getSession()` devuelve null.
 */
export function createPoller({ relay, getSession, onState, onLost, onOffline, retryMs = 2000 }) {
  let running = false;
  let v = -1;

  async function run() {
    try {
      while (getSession()) {
        let r;
        try {
          r = await relay.poll(getSession(), v);
        } catch (_) {
          onOffline?.();
          await sleep(retryMs);
          continue;
        }
        if (r.status === 404 || r.status === 403) {
          v = -1;
          await onLost(r.status);
          continue;
        }
        if (!r.ok) {
          onOffline?.();
          await sleep(retryMs);
          continue;
        }
        const st = await r.json();
        const first = v === -1;
        v = st.v;
        onState(st, first);
      }
    } finally {
      running = false;
    }
  }

  return {
    /** Arranca el bucle si no está corriendo. */
    start() {
      if (running) return;
      running = true;
      run();
    },
    /** Olvida la versión vista (la próxima respuesta cuenta como `first`). */
    reset() { v = -1; },
    get running() { return running; },
  };
}
