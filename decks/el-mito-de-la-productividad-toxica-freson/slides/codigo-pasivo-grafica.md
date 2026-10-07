---
template: viz
recipe: critical
label: Código pasivo · gráfica
revealStart: 0
steps: 3
variant: default
fields:
  stage:
    meta: Stage_HTML
    content: |
      <svg viewBox="0 0 1680 560" preserveAspectRatio="xMidYMid meet">
        <path class="draw" data-from="1" pathLength="1" fill="none" stroke="var(--recipe-ink)" stroke-width="10" stroke-linecap="round"
          d="M60 490 C 500 436, 1100 304, 1620 210"/>
        <path class="draw" data-from="2" pathLength="1" fill="none" stroke="var(--recipe-em)" stroke-width="12" stroke-linecap="round"
          d="M60 490 C 760 488, 1160 470, 1340 340 C 1450 262, 1550 130, 1620 12"/>
        <path class="draw" data-from="3" pathLength="1" fill="none" stroke="var(--recipe-ink)" stroke-opacity=".55" stroke-width="8" stroke-linecap="round" stroke-dasharray="1"
          d="M60 490 C 170 320, 340 240, 600 214 C 900 188, 1280 214, 1620 290"/>
      </svg>
      <div class="legend">
        <span data-from="1" style="--c:var(--recipe-ink)">Líneas de código acumuladas</span>
        <span data-from="2" style="--c:var(--recipe-em)">Coste de mantenerlas (la hipoteca)</span>
        <span data-from="3" style="--c:var(--recipe-ink)">Valor entregado</span>
      </div>
  note: { content: 'Datos ilustrativos.', meta: Note_Text }
notes: |
  Cada línea que escribimos es, desde el segundo uno, código legacy. Es una superficie nueva para que aparezcan bugs, una dependencia que hay que actualizar y una carga cognitiva para el que venga después.
  Las líneas acumuladas suben, pero el coste de mantenerlas sube más rápido y acaba por superarlas, mientras el valor que entregamos se aplana.
  El código no es el oro, el código es la hipoteca que pagamos para poder entregar valor.
---
