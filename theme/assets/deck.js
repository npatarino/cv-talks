// Deck mode · single page que cambia slides cambiando el src del iframe.
// Mantiene fullscreen entre slides (el iframe cambia, la página no).
//
// Sin animaciones: no hay transición type/un-type entre slides — solo swap directo
// del src del iframe.
//
// Módulo ES (lo carga deck-player.njk con type="module"). El mando a distancia
// vive en remote-host.mjs; helpers de URL/HUD en slide-url.mjs.
import { createRemoteHost } from "./remote-host.mjs";
import { startOffline, renderOfflineStatus } from "./offline.mjs";
import { indexByOrder, revealFor, embeddedSrc, hudText } from "./slide-url.mjs";

{
  const slides = window.__SLIDES__ || [];
  const frame = document.getElementById("deck-frame");
  const hud = document.getElementById("deck-hud");
  const channel = new BroadcastChannel('cv-talks-deck');

  function currentIndex() {
    const m = location.hash.match(/#\/([\d.]+)/);
    if (m) {
      const order = Number(m[1]);
      const idx = indexByOrder(slides, order);
      if (idx !== -1) return idx;
    }
    return 0;
  }

  function load(idx, opts) {
    const s = slides[idx];
    if (!s) return;
    history.replaceState(null, "", `#/${s.order}`);
    hud.textContent = hudText(s, slides);
    channel.postMessage({ type: 'slide', order: s.order });
    frame.src = embeddedSrc(s, revealFor(s, opts && opts.reveal));
    remote.publish(s.order);
  }

  function goto(delta, opts) {
    const idx = currentIndex();
    const next = Math.max(0, Math.min(slides.length - 1, idx + delta));
    if (next !== idx) load(next, opts);
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (_) {}
  }

  document.addEventListener("fullscreenchange", () => {
    document.body.classList.toggle("fullscreen", !!document.fullscreenElement);
    const win = frame.contentWindow;
    if (win) win.postMessage({ type: "parent-fullscreen-change" }, "*");
  });

  function quitToTOC() {
    if (document.fullscreenElement) {
      try { document.exitFullscreen(); } catch (_) {}
    }
    location.href = "../";
  }

  window.addEventListener("keydown", (e) => {
    if (["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "PageDown", "PageUp", " "].includes(e.key)) {
      // Arrows/space/page keys: forward al iframe para que su present.js decida si
      // revela el próximo item o si navega (vía postMessage de vuelta).
      const win = frame.contentWindow;
      if (win) win.dispatchEvent(new KeyboardEvent("keydown", { key: e.key }));
      e.preventDefault();
    }
    else if (e.key === "f" || e.key === "F" || e.key === "p" || e.key === "P") { toggleFullscreen(); e.preventDefault(); }
    else if (e.key === "r" || e.key === "R") { remote.togglePanel(); e.preventDefault(); }
    else if (e.key === "d" || e.key === "D") { remote.revoke(); e.preventDefault(); }
    else if (e.key === "q" || e.key === "Q" || e.key === "Escape") {
      quitToTOC();
      e.preventDefault();
    }
    else if (e.key === "Home") {
      load(0);
      e.preventDefault();
    }
    else if (e.key === "End") {
      load(slides.length - 1);
      e.preventDefault();
    }
  });

  frame.addEventListener("load", () => {
    const win = frame.contentWindow;
    if (!win) return;
    try {
      // Solo reenviamos teclas de chrome al parent (fullscreen, exit). Las
      // arrows/space son consumidas por present.js dentro del iframe.
      win.addEventListener("keydown", (e) => {
        if (["f", "F", "p", "P", "q", "Q", "r", "R", "d", "D", "Escape", "Home", "End"].includes(e.key)) {
          window.dispatchEvent(new KeyboardEvent("keydown", { key: e.key }));
          e.preventDefault();
        }
      });
    } catch (_) {}
  });

  document.querySelector('[data-action="fullscreen"]').addEventListener("click", toggleFullscreen);
  document.querySelector('[data-action="remote"]').addEventListener("click", () => remote.togglePanel());

  channel.addEventListener('message', e => {
    const d = e.data;
    if (d?.type === 'slide' && typeof d.order === 'number') {
      const idx = indexByOrder(slides, d.order);
      if (idx !== -1 && slides[idx].order !== slides[currentIndex()].order) load(idx);
    }
  });

  window.addEventListener("message", (e) => {
    const d = e.data;
    if (d && d.type === "nav" && typeof d.delta === "number") {
      goto(d.delta, d.reveal ? { reveal: d.reveal } : undefined);
    }
    else if (d && d.type === "navToFirst") {
      load(0);
    }
    else if (d && d.type === "navToLast") {
      load(slides.length - 1);
    }
  });

  // ── Mando a distancia (R · panel de emparejamiento, D · desvincular) ─────
  // Las órdenes del móvil llegan como next/prev (se reenvían como tecla al
  // iframe, para que present.js decida si revela un item o navega) o goto.
  function applyRemoteCommand(cmd) {
    if (cmd.action === "goto" && typeof cmd.order === "number") {
      const idx = indexByOrder(slides, cmd.order);
      if (idx !== -1) load(idx);
      return;
    }
    const key = cmd.action === "prev" ? "ArrowLeft" : "ArrowRight";
    const win = frame.contentWindow;
    if (win) win.dispatchEvent(new KeyboardEvent("keydown", { key }));
  }

  const qs = new URLSearchParams(location.search);
  const remote = createRemoteHost({
    api: qs.get("api") || "/api/remote",
    storeKey: "cv-talks-remote:" + location.pathname,
    phoneUrl: location.origin + location.pathname.replace(/\/deck\/?$/, "/speaker/") + "?phone=1",
    hud,
    onCommand: applyRemoteCommand,
    autostart: qs.get("remote") === "1",
  });

  // ── Precarga offline ─────────────────────────────────────────────────────
  // Guarda el deck entero en el navegador (Service Worker) para que un corte de
  // red durante la charla no se note. La etiqueta de abajo a la derecha dice
  // cuándo está listo: «offline ✓». Solo en producción (o con ?offline=1).
  startOffline({
    urls: [
      location.pathname,                                  // este mismo player, para poder recargarlo sin red
      new URL("../speaker/", location.href).pathname,     // vista del orador
      new URL("../", location.href).pathname,             // índice del deck
      ...slides.map((s) => s.url),
    ],
    onStatus: (status) => renderOfflineStatus(document.getElementById("deck-offline"), status),
  }).catch(() => {});

  window.addEventListener("hashchange", () => load(currentIndex()));
  load(currentIndex());
}
