---
template: big-stat
recipe: energy-loud
label: Stradivari · $15,9M por un violín
variant: default
fields:
  stat_number: { content: '$<span id="cnt159">15,9</span>', meta: Stat_Value }
  stat_unit: { content: M, meta: Stat_Unit }
  explanation:
    meta: Body_Text
    content: |
      <div class="one-violin">por <strong>un</strong> violín · subasta de 2011</div>
      <style>
        .s-big-stat .big { font-size: 460px; }
        .s-big-stat .big .pct { font-size: 180px; top: 70px; }
        .s-big-stat .one-violin { font-family: var(--font-mono); font-size: 30px; letter-spacing: .15em; text-transform: uppercase; margin-top: 40px; opacity: 0; transition: opacity .8s ease; }
        .s-big-stat .one-violin.on { opacity: .85; }
      </style>
      <script>
      (function () {
        var cnt = document.getElementById('cnt159');
        var lbl = document.querySelector('.one-violin');
        if (!cnt) return;
        var T = 2600, t0 = null;
        var ease = function (x) { return 1 - Math.pow(1 - x, 3); };
        function frame(t) {
          if (t0 === null) t0 = t;
          var k = Math.min(1, (t - t0) / T), e = ease(k);
          cnt.textContent = (15.9 * e).toFixed(1).replace('.', ',');
          if (k < 1) requestAnimationFrame(frame); else if (lbl) lbl.classList.add('on');
        }
        cnt.textContent = '0,0';
        requestAnimationFrame(frame);
      })();
      </script>
notes: |
  Por eso en 2011 alguien pagó 15,9 millones de dólares por un violín. Uno. El "Lady Blunt", de 1721. No porque suene quince millones de veces mejor que uno nuevo, sino porque no se puede fabricar otro. Es el precio exacto de un bus factor de uno: lo que cuesta que todo el conocimiento viva en una sola persona que un día no está.
  Obviamente es un ejemplo de hace tres siglos, pero en nuestro mundo real pasa lo mismo, y encima el sistema, nuestros mánagers, nuestros líderes y, principalmente, nuestro propio ego nos empujan a esto que normalmente conocemos como...
---
