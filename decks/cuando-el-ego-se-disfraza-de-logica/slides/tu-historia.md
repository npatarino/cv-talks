---
template: viz
recipe: canvas-quiet
label: Quizás no sos vos el que elige cómo empieza tu historia
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
      <style>section.slide.s-viz{background:#E33E80 !important;color:#FFFFFF !important;}</style><div class="center" style="gap:26px"><div class="serif" style="font-size:44px">Quizás no sos vos el que elige cómo empieza tu historia,</div><div class="serif" style="font-size:40px;margin-top:-10px" data-from="1">pero sí podés elegir cómo sigue...</div></div>
steps: 1
revealStart: 0
notes: |
  Asi que espero que a partir hoy tengas presente que
---
