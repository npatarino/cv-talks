---
template: icon
recipe: critical
label: Radiación del héroe
items:
  - glyph: |
      <div class="tox" id="tox">
                <span class="halo"></span>
        <img class="sym" src="/talks/decks/el-mito-de-la-productividad-toxica-freson/assets/radiation.svg" alt="">
      </div>
      <style>
        .s-icon .glyph .tox { position: relative; width: 1em; height: 1em; display: flex; align-items: center; justify-content: center; }
        .s-icon .glyph .tox .sym { position: relative; width: 100%; height: 100%; z-index: 2; animation: tox-pulse 5s ease-in-out infinite; filter: drop-shadow(0 0 8px rgba(249,215,28,.35)); }
        .tox .halo { position: absolute; inset: -90%; border-radius: 50%; z-index: 0; background: radial-gradient(circle, rgba(249,215,28,.25) 0%, rgba(249,215,28,.08) 38%, transparent 68%); animation: tox-halo 5s ease-in-out infinite; }
        .tox .p { position: absolute; left: 50%; top: 50%; border-radius: 50%; z-index: 1; opacity: 0; animation: tox-drift var(--t) ease-out infinite; animation-delay: var(--d); }
        @keyframes tox-pulse { 0%,100% { scale: 1; } 50% { scale: 1.025; } }
        @keyframes tox-halo { 0%,100% { transform: scale(.85); opacity: .5; } 50% { transform: scale(1.05); opacity: 1; } }
        @keyframes tox-drift { 0% { transform: translate(-50%,-50%) scale(.4); opacity: 0; } 15% { opacity: .35; } 100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1.4); opacity: 0; } }
      </style>
      <script>
      (function () {
        var box = document.getElementById('tox');
        if (!box || box.dataset.ready) return;
        box.dataset.ready = '1';
        var colors = ['#f9d71c', '#1c1c1c', '#fafaf8', '#f9d71c'];
        for (var i = 0; i < 8; i++) {
          var a = Math.random() * Math.PI * 2, r = 120 + Math.random() * 380, el = document.createElement('span');
          el.className = 'p';
          var sz = 5 + Math.random() * 8;
          el.style.cssText = 'width:' + sz + 'px;height:' + sz + 'px;background:' + colors[i % colors.length] +
            ';--dx:' + Math.round(Math.cos(a) * r) + 'px;--dy:' + Math.round(Math.sin(a) * r * .8) + 'px;--t:' +
            (7 + Math.random() * 5).toFixed(2) + 's;--d:' + (Math.random() * 8).toFixed(2) + 's';
          box.appendChild(el);
        }
      })();
      </script>
variant: default
notes: Productividad tóxica.
---
