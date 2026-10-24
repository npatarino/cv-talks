---
template: icon
recipe: cool-fresh
label: Automatizar
title: '<em>Automatizar</em>.'
variant: default
items:
  - { glyph: '<img src="assets/icon-comment-repeat.svg" alt="">' }
  - { glyph: '<img src="assets/icon-doc-gear.svg" alt="">' }
  - { glyph: '<img src="assets/icon-path-check.svg" alt="">' }
  - { glyph: '<img src="assets/icon-chaos.svg" alt="">' }
  - { glyph: '<img src="assets/icon-workflow.svg" alt="">' }
notes: |
  Segundo, automatizar lo que repetís a mano. Y el mejor sitio para descubrir qué repetís son los comentarios de las PRs. En Eventbrite teníamos un repo de infraestructura para los deeplinks, y antes de tocar producción tenías que hacer el cambio en dev y en staging. Y a todos los que llegábamos nuevos nos caía el mismo comentario: "primero la PR en staging, cuando esté OK, recién ahí la de producción". Cada vez. Durante años. Eso es una regla de lint, o una instrucción del agente, no un comentario.
  Un ejercicio concreto: pídanle a la IA que analice los comentarios de las PRs de los últimos seis meses, sobre todo los que reciben los que no son code owners, y que les diga qué se repite. Lo que se repite se codifica. Lo que se codifica deja de costar tiempo de revisión.
  Lo mismo con la documentación: que se genere desde el código y se valide en CI, en vez de escribirla a mano y que caduque en dos semanas. Con los tests de los caminos críticos que nadie cubrió porque siempre había algo más urgente. Y con chaos engineering, para comprobar que esos tests de verdad detectan algo cuando se rompe.
  Y aunque estamos en la parte de código, esto vale igual para los procesos. Automatizar el despliegue y el rollback, para que no dependan de la persona que sabe los pasos. El onboarding: accesos, entornos y repos listos el primer día, no la segunda semana. Los reportes de estado que alguien compila a mano cada viernes a partir de Jira. Las aprobaciones que siempre son "sí" y solo retrasan. El changelog y las release notes, que ya están en los commits. Cada proceso manual es pasivo igual que el código: alguien lo mantiene, alguien se equivoca y alguien es el único que sabe hacerlo.
  Todo esto son tareas que siempre supimos que había que hacer y que no hacíamos porque se tardaba muchísimo. Ahora son una tarde.
---
