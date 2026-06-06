---
template: big-list
recipe: canvas-quiet
label: Automatización ejemplos
variant: checklist
fields:
  title: { content: "", meta: Title_Text }
itemsMarkdown: |
  - [-] Hacer y correr tests.
  - [x] Chaos engineering para validar tus tests.
  - [-] Escribir documentación.
  - [x] Linter semántico para validar que las specs.
  - [-] Planear e implementar refactors.
  - [x] Deuda técnica fantasma.
notes: |
  No sé, analizá los comentarios de las PRs de aquellos que no son Code Owners del repo, tal vez te ayuda a entender cuáles son los errores típicos. En eventbrite teníamos un repo de infraestructura para trabajar con los deeplinks, y antes de hacer los cambios en producción tenías que hacerlos en dev y staging, y casi siempre los que tocábamos el repo de nuevas siempre teníamos ese comentario, primero PR en staging, cuando todo esté OK, recién ahí la PR a producción. Vamos a trabajar ahí.
---
