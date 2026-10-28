---
template: viz
recipe: canvas-quiet
label: Comunicar bien
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
      <style>section.slide.s-viz{background:#E9F28C !important;color:#1F2A33 !important;}</style><div class="center" style="gap:18px"><div class="big" style="font-size:64px;color:#1F2A33" data-from="1">Claridad y brevedad</div><div class="big" style="font-size:64px;color:#1F2A33" data-from="2">Sensibilidad cultural</div><div class="big" style="font-size:64px;color:#1F2A33" data-from="3">Empatía</div><div class="big" style="font-size:64px;color:#1F2A33" data-from="4">Escucha activa</div><div class="big" style="font-size:64px;color:#1F2A33" data-from="5">Paráfrasis</div></div>
steps: 5
revealStart: 0
notes: |
  Claridad y brevedad: la gente es inteligente y está ocupada.
  Sensibilidad cultural: nuestro humor no está bien recibido en otros países. Yo tenía confianza con un amigo que siempre me decía cosas de Argentina...
---
