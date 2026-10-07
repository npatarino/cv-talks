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
        <polygon id="rd-poly" style="opacity:0" points="840,280 840,280 840,280 840,280" fill="var(--recipe-em)" fill-opacity=".4" stroke="var(--recipe-em)" stroke-width="8" stroke-linejoin="round"/>
        <g id="rd-dots" fill="var(--recipe-em)" style="opacity:0"><circle r="14"/><circle r="14"/><circle r="14"/><circle r="14"/></g>
      </svg>
      <div class="legend">
        <span data-from="1" class="dot" style="--c:var(--recipe-em)">Speed</span>
        <span data-from="2" class="dot" style="--c:var(--recipe-em)">Effectiveness</span>
        <span data-from="3" class="dot" style="--c:var(--recipe-em)">Quality</span>
        <span data-from="4" class="dot" style="--c:var(--recipe-em)">Impact</span>
      </div>
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
---
