---
template: viz
recipe: canvas-quiet
label: 'Documento · RFC'
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
      <style>section.slide.s-viz{background:#4A9AA8 !important;color:#F4F1EA !important;}</style><div class="center"><span class="mk" style="width:220px;height:220px;background:#F4F1EA;-webkit-mask-image:url(/talks/decks/el-programador-consciente/assets/chat-question.png);mask-image:url(/talks/decks/el-programador-consciente/assets/chat-question.png);"></span><div><div class="big">RFC</div><div class="small" style="margin-top:10px">(Request for Comments)</div></div></div>
steps: 0
notes: |
  También es una forma de recibir feedback y abrir un diálogo, pero el enfoque y el momento son distintos. Se esperan comentarios sobre una propuesta más avanzada o definida. El foco es refinar la solución.
---
