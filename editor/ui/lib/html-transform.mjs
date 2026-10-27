/**
 * Transformaciones puras entre el HTML guardado en las slides y el HTML que
 * se edita en el contenteditable. Sin DOM, para poder probarlas con vitest.
 */

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Stored slide HTML → editor-renderable HTML (absolutize asset URLs against the
 * Eleventy preview `origin`, because the editor server does not serve /talks).
 */
export function toEditorHTML(html, deckSlug, origin) {
  // Los .md guardan paths cortos (`assets/x.svg`); para mostrarlos en el editor
  // los absolutizamos contra el preview. cleanHTML() hace el camino inverso.
  const deckBase = `${origin}/talks/decks/${deckSlug}/assets/`;
  return (html ?? '')
    .replace(/(<img\b[^>]*\bsrc=")assets\//gi, `$1${deckBase}`)
    .replace(/(<img\b[^>]*\bsrc=")\/talks\//gi, `$1${origin}/talks/`);
}

/** Normalize contenteditable HTML back to clean slide HTML (inverse of toEditorHTML). */
export function cleanHTML(html, origin) {
  return html
    // Normalize bold/italic from browser defaults
    .replace(/<b(\s[^>]*)?>/gi, '<strong$1>')
    .replace(/<\/b>/gi, '</strong>')
    .replace(/<i(\s[^>]*)?>/gi, '<em$1>')
    .replace(/<\/i>/gi, '</em>')
    // Remove contenteditable artifacts: <div>, <p> → flatten with <br>
    .replace(/<div>/gi, '')
    .replace(/<\/div>/gi, '<br>')
    .replace(/<p>/gi, '')
    .replace(/<\/p>/gi, '<br>')
    // Strip trailing <br> at end
    .replace(/(<br\s*\/?>\s*)+$/, '')
    // Remove style attributes added by execCommand
    .replace(/ style="[^"]*"/gi, '')
    // Re-relativize asset URLs that were absolutized for in-editor rendering
    .replace(new RegExp('(<img\\b[^>]*\\bsrc=")' + escapeRegExp(origin) + '/', 'gi'), '$1/')
    // Assets del propio deck → path corto `assets/x` (lo expande el build)
    .replace(/(<img\b[^>]*\bsrc=")\/talks\/decks\/[^/"]+\/assets\//gi, '$1assets/')
    .trim();
}
