---
template: quote
recipe: cool-fresh
label: Confianza vs fe
variant: default
fields:
  quote: { content: 'Todo lo que no es <em>confianza</em> es fe.<br>Y la fe, en el software, suele salir <em>cara</em>.', meta: Quote_Text }
  who: { content: "", meta: Quote_Attribution }
notes: |
  Todo lo que no es confianza es fe. Y la fe, en el software, suele salir cara. La confianza viene de evidencia: lo leíste, lo probaste, sabés por qué funciona. La fe viene de que la demo salió bien. Y en software la demo siempre sale bien.
  Les confieso algo: nunca me había sentido tan incómodo haciendo mi trabajo como últimamente. Escribo código con IA y todo se siente como una caja negra.
  Esto avanza tan rápido que, si fuera a revisar cada línea que genera, tardaría una eternidad. Y entonces acabás con sistemas que creaste vos sin entender del todo cómo funciona el código. Entendés la idea general, pero no cada detalle. Y sospecho que eso se está convirtiendo en la nueva norma.
  Va en contra de todos mis instintos como ingeniero: estoy acostumbrado a entender lo que construyo. Ahora lo que intento averiguar es cuánto necesito entender para sentirme cómodo siguiendo adelante.
  Y esto es lo que pasa con el código que escriben las IAs.
  Confiar en una línea de código es haberla leído, entendido y probado. Todo lo demás es fe: la metés al repo esperando que funcione.
  Y ojo, que lo que la IA hace mal de verdad casi nunca tumba nada. Eso sería fácil de ver. Lo que hace mal es el experimento que mide lo que no debía, la métrica que sube por el motivo equivocado, el caso que nadie pensó y que ahora está en producción con todos los tests en verde.
  Esa es la fe que sale cara: la pagás después, en bugs que nadie entiende, en incidentes a las tres de la mañana y en mantenimiento de cosas que nadie sabe por qué están ahí.
  Así que sí, usemos Claude, Copilot, lo que sea. Pero lo que generan hay que revisarlo igual que si lo hubiera escrito el junior nuevo del equipo.
  Mientras tanto, lo razonable me parece graduar: mirar menos donde equivocarse sale barato y tiene arreglo, mirar más donde no lo tiene, y en todos los casos tener claro qué esperamos ver antes de abrir el diff.
  PRs más pequeñas, cuanto más pequeño, más fácil de mirar, menos rompe...
---
