/**
 * Referencias a los elementos de index.html. Los módulos de la UI son ES
 * modules (diferidos), así que el DOM ya está parseado cuando se evalúa esto.
 */

export const $ = id => document.getElementById(id);

export const dom = {
  deckSelector: $('deck-selector'),
  deckTitle: $('deck-title'),
  slideList: $('slide-list'),
  previewScaler: $('preview-scaler'),
  previewFrame: $('preview-frame'),
  previewPlaceholder: $('preview-placeholder'),
  previewLabel: $('preview-label'),
  previewContainer: $('preview-container'),
  formBody: $('form-body'),
  saveStatus: $('save-status'),
  btnSave: $('btn-save'),
  btnAddSlide: $('btn-add-slide'),
  btnRevert: $('btn-revert'),
  btnMoveUp: $('btn-move-up'),
  btnMoveDown: $('btn-move-down'),
  btnDeleteSlide: $('btn-delete-slide'),
  btnExportPdf: $('btn-export-pdf'),
  btnPresent: $('btn-present'),
  btnPresentPhone: $('btn-present-phone'),
  notesPanel: $('notes-panel'),
  notesTextarea: $('notes-textarea'),
  btnViewMd: $('btn-view-md'),
  btnNotesToggle: $('btn-notes-toggle'),
  notesResizeHandle: $('notes-resize-handle'),
  modalAdd: $('modal-add'),
  modalConfirm: $('modal-confirm'),
  newTemplate: $('new-template'),
  newVariant: $('new-variant'),
  newRecipe: $('new-recipe'),
  newLabel: $('new-label'),
  newPosition: $('new-position'),
  confirmMessage: $('confirm-message'),
};
