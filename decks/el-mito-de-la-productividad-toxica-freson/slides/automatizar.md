---
template: icon
recipe: cool-fresh
label: Automatizar
variant: default
items:
  - { glyph: '<img src="assets/icon-comment-repeat.svg" alt="">' }
  - { glyph: '<img src="assets/icon-doc-gear.svg" alt="">' }
  - { glyph: '<img src="assets/icon-path-check.svg" alt="">' }
  - { glyph: '<img src="assets/icon-chaos.svg" alt="">' }
notes: |
  Segundo, automatizar lo que repetís a mano. Y el mejor sitio para descubrir qué repetís son los comentarios de las PRs. En Eventbrite teníamos un repo de infraestructura para los deeplinks, y antes de tocar producción tenías que hacer el cambio en dev y en staging. Y a todos los que llegábamos nuevos nos caía el mismo comentario: "primero la PR en staging, cuando esté OK, recién ahí la de producción". Cada vez. Durante años. Eso es una regla de lint, o una instrucción del agente, no un comentario.
  Un ejercicio concreto: pídanle a la IA que analice los comentarios de las PRs de los últimos seis meses, sobre todo los que reciben los que no son code owners, y que les diga qué se repite. Lo que se repite se codifica. Lo que se codifica deja de costar tiempo de revisión.
  Lo mismo con la documentación: que se genere desde el código y se valide en CI, en vez de escribirla a mano y que caduque en dos semanas. Con los tests de los caminos críticos que nadie cubrió porque siempre había algo más urgente. Y con chaos engineering, para comprobar que esos tests de verdad detectan algo cuando se rompe.
  Todo esto son tareas que siempre supimos que había que hacer y que no hacíamos porque se tardaba muchísimo. Ahora son una tarde.
---
