# Arquitectura

`cv-talks` es un sistema de slides local-first: las slides son ficheros Markdown con frontmatter YAML, versionados con Git. No hay base de datos; el sistema de ficheros es la fuente de verdad.

Este documento describe la estructura **actual** del código. El análisis que llevó hasta aquí (problemas encontrados, decisiones y plan) está en [architecture-review.md](architecture-review.md).

---

## 1. Procesos

| Proceso | Puerto | Qué hace |
|---|---|---|
| **Eleventy** (`eleventy --serve`) | `:8080` | Renderiza cada slide a HTML (preview y build). |
| **Editor** (`bun editor/server.mjs`) | `:3001` | API REST + UI del editor. También sirve `/api/remote` en memoria para probar el mando. |
| **Relay del mando** (`api/remote.mjs`) | Vercel | Long polling sobre Redis (Upstash). Mismo handler que el editor usa en memoria. |

En producción solo existe el build estático de Eleventy (`_site/`) y la función `api/remote.mjs`.

```
slides (.md) ──▶ Eleventy ──▶ _site/            player, speaker, TOC, slides
     ▲                                          │
     │ lee/escribe                              ▼ ?remote=1  /  ?phone=1
  Editor (API + UI)                          api/remote.mjs  ◀── Redis
```

---

## 2. Mapa del repositorio

```
cv-talks/
├── eleventy.config.mjs        Config de Eleventy (ESM). Lee decks vía el store del editor.
├── api/remote.mjs             Relay del mando (Vercel + Redis, mini-Redis en memoria).
├── editor/
│   ├── config.mjs             Rutas absolutas y origen del preview (único sitio).
│   ├── server.mjs             Bun.serve: ficheros estáticos + route().
│   ├── api/                   Backend, por capas (ver §3).
│   └── ui/                    Frontend, módulos ES sin build (ver §5).
├── theme/
│   ├── _includes/             Layouts Nunjucks (uno por template), player, speaker, TOC.
│   ├── assets/                Código del navegador: present.js, deck.js, deck-speaker.js
│   │                          y los módulos compartidos del mando (ver §6).
│   ├── lib/                   Lógica pura de Eleventy: big-list.mjs, deck-assets.mjs.
│   └── styles/                CSS.
├── templates/                 Slides de ejemplo (una por template/variante) y galería.
├── decks/<slug>/              Un deck: <slug>.11tydata.json, deck.config.json, slides/, assets, *.njk.
├── _data/                     Datos globales de Eleventy (templates.json, site.js, typeRecipes.js).
├── scripts/                   CLI: new-deck, new-slide, format-decks, build-seo, sync-fonts…
└── tests/                     unit/, integration/, e2e/, helpers/.
```

---

## 3. Backend del editor (`editor/api`)

Cuatro capas con las dependencias en una sola dirección. Está comprobado por `tests/unit/architecture.test.mjs`.

```
        http ──────────────┐
         │                 ▼
         │              services ──┐
         ▼                         ▼
       domain ──────────────────▶ store
         │                         │
         └────────▶ lib ◀──────────┘          (config lo puede usar cualquiera)
```

| Capa | Responsabilidad | Puede importar |
|---|---|---|
| `lib/` | Código puro sin I/O: `frontmatter.mjs` (parser/serializador YAML propio). | nada del editor |
| `store/` | Único acceso a disco y a git. | `lib`, `config` |
| `domain/` | Reglas de negocio: slides, orden, estructura narrativa, scaffolds, templates, decks, errores tipados. | `lib`, `store`, `config` |
| `services/` | Trabajo pesado con datos ya recibidos: PDF y resize de imágenes (Playwright), iconos del design system. | `lib`, `store`, `domain`, `config` |
| `http/` | Transporte: router, validación de entrada, formato de respuestas. | todo lo anterior |

### Módulos

| Módulo | Contenido |
|---|---|
| `store/deck-store.mjs` | Dónde vive un deck (`deckDir`, `getSlideDir`), lectura/escritura de `deck.config.json`, `readSlides`, `listDecks`, `listAssets`. **Una sola implementación**, compartida con Eleventy. |
| `store/git.mjs` | `modifiedFiles()` y `revertFile()`. El revert se ejecuta desde el directorio del propio fichero, así que funciona contra cualquier repo (y se prueba con uno temporal). |
| `domain/slides.mjs` | CRUD de slides (`listSlides`, `getSlide`, `createSlide`, `updateSlide`, `removeSlide`, `reorderSlides`, `moveSlideTo`). |
| `domain/slide-order.mjs` | Orden de las slides en `deck.config.json`: `renumberSlides`, `deleteSlide`, `moveSlide`. |
| `domain/structure.mjs` | Secciones narrativas (ANSVA…). La aritmética de límites son funciones puras (`normalizeSections`, `shiftOnInsert`, `shiftOnDelete`, `setBoundary`). |
| `domain/scaffold.mjs` | Esqueleto vacío (`fields`/`items`) de un template. |
| `domain/templates.mjs` | Metadatos de `_data/templates.json` y listado de las slides de ejemplo. |
| `domain/decks.mjs` | `createDeck`: estructura completa de un deck nuevo. |
| `domain/errors.mjs` | `ValidationError` (400), `NotFoundError` (404), `ConflictError` (409), `statusOf`. |
| `services/pdf.mjs` | `exportDeckPdf(slides)`: recibe la lista de slides, no lee disco. |
| `services/assets.mjs` | `uploadAsset`, `imageWidthFromHeader`; solo lanza Chromium si la imagen supera 512 px. |
| `services/design-system.mjs` | Iconos del paquete `@chimichurricode/design-system`. |
| `http/router.mjs` | Tabla de rutas `on(método, patrón, handler)` y `route(req, serveFile, uiDir, decksRoot)`. |
| `http/validate.mjs` | Único sitio de validación: slug, nombre de slide, cuerpos JSON. |
| `http/respond.mjs` | `json`, `err`, `fail`, `text`, `preflight`. |
| `http/vercel-adapter.mjs` | Ejecuta un handler estilo Vercel sobre un `Request` de Bun (para `/api/remote`). |

### Cómo funciona una petición

1. `route()` busca la primera entrada de la tabla cuyo método y patrón coinciden. Los parámetros `:slug` y `:filename` se validan **por nombre** antes de llegar al handler.
2. El handler recibe `{ req, url, params, decksRoot }`, llama al dominio y **devuelve datos** (o una `Response` si necesita controlar status o cabeceras).
3. Un único `try/catch` convierte el resultado en JSON o el error en respuesta: los `AppError` llevan su status; cualquier otro es un 500 que además se registra en consola.

`decksRoot` es opcional en todo lo que toca decks: los tests lo redirigen a un directorio temporal en lugar de mockear el sistema de ficheros.

### API

| Método | Ruta | Devuelve |
|---|---|---|
| GET | `/api/config` | `{ previewOrigin }` |
| GET | `/api/decks` | decks con metadatos y config |
| GET | `/api/templates` · `/api/template-slides` · `/api/template-scaffold?template=&variant=` | catálogo de templates |
| GET | `/api/design-system/icons` | iconos del design system |
| GET | `/api/git-status` | `{ modified: [...] }` |
| GET/POST | `/api/decks/:slug/slides` | listar / crear |
| GET/PUT/DELETE | `/api/decks/:slug/slides/:filename` | leer / guardar / borrar |
| GET | `/api/decks/:slug/slides/:filename/raw` | Markdown sin procesar |
| POST | `/api/decks/:slug/slides/:filename/move` · `/git-revert` | mover / revertir a HEAD |
| POST | `/api/decks/:slug/reorder` | nuevo orden completo |
| GET/POST | `/api/decks/:slug/structure` · `/structure/boundary` | secciones narrativas |
| GET/POST | `/api/decks/:slug/assets` | listar / subir imagen |
| POST | `/api/decks/:slug/export-pdf` | PDF |
| `*` | `/api/remote` | relay del mando en memoria |

Errores: `400` entrada inválida (slug, nombre de fichero, cuerpo, tipo de imagen), `404` slide/deck/estructura inexistente, `409` el asset ya existe, `500` el resto.

### Configuración

| Variable | Efecto |
|---|---|
| `ELEVENTY_URL` | Origen del preview (por defecto `http://localhost:8080`). La UI lo obtiene de `/api/config`. |
| `EDITOR_PORT` | Puerto del editor (por defecto `3001`). |
| `TALKS_DECKS_DIR` | Carpeta de decks alternativa (la usan los e2e). |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Redis del relay. Bun carga `.env.local` automáticamente, así que **el editor local usa el Redis real** salvo que las dejes vacías. |

---

## 4. Formato de deck y de slide

```
decks/<slug>/
├── <slug>.11tydata.json   tags, permalink, deck{title,subtitle,author,date}, eleventyComputed
├── deck.config.json       { slides: [ordered filenames], structure?: {...} }
├── index.njk · deck.njk · speaker.njk
└── slides/<name>.md       una slide; assets en slides/assets/
```

- **El orden vive en `deck.config.json`** (`slides`), no en el nombre del fichero ni en el frontmatter. `readSlides` calcula `order` (1-based) a partir de ahí; las slides que no aparecen en la lista van al final.
- `structure` (opcional) define secciones contiguas sobre las posiciones: `{ id, label, description, start, end, children? }`. Siempre teselan el deck de 1 a N; al crear o borrar slides los límites se desplazan.
- Una slide:

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
notes: Notas del orador (no se renderizan)
---
```

`content` es lo visible; `meta` es la etiqueta que se muestra con `SLIDE_MODE=meta`. Las imágenes del deck se escriben como `assets/x.svg`; el build las expande (§7).

---

## 5. UI del editor (`editor/ui`)

Módulos ES servidos tal cual (sin bundler). `app.js` es solo arranque y cableado (~100 líneas).

```
app.js ──▶ controller.js ──▶ save.js, sidebar.js, form/form.js, preview.js,
   │            │             notes.js, gallery.js, context-menu.js, api-client.js
   │            └─ suscribe eventos de las vistas
   └──▶ wireEvents (controles de index.html)
```

| Módulo | Responsabilidad |
|---|---|
| `state.js` | **El** estado compartido, todos los campos declarados. |
| `dom.js` | Referencias a elementos de `index.html`. |
| `events.js` | Bus mínimo `on`/`emit`. Las vistas emiten, el controlador escucha (evita ciclos). |
| `api-client.js` | Único sitio con URLs. Funciones con nombre (`getSlide`, `saveSlide`, `moveSlide`…). |
| `controller.js` | Orquesta decks, selección y operaciones (guardar, añadir, duplicar, borrar, mover, revertir). |
| `save.js` | Estado de guardado, cambios sin guardar, preview en vivo (debounce) y estado de git por slide. |
| `sidebar.js` | Lista de slides, cabeceras de sección, tooltips, drag & drop. |
| `form/` | `form.js` (render, lectura y reforma al cambiar de template), `controls.js`, `rich-text.js`, `items-editor.js`, `glyph-input.js`. |
| `assets/` | `picker.js` (**un solo** selector de assets), `tiles.js`, `upload.js`, `icon-browser.js`. |
| `preview.js`, `notes.js`, `gallery.js`, `context-menu.js`, `markdown-viewer.js`, `deck-actions.js`, `toast.js` | Una vista o acción cada uno. |
| `lib/` | Lógica pura (sin DOM, con tests): `html-transform`, `glyph`, `template-rules`, `strings`, `editor-helpers`, `clipboard-svg`. |

Reglas (comprobadas por `architecture.test.mjs`): solo `app.js` importa el controlador; `lib/` no importa nada de la UI; `state`, `dom`, `events`, `toast` y `api-client` no dependen de ninguna vista; no hay ciclos de imports.

Eventos: `form:changed`, `slide:select`, `slide:drop`, `section:move`, `slide:menu`.

---

## 6. Player, speaker y mando (`theme/assets`)

`deck.js` (player, iframe a pantalla completa) y `deck-speaker.js` (vista del orador y mando en móvil) son módulos ES (`type="module"`); `present.js` es el runtime de una slide dentro del iframe y sigue siendo un script clásico (debe ejecutarse síncrono antes del primer pintado).

| Módulo | Contenido |
|---|---|
| `remote-client.mjs` | Sin DOM. `createRelay` (POST + long poll), `createSessionStore` (sesión persistida en un `Storage`), `createPoller` (bucle con reconexión; al perder la sala reinicia la versión y continúa con la sesión nueva). |
| `remote-host.mjs` | Lado del player: sala por pestaña, panel con QR y código (tecla **R**), desvincular (**D**), estado en el HUD. |
| `remote-phone.mjs` | Lado del móvil (`speaker/?phone=1`): canjear código (tecleado o `?code=`), botones anterior/siguiente, volver a emparejar si la sala caduca o te desvinculan. |
| `slide-url.mjs` | `embeddedSrc`, `revealFor`, `hudText`, `indexByOrder`. |

Flujo: el player (`?remote=1` o tecla R) crea una sala y muestra un código de un solo uso; el móvil lo canjea y recibe su propio token; el móvil envía `next`/`prev`/`goto`, el player los aplica y publica en qué slide está. Protocolo y modelo de seguridad: cabecera de `api/remote.mjs`.

`slide.njk` calcula el manifiesto `window.__SLIDES__` y `data-slide-order` a partir de la colección del propio deck, así que las flechas también navegan entre slides abiertas fuera del player.

---

## 7. Eleventy y build

- `eleventy.config.mjs` (ESM) importa el store del editor para listar decks, leer `<slug>.11tydata.json` y ordenar cada colección `deck:<slug>` según `deck.config.json`: **una sola implementación** de «cómo se lee un deck».
- `theme/lib/deck-assets.mjs` — transformación `deckAssets`: expande `assets/x` a `/talks/decks/<slug>/assets/x` e incrusta como `<svg>` los SVG con `data-inline` o animados (así heredan fuentes y animaciones CSS).
- `theme/lib/big-list.mjs` — `parseBigList`: Markdown → items (viñetas, numeradas, checklist, glosario, sub-items).
- Se crea una colección por deck **al arrancar**: tras añadir un deck hay que reiniciar `eleventy --serve`. Editar un include o layout bajo `--serve` puede vaciar `window.__SLIDES__` hasta reiniciar.

```bash
bun run build     # sync-fonts → eleventy → scripts/build-seo.mjs  (salida: _site/)
```

---

## 8. Scripts

| Script | Uso |
|---|---|
| `scripts/new-deck.mjs` | `node scripts/new-deck.mjs <slug> "<título>" ["<autor>"]` — usa `createDeck`. |
| `scripts/new-slide.mjs` | `node scripts/new-slide.mjs <deck> <template> ["<label>"] [--position N]` — usa `createSlide`, el mismo código que el editor. |
| `scripts/format-decks.mjs` | `bun run decks:format[-check]` — reescribe las slides al YAML canónico (solo slides reales). |
| `scripts/build-seo.mjs`, `sync-fonts.mjs` | Pasos del build. |

---

## 9. Tests

```bash
npx vitest run        # unit + integration  (bun run test)
npx playwright test   # e2e                 (bun run test:e2e)
```

| Suite | Qué cubre |
|---|---|
| `tests/unit/` | Todo el backend (store, git, dominio, errores, servicios), la lógica pura de la UI, el cliente API (con `fetch` simulado), el cliente del mando y Eleventy (`big-list`, `deck-assets`). |
| `tests/integration/` | El router contra un directorio temporal; round-trip de todas las slides y templates por el parser YAML. |
| `tests/e2e/` | El editor real en Chromium sobre un **deck de fixture temporal** (`start-server.mjs`: repo git propio, estructura narrativa, puerto `:3101`). Nunca toca tus decks ni tu `:3001`. |

Puertas de calidad automáticas (no hay build ni tipos que las hagan):

- `browser-modules.test.mjs` — cada módulo del navegador: parsea como módulo, no declara dos veces un nombre, no usa nombres sin declarar, no importa nada sin usar, y cada import relativo apunta a un fichero y a un export que existen.
- `architecture.test.mjs` — la regla de dependencias entre capas y la ausencia de ciclos en la UI.

`templates-roundtrip` comprueba además que nuestro parser YAML (`lib/frontmatter.mjs`) coincide con gray-matter, el que usa Eleventy, en todas las slides y templates, antes y después de serializar.

---

## 10. Cómo añadir…

**Un endpoint.** Función en `domain/` (lanza `NotFoundError`/`ValidationError`…), validación de la forma del cuerpo con `http/validate.mjs`, una línea `on(...)` en `http/router.mjs`, función con nombre en `ui/api-client.js` y test en `router.test.mjs`.

**Un template.** Layout en `theme/_includes/layouts/`, ejemplo en `templates/NN-<template>-<variante>.md`, entrada en `_data/templates.json`. Si necesita campos opcionales, items vacíos o es un campo de código en el editor: `editor/ui/lib/template-rules.mjs`.

**Una vista o control del editor.** Módulo nuevo en `editor/ui/` que reciba lo que necesite y emita un evento en lugar de importar el controlador; se cablea en `app.js` o en `initController()`.

---

## 11. Deuda conocida

- Playwright lanza un Chromium nuevo por cada exportación a PDF y por cada subida que necesita resize (~1–2 s). Aceptable para una herramienta local.
- El resize de imágenes siempre produce PNG aunque el origen sea JPEG o WebP.
- `present.js` y `viz.js` siguen siendo scripts clásicos; compartir código con ellos requeriría convertirlos a módulos y comprobar el orden de pintado.
