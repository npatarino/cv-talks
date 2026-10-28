---
template: viz
recipe: canvas-quiet
label: La historia de mi promoción
variant: default
fields:
  stage:
    meta: Stage_HTML
    content: |
      <style>
      section.slide.s-viz { padding: 0; }
      .s-viz .stage { margin: 0; }
      .s-viz .stage > .wrap { flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 80px 120px; }
      .s-viz .mk { display: inline-block; -webkit-mask-size: contain; mask-size: contain; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; -webkit-mask-position: center; mask-position: center; }
      .s-viz .center { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 28px; text-align: center; }
      .s-viz .big { font-family: var(--font-display); font-size: 84px; line-height: 1.1; letter-spacing: .01em; text-transform: uppercase; }
      .s-viz .serif { font-family: var(--font-editorial); font-size: 44px; line-height: 1.2; font-weight: 400; }
      .s-viz .strike { text-decoration: line-through; text-decoration-thickness: .12em; }
      .s-viz .row { display: flex; gap: 70px; justify-content: center; align-items: center; }
      .s-viz .cell { display: flex; flex-direction: column; align-items: center; gap: 14px; }
      .s-viz img.ic { height: 150px; width: auto; }
      .s-viz .credits { font-family: var(--font-ui); font-weight: 700; font-size: 22px; }
      </style>
      <style>section.slide.s-viz{background:#FCE55E !important;color:#2B2B2B !important;}</style><div class="center"><div class="row" style="gap:60px;align-items:flex-start"><div class="cell" data-from="1" style="width:200px"><img src="/talks/decks/cuando-el-ego-se-disfraza-de-logica/assets/driver.png" alt="" style="height:110px;width:auto;"><div style="font-family:var(--font-display);font-size:19px;text-transform:uppercase;line-height:1.25;height:72px">Driver<br>cross-team<br>project</div><div style="font-family:var(--font-display);font-size:36px">x1</div></div><div class="cell" data-from="2" style="width:200px"><img src="/talks/decks/cuando-el-ego-se-disfraza-de-logica/assets/leader.png" alt="" style="height:110px;width:auto;"><div style="font-family:var(--font-display);font-size:19px;text-transform:uppercase;line-height:1.25;height:72px">Leader<br>project</div><div style="font-family:var(--font-display);font-size:36px">x1</div></div><div class="cell" data-from="3" style="width:200px"><img src="/talks/decks/cuando-el-ego-se-disfraza-de-logica/assets/guide.png" alt="" style="height:110px;width:auto;"><div style="font-family:var(--font-display);font-size:19px;text-transform:uppercase;line-height:1.25;height:72px">Guide<br>project</div><div style="font-family:var(--font-display);font-size:36px">x3</div></div><div class="cell" data-from="4" style="width:200px"><img src="/talks/decks/cuando-el-ego-se-disfraza-de-logica/assets/mentor.png" alt="" style="height:110px;width:auto;"><div style="font-family:var(--font-display);font-size:19px;text-transform:uppercase;line-height:1.25;height:72px">Mentor</div><div style="font-family:var(--font-display);font-size:36px">x2</div></div><div class="cell" data-from="5" style="width:200px"><img src="/talks/decks/cuando-el-ego-se-disfraza-de-logica/assets/crash.png" alt="" style="height:110px;width:auto;"><div style="font-family:var(--font-display);font-size:19px;text-transform:uppercase;line-height:1.25;height:72px">Crash-free<br>rate</div><div style="font-family:var(--font-display);font-size:36px">99.99%</div></div></div></div>
steps: 5
revealStart: 1
notes: |
  Definir la arquitectura de mobile que esté alineada con la estrategia de la compañía.
  Rediseñar el proceso de respuesta de incidentes del equipo.
  Reducir en un 30% los tiempos de compilación eliminando código muerto.
  Conducir un postmortem, con su documentación, su reunión de postmortem y haciendo follow up de los action points.
  Convertirte en la go-to-person de algún componente en específico.
  
  ¿Qué queremos conseguir con esta historia?
---
