---
template: viz
recipe: canvas-quiet
label: Sesgo de ancla
variant: default
fields:
  stage:
    meta: Stage_HTML
    content: |
      <style>
      .s-viz .stage > .wrap { flex: 1; display: flex; flex-direction: column; min-height: 0; }
      .s-viz .mk { display: inline-block; -webkit-mask-size: contain; mask-size: contain; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; -webkit-mask-position: center; mask-position: center; }
      .s-viz .center { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 28px; text-align: center; }
      .s-viz .big { font-family: var(--font-display); font-size: 84px; line-height: 1; letter-spacing: -0.01em; }
      .s-viz .mid { font-family: var(--font-display); font-size: 48px; line-height: 1.05; }
      .s-viz .small { font-family: var(--font-mono); font-size: 24px; letter-spacing: .1em; text-transform: uppercase; opacity: .85; }
      .s-viz .row { display: flex; gap: 90px; justify-content: center; align-items: flex-start; }
      .s-viz .cell { display: flex; flex-direction: column; align-items: center; gap: 14px; }
      </style>
      <style>section.slide.s-viz{background:#E0607A !important;color:#F4F1EA !important;}</style><div class="center" style="gap:34px"><span class="mk" style="width:170px;height:170px;background:#F4F1EA;-webkit-mask-image:url(/talks/decks/el-programador-consciente/assets/anchor.png);mask-image:url(/talks/decks/el-programador-consciente/assets/anchor.png);"></span><div class="big" style="font-size:64px">Sesgo de ancla</div></div>
steps: 0
notes: |
  Soy un cabrón, te compro un café; me quiere comprar. Soy bueno, te compro un café; qué gran tipo es Nico.
---
