---
template: demo
recipe: canvas-quiet
order: 33
label: "Demo · default"
fields:
  url:        { content: "metrics.internal.chimi/dashboards",  meta: "URL" }
  main_title: { content: "El dashboard real.",                 meta: "Main_Title" }
  main_sub:   { content: "Métricas de pipeline al cierre del trimestre.", meta: "Main_Sub" }
  caption:    { content: "Cierre Q1 2026 · cinco equipos en el nuevo pipeline.", meta: "Caption_Text" }
sidebar:
  - { label: "Overview",   active: true }
  - { label: "Pipelines" }
  - { label: "Incidentes" }
  - { label: "On-call" }
  - { label: "Releases" }
cards:
  - { k: "Lead time",    v: "3.0d" }
  - { k: "Deploy freq",  v: "25/d" }
  - { k: "CFR",          v: "1.2%" }
---
