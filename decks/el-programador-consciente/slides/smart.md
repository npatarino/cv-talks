---
template: viz
recipe: canvas-quiet
label: 'SMART'
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
      <style>section.slide.s-viz{background:#EEC27C !important;color:#1F4D5C !important;}</style><div class="wrap" style="justify-content:center;padding-left:120px"><div style="display:grid;grid-template-columns:140px auto;row-gap:6px;align-items:baseline"><div class="big" style="font-size:150px;color:#1F4D5C">S</div><div class="big" style="font-size:72px;color:#1F4D5C;opacity:0.45" data-from="1">pecific</div><div class="big" style="font-size:150px;color:#1F4D5C">M</div><div class="big" style="font-size:72px;color:#1F4D5C;opacity:0.45" data-from="2">easurable</div><div class="big" style="font-size:150px;color:#1F4D5C">A</div><div class="big" style="font-size:72px;color:#1F4D5C;opacity:0.45" data-from="3">chievable</div><div class="big" style="font-size:150px;color:#1F4D5C">R</div><div class="big" style="font-size:72px;color:#1F4D5C;opacity:0.45" data-from="4">elevant</div><div class="big" style="font-size:150px;color:#1F4D5C">T</div><div class="big" style="font-size:72px;color:#1F4D5C;opacity:1" data-from="5">ime-bound</div></div></div>
steps: 5
revealStart: 0
notes: |
  Specific, Measurable, Achievable, Relevant, Time-bound.
---
