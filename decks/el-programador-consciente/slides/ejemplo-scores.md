---
template: viz
recipe: canvas-quiet
label: Ejemplo · carta FIFA
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
      <style>section.slide.s-viz{background:#1F4D5C !important;color:#F4F1EA !important;}</style><div class="wrap" style="flex-direction:row;align-items:center;justify-content:space-between;padding:0 60px">
      <div><div class="big" style="font-size:110px">Nicolás<br>Patarino</div>
      <div style="display:flex;gap:18px;margin-top:30px"><span class="mk" style="width:30px;height:30px;background:#F4F1EA;-webkit-mask-image:url(/talks/decks/el-programador-consciente/assets/soc-twitter.png);mask-image:url(/talks/decks/el-programador-consciente/assets/soc-twitter.png);"></span><span class="mk" style="width:30px;height:30px;background:#F4F1EA;-webkit-mask-image:url(/talks/decks/el-programador-consciente/assets/soc-youtube.png);mask-image:url(/talks/decks/el-programador-consciente/assets/soc-youtube.png);"></span><span class="mk" style="width:30px;height:30px;background:#F4F1EA;-webkit-mask-image:url(/talks/decks/el-programador-consciente/assets/soc-instagram.png);mask-image:url(/talks/decks/el-programador-consciente/assets/soc-instagram.png);"></span><span class="mk" style="width:30px;height:30px;background:#F4F1EA;-webkit-mask-image:url(/talks/decks/el-programador-consciente/assets/soc-github.png);mask-image:url(/talks/decks/el-programador-consciente/assets/soc-github.png);"></span><span class="mk" style="width:30px;height:30px;background:#F4F1EA;-webkit-mask-image:url(/talks/decks/el-programador-consciente/assets/soc-spotify.png);mask-image:url(/talks/decks/el-programador-consciente/assets/soc-spotify.png);"></span></div></div>
      <div style="width:520px;height:720px;background:linear-gradient(#D9CBA5,#C9B98E);clip-path:polygon(50% 0,100% 12%,100% 86%,50% 100%,0 86%,0 12%);color:#1F4D5C;display:flex;flex-direction:column;align-items:center;padding:60px 50px 40px;gap:20px">
        <div style="display:flex;align-items:center;gap:30px"><div style="font-family:var(--font-display);font-size:120px;line-height:1">92</div><img src="/talks/decks/el-programador-consciente/assets/nico.jpg" alt="" style="width:210px;height:210px;object-fit:cover;border-radius:18px"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 40px;font-family:var(--font-mono);font-size:30px;font-weight:700">
          <span>82 SoI</span><span>93 AMB</span><span>98 OWN</span><span>99 TCX</span><span style="grid-column:1/3;text-align:center">86 COM</span></div>
        <div style="color:#B8803A;font-size:28px;letter-spacing:.3em">★★★★★</div>
      </div></div>
steps: 0
notes: |
  Ejemplo de evaluación: la carta FIFA de Nicolás Patarino, 92 de media.
---
