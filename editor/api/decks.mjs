/**
 * Compatibilidad: el acceso a decks vive en store/deck-store.mjs y el listado
 * de templates en domain/templates.mjs.
 */

export { listDecks, deckDir } from './store/deck-store.mjs';
export { listTemplateSlides } from './domain/templates.mjs';
export { TALKS_ROOT } from '../config.mjs';
