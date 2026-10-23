---
template: viz
recipe: cool-fresh
label: SPACE · radar
revealStart: 0
steps: 4
variant: default
fields:
  stage:
    meta: Stage_HTML
    content: |
      <svg viewBox="0 0 1680 560" preserveAspectRatio="xMidYMid meet">
        <!-- Referencia: ejes y dos niveles (50 % y 100 %). Aparece con el primer paso. -->
        <g data-from="1" fill="none" stroke="var(--recipe-ink)" stroke-linecap="round">
          <path d="M840 25 L840 535 M585 280 L1095 280" stroke-width="2" opacity=".35"/>
          <polygon points="840,152.5 967.5,280 840,407.5 712.5,280" stroke-width="2" stroke-dasharray="6 10" opacity=".35"/>
          <polygon points="840,25 1095,280 840,535 585,280" stroke-width="3" opacity=".5"/>
        </g>
        <g class="rd-lbl" fill="var(--recipe-ink)" font-family="var(--font-mono)" font-size="22" letter-spacing=".14em" text-anchor="middle">
          <text data-from="1" x="840" y="2">SPEED</text>
          <text data-from="2" x="1120" y="288" text-anchor="start">EFFECTIVENESS</text>
          <text data-from="3" x="840" y="582">QUALITY</text>
          <text data-from="4" x="560" y="288" text-anchor="end">IMPACT</text>
        </g>
        <polygon id="rd-poly" style="opacity:0" points="840,280 840,280 840,280 840,280" fill="var(--recipe-em)" fill-opacity=".4" stroke="var(--recipe-em)" stroke-width="8" stroke-linejoin="round"/>
        <g id="rd-dots" fill="var(--recipe-em)" style="opacity:0"><circle r="14"/><circle r="14"/><circle r="14"/><circle r="14"/></g>
      </svg>
      <style>.s-viz .rd-lbl text { opacity: 0; transition: opacity .6s ease; } .s-viz .rd-lbl text.is-on { opacity: .8; }</style>
      <script>
      (function () {
        var section = document.querySelector('section.s-viz');
        var poly = document.getElementById('rd-poly');
        var dots = document.querySelectorAll('#rd-dots circle');
        var cx = 840, cy = 280, R = 255;
        var vals = [0.78, 0.6, 0.85, 0.68];
        var dir = [[0,-1],[1,0],[0,1],[-1,0]];
        var cur = [0.02,0.02,0.02,0.02], raf = null;
        function draw() {
          poly.style.opacity = Math.max.apply(null, cur) > 0.03 ? 1 : 0; document.getElementById('rd-dots').style.opacity = poly.style.opacity;
          poly.setAttribute('points', cur.map(function (r, i) { return (cx + dir[i][0]*R*r) + ',' + (cy + dir[i][1]*R*r); }).join(' '));
          cur.forEach(function (r, i) { dots[i].setAttribute('cx', cx + dir[i][0]*R*r); dots[i].setAttribute('cy', cy + dir[i][1]*R*r); dots[i].style.opacity = (r > 0.05) ? 1 : 0; });
        }
        function go(step) {
          var target = vals.map(function (v, i) { return step >= i + 1 ? v : 0.02; });
          var from = cur.slice(), t0 = null;
          if (raf) cancelAnimationFrame(raf);
          function tick(t) {
            if (t0 === null) t0 = t;
            var k = Math.min(1, (t - t0) / 900), e = 1 - Math.pow(1 - k, 3);
            cur = from.map(function (f, i) { return f + (target[i] - f) * e; });
            draw();
            if (k < 1) raf = requestAnimationFrame(tick);
          }
          raf = requestAnimationFrame(tick);
        }
        section.addEventListener('vizstep', function (e) { go(e.detail.step); });
        draw();
        go(parseInt(section.dataset.step || '0', 10));
      })();
      </script>
  note: { content: 'Datos ilustrativos.', meta: Note_Text }
notes: |
  Speed: PR throughput, lead time, deployment frequency, perceived rate of delivery. Seguimos midiendo la velocidad, pero como una guía, como una referencia, no como el objetivo. Porque nos ayudan a encontrar posibles mejoras.
  Effectiveness: Developer Experience Index, time to 10th PR, ease of delivery, regrettable attrition.
  Quality: change failure rate, failed deployment recovery time, perceived software quality, operational health & security.
  Impact: % del tiempo en nuevas capacidades, progreso de iniciativas y ROI, revenue por ingeniero, I+D como % del revenue.
  Ninguna dimensión se mira sola, y el objetivo es que el conjunto crezca de forma equilibrada. Medimos para mejorar, no para vigilar.
  Y acá viene lo importante: al final, da igual qué metodología usés. DORA, SPACE, DX Core 4 o la que salga el año que viene. Lo que importa es que mires qué estás midiendo y te preguntes si tiene sentido. Si está alineado con la misión y los valores de la empresa, con lo que la empresa necesita de verdad. Eso es lo que te va a hacer productivo para la empresa. Y, de paso, es lo que te va a permitir crecer en ella, porque vas a estar trabajando en lo que importa, no en lo que se cuenta.
---
