---
template: viz
recipe: canvas-quiet
label: Métricas de vanidad vs proyecto
revealStart: 0
steps: 2
variant: default
fields:
  stage:
    meta: Stage_HTML
    content: |
      <svg viewBox="0 0 1680 560" preserveAspectRatio="xMidYMid meet">
      <rect class="bar" data-from="1" x="625" y="130" width="110" height="150" rx="12" style="--d:0.00s"/>
      <rect class="bar" data-from="1" x="785" y="85" width="110" height="195" rx="12" style="--d:0.15s"/>
      <rect class="bar" data-from="1" x="945" y="40" width="110" height="240" rx="12" style="--d:0.30s"/>
      </svg>
      <div class="legend">
      <span data-from="1" data-until="2" style="--c:var(--recipe-em)">Tus métricas · líneas, commits, PRs</span>
      <span data-from="2" style="--c:var(--recipe-warn)">El proyecto · calidad, escalabilidad, mantenimiento</span>
      </div>
      <style>
      .s-viz .legend { height: 36px; position: relative; }
      .s-viz .legend > span { position: absolute; left: 0; right: 0; justify-content: center; transition: opacity .6s; }
      .s-viz .stage svg rect.bar[data-from] { opacity: 1; fill: var(--recipe-em); transform-box: fill-box; transform-origin: 50% 100%; transform: scaleY(0); transition: transform 1.2s cubic-bezier(.6,0,.2,1) var(--d), fill 1.2s ease var(--d); }
      .s-viz .stage svg rect.bar[data-from].is-on { transform: scaleY(1); }
      section.s-viz[data-step="2"] .stage svg rect.bar[data-from].is-on { transform: scaleY(-1); fill: var(--recipe-warn); }
      </style>
  note: { content: 'Ilustrativo.', meta: Note_Text }
notes: |
  Y fíjense lo que pasa. Con todo ese código, parece que somos súper productivos: suben las líneas, los commits, las PRs. Nuestras métricas de vanidad están por las nubes.
  Pero como dijimos antes, el código es un pasivo. Cuantas más líneas, más mantenimiento, más recursos, más superficie para bugs.
  Y mientras nuestras métricas suben, la calidad del proyecto, su escalabilidad y su mantenibilidad se hunden.
  A veces ni siquiera es culpa nuestra del todo: Claude genera más código del necesario, o simplemente no limpiamos lo que sobra.
---
