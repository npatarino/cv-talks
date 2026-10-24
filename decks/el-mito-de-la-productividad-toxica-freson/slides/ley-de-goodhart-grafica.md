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
        <path class="draw" data-from="1" pathLength="1" fill="none" stroke="var(--recipe-accent)" stroke-width="10" stroke-linecap="round" d="M60 320 C 250 316, 550 324, 800 320"></path>
        <path class="draw" data-from="1" pathLength="1" fill="none" stroke="var(--recipe-em)" stroke-width="10" stroke-linecap="round" d="M60 334 C 250 338, 550 330, 800 334"></path>
        <path class="draw" data-from="2" pathLength="1" fill="none" stroke="var(--recipe-accent)" stroke-width="10" stroke-linecap="round" d="M800 320 C 1100 316, 1440 240, 1620 30"></path>
        <path class="draw" data-from="2" pathLength="1" fill="none" stroke="var(--recipe-em)" stroke-width="10" stroke-linecap="round" d="M800 334 C 950 346, 1120 450, 1620 530"></path>
      </svg>
      <div class="legend">
        <span data-from="1" style="--c:var(--recipe-accent)">PRs por semana</span>
        <span data-from="1" style="--c:var(--recipe-em)">Impacto real</span>
      </div>
  note: { content: Datos inventadísimos., meta: Note_Text }
notes: |
  Miren lo que pasa con una métrica cualquiera, por ejemplo PRs por semana.
  Al principio la métrica y el impacto van de la mano, estables: las PRs que hacen falta, el impacto que generan. Hasta que esa métrica se vuelve el objetivo.
  A partir de ahí, la métrica sigue subiendo (partimos las tareas en cinco PRs, metemos tests que no testean nada), pero el impacto real se queda plano o incluso cae.
  Esa brecha es la Ley de Goodhart.
---
