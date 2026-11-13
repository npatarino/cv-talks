# Plan de media para el post de cv-talks

Destino en el blog: `content/attachments/posts/2026-10-cv-talks/` y referencias `![[nombre.ext|alt]]` en el post.

## Ojo con el vídeo

El loader del blog (`src/loaders/_shared.ts`, `IMAGE_EXT`) solo convierte embeds de `png/jpg/jpeg/gif/webp/avif/svg`. Un `![[x.mp4]]` se elimina con un aviso en el log. Opciones, de menos a más trabajo:

1. Grabar los clips y exportarlos como **GIF o WebP animado** (WebP pesa mucho menos). Funciona hoy sin tocar nada.
2. Subir los clips a **YouTube** (no listados) y pegar la URL: el loader ya reconoce URLs de YouTube para charlas; habría que comprobar que en posts también las incrusta.
3. Añadir `.mp4`/`.webm` al loader y emitir `<video autoplay muted loop playsinline>`. Es un cambio pequeño y es lo que mejor queda.

Recomiendo la 3 si vas a seguir publicando cosas con clips; si no, la 1.

## Lista de capturas

| Fichero en el post | Qué muestra | Cómo sacarla |
|---|---|---|
| `cover-player-freson.png` (portada) | Player a pantalla completa con una slide potente del deck FresOn (una `energy-loud` o la `big-stat` crítica) | `/talks/decks/el-mito-de-la-productividad-toxica-freson/deck/?present=1`, captura a 1920×1080 o superior |
| `editor-sidebar-ansva.png` | La lista de slides del editor con las cabeceras ANSVA (A · N · S1 · S2 · S3 · V · A) y una slide seleccionada | Editor en `:3001`, deck freson, recortar la columna izquierda |
| `recipes-six-swatches.png` | Las seis recetas: una slide de ejemplo por receta, en una tira o grid 3×2 | `scripts/screenshot-templates.mjs --slug` sobre 01-cover-default (canvas-quiet), 15-big-stat-default (canvas-signal), 09-quote-default (paper), 04-big-concept-default (energy-loud), 05-big-concept-divider (cool-fresh), 08-big-concept-disclaimer (critical); montar la tira. Alternativa: tabla markdown con las seis imágenes, el blog la convierte en `img-grid` |
| `dual-mode-content-vs-meta.png` | La misma slide dos veces: modo content y modo meta (`SLIDE_MODE=meta`) | `bun run slides:serve-meta` para la de la derecha; mismo template las dos |
| `editor-overview.png` | El editor completo: sidebar, formulario, preview y panel de notas | Captura a 1440 px de ancho con una slide con notas largas |
| `editor-template-gallery.(webp\|gif)` | Clip de 5 s: Add slide, galería, hover zoom, elegir plantilla, aparece en la lista | Grabar pantalla del editor |
| `mobile-viewer.(webp\|gif)` | Clip vertical: deslizar el deck en el móvil (`?view=mobile`) | Simulador de iPhone o Chrome a 375 px grabando |
| `remote-pairing.(webp\|gif)` | Clip: tecla R en el player, aparece código + QR, el móvil se empareja, el HUD muestra `📱 1`, se avanza desde el móvil | Grabar las dos pantallas lado a lado (player en el Mac, móvil real o simulador con `speaker/?phone=1`) |
| `offline-badge.png` | Zoom al HUD del player con `OFFLINE ✓` | Producción, esperar a la precarga; o local con `?offline=1` |

## Extras que podrían sumar

- Un diagrama de las tres capas del design system (primitivas → recetas → utilidades), en SVG con las fuentes del DS. Iría en la sección del sistema de diseño.
- Un diagrama del flujo del mando (móvil → POST `/api/remote` → Redis ← long poll ← player). Iría bajo "El mando desde el móvil".
- El diff de un commit real donde cambiás una slide y sus notas a la vez: una captura de `git show` o del editor con el badge "modificada". Refuerza la idea de "contenido y guion en el mismo commit".
- Una foto real tuya en el escenario con el móvil en la mano y el player detrás, si la tenés de FresOn. Según DESIGN.md del blog, las fotos reales con pie (evento y ciudad) son lo que solo vos podés tener.

## Comprobaciones antes de publicar

- No hay emojis en el cuerpo del post (el `check-slop` del DS los cuenta). Hoy el borrador no tiene.
- Los `<!-- TBD -->` se eliminan en el build, pero conviene resolverlos: anécdota de apertura, mención a Claude Code, "qué sigue", CTA final.
- `npm run check && npm test && npm run build && npm run check:seo && npm run check:slop` en el repo del blog.
