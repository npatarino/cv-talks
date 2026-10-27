/** Valores de "glyph" (emoji, texto o imagen del deck) de los items. */

export const IMAGE_EXT_RE = /\.(png|jpg|jpeg|svg|gif|webp|avif)$/i;

export const IMG_ASSETS_RE = /^<img\s[^>]*src="(?:[^"]*\/)?assets\/([^"]+)"[^>]*>$/i;

/** Extract display value from a glyph — filename or emoji/symbol */
export function glyphToDisplay(raw) {
  const m = (raw ?? '').match(IMG_ASSETS_RE);
  return m ? m[1] : (raw ?? '');
}

/** Convert display value back to glyph storage format */
export function displayToGlyph(display) {
  if (!display) return '';
  if (display.startsWith('<')) return display; // already HTML
  if (IMAGE_EXT_RE.test(display)) {
    return `<img src="assets/${display}" alt="">`;
  }
  return display; // emoji or plain text
}
