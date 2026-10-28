---
template: viz
recipe: canvas-quiet
label: Un buen documento da
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
      <style>section.slide.s-viz{background:#8B5FD0 !important;color:#F4F1EA !important;}</style><div class="wrap" style="justify-content:center;padding-left:300px;gap:44px"><div data-from="1" style="display:flex;align-items:center;gap:40px"><span class="mk" style="width:72px;height:72px;background:#F4F1EA;-webkit-mask-image:url(/talks/decks/el-programador-consciente/assets/chat.png);mask-image:url(/talks/decks/el-programador-consciente/assets/chat.png);"></span><span class="big" style="font-size:60px">Respuestas</span></div><div data-from="2" style="display:flex;align-items:center;gap:40px"><span class="mk" style="width:72px;height:72px;background:#F4F1EA;-webkit-mask-image:url(/talks/decks/el-programador-consciente/assets/signpost.png);mask-image:url(/talks/decks/el-programador-consciente/assets/signpost.png);"></span><span class="big" style="font-size:60px">Alternativas</span></div><div data-from="3" style="display:flex;align-items:center;gap:40px"><span class="mk" style="width:72px;height:72px;background:#F4F1EA;-webkit-mask-image:url(/talks/decks/el-programador-consciente/assets/handshake.png);mask-image:url(/talks/decks/el-programador-consciente/assets/handshake.png);"></span><span class="big" style="font-size:60px">Trade-offs</span></div><div data-from="4" style="display:flex;align-items:center;gap:40px"><span class="mk" style="width:72px;height:72px;background:#F4F1EA;-webkit-mask-image:url(/talks/decks/el-programador-consciente/assets/diver.png);mask-image:url(/talks/decks/el-programador-consciente/assets/diver.png);"></span><span class="big" style="font-size:60px">Deep dive</span></div></div>
steps: 4
revealStart: 1
---
