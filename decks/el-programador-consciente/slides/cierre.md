---
template: viz
recipe: canvas-quiet
label: '¿Y ustedes qué opinan?'
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
      <style>section.slide.s-viz{background:#FBE463 !important;}</style><style>section.slide.s-viz{padding:0}.s-viz .stage{margin:0}</style><div class="wrap"><div style="flex:1;background:#FBE463;color:#E0607A;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px"><div class="small" style="opacity:1;text-transform:none;font-family:var(--font-ui);font-weight:700;font-size:24px">Nicolás Patarino · @npatarino · @ChimichurriCode</div><div class="big" style="font-size:96px">¿Y ustedes qué opinan?</div><div style="display:flex;gap:22px"><span class="mk" style="width:40px;height:40px;background:#E0607A;-webkit-mask-image:url(/talks/decks/el-programador-consciente/assets/soc-youtube.png);mask-image:url(/talks/decks/el-programador-consciente/assets/soc-youtube.png);"></span><span class="mk" style="width:40px;height:40px;background:#E0607A;-webkit-mask-image:url(/talks/decks/el-programador-consciente/assets/soc-twitter.png);mask-image:url(/talks/decks/el-programador-consciente/assets/soc-twitter.png);"></span><span class="mk" style="width:40px;height:40px;background:#E0607A;-webkit-mask-image:url(/talks/decks/el-programador-consciente/assets/soc-spotify.png);mask-image:url(/talks/decks/el-programador-consciente/assets/soc-spotify.png);"></span><span class="mk" style="width:40px;height:40px;background:#E0607A;-webkit-mask-image:url(/talks/decks/el-programador-consciente/assets/soc-instagram.png);mask-image:url(/talks/decks/el-programador-consciente/assets/soc-instagram.png);"></span><span class="mk" style="width:40px;height:40px;background:#E0607A;-webkit-mask-image:url(/talks/decks/el-programador-consciente/assets/soc-twitch.png);mask-image:url(/talks/decks/el-programador-consciente/assets/soc-twitch.png);"></span><span class="mk" style="width:40px;height:40px;background:#E0607A;-webkit-mask-image:url(/talks/decks/el-programador-consciente/assets/soc-github.png);mask-image:url(/talks/decks/el-programador-consciente/assets/soc-github.png);"></span></div></div><div style="height:400px;background:#E0607A;color:#F4F1EA;display:flex;align-items:center;justify-content:space-around"><img src="/talks/decks/el-programador-consciente/assets/qr-apple.png" alt="" style="height:260px"><div style="text-align:center;display:flex;flex-direction:column;align-items:center;gap:20px"><img src="/talks/decks/el-programador-consciente/assets/proxyhands.png" alt="ProxyHands" style="height:60px"><div class="big" style="font-size:72px;font-family:var(--font-ui);font-weight:700">Código: TOF7</div></div><img src="/talks/decks/el-programador-consciente/assets/qr-android.png" alt="" style="height:260px"></div></div>
steps: 0
notes: |
  QR de ProxyHands (iOS y Android) con el código TOF7 para preguntas.
---
