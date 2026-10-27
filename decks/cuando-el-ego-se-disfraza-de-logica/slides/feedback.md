---
template: viz
recipe: canvas-quiet
label: 'Feedback'
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
      <style>section.slide.s-viz{background:#EC6A42 !important;color:#FFFFFF !important;}</style><div class="center" style="gap:30px"><div class="row" style="gap:36px"><span class="mk" style="width:70px;height:70px;background:#FFFFFF;-webkit-mask-image:url(/talks/decks/cuando-el-ego-se-disfraza-de-logica/assets/award.png);mask-image:url(/talks/decks/cuando-el-ego-se-disfraza-de-logica/assets/award.png);"></span><span class="mk" style="width:70px;height:70px;background:#FFFFFF;-webkit-mask-image:url(/talks/decks/cuando-el-ego-se-disfraza-de-logica/assets/target.png);mask-image:url(/talks/decks/cuando-el-ego-se-disfraza-de-logica/assets/target.png);"></span><span class="mk" style="width:70px;height:70px;background:#FFFFFF;-webkit-mask-image:url(/talks/decks/cuando-el-ego-se-disfraza-de-logica/assets/trend.png);mask-image:url(/talks/decks/cuando-el-ego-se-disfraza-de-logica/assets/trend.png);"></span></div><div style="display:flex;align-items:center;gap:30px"><span class="big" style="font-size:72px">Feedback</span><span style="color:#FCE55E;font-size:64px;line-height:1">●←</span></div></div>
steps: 0
---
