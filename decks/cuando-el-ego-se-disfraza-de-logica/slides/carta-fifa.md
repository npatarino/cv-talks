---
template: viz
recipe: canvas-quiet
label: 'Mi carta FIFA'
variant: default
fields:
  stage:
    meta: Stage_HTML
    content: |
      <style>
      section.slide.s-viz { padding: 0; }
      .s-viz .stage { margin: 0; }
      .s-viz .stage > .wrap { flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 80px 120px; }
      .s-viz .mk { display: inline-block; -webkit-mask-size: contain; mask-size: contain; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; -webkit-mask-position: center; mask-position: center; }
      .s-viz .center { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 28px; text-align: center; }
      .s-viz .big { font-family: var(--font-display); font-size: 84px; line-height: 1.1; letter-spacing: .01em; text-transform: uppercase; }
      .s-viz .serif { font-family: var(--font-editorial); font-size: 44px; line-height: 1.2; font-weight: 400; }
      .s-viz .strike { text-decoration: line-through; text-decoration-thickness: .12em; }
      .s-viz .row { display: flex; gap: 70px; justify-content: center; align-items: center; }
      .s-viz .cell { display: flex; flex-direction: column; align-items: center; gap: 14px; }
      .s-viz img.ic { height: 150px; width: auto; }
      .s-viz .credits { font-family: var(--font-ui); font-weight: 700; font-size: 22px; }
      </style>
      <style>section.slide.s-viz{background:#FCE55E !important;color:#2B2B2B !important;}</style><div class="center"><div style="width:420px;height:580px;background:url(/talks/decks/cuando-el-ego-se-disfraza-de-logica/assets/gold.png) center/cover;clip-path:polygon(50% 0,100% 11%,100% 86%,50% 100%,0 86%,0 11%);color:#2B2B2B;display:flex;flex-direction:column;align-items:center;padding:60px 40px 30px;gap:16px;font-family:var(--font-display)"><div style="display:flex;align-items:flex-end;gap:16px"><div style="font-size:96px;line-height:1">92</div><img src="/talks/decks/cuando-el-ego-se-disfraza-de-logica/assets/nico-full.png" alt="" style="height:230px;width:auto;"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 36px;font-family:var(--font-mono);font-size:30px;font-weight:700;color:#FFFFFF;text-shadow:0 1px 0 #0003"><span>82 SoI</span><span>93 AMB</span><span>98 OWN</span><span>99 TCX</span><span style="grid-column:1/3;text-align:center">86 COM</span></div><div style="width:100%;height:46px;background:linear-gradient(#74ACDF 33%,#fff 33% 66%,#74ACDF 66%);margin-top:auto;display:flex;align-items:center;justify-content:center;color:#F6B40E;font-size:22px">★★★</div></div></div>
steps: 0
---
