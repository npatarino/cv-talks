---
template: comparison-table
recipe: canvas-signal
order: 21
label: "Comparison-table · default"
fields:
  eyebrow: { content: "◆ Cuatro frameworks de productividad", meta: "Eyebrow_Label" }
  title:   { content: "DX Core 4 cubre<br>los cuatro ejes.",   meta: "Title_Text" }
  note:    { content: "★ columna destacada · la que pensamos adoptar el próximo trimestre.", meta: "Note_Text" }
columns:
  - { label: "Criterio" }
  - { label: "DORA" }
  - { label: "DX Core 4", featured: true }
  - { label: "SPACE" }
  - { label: "Ad-hoc" }
rows:
  - label: "Velocidad"
    cells:
      - { kind: "yes", value: "✓" }
      - { kind: "yes", value: "✓", featured: true }
      - { kind: "mid", value: "~" }
      - { kind: "no",  value: "✗" }
  - label: "Calidad"
    cells:
      - { kind: "mid", value: "~" }
      - { kind: "yes", value: "✓", featured: true }
      - { kind: "yes", value: "✓" }
      - { kind: "no",  value: "✗" }
  - label: "Impacto"
    cells:
      - { kind: "no",  value: "✗" }
      - { kind: "yes", value: "✓", featured: true }
      - { kind: "mid", value: "~" }
      - { kind: "no",  value: "✗" }
  - label: "Esfuerzo · 1-10"
    cells:
      - { kind: "num", value: "4" }
      - { kind: "num", value: "5", featured: true, color: "var(--recipe-accent)" }
      - { kind: "num", value: "7", color: "var(--recipe-accent)" }
      - { kind: "num", value: "2", color: "var(--recipe-accent)" }
  - label: "Adopción interna"
    cells:
      - { kind: "num", value: "alta" }
      - { kind: "num", value: "alta",  featured: true, color: "var(--recipe-accent)" }
      - { kind: "num", value: "media" }
      - { kind: "num", value: "alta" }
---
