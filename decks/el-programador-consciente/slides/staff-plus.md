---
template: viz
recipe: paper
label: 'Staff+ · arquetipos'
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
      <div class="wrap" style="gap:30px">
      <div style="background:#E8485F;color:#F4F1EA;font-family:var(--font-mono);font-size:24px;letter-spacing:.08em;padding:18px 30px;border-radius:10px">⚠ Disclaimer: resumen muy simplificado</div>
      <svg viewBox="0 0 1600 560" style="flex:1;width:100%" fill="none" stroke="#4A9AA8" stroke-width="5">
        <g data-from="1"><circle cx="800" cy="60" r="12" fill="#F4F1EA"/><text x="800" y="20" text-anchor="middle" fill="#1F2A33" stroke="none" font-family="var(--font-display)" font-size="44">Staff +</text></g>
        <g data-from="2"><path d="M800 72 V140 H420 V200 M800 140 H1180 V200"/><circle cx="420" cy="200" r="12" fill="#F4F1EA"/><circle cx="1180" cy="200" r="12" fill="#F4F1EA"/>
          <text x="420" y="270" text-anchor="middle" fill="#1F2A33" stroke="none" font-family="var(--font-display)" font-size="40">Team</text>
          <text x="1180" y="270" text-anchor="middle" fill="#1F2A33" stroke="none" font-family="var(--font-display)" font-size="40">Project</text></g>
        <g data-from="3"><path d="M420 290 V360 H240 V420 M420 360 H600 V420 M1180 290 V360 H1000 V420 M1180 360 H1360 V420"/>
          <circle cx="240" cy="420" r="12" fill="#F4F1EA"/><circle cx="600" cy="420" r="12" fill="#F4F1EA"/><circle cx="1000" cy="420" r="12" fill="#F4F1EA"/><circle cx="1360" cy="420" r="12" fill="#F4F1EA"/>
          <text x="240" y="490" text-anchor="middle" fill="#1F2A33" stroke="none" font-family="var(--font-display)" font-size="36">Tech Lead</text>
          <text x="600" y="490" text-anchor="middle" fill="#1F2A33" stroke="none" font-family="var(--font-display)" font-size="36">Architect</text>
          <text x="1000" y="490" text-anchor="middle" fill="#1F2A33" stroke="none" font-family="var(--font-display)" font-size="36">Solver</text>
          <text x="1360" y="490" text-anchor="middle" fill="#1F2A33" stroke="none" font-family="var(--font-display)" font-size="36">Right-hand</text></g>
      </svg>
      <div style="align-self:center;background:#1F2A33;color:#F4F1EA;font-family:var(--font-mono);font-size:22px;padding:16px 28px;border-radius:10px;display:flex;gap:16px;align-items:center"><span class="mk" style="width:32px;height:32px;background:#F4F1EA;-webkit-mask-image:url(/talks/decks/el-programador-consciente/assets/book.png);mask-image:url(/talks/decks/el-programador-consciente/assets/book.png);"></span> Staff Engineer: Leadership beyond the management track · Will Larson</div>
      </div>
steps: 3
revealStart: 1
notes: |
  Staff Engineer: Leadership beyond the management track, de Will Larson. Resumen muy simplificado.
  Team: Tech Lead (guía la ejecución de un equipo) y Architect (dirección y calidad de un área crítica).
  Project: Solver (se sumerge en problemas complejos hasta resolverlos) y Right-hand (extiende el alcance de un líder ejecutivo).
---
