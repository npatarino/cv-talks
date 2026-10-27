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

  // ── Mando a distancia ────────────────────────────────────────────────────
  // Una sala por pestaña de player (persistida en sessionStorage, así un reload
  // no la pierde y dos pestañas nunca chocan). El player es el host; el móvil
  // (speaker/?phone=1) se empareja canjeando un código de un solo uso que se
  // muestra al pulsar R (QR + texto). Ver api/remote.mjs.
  //   R · panel de emparejamiento (crea la sala si no existe)
  //   D · desvincular todos los móviles
  //   ?remote=1 · arranca la sala al cargar (sin esperar a R)
  const remote = (() => {
    const qs = new URLSearchParams(location.search);
    const api = qs.get("api") || "/api/remote";
    const storeKey = "cv-talks-remote:" + location.pathname;
    const phoneUrl = location.origin + location.pathname.replace(/\/deck\/?$/, "/speaker/") + "?phone=1";
    let session = null;        // {room, hostToken}
    let code = null;           // {code, expiresAt}
    let panel = null;
    let polling = false;
    let lastV = -1, lastCmd = null, controllers = 0;

    try { session = JSON.parse(sessionStorage.getItem(storeKey)); } catch (_) { session = null; }
    if (session && !(session.room && session.hostToken)) session = null;

    function save() {
      try { session ? sessionStorage.setItem(storeKey, JSON.stringify(session)) : sessionStorage.removeItem(storeKey); } catch (_) {}
    }

    async function post(body) {
      const r = await fetch(api, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw Object.assign(new Error(data.error || `remote ${r.status}`), { status: r.status });
      return data;
    }

    function dropSession() {
      session = null; code = null; lastV = -1; lastCmd = null; controllers = 0;
      save(); setStatus(null);
    }

    async function ensureRoom() {
      if (session) { loop(); return session; }
      const d = await post({ type: "create" });
      session = { room: d.room, hostToken: d.hostToken };
      code = { code: d.code, expiresAt: Date.now() + d.codeTtl * 1000 };
      save();
      loop();
      return session;
    }

    async function freshCode() {
      await ensureRoom();
      // Reutiliza el código vigente si aún le queda margen; si no, pide otro.
      if (code && code.expiresAt - Date.now() > 60 * 1000) return code;
      const d = await post({ type: "pair", room: session.room, token: session.hostToken });
      code = { code: d.code, expiresAt: Date.now() + d.codeTtl * 1000 };
      return code;
    }

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
      if (polling) return;
      polling = true;
      try {
        while (session) {
          let r;
          try {
            r = await fetch(`${api}?room=${encodeURIComponent(session.room)}&token=${encodeURIComponent(session.hostToken)}&v=${lastV}`, { cache: "no-store" });
          } catch (_) {
            setStatus(false);
            await new Promise((res) => setTimeout(res, 2000));
            continue;
          }
          if (r.status === 404 || r.status === 403) {
            // La sala caducó (o el servidor la perdió): empezamos una nueva.
            // Los móviles tendrán que volver a emparejarse.
            const hadPanel = !!panel;
            dropSession();
            await ensureRoom().catch(() => {});
            if (hadPanel) { closePanel(); openPanel(); }
            return;
          }
          if (!r.ok) { setStatus(false); await new Promise((res) => setTimeout(res, 2000)); continue; }
          const st = await r.json();
          if (lastV === -1) lastCmd = st.cmd ? st.cmd.id : null;   // ignora órdenes anteriores a abrir
          lastV = st.v;
          if (st.cmd && st.cmd.id !== lastCmd) { lastCmd = st.cmd.id; apply(st.cmd); }
          if (st.controllers > controllers && panel) closePanel();   // acaba de entrar un móvil
          controllers = st.controllers;
          setStatus(true);
        }
      } finally { polling = false; }
    }

    function publish(order) {
      if (!session) return;
      post({ type: "state", room: session.room, token: session.hostToken, order }).catch(() => {});
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

    async function revoke() {
      if (!session) return;
      try { await post({ type: "revoke", room: session.room, token: session.hostToken }); controllers = 0; setStatus(true); }
      catch (_) {}
      if (panel) openPanel();
    }

    if (session || qs.get("remote") === "1") ensureRoom().catch(() => setStatus(false));
    return { publish, togglePanel, revoke };
  })();

  window.addEventListener("hashchange", () => load(currentIndex()));
  load(currentIndex());
})();
