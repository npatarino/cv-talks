---
template: big-list
recipe: canvas-quiet
order: 23
label: "Big-list · numeric"
variant: numeric
fields:
  title: { content: "DORA · velocidad<br>y <em>estabilidad</em>.", meta: "Title_Text" }
items:
  - { text: "<b>Velocidad</b>", sub: [
      { n: "a", text: "Lead Time" },
      { n: "b", text: "Deploy Frequency" }
    ] }
  - { text: "<b>Estabilidad</b>", sub: [
      { n: "a", text: "Change Failure Rate" },
      { n: "b", text: "Mean Time to Repair" }
    ] }
---
