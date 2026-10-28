// Cliente de la precarga offline (lo usan el player y el speaker).
//
// Registra el Service Worker (/sw.js), le pide que guarde el deck entero y
// resume el estado en una etiqueta del HUD:
//
//   offline 37%        guardando
//   offline ✓          todo guardado: se puede cortar la red
//   offline ✗ 3        fallaron 3 ficheros; se reintenta al volver la conexión
//   offline ↻ recarga  hay una versión nueva de la charla; recarga (F5)
//
// Solo se activa fuera de localhost (producción). Para probarlo en local:
// ?offline=1. Con ?offline=0 se desinstala el worker y se vacía la caché.

import { CACHE_PREFIX } from './offline-sw.mjs';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

/** ¿Debe activarse la precarga en esta página? */
export function offlineEnabled(loc = location) {
  const flag = new URLSearchParams(loc.search).get('offline');
  if (flag === '0') return false;
  if (flag === '1') return true;
  const host = loc.hostname;
  return !(LOCAL_HOSTS.has(host) || host.endsWith('.localhost'));
}

/** Texto y nivel (ok|busy|warn|bad|off) de un estado, para el HUD. */
export function describeStatus(status) {
  switch (status.state) {
    case 'registering': return { text: 'offline …', level: 'busy' };
    case 'warming': return { text: `offline ${status.pct ?? 0}%`, level: 'busy' };
    case 'ready': return { text: 'offline ✓', level: 'ok' };
    case 'partial': return { text: `offline ✗ ${status.failed}`, level: 'bad' };
    case 'updated': return { text: 'offline ↻ recarga', level: 'warn' };
    case 'unsupported':
    case 'error': return { text: 'offline ✗', level: 'bad' };
    default: return { text: '', level: 'off' };
  }
}

/** Pinta un estado en un elemento del HUD. */
export function renderOfflineStatus(el, status) {
  if (!el) return;
  const { text, level } = describeStatus(status);
  el.textContent = text;
  el.dataset.state = level;
  el.hidden = !text;
}

/**
 * Pide al worker que se desactive y vacíe sus cachés, y espera su confirmación.
 * Hace falta porque un worker desregistrado sigue controlando las pestañas ya
 * abiertas y, si no se le avisa, volvería a crear la caché que acabamos de borrar.
 */
function askToClear(worker, timeoutMs = 1500) {
  if (!worker?.postMessage || typeof MessageChannel === 'undefined') return Promise.resolve();
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timer = setTimeout(resolve, timeoutMs);
    channel.port1.onmessage = () => { clearTimeout(timer); resolve(); };
    worker.postMessage({ type: 'clear' }, [channel.port2]);
  });
}

/** Desinstala nuestro worker y borra nuestras cachés (modo desactivado). */
async function cleanup(nav, cacheStorage) {
  try {
    const regs = (await nav.serviceWorker?.getRegistrations?.()) ?? [];
    const ours = regs.filter((r) => (r.active || r.waiting || r.installing)?.scriptURL?.endsWith('/sw.js'));
    await Promise.all(ours.map(async (r) => {
      await askToClear(r.active);
      await r.unregister();
    }));
  } catch (_) { /* sin permisos: nada que limpiar */ }
  try {
    const names = (await cacheStorage?.keys?.()) ?? [];
    await Promise.all(names.filter((n) => n.startsWith(CACHE_PREFIX)).map((n) => cacheStorage.delete(n)));
  } catch (_) {}
}

/**
 * Activa la precarga offline de las páginas indicadas.
 *
 * @param {object} o
 * @param {string[]} o.urls - páginas a guardar (el worker rastrea lo que cargan)
 * @param {(status: object) => void} o.onStatus
 * @param {string} [o.scriptUrl]
 * @returns {Promise<{warmAgain: () => void}>}
 */
export async function startOffline({
  urls, onStatus,
  scriptUrl = '/sw.js',
  nav = navigator, loc = location, win = window, cacheStorage = globalThis.caches,
}) {
  const idle = { warmAgain() {} };

  if (!offlineEnabled(loc)) {
    await cleanup(nav, cacheStorage);
    onStatus({ state: 'off' });
    return idle;
  }
  if (!nav.serviceWorker || win.isSecureContext === false) {
    onStatus({ state: 'unsupported' });
    return idle;
  }

  const sw = nav.serviceWorker;
  let controlled = !!sw.controller;   // ¿ya nos controlaba un worker? (falso en la primera visita)
  let worker = null;
  let last = { state: 'registering' };
  let shownPct = 0;   // el porcentaje no retrocede aunque el total crezca al descubrir ficheros
  const emit = (status) => { last = status; onStatus(status); };
  const absolute = urls.map((u) => new URL(u, loc.href).href);

  sw.addEventListener('message', (event) => {
    const m = event.data;
    if (!m) return;
    if (m.type === 'warm-progress') {
      const pct = m.total ? Math.floor((100 * m.done) / m.total) : 0;
      shownPct = Math.max(shownPct, Math.min(pct, 99));
      emit({ state: 'warming', pct: shownPct, done: m.done, total: m.total, failed: m.failed });
    } else if (m.type === 'warm-done') {
      if (m.failed) console.warn('[offline] sin guardar:', m.failedUrls);
      if (m.failed) emit({ state: 'partial', failed: m.failed, total: m.total });
      else emit(updated ? { state: 'updated', total: m.total } : { state: 'ready', total: m.total });
    }
  });

  // Un worker nuevo toma el control cuando se publica una versión nueva de la charla:
  // se guarda también la versión nueva en segundo plano (hasta entonces la vieja sigue
  // como respaldo) y se avisa de que conviene recargar.
  let updated = false;
  sw.addEventListener('controllerchange', () => {
    if (!controlled) { controlled = true; return; }   // el primer cambio es la propia instalación
    updated = true;
    emit({ state: 'updated' });
    warmAgain();
  });

  // El controlador actual puede ser más nuevo que el worker activo con el que arrancamos.
  const warmAgain = () => (sw.controller || worker)?.postMessage({ type: 'warm', urls: absolute });
  // Si volvió la red y quedaron ficheros sin guardar, se reintenta solo.
  win.addEventListener('online', () => { if (last.state === 'partial' || last.state === 'error') warmAgain(); });

  emit(last);
  try {
    await sw.register(scriptUrl, { type: 'module', scope: '/' });
    const reg = await sw.ready;
    worker = reg.active;
    warmAgain();
  } catch (_) {
    emit({ state: 'error' });
  }
  return { warmAgain };
}
