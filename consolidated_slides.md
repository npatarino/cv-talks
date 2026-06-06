# Presentación: Productividad (Consolidada)

Este documento contiene la estructura completa y el contenido de todas las slides de la presentación, incluyendo notas de orador y campos de datos. Diseñado para ser procesado por una IA para refinar, acortar, cerrar o dar retroalimentación a la presentación.

## Estructura de la Presentación (ANSVA)

- **[Slide 1 - 6] Atención** (Mi historia que refleja mi mala perspectiva.)
- **[Slide 7 - 34] Necesidad** (Los tres problemas principales que quiero mostrar.)
  - **[Slide 13 - 16] P1: Malas métricas** (Perseguimos malas métricas.)
  - **[Slide 17 - 23] P2: Código no es activo** (El código no es un activo.)
  - **[Slide 24 - 33] P3: Sos un héroe** (Sos un héroe.)
  - **[Slide 34 - 34] PS: Problems summary** (Resumen de los problemas.)
- **[Slide 35 - 63] Solución** (Cómo solucionamos los problemas presentados.)
  - **[Slide 35 - 47] S1: Medir mejor** (Medir mejor / DORA / SPACE.)
  - **[Slide 48 - 52] S2: Automatización** (Automatización y pago de deuda.)
  - **[Slide 53 - 63] S3: Reducir protagonismo** (Reducir protagonismo y delegar.)
- **[Slide 64 - 75] Visualización** (Cómo sería la vida si no aplico la solución y cómo sería si sí lo aplico.)
- **[Slide 76 - 82] Acción** (Qué quiero accionar en la audiencia.)

---

## Slide 1: `cover`
- **Sección narrativa**: A1: Atención
- **Template**: `cover` | **Recipe**: `canvas-quiet` | **Variant**: `default` | **Label**: `cover`

### Campos/Textos:
- **bg_image**: <!-- ───────── Supernova background ───────── -->
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

- **logo**: <img src="/talks/decks/productividad/assets/logo-commit-26.png" alt="Commit 26">
- **title**: El mito de la productividad tóxica
- **deck**: *(vacío)*

### Notas del Orador:
*(Sin notas)*

---

## Slide 2: `viernes-1530`
- **Sección narrativa**: A1: Atención
- **Template**: `big-concept` | **Recipe**: `energy-loud` | **Variant**: `disclaimer` | **Label**: `Portada · Viernes 15:30`

### Campos/Textos:
- **icon**: <img src="/talks/decks/productividad/assets/clock.svg" alt="" class="title-icon">
- **title**: <strong>VIERNES</strong> <em>15:30</em>
- **note**: *(vacío)*

### Notas del Orador:
> Viernes, 15:30 de la tarde, ya estaba contestando los últimos mensajes de Slack.
> Después de una semana dura de trabajo, donde no paré de tener reuniones, de desbloquear a muchos equipos, de picar mucho código, estaba agotadísimo, pero la verdad que estaba muy contento.

---

## Slide 3: `feedback-alegre`
- **Sección narrativa**: A1: Atención
- **Template**: `icon` | **Recipe**: `cool-fresh` | **Variant**: `default` | **Label**: `Feedback alegre`

### Items de Lista:
1. *(vacío)*

### Notas del Orador:
> Estaba muy contento porque tenía la sensación esa que todos conocemos del trabajo bien hecho, de decir, esta semana la rompí, puedo cerrar el equipo con orgullo e irme a disfrutar de mi familia.

---

## Slide 4: `cuaderno`
- **Sección narrativa**: A1: Atención
- **Template**: `icon` | **Recipe**: `energy-loud` | **Variant**: `default` | **Label**: `Cuaderno · notas`

### Items de Lista:
1. *(vacío)*

### Notas del Orador:
> Igual una cosa que yo suelo hacer siempre, es más lo hago todos los días, y lo súper recomiendo es tener una bitácora, un diario personal en el que antes de irme cada día, hago un mini resumen de lo que hice, y después los viernes hago un resumen de cómo fue mi semana. Somos malos, o por lo menos yo soy malo, a la hora de acordarme de todas las cosas que hago.
> Y muchas veces hay conversaciones que levanto, puntapiés iniciales de alguna iniciativa, seguimiento de cosas que después se quedan en el olvido o métricas que no me acuerdo haber sacado, y todo eso es una información súper valiosa cuando llegan las performance review. Porque en las performance reviews no valoramos nuestro trabajo con sensaciones ni con compromiso, lo hacemos con datos. Y si no los tenés, es como si no existieran.
> Entonces estaba yo haciendo mi resumen semanal, y miré un montón de reuniones, pero la mayoría de esas que podrían haber sido un email, los equipos que desbloqueé fue porque querían hacer un hotfix y no sabían cómo hacerlo, así que los apoyé, gran parte del código que había hecho era porque me había comprometido a hacer unas tareas y las hice porque estaba siendo cuello de botella de compañeros, por lo que en el cómputo global.

---

## Slide 5: `error`
- **Sección narrativa**: A1: Atención
- **Template**: `icon` | **Recipe**: `critical` | **Variant**: `default` | **Label**: `Error · plasma`

### Items de Lista:
1. *(vacío)*

### Notas del Orador:
> No había sido una buena semana.
> Había trabajado mucho, sí. Había movido tickets, había movido tickets, había movido PRs, pero no había generado impacto.
> Y este es el mito de la productividad tóxica.

---

## Slide 6: `cube`
- **Sección narrativa**: A1: Atención
- **Template**: `icon` | **Recipe**: `canvas-quiet` | **Variant**: `default` | **Label**: `Cubo Animado`

### Items de Lista:
1. *(vacío)*

### Notas del Orador:
> Si yo les pregunto qué ven acá, estoy seguro que la mayoría me va a decir un cuadrado, y tendría todo el sentido del mundo, porque es un cuadrado. Pero como todo en esta vida es cuestión de perspectiva, porque también podría ser un cubo, y seguiríamos teniendo razón.
> Y con esto quiero que entremos a esta charla, dispuestos a cambiar nuestra perspectiva sobre la productividad.

---

## Slide 7: `mas-productividad`
- **Sección narrativa**: N: Necesidad
- **Template**: `word-cloud` | **Recipe**: `critical` | **Variant**: `default` | **Label**: `+ Productividad · señales falsas`

### Campos/Textos:
- **words**: + Chats, + Presión, + Commits, + Tickets, + Horas, + Reuniones, + Documentos, + Builds, + Coverage, + Emails, + Calls

### Notas del Orador:
> Porque el sistema, LinkedIn, seamos sinceros, hasta nosotros mismos nos forzamos a mirar la productividad como movimiento, como esfuerzo, como actividad.
> Creemos que somos más productivos cuantos más chats respondamos, cuanta más presión soportemos, cuantos más tickets hagamos, cuantas más horas trabajemos, cuantas más reuniones soportemos, cuántos más documentos escribamos, cuantas más builds, más coverage, más emails, más calls, más, más, más.
> Y esto lo único que nos lleva, es a un claro

---

## Slide 8: `burnout`
- **Sección narrativa**: N: Necesidad
- **Template**: `icon` | **Recipe**: `critical` | **Variant**: `default` | **Label**: `burnout`

### Items de Lista:
1. *(vacío)*

### Notas del Orador:
> Burnout.
> Nos cuesta admitirlo, pero muchos de los que estamos acá, estoy casi seguro que estamos al borde del burnout y no lo sabemos, o no lo queremos ver porque nos dejamos llevar.
> Yo cuando miro para atrás veo un montón de momentos en los que estuve en burnout, pero no lo sabía, y muchas de esas veces, yo creía que estaba siendo súper productivo.
> Por eso me gustaría cambiar la definición de lo que yo creo que es productividad.

---

## Slide 9: `recurring-quote-1`
- **Sección narrativa**: N: Necesidad
- **Template**: `quote` | **Recipe**: `cool-fresh` | **Variant**: `default` | **Label**: `Cita recurrente · productividad no es hacer más (I)`

### Campos/Textos:
- **quote**: Productividad no es <em>hacer más</em>.<br>Es generar el mayor impacto con el <em>menor mantenimiento</em>.
- **who**: *(vacío)*

### Notas del Orador:
*(Sin notas)*

---

## Slide 10: `esfuerzo-valor`
- **Sección narrativa**: N: Necesidad
- **Template**: `concept-shift` | **Recipe**: `critical` | **Variant**: `default` | **Label**: `Esfuerzo → Valor`

### Campos/Textos:
- **old**: Esfuerzo
- **new**: Valor

### Notas del Orador:
> El esfuerzo no es valor que aportemos a nuestros usuarios.

---

## Slide 11: `movimiento-impacto`
- **Sección narrativa**: N: Necesidad
- **Template**: `concept-shift` | **Recipe**: `critical` | **Variant**: `default` | **Label**: `Movimiento → Impacto`

### Campos/Textos:
- **old**: Movimiento
- **new**: Impacto

### Notas del Orador:
> El movimiento no es impacto que estamos generando dentro de la compañía.

---

## Slide 12: `actividad-productividad`
- **Sección narrativa**: N: Necesidad
- **Template**: `concept-shift` | **Recipe**: `critical` | **Variant**: `default` | **Label**: `Actividad → Productividad`

### Campos/Textos:
- **old**: Actividad
- **new**: Productividad

### Notas del Orador:
> La actividad no es productividad.

---

## Slide 13: `correr-detras-de-metricas`
- **Sección narrativa**: N: Necesidad -> P1: Malas métricas
- **Template**: `icon` | **Recipe**: `canvas-quiet` | **Variant**: `default` | **Label**: `Correr detrás de métricas`

### Items de Lista:
1. *(vacío)*

### Notas del Orador:
> Nos la pasamos corriendo detrás de métricas. Que eso es algo que me encanta, pero el problema es que lo hacemos detrás de las métricas equivocadas.
> Commits, Test coverage, Pull Requests... Que ojo, no digo que no sean métricas que no haya que medir, pero sólo como referencia, no como medida de productividad o medida de performance, y mucho menos como goal.

---

## Slide 14: `ley-de-goodhart-2`
- **Sección narrativa**: N: Necesidad -> P1: Malas métricas
- **Template**: `big-concept` | **Recipe**: `canvas-quiet` | **Variant**: `divider` | **Label**: `Ley de Goodhart 2`

### Campos/Textos:
- **icon**: <img src="/talks/decks/productividad/assets/icon-cobra.png" alt="" class="title-icon">
- **title**: Delhi - India

### Notas del Orador:
> En el siglo XiX, el gobierno británico tenía un problema grave en Delhi, había demasiadas cobras venenosas en las calles. Así que, aplicando la lógica más lógica, crearon un sistema de incentivos: empezaron a pagar una recompensa por cada cobra muerta que la gente les llevara.
> Y todo iba relativamente bien hasta que empezó a ir relativamente mal, al principio los números eran espectaculares, las gráficas bajaban, las métricas están en verde. La gente mataba sobras y cobraba su guita.
> Pero somos máquinas de optimizar, o bueno, de buscar la viveza criolla, la picaresca española o la Yugad india. ¿Qué empezó a hacer la gente cuando empezaban a escasear las serpientes en la ciudad?
> ¿Qué piensan que hicieron? Exacto, empezaron a criar serpientes en las casas, las criaban, las mataban y cobraban la recompensa.
> Obviamente cuando el gobierno se dio cuenta de la estafa, canceló el programa de recompensas. El problema es que los criadores soltaron todas las serpientes que ya no valían nada, y ¿qué pasó? ¿cuál fue el resultado? Bueno, Delhi terminó con más serpientes de las que tenía antes de que empezara el programa.

---

## Slide 15: `ley-de-goodhart`
- **Sección narrativa**: N: Necesidad -> P1: Malas métricas
- **Template**: `big-concept` | **Recipe**: `energy-loud` | **Variant**: `divider` | **Label**: `Ley de Goodhart`

### Campos/Textos:
- **icon**: <img src="/talks/decks/productividad/assets/icon-cobra.png" alt="" class="title-icon">
- **title**: Ley de Goodhart
- **sub**: *(vacío)*

### Notas del Orador:
> A esto, nosotros, en tecnología lo llamamos la Ley de Goodhart.

---

## Slide 16: `ley-de-goodhart-quote`
- **Sección narrativa**: N: Necesidad -> P1: Malas métricas
- **Template**: `quote` | **Recipe**: `energy-loud` | **Variant**: `default` | **Label**: `Ley de Goodhart Quote`

### Campos/Textos:
- **quote**: Cuando una métrica se convierte en el <em>objetivo principal</em>, deja de ser una buena medida.
- **who**: Charles Goodhart

### Notas del Orador:
> Hay un economista inglés, Charles Goodhart, que definió lo que Cuando una métrica se convierte en el objetivo principal, deja de ser una buena medida.
> ¿A quién no le pasó que un amigo empezó a meter tests que en realidad no testea nada, o que es inútil, pero como sube la cobertura se le deja por ahí?
> O que una tarea se divide en 5 pull requests porque eso hace que mejore tu métrica de PRs por semana.

---

## Slide 17: `activo-pasivo`
- **Sección narrativa**: N: Necesidad -> P2: Código no es activo
- **Template**: `big-concept` | **Recipe**: `energy-loud` | **Variant**: `default` | **Label**: `Activo & Pasivo financiero`

### Campos/Textos:
- **title**: ACTIVO &amp; PASIVO<br>FINANCIERO

### Notas del Orador:
> En el mundo financiero hay dos conceptos que ayudan mucho a definir la dirección del dinero, si engorda tu billetera o si la hace más flaquita.
> El activo y el pasivo, el activo puede ser no sé una casa que tenés en alquier y que te da dinerito. El pasivo es algo que te saca dinero, como no sé la hipoteca de esa casa, los gastos de mantenimiento.
> Y cuento esto no porque quiera venderles ahora una nueva criptomoneda con la que hacerse ricos, y que termina siendo una estafa piramidal. Lo hago porque históricamente...

---

## Slide 18: `codigo-activo`
- **Sección narrativa**: N: Necesidad -> P2: Código no es activo
- **Template**: `big-concept` | **Recipe**: `cool-fresh` | **Variant**: `default` | **Label**: `El código como activo`

### Campos/Textos:
- **title**: EL CÓDIGO<br>es un&nbsp;<em>ACTIVO</em>

### Notas del Orador:
> Al código de nuestros repositorios, a todo el código de una empresa lo solemos ver como un activo. Siempre pensamos que más código es más producto, y por ende más valor para la empresa.
> Por eso mismo, durante muchísimos años estuvimos midiendo el éxito en líneas de código. Tu performance estaba basada en la cantidad de líneas de código que metías.

---

## Slide 19: `codigo-pasivo`
- **Sección narrativa**: N: Necesidad -> P2: Código no es activo
- **Template**: `big-concept` | **Recipe**: `critical` | **Variant**: `disclaimer` | **Label**: `El código como pasivo`

### Campos/Textos:
- **title**: EL CÓDIGO<br>es un&nbsp;<em>PASIVO</em>
- **note**: *(vacío)*

### Notas del Orador:
> Pero a mí me gusta verlo de otra forma. Para mí, el código es un Pasivo. Cada línea que escribimos es, desde el segundo uno, código legacy. Es una superficie nueva para que aparezcan bugs, es una dependencia que hay que actualizar y es una carga cognitiva para el que venga después. El código no es el oro, el código es la hipoteca que pagamos para poder entregar valor.

---

## Slide 20: `paradoja-jevons`
- **Sección narrativa**: N: Necesidad -> P2: Código no es activo
- **Template**: `big-concept` | **Recipe**: `energy-loud` | **Variant**: `default` | **Label**: `La paradoja de Jevons`

### Campos/Textos:
- **icon**: <img src="/talks/decks/productividad/assets/mine-cart.png" alt="" class="title-icon">
- **title**: LA PARADOJA<br>DE <em>JEVONS</em>

### Notas del Orador:
> Acá es donde entra la Paradoja de Jevons.
> En 1865, después de la revolución industrial, un economista, Jevons, se dió cuenta de algo raro. Cuando las máquinas de vapor se hicieron más eficientes y consumían menos carbón, el consumo total de carbón no bajó... Al contrario, ¡Explotó! ¿Por qué? Se creía que si la máquina gasta menos, vamos a consumir menos, pero bienvenidos al mercado amigos. En lugar de producir lo mismo con menos carbón, la industria empezó a producir muchísimo más, multiplicando la producción, pero a su vez el consumo de carbón.

---

## Slide 21: `paradoja-copilot`
- **Sección narrativa**: N: Necesidad -> P2: Código no es activo
- **Template**: `big-concept` | **Recipe**: `cool-fresh` | **Variant**: `default` | **Label**: `La paradoja del Copilot`

### Campos/Textos:
- **icon**: <span class="title-icons"><img src="/talks/decks/productividad/assets/ai-anthropic.png" alt="" class="title-icon"><img src="/talks/decks/productividad/assets/ai-gemini.png" alt="" class="title-icon"></span>
- **title**: LA PARADOJA<br>DE&nbsp;<em>Claude</em>

### Notas del Orador:
> ¿Les suena?
> Nos vendieron que las herramientas como Claude o Copilot nos harían tan eficientes que generaríamos el mismo software en menos tiempo. Ilusos llegamos a creer que tendríamos los viernes libres. Pero caímos en la trampa de Jevons.
> Como ahora escribir cientos de líneas de código cuesta muy poco y se genera en segundos, la respuesta del sistema no es trabajar menos.
> La respuesta es escribir muchísimo más código, y no voy a entrar en la calidad de ese código que muchos no revisan, y lo que está pasando es que se están inundando los repositorios de software complejo e invisiblemente roto solo porque crearlo es gratis y revisarlo da pereza.

---

## Slide 22: `productividad-no-codigo`
- **Sección narrativa**: N: Necesidad -> P2: Código no es activo
- **Template**: `big-concept` | **Recipe**: `critical` | **Variant**: `prompt` | **Label**: `Productividad ≠ Código`

### Campos/Textos:
- **title**: Productividad ≠ <em>Código</em>

### Notas del Orador:
> Por eso, tenemos que romper la asociación mental de que Productividad es igual a Código. Si el código es un pasivo, la verdadera productividad no es escribir más; es lograr el mayor impacto posible escribiendo la menor cantidad de código necesaria.
> Hay una escena maravillosa en Jurassic Park donde el Dr. Ian Malcolm mira al dueño del parque y le suelta una frase que deberíamos tatuarnos en la frente...

---

## Slide 23: `scientificos-jurassic-park`
- **Sección narrativa**: N: Necesidad -> P2: Código no es activo
- **Template**: `quote` | **Recipe**: `canvas-signal` | **Variant**: `testimonial` | **Label**: `Scientíficos Jurassic Park`

### Campos/Textos:
- **initials**: <img src="/talks/decks/productividad/assets/icon-jurassic-park.png" alt="" class="title-icon">
- **quote**: Tus científicos estaban tan preocupados por saber si podían, que no se detuvieron a pensar si debían.
- **who**: Dr. Ian Malcolm
- **role**: *(vacío)*

### Notas del Orador:
> Y esto es lo que veo que está pasando mucho. Como es tan fácil y tan barato escribir código, no nos paramos a pensar si debemos hacer esa feature, o si es necesario todo el código que nos está metiendo Claude, o Codex, o GPT 5.5.
> Abrimos nuestro IDE favorito, generamos tres microservicios, metemos un par de patrones de diseño, escribimos tests que realmente no están testeando lo importante, pero eso sí, al mediodía creamos nuestra PR de 2000 líneas de código y pensamos... Qué tipo productivo que soy la pucha, qué cerca estoy de que me asciendan.
> Nos obsesionamos tanto con el 'podemos' porque la IA nos hizo rápidos, que nos olvidamos por completo si debemos.

---

## Slide 24: `terry-childs`
- **Sección narrativa**: N: Necesidad -> P3: Sos un héroe
- **Template**: `big-concept` | **Recipe**: `critical` | **Variant**: `divider` | **Label**: `Terry Childs · 2008`

### Campos/Textos:
- **title**: TERRY<br><em>CHILDS</em>
- **sub**: 2008 · San Francisco - California.

### Notas del Orador:
> No creo que nadie conozca a Terry Childs porque no es muy conocida su historia, pero sí que armó un quilombito en California a principios de los 2000.
> Terry Childs era el administrador de redes de la ciudad de San Francisco. Un tipo brillante que trabajaba muchísimo y que diseñó toda la infraestructura de la red de San Francisco, controlando incluso la red eléctrica del ayuntamiento.
> La cosa es que Terry tenía dos problemas. 1. Tenía el control absoluto y único del sistema. 2 Era una megalómano.
> Un día sus mánagers empezaron a pedirle auditorías y reportes porque sospechaban de su obsesión por el control. Lo que no gustó a Terry, y ¿qué hizo? Bueno, imagino que lo que haría cualquiera en su lugar. Se negó y cambió todas las contraseñas de la administración de la ciudad, encriptó todos los sistemas para que sólo él tuviera acceso, y metió un par de troyanos para que si alguien intentara cambiar las contraseñas borrara todo el sistema. Vamos, lo normal.

---

## Slide 25: `10m`
- **Sección narrativa**: N: Necesidad -> P3: Sos un héroe
- **Template**: `big-stat` | **Recipe**: `energy-loud` | **Variant**: `default` | **Label**: `Terry Childs · $10M de costo`

### Campos/Textos:
- **stat_number**: $10
- **stat_unit**: M
- **explanation**: *(vacío)*

### Notas del Orador:
> Terry, para sorpresa de nadie, terminó en la cárcel, pero la ciudad de San Francisco tardó unos 12 días y unos 10M de dólares en auditorías para poder recuperar el control de su infraestructura.
> Obviamente este es un ejemplo exagerado y radical, pero en nuestro mundo real, el sistema, nuestros mánagers, nuestros líderes y, principalmente, nuestro propio ego nos empujan a esto que normalmente conocemos como...

---

## Slide 26: `bus-factor`
- **Sección narrativa**: N: Necesidad -> P3: Sos un héroe
- **Template**: `big-concept` | **Recipe**: `critical` | **Variant**: `default` | **Label**: `Bus factor · definición`

### Campos/Textos:
- **icon**: <img src="/talks/decks/productividad/assets/bus.png" alt="" class="title-icon">
- **title**: BUS <em>FACTOR</em>.
- **note**: *(vacío)*

### Notas del Orador:
> El bus factor es una métrica que me encanta, porque tiene ese toque de humor negro y de realidad. ¿Cuántas personas tendrían que ser atropelladas por un autobús para que el proyecto o una iniciativa o algo se detenga por completo?

---

## Slide 27: `bus-factor-icons`
- **Sección narrativa**: N: Necesidad -> P3: Sos un héroe
- **Template**: `icon` | **Recipe**: `canvas-signal` | **Variant**: `default` | **Label**: `Bus factor · iconos`

### Items de Lista:
1. *(vacío)*
2. *(vacío)*
3. *(vacío)*
4. *(vacío)*
5. *(vacío)*
6. *(vacío)*

### Notas del Orador:
> Cuanto más bajo es el número, más frágil es el equipo. Y peor es que muchas veces, sin darnos cuenta, trabajamos para que ese número sea uno. Y ese uno somos nosotros.

---

## Slide 28: `bus-factor-icons-3`
- **Sección narrativa**: N: Necesidad -> P3: Sos un héroe
- **Template**: `icon` | **Recipe**: `canvas-signal` | **Variant**: `default` | **Label**: `Bus factor · iconos`

### Items de Lista:
1. *(vacío)*
2. *(vacío)*
3. *(vacío)*
4. *(vacío)*
5. *(vacío)*

### Notas del Orador:
> .

---

## Slide 29: `bus-factor-icons-3-2`
- **Sección narrativa**: N: Necesidad -> P3: Sos un héroe
- **Template**: `icon` | **Recipe**: `canvas-signal` | **Variant**: `default` | **Label**: `Bus factor · iconos`

### Items de Lista:
1. *(vacío)*
2. *(vacío)*
3. *(vacío)*
4. *(vacío)*

### Notas del Orador:
> .

---

## Slide 30: `bus-factor-icons-3-2-2`
- **Sección narrativa**: N: Necesidad -> P3: Sos un héroe
- **Template**: `icon` | **Recipe**: `canvas-signal` | **Variant**: `default` | **Label**: `Bus factor · iconos`

### Items de Lista:
1. *(vacío)*
2. *(vacío)*
3. *(vacío)*

### Notas del Orador:
> .

---

## Slide 31: `bus-factor-icons-2`
- **Sección narrativa**: N: Necesidad -> P3: Sos un héroe
- **Template**: `icon` | **Recipe**: `canvas-signal` | **Variant**: `default` | **Label**: `Bus factor · iconos`

### Items de Lista:
1. *(vacío)*
2. *(vacío)*

### Notas del Orador:
> Cuanto más bajo es el número, más frágil es el equipo. Y lo peor es que muchas veces, sin darnos cuenta, trabajamos para que ese número sea uno. Y ese uno seamos nosotros.
> Las propias empresas, y sobre todo nuestro propio ego, nos empujan a esa situación.
> A quién no le pasó que yo que sé, te salta una guardia un sábado a las 2 de la mañana porque hay que hacer un hotfix y sos el único que sabe cómo hacerlo, o ese componente de software que sólo vos te animás a tocar porque se puede romper todo, o ese que si alguien de arriba te dice que hay que hacer algo, vos te saltás todos los procesos para hacerlo porque sabés cómo saltarte los procesos.
> Sos el salvador.

---

## Slide 32: `heroe-capa`
- **Sección narrativa**: N: Necesidad -> P3: Sos un héroe
- **Template**: `icon` | **Recipe**: `energy-loud` | **Variant**: `default` | **Label**: `Héroe · capa`

### Items de Lista:
1. *(vacío)*

### Notas del Orador:
> Sos el centro de todos los elogios y eso es exactamente lo que nos hace creer que somos los héroes.
> Y, obviamente, tus jefes lo promueven. Te dan kudos en canales públicos, te dicen lo comprometido que estás, y eso es una bola que va girando, porque otros lo ven y piensan que así es como hay que actuar.
> Cada elogio público es un poco más de leña a la hoguera del héroe. Y cuanto más te reconocen por apagar incendios, más incentivado estás a que sigan habiendo incendios para apagar.

---

## Slide 33: `bombero-piromano`
- **Sección narrativa**: N: Necesidad -> P3: Sos un héroe
- **Template**: `big-concept` | **Recipe**: `critical` | **Variant**: `divider` | **Label**: `El bombero pirómano`

### Campos/Textos:
- **icon**: <img src="/talks/decks/productividad/assets/icon-fire.png" alt="" class="title-icon">
- **title**: EL BOMBERO<br><em>PIRÓMANO</em>.
- **sub**: *(vacío)*

### Notas del Orador:
> Y así te convertís en el bombero pirómano.
> Esa persona que, sin querer, salva los problemas que el mismo provocó.

---

## Slide 34: `problemas-summary`
- **Sección narrativa**: N: Necesidad -> PS: Problems summary
- **Template**: `icon` | **Recipe**: `critical` | **Variant**: `default` | **Label**: `Problemas - Summary`

### Items de Lista:
1. *(vacío)*
2. *(vacío)*
3. *(vacío)*

### Notas del Orador:
> Y acá está la toxicidad.
> Perseguimos métricas de vanidad que no generan impacto, sólo muestran el movimiento, el esfuerzo y la actividad.
> Seguimos creyendo que el contenido que generamos, código, documentos, procesos, que todo es un activo, cuando la realidad dice que es un pasivo, que nos genera un gasto operacional que no tenemos en cuenta.
> Y por último, el sistema, y nosotros mismos, y la forma en las que nos evalúan, nos empujan a convertirnos en héroes indispensables. En los salvadores.

---

## Slide 35: `recurring-quote-2`
- **Sección narrativa**: S: Solución -> S1: Medir mejor
- **Template**: `quote` | **Recipe**: `critical` | **Variant**: `default` | **Label**: `Cita recurrente · productividad no es hacer más (II)`

### Campos/Textos:
- **quote**: Productividad no es <em>hacer más</em>.<br>Es generar el mayor impacto con el <em>menor mantenimiento</em>.
- **who**: *(vacío)*

### Notas del Orador:
> Grabémoslo a fuego. La productividad no es hacer más, es generar el mayor impacto con el menor mantenimiento.

---

## Slide 36: `moneyball`
- **Sección narrativa**: S: Solución -> S1: Medir mejor
- **Template**: `big-concept` | **Recipe**: `cool-fresh` | **Variant**: `default` | **Label**: `Moneyball`

### Campos/Textos:
- **icon**: <img src="/talks/decks/productividad/assets/baseball.png" alt="" class="title-icon">
- **title**: MONEYBALL

### Notas del Orador:
> ¿Quiénes vieron la película de Moneyball?
> Es una peli del año 2011 que recomiendo ver, no sólo porque sale Brad Pitt y hay que ver todo lo que haga Brad Pitt siempre, sino porque es un peliculón.
> Igual yo ahora les voy a hacer un mini spoiler, que tampoco debería considerarse spoiler, porque es una película de hace 15 años y que cuenta la historia real de un equipo de béisbol de hace 25 años.
> Pero si no quieren el spoiler es un buen momento para echar una partida de Candy Crush.
> Esta película cuenta la historia de los Oaklands, un equipo de béisbol que siempre estaba al final de la tabla que no podía competir con los grandes por una simple razón. Cada año, cada equipo buscamos a los mejores bateadores, a las mejores estrellas para ficharlos, y obviamente para poder ficharlos hacía falta algo... Plata, dinero, guita, tarasca, pelas, y obviamente no tenía. Pero claro, tenían a Brad Pitt, bueno a Brad Pitt y a su segundo que era un economista de Hardvard. Y qué hacen, crear dashboards. Qué lindos los dashboards. En lugar de buscar a los jugadores que más jonrones hicieran que no podían pagar, empezaron a mirar aquellos que aportaran un poquito para que sus compañeros llegaran a base.
> Me gusta la peli porque en lugar de perseguir métricas de vanidad se persiguen métricas de equipo, métricas que realmente son sostenibles.

---

## Slide 37: `dx-core-4`
- **Sección narrativa**: S: Solución -> S1: Medir mejor
- **Template**: `big-concept` | **Recipe**: `cool-fresh` | **Variant**: `divider` | **Label**: `DX Core 4 · intro`

### Campos/Textos:
- **title**: DX<br>CORE 4.

### Notas del Orador:
> Y eso es lo que en nuestro sector podemos hacer con DX Code 4.
> Pero para entender DX Core 4. Necesitamos ver un poco de historia.

---

## Slide 38: `dora-metrics`
- **Sección narrativa**: S: Solución -> S1: Medir mejor
- **Template**: `big-concept` | **Recipe**: `cool-fresh` | **Variant**: `divider` | **Label**: `Dora metrics`

### Campos/Textos:
- **title**: Dora metrics
- **sub**: *(vacío)*
- **icon**: <img src="/talks/decks/productividad/assets/icon-dora.png" alt="" class="title-icon">

### Notas del Orador:
> Velocidad.

---

## Slide 39: `dora-metrics-2`
- **Sección narrativa**: S: Solución -> S1: Medir mejor
- **Template**: `big-list` | **Recipe**: `energy-loud` | **Variant**: `numeric` | **Label**: `Dora Metrics - 2`

### Campos/Textos:
- **title**: *(vacío)*

### Items en Markdown:
```markdown
1. Velocidad
    a. Lead Time
    b. Deploy Frequency
2. Estabilidad
    a. Change Failure Rate
    b. Mean Time to Repair
```

### Notas del Orador:
> Mide si las pipelines de tus sistemas están limpias y funcionan bien.

---

## Slide 40: `dora-metrics-3`
- **Sección narrativa**: S: Solución -> S1: Medir mejor
- **Template**: `big-concept` | **Recipe**: `canvas-quiet` | **Variant**: `divider` | **Label**: `Space metrics`

### Campos/Textos:
- **title**: Space metrics
- **sub**: *(vacío)*
- **icon**: <img src="/talks/decks/productividad/assets/rocket.png" alt="" class="title-icon">

### Notas del Orador:
> Introducido por GitHub/Microsoft para recordar que los ingenieros no son fábricas de código.

---

## Slide 41: `dora-metrics-2-2`
- **Sección narrativa**: S: Solución -> S1: Medir mejor
- **Template**: `big-list` | **Recipe**: `energy-loud` | **Variant**: `numeric` | **Label**: `SPACE Framework`

### Campos/Textos:
- **title**: *(vacío)*

### Items en Markdown:
```markdown
1. Satisfaction
2. Performance
3. Activity
4. Communication
5. Efficiency
```

### Notas del Orador:
> Recuerda que los developers son humanos y no máquinas de commits, pero no dió a las empresas guía de cómo actuar.

---

## Slide 42: `dx-core-4-2`
- **Sección narrativa**: S: Solución -> S1: Medir mejor
- **Template**: `big-concept` | **Recipe**: `cool-fresh` | **Variant**: `divider` | **Label**: `DX Core 4 · intro`

### Campos/Textos:
- **title**: DX<br>CORE 4.

### Notas del Orador:
> Y seguimos evolucionando y llegamos a DX Core 4.
> Que se centra en encontrar los puntos de dolor de nuestro día a día.
> Lo mejor de los dos mundos. Gestionar sin quemar.

---

## Slide 43: `speed`
- **Sección narrativa**: S: Solución -> S1: Medir mejor
- **Template**: `big-list` | **Recipe**: `energy-loud` | **Variant**: `bullets` | **Label**: `DX Core 4 · Speed`

### Campos/Textos:
- **title**: SPEED

### Items en Markdown:
```markdown
* PR throughput
* Lead time
* Deployment frequency
* Perceived rate of delivery
```

### Notas del Orador:
> Seguimos midiendo la velocidad, pero como una guía, como una referencia, no como el objetivo.
> Porque nos ayudan a encontrar posibles mejoras

---

## Slide 44: `effectiveness`
- **Sección narrativa**: S: Solución -> S1: Medir mejor
- **Template**: `big-list` | **Recipe**: `cool-fresh` | **Variant**: `bullets` | **Label**: `DX Core 4 · Effectiveness`

### Campos/Textos:
- **title**: EFFECTIVENESS

### Items en Markdown:
```markdown
* Developer Experience Index
* Time to 10th PR
* Ease of delivery
* Regrettable attrition
```

### Notas del Orador:
*(Sin notas)*

---

## Slide 45: `quality`
- **Sección narrativa**: S: Solución -> S1: Medir mejor
- **Template**: `big-list` | **Recipe**: `critical` | **Variant**: `bullets` | **Label**: `DX Core 4 · Quality`

### Campos/Textos:
- **title**: QUALITY

### Items en Markdown:
```markdown
* Change failure rate
* Failed deployment recovery time
* Perceived software quality
* Operational health & security metrics
```

### Notas del Orador:
*(Sin notas)*

---

## Slide 46: `impact`
- **Sección narrativa**: S: Solución -> S1: Medir mejor
- **Template**: `big-list` | **Recipe**: `canvas-quiet` | **Variant**: `bullets` | **Label**: `DX Core 4 · Impact`

### Campos/Textos:
- **title**: IMPACT

### Items en Markdown:
```markdown
* % of time spent on new capabilities
* Initiative progress & ROI
* Revenue per engineer
* R&D as % of revenue
```

### Notas del Orador:
> Hola

---

## Slide 47: `recurring-quote-2-2`
- **Sección narrativa**: S: Solución -> S1: Medir mejor
- **Template**: `quote` | **Recipe**: `critical` | **Variant**: `default` | **Label**: `Cita recurrente · productividad no es hacer más (II)`

### Campos/Textos:
- **quote**: Productividad no es hacer más.<br>Es generar el mayor impacto con el <em>menor mantenimiento</em>.
- **who**: *(vacío)*

### Notas del Orador:
> Y

---

## Slide 48: `icon-sesgo-de-supervivencias`
- **Sección narrativa**: S: Solución -> S2: Automatización
- **Template**: `big-concept` | **Recipe**: `cool-fresh` | **Variant**: `prompt` | **Label**: `Sesgo de supervivencias`

### Campos/Textos:
- **icon**: <img src="/talks/decks/productividad/assets/icon-war-plane.png" alt="" class="title-icon">
- **title**: Abraham Wald

### Notas del Orador:
> En la Segunda Guerra Mundial, el ejército estaba trabajando para mejorar los bombarderos B-17, hacian lo obvio, reforzaban las alas y el fuselaje de los aviones que era donde habían recibido más disparos los aviones que volvían. Pero este señor Abraham Wald, un matemático que trabajaba en la Universidad de Columbia, hizo un apunte muy interesante.
> No había que reforzar las alas y el fuselaje, como los aviones volvían eso demostraba que podían aguantar disparos en las alas y en el fuselaje, donde había que reforzar es donde no había disparos, porque significaría que los aviones que reciben disparos ahí, no vuelven.
> Y a esto se lo conoce como el sesgo de supervivencia. En nuestro sector nos pasa mucho, solucionamos bugs, crashes y todo lo que vemos en nuestros dashboards, analíticas y logs, pero nos olvidamos de lo que no se ve. El código muerto de una feature flag cerrada, ese acoplamiento del infierno de una clase de 3 mil líneas, o las dependencias que no estás actualizando, ese código súper redundante que te creó Claude, o los tests que no están testeando nada que te escribió Cursor para subir tu coverage.

---

## Slide 49: `automatizacion-2`
- **Sección narrativa**: S: Solución -> S2: Automatización
- **Template**: `icon` | **Recipe**: `energy-loud` | **Variant**: `default` | **Label**: `Automatización 2`

### Items de Lista:
1. *(vacío)*

### Notas del Orador:
*(Sin notas)*

---

## Slide 50: `automatizacion-ejemplos`
- **Sección narrativa**: S: Solución -> S2: Automatización
- **Template**: `big-list` | **Recipe**: `canvas-quiet` | **Variant**: `checklist` | **Label**: `Automatización ejemplos`

### Campos/Textos:
- **title**: *(vacío)*

### Items en Markdown:
```markdown
- [-] Hacer y correr tests.
- [x] Chaos engineering para validar tus tests.
- [-] Escribir documentación.
- [x] Linter semántico para validar que las specs.
- [-] Planear e implementar refactors.
- [x] Deuda técnica fantasma.
```

### Notas del Orador:
> No sé, analizá los comentarios de las PRs de aquellos que no son Code Owners del repo, tal vez te ayuda a entender cuáles son los errores típicos. En eventbrite teníamos un repo de infraestructura para trabajar con los deeplinks, y antes de hacer los cambios en producción tenías que hacerlos en dev y staging, y casi siempre los que tocábamos el repo de nuevas siempre teníamos ese comentario, primero PR en staging, cuando todo esté OK, recién ahí la PR a producción. Vamos a trabajar ahí.

---

## Slide 51: `icon-80`
- **Sección narrativa**: S: Solución -> S2: Automatización
- **Template**: `icon` | **Recipe**: `paper` | **Variant**: `default` | **Label**: `Pagar deuda`

### Items de Lista:
1. *(vacío)*

### Notas del Orador:
> Antes hablamos de que el código es un pasivo.
> Vamos a pagar la deuda.
> Eliminar dependencias que no se usan.
> Analizar los tests que ralentizan las pipelines y no están validando funcionalidad, o los que son flakys y se reintentan un par de veces hasta que pasan.
> Analizar la calidad de la telemetría para ahorrar costes operativos en Datadog. Nos encanta poner un "Sucess" en una llamada que se va a logar millones de veces por día y que no aportan nada.
> Y acá no quiero venir a darles soluciones o ideas de qué tienen que hacer, porque cada empresa es diferente, tienen virtudes y defectos que ustedes conocen y ustedes pueden mejorar.
> Usen la IA para hacer eso que siempre supieron que había que hacer, pero que no hacían porque se tardaba muchísimo. Ahora con la IA lo pueden hacer.

---

## Slide 52: `recurring-quote-2-2-2`
- **Sección narrativa**: S: Solución -> S2: Automatización
- **Template**: `quote` | **Recipe**: `critical` | **Variant**: `default` | **Label**: `Cita recurrente · productividad no es hacer más (II)`

### Campos/Textos:
- **quote**: Productividad no es hacer más.<br>Es generar el mayor impacto con el <em>menor mantenimiento</em>.
- **who**: *(vacío)*

### Notas del Orador:
> No nos olvidemos, productividad no es hacer más, es generar el mayor impacto con el menor mantenimiento.
> Y eso nos lleva al último pilar, y al más difícil para nuestro ego.

---

## Slide 53: `heroe-gris`
- **Sección narrativa**: S: Solución -> S3: Reducir protagonismo
- **Template**: `icon` | **Recipe**: `canvas-quiet` | **Variant**: `default` | **Label**: `Héroe · capa gris`

### Items de Lista:
1. *(vacío)*

### Notas del Orador:
> Desheroicificarnos. Reducir nuestro protagonismo.
> Tu nivel de impacto no se mide por las veces que salvás al mundo, sino por diseñar un sistema tan robusto que funciona perfectamente cuando no estás.

---

## Slide 54: `heroe-gris-2`
- **Sección narrativa**: S: Solución -> S3: Reducir protagonismo
- **Template**: `icon` | **Recipe**: `canvas-quiet` | **Variant**: `default` | **Label**: `Héroe · capa gris`

### Items de Lista:
1. *(vacío)*

### Notas del Orador:
*(Sin notas)*

---

## Slide 55: `automatizacion`
- **Sección narrativa**: S: Solución -> S3: Reducir protagonismo
- **Template**: `big-concept` | **Recipe**: `canvas-quiet` | **Variant**: `divider` | **Label**: `Automatización · sección`

### Campos/Textos:
- **title**: AUTO<br>MATI<br>ZA<br>CIÓN.

### Notas del Orador:
*(Sin notas)*

---

## Slide 56: `reducir-protagonismo`
- **Sección narrativa**: S: Solución -> S3: Reducir protagonismo
- **Template**: `big-concept` | **Recipe**: `critical` | **Variant**: `prompt` | **Label**: `Reducir nuestro protagonismo`

### Campos/Textos:
- **title**: Reducir nuestro<br><em>PROTAGONISMO</em>

### Notas del Orador:
*(Sin notas)*

---

## Slide 57: `recurring-quote-3`
- **Sección narrativa**: S: Solución -> S3: Reducir protagonismo
- **Template**: `quote` | **Recipe**: `critical` | **Variant**: `default` | **Label**: `Cita recurrente · productividad no es hacer más (III)`

### Campos/Textos:
- **quote**: Productividad <em>no es hacer más</em>.<br>Es generar el mayor impacto con el menor mantenimiento.
- **who**: — Definición de trabajo

### Notas del Orador:
*(Sin notas)*

---

## Slide 58: `disclaimer-trabajar-menos`
- **Sección narrativa**: S: Solución -> S3: Reducir protagonismo
- **Template**: `big-concept` | **Recipe**: `critical` | **Variant**: `disclaimer` | **Label**: `Disclaimer · no es trabajar menos`

### Campos/Textos:
- **title**: NO ES<br>TRABAJAR <em>MENOS</em>
- **note**: Disclaimer

### Notas del Orador:
*(Sin notas)*

---

## Slide 59: `disclaimer-trabajar-inteligente`
- **Sección narrativa**: S: Solución -> S3: Reducir protagonismo
- **Template**: `big-concept` | **Recipe**: `energy-loud` | **Variant**: `default` | **Label**: `Disclaimer · trabajar de forma inteligente`

### Campos/Textos:
- **title**: ES TRABAJAR<br>DE FORMA<br><em>INTELIGENTE</em>
- **note**: Disclaimer

### Notas del Orador:
*(Sin notas)*

---

## Slide 60: `heroe-arquitecto`
- **Sección narrativa**: S: Solución -> S3: Reducir protagonismo
- **Template**: `icon` | **Recipe**: `critical` | **Variant**: `N/A` | **Label**: `Héroe → Arquitecto`

### Items de Lista:
1. *(vacío)*
2. *(vacío)*
3. *(vacío)*

### Notas del Orador:
*(Sin notas)*

---

## Slide 61: `cargando-0`
- **Sección narrativa**: S: Solución -> S3: Reducir protagonismo
- **Template**: `icon` | **Recipe**: `paper` | **Variant**: `N/A` | **Label**: `Cargando · paso 0`

### Items de Lista:
1. *(vacío)*

### Notas del Orador:
*(Sin notas)*

---

## Slide 62: `insostenibles`
- **Sección narrativa**: S: Solución -> S3: Reducir protagonismo
- **Template**: `big-concept` | **Recipe**: `critical` | **Variant**: `prompt` | **Label**: `Insostenibles`

### Campos/Textos:
- **title**: No imprescindibles.<br><em>Insostenibles</em>.

### Notas del Orador:
> Cuando en realidad no somos imprescindibles. Somos insostenibles.
> 
> Confundimos "que la empresa no pueda funcionar sin mí" con "ser valioso". Y no es lo mismo. Un equipo sano es uno que puede seguir adelante aunque cualquiera de nosotros falte. Ser el único que sabe algo no nos hace héroes: nos hace el riesgo.

---

## Slide 63: `cadena-1`
- **Sección narrativa**: S: Solución -> S3: Reducir protagonismo
- **Template**: `icon` | **Recipe**: `paper` | **Variant**: `N/A` | **Label**: `Cadena · paso 1 (flujo)`

### Items de Lista:
1. *(vacío)*

### Notas del Orador:
*(Sin notas)*

---

## Slide 64: `cadena-2`
- **Sección narrativa**: V: Visualización
- **Template**: `icon` | **Recipe**: `paper` | **Variant**: `N/A` | **Label**: `Cadena · paso 2 (+ análisis)`

### Items de Lista:
1. *(vacío)*
2. *(vacío)*

### Notas del Orador:
*(Sin notas)*

---

## Slide 65: `cadena-3`
- **Sección narrativa**: V: Visualización
- **Template**: `icon` | **Recipe**: `paper` | **Variant**: `N/A` | **Label**: `Cadena · paso 3 (+ equipo)`

### Items de Lista:
1. *(vacío)*
2. *(vacío)*
3. *(vacío)*

### Notas del Orador:
*(Sin notas)*

---

## Slide 66: `cadena-4`
- **Sección narrativa**: V: Visualización
- **Template**: `icon` | **Recipe**: `paper` | **Variant**: `N/A` | **Label**: `Cadena · paso 4 (+ calidad)`

### Items de Lista:
1. *(vacío)*
2. *(vacío)*
3. *(vacío)*
4. *(vacío)*

### Notas del Orador:
*(Sin notas)*

---

## Slide 67: `cadena-5`
- **Sección narrativa**: V: Visualización
- **Template**: `icon` | **Recipe**: `paper` | **Variant**: `N/A` | **Label**: `Cadena · paso 5 (+ deploy)`

### Items de Lista:
1. *(vacío)*
2. *(vacío)*
3. *(vacío)*
4. *(vacío)*
5. *(vacío)*

### Notas del Orador:
*(Sin notas)*

---

## Slide 68: `cadena-6`
- **Sección narrativa**: V: Visualización
- **Template**: `icon` | **Recipe**: `paper` | **Variant**: `N/A` | **Label**: `Cadena · paso 6 (+ persona)`

### Items de Lista:
1. *(vacío)*
2. *(vacío)*
3. *(vacío)*
4. *(vacío)*
5. *(vacío)*
6. *(vacío)*

### Notas del Orador:
*(Sin notas)*

---

## Slide 69: `ci-chain`
- **Sección narrativa**: V: Visualización
- **Template**: `icon` | **Recipe**: `canvas-quiet` | **Variant**: `N/A` | **Label**: `CI chain · 4' → 1.5'`

### Items de Lista:
1. *(vacío)*

### Notas del Orador:
*(Sin notas)*

---

## Slide 70: `ci-chain-25x`
- **Sección narrativa**: V: Visualización
- **Template**: `icon` | **Recipe**: `canvas-quiet` | **Variant**: `N/A` | **Label**: `CI chain · → 25× por día`

### Items de Lista:
1. *(vacío)*
2. *(vacío)*
3. *(vacío)*

### Notas del Orador:
*(Sin notas)*

---

## Slide 71: `ci-chain-x15`
- **Sección narrativa**: V: Visualización
- **Template**: `icon` | **Recipe**: `canvas-quiet` | **Variant**: `N/A` | **Label**: `CI chain · → ×15 personas`

### Items de Lista:
1. *(vacío)*
2. *(vacío)*
3. *(vacío)*
4. *(vacío)*
5. *(vacío)*

### Notas del Orador:
*(Sin notas)*

---

## Slide 72: `mas-15h`
- **Sección narrativa**: V: Visualización
- **Template**: `big-stat` | **Recipe**: `canvas-quiet` | **Variant**: `default` | **Label**: `+15h por día · cierre del cálculo`

### Campos/Textos:
- **stat_number**: +15
- **stat_unit**: h
- **explanation**: por día · el cálculo: pipeline 4' → 1.5' × 25 deploys × 15 personas.

### Notas del Orador:
*(Sin notas)*

---

## Slide 73: `no-siempre-se-ve`
- **Sección narrativa**: V: Visualización
- **Template**: `big-concept` | **Recipe**: `critical` | **Variant**: `prompt` | **Label**: `No siempre se ve`

### Campos/Textos:
- **title**: NO SIEMPRE<br>SE <em>VE</em>

### Notas del Orador:
*(Sin notas)*

---

## Slide 74: `capa-de-ozono`
- **Sección narrativa**: V: Visualización
- **Template**: `big-concept` | **Recipe**: `cool-fresh` | **Variant**: `divider` | **Label**: `Capa de ozono`

### Campos/Textos:
- **icon**: <img src="/talks/decks/productividad/assets/ozone-earth.png" alt="" class="title-icon">
- **title**: CAPA<br>DE <em>OZONO</em>.

### Notas del Orador:
*(Sin notas)*

---

## Slide 75: `practicas-compartir`
- **Sección narrativa**: V: Visualización
- **Template**: `big-list` | **Recipe**: `cool-fresh` | **Variant**: `numeric` | **Label**: `Prácticas · compartir conocimiento`

### Items en Markdown:
```markdown
1. Documentar más
2. Delegar más
3. Compartir más
4. Dejar de ser el único que sabe
```

### Notas del Orador:
*(Sin notas)*

---

## Slide 76: `recurring-quote-4`
- **Sección narrativa**: A2: Acción
- **Template**: `quote` | **Recipe**: `critical` | **Variant**: `default` | **Label**: `Cita recurrente · productividad no es hacer más (IV)`

### Campos/Textos:
- **quote**: Productividad <em>no es hacer más</em>.<br>Es generar el mayor impacto con el menor mantenimiento.
- **who**: — Definición de trabajo

### Notas del Orador:
*(Sin notas)*

---

## Slide 77: `cohete-2-2`
- **Sección narrativa**: A2: Acción
- **Template**: `icon` | **Recipe**: `critical` | **Variant**: `default` | **Label**: `Cohete · paso 1`

### Items de Lista:
1. *(vacío)*
2. *(vacío)*
3. *(vacío)*

### Notas del Orador:
*(Sin notas)*

---

## Slide 78: `cohete-engranajes`
- **Sección narrativa**: A2: Acción
- **Template**: `icon` | **Recipe**: `canvas-quiet` | **Variant**: `N/A` | **Label**: `Cohete + engranajes`

### Items de Lista:
1. *(vacío)*
2. *(vacío)*

### Notas del Orador:
*(Sin notas)*

---

## Slide 79: `cohete-engranajes-capa`
- **Sección narrativa**: A2: Acción
- **Template**: `icon` | **Recipe**: `canvas-quiet` | **Variant**: `N/A` | **Label**: `Cohete + engranajes + capa`

### Items de Lista:
1. *(vacío)*
2. *(vacío)*
3. *(vacío)*

### Notas del Orador:
*(Sin notas)*

---

## Slide 80: `pausa-rosa`
- **Sección narrativa**: A2: Acción
- **Template**: `big-concept` | **Recipe**: `critical` | **Variant**: `transition` | **Label**: `Pausa · plasma`

### Campos/Textos:
- **title**: &nbsp;

### Notas del Orador:
*(Sin notas)*

---

## Slide 81: `radiacion`
- **Sección narrativa**: A2: Acción
- **Template**: `icon` | **Recipe**: `critical` | **Variant**: `N/A` | **Label**: `Radiación del héroe`

### Items de Lista:
1. *(vacío)*

### Notas del Orador:
*(Sin notas)*

---

## Slide 82: `cierre`
- **Sección narrativa**: A2: Acción
- **Template**: `closing-socials` | **Recipe**: `energy-loud` | **Variant**: `N/A` | **Label**: `¿Y ustedes qué opinan?`

### Campos/Textos:
- **title**: ¿Y ustedes qué<br><em>opinan</em>?
- **socials**: <img src="/talks/decks/productividad/assets/social-youtube.png" alt="YouTube"><img src="/talks/decks/productividad/assets/social-twitter.png" alt="X"><img src="/talks/decks/productividad/assets/social-spotify.png" alt="Spotify"><img src="/talks/decks/productividad/assets/social-instagram.png" alt="Instagram"><img src="/talks/decks/productividad/assets/social-twitch.png" alt="Twitch"><img src="/talks/decks/productividad/assets/social-github.png" alt="GitHub">
- **credits**: Nicolás Patarino · @npatarino · @ChimichurriCode

### Notas del Orador:
*(Sin notas)*

---

