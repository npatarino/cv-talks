---
template: cover
recipe: canvas-quiet
label: cover
variant: default
fields:
  bg_image:
    meta: Image_Background
    content: |
      <!-- ───────── Supernova background ───────── -->
      <div id="supernova-bg" style="position:absolute;inset:0;width:100%;height:100%;overflow:hidden"></div>
      <script>
      (function () {
      var COLOR_BG = [13, 17, 23];
      var COLOR_DOT = [255, 255, 255];
      var COLOR_RED = [165, 18, 14];
      var MOUNT = document.getElementById('supernova-bg');
      if (!MOUNT) return;
      // Eleventy's dev server live-reloads by diffing the DOM (no full page
      // reload), which re-runs this inline script. Without tearing down the
      // previous run we'd stack a new canvas + ResizeObserver + rAF loop on
      // every rebuild — a memory + CPU leak that drags the whole machine down.
      if (MOUNT.__supernovaCleanup) MOUNT.__supernovaCleanup();
      var RAMP_MS = 22000, MIN_COUNT = 14, MAX_COUNT = 300, HOLD_MS = 900;
      var COLLAPSE_MS = 2600, RED_HOLD_MS = 1500;
      var CYCLE_MS = RAMP_MS + HOLD_MS + COLLAPSE_MS + RED_HOLD_MS;
      var SPEED_BASE = 0.22, SPEED_GAIN = 4.4, SPEED_CAP = 2.0;
      var BG = { r: COLOR_BG[0], g: COLOR_BG[1], b: COLOR_BG[2] };
      function lerp(a, b, t) { return a + (b - a) * t; }
      function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
      function pColor(p, t) {
      var fr = COLOR_RED[0], fg = COLOR_RED[1] + p.warm * 70, fb = COLOR_RED[2] + p.warm * 40;
      return {
      r: Math.round(lerp(COLOR_DOT[0], fr, t)),
      g: Math.round(lerp(COLOR_DOT[1], fg, t)),
      b: Math.round(lerp(COLOR_DOT[2], fb, t))
      };
      }
      MOUNT.style.background = 'rgb(' + BG.r + ',' + BG.g + ',' + BG.b + ')';
      if (getComputedStyle(MOUNT).position === 'static') MOUNT.style.position = 'relative';
      MOUNT.style.overflow = 'hidden';
      var canvas = document.createElement('canvas');
      canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
      MOUNT.appendChild(canvas);
      var ctx = canvas.getContext('2d', { alpha: false });
      // In the editor preview and gallery thumbnails the slide is embedded in a
      // same-site, non-sandboxed iframe, so it shares the editor's main thread.
      // The full rAF particle sim would peg that thread and freeze the whole
      // editor UI (no scroll, no focus). Those contexts load the slide with NO
      // query params, whereas the real presentation always carries
      // ?present=1 / &embedded=1 — so detect "embedded but not presenting" and
      // render a cheap static starfield instead (no rAF, no per-frame work).
      var inEditorPreview = (window.self !== window.top) &&
      !/[?&](present|embedded)=/.test(location.search);
      if (inEditorPreview) {
      var drawStatic = function () {
      var r = MOUNT.getBoundingClientRect();
      var d = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(1, Math.floor(r.width)), h = Math.max(1, Math.floor(r.height));
      canvas.width = Math.floor(w * d); canvas.height = Math.floor(h * d);
      ctx.setTransform(d, 0, 0, d, 0, 0);
      ctx.fillStyle = 'rgb(' + BG.r + ',' + BG.g + ',' + BG.b + ')';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      for (var i = 0; i < 70; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, 0.6 + Math.random() * 1.4, 0, 6.2832);
      ctx.fill();
      }
      };
      drawStatic();
      var roStatic = new ResizeObserver(drawStatic); roStatic.observe(MOUNT);
      MOUNT.__supernovaCleanup = function () {
      roStatic.disconnect();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      MOUNT.__supernovaCleanup = null;
      };
      return;
      }
      var W = 0, H = 0, dpr = 1, particles = [], startTime = null, raf = null, running = true;
      function makeParticle() {
      return {
      x: Math.random() * W, y: Math.random() * H, angle: Math.random() * Math.PI * 2,
      baseSpeed: SPEED_BASE * (0.55 + Math.random() * 0.9),
      size: 0.9 + Math.random() * 1.3, warm: Math.random(), glow: 0.55 + Math.random() * 0.4
      };
      }
      function syncCount(ft) {
      var target = Math.round(MIN_COUNT + (MAX_COUNT - MIN_COUNT) * easeInOut(ft));
      while (particles.length < target) particles.push(makeParticle());
      if (particles.length > target) particles.length = target;
      }
      var mouse = { x: -9999, y: -9999, active: false };
      canvas.addEventListener('mousemove', function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.active = true;
      });
      canvas.addEventListener('mouseleave', function () { mouse.active = false; mouse.x = mouse.y = -9999; });
      canvas.addEventListener('click', function () { startTime = performance.now(); });
      function resize() {
      var r = MOUNT.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, Math.floor(r.width)); H = Math.max(1, Math.floor(r.height));
      canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = 'rgb(' + BG.r + ',' + BG.g + ',' + BG.b + ')';
      ctx.fillRect(0, 0, W, H);
      }
      var ro = new ResizeObserver(resize); ro.observe(MOUNT); resize(); syncCount(0);
      function stop() {
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', stop);
      if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
      MOUNT.__supernovaCleanup = null;
      }
      function onVisibility() {
      if (document.hidden) {
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      } else if (running && !raf) {
      startTime = null; raf = requestAnimationFrame(frame);
      }
      }
      MOUNT.__supernovaCleanup = stop;
      document.addEventListener('visibilitychange', onVisibility);
      window.addEventListener('pagehide', stop);
      function frame(now) {
      if (!running) return;
      if (startTime === null) startTime = now;
      var elapsed = now - startTime;
      if (elapsed > CYCLE_MS) {
      startTime = now; particles.length = 0; syncCount(0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgb(' + BG.r + ',' + BG.g + ',' + BG.b + ')';
      ctx.fillRect(0, 0, W, H); raf = requestAnimationFrame(frame); return;
      }
      var collapseStart = RAMP_MS + HOLD_MS;
      var collapse = elapsed > collapseStart ? Math.min(1, (elapsed - collapseStart) / COLLAPSE_MS) : 0;
      var sp = (elapsed - collapseStart) / COLLAPSE_MS;
      var ft = Math.min(1, elapsed / RAMP_MS);
      var breathe = (ft >= 1 && collapse === 0) ? 0.04 * Math.sin(now / 1400) : 0;
      var t = Math.min(1, Math.max(0, ft + breathe));
      syncCount(ft);
      var speedMul = 1 + SPEED_GAIN * Math.pow(t, 5);
      var trailAlpha = lerp(0.20, 0.075, t);
      if (collapse > 0) trailAlpha = lerp(0.075, 0.045, Math.min(1, collapse * 1.6));
      var fr = BG.r, fg = BG.g, fb = BG.b;
      if (collapse > 0) {
      trailAlpha = lerp(0.14, 0.02, Math.min(1, Math.max(0, (sp - 0.45) / 0.5)));
      if (sp > 1.0) {
      var kk = Math.min(1, (sp - 1.0) / 0.45);
      fr = COLOR_RED[0]; fg = COLOR_RED[1]; fb = COLOR_RED[2];
      trailAlpha = lerp(0.02, 0.6, kk);
      }
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(' + fr + ',' + fg + ',' + fb + ',' + trailAlpha + ')';
      ctx.fillRect(0, 0, W, H);
      var jitter = lerp(0.012, 0.06, t);
      function wander(p) {
      p.angle += (Math.random() - 0.5) * jitter;
      var spd = p.baseSpeed * speedMul; if (spd > SPEED_CAP) spd = SPEED_CAP;
      var vx = Math.cos(p.angle) * spd, vy = Math.sin(p.angle) * spd;
      if (mouse.active) {
      var dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy, R = 130;
      if (d2 < R * R) { var d = Math.sqrt(d2) || 1, f = (1 - d / R) * 0.9; vx += dx / d * f; vy += dy / d * f; }
      }
      p.x += vx; p.y += vy;
      if (p.x < 0) { p.x = 0; p.angle = Math.PI - p.angle; } else if (p.x > W) { p.x = W; p.angle = Math.PI - p.angle; }
      if (p.y < 0) { p.y = 0; p.angle = -p.angle; } else if (p.y > H) { p.y = H; p.angle = -p.angle; }
      }
      for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (collapse === 0) { p.anchored = false; wander(p); }
      else {
      if (!p.anchored) { p.det = Math.random() * 0.5; p.anchored = true; }
      wander(p);
      var FR = COLOR_RED[0], FG = Math.round(COLOR_RED[1] + p.warm * 70), FB = Math.round(COLOR_RED[2] + p.warm * 40);
      var lt = sp - p.det, CHARGE = 0.12, IMP = 0.04, EXPL = CHARGE + IMP;
      if (lt < 0) {
      var pre = Math.min(1, Math.max(0, 1 + lt * 2.2));
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(' + FR + ',' + FG + ',' + FB + ',' + (0.45 + 0.35 * pre) + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 6.2832); ctx.fill();
      } else if (lt < CHARGE) {
      var k = lt / CHARGE, bright = k * k, glowR = p.size + bright * 14, a = 0.4 + 0.6 * bright;
      var ig = Math.round(FG + bright * 30), ib = Math.round(FB + bright * 20);
      ctx.globalCompositeOperation = 'lighter';
      var g1 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
      g1.addColorStop(0, 'rgba(' + FR + ',' + ig + ',' + ib + ',' + a + ')');
      g1.addColorStop(0.4, 'rgba(' + FR + ',' + FG + ',' + FB + ',' + a * 0.5 + ')');
      g1.addColorStop(1, 'rgba(' + FR + ',' + FG + ',' + FB + ',0)');
      ctx.fillStyle = g1; ctx.beginPath(); ctx.arc(p.x, p.y, glowR, 0, 6.2832); ctx.fill();
      ctx.fillStyle = 'rgba(' + FR + ',' + ig + ',' + ib + ',' + Math.min(1, 0.5 + bright) + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1 + bright * 0.7), 0, 6.2832); ctx.fill();
      } else if (lt < EXPL) {
      var s = 1 - (lt - CHARGE) / IMP, sz = Math.max(0.5, (p.size + 14) * s * s * s);
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(' + FR + ',' + (FG + 50) + ',' + (FB + 35) + ',1)';
      ctx.beginPath(); ctx.arc(p.x, p.y, sz, 0, 6.2832); ctx.fill();
      } else {
      var eg = lt - EXPL, R2 = p.size + eg * Math.hypot(W, H) * 0.95;
      ctx.globalCompositeOperation = 'source-over';
      var g2 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, R2);
      g2.addColorStop(0, 'rgba(' + FR + ',' + (FG + 12) + ',' + (FB + 8) + ',0.5)');
      g2.addColorStop(0.7, 'rgba(' + FR + ',' + FG + ',' + FB + ',0.32)');
      g2.addColorStop(1, 'rgba(' + FR + ',' + FG + ',' + FB + ',0)');
      ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(p.x, p.y, R2, 0, 6.2832); ctx.fill();
      if (eg < 0.06) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(' + FR + ',' + (FG + 60) + ',' + (FB + 40) + ',' + (1 - eg / 0.06) + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 1.6, 0, 6.2832); ctx.fill();
      }
      }
      continue;
      }
      var c = pColor(p, t), al = p.glow * (0.7 + 0.3 * t);
      ctx.fillStyle = 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + Math.min(1, al + 0.2) + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 6.2832); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);
      })();
      </script>
  logo: { content: '<img src="/talks/decks/productividad/assets/logo-commit-26.png" alt="Commit 26">', meta: Image_Logo }
  title: { content: El mito de la productividad tóxica, meta: Title_Hero }
  deck: { content: "", meta: Subtitle_Text }
---
