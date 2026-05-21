---
template: kpi-grid
recipe: canvas-signal
order: 18
label: "KPI-grid · default"
fields:
  eyebrow: { content: "◆ Snapshot del último mes",     meta: "Eyebrow_Label" }
  title:   { content: "Cuatro números,<br>un relato.", meta: "Title_Text" }
  foot:    { content: "Datos al cierre del Q1 2026 · medición interna.", meta: "Footer_Text" }
kpis:
  - { n: "+30%", label: "CI time",        desc: "Pipeline más rápido." }
  - { n: "−40%", label: "Build failures", desc: "Menos noches rotas." }
  - { n: "25×",  label: "Deploys/día",    desc: "Casi en tiempo real." }
  - { n: "0",    label: "Hotfixes",       desc: "Cero · después del cambio." }
---
