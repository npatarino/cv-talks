---
template: viz
recipe: canvas-quiet
label: 'Podés hacer un muy buen trabajo y fracasar en tu rol'
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
      <style>section.slide.s-viz{background:#E33E80 !important;color:#FFFFFF !important;}</style><div class="center" style="gap:26px"><div class="big" style="font-size:56px">Podés hacer un muy buen trabajo,<br>y fracasar en tu rol.</div></div>
steps: 0
notes: |
  Antonio era un excelente amigo, y un gran ingeniero. Hizo un montón de mejoras en los tiempos de ejecución de pipelines de nuestro CI/CD. Redujo también los tiempos de compilación de la aplicación de Android. Creó varias tools para tracking, monitoreo que fueron un éxito. Es decir que redujo costes de la empresa, mejoró la developer experience de la aplicación de Android y colaboró en aumentar la resiliencia. Aún así se le terminó echando de la empresa.
  Obviamente no se llamaba Antonio, ni trabajó conmigo, pero sí que es un amigo. Y se le echó, y con razón.
  Porque todo eso que hacía, no era su responsabilidad, no era lo que se esperaba de él. Lo que se esperaba era que trabajara, primero, en las tareas de su equipo, y después abriera el scope.
  Por eso es muy importante saber qué se espera de vos, saber qué deberias estar haciendo que no estás hacuiendo y qué deberías dejar de hacer...
---
