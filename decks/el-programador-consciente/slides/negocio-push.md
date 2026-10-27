---
template: viz
recipe: canvas-quiet
label: 'Negocio · push notifications'
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
      <style>section.slide.s-viz{background:#E07B39 !important;color:#F4F1EA !important;}</style><div class="wrap" style="padding-top:20px"><div class="row" style="gap:70px"><div class="cell" data-from="1"><span class="mk" style="width:72px;height:72px;background:#F4F1EA;-webkit-mask-image:url(/talks/decks/el-programador-consciente/assets/cart.png);mask-image:url(/talks/decks/el-programador-consciente/assets/cart.png);"></span><span class="small" style="font-size:22px">3M</span></div><div class="cell" data-from="2"><span class="mk" style="width:72px;height:72px;background:#F4F1EA;-webkit-mask-image:url(/talks/decks/el-programador-consciente/assets/bell.png);mask-image:url(/talks/decks/el-programador-consciente/assets/bell.png);"></span><span class="small" style="font-size:22px">3M</span></div><div class="cell" data-from="3"><span class="mk" style="width:72px;height:72px;background:#F4F1EA;-webkit-mask-image:url(/talks/decks/el-programador-consciente/assets/percent.png);mask-image:url(/talks/decks/el-programador-consciente/assets/percent.png);"></span><span class="small" style="font-size:22px">0,1%</span></div><div class="cell" data-from="4"><span class="mk" style="width:72px;height:72px;background:#F4F1EA;-webkit-mask-image:url(/talks/decks/el-programador-consciente/assets/tag.png);mask-image:url(/talks/decks/el-programador-consciente/assets/tag.png);"></span><span class="small" style="font-size:22px">10€</span></div></div><div class="center" data-from="5"><span class="mk" style="width:260px;height:260px;background:#F4F1EA;-webkit-mask-image:url(/talks/decks/el-programador-consciente/assets/rocket.png);mask-image:url(/talks/decks/el-programador-consciente/assets/rocket.png);"></span><div class="big">300.000€</div></div></div>
steps: 5
revealStart: 1
notes: |
  Antes 0; ahora cada mes se mandan 3M de push notifications, tenemos una tasa de conversión de 0,1%, por lo que hay unos 30.000 tickets más vendidos; con un precio medio de 10€ ya tenemos un impacto en negocio de unos 300.000€ al mes.
---
