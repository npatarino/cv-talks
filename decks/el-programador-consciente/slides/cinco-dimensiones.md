---
template: viz
recipe: canvas-quiet
label: Cinco dimensiones
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
      <style>section.slide.s-viz{background:#4A9AA8 !important;color:#F4F1EA !important;}</style><style>.s-viz .dgrid{flex:1;display:flex;gap:40px;align-items:center;justify-content:center}.s-viz .dcard{width:260px;height:240px;background:#F4F1EA;color:#1F2A33;border-radius:22px;padding:26px;position:relative;display:flex;align-items:flex-end;transition:background .4s}.s-viz .dcard .n{position:absolute;top:22px;right:26px;font-family:var(--font-mono);font-size:26px}.s-viz .dcard .t{font-family:var(--font-display);font-size:34px;line-height:1.05}section.s-viz[data-step="1"] .dcard:nth-child(1){background:#CDEBB0}section.s-viz[data-step="2"] .dcard:nth-child(2){background:#CDEBB0}section.s-viz[data-step="3"] .dcard:nth-child(3){background:#CDEBB0}section.s-viz[data-step="4"] .dcard:nth-child(4){background:#CDEBB0}section.s-viz[data-step="5"] .dcard:nth-child(5){background:#CDEBB0}</style><div class="dgrid"><div class="dcard"><span class="n">01</span><span class="t">Scope of<br>influence</span></div><div class="dcard"><span class="n">02</span><span class="t">Ownership</span></div><div class="dcard"><span class="n">03</span><span class="t">Ambiguity</span></div><div class="dcard"><span class="n">04</span><span class="t">Technical<br>complexity</span></div><div class="dcard"><span class="n">05</span><span class="t">Communication</span></div></div>
steps: 5
revealStart: 0
notes: |
  Cada → resalta una dimensión.
  Scope of influence: capacidad de impactar e influir a otros equipos o áreas más allá de tu propio trabajo. Tu equipo, otro equipo, tu guild, tu pillar, otros...
  Ownership: asumir la responsabilidad y compromiso por el éxito de una tarea.
  Ambiguity: habilidad para tomar decisiones efectivas cuando la información es incompleta o no existe.
  Technical complexity: habilidad para resolver problemas técnicos complejos.
  Communication: transmitir ideas técnicas de manera clara y efectiva a diferentes audiencias.
---
