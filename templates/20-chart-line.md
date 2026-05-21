---
template: chart
recipe: canvas-signal
order: 20
label: "Chart · line"
variant: line
fields:
  eyebrow:
    content: "◆ CI duration"
    meta: "Eyebrow_Label"
  title:
    content: "El día que sacamos<br>la dependencia."
    meta: "Title_Text"
line:
  area: "M0,80 L166,130 L333,180 L500,100 L666,240 L833,300 L1000,340 L1000,400 L0,400 Z"
  path: "M0,80 L166,130 L333,180 L500,100 L666,240 L833,300 L1000,340"
  path2: "M0,200 L166,200 L333,200 L500,200 L666,200 L833,200 L1000,200"
  points:
    - { x: 0,    y: 80,  kind: "dot" }
    - { x: 166,  y: 130, kind: "dot" }
    - { x: 333,  y: 180, kind: "dot" }
    - { x: 500,  y: 100, kind: "peak", r: 12 }
    - { x: 666,  y: 240, kind: "dot" }
    - { x: 833,  y: 300, kind: "dot" }
    - { x: 1000, y: 340, kind: "dot" }
  labels:
    - { x: 510, y: 86,  text: "sacamos la dep monolítica" }
    - { x: 910, y: 194, text: "baseline objetivo", opacity: 0.7 }
  xaxis: ["sem -6", "sem -5", "sem -4", "sem -3", "sem -2", "sem -1", "hoy"]
  legend:
    - { key: "a", label: "CI duration (min)" }
    - { key: "b", label: "Objetivo" }
---
