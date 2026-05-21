---
template: chart
recipe: canvas-signal
order: 19
label: "Chart · bar"
variant: bar
fields:
  eyebrow:
    content: "◆ Lead time por equipo"
    meta: "Eyebrow_Label"
  title:
    content: "Equipo A entrega<br>tres veces más rápido."
    meta: "Title_Text"
  note:
    content: "Tiempo desde abrir el ticket hasta llegar a producción · datos del último trimestre."
    meta: "Chart_Note"
bars:
  - { pct: 80, color: "var(--recipe-accent)", value: "9.2d", label: "Equipo C" }
  - { pct: 45, color: "var(--recipe-warn)",   value: "5.1d", label: "Equipo B" }
  - { pct: 25, color: "var(--recipe-em)",     value: "3.0d", label: "Equipo A", nColor: "var(--recipe-em)" }
---
