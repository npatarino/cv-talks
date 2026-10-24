// Deck mode · single page que cambia slides cambiando el src del iframe.
// Mantiene fullscreen entre slides (el iframe cambia, la página no).
//
// Sin animaciones: no hay transición type/un-type entre slides — solo swap directo
// del src del iframe.
(function () {
  const slides = window.__SLIDES__ || [];
  const frame = document.getElementById("deck-frame");
  const hud = document.getElementById("deck-hud");
  const channel = new BroadcastChannel('cv-talks-deck');

  function currentIndex() {
    const m = location.hash.match(/#\/([\d.]+)/);
    if (m) {
      const order = Number(m[1]);
      const idx = slides.findIndex((s) => s.order === order);
      if (idx !== -1) return idx;
    }
    return 0;
  }

  function pad(n) { return String(n).padStart(2, "0"); }

  function load(idx, opts) {
    const s = slides[idx];
    if (!s) return;
    history.replaceState(null, "", `#/${s.order}`);
    hud.textContent = `${pad(s.order)} / ${pad(slides[slides.length - 1].order)} · ${s.label}`;
    channel.postMessage({ type: 'slide', order: s.order });
    const params = new URLSearchParams();
    params.set("present", "1");
    params.set("embedded", "1");
    // `reveal` controla el estado inicial de progressive disclosure cuando el
    // slide tiene listas. Forward nav arranca con 1 item visible (los demás se
    // revelan con →). Backward nav abre con "full" para que ← siga ocultando
    // desde el final. Si el slide no tiene listas, el param es inocuo.
    // Si el slide tiene `revealStart`, usamos ese valor en lugar del default "1".
    let reveal;
    if (opts && opts.reveal) {
      reveal = opts.reveal;
    } else if (s.revealStart != null) {
      reveal = String(s.revealStart);
    } else {
      reveal = "1";
    }
    params.set("reveal", reveal);
    frame.src = s.url + "?" + params.toString();
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
        if (["f", "F", "p", "P", "q", "Q", "Escape", "Home", "End"].includes(e.key)) {
          window.dispatchEvent(new KeyboardEvent("keydown", { key: e.key }));
          e.preventDefault();
        }
      });
    } catch (_) {}
  });

  document.querySelector('[data-action="fullscreen"]').addEventListener("click", toggleFullscreen);

  channel.addEventListener('message', e => {
    const d = e.data;
    if (d?.type === 'slide' && typeof d.order === 'number') {
      const idx = slides.findIndex(s => s.order === d.order);
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

  // ── Mando a distancia (?remote=1) ────────────────────────────────────────
  // Sala fija KJ7M en /api/remote. El móvil (speaker/?phone=1) publica next/prev/
  // goto; el player los aplica como si fueran teclas y publica dónde está.
  const remote = (() => {
    const qs = new URLSearchParams(location.search);
    const enabled = qs.get("remote") === "1";
    const api = qs.get("api") || "/api/remote";
    const phoneUrl = location.origin + location.pathname.replace(/\/deck\/?$/, "/speaker/") + "?phone=1";
    let lastV = -1, lastCmd = -1, panel = null;

    function apply(cmd) {
      if (cmd.action === "goto" && typeof cmd.order === "number") {
        const idx = slides.findIndex((s) => s.order === cmd.order);
        if (idx !== -1) load(idx);
        return;
      }
      const key = cmd.action === "prev" ? "ArrowLeft" : "ArrowRight";
      const win = frame.contentWindow;
      if (win) win.dispatchEvent(new KeyboardEvent("keydown", { key }));
    }

    async function loop() {
      while (true) {
        try {
          const r = await fetch(`${api}?v=${lastV}`, { cache: "no-store" });
          const st = await r.json();
          if (lastV === -1) { lastCmd = st.cmd ? st.cmd.id : -1; }   // ignora órdenes anteriores a abrir
          lastV = st.v;
          if (st.cmd && st.cmd.id > lastCmd) { lastCmd = st.cmd.id; apply(st.cmd); }
          setStatus(true);
        } catch (_) {
          setStatus(false);
          await new Promise((res) => setTimeout(res, 2000));
        }
      }
    }

    function publish(order) {
      if (!enabled) return;
      fetch(api, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "state", order }) }).catch(() => {});
    }

    function setStatus(ok) {
      hud.classList.toggle("remote-ok", ok);
      hud.classList.toggle("remote-ko", !ok);
    }

    function togglePanel() {
      if (panel) { panel.remove(); panel = null; return; }
      panel = document.createElement("div");
      panel.className = "remote-panel";
      panel.innerHTML = `<div class="remote-qr"></div><div class="remote-url">${phoneUrl}</div><div class="remote-hint">${enabled ? "mando activo · sala KJ7M" : "abre el player con ?remote=1 para activar el mando"} · R para cerrar</div>`;
      document.body.appendChild(panel);
      const draw = () => { if (window.QRCode) new QRCode(panel.querySelector(".remote-qr"), { text: phoneUrl, width: 360, height: 360, colorDark: "#1c1c1c", colorLight: "#fafaf8" }); };
      if (window.QRCode) draw();
      else { const sc = document.createElement("script"); sc.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"; sc.onload = draw; document.head.appendChild(sc); }
    }

    if (enabled) loop();
    return { publish, togglePanel };
  })();

  window.addEventListener("hashchange", () => load(currentIndex()));
  load(currentIndex());
})();
