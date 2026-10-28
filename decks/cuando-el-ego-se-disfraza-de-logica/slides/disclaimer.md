---
template: viz
recipe: canvas-quiet
label: Disclaimer · tu trabajo no te define
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
      <style>section.slide.s-viz{background:#E33E80 !important;color:#FFFFFF !important;}</style><div class="center" style="gap:26px"><div class="serif" style="font-size:40px;margin-bottom:-6px">Disclaimer.</div><div class="big" style="font-size:64px">Tu trabajo no te define.</div></div>
steps: 1
revealStart: 0
notes: |
  No sos mejor o peor persona si usás clean architecture, no sos mejor o peor persona si conocés patrones de diseño. No sos mejor o peor persona si sos junior, senior, o principal. Ni tu rol, ni tu código te define.
  
  Te define como sos con tus amigos, con tu pareja, con tus padres, con tus hijos, con tus mascotas o con tus vecinos.
  Igualmente en esta charla vamos a centrarnos en nuestra parte profesional, porque no creo que hayan venido a escucharme hablar de cómo mejorar dinámicas familiares.
---
