/**
 * Estado compartido del editor: un único objeto con todos los campos
 * declarados. Las referencias a elementos del DOM viven en dom.js y los
 * cachés/handles privados de cada vista, dentro de su módulo.
 */

export const state = {
  // ── Datos del servidor ───────────────────────────────────────────────────
  decks: [],
  templates: {},                    // _data/templates.json (variantes por template)
  previewOrigin: 'http://localhost:8080',   // sobrescrito por /api/config al arrancar

  // ── Deck y selección ─────────────────────────────────────────────────────
  currentDeck: null,
  slides: [],
  structure: null,                  // mapa narrativo (ANSVA…) del deck actual
  selectedFilename: null,
  slideData: null,

  // ── Edición ──────────────────────────────────────────────────────────────
  hasUnsaved: false,
  dirtyFiles: new Set(),            // cambios sin guardar (badge amarillo)
  uncommittedFiles: new Set(),      // guardadas pero sin commit (badge verde)
  livePreviewTimer: null,
  fieldStash: {},                   // campos vistos en la slide abierta, para no perder
  fieldStashFor: null,              //   contenido al cambiar de template y volver

  // ── Drag & drop de la sidebar ────────────────────────────────────────────
  draggingFilename: null,
  dragOverFilename: null,
  draggingSectionIndex: null,       // cabecera de sección arrastrada

  // ── Confirmaciones ───────────────────────────────────────────────────────
  pendingDelete: null,
};
