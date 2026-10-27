---
template: viz
recipe: canvas-quiet
label: 'Lo que dejé'
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
      <style>section.slide.s-viz{background:#FCE55E !important;color:#2B2B2B !important;}</style><div class="center"><div class="row" style="gap:60px"><div data-from="1"><img src="/talks/decks/cuando-el-ego-se-disfraza-de-logica/assets/friends.png" alt="" style="height:150px;width:auto;"></div><div data-from="2"><img src="/talks/decks/cuando-el-ego-se-disfraza-de-logica/assets/house.png" alt="" style="height:150px;width:auto;"></div><div data-from="3"><img src="/talks/decks/cuando-el-ego-se-disfraza-de-logica/assets/mate.png" alt="" style="height:150px;width:auto;"></div><div data-from="4"><div style="position:relative"><img src="/talks/decks/cuando-el-ego-se-disfraza-de-logica/assets/beard.png" alt="" style="height:150px;width:auto;"><span style="position:absolute;right:-70px;top:-10px"><img src="/talks/decks/cuando-el-ego-se-disfraza-de-logica/assets/bubble.png" alt="" style="height:80px;width:auto;"></span></div></div></div></div>
steps: 4
revealStart: 1
notes: |
  Dejé mi casa, mis amigos, mis costumbres, y aunque no lo parezca, también dejé mi acento. (Son muchas las veces que se me escapa el acento madrileño o frases es españolas)
  En definitiva, dejé mi tierra, y con eso una parte de mí.

  Dejé mi casa, mis amigos, mis costumbres, y aunque no lo parezca, también dejé mi acento. (Son muchas las veces que se me escapa un Madriz o un ejque)
  En definitiva, dejé mi tierra, y con eso una parte de mí.
---
