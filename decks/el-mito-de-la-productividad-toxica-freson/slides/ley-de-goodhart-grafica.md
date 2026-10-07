---
template: viz
recipe: canvas-quiet
label: Ley de Goodhart · gráfica
revealStart: 0
steps: 2
variant: default
fields:
  stage:
    meta: Stage_HTML
    content: |
      <svg viewBox="0 0 1680 560" preserveAspectRatio="xMidYMid meet">
        <path class="draw" data-from="1" pathLength="1" fill="none" stroke="var(--recipe-accent)" stroke-width="10" stroke-linecap="round"
          d="M60 460 C 220 430, 420 380, 800 300"/>
        <path class="draw" data-from="1" pathLength="1" fill="none" stroke="var(--recipe-em)" stroke-width="10" stroke-linecap="round"
          d="M60 466 C 220 438, 420 390, 800 310"/>
        <path class="draw" data-from="2" pathLength="1" fill="none" stroke="var(--recipe-accent)" stroke-width="10" stroke-linecap="round"
          d="M800 300 C 1020 230, 1290 110, 1620 30"/>
        <path class="draw" data-from="2" pathLength="1" fill="none" stroke="var(--recipe-em)" stroke-width="10" stroke-linecap="round"
          d="M800 310 C 920 290, 1020 300, 1170 350 C 1320 400, 1420 430, 1620 460"/>
      </svg>
      <div class="legend">
        <span data-from="1" style="--c:var(--recipe-accent)">PRs por semana</span>
        <span data-from="1" style="--c:var(--recipe-em)">Impacto real</span>
      </div>
  note: { content: 'Datos ilustrativos.', meta: Note_Text }
notes: |
  Miren lo que pasa con una métrica cualquiera, por ejemplo PRs por semana.
  Al principio la métrica y el impacto real suben juntos: más PRs, más cosas entregadas. Hasta que esa métrica se vuelve el objetivo.
  A partir de ahí, la métrica sigue subiendo (partimos las tareas en cinco PRs, metemos tests que no testean nada), pero el impacto real se queda plano o incluso cae.
  Esa brecha es la Ley de Goodhart.
---
