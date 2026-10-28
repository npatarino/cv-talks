---
template: viz
recipe: canvas-quiet
label: Portada
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
      <style>section.slide.s-viz{background:#75FAB1 !important;color:#2B2B2B !important;}</style><div class="center" style="gap:16px"><img src="/talks/decks/cuando-el-ego-se-disfraza-de-logica/assets/brain.png" alt="" style="height:90px;width:auto;"><div class="big" style="font-size:66px;margin-top:20px">Cuando el ego se disfraza de lógica</div><div style="font-family:var(--font-ui);font-weight:700;font-size:42px">El programador consciente</div><div style="margin-top:60px"><div style="display:flex;gap:20px;justify-content:center"><span class="mk" style="width:30px;height:30px;background:#2B2B2B;-webkit-mask-image:url(/talks/decks/cuando-el-ego-se-disfraza-de-logica/assets/soc-youtube.png);mask-image:url(/talks/decks/cuando-el-ego-se-disfraza-de-logica/assets/soc-youtube.png);"></span><span class="mk" style="width:30px;height:30px;background:#2B2B2B;-webkit-mask-image:url(/talks/decks/cuando-el-ego-se-disfraza-de-logica/assets/soc-twitter.png);mask-image:url(/talks/decks/cuando-el-ego-se-disfraza-de-logica/assets/soc-twitter.png);"></span><span class="mk" style="width:30px;height:30px;background:#2B2B2B;-webkit-mask-image:url(/talks/decks/cuando-el-ego-se-disfraza-de-logica/assets/soc-spotify.png);mask-image:url(/talks/decks/cuando-el-ego-se-disfraza-de-logica/assets/soc-spotify.png);"></span><span class="mk" style="width:30px;height:30px;background:#2B2B2B;-webkit-mask-image:url(/talks/decks/cuando-el-ego-se-disfraza-de-logica/assets/soc-instagram.png);mask-image:url(/talks/decks/cuando-el-ego-se-disfraza-de-logica/assets/soc-instagram.png);"></span><span class="mk" style="width:30px;height:30px;background:#2B2B2B;-webkit-mask-image:url(/talks/decks/cuando-el-ego-se-disfraza-de-logica/assets/soc-twitch.png);mask-image:url(/talks/decks/cuando-el-ego-se-disfraza-de-logica/assets/soc-twitch.png);"></span><span class="mk" style="width:30px;height:30px;background:#2B2B2B;-webkit-mask-image:url(/talks/decks/cuando-el-ego-se-disfraza-de-logica/assets/soc-github.png);mask-image:url(/talks/decks/cuando-el-ego-se-disfraza-de-logica/assets/soc-github.png);"></span></div></div><div class="credits">Nicolás Patarino • @npatarino • @ChimichurriCode</div></div>
steps: 0
notes: |
  CommitConf · 18 de septiembre de 2025.
---
