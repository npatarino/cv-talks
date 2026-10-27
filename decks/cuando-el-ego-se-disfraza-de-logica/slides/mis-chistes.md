---
template: viz
recipe: canvas-quiet
label: 'Una ciudad que no entendía mis chistes'
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
      <style>section.slide.s-viz{background:#3F7BF5 !important;color:#FFFFFF !important;}</style><div class="center"><div class="row" style="gap:120px"><img src="/talks/decks/cuando-el-ego-se-disfraza-de-logica/assets/haha.png" alt="" style="height:190px;width:auto;"><div data-from="2"><img src="/talks/decks/cuando-el-ego-se-disfraza-de-logica/assets/afa.png" alt="" style="height:380px;width:auto;"></div><div data-from="1" style="width:150px;height:200px;background:#2B2B2B;color:#75FAB1;font-family:var(--font-mono);font-size:19px;line-height:1.35;padding:22px 20px;border-radius:6px;position:relative;text-align:left">Remera<br>Prolijo<br>Bondi<br>Macanudo<br>Canchero<br>Frutilla<span style="position:absolute;right:0;top:0;border-style:solid;border-width:0 36px 36px 0;border-color:#75FAB1 #75FAB1 #4f8f6a #4f8f6a"></span></div></div></div>
steps: 2
revealStart: 0
notes: |
  Estaba en una ciudad que no entendía mis chistes, ni muchas de mis palabras.

  Estaba en un país que todavía no había ganado un mundial. Na, humor argentino. Ven cómo no se entiende mis chistes.
---
