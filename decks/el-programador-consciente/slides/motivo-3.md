---
template: viz
recipe: energy-loud
label: 'Motivo 03 · sobreesfuerzo'
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
      <div class="wrap" style="justify-content:space-between;padding-top:40px"><div style="flex:1;display:flex;align-items:center;justify-content:center"><svg viewBox="0 0 1200 320" style="width:1200px;height:320px" fill="none"><path d="M40 40 V280 H1160" stroke="#1F4D5C" stroke-width="4"/><path d="M40 220 H1160" stroke="#1F4D5C" stroke-width="3" stroke-dasharray="12 12" opacity=".6"/><polyline points="40,150 120,180 200,130 280,160 360,120 440,170 520,80 600,190 680,140 760,110 840,170 920,100 1000,160 1080,140 1160,120" stroke="#E8A0A8" stroke-width="7" stroke-linejoin="round"/></svg></div><div style="color:#1F4D5C"><div class="small" style="font-size:30px;opacity:1">03.</div><div class="big" style="font-size:64px;margin-top:8px">Has hecho un sobreesfuerzo.</div></div></div>
steps: 0
notes: |
  Lo que no es sostenible no es tu nivel.
---
