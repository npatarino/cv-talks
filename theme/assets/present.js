// Presentation mode · fit 1920×1080 to viewport preserving 16:9.
// Keys: P toggle present · F fullscreen + present · Esc exit · ← → navigate.
//
// Sin animaciones: ni streaming text en headings ni transiciones entre slides.
// La navegación es un cambio de location directo.
(function () {
  const slide = document.querySelector("section.slide");
  if (!slide) return;

  // embedded = rendered inside the /deck/ iframe · parent handles chrome & nav.
  const params = new URLSearchParams(location.search);
  const EMBEDDED = params.get("embedded") === "1";

  const BASE_W = 1920;
  const BASE_H = 1080;

  function enterPresent() {
    document.body.classList.add("presenting");
    requestAnimationFrame(() => requestAnimationFrame(fit));
  }
  function exitPresent() {
    document.body.classList.remove("presenting");
    requestAnimationFrame(() => requestAnimationFrame(fit));
  }
  function togglePresent() {
    document.body.classList.contains("presenting") ? exitPresent() : enterPresent();
  }

  function fit() {
    if (!document.body.classList.contains("slide-page")) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // contain · limiting side wins → letterbox 16:9.
    const scale = Math.min(vw / BASE_W, vh / BASE_H);
    const scaledW = BASE_W * scale;
    const scaledH = BASE_H * scale;
    const offsetX = (vw - scaledW) / 2;
    const offsetY = (vh - scaledH) / 2;
    slide.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    document.body.classList.add("fitted");
  }

  // Auto-fit content · si algún texto "primario" se desborda horizontalmente del
  // canvas 1920×1080, escala TODO el texto de la slide por la misma proporción.
  // Aplicar el mismo factor a todos los tamaños mantiene la jerarquía: un título
  // que se reduce 25% mueve su "note"/"sub"/"cite" otro 25% también, así la
  // diferencia relativa entre niveles tipográficos sigue siendo la misma.
  //
  // Selectores PRIMARY → los que típicamente generan overflow (títulos display,
  // stats grandes, conceptos shift, citas).
  // Selectores ALL → todos los elementos con font-size propio que hay que tocar
  // para mantener la jerarquía completa.
  const AUTOFIT_PRIMARY = "h1, h2, .big, .new, .old, q, .pct, .anchor, .items, .display-word";
  const AUTOFIT_ALL = [
    "h1", "h2", "h3", "h4", ".big", ".pct", ".ex", ".note", ".sub", ".cite",
    "q", ".new", ".old", ".anchor", ".items", ".items .it", ".line",
    ".who", ".role", ".kicker", ".deck", ".eb", ".src", ".foot",
    ".t", ".d", ".body", ".eyebrow", ".lede", "p", "li", "dt", "dd",
  ].join(", ");
  function autoFitContent() {
    // Reset any previous autofit (re-runs after variant cycle / font load).
    slide.querySelectorAll("[data-autofit]").forEach((el) => {
      el.style.fontSize = "";
      el.removeAttribute("data-autofit");
    });
    // Ancho útil = ancho del slide menos su padding lateral.
    const cs = getComputedStyle(slide);
    const pad = parseFloat(cs.paddingLeft || 0) + parseFloat(cs.paddingRight || 0);
    const maxWidth = slide.clientWidth - pad;
    if (maxWidth <= 0) return;

    let worstRatio = 1;
    slide.querySelectorAll(AUTOFIT_PRIMARY).forEach((el) => {
      const w = el.scrollWidth;
      if (w > maxWidth) {
        const r = w / maxWidth;
        if (r > worstRatio) worstRatio = r;
      }
    });
    if (worstRatio <= 1) return;
    // Piso de 0.55 — más abajo el texto se vuelve ilegible; mejor que el contenido
    // se corte que renderizar al 30% del tamaño.
    const fit = Math.max(0.55, 1 / worstRatio);
    slide.querySelectorAll(AUTOFIT_ALL).forEach((el) => {
      const sz = parseFloat(getComputedStyle(el).fontSize);
      if (!sz) return;
      el.style.fontSize = (sz * fit).toFixed(2) + "px";
      el.setAttribute("data-autofit", "1");
    });
  }

  async function toggleFullscreen() {
    if (!document.body.classList.contains("presenting")) enterPresent();
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (_) {
      // ignore · browser may block fullscreen; present mode still works.
    }
  }

  // Navigation · reads manifest injected by the layout.
  const order = Number(document.body.dataset.slideOrder || 0);
  const allOrders = (window.__SLIDES__ || []).map((s) => s.order);
  function goto(delta) {
    const idx = allOrders.indexOf(order);
    if (idx === -1) return;
    const next = allOrders[idx + delta];
    if (next == null) return;
    const target = window.__SLIDES__.find((s) => s.order === next);
    if (!target) return;
    // Forward → arranca el próximo slide con 1 item visible.
    // Backward → arranca con todos visibles (← luego oculta desde el final).
    const params = new URLSearchParams();
    params.set("reveal", delta < 0 ? "full" : "1");
    window.location.href = target.url + "?" + params.toString();
  }

  function gotoIndex(idx, delta) {
    if (!window.__SLIDES__ || !window.__SLIDES__[idx]) return;
    const target = window.__SLIDES__[idx];
    const params = new URLSearchParams();
    params.set("reveal", delta < 0 ? "full" : "1");
    window.location.href = target.url + "?" + params.toString();
  }

  function navigateToFirst() {
    if (EMBEDDED) {
      try {
        window.parent.postMessage({ type: "navToFirst" }, "*");
      } catch (_) {}
    } else if (window.__SLIDES__ && window.__SLIDES__.length) {
      gotoIndex(0, 1);
    }
  }

  function navigateToLast() {
    if (EMBEDDED) {
      try {
        window.parent.postMessage({ type: "navToLast" }, "*");
      } catch (_) {}
    } else if (window.__SLIDES__ && window.__SLIDES__.length) {
      gotoIndex(window.__SLIDES__.length - 1, 1);
    }
  }

  // Progressive reveal · items de listas que se descubren uno por uno con → / ←.
  // Aplica a los slides de tipo big-list (numeric, bullets, checklist, glossary).
  // Si el slide no tiene items reveables, las funciones devuelven false y la
  // navegación procede normalmente.
  function getRevealItems() {
    return slide.querySelectorAll(
      ".s-big-list ol > li, .s-big-list ul > li, .s-big-list dl.glossary > .term, .s-word-cloud .word, .revealable"
    );
  }
  function initReveal() {
    const items = getRevealItems();
    if (!items.length) return;
    const param = new URLSearchParams(location.search).get("reveal");
    let shown;
    if (param === null || param === "full" || param === "") {
      shown = items.length; // default: todos visibles (gallery, standalone, URL compartida)
    } else {
      const n = parseInt(param, 10);
      shown = isFinite(n) ? Math.max(0, Math.min(items.length, n)) : items.length;
    }
    items.forEach((el, i) => {
      if (i < shown) el.removeAttribute("data-reveal-hidden");
      else el.setAttribute("data-reveal-hidden", "");
    });
  }
  function tryReveal(delta) {
    const items = getRevealItems();
    if (!items.length) return false;
    const shown = [...items].filter((el) => !el.hasAttribute("data-reveal-hidden")).length;
    const next = shown + delta;
    if (next < 1 || next > items.length) return false; // borde · que navegue el caller
    items.forEach((el, i) => {
      if (i < next) el.removeAttribute("data-reveal-hidden");
      else el.setAttribute("data-reveal-hidden", "");
    });
    return true;
  }

  // Variant cycling · `v` recorre los variants definidos en _data/templates.js.
  // Swap completo, no solo tipografía: clase del variant + data-recipe + critical-fg-*,
  // así el slide cambia colores (y todo lo que driva el recipe) igual que los
  // thumbnails de la galería renderizan cada variant con su propio recipe.
  // Limitación conocida: el markup de cada variant no muta — quotes con avatar
  // (testimonial) o stats con multiplier pueden verse incompletos al pasar por
  // ahí. Es una herramienta de preview, no un editor.
  const tplInfo = (window.__TEMPLATE_INFO__ || {})[window.__TEMPLATE__];
  const variants = tplInfo && tplInfo.variants ? tplInfo.variants : [];
  let currentVariantIdx = Math.max(0, variants.findIndex((v) => v.name === window.__VARIANT__));
  const hud = document.getElementById("variant-hud");
  let hudTimer = null;
  function showHud(text) {
    if (!hud) return;
    hud.textContent = text;
    hud.classList.add("show");
    clearTimeout(hudTimer);
    hudTimer = setTimeout(() => hud.classList.remove("show"), 2200);
  }
  function cycleVariant() {
    if (variants.length < 2) { showHud("sin variantes"); return; }
    const prev = variants[currentVariantIdx];
    currentVariantIdx = (currentVariantIdx + 1) % variants.length;
    const next = variants[currentVariantIdx];
    // Swap variant class (.<name> en .slide, excepto "default" que no añade clase).
    if (prev.name !== "default") slide.classList.remove(prev.name);
    if (next.name !== "default") slide.classList.add(next.name);
    // Swap recipe — fuerza el cambio de paleta vía CSS [data-recipe="…"].
    if (next.recipe) slide.setAttribute("data-recipe", next.recipe);
    // Swap critical-fg-* class (algunos variants overridean em/warn a plasma).
    if (prev.criticalFg) slide.classList.remove("critical-fg-" + prev.criticalFg);
    if (next.criticalFg) slide.classList.add("critical-fg-" + next.criticalFg);
    showHud(`variant ${currentVariantIdx + 1}/${variants.length} · ${next.name}`);
    requestAnimationFrame(() => requestAnimationFrame(() => { fit(); autoFitContent(); }));
  }

  function onKey(e) {
    if (e.key === "p" || e.key === "P") { togglePresent(); e.preventDefault(); }
    else if (e.key === "f" || e.key === "F") { if (!EMBEDDED) toggleFullscreen(); e.preventDefault(); }
    else if (e.key === "v" || e.key === "V") { cycleVariant(); e.preventDefault(); }
    else if (e.key === "q" || e.key === "Q" || e.key === "Escape") {
      // Q / Esc · quit presentation. Cuando estamos embebidos en el deck-player,
      // deck.js maneja la navegación de vuelta a la TOC. Standalone sube un nivel.
      exitPresent();
      if (!EMBEDDED) location.href = "../";
      e.preventDefault();
    }
    else if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(e.key)) {
      if (!tryReveal(+1)) navigate(+1);
      e.preventDefault();
    }
    else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) {
      if (!tryReveal(-1)) navigate(-1);
      e.preventDefault();
    }
    else if (e.key === "Home") {
      navigateToFirst();
      e.preventDefault();
    }
    else if (e.key === "End") {
      navigateToLast();
      e.preventDefault();
    }
  }
  window.addEventListener("keydown", onKey);
  document.addEventListener("keydown", onKey);

  // Touch navigation · tap halves + horizontal swipe.
  // En embedded, lo reenviamos al parent para que deck.js cambie el iframe src.
  // En backward, el parent abre el próximo slide con `?reveal=full` para que ←
  // siga ocultando items desde el final.
  function navigate(delta) {
    if (EMBEDDED) {
      try {
        const msg = { type: "nav", delta };
        if (delta < 0) msg.reveal = "full";
        window.parent.postMessage(msg, "*");
      } catch (_) {}
    } else {
      goto(delta);
    }
  }
  let tStartX = 0, tStartY = 0, tStartT = 0, tMoved = false;
  const SWIPE_THRESHOLD = 50;
  const TAP_MAX_MOVE = 10;
  const TAP_MAX_TIME = 400;
  window.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    tStartX = e.touches[0].clientX;
    tStartY = e.touches[0].clientY;
    tStartT = Date.now();
    tMoved = false;
  }, { passive: true });
  window.addEventListener("touchmove", (e) => {
    if (e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - tStartX;
    const dy = e.touches[0].clientY - tStartY;
    if (Math.hypot(dx, dy) > TAP_MAX_MOVE) tMoved = true;
  }, { passive: true });
  window.addEventListener("touchend", (e) => {
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - tStartX;
    const dy = t.clientY - tStartY;
    const dt = Date.now() - tStartT;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (absDx > SWIPE_THRESHOLD && absDx > absDy) {
      const delta = dx < 0 ? +1 : -1;
      if (!tryReveal(delta)) navigate(delta);
      return;
    }
    if (!tMoved && dt < TAP_MAX_TIME) {
      const target = e.target;
      if (target.closest && target.closest("a, button, input, textarea, select, [role=button]")) return;
      const delta = t.clientX < window.innerWidth / 2 ? -1 : +1;
      if (!tryReveal(delta)) navigate(delta);
    }
  }, { passive: true });

  // When embedded, re-fit if parent toggles fullscreen (iframe size changes).
  if (EMBEDDED) {
    window.addEventListener("message", (e) => {
      if (e.data && e.data.type === "parent-fullscreen-change") {
        requestAnimationFrame(() => requestAnimationFrame(fit));
      }
    });
  }
  document.addEventListener("fullscreenchange", () => {
    requestAnimationFrame(() => requestAnimationFrame(fit));
  });
  window.addEventListener("resize", fit);

  // Initial fit · sync before first paint (script runs at end of body, slide exists).
  fit();

  // Estado inicial del reveal antes de medir, así autoFitContent considera solo
  // los items efectivamente visibles para calcular si hay overflow.
  initReveal();

  // Auto-fit · esperar a que las fonts (CHANEY, Scilla, etc.) estén cargadas
  // antes de medir, sino el cálculo se hace con la métrica de la fuente fallback
  // y queda mal cuando llega el .otf. document.fonts.ready resuelve en cuanto
  // todas las fonts del documento están listas (o inmediatamente si no hay).
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(autoFitContent);
  } else {
    autoFitContent();
  }

  if (new URLSearchParams(location.search).get("present") === "1") enterPresent();
})();
