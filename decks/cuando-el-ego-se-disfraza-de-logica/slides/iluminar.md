---
template: viz
recipe: canvas-quiet
label: 'Brillar e iluminar'
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
      <style>section.slide.s-viz{background:#FCE55E !important;color:#2B2B2B !important;}</style><div class="wrap" style="position:relative;padding:0"><svg viewBox="0 0 1920 1080" style="position:absolute;inset:0;width:100%;height:100%"><polygon points="770,500 1920,250 1920,780" fill="#FFFFFF" fill-opacity=".45"/><polygon points="770,500 1920,360 1920,660" fill="#FFFFFF" fill-opacity=".4"/></svg><div style="position:absolute;left:580px;top:440px"><img src="/talks/decks/cuando-el-ego-se-disfraza-de-logica/assets/flashlight.png" alt="" style="height:120px;width:auto;transform:scaleX(-1) rotate(-20deg)"></div></div>
steps: 0
notes: |
  El caso de antes es un caso muy claro, quería ponerlo para que se viera bien lo que quiero decir, pero normalmente no es tan obvio. 

  A veces ejecuto de más. A veces escribo una propuesta técnica y la implemento. A veces tengo el conocimiento de cómo implementar algo y lo hago. A veces hay una tarea bloqueada, la hago y la desbloqueo.

  ¿Cómo lo sé? Por el feedback. Porque mi mánayer, mis compañeros u otros líderes me dieron ese feedback, algunos me lo regalaron directamente, a otros les pedí feedback sobre mi comportamiento.

  Implementar, desbloquear... Eso es bueno. Pero no es lo que se espera, por lo menos no es lo que se espera siempre de mi rol.
  Tengo que dar la oportunidad de poder implementar a otros compañeros, de compartir algo de conocimiento ya sea de la tecnología o del negocio, tengo que habilitar a que las tareas se desbloqueen, no a convertirme en un cuello de botella.
  Dicen que hay momentos en los que en tu carrera tenés que brillar y en otros iluminar. Pues yo no estaba iluminando.
---
