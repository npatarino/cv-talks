---
template: viz
recipe: canvas-signal
label: Productividad real · X / (Y+Z)
revealStart: 0
steps: 1
variant: default
fields:
  stage:
    meta: Stage_HTML
    content: |
      <div class="eq">
        <div class="frac">
          <div class="num">X</div>
          <div class="bar"></div>
          <div class="den"><span>Y</span><span class="plus" data-from="1">+ Z</span></div>
        </div>
        <div class="res"><span data-from="0" data-until="1">= 1</span><span data-from="1">&lt; 1</span></div>
      </div>
      <div class="legend">
        <span data-from="0" class="dot" style="--c:var(--recipe-ink)">X · lo que prometiste</span>
        <span data-from="0" class="dot" style="--c:var(--recipe-ink)">Y · el tiempo acordado</span>
        <span data-from="1" class="dot" style="--c:var(--recipe-em)">Z · las horas que nadie vio</span>
      </div>
      <style>
      .s-viz .eq { flex: 1; display: flex; align-items: center; justify-content: center; gap: 50px; font-family: var(--font-display); line-height: 1; }
      .s-viz .frac { display: flex; flex-direction: column; align-items: center; }
      .s-viz .res { position: relative; width: 210px; height: 150px; font-size: 150px; }
      .s-viz .res span { position: absolute; left: 0; top: 0; white-space: nowrap; transition: opacity .6s; }
      .s-viz .res span:last-child { color: var(--recipe-em); }
      .s-viz .frac .num, .s-viz .frac .den { font-size: 150px; display: flex; align-items: baseline; }
      .s-viz .frac .bar { width: 250px; height: 10px; background: var(--recipe-ink); border-radius: 7px; margin: 24px 0; transition: width .8s cubic-bezier(.45,.05,.2,1); }
      .s-viz[data-step="1"] .frac .bar { width: 430px; }
      .s-viz .frac .plus { color: var(--recipe-em); display: inline-block; max-width: 0; overflow: hidden; white-space: nowrap; transition: max-width .8s cubic-bezier(.45,.05,.2,1), opacity .6s; }
      .s-viz .frac .plus.is-on { max-width: 400px; margin-left: 28px; }
      .s-viz .frac .plus { transition: max-width .8s cubic-bezier(.45,.05,.2,1), margin-left .8s cubic-bezier(.45,.05,.2,1), opacity .6s; }
      </style>
  note: { content: 'Si prometiste X en Y y te llevó Y+Z, tu productividad no es X/Y.', meta: Note_Text }
notes: |
  ¿Y saben quién es siempre el primero en llegar y el último en irse? El héroe. Y no se queda para controlar a los demás: se queda para terminar lo suyo. Para hacer más. Para quedar bien con el jefe. O simplemente porque te comprometiste a algo y no llegaste.
  Y acá está la trampa: las horas extra no suman productividad. La esconden. Si te comprometiste a hacer X en un tiempo Y, y en realidad te llevó Y más Z, tu productividad no es X sobre Y. Es X sobre Y más Z. (→) Y esa Z nadie la ve, porque la pagaste vos, de noche, con tu tiempo.
  El dashboard dice que cumpliste. La verdad es que estimaste mal, o que había demasiado trabajo para el tiempo que había. Y las horas extra taparon justo el dato que la empresa necesitaba ver para arreglarlo. Es la cobra de Delhi, pero amañando la métrica con tu propio cuerpo. A base de cansancio.
  Cristiano Ronaldo es el primero que llega a entrenar y el último que se va, y nadie dice que su productividad sea falsa. Porque Cristiano se queda para sumar sobre un trabajo que ya hizo: cien faltas más, sus abdominales. Vos te quedás para compensar lo que no llegó. Cristiano se queda para ser mejor. Vos te quedás para que no se note.
---
