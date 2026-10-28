---
template: big-list
recipe: critical
variant: bullets
label: DX Core 4 · Quality
fields:
  title: { content: QUALITY, meta: Title_Text }
itemsMarkdown: |
  * Change failure rate
  * Failed deployment recovery time
  * Perceived software quality
  * Operational health & security metrics
notes: |
  Tercera: calidad. Y esta existe para contrapesar a la primera. Si solo midieras velocidad, la forma más rápida de subirla es romper cosas. Por eso la métrica principal es el change failure rate: qué porcentaje de lo que desplegás rompe algo. Y cuánto tardás en recuperarte cuando pasa.
  Las otras dos son las interesantes: la calidad percibida, otra vez una pregunta a la gente, porque los ingenieros saben perfectamente qué partes del sistema dan miedo tocar aunque ningún dashboard lo diga. Y la salud operativa y la seguridad, que es lo que se paga con la deuda.
  Acá vuelve el código como pasivo: cada línea que metés para ir más rápido aparece tarde o temprano en esta dimensión. Velocidad y calidad se vigilan mutuamente. No podés optimizar una sin que la otra te avise.
---
