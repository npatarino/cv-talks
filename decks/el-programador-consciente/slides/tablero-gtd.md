---
template: viz
recipe: canvas-quiet
label: 'Tablero GTD · mise-en-place'
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
      <style>section.slide.s-viz{background:#4A9AA8 !important;color:#F4F1EA !important;}</style><style>.s-viz .g{flex:1;display:grid;grid-template-columns:repeat(6,1fr) 60px;gap:22px;align-items:start}.s-viz .g .col{background:#F4F1EA;border-radius:12px;padding:16px 14px;display:flex;flex-direction:column;gap:12px}.s-viz .g h3{font-family:var(--font-ui);font-weight:700;font-size:20px;margin:0 0 4px;color:#1F2A33}.s-viz .g .card{height:10px;border-radius:5px;background:#C9CED2}.s-viz .g .card.w{width:60%}.s-viz .g .vert{writing-mode:vertical-rl;transform:rotate(180deg);font-family:var(--font-display);font-size:60px;color:#F4F1EA;align-self:stretch;text-align:center}</style><div class="g"><div class="col"><h3>🗓️ Today</h3><div class="card"></div><div class="card"></div><div class="card w"></div></div><div class="col"><h3>🌓 Tomorrow</h3><div class="card"></div><div class="card"></div><div class="card w"></div><div class="card"></div><div class="card"></div><div class="card w"></div><div class="card"></div><div class="card"></div></div><div class="col"><h3>💫 This week</h3><div class="card"></div><div class="card"></div><div class="card w"></div><div class="card"></div><div class="card"></div><div class="card w"></div><div class="card"></div><div class="card"></div></div><div class="col"><h3>⌚ Waiting</h3><div class="card"></div><div class="card"></div><div class="card w"></div><div class="card"></div><div class="card"></div><div class="card w"></div><div class="card"></div><div class="card"></div><div class="card w"></div><div class="card"></div><div class="card"></div><div class="card w"></div><div class="card"></div><div class="card"></div></div><div class="col"><h3>📫 Inbox</h3><div class="card"></div><div class="card"></div><div class="card w"></div><div class="card"></div><div class="card"></div><div class="card w"></div></div><div class="col"><h3>✅ Done</h3><div class="card"></div><div class="card"></div><div class="card w"></div><div class="card"></div><div class="card"></div><div class="card w"></div><div class="card"></div><div class="card"></div><div class="card w"></div></div><div class="vert">Mise-en-place</div></div>
steps: 0
notes: |
  Waiting: needs to happen eventually, but is not scheduled yet.
  Inbox: everything starts here.
---
