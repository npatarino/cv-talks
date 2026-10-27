// Mando a distancia · lado del móvil (controller, speaker/?phone=1).
//
// El player crea una sala y muestra un código de un solo uso (R). Aquí lo
// canjeamos (tecleado o vía ?code= desde el QR) y guardamos el token del mando
// en localStorage, por deck, para que un reload no pida emparejar otra vez. Si
// la sala caduca o el player nos desvincula, volvemos a la pantalla de
// emparejamiento. Ver api/remote.mjs.

import { createRelay, createSessionStore, createPoller } from "./remote-client.mjs";

/**
 * @param {object} o
 * @param {string} o.api - endpoint del relay
 * @param {string} o.storeKey - clave de localStorage
 * @param {HTMLElement} o.hud - HUD del speaker (indicador de conexión)
 * @param {object} o.ui - { prev, next, leave, form, input, go, error }: elementos del DOM
 * @param {(order: number) => boolean} o.hasSlide - ¿existe una slide con ese order?
 * @param {() => number} o.currentOrder - order mostrado ahora
 * @param {(order: number) => void} o.showSlide - muestra una slide
 * @param {string|null} [o.initialCode] - código recibido por ?code= (tiene prioridad sobre la sesión guardada)
 */
export function createPhoneController({ api, storeKey, hud, ui, hasSlide, currentOrder, showSlide, initialCode = null }) {
  const relay = createRelay(api);
  const store = createSessionStore(localStorage, storeKey, "token");

  const poller = createPoller({
    relay,
    getSession: store.get,
    onOffline: () => hud.classList.add("remote-ko"),
    onState(st) {
      if (typeof st.order === "number" && st.order !== currentOrder() && hasSlide(st.order)) showSlide(st.order);
      hud.classList.remove("remote-ko");
    },
    onLost: (status) => showPairing(status === 403
      ? "El player te ha desvinculado."
      : "La sala ha caducado. Pulsa R en el player para emparejar de nuevo."),
  });

  function showPairing(msg) {
    store.clear(); poller.reset();
    document.body.classList.add("pairing");
    hud.classList.remove("remote-ko");
    ui.error.textContent = msg || "";
    ui.input.value = "";
    setTimeout(() => ui.input.focus(), 50);
  }

  function hidePairing() {
    document.body.classList.remove("pairing");
    ui.error.textContent = "";
  }

  async function claim(code) {
    ui.go.disabled = true;
    ui.error.textContent = "";
    try {
      const d = await relay.post({ type: "claim", code });
      store.set({ room: d.room, token: d.controllerToken });
      hidePairing();
      if (typeof d.order === "number" && hasSlide(d.order)) showSlide(d.order);
      poller.start();
    } catch (e) {
      showPairing(e.status === 404 ? "Código no válido o ya usado. Pulsa R en el player para generar otro." : "No hay conexión con el servidor.");
    } finally { ui.go.disabled = false; }
  }

  const clean = (s) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

  ui.form.addEventListener("submit", (e) => {
    e.preventDefault();
    const code = clean(ui.input.value);
    if (code.length === 6) claim(code);
    else ui.error.textContent = "El código tiene 6 caracteres.";
  });
  ui.input.addEventListener("input", () => {
    ui.input.value = clean(ui.input.value).slice(0, 6);
    if (ui.input.value.length === 6) ui.form.requestSubmit();
  });

  function send(action) {
    const s = store.get();
    if (!s) return;
    relay.post({ type: "nav", room: s.room, token: s.token, action }).catch((e) => {
      if (e.status === 403 || e.status === 404) showPairing("El player ha cerrado la sala.");
    });
  }
  ui.prev.addEventListener("click", () => send("prev"));
  ui.next.addEventListener("click", () => send("next"));

  ui.leave.addEventListener("click", () => {
    const s = store.get();
    if (s) relay.post({ type: "leave", room: s.room, token: s.token }).catch(() => {});
    showPairing("");
  });

  // Arranque: ?code= (viene del QR) tiene prioridad sobre una sesión guardada.
  if (initialCode) claim(initialCode);
  else if (store.get()) poller.start();
  else showPairing("");
}
