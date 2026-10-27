/** Helpers de texto puros del editor. */

export function escHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Slugify a filename for use as asset basename. */
export function slugifyAssetName(name) {
  return name
    .toLowerCase()
    .replace(/\.[^.]+$/, '')          // strip extension
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'image';
}
