---
type: post
title: "La cifra"
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

# La cifra

> Yo doy charlas. Hace doce años que las doy, y hasta hace cinco meses nunca había terminado una presentación antes de la una de la mañana.

![[06-attachments/posts/2026-10-cv-talks/cover-player-freson.png|El player de "El mito de la productividad tóxica" en modo presentación]]

<!-- TBD Nico: todo lo que está entre corchetes es escena inventada para que veas la forma. Reemplazala por la real: quién pasó, qué dijo, qué charla era, qué hora. Si no hubo nadie, inventá a alguien, que en las anécdotas vale mentir. -->

Yo doy charlas. Hace doce años que las doy, y hasta hace cinco meses nunca había terminado una presentación antes de la una de la mañana.

No por el contenido. El contenido lo tengo en la cabeza semanas antes, lo ensayo en la ducha, lo cuento en cenas hasta que los amigos me piden que cambie de tema. Lo que me comía la noche era otra cosa.

Un martes de abril, a las once y veinte, abrí la charla que daba el jueves para cambiar una cifra. Un 68 por ciento que en el paper actualizado era un 71. Un número. Treinta segundos.

A las once y cuarenta estaba cambiando la tipografía de la portada, porque al abrir el archivo vi que no era la misma que la del resto. A las doce y cuarto comparaba la portada con la de la charla anterior, que tampoco coincidía. A la una menos cuarto tenía abiertas las dos charlas, la web y una tercera presentación de 2023, y había encontrado cuatro grises distintos para el mismo texto secundario.

[A la una y diez pasó Ana por el living, con el vaso de agua de todas las noches.]

[—¿Cambiaste la cifra?]

[—Todavía no.]

[Ana miró la pantalla, donde había cuatro portadas en mosaico, y no dijo nada. Se fue a dormir sin decir nada, que es la forma más eficiente que conozco de decir algo.]

Cambié la cifra a la una y media. El 71 quedó bien. El resto quedó como estaba.

\* \* \*

Empecé con Google Slides, como todo el mundo. Es una herramienta honesta: te da una hoja en blanco y te deja solo. El problema es que la hoja en blanco te obliga a decidir todo, cada vez, y uno decide distinto a las once de la mañana que a las once de la noche. En tres años acumulé tres charlas y, conté esa noche de abril, cuatro versiones de mi propia marca. La cuarta era la web.

Después vino Figma, y con Figma fui feliz de una manera que me da un poco de vergüenza contar. Me armé un sistema de diseño: los colores con nombre, las tipografías con un rol cada una, un gris para el texto secundario y no cuatro. Sobre eso, mis templates. La slide de cifra grande, la de cita, la de tres ideas, la portada. Armar una charla pasó a ser elegir componentes y rellenarlos. Las charlas se parecían entre sí. Se parecían a mí.

Figma tenía un solo problema, y el problema era yo.

Los templates los hacía yo. El texto lo escribía yo. Cuando quería reusar una slide de otra charla, la copiaba yo, la pegaba yo, y después pasaba diez minutos arreglando lo que se había roto en la mudanza: la fuente que no viajó, el ícono que llegó con otro color, la cita que perdió la cursiva. Un archivo de Figma no se diffea. No se versiona de una forma que un humano pueda leer. No lo abre nadie que no sea Figma.

Y una noche, una IA me lo dijo en la cara.

\* \* \*

<!-- TBD Nico: esta es la escena del giro. Lo dispara otro: el agente. Poné el intercambio real si lo tenés. -->

[Era mayo. Yo ya le dictaba correos a un agente, le pedía que me ordenara las notas, que me resumiera papers. Una noche le pedí que me armara una charla. Se la conté como se la contaría a un amigo en un bar: veinte minutos de audio, con las anécdotas, las pausas y las tres ideas que quería que la gente se llevara.]

[Me devolvió una estructura preciosa. Secciones, tiempos, dónde ir rápido y dónde frenar. Y al final una pregunta:]

[—¿En qué formato están tus slides?]

[—En Figma.]

[—No puedo escribir en Figma. ¿Tenés los templates en algún formato de texto?]

[No los tenía. Tenía doce años de charlas en un formato que no podía leer nadie más que yo, y yo a las once de la noche.]

Esa fue la pregunta que me rompió el esquema. Para que una IA te arme las slides, las slides tienen que ser algo que una IA pueda escribir. Figma no lo era. Un fichero de texto, sí.

Me hice mi propio Keynote. Empezó el 21 de mayo como una carpeta dentro de otro proyecto. Una slide era un fichero Markdown. Un deck, una carpeta. El sistema de diseño que tenía en Figma pasó a ser un paquete de npm que hoy comparten las charlas, este blog y el resto de mis webs. Y ahora sí, cuando le cuento una charla a un agente, el agente me devuelve setenta ficheros con mi tipografía, mis colores y mis notas de orador, y yo me dedico a lo único que no puede hacer por mí: ensayar.

Después se me fue de las manos. Todas las herramientas se te van de las manos cuando las usás de verdad. Le hice un editor porque editar YAML a mano se me hizo cuesta arriba a las dos semanas. Le hice una vista de orador porque las notas se escriben mirando la slide. Le hice un mando a distancia en el celular porque un clicker se me quedó sin pila a mitad de una charla, justo en la parte en que hablaba de la planificación. Le hice un modo sin wifi porque el wifi de los eventos se cae con la puntualidad de un tren suizo.

Cada una de esas cosas la necesité un día antes de una charla. Ninguna estaba en un plan. Abajo las dejo todas, por si alguno de ustedes va a recorrer el mismo camino y quiere saber cuántas paradas tiene.

\* \* \*

El martes pasado, a las once y veinte, abrí una charla para cambiar una cifra. Un 71 que ahora es un 74.

Abrí el fichero. Cambié el número. Guardé.

[Ana pasó por el living a las once y veinticuatro, con el vaso de agua.]

[—¿Cambiaste la cifra?]

[—Sí.]

[Miró la pantalla. Había una sola portada.]

Cerré la notebook. La portada tenía la misma tipografía que el resto del deck, el deck la misma que la charla anterior, la charla anterior la misma que esta web. No porque me haya vuelto disciplinado. Porque ya no decido: decidió el sistema, una vez, y lo escribí en un JSON.

Cuatro minutos. Doce años.

---

## Nota técnica, para los que quieren el cómo

Lo de arriba es la historia. Esto es el sistema, para quien quiera copiarlo o discutirlo. Se llama `cv-talks` y está hecho con Eleventy, Bun y un paquete de diseño propio.

### Una slide es un fichero

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

**`template`** es el componente de Figma, pero en texto. Hay más de cuarenta con sus variantes: portada, cifra grande, cita en cinco sabores, listas numeradas o con checklist o glosario, gráfico de barras, tabla comparativa, matriz, código, roadmap, nube de palabras, cierre con QR. Cada una tiene su layout en Nunjucks y su CSS acotado.

**`recipe`** es cómo se pinta. Ver abajo.

**`notes`** son las notas del orador, en el mismo fichero y el mismo commit que el contenido.

El orden de las slides vive en un `deck.config.json` por deck, no en el nombre del fichero. Ese fichero guarda también la estructura narrativa: secciones con nombre, descripción y rango de slides, anidables. "El mito de la productividad tóxica" usa ANSVA (Atención, Necesidad, Solución, Visión, Acción), la estructura de Fer Miralles. Al insertar o borrar una slide los límites se corren solos.

![[06-attachments/posts/2026-10-cv-talks/editor-sidebar-ansva.png|La estructura ANSVA del deck, como secciones en el editor]]

Eleventy convierte todo en HTML estático y Vercel lo sirve. En producción no hay servidor, salvo una función para el mando.

### Seis recetas

Los colores y las tipografías viven en `@chimichurricode/design-system`. El concepto central es la **receta**: una combinación cerrada de cinco roles de color.

| Rol | Para qué sirve |
|---|---|
| `surface` | El fondo dominante |
| `ink` | El texto principal |
| `em` | El itálico argumentativo, el color del `<em>` |
| `accent` | Enlaces, eyebrows, numerales de KPI |
| `warn` | Lo que contradice, lo que es anti-patrón |

Hay seis: `canvas-quiet` (carbón y marfil, la que no se nota), `canvas-signal` (misma paleta, mandan los datos), `paper` (marfil, editorial), `energy-loud` (limón y display enorme, una por deck), `cool-fresh` (divisores) y `critical` (plasma, para lo que duele).

Cada slide declara una receta. El build genera un bloque `[data-recipe="..."]` que rellena cinco variables CSS, y el CSS de las plantillas solo puede leer esas cinco. Si el carbón pasa a azul marino, cambio una entrada en un JSON y las trescientas y pico slides cambian a la vez.

![[06-attachments/posts/2026-10-cv-talks/recipes-six-swatches.png|Las seis recetas, una slide de ejemplo con cada una]]

Las recetas también cierran la tipografía: cada una tiene una lista blanca de familias permitidas, y las excepciones tienen nombre y viven en un fichero. Un linter avisa si una slide usa una fuente que su receta no permite.

<!-- TBD Nico: ¿nombramos las fuentes (CHANEY, Scilla, At Aero, Thunder, JetBrains Mono) y por qué cada una? -->

Cada campo tiene un `content` (lo que se ve) y un `meta` (el nombre del campo). Con `SLIDE_MODE=meta` el deck entero se renderiza con los nombres en lugar del contenido: sirve para revisar el diseño sin que el texto distraiga, y es la galería de plantillas del editor.

![[06-attachments/posts/2026-10-cv-talks/dual-mode-content-vs-meta.png|La misma slide en modo content y en modo meta]]

### El editor

Corre en local con Bun, sin bundler. No tiene formato propio: lee y escribe el mismo Markdown que puedo tocar con Vim, que versiona Git, que construye Eleventy y que puede escribir una IA. Los scripts de consola para crear deck y slide usan el mismo código.

![[06-attachments/posts/2026-10-cv-talks/editor-overview.png|El editor: lista de slides, formulario, preview y notas]]

Lo que más uso: la preview en vivo (150 milisegundos, el render real), el formulario por plantilla (cambiar de plantilla no pierde el contenido) y pegar un SVG desde el portapapeles directo a un campo.

![[06-attachments/posts/2026-10-cv-talks/editor-template-gallery.mp4|Añadir una slide desde la galería de plantillas]]

### Presentar

El player renderiza cada slide en 1920 por 1080 y la escala al viewport. Por debajo de 768 píxeles (el token `--md` del sistema, el mismo que usan las webs) cambia solo a una pila vertical con scroll-snap y tipografía web, para leer la charla en el teléfono.

![[06-attachments/posts/2026-10-cv-talks/mobile-viewer.mp4|El mismo deck, deslizando en el móvil]]

**El mando.** Tecla R en el player: código de seis caracteres con QR. El celular lo canjea y recibe la slide actual, las notas y dos botones. Por debajo: una función de Vercel y un Redis en Frankfurt, long polling con un tick de 200 milisegundos, sin WebSockets. Sala privada por pestaña. Código de un solo uso que caduca a los diez minutos, así que lo puede ver toda la sala en el proyector. Token por dispositivo. Sesión persistida en los dos lados.

![[06-attachments/posts/2026-10-cv-talks/remote-pairing.mp4|Emparejar el móvil con el player: código, QR, y las notas en la mano]]

**Offline.** Un Service Worker guarda el deck entero la primera vez que lo abrís con red y desde ahí sirve siempre desde caché. El HUD muestra `OFFLINE ✓`, o cuántos ficheros faltan, o que hay versión nueva. Lo prueba un test de extremo a extremo que apaga el servidor de verdad y comprueba que se puede avanzar, recargar y abrir el speaker sin red.

![[06-attachments/posts/2026-10-cv-talks/offline-badge.png|El HUD del player con la precarga completa]]

### La lista completa

**Formato y contenido**

- Una slide por fichero Markdown con frontmatter YAML; un deck por carpeta; Git como historial.
- Más de cuarenta plantillas con variantes, cada una con su layout y su CSS acotado.
- Plantillas de visualización con SVG animado (el gráfico de Goodhart, el pictograma de Jevons, la capa de superhéroe que se vuelve gris). Se incrustan inline en el build y heredan las fuentes del sistema.
- Plantillas de ícono, de nube de palabras y de media a sangre.
- Campos con doble modo `content` y `meta`; render del deck entero en modo meta.
- Listas en Markdown dentro del frontmatter: viñetas, numeradas, checklist, glosario, sub-ítems.
- Orden de slides desacoplado del nombre del fichero.
- Estructura narrativa por deck: secciones con nombre, descripción, rango y sub-secciones, que se desplazan solas.
- Notas del orador en el mismo fichero que la slide.
- Documentos de ensayo por deck (análisis ANSVA, guion por slide) que viven junto a las slides y no se publican.
- Rutas cortas de assets que el build expande.
- Formateador canónico de YAML con comprobación en CI.

**Sistema de diseño**

- Tokens en JSON compilados a variables CSS con Style Dictionary. Tres capas: primitivas, recetas, utilidades.
- Seis recetas cerradas de cinco roles; las plantillas solo leen `--recipe-*`.
- Lista blanca tipográfica por receta y excepciones con nombre.
- Linter de fuentes fuera de receta y de patrones de "plantilla generada": degradados, cristal esmerilado, grids de tarjetas con iconito.
- Fuentes sincronizadas en el build; se despliegan solas en Vercel.
- El mismo paquete para slides, blog y webs.

**Editor**

- Lista de slides con las secciones narrativas como cabeceras y sus descripciones en tooltip.
- Reordenar arrastrando; mover secciones enteras; renumeración automática.
- Formulario por plantilla y variante; cambiar de plantilla no pierde el contenido.
- Texto enriquecido con conmutador a Markdown crudo.
- Editor de ítems con sub-ítems.
- Preview en vivo del render real, 150 milisegundos de debounce.
- Autoguardado; badges de "sin guardar" y "modificada respecto a Git" por slide.
- Revertir una slide a HEAD con un botón.
- Galería visual de plantillas con zoom al pasar el ratón.
- Duplicar (con resolución de colisiones de nombre), borrar y mover, desde un menú contextual.
- Navegación con las flechas; la slide activa se centra sola.
- Deck y slide persistidos en la URL.
- Subida de imágenes con redimensionado solo cuando hace falta.
- Pegar SVG desde el portapapeles a un campo de imagen.
- Selector de assets con búsqueda; campos de solo imagen.
- Navegador de íconos del sistema de diseño.
- Panel de notas del orador debajo de la preview.
- Visor del Markdown crudo.
- Exportar el deck a PDF.
- Botones "Present" y "Present + phone".
- Scripts de consola que comparten el código del editor.

**Player y speaker**

- Lienzo de 1920×1080 escalado; presentación y pantalla completa con una tecla; `?present=1`.
- Teclas de clicker además de las normales.
- Navegación entre slides también desde una slide abierta suelta.
- Vista de orador con actual, siguiente, notas y HUD.
- Modo móvil automático por debajo de 768 píxeles; forzable con `?view=`.
- Animaciones de portada y transiciones "concept-shift".
- SEO por deck y redirecciones de URLs viejas.

**Mando a distancia**

- Sala privada por pestaña; código de seis caracteres, de un solo uso, con QR, que caduca a los diez minutos.
- Token por dispositivo; desvincular con una tecla; baja desde el teléfono.
- Long polling sobre función de Vercel y Redis en la misma región; sin WebSockets.
- Sesión persistida en ambos lados; re-emparejar si la sala caduca.
- El celular muestra la slide actual y las notas.
- Relay en memoria dentro del editor para desarrollar sin infraestructura.

**Offline**

- Service Worker que precarga el deck entero y sirve siempre desde caché.
- Badge en el HUD: listo, faltan N, hay versión nueva.
- Página "Sin conexión" con la receta `critical`.
- Caché versionada por build; los 404 se recuerdan.
- Solo en producción; en local `?offline=1` y `?offline=0`.

**Calidad**

- Casi 1.300 tests unitarios y de integración; 40 de extremo a extremo con Playwright sobre un deck temporal con su propio repo Git.
- Test de arquitectura: capas en una sola dirección, sin ciclos de imports.
- Test de módulos del navegador: nombres sin declarar, imports a exports inexistentes. No hay TypeScript ni bundler.
- Test que compara el parser YAML propio con `gray-matter` sobre todas las slides reales.
- Test offline con el servidor apagado de verdad.

### Lo que me enseñó

Hace una semana le hice una auditoría de arquitectura. Había crecido a golpe de "lo necesito para el jueves": un `app.js` de 2.700 líneas, un router que hacía de todo, dos sitios que escribían el mismo JSON con formato distinto. El refactor salió en commits chicos y dejó cuatro capas, un `app.js` de cien líneas en treinta módulos y el doble de tests.

La lección vino del formateador. Al pasar las 333 slides por el formato canónico y comparar con `gray-matter`, aparecieron cuatro bugs en mi parser que habrían perdido datos en silencio: strings que YAML lee como número, como `"2012."`; espacios finales en las notas; ítems de lista con varias claves truncados al primero. Nada se había roto todavía. Se iba a romper el día de la charla, que es cuando se rompen las cosas.

Si escribís un parser propio, escribí también el test que lo compara con el de referencia sobre datos reales. Antes del jueves.

<!-- TBD Nico: "Qué sigue" y CTA. ¿Repo abierto? ¿Link a la charla de FresOn? ¿Newsletter? -->
