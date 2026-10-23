---
template: big-list
recipe: energy-loud
label: Dora Metrics - 2
variant: numeric
fields:
  title: { content: "", meta: Title_Text }
itemsMarkdown: |
  1. Velocidad
      a. Lead Time
      b. Deploy Frequency
  2. Estabilidad
      a. Change Failure Rate
      b. Mean Time to Repair
notes: |
  Dos de velocidad: cuánto tardás desde que hacés un commit hasta que está en producción, y cuántas veces desplegás. Y dos de estabilidad: qué porcentaje de tus despliegues rompe algo, y cuánto tardás en recuperarte cuando se rompe.
  Lo bueno de DORA es que por primera vez alguien demostró con datos que velocidad y estabilidad no son enemigas: los mejores equipos tenían las cuatro bien a la vez.
  Pero DORA tenía un problema. Mide el sistema, la pipeline: si el código fluye limpio hasta producción. No mide a las personas. Podés tener las cuatro métricas DORA en verde con un equipo quemado, o desplegando cincuenta veces al día cosas que a nadie le importan. Y además, como son cuatro números, pasó lo que ya sabemos: se convirtieron en objetivo. Goodhart otra vez.
---
