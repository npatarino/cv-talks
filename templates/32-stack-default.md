---
template: stack
recipe: canvas-quiet
order: 32
label: "Stack · default"
fields:
  eyebrow: { content: "◆ Cómo se monta una plataforma", meta: "Eyebrow_Label" }
  title:   { content: "Cuatro capas,<br>cero magia." ,  meta: "Title_Text" }
  note:    { content: "Elegimos componentes con comunidad fuerte · cambiarlos a futuro es barato.", meta: "Note_Text" }
layers:
  - { label: "Edge",         items: ["Cloudflare", "Fastly", "Vercel"],      version: "global" }
  - { label: "Compute",      items: ["Kubernetes", "Lambda", "Fly.io"],      version: "prod"   }
  - { label: "Datos",        items: ["Postgres", "Redis", "ClickHouse"],     version: "managed" }
  - { label: "Observability",items: ["Datadog", "Sentry", "OpenTelemetry"],  version: "shared" }
---
