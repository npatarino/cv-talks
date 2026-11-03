# cv-talks

Sistema de slides **local-first** de Chimichurri Code. Cada charla (deck) es una carpeta de ficheros Markdown con frontmatter YAML versionados con Git; Eleventy los convierte en un sitio estático con player, vista de speaker y galería de plantillas, y un editor local (Bun) permite crear y editar slides con preview en vivo. Las slides se montan sobre 43 templates que consumen las **recipes** del design system (`@chimichurricode/design-system`), así que el estilo es coherente sin escribir CSS por charla. No hay base de datos: el sistema de ficheros es la fuente de verdad.

![Editor de slides: lista de slides por secciones, preview en vivo, propiedades y notas del orador](docs/images/editor.png)

## Funcionalidades

- **Editor local** (`:3001`): lista de slides agrupada por secciones con drag & drop, formulario por template, preview en vivo, notas del orador, estado de Git por slide (revertir a lo commiteado) y exportación a PDF.
- **Player** a 1920×1080 escalado al viewport, con navegación por teclado, fullscreen y **modo móvil** automático (< 768px).
- **Vista de speaker** con slide actual, siguientes, notas y cronómetro.
- **Mando desde el móvil** vía `/api/remote` (función Vercel + Redis, long polling).
- **Precarga offline** (Service Worker): la charla sigue funcionando si se cae la red.
- **Galería de plantillas** (`/talks/template-gallery/`) y **modo meta** que muestra los nombres de los campos en lugar del contenido.
- CLI para crear decks y slides con el mismo código que el editor.

| Player | Speaker | Galería de plantillas |
|---|---|---|
| ![Player](docs/images/deck.png) | ![Speaker](docs/images/speaker.png) | ![Galería](docs/images/gallery.png) |

## Quick start

**Requisitos:** [Bun](https://bun.sh) (scripts, editor e instalación; el proyecto usa `bun.lock`) y Node.js (algunos scripts se ejecutan con `node`). `lsof` para `servers:stop`.

```bash
git clone https://github.com/npatarino/cv-talks.git
cd cv-talks
bun install
bun run servers:start    # sincroniza fuentes y arranca Eleventy + editor (Ctrl-C para parar ambos)
```

- **Slides** → http://localhost:8080 (índice de charlas; cada deck en `/talks/decks/<slug>/deck/`)
- **Editor** → http://localhost:3001

Si un puerto se queda ocupado: `bun run servers:stop`.

## Tareas comunes

| Comando | Qué hace |
|---|---|
| `bun run servers:start` / `servers:stop` | Arranca / mata Eleventy (`:8080`) y el editor (`:3001`). |
| `bun run editor:start` | Solo el editor (necesita Eleventy en `:8080` para el preview). |
| `bun run slides:serve` | Solo Eleventy con live-reload. |
| `bun run slides:serve-meta` | Igual, en modo meta (nombres de campos). |
| `bun run build` | Build de producción → `_site/` (fuentes + Eleventy + SEO: iconos, manifest, `robots.txt`, `sitemap.xml`). |
| `bun run test` | Tests unitarios y de integración (Vitest). |
| `bun run test:watch` / `test:coverage` | Vitest en watch / con cobertura. |
| `bun run test:e2e` | E2E con Playwright (levanta su propio editor en `:3101` sobre un deck de fixture y el sitio construido en `:3201`; no toca tus decks). Requiere los navegadores de Playwright (`bunx playwright install chromium`). |
| `bun run decks:format` / `decks:format-check` | Reescribe / comprueba las slides en el YAML canónico. |
| `bun run fonts:sync` | Copia las fuentes del design system a `theme/styles/fonts/` (lo hacen solos `servers:start` y `build`). |

Para un build en modo meta: `SLIDE_MODE=meta bun run build`.

### Crear un deck y slides nuevos

Desde el editor, o por línea de comandos (usan el mismo código que el editor):

```bash
node scripts/new-deck.mjs <slug> "<título>" ["<autor>"] [--subtitle "..."] [--date YYYY-MM]
node scripts/new-slide.mjs <deck> <template> ["<label>"] [--variant V] [--recipe R] [--position N] [--slug S]
# ej: node scripts/new-deck.mjs mi-charla "Mi charla" "Nicolás Patarino"
# ej: node scripts/new-slide.mjs mi-charla big-stat "Big stat · burnout" --position 5
```

Tras crear un deck hay que reiniciar Eleventy para que registre su colección.

## Estructura del proyecto

```
cv-talks/
├── decks/<slug>/          Un deck: <slug>.11tydata.json, deck.config.json (orden y secciones), slides/*.md, *.njk
├── templates/             Una slide de ejemplo por template/variante (alimenta la galería)
├── theme/
│   ├── _includes/         Layouts Nunjucks (uno por template), player, speaker, TOC, partials
│   ├── assets/            JS del navegador: present.js, player, speaker, mando, offline
│   ├── lib/               Lógica pura de Eleventy
│   └── styles/            CSS
├── editor/
│   ├── server.mjs         Bun.serve: UI estática + API REST
│   ├── api/               Backend por capas (http → domain → store/services)
│   └── ui/                Frontend en módulos ES sin bundler
├── api/remote.mjs         Relay del mando (función Vercel)
├── _data/                 Datos globales de Eleventy (templates.json, site.js, build.js…)
├── scripts/               CLI: new-deck, new-slide, format-decks, build-seo, sync-fonts, start/stop-servers
├── tests/                 unit/, integration/, e2e/, helpers/
├── docs/                  Arquitectura y revisión de arquitectura
└── eleventy.config.mjs    Config de Eleventy (lee los decks con el mismo store que el editor)
```

Formato de deck y slide, capas del editor, API y cómo añadir templates o endpoints: ver **[docs/architecture.md](docs/architecture.md)**. El porqué de esa estructura está en [docs/architecture-review.md](docs/architecture-review.md).

## Configuración

Variables de entorno (todas opcionales en local):

| Variable | Uso |
|---|---|
| `EDITOR_PORT` | Puerto del editor (por defecto `3001`). |
| `ELEVENTY_URL` | Origen del preview que usa el editor (por defecto `http://localhost:8080`). |
| `TALKS_DECKS_DIR` | Carpeta de decks alternativa (la usan los e2e). |
| `SLIDE_MODE` | `meta` para renderizar nombres de campos en lugar del contenido. |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Redis (Upstash) del relay del mando. Sin ellas se usa un Redis en memoria. Bun carga `.env.local` automáticamente, así que si existe, **el editor local usa el Redis real**. |
| `VERCEL_GIT_COMMIT_SHA`, `VERCEL_DEPLOYMENT_ID` | Las pone Vercel; identifican el build (nombre de la caché offline). |

## Despliegue

Vercel, según [`vercel.json`](vercel.json): `bun install`, `bun run slides:build`, se publica `_site/` y la función `api/remote.mjs` (región `fra1`). En producción solo existe el sitio estático y esa función; el editor es solo local.

## Presentar

- **P** · toggle modo presentación (escala 16:9 al viewport).
- **F** · fullscreen + presentación.
- **←** / **→** / **Espacio** · navegar entre slides.
- **Esc** · salir.
- `?present=1` en la URL arranca directo.

### Antes de salir al escenario (offline)

El player guarda la charla entera en el navegador para que un corte de red no
se note. **Abre el player en producción con conexión y espera a ver
`OFFLINE ✓`** abajo a la derecha (unos segundos, solo la primera vez en cada
versión). A partir de ahí puedes perder la red: las slides, el speaker y
recargar el player siguen funcionando. El mando del móvil sí necesita red;
sin ella, usa teclado o clicker y se resincroniza al volver.

- `offline ✗ N`: faltaron N ficheros; se reintenta solo al volver la red.
- `offline ↻ recarga`: hay una versión nueva; recarga (F5) con red.
- Probarlo en local: añade `?offline=1`; `?offline=0` lo desinstala.

### Mando a distancia desde el móvil

El player (`/talks/decks/<slug>/deck/`) puede controlarse desde el móvil a
través de `/api/remote` (función Vercel + Redis, long polling; sin
WebSockets). Cada pestaña de player tiene su propia **sala** privada, así
que varias presentaciones abiertas a la vez nunca se pisan.

1. En el player pulsa **R** (o el botón 📱 Mando). Se crea la sala y aparece
   un **código de 6 caracteres** con su QR. El código es de **un solo uso** y
   caduca a los 10 min: aunque lo vea el público, nadie puede colarse después.
2. En el móvil abre `/talks/decks/<slug>/speaker/?phone=1` y teclea el
   código, o escanea el QR (que ya lo lleva). El panel se cierra solo al
   emparejar y el HUD muestra `📱 N` con los móviles conectados.
3. El móvil sigue la slide actual y sus notas, y manda ← / →. La sesión se
   guarda en el móvil (`localStorage`) y en la pestaña del player
   (`sessionStorage`): un reload en cualquiera de los dos no rompe nada.
4. **D** en el player desvincula todos los móviles. ✕ en el móvil se da de
   baja. La sala muere a las 12 h sin actividad.

`?remote=1` crea la sala al cargar sin esperar a R (es lo que usa el botón
"Present + phone" del editor). En local el relay vive en el editor:
`deck/?api=http://localhost:3001/api/remote` y lo mismo en el móvil.

## Render modes (presentation vs. mobile viewer)

Cada deck y cada slide individual exponen dos modos de render que se
seleccionan automáticamente y pueden forzarse con un query param.

- **`view=presentation` (default ≥ 768px)** · cada slide ocupa un canvas
  fijo de 1920×1080 px y `present.js` aplica un `transform: scale(...)`
  para encajar en el viewport. El deck-player es un único iframe con
  navegación por teclado.
- **`view=mobile` (default < 768px)** · cada slide se re-renderiza en
  `100vw × 100svh` con tipografía web-scale (definida en
  `theme/styles/viewer-mobile.css`); el deck-player se convierte en una
  pila vertical de iframes con `scroll-snap-type: y mandatory`, para
  deslizar un slide por pantalla. Las recipes y `--recipe-*` funcionan
  igual en ambos modos.

```
/talks/decks/<slug>/deck/?view=presentation
/talks/decks/<slug>/deck/?view=mobile
/talks/decks/<slug>/<slide>/?view=mobile
```

El umbral de 768px coincide con el token `--md` del design system. Los
slides con layouts densos o `position: absolute` pueden necesitar ajustes
específicos en modo móvil (follow-up conocido).

## Templates → recipes

Cada `templates/*.md` declara una recipe en frontmatter; el layout pasa
`recipe` al `<section>` como `data-recipe="..."` y el CSS solo consume
`--recipe-{surface,ink,em,accent,warn}`. El modelo completo (recipes, el
patrón `critical-fg`, las excepciones nombradas) está en
[cv-design-system · docs/recipes.md](https://github.com/npatarino/cv-design-system/blob/main/docs/recipes.md).

```yaml
---
template: cover
recipe: canvas-quiet
order: 1
label: "Cover · default"
fields:
  ...
---
```

| # | Template | Recipe | Notas |
|---|---|---|---|
| 01 | cover-default | canvas-quiet | |
| 02 | speaker-bio-default | canvas-quiet | |
| 03 | agenda-default | paper | |
| 04 | big-concept-default | energy-loud | |
| 05 | big-concept-divider | cool-fresh | |
| 06 | big-concept-transition | canvas-quiet | italic editorial |
| 07 | big-concept-prompt | paper | |
| 08 | big-concept-disclaimer | critical (bg) | |
| 09 | quote-default | paper | |
| 10 | quote-xl | paper | |
| 11 | quote-testimonial | paper | |
| 12 | quote-punch | canvas-quiet | highlight em |
| 13 | quote-critical | canvas-quiet + `critical-fg-quote` | em plasma |
| 14 | social-embed-default | canvas-quiet | post = artifact |
| 15 | big-stat-default | canvas-signal | |
| 16 | big-stat-multiplier | canvas-signal | |
| 17 | big-stat-critical | canvas-signal + `critical-fg-stat` | numeral plasma |
| 18 | kpi-grid-default | canvas-signal | `allowMultipleAccents`+`Stats` |
| 19 | chart-bar | canvas-signal | `allowMultipleAccents`+`Stats` |
| 20 | chart-line | canvas-signal | `allowMultipleAccents`+`Stats` |
| 21 | comparison-table-default | canvas-signal | `allowMultipleStats` |
| 22 | three-ideas-default | canvas-signal | `allowMultipleAccents`+`Stats` |
| 23 | big-list-numeric | canvas-quiet | |
| 24 | big-list-bullets | canvas-quiet | |
| 25 | big-list-checklist | canvas-quiet | boxes ✓/✗ a escala big |
| 26 | big-list-glossary | canvas-quiet | grid 2-col término + definición |
| 27 | big-list-critical | canvas-quiet + `critical-fg-marker` | bullets plasma |
| 28 | concept-shift-default | canvas-quiet | |
| 29 | matrix-default | canvas-quiet | `allowMultipleAccents` |
| 30 | code-block-default | canvas-quiet | |
| 31 | code-block-anti | canvas-quiet | warn-marked |
| 32 | stack-default | canvas-quiet | `allowMultipleAccents` |
| 33 | demo-default | canvas-quiet | browser = artifact |
| 34 | roadmap-default | canvas-quiet | |
| 35 | roadmap-timeline | canvas-quiet | |
| 36 | resource-cards-default | paper | |
| 37 | resource-cards-team | paper | |
| 38 | faq-default | paper | |
| 39 | closing-qr-default | paper | |
| 40 | closing-socials-default | canvas-quiet | `allowDeckOverride` |
| 41 | icon-default | paper | |
| 42 | word-cloud-default | canvas-dark | |
| 43 | media-still | canvas-quiet | |

Templates compuestos (con variantes): `big-concept` (default/divider/transition/prompt/disclaimer), `quote` (default/xl/testimonial/punch/critical), `big-stat` (default/multiplier/critical), `big-list` (numeric/bullets/checklist/glossary/critical), `chart` (bar/line), `code-block` (default/anti), `roadmap` (default/timeline), `resource-cards` (default/team).

Las excepciones nombradas (`allowMultipleAccents`, `allowMultipleStats`, `allowDeckOverride`) viven en [`tokens/type.recipe.json`](https://github.com/npatarino/cv-design-system/blob/main/tokens/type.recipe.json) del design system, bajo `_namedExceptions`.

## Dual-mode

Cada campo tiene un valor visible y una etiqueta meta:

```yaml
eyebrow:
  content: "◆ Dato duro"     # render normal
  meta: "Eyebrow_Label"       # render debug/review
  source: "opcional: trazabilidad"
```

Global: `SLIDE_MODE=meta` (o `bun run slides:serve-meta`). Override por slide: `mode: meta` en frontmatter.
