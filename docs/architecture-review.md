# Auditoría de arquitectura y calidad · cv-talks

Fecha: 2026-10-27 · Base: `main` @ `57b3588`

Objetivo: código fácil de mantener, escalar y estabilizar, con separación clara
entre capas (transporte HTTP / dominio / acceso a disco / UI), sin caer en una
arquitectura hexagonal estricta. Este documento recoge el mapa actual, los
problemas concretos encontrados y un plan de refactor por pasos pequeños.

Línea base de tests: `npx vitest run` → 623 pasan, 2 skipped, **1 falla**
(`tests/integration/templates-roundtrip.test.mjs`: la slide
`decks/el-mito-de-la-productividad-toxica-freson/slides/media-hora.md` no tiene
`template`). Es un problema de datos, no de código; se deja como está.

---

## Resultado de la ejecución

Plan ejecutado completo, en commits pequeños sobre `main`. La estructura resultante está descrita en [architecture.md](architecture.md); este informe queda como registro del análisis.

| Fase | Resultado |
|---|---|
| 0 · Cimientos | `editor/config.mjs` (rutas y origen del preview), errores tipados con status, `store/deck-store.mjs` único. |
| 1 · Router | `http/{router,respond,validate,vercel-adapter}` con tabla de rutas y un solo `catch`; `store/git.mjs`; scaffold y templates en `domain/`; `exportDeckPdf(slides)`; `createSlide` simplificado. |
| 2 · Eleventy y scripts | `eleventy.config.mjs` (ESM) sobre el store; `theme/lib/{big-list,deck-assets}`; `new-deck`/`new-slide` reescritos sobre el dominio; `format-decks` recorre slides reales. |
| 3 · Mando | `remote-client`, `remote-host`, `remote-phone`, `slide-url` como módulos ES sin build. |
| 4 · UI | `app.js` de 2.701 a 103 líneas en 30 módulos (6 de ellos puros, en `lib/`); un único selector de assets; estado, DOM, bus de eventos y cliente API propios. |
| 5 · Cierre | Capas finales (`lib/store/domain/services/http`), shims eliminados, `architecture.md` reescrito. |

Tests: de 626 a 1.292 unitarios/integración, y de 13 a 40 e2e. Todo en verde: el fallo de datos de `templates-roundtrip` era una slide sin el `---` de cierre y se corrigió.

### Formateo canónico y bugs del parser YAML

Al pasar las 333 slides al YAML canónico (`bun run decks:format`) se comparó el resultado con gray-matter (el parser que usa Eleventy) y salieron cuatro bugs en `lib/frontmatter.mjs` que habrían perdido datos al reescribir:

- Strings que YAML lee como número o booleano (`"2012."`, `"+15"`, `yes`/`no`) salían sin comillas.
- Los espacios finales dentro de `notes: |` se perdían.
- Los items de lista con varias claves (`- label: x` + `cells:`) o con bloque (`- glyph: |`) se truncaban al primer par: desaparecían la animación del cubo y las filas de la tabla de skills.
- Las colecciones inline anidadas (`[..]` dentro de `{..}`) se leían como texto.

Se corrigieron con tests, la comparación con gray-matter quedó como test permanente, y después se reformatearon 201 slides con contenido idéntico y build byte a byte igual.

### Decisiones de la sección 5

1. **Scripts**: `new-deck` reescrito y `new-slide` convertido en envoltorio de `createSlide` (se mantienen los dos; comparten código con el editor).
2. **Navegación standalone**: arreglada en el layout, sin tocar cada deck.
3. **HTTP**: PUT sobre slide inexistente pasa de 400 a 404; asset duplicado de 400 a 409.
4. **Config de Eleventy**: renombrada a `eleventy.config.mjs`.
5. **UI**: troceada por completo.

### Cambios de comportamiento y bugs encontrados

- **Mando**: tras recrear una sala caducada el player dejaba de escuchar (el bucle no se reiniciaba). Corregido en el poller compartido.
- **Slide abierta sola**: el manifiesto leía una colección `slides` que no existe y `data-slide-order` salía vacío (el orden ya no está en el frontmatter), así que las flechas no navegaban. Corregido.
- **`git-revert`**: el nombre de fichero llegaba sin validar a `git checkout`. Ahora se valida en todas las rutas de slide (400).
- **`format-decks`**: solo revisaba documentos auxiliares (que habría corrompido en modo escritura) y no las slides.
- **Icon browser**: ruta de iconos relativa al cwd; con otro cwd devolvía vacío sin error.
- **`deck.config.json`**: dos escritores con formato distinto (uno sin salto de línea final); un JSON corrupto se leía como vacío y se sobrescribía. Ahora un único escritor y un JSON corrupto lanza.
- **`index.html`**: `app.js?v=2` impedía el versionado por arranque del servidor.
- **Sidebar**: ya no se repinta mientras hay un arrastre en curso.
- **Relay local**: Bun carga `.env.local`, así que el editor local habla con el Redis real. No se ha cambiado; queda documentado.

### Pendiente (no incluido en el alcance)

Ver «Deuda conocida» en [architecture.md](architecture.md): Chromium por operación, resize siempre a PNG, `present.js` y `viz.js` como scripts clásicos.

---

## 1. Mapa de módulos actual

```
editor/
  server.mjs            Bun.serve · serveFile (no-store, ?v= por arranque) · delega en route()
  api/
    router.mjs   355 l  HTTP + regex de rutas + validación + git (spawnSync) + listado de assets
    slides.mjs   252 l  CRUD de slides + scaffold de templates + slugify + previewUrl
    renumber.mjs 119 l  Orden en deck.config.json (readSlides/renumber/delete/move) · nombre histórico
    structure.mjs 194 l Secciones ANSVA: matemática pura + lectura/escritura de deck.config.json
    decks.mjs     84 l  listDecks · deckDir · TALKS_ROOT · listTemplateSlides (fuera de sitio)
    frontmatter.mjs 454 l  Parser/serializer YAML propio (puro, bien testeado)
    templates.mjs  10 l  require(_data/templates.json)
    pdf.mjs      132 l  Playwright: screenshot por slide → PDF
    assets.mjs   175 l  Subida de imágenes + resize vía Playwright/canvas
    design-system.mjs   Lista iconos del paquete de diseño (ruta relativa al CWD)
  ui/
    index.html   219 l  Shell del SPA
    app.js      2701 l  TODO el editor: estado, API, sidebar, drag&drop, formularios,
                        RTE, asset picker, icon browser, items, modales, toasts, galería…
    editor-helpers.mjs   4 helpers puros (testeados)
    clipboard-svg.mjs    extractSvgFromText (testeado)
    styles.css  1424 l
theme/assets/
  present.js   342 l  Runtime de una slide: fit, autofit, reveal, variantes, teclas, touch
  deck.js      300 l  Player (iframe) + navegación + módulo `remote` (host del mando)
  deck-speaker.js 326 l  Vista speaker + timer + modo móvil `?phone=1` (controller del mando)
theme/_includes/
  deck-player.njk · deck-speaker.njk · deck-toc.njk · layouts/*.njk · partials/*.njk
api/remote.mjs  260 l  Relay del mando (Vercel + Redis, mini-Redis en memoria). Limpio.
.eleventy.js    251 l  CJS · listDecks propio · transform deckAssets · filtro parseBigList
_data/          site.js · typeRecipes.js · templates.json
scripts/        build-seo · format-decks · new-deck (CJS, obsoleto) · new-slide (CJS, obsoleto)
                sync-fonts · screenshot-* · start/stop-servers.sh
tests/          unit (10) · integration (2) · e2e (Playwright, solo lectura de UI)
```

Dependencias relevantes entre módulos del editor:

```
router ─▶ decks, slides, renumber(getSlideDir), structure, pdf, assets, templates,
          design-system, ../../api/remote
slides ─▶ frontmatter, renumber, decks(deckDir), structure(sync*)
structure ─▶ renumber(readSlides), decks(deckDir)
assets ─▶ decks(deckDir), renumber(getSlideDir)
pdf ─▶ slides(listSlides)
```

Hay un ciclo lógico `slides → structure → renumber` y `structure → decks`, que
funciona porque ESM lo tolera, pero refleja que "dónde está el deck en disco"
y "cómo se lee deck.config.json" están repartidos entre tres ficheros
(`decks.mjs`, `renumber.mjs`, `structure.mjs`).

---

## 2. Problemas concretos

Ordenados por capa. Cada uno con fichero:línea y gravedad
(🔴 bug o riesgo real · 🟠 deuda que frena cambios · 🟡 limpieza).

### 2.1 Editor · API (`editor/api`)

| # | Grav. | Dónde | Problema |
|---|---|---|---|
| A1 | 🟠 | `router.mjs:10,172-186,280-298` | El router ejecuta `git` con `spawnSync` (status y revert). Transporte mezclado con infraestructura. Además `git-revert` usa `TALKS_ROOT` y no `decksRoot`, así que es el único endpoint no testeable contra un tmpdir. |
| A2 | 🟠 | `router.mjs:137-153` | El listado de assets (`readdirSync` + filtro de extensiones) vive en el router; `assets.mjs` sólo sabe subir. Dos sitios conocen qué es "una imagen". |
| A3 | 🟠 | `router.mjs` (22 veces) | `validSlug` + `return err('Invalid deck slug')` repetido en cada ruta; cada handler lleva su propio `try/catch` con un código HTTP elegido a mano (`404` aquí, `400` allá, `500` acullá). El `filename` nunca se valida contra `SLIDE_FILE_RE` (está en `renumber.mjs:5`), así que la validación de entrada está en dos capas distintas y es incompleta. |
| A4 | 🟠 | `slides.mjs:34,40,121`, `renumber.mjs:92,109`, `structure.mjs:188`, `assets.mjs:43-55` | Errores como `new Error('Slide not found')` con strings ad hoc; el router adivina el status por la ruta, no por el error. Un `not found` dentro de un `PUT` sale como `400`. |
| A5 | 🟠 | `decks.mjs:11-13`, `slides.mjs:16` | `TALKS_ROOT`, `DECKS_DIR`, `TEMPLATES_DIR` definidos en `decks.mjs` y re-derivados en `slides.mjs`. `design-system.mjs:4` usa `path.resolve('node_modules/…')` **relativo al CWD**: si el servidor se arranca desde otro directorio, el icon browser devuelve `[]` sin error. |
| A6 | 🟠 | `slides.mjs:156`, `decks.mjs:81`, `pdf.mjs:41` (indirecto) | `http://localhost:8080` hardcodeado como string en tres sitios del backend (y ocho en el frontend, ver B5). |
| A7 | 🟡 | `decks.mjs:57-84` | `listTemplateSlides` no tiene nada que ver con decks; está ahí porque `TEMPLATES_DIR` estaba ahí. |
| A8 | 🟡 | `renumber.mjs` | El nombre es histórico: ya no renumera ficheros (`buildFilename(order, slug)` ignora `order`, línea 64). Hoy es el **repositorio de orden** del deck (`deck.config.json`). `structure.mjs:31-47` reimplementa `readDeckConfig`/`writeDeckConfig` que `renumber.mjs:7-19` ya tiene (`readConfig`/`writeConfig`), con una diferencia sutil: uno escribe `\n` final y otro no, así que alternar operaciones genera diffs de una línea en `deck.config.json`. |
| A9 | 🟡 | `slides.mjs:88-105` | `createSlide` escribe el fichero con un "orden temporal" y luego reordena; como el nombre ya no depende del orden, `tempFilename === finalFilename` y el baile sobra. La `position` se podría insertar directamente en el config. |
| A10 | 🟡 | `pdf.mjs:26` | `exportDeckPdf(slug)` lee de disco en vez de recibir la lista de slides; acopla el export al FS (ya señalado en `docs/architecture.md`). |
| A11 | 🟡 | `router.mjs:55-72` | `adaptVercel` (adaptador Bun→Vercel) vive dentro del router. Es infraestructura reutilizable; debería estar aparte. |
| A12 | 🟡 | `router.mjs` global | Rutas por `pathname.match(regex)` en cascada, 13 regex. Funciona, pero cada endpoint nuevo copia 8 líneas. Una tabla `[method, pattern, handler]` elimina la repetición sin traer un framework. |

### 2.2 Editor · UI (`editor/ui/app.js`, 2 701 líneas)

| # | Grav. | Dónde | Problema |
|---|---|---|---|
| B1 | 🔴 | `app.js` entero | Un solo fichero con 88 funciones de nivel superior y ~12 responsabilidades: estado, cliente HTTP, sidebar + drag&drop de slides y de secciones, tooltips, formularios por template, RTE contenteditable, asset picker (dos implementaciones casi idénticas: `mkRichTextEditor:1577-1655` y `mkGlyphInput:1771-1830`), icon browser, items editor, modales (3 estilos distintos de modal: `#modal-add` en HTML, `promptAssetName` con `innerHTML`, `openIconBrowser`/`openMarkdownViewer` con `createElement`), toasts, galería con zoom, context menu, PDF, present. Cualquier cambio obliga a leer el fichero completo. |
| B2 | 🟠 | `app.js:13-28` + `478,1198,2132-2133,2200-2202,2357,2370` | El estado está repartido: un objeto `state`, nueve `let` sueltos a nivel de módulo y dos campos (`fieldStash`, `fieldStashFor`, líneas 653/763) que se añaden a `state` en caliente sin declararse. |
| B3 | 🟠 | `app.js:645-648, 909-912, 1865-1875, 2665-2700` | Conocimiento de dominio en la UI: `TEMPLATE_OPTIONAL_FIELDS`, `isRawHtmlField`, `emptyItem` por template, `structuredItemsToMarkdown`. Si se añade un template hay que tocar `app.js`, `_data/templates.json`, `templates/*.md` y `scripts/new-slide.js`. |
| B4 | 🟠 | `app.js:88-98` + 25 llamadas | `apiFetch` es un `fetch` genérico; las URLs `/api/decks/${slug}/slides/${fn}` se construyen a mano en 20 sitios. No hay un cliente API con funciones nombradas, así que renombrar una ruta es un grep. |
| B5 | 🟠 | `app.js:1290,1386,1630,1704,1744,1759,1784,1809` | `http://localhost:8080` repetido ocho veces; `PREVIEW_ORIGIN` existe (línea 1386) pero sólo se usa en una función. |
| B6 | 🟡 | `app.js:540-549, 578-580` | `filename.replace(/^\d+-/, '')` para "re-encontrar la slide renombrada" tras reordenar: resto del esquema antiguo de nombres `NN-slug.md`. Hoy los nombres no cambian; es código muerto que confunde. |
| B7 | 🟡 | `app.js:1687-1713` `cleanHTML` + `1389-1396` `toEditorHTML` | La transformación "HTML de disco ↔ HTML del editor" es lógica pura y testeable, pero vive junto al DOM y depende de `state.currentDeck`. |
| B8 | 🟡 | `index.html:218` | `<script src="app.js?v=2">` mientras el servidor ya reescribe `?v=` (`server.mjs:39-40`); doble mecanismo. |
| B9 | 🟡 | `app.js:2024-2040` `markUnsaved` | Cada tecla llama a `renderSidebar()` completo (reconstruye todos los nodos) sólo para pintar un badge. En decks de 60 slides se nota. |

### 2.3 Player / speaker / present (`theme/assets`)

| # | Grav. | Dónde | Problema |
|---|---|---|---|
| C1 | 🟠 | `deck.js:146-297` vs `deck-speaker.js:196-325` | El cliente del relay está duplicado: `post()` (170 ↔ 224), `save()` con `storeKey` (166 ↔ 220), bucle de long-polling con la misma máquina de estados (`loop` 212 ↔ `follow` 285: fetch → `catch` → esperar 2 s → `404/403` → reset → `!ok` → esperar → `json`). Dos copias que ya divergen (uno ignora órdenes previas con `lastV === -1`, el otro no). |
| C2 | 🟡 | `deck.js:23-50`, `deck-speaker.js:103-108`, `present.js:108-128` | La construcción de la URL de una slide (`url + ?present=1&embedded=1&reveal=…`) y la búsqueda `slides.findIndex(s => s.order === …)` se repiten en los tres ficheros. `present.js` tiene `goto` y `gotoIndex` casi idénticos. |
| C3 | 🟡 | `deck.js`, `deck-speaker.js`, `present.js` | Los tres son IIFE clásicos (`<script src>`), no módulos ES. Eso impide compartir código sin un paso de build… pero **Eleventy sólo copia `theme/assets` tal cual** (`addPassthroughCopy`), y todos los navegadores objetivo soportan `<script type="module">`. Se puede extraer un `remote-client.js` compartido como módulo ES sin añadir build. |
| C4 | 🟡 | `theme/_includes/layouts/slide.njk:54` | `window.__SLIDES__` se rellena desde `collections.slides`, colección que **no existe** en `.eleventy.js` (las colecciones son `deck:<slug>` y `templates`). En una slide abierta sola (fuera del player) las flechas no navegan. No es visible en el flujo normal porque el player gestiona la navegación, pero es un bug latente; conviene decidir si se arregla o se documenta. |

### 2.4 Eleventy, `_data` y scripts

| # | Grav. | Dónde | Problema |
|---|---|---|---|
| D1 | 🟠 | `.eleventy.js:4-12` vs `editor/api/decks.mjs:19-45` | `listDecks` duplicado. Además `.eleventy.js:209-230` reimplementa la ordenación por `deck.config.json` que ya hace `renumber.mjs:29-57`, y `.eleventy.js:232-243` repite la lectura de `<slug>.json`/`<slug>.11tydata.json` de `decks.mjs:24-30`. Tres copias de "cómo se lee un deck". |
| D2 | 🟠 | `.eleventy.js:1` | CJS (`require`/`module.exports`) mientras el resto es ESM; obliga a `await import()` dentro de la config y bloquea D1 (no se puede `require` un `.mjs`). Eleventy 3 acepta `eleventy.config.mjs`. |
| D3 | 🟠 | `scripts/new-slide.js`, `scripts/new-deck.js` | Obsoletos: generan `NN-slug.md` con `order:` en el frontmatter (el orden vive hoy en `deck.config.json`), no crean `deck.config.json` ni `speaker.njk`, escriben `<slug>.json` cuando los decks reales usan `.11tydata.json`, y mantienen una tabla `SCAFFOLDS` paralela a `templates/*.md`. Usarlos hoy produce un deck que el editor no entiende bien. |
| D4 | 🟡 | `.eleventy.js:88-180` | `parseBigList` (90 líneas de parser de Markdown→items) inline en la config. Es lógica pura, testeable, y hoy sin tests. |
| D5 | 🟡 | `scripts/format-decks.mjs:35` | Sólo mira `decks/<slug>/*.md`, no `decks/<slug>/slides/*.md`, que es donde están todas las slides reales. El `--check` pasa en vacío. |

### 2.5 Tests

| # | Grav. | Dónde | Problema |
|---|---|---|---|
| E1 | 🟡 | `tests/unit/decks.test.mjs:19-96` | Testea contra el filesystem real (incluye `listTemplateSlides` sobre `templates/`), con un comentario que admite que no puede redirigir las constantes. Se arregla con A5. |
| E2 | 🟡 | `router.test.mjs` (695 l) | Cubre bien el router, pero no hay test de `git-status`/`git-revert` (imposible hasta A1) ni de `/api/decks/:slug/assets` GET. |
| E3 | 🟡 | — | Cero tests de `app.js` salvo los 4 helpers extraídos. Trocear la UI debe ir acompañado de mover la lógica pura (`cleanHTML`, `toEditorHTML`, `collectFormData` sin DOM, `structuredItemsToMarkdown`, `emptyItem`) a módulos testeables. |
| E4 | 🟡 | `playwright.config.js` | `reuseExistingServer: !CI` reutiliza el `:3001` del usuario; los e2e son sólo de lectura (abrir modales, cancelar), así que son seguros, pero no verifican guardar/reordenar. |

### 2.6 Lo que está bien y no se toca

- `frontmatter.mjs`: puro, 484 líneas de tests, round-trip sobre todos los decks.
- `structure.mjs`: la matemática de secciones está separada en funciones puras.
- `api/remote.mjs`: limpio, con mini-Redis y tests; sólo se toca si C1 lo pide (no debería).
- `assets.mjs` `imageWidthFromHeader`: bien aislado y testeado.
- `server.mjs`: pequeño y claro.

---

## 3. Arquitectura objetivo (pragmática)

Tres capas en el editor, sin interfaces ni inyección formal, sólo módulos con
una responsabilidad y dependencias en una dirección:

```
editor/
  config.mjs                 TALKS_ROOT, DECKS_DIR, TEMPLATES_DIR, DESIGN_SYSTEM_DIR,
                             PREVIEW_ORIGIN (env ELEVENTY_URL, default http://localhost:8080)
  api/
    http/
      router.mjs             tabla de rutas · parseo de params · mapea errores → status
      respond.mjs            json(), err(), text(), pdf()
      validate.mjs           slug, filename, body shapes (único sitio de validación)
      vercel-adapter.mjs     adaptVercel (hoy en router.mjs)
    domain/
      errors.mjs             NotFoundError, ValidationError, ConflictError (con .status)
      slides.mjs             CRUD (sin rutas, sin fs directo salvo vía deck-store)
      structure.mjs          igual que hoy, usando deck-store
      scaffold.mjs           loadTemplateScaffold + blank* (hoy en slides.mjs)
      templates.mjs          getTemplatesMeta + listTemplateSlides
    store/
      deck-store.mjs         deckDir, getSlideDir, readDeckConfig/writeDeckConfig (único),
                             readSlides, listDecks, listAssets · todo acepta decksRoot
      git.mjs                status(), revertFile()
    services/
      pdf.mjs                exportDeckPdf(slides) — recibe la lista
      assets.mjs             uploadAsset (como hoy)
      design-system.mjs      con ruta absoluta desde config
  ui/
    app.js                   bootstrap + wiring (≈150 líneas)
    state.js                 único objeto de estado + suscripción simple
    api-client.js            funciones nombradas: getDecks(), getSlide(slug, fn), saveSlide(...)
    sidebar.js               render + drag&drop de slides y secciones + tooltips
    form/
      form.js                renderForm / collectFormData
      controls.js            mkInput, mkSelect, mkCheckbox…
      rich-text.js           mkRichTextEditor
      asset-picker.js        un único picker reutilizado por RTE y glyph
      items.js               renderItemsEditor, addItemRow, emptyItem
      glyph.js               mkGlyphInput
    html-transform.js        cleanHTML, toEditorHTML (puros, testeables)
    modals.js                openModal({title, body, actions}) + confirm + prompt
    toast.js
    gallery.js               Add-slide modal + zoom
    icon-browser.js
    context-menu.js
    notes.js
    preview.js               iframe scaling, present, presentWithPhone, exportPdf
    template-rules.js        TEMPLATE_OPTIONAL_FIELDS, isRawHtmlField, structuredItemsToMarkdown
theme/assets/
  remote-client.js  (módulo ES)  createRemoteClient({api, storage, key}) con
                                 post(), poll(onState, onLost), session get/set
  slide-url.js      (módulo ES)  slideUrl(slide, {reveal}), findByOrder(slides, order)
  deck.js / deck-speaker.js      pasan a type="module" e importan los dos anteriores
```

Decisiones:

- **Sin frameworks nuevos.** Ni Express ni Zod ni bundler. Sólo módulos ES.
- **Validación en un sitio** (`http/validate.mjs`) y **errores tipados con status**
  (`domain/errors.mjs`); el router hace `catch (e) → err(e.message, e.status ?? 500)`
  una vez, no 22.
- **`decksRoot` inyectable se mantiene** (es lo que hace los tests baratos).
- **Compatibilidad**: los paths de import antiguos (`editor/api/slides.mjs`,
  `editor/api/decks.mjs`, `editor/api/frontmatter.mjs`) se conservan como
  re-exports mientras los tests y `scripts/format-decks.mjs` los usen; se
  actualizan los imports al final en un commit propio.
- **La UI se trocea por extracción**, no por reescritura: cada módulo nuevo
  recibe las funciones existentes tal cual; el comportamiento no cambia.
- **El relay (`api/remote.mjs`) no se toca.**

---

## 4. Plan de refactor priorizado

Cada paso = un commit (o dos) con `npx vitest run` en verde (salvo el fallo de
datos conocido) y, cuando toca UI, una pasada manual por el editor en `:3001`.
Orden por relación riesgo/beneficio: primero lo que desbloquea el resto y tiene
tests, al final lo que requiere más verificación manual.

### Fase 0 · Cimientos (riesgo bajo, desbloquea todo)

1. **`editor/config.mjs`** con rutas absolutas y `PREVIEW_ORIGIN`. Sustituir
   A5, A6 y el `path.resolve` relativo al CWD de `design-system.mjs`.
   Tests: `decks.test.mjs` deja de depender del FS real.
2. **`domain/errors.mjs`** + usar las clases en `slides`, `renumber`,
   `structure`, `assets`. Router: un único mapeo error→status.
   Test nuevo: `PUT` de slide inexistente devuelve `404` (hoy `400`).
3. **`store/deck-store.mjs`**: unificar `readConfig/writeConfig` (renumber) y
   `readDeckConfig/writeDeckConfig` (structure), con un único formato de
   escritura. Mover `deckDir`, `getSlideDir`, `readSlides`, `listDecks`,
   `listAssets` ahí. `renumber.mjs` pasa a ser un re-export fino (o
   `slide-order.mjs`).

### Fase 1 · Router limpio (riesgo bajo, cubierto por `router.test.mjs`)

4. **`store/git.mjs`** (`status`, `revertFile`) con `cwd` inyectable; el router
   delega. Test de `git-revert` contra un repo temporal.
5. **`http/validate.mjs`** (slug, filename, cuerpos) y **`http/respond.mjs`**;
   `adaptVercel` a **`http/vercel-adapter.mjs`**.
6. **Router por tabla de rutas**: `[method, regex, handler]`, un `try/catch`.
   El fichero baja de 355 a ~150 líneas. Mismos endpoints, mismos códigos.
7. `listTemplateSlides` y `loadTemplateScaffold` → `domain/templates.mjs` y
   `domain/scaffold.mjs`. `exportDeckPdf(slides)` recibe la lista.
8. Simplificar `createSlide` (A9): insertar la slide en `config.slides` en la
   posición pedida en vez de escribir con orden temporal y reordenar.
   Tests existentes de `slides.test.mjs` lo cubren.

### Fase 2 · Eleventy y scripts (riesgo medio: afecta al build)

9. **`.eleventy.js` → `eleventy.config.mjs`** (ESM). Verificar `npx eleventy`
   produce el mismo `_site/` (diff de un deck antes/después).
10. **Eleventy importa `store/deck-store.mjs`** para `listDecks`, lectura de
    metadatos y orden de slides (D1). Se borra la copia local.
11. **`parseBigList` → `theme/lib/big-list.mjs`** con tests unitarios.
12. **Scripts**: `format-decks.mjs` recorre también `slides/`; `new-deck.js` y
    `new-slide.js` se reescriben en ESM usando `deck-store` y
    `domain/slides.createSlide` (o se eliminan si el editor los sustituye del
    todo: decisión del usuario, ver §5).

### Fase 3 · Player/speaker (riesgo medio: comprobar mando en local)

13. **`theme/assets/remote-client.js`** (módulo ES) con `post`, `poll` y la
    sesión persistida; **`slide-url.js`** con `slideUrl` y `findByOrder`.
14. `deck.js` y `deck-speaker.js` pasan a `type="module"` e importan ambos.
    `present.js` usa `slide-url.js` y funde `goto`/`gotoIndex`.
    Verificación: player + speaker `?phone=1` contra `?api=http://localhost:3001/api/remote`
    (relay en memoria), pairing, next/prev, revoke. Tests unitarios del
    `remote-client` con `fetch` falso.
15. C4 (`collections.slides`): proponer arreglo (usar la colección del deck
    desde el `11tydata` o eliminar la navegación standalone). Pequeño, pero es
    un cambio de comportamiento visible → se consulta antes.

### Fase 4 · UI del editor (riesgo alto en verificación manual, bajo en lógica)

Orden pensado para que cada paso sea pequeño y comprobable en el navegador:

16. **Lógica pura fuera primero**: `html-transform.js` (`cleanHTML`,
    `toEditorHTML(html, previewOrigin, slug)`), `template-rules.js`
    (`TEMPLATE_OPTIONAL_FIELDS`, `isRawHtmlField`, `emptyItem`,
    `structuredItemsToMarkdown`). Tests unitarios para las cuatro.
17. **`api-client.js`** con funciones nombradas; `app.js` las usa. Elimina las
    20 URLs a mano y los ocho `localhost:8080` (B4, B5): el origen del preview
    viene de `previewUrl` que ya devuelve la API.
18. **`toast.js`, `modals.js`** (un solo `openModal` + `confirm` + `prompt`),
    `context-menu.js`. `promptAssetName`, `openMarkdownViewer`,
    `openIconBrowser` y el confirm de borrado pasan a usarlo.
19. **`state.js`**: un único objeto con todos los campos declarados (incluye
    `fieldStash`, `tmplSlides`, `pendingDelete`…) y un `subscribe` mínimo para
    que `markUnsaved` no re-renderice la sidebar entera (B9: actualizar sólo el
    badge).
20. **`sidebar.js`** (render, drag&drop de slides y secciones, tooltips),
    eliminando el `replace(/^\d+-/, '')` muerto (B6).
21. **`form/`**: `controls.js`, `rich-text.js`, **`asset-picker.js` único**
    (hoy duplicado en RTE y glyph), `glyph.js`, `items.js`, `form.js`
    (`renderForm`/`collectFormData`/`onTemplateChange`/`onVariantChange`).
22. **`gallery.js`, `icon-browser.js`, `preview.js`, `notes.js`**; `app.js`
    queda como bootstrap (`init`, `wireEvents`). Quitar `?v=2` de
    `index.html` (B8).
23. E2E: añadir un test de guardar + reordenar contra un deck temporal creado
    por el propio test (no contra los decks reales), para que la fase 4 tenga
    red de seguridad automática además de la manual.

### Fase 5 · Cierre

24. Actualizar imports de tests/scripts a los nuevos paths y borrar los
    re-exports de compatibilidad.
25. Reescribir `docs/architecture.md` con la estructura final; borrar la
    sección "Issues and Improvement Opportunities" que queda resuelta.

Estimación: ~25 commits. Las fases 0-1 son casi mecánicas y están cubiertas por
los 626 tests actuales; la fase 4 es la que más tiempo de verificación manual
pide.

---

## 5. Decisiones que necesito del usuario

1. **Scripts obsoletos `new-deck.js` / `new-slide.js`** (D3): ¿reescribir sobre
   el nuevo store o eliminarlos y dejar al editor como única vía de crear
   decks/slides? Mi recomendación: reescribir sólo `new-deck` (el editor no
   crea decks) y borrar `new-slide`.
2. **`collections.slides` en `slide.njk`** (C4): ¿arreglar la navegación de una
   slide abierta sola o dejarla documentada como no soportada? Recomendación:
   arreglar, es una línea en el `11tydata` de cada deck.
3. **Códigos HTTP** (A4): al tipar los errores, un `PUT`/`DELETE` sobre una slide
   inexistente pasará de `400` a `404`. La UI sólo muestra `e.message`, así que
   no se nota, pero es un cambio de contrato de la API. ¿OK?
4. **`eleventy.config.mjs`** (D2): el rename cambia cómo se invoca Eleventy
   (nada en `package.json`, Eleventy 3 lo detecta solo), pero el `launch.json`
   local y cualquier alias del usuario que apunte a `.eleventy.js` dejan de
   valer. ¿OK?
5. **Alcance de la fase 4**: ¿trocear `app.js` completo (pasos 16-22) o parar
   tras extraer la lógica pura y el cliente API (16-17) y ver cómo se siente?

Con el OK a este plan (y respuestas a las cinco preguntas, o "haz lo que
recomiendas"), empiezo por la fase 0.
