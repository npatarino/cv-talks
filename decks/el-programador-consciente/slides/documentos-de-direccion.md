---
template: viz
recipe: canvas-quiet
label: Documentos de dirección
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
      <style>section.slide.s-viz{background:#1F2A33 !important;}</style><style>section.slide.s-viz{padding:0}.s-viz .stage{margin:0}</style><div class="wrap" style="position:relative"><div style="position:absolute;inset:0;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr"><div data-from="1" style="background:#D96BD0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;transform:none"><img src="/talks/decks/el-programador-consciente/assets/gears.png" alt="" style="height:150px"><div class="mid" style="color:#F4F1EA;text-align:center">Engineering<br>operational model</div></div><div data-from="3" style="background:#3B82E8;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;transform:none"><img src="/talks/decks/el-programador-consciente/assets/calendar.png" alt="" style="height:150px"><div class="mid" style="color:#F4F1EA;text-align:center">3-years<br>vision plan</div></div><div data-from="4" style="background:#9FD163;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;transform:none"><img src="/talks/decks/el-programador-consciente/assets/debt.png" alt="" style="height:150px"><div class="mid" style="color:#F4F1EA;text-align:center">Tech debt<br>remediation plan</div></div><div data-from="2" style="background:#E8656B;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;transform:none"><img src="/talks/decks/el-programador-consciente/assets/skull.png" alt="" style="height:150px"><div class="mid" style="color:#F4F1EA;text-align:center">Post-mortem</div></div></div></div>
steps: 4
revealStart: 1
---
