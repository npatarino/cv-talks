---
template: viz
recipe: canvas-quiet
label: Proceso · 15h por día
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
      <style>section.slide.s-viz{background:#D64545 !important;color:#F4F1EA !important;}</style><div class="wrap" style="padding-top:20px"><div class="row" style="gap:70px"><div class="cell" data-from="1"><svg viewBox="0 0 72 72" width="72" height="72" fill="none" stroke="#F4F1EA" stroke-width="5"><rect x="4" y="10" width="64" height="52" rx="8"/><path d="M18 28 L30 36 L18 44 M36 46 H52" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="small" style="font-size:22px">4' → 1,5'</span></div><div class="cell" data-from="2"><span class="mk" style="width:72px;height:72px;background:#F4F1EA;-webkit-mask-image:url(/talks/decks/el-programador-consciente/assets/rocket.png);mask-image:url(/talks/decks/el-programador-consciente/assets/rocket.png);"></span><span class="small" style="font-size:22px">25× por día</span></div><div class="cell" data-from="3"><span class="mk" style="width:72px;height:72px;background:#F4F1EA;-webkit-mask-image:url(/talks/decks/el-programador-consciente/assets/people.png);mask-image:url(/talks/decks/el-programador-consciente/assets/people.png);"></span><span class="small" style="font-size:22px">×15</span></div></div><div class="center" data-from="4"><span class="mk" style="width:260px;height:260px;background:#F4F1EA;-webkit-mask-image:url(/talks/decks/el-programador-consciente/assets/clock.png);mask-image:url(/talks/decks/el-programador-consciente/assets/clock.png);"></span><div class="big">15h por día</div></div></div>
steps: 4
revealStart: 1
notes: |
  4' → 1,5' por build. 25 deploys por día. ×15 personas. Son unas 15 horas por día.
---
