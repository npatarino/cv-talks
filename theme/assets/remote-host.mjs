// Mando a distancia · lado del player (host).
//
// Una sala por pestaña de player (persistida en sessionStorage, así un reload no
// la pierde y dos pestañas nunca chocan). El player es el host; el móvil
// (speaker/?phone=1) se empareja canjeando un código de un solo uso que se
// muestra al pulsar R (QR + texto). Ver api/remote.mjs.
//   R · panel de emparejamiento (crea la sala si no existe)
//   D · desvincular todos los móviles
//   ?remote=1 · arranca la sala al cargar (sin esperar a R)

import { createRelay, createSessionStore, createPoller } from "./remote-client.mjs";

/**
 * @param {object} o
 * @param {string} o.api - endpoint del relay
 * @param {string} o.storeKey - clave de sessionStorage
 * @param {string} o.phoneUrl - URL de la vista del móvil (speaker/?phone=1)
 * @param {HTMLElement} o.hud - elemento del HUD (indicador de conexión)
 * @param {(cmd: {action: string, order?: number}) => void} o.onCommand - orden del móvil
 * @param {boolean} [o.autostart] - crear la sala al cargar
 */
export function createRemoteHost({ api, storeKey, phoneUrl, hud, onCommand, autostart = false }) {
  const relay = createRelay(api);
  const store = createSessionStore(sessionStorage, storeKey, "hostToken");
  let code = null;           // {code, expiresAt}
  let panel = null;
  let lastCmd = null;
  let controllers = 0;

  const poller = createPoller({
    relay,
    getSession: store.get,
    onOffline: () => setStatus(false),
    onState(st, first) {
      if (first) lastCmd = st.cmd ? st.cmd.id : null;   // ignora órdenes anteriores a abrir
      if (st.cmd && st.cmd.id !== lastCmd) { lastCmd = st.cmd.id; onCommand(st.cmd); }
      if (st.controllers > controllers && panel) closePanel();   // acaba de entrar un móvil
      controllers = st.controllers;
      setStatus(true);
    },
    // La sala caducó (o el servidor la perdió): empezamos una nueva.
    // Los móviles tendrán que volver a emparejarse.
    async onLost() {
      const hadPanel = !!panel;
      dropSession();
      await ensureRoom().catch(() => {});
      if (hadPanel) { closePanel(); openPanel(); }
    },
  });

  function dropSession() {
    store.clear(); code = null; lastCmd = null; controllers = 0;
    setStatus(null);
  }

  async function ensureRoom() {
    if (store.get()) { poller.start(); return store.get(); }
    const d = await relay.post({ type: "create" });
    store.set({ room: d.room, token: d.hostToken });
    code = { code: d.code, expiresAt: Date.now() + d.codeTtl * 1000 };
    poller.start();
    return store.get();
  }

  async function freshCode() {
    await ensureRoom();
    // Reutiliza el código vigente si aún le queda margen; si no, pide otro.
    if (code && code.expiresAt - Date.now() > 60 * 1000) return code;
    const s = store.get();
    const d = await relay.post({ type: "pair", room: s.room, token: s.token });
    code = { code: d.code, expiresAt: Date.now() + d.codeTtl * 1000 };
    return code;
  }

  /** Publica en qué slide está el player. */
  function publish(order) {
    const s = store.get();
    if (!s) return;
    relay.post({ type: "state", room: s.room, token: s.token, order }).catch(() => {});
  }

  function setStatus(ok) {
    hud.classList.toggle("remote-ok", ok === true);
    hud.classList.toggle("remote-ko", ok === false);
    if (ok && controllers > 0) hud.dataset.remote = String(controllers);
    else delete hud.dataset.remote;
  }

  function closePanel() { if (panel) { panel.remove(); panel = null; } }

  async function openPanel() {
    closePanel();
    panel = document.createElement("div");
    panel.className = "remote-panel";
    panel.innerHTML = `<div class="remote-qr"></div><div class="remote-code">······</div><div class="remote-url">${phoneUrl}</div><div class="remote-hint">R cerrar</div>`;
    document.body.appendChild(panel);
    let c;
    try { c = await freshCode(); }
    catch (_) {
      if (panel) panel.querySelector(".remote-hint").textContent = "no se puede crear la sala (¿sin /api/remote?) · R cerrar";
      return;
    }
    if (!panel) return;
    const url = `${phoneUrl}&code=${c.code}`;
    panel.querySelector(".remote-code").textContent = c.code;
    panel.querySelector(".remote-hint").textContent =
      `escanea el QR o abre la URL y teclea el código · un solo uso, caduca en 10 min · ${controllers} móvil(es) · R cerrar · D desvincular`;
    const draw = () => {
      if (!panel || !window.QRCode) return;
      new QRCode(panel.querySelector(".remote-qr"), { text: url, width: 320, height: 320, colorDark: "#1c1c1c", colorLight: "#fafaf8" });
    };
    if (window.QRCode) draw();
    else { const sc = document.createElement("script"); sc.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"; sc.onload = draw; document.head.appendChild(sc); }
  }

  function togglePanel() { panel ? closePanel() : openPanel(); }

  /** Desvincula todos los móviles. */
  async function revoke() {
    const s = store.get();
    if (!s) return;
    try { await relay.post({ type: "revoke", room: s.room, token: s.token }); controllers = 0; setStatus(true); }
    catch (_) {}
    if (panel) openPanel();
  }

  if (store.get() || autostart) ensureRoom().catch(() => setStatus(false));
  return { publish, togglePanel, revoke };
}
