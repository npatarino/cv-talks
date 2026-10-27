# slides-templates

Sistema modular de slides con Eleventy + dual-mode rendering.
44 templates canónicos en `templates/`, cada uno declara una **recipe** del DS y consume solo `--recipe-*` desde el CSS.

> Para el modelo completo (las 7 recipes, el patrón `critical-fg`, las excepciones nombradas) ver [`packages/design-system/docs/recipes.md`](../design-system/docs/recipes.md).

## Setup

```bash
cd slides-templates
npm install --registry=https://registry.npmjs.org/
npm run serve            # modo content (texto real) · http://localhost:8080
npm run serve:meta       # modo meta (nombres de campos)
```

## Build

```bash
npm run build            # → _site/  (modo content)
npm run build:meta       # → _site/  (modo meta, para review)
```

## Presentación

- **P** · toggle modo presentación (escala 16:9 al viewport).
- **F** · fullscreen + presentación.
- **←** / **→** / **Espacio** · navegar entre slides.
- **Esc** · salir.
- `?present=1` en la URL arranca directo.

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

- **`view=presentation` (default ≥ 768px)** · el modo histórico:
  cada slide ocupa un canvas fijo de 1920×1080 px y `present.js`
  aplica un `transform: scale(...)` para encajar en el viewport. El
  deck-player es un único iframe con navegación por teclado.
- **`view=mobile` (default < 768px)** · pensado para mostrar la charla
  en un teléfono. Cada slide se re-renderiza en `100vw × 100svh`
  usando tipografía web-scale (definida en
  `theme/styles/viewer-mobile.css`); el deck-player se convierte en
  una pila vertical de iframes con `scroll-snap-type: y mandatory`,
  para que el lector deslice un slide por pantalla con el dedo. Los
  recipes y `--recipe-*` siguen funcionando intactos en ambos modos.

Forzar modo manualmente:

```
/talks/decks/<slug>/deck/?view=presentation
/talks/decks/<slug>/deck/?view=mobile
/talks/decks/<slug>/<slide>/?view=mobile
```

El umbral de 768px coincide con el token `--md` del design system,
así que el comportamiento auto coincide con el de los webs (blog,
techconf, recall-for-papers, simple-pdf-converter, simple-scrum-poker).
Los slides con layouts densos o `position: absolute` pueden necesitar
ajustes específicos en viewer mode — es un follow-up conocido y está
fuera del alcance del rollout inicial.

## Crear un deck y slides nuevos

Desde el editor, o por línea de comandos (usan el mismo código que el editor):

```bash
node scripts/new-deck.mjs <slug> "<título>" ["<autor>"] [--subtitle "..."] [--date YYYY-MM]
node scripts/new-slide.mjs <deck> <template> ["<label>"] [--variant V] [--recipe R] [--position N] [--slug S]
# ej: node scripts/new-deck.mjs mi-charla "Mi charla" "Nicolás Patarino"
# ej: node scripts/new-slide.mjs mi-charla big-stat "Big stat · burnout" --position 5
```

Tras crear un deck hay que reiniciar `eleventy --serve` para que registre su colección.

## Templates → recipes

Cada `templates/*.md` declara una recipe en frontmatter:

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

El partial Njk pasa `recipe` al `<section>` como `data-recipe="..."`. El CSS solo consume `--recipe-{surface,ink,em,accent,warn}`.

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

Templates compuestos (con variantes): `big-concept` (default/divider/transition/prompt/disclaimer), `quote` (default/xl/testimonial/punch/critical), `big-stat` (default/multiplier/critical), `big-list` (numeric/bullets/checklist/glossary/critical), `chart` (bar/line), `code-block` (default/anti), `roadmap` (default/timeline), `resource-cards` (default/team).

Excepciones nombradas (`allowMultipleAccents`, `allowMultipleStats`, `allowDeckOverride`) viven en [`packages/design-system/tokens/type.recipe.json`](../design-system/tokens/type.recipe.json) bajo `_namedExceptions`.

## Estructura

```
src/
├── _data/site.js              # config global (mode content/meta)
├── _includes/
│   ├── layouts/               # un .njk por template + slide.njk base
│   └── partials/field.njk     # macro dual-mode
├── slides/*.md                # datos por slide (1 archivo = 1 slide)
├── styles/
│   ├── tokens.css             # design tokens compartidos
│   ├── base.css               # .slide, .sl-label, present mode
│   └── slides/*.css           # CSS scoped por template
├── assets/present.js          # modo presentación
└── index.njk                  # índice con TOC + botón "Iniciar presentación"
```

## Dual-mode

```yaml
eyebrow:
  content: "◆ Dato duro"     # render normal
  meta: "Eyebrow_Label"       # render debug/review
  source: "opcional: trazabilidad"
```

Global: `SLIDE_MODE=meta npm run build`. Override por slide: `mode: meta` en frontmatter.
