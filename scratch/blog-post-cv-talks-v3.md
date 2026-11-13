---
type: post
title: "Me hice mi propio Keynote (y el culpable es Figma)"
status: draft
created: 2026-10-29
published_at: 2026-10-29
channels:
  - chimichurreria
  - linkedin
topics:
  - speaking
  - engineering
  - design-system
tags:
  - talks
  - slides
  - eleventy
  - design-system
  - side-project
cover: '[[06-attachments/posts/2026-10-cv-talks/cover-player-freson.png]]'
---

# Me hice mi propio Keynote (y el culpable es Figma)

> Empecé en Google Slides, fui feliz en Figma y terminé con un sistema propio: editor, vista de orador, mando en el celular y modo sin wifi. Nadie me lo pidió. Lo necesitaba yo.

![[06-attachments/posts/2026-10-cv-talks/cover-player-freson.png|El player de "El mito de la productividad tóxica" en modo presentación]]

## Martes, once de la noche

Un martes a las once de la noche, dos días antes de una charla, abrí la presentación para cambiar una cifra. Una. Terminé a la una y media. No por la cifra: por la portada, que tenía otra tipografía que el resto del deck. Y el resto del deck tenía otra que la charla anterior. Y la charla anterior no se parecía a mi web.

<!-- TBD Nico: si la escena real fue otra, ponela. Lo que importa es que sea una noche concreta, no "a veces me pasaba". -->

Conté. Tenía tres charlas y cuatro marcas personales. La cuarta era la web.

Esa noche no arreglé la tipografía. Me quedé pensando por qué me pasaba siempre lo mismo.

## Google Slides, o la hoja en blanco

Empecé a dar charlas con Google Slides. Como todo el mundo. Abrís una plantilla, cambiás el azul corporativo por otro azul corporativo y a los cuarenta minutos tenés una slide que dice "Agenda" con cuatro bullets.

Google Slides no es malo. El problema es otro: cada slide es una hoja en blanco. Y una hoja en blanco te obliga a decidir todo de nuevo. El tamaño del título. El color del acento. Dónde va la cita. Uno decide distinto cada vez, y peor un martes a las once de la noche.

Así nacen las cuatro marcas. Nadie las elige. Se acumulan.

## Figma, o el amor

Hace unos años me pasé a Figma y ahí fui feliz de verdad. En Figma pude hacer lo que hace un ingeniero cuando algo le molesta: sistematizarlo.

Me armé un sistema de diseño. Colores con nombre. Tipografías con un rol cada una. Y sobre eso, mis templates: la slide de cifra grande, la de cita, la de tres ideas, la portada. Preparar una charla pasó a ser elegir componentes y rellenarlos. Las charlas por fin se parecían entre sí. Y se parecían a mí.

<!-- TBD Nico: una captura del Figma viejo con los templates. Es la imagen que más cuenta la historia. -->

Figma tenía una trampa, y la trampa era yo.

Los templates los hacía yo. El texto lo escribía yo. Cuando quería reusar una slide de otra charla, la copiaba yo, la pegaba yo y después pasaba diez minutos arreglando lo que se había roto en el viaje. Figma es un lienzo enorme para diseñar. No es un formato. No se diffea. No se versiona de forma que un humano pueda leer. No lo abre nadie que no sea Figma.

Y entonces llegó la pregunta que rompió todo.

## La pregunta

Con la IA ya metida en mi día a día, empecé a querer otra cosa: **hacer las slides hablando**. Contarle la charla a un agente como se la contaría a un amigo en un bar. Que la estructura, las slides y las notas aparezcan solas, con mis templates y mi sistema de diseño.

Para que una IA te arme las slides, las slides tienen que ser algo que una IA pueda escribir.

Figma no lo era. Un fichero de texto, sí.

<!-- TBD Nico: acá va el flujo real de voz. Con qué dictás, qué agente usás, un ejemplo de "le digo X y aparece Y". Es el párrafo que más vida le daría al post. Claude Code aparece como coautor en los commits, por si querés nombrarlo. -->

Así que me hice mi propio Keynote. Se llama `cv-talks`. Nació en mayo de 2026 como una carpeta dentro de otro proyecto y hoy es el sistema con el que armo, ensayo y doy todas mis charlas. Lo que sigue es qué es, por qué está hecho así y la lista completa de lo que le fui agregando porque lo necesitaba un jueves.

## Una slide es un fichero

La idea base cabe en una línea: una slide es un fichero Markdown con frontmatter YAML. Un deck es una carpeta de esos ficheros. No hay base de datos. Git guarda el historial. El sistema de ficheros es la fuente de verdad.

```yaml
---
template: big-stat
recipe: canvas-signal
label: "Adopción · 300%"
variant: default
fields:
  stat_number: { content: "300%", meta: "Stat_Number" }
items:
  - { text: "Enterprise tier creció 4×" }
notes: |
  Acá freno. Dos segundos de silencio antes de la cifra.
  Si nadie se ríe del 300 %, seguir igual. Son profesionales.
---
```

Tres líneas de ese fichero cargan con todo el peso.

**`template`** es mi componente de Figma, pero en texto. Hay más de cuarenta plantillas con sus variantes: portada, cifra grande, cita en cinco sabores, listas numeradas o con checklist o glosario, gráfico de barras, tabla comparativa, matriz, código, roadmap, nube de palabras, cierre con QR. Cada una tiene su layout y su CSS acotado. Yo no diseño slides. Elijo una plantilla y le doy contenido.

**`recipe`** dice cómo se pinta. Es el corazón del asunto y tiene su propia sección más abajo.

**`notes`** son las notas del orador. Viven en el mismo fichero que el contenido. Para mí las notas son el setenta por ciento del trabajo: el guion, los silencios, dónde le pregunto a la sala. En Google Slides eran un cajoncito gris. Acá, cuando cambio una slide, cambio su guion en el mismo commit.

El orden de las slides no vive en el nombre del fichero. Ya cometí ese error una vez, y renumerar setenta ficheros a mano no es un hobby. Vive en un `deck.config.json` por deck. Ese mismo fichero guarda la **estructura narrativa**: secciones con nombre, descripción y rango de slides, anidables. "El mito de la productividad tóxica" usa ANSVA, la estructura de Fer Miralles: Atención, Necesidad, Solución, Visión, Acción. "El programador consciente" son tres preguntas. Cuando inserto o borro una slide, los límites se corren solos.

![[06-attachments/posts/2026-10-cv-talks/editor-sidebar-ansva.png|La estructura ANSVA del deck, como secciones en el editor]]

Todo esto lo convierte [Eleventy](https://www.11ty.dev/) en HTML estático y se despliega en Vercel. En producción no hay servidor. Hay una funcioncita, y de esa hablo más abajo.

## Seis recetas y se acabó

Lo que arregló el drama de las cuatro marcas no fue el formato de ficheros. Fue sacar los colores y las tipografías de las slides y meterlos en un paquete aparte: `@chimichurricode/design-system`. Hoy lo comparten las charlas, este blog y el resto de mis webs. Lo que en Figma era "mi sistema de diseño" ahora es un paquete de npm. Las slides y la web toman de la misma canilla.

El concepto central se llama **recetas**. Una receta es una combinación cerrada de cinco roles de color:

| Rol | Para qué sirve |
|---|---|
| `surface` | El fondo dominante |
| `ink` | El texto principal |
| `em` | El itálico argumentativo, el color del `<em>` |
| `accent` | Enlaces, eyebrows, numerales de KPI |
| `warn` | Lo que contradice, lo que es anti-patrón |

Hay seis recetas. Ni una más.

- `canvas-quiet`: carbón y marfil. La que no se nota. Abre un deck denso.
- `canvas-signal`: la misma paleta, pero los datos mandan.
- `paper`: marfil, editorial. Para citas y lectura.
- `energy-loud`: limón y display enorme. Una por deck.
- `cool-fresh`: divisores y transiciones.
- `critical`: plasma. Para el disclaimer o la cifra que duele.

Cada slide declara una receta en su frontmatter. El build genera un bloque `[data-recipe="..."]` que rellena cinco variables CSS. El CSS de las plantillas solo puede leer esas cinco variables. No existe la slide "verde porque me pareció". Si mañana decido que el carbón pasa a azul marino, toco una entrada en un JSON y las trescientas y pico slides que tengo cambian a la vez. En Figma eso eran tres tardes.

![[06-attachments/posts/2026-10-cv-talks/recipes-six-swatches.png|Las seis recetas, una slide de ejemplo con cada una]]

Las recetas también cierran la tipografía. Cada una tiene una lista blanca de familias permitidas. En `canvas-quiet` no hay fuente de datos, porque no es una slide para cifras. En `paper` manda la editorial itálica. En `energy-loud` el display va al máximo y se permite una sola estadística. Las excepciones existen, pero tienen nombre y viven en un fichero. Si una plantilla quiere saltarse la regla, lo declara por escrito. Como un adulto.

<!-- TBD Nico: ¿nombramos las fuentes (CHANEY, Scilla, At Aero, Thunder, JetBrains Mono) y por qué cada una? Da para un párrafo lindo. -->

Suena restrictivo. Lo es, a propósito. Una pantalla mía se reconoce por una opinión fuerte y pocas excepciones. La jerarquía la hace la tipografía, no las cajas. Y lo mejor de tener la regla en código es que no me tengo que acordar de ella: un linter avisa si una slide usa una fuente que su receta no permite. El linter no se cansa un martes a las once de la noche.

### Dos modos de render

Cada campo de una slide tiene un `content`, lo que se ve, y un `meta`, el nombre del campo. Con `SLIDE_MODE=meta` el deck entero se renderiza con "Title_Text", "Stat_Number" y "Eyebrow_Label" en lugar del contenido. Sirve para revisar el diseño sin que el texto te distraiga. Y es la galería de plantillas que usa el editor.

![[06-attachments/posts/2026-10-cv-talks/dual-mode-content-vs-meta.png|La misma slide en modo content y en modo meta]]

## El editor, o cómo se me fue de las manos

Al principio editaba los ficheros a mano. Era feliz. Me duró dos semanas.

Cuando ensayás y querés mover tres slides, cambiar una palabra y ver cómo queda, el ciclo de editar YAML, guardar y recargar te saca del flujo. Y uno es ingeniero: cuando algo te molesta tres veces, lo automatizás. Cuando te molesta cinco, te hacés un producto sin querer.

Me hice un editor. Corre en local con [Bun](https://bun.sh/), sin bundler, módulos ES servidos tal cual. Hace lo que hace una herramienta de slides, pero sobre mis ficheros. Y acá está lo importante: no tiene formato propio. Lee y escribe el mismo Markdown que puedo tocar con Vim, que versiona Git, que construye Eleventy y que puede escribir una IA. Los scripts de consola para crear un deck o una slide usan el mismo código que el editor. Si mañana lo borro, no pierdo nada.

![[06-attachments/posts/2026-10-cv-talks/editor-overview.png|El editor: lista de slides, formulario, preview y notas]]

Las tres cosas que más uso:

**La preview en vivo.** Escribís y a los 150 milisegundos ves la slide real, renderizada por Eleventy, con las fuentes de verdad. No es una aproximación. Es la misma página que se va a proyectar.

**El formulario por plantilla.** Elegís "quote" y te pide cita, autor y contexto. Elegís "big-list" y te da un editor de ítems con sub-ítems. Si cambiás de plantilla a mitad de camino, el contenido no se pierde: el editor se lo guarda por si volvés.

**Los assets desde el portapapeles.** Copiás un SVG de donde sea, lo pegás en el campo y ya está en el deck con su ruta corta. Yo dibujo íconos a mano para cada charla. Solo esto justifica el proyecto.

![[06-attachments/posts/2026-10-cv-talks/editor-template-gallery.mp4|Añadir una slide desde la galería de plantillas]]

## Arriba del escenario

El player renderiza cada slide en 1920 por 1080 y la escala al viewport. Teclado, clicker, pantalla completa con una tecla. Al lado, una vista de orador con la slide actual, la siguiente y las notas. La abro en la notebook mientras el player va al proyector.

Por debajo de 768 píxeles el player cambia de modo solo. Cada slide se vuelve a renderizar a pantalla de celular con tipografía de web, y el deck pasa a ser una pila vertical con `scroll-snap`. Quien escanea el QR del final puede leer la charla en el teléfono deslizando con el pulgar, en vez de pellizcar una imagen de 1920 píxeles. Los 768 píxeles no son un número al azar: son el token `--md` del sistema de diseño, el mismo que usan las webs.

![[06-attachments/posts/2026-10-cv-talks/mobile-viewer.mp4|El mismo deck, deslizando en el móvil]]

### El mando en el celular

Empezó como un capricho. Hoy es lo que más uso.

Apretás **R** en el player y aparece un código de seis caracteres con su QR. Lo escaneás con el teléfono y tenés la slide actual, las notas y dos botones: anterior y siguiente. Chau clicker que se queda sin pila a mitad de la Necesidad.

![[06-attachments/posts/2026-10-cv-talks/remote-pairing.mp4|Emparejar el móvil con el player: código, QR, y las notas en la mano]]

Lo lindo está debajo, porque me negué a montar WebSockets para pasar de slide.

- Una función de Vercel y un Redis, los dos en Frankfurt para que el viaje sea corto. El celular manda `next` con un POST. El player hace long polling y lo aplica. Un tick de 200 milisegundos, un solo viaje por consulta.
- Cada pestaña del player tiene su sala privada. Puedo tener dos presentaciones abiertas y no se pisan.
- El código es de un solo uso y caduca a los diez minutos. Lo puede ver toda la sala en el proyector y nadie se cuela después. Cada celular recibe su propio token.
- La sesión se guarda en el teléfono y en la pestaña del player. Recargás cualquiera de los dos y no pasa nada. Si la sala caduca, el celular te propone volver a emparejar.

En local el relay corre dentro del editor, en memoria, con un Redis de juguete. El mismo handler, cero infraestructura.

### Modo sin wifi

La última pieza me sacó el único miedo que me quedaba: que se caiga el wifi del evento con el deck servido desde Vercel. Porque el wifi del evento se cae. Siempre. Es ley.

El player y el speaker registran un Service Worker. La primera vez que abrís la charla con conexión, se guarda el deck entero: slides, fuentes, imágenes, el speaker. Abajo a la derecha aparece `OFFLINE ✓`. Desde ese momento sirve siempre desde caché. Podés perder la red, recargar el player, abrir el speaker. Todo sigue. Si publico una versión nueva, el HUD avisa. Si faltó algún fichero, dice cuántos y reintenta cuando vuelve la conexión.

![[06-attachments/posts/2026-10-cv-talks/offline-badge.png|El HUD del player con la precarga completa]]

Mi checklist antes de salir al escenario tiene una sola línea: abrir el player en producción con red y esperar el tic.

Lo pruebo con un test de extremo a extremo que levanta el sitio construido, lo abre en un Chromium real y apaga el servidor de verdad. Conexión rechazada, no un mock. Después comprueba que puedo avanzar, saltar, recargar y abrir el speaker sin red.

## La lista completa, porque me la pidieron

Nada de esto estuvo nunca en un roadmap. Cada feature apareció porque un día la necesité, casi siempre el día antes de una charla. Esta es la lista entera, por si te sirve como mapa de lo que te vas a terminar haciendo si arrancás este camino.

**Formato y contenido**

- Una slide por fichero Markdown con frontmatter YAML; un deck por carpeta; Git como historial.
- Más de cuarenta plantillas con variantes, cada una con su layout y su CSS acotado.
- Plantillas de visualización con SVG animado (el gráfico de Goodhart, el pictograma de Jevons, la capa de superhéroe que se vuelve gris). Se incrustan inline en el build y heredan las fuentes del sistema.
- Plantillas de ícono, de nube de palabras y de media a sangre.
- Campos con doble modo `content` y `meta`; render del deck entero en modo meta para revisar diseño.
- Listas escritas en Markdown dentro del frontmatter: viñetas, numeradas, checklist, glosario, sub-ítems.
- Orden de slides desacoplado del nombre del fichero, en `deck.config.json`.
- Estructura narrativa por deck (ANSVA, tres preguntas, la que sea): secciones con nombre, descripción, rango y sub-secciones, que se desplazan solas al insertar o borrar.
- Notas del orador en el mismo fichero que la slide.
- Documentos de ensayo por deck (análisis ANSVA, guion por slide) que viven junto a las slides y no se publican.
- Rutas cortas de assets que el build expande.
- Formateador canónico de YAML para todas las slides, con comprobación en CI.

**Sistema de diseño**

- Tokens en JSON compilados a variables CSS con Style Dictionary. Tres capas: primitivas, recetas, utilidades.
- Seis recetas cerradas de cinco roles de color; las plantillas solo leen `--recipe-*`.
- Lista blanca tipográfica por receta y excepciones con nombre.
- Linter que detecta fuentes fuera de receta y patrones de "plantilla generada": degradados, cristal esmerilado, grids de tarjetas con iconito.
- Fuentes del sistema sincronizadas en el build; se despliegan solas en Vercel.
- El mismo paquete para las slides, el blog y las webs. El breakpoint móvil de las slides es el `--md` de la web.

**Editor**

- Lista de slides con las secciones narrativas como cabeceras y sus descripciones en tooltip.
- Reordenar arrastrando; mover secciones enteras; renumeración automática.
- Formulario generado por plantilla y variante; cambiar de plantilla no pierde el contenido.
- Editor de texto enriquecido con conmutador a Markdown crudo.
- Editor de ítems con sub-ítems para las listas.
- Preview en vivo del render real de Eleventy, con 150 milisegundos de debounce.
- Autoguardado; badge de "cambios sin guardar" y badge de "modificada respecto a Git" por slide.
- Revertir una slide a HEAD con un botón.
- Galería visual de plantillas para añadir slide, con zoom al pasar el ratón y la plantilla renderizada en modo meta.
- Duplicar slide (con resolución de colisiones de nombre), borrar y mover a una posición, desde un menú contextual.
- Navegación entre slides con las flechas; la slide activa se centra sola en la lista.
- Deck y slide seleccionados persistidos en la URL, para recargar y seguir donde estabas.
- Subida de imágenes con redimensionado solo cuando hace falta.
- Pegar un SVG desde el portapapeles directo a un campo de imagen.
- Selector de assets con búsqueda; campos de solo imagen que no dejan escribir texto por error.
- Navegador de los íconos del sistema de diseño, insertables con un clic.
- Panel de notas del orador debajo de la preview.
- Visor del Markdown crudo de la slide.
- Exportar el deck entero a PDF.
- Botón "Present" y botón "Present + phone", que abre el player con el mando ya emparejado.
- Scripts de consola para crear deck y slide que comparten el código del editor.

**Player y speaker**

- Lienzo de 1920×1080 escalado al viewport; modo presentación y pantalla completa con una tecla; `?present=1` para arrancar directo.
- Teclas de clicker (PageUp, PageDown, flechas arriba y abajo) además de las normales.
- Navegación entre slides también cuando abrís una slide suelta fuera del player.
- Vista de orador con slide actual, siguiente, notas y HUD.
- Modo móvil automático por debajo de 768 píxeles: pila vertical con scroll-snap y tipografía web; forzable con `?view=`.
- Animaciones de portada y transiciones "concept-shift": lo viejo se transforma en lo nuevo al cargar.
- SEO por deck generado en el build y redirecciones de las URLs viejas.

**Mando a distancia**

- Sala privada por pestaña del player; código de emparejamiento de seis caracteres, de un solo uso, con QR, que caduca a los diez minutos.
- Token por dispositivo; desvincular todos los celulares con una tecla; darse de baja desde el teléfono.
- Long polling sobre una función de Vercel y Redis en la misma región; sin WebSockets.
- Sesión persistida en ambos lados; sobrevive recargas y propone re-emparejar si la sala caduca.
- El celular muestra la slide actual y las notas, no solo dos botones.
- Relay en memoria dentro del editor para desarrollar sin infraestructura.

**Offline**

- Service Worker que precarga el deck entero (slides, speaker, fuentes, imágenes) y sirve siempre desde caché.
- Badge en el HUD con los estados: listo, faltan N ficheros, hay versión nueva.
- Página "Sin conexión" con la receta `critical` para lo que no estaba en caché.
- Caché versionada por build; los 404 se recuerdan para no reintentarlos.
- Activación solo en producción; en local se prueba con `?offline=1` y se desinstala con `?offline=0`.

**Calidad**

- Casi 1.300 tests unitarios y de integración, y 40 de extremo a extremo con Playwright sobre un deck de prueba temporal con su propio repo Git.
- Test de arquitectura: falla si una capa importa de otra que no debe o si la UI tiene un ciclo de imports.
- Test de módulos del navegador: parsea cada fichero y falla si hay un nombre sin declarar o un import que apunta a un export inexistente. No hay TypeScript ni bundler. Estas son las puertas.
- Test que compara mi parser YAML con `gray-matter`, el de Eleventy, sobre todas las slides reales, antes y después de serializar.
- Test offline en Chromium real con el servidor apagado de verdad.

## Lo que me enseñó tratarlo como un producto

Hace una semana le hice una auditoría de arquitectura. Había crecido a golpe de "lo necesito para el jueves" y se notaba: un `app.js` de 2.700 líneas, un router que hacía de todo, dos sitios que escribían el mismo JSON con formato distinto. El refactor salió en commits chicos. Dejó cuatro capas con dependencias en una sola dirección y un `app.js` de cien líneas repartido en treinta módulos. Los tests pasaron de 626 a casi 1.300.

La lección que me llevo vino del formateador. Al pasar las 333 slides por el formato canónico y comparar el resultado con `gray-matter`, aparecieron cuatro bugs en mi propio parser. Cuatro bugs que habrían perdido datos en silencio: strings que YAML lee como número, como `"2012."`; espacios finales en las notas; ítems de lista con varias claves que se truncaban al primero. Nada se había roto todavía. Se iba a romper el día de la charla, que es cuando se rompen las cosas.

Si escribís un parser propio, escribí también el test que lo compara con el de referencia sobre datos reales. Antes del jueves.

## Qué sigue

<!-- TBD Nico: ajustá esta lista a lo que de verdad tengas en la cabeza. -->

- Las slides densas o con posicionamiento absoluto todavía necesitan cariño en modo móvil.
- Playwright lanza un Chromium por cada PDF. Para una herramienta local alcanza, pero duele.
- Cerrar el círculo: que la charla salga de una conversación de voz y a mí me quede solo ensayarla.
- Abrir las plantillas para que otra persona arme su deck con su propio sistema de diseño.

## Otra vez martes

El martes pasado, a las once de la noche, abrí una charla para cambiar una cifra. Cambié la cifra. Cerré la notebook a las once y cuatro.

La portada tenía la misma tipografía que el resto del deck. El deck, la misma que la charla anterior. La charla anterior, la misma que esta web. No porque me haya vuelto disciplinado. Porque ya no decido: eligió el sistema, una vez, y lo escribí en un JSON. Que es lo más parecido a grabar en piedra que tenemos los que programamos.

<!-- TBD Nico: cierre con CTA real. ¿Link al repo si lo abrís? ¿A la charla de FresOn? ¿Newsletter? -->
