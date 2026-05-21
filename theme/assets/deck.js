// Deck mode · single page que cambia slides cambiando el src del iframe.
// Mantiene fullscreen entre slides (el iframe cambia, la página no).
//
// Sin animaciones: no hay transición type/un-type entre slides — solo swap directo
// del src del iframe.
(function () {
  const slides = window.__SLIDES__ || [];
  const frame = document.getElementById("deck-frame");
  const hud = document.getElementById("deck-hud");

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
      reveal = "0";
    }
    params.set("reveal", reveal);
    frame.src = s.url + "?" + params.toString();
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
    if (e.key === "ArrowRight" || e.key === "ArrowLeft" || e.key === " ") {
      // Arrows/space: forward al iframe para que su present.js decida si
      // revela el próximo item o si navega (vía postMessage de vuelta).
      const win = frame.contentWindow;
      if (win) win.dispatchEvent(new KeyboardEvent("keydown", { key: e.key }));
      e.preventDefault();
    }
    else if (e.key === "f" || e.key === "F" || e.key === "p" || e.key === "P") { toggleFullscreen(); e.preventDefault(); }
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

  window.addEventListener("hashchange", () => load(currentIndex()));
  load(currentIndex());
})();
