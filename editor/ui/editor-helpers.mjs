/**
 * Pure helpers used by the editor UI.
 *
 * Lives in its own ESM module so vitest can exercise it without a DOM. The
 * runtime `app.js` imports it as a sibling module.
 */

/**
 * Build the HTML fragment to insert into a contenteditable field when the
 * user picks an asset from the picker.
 *
 * The canonical pattern across this project is:
 *   <img src="..." alt="" class="title-icon"><br>
 *
 * That:
 *  - Lets `.title-icon` in theme/styles/base.css scale the image to 0.7em
 *    of the heading font (so it sits inline as an icon, not full-bleed).
 *  - The trailing <br> drops the title text to the next line below the
 *    icon — matches the slides authored by hand (e.g. Moneyball).
 *
 * @param {string} src — absolute path under /talks/decks/.../assets/...
 * @returns {string}
 */
export function buildAssetInsertHTML(src) {
  // Browsers serialize attributes with `="value"` — keep that shape so the
  // string output matches what execCommand('insertHTML') ends up storing
  // and tests can assert byte-for-byte if needed.
  return `<img src="${src}" alt="" class="title-icon"><br>`;
}

/**
 * Build the absolute asset path used by the editor and the live preview.
 * Centralized here so any change to the URL shape (e.g. moving assets
 * under a different prefix) is a one-line change.
 */
export function buildAssetSrc(deckSlug, filename) {
  return `/talks/decks/${deckSlug}/assets/${filename}`;
}

/**
 * Merge previous field values into a scaffold, only for keys present in
 * both. Preserves the scaffold's `meta` so the form labels stay correct
 * after a template/variant change.
 *
 * Behavior:
 *  - Keys in scaffold that don't exist in previous → kept from scaffold (blank).
 *  - Keys in scaffold that DO exist in previous → previous content wins,
 *    but the scaffold's `meta` is preserved (the meta is bound to the
 *    template field name, not to the user's content).
 *  - Keys in previous that aren't in scaffold → dropped (the new template
 *    doesn't have a slot for them).
 *  - `previous` may be a plain object or `{content, meta}` shape — both
 *    are handled.
 *
 * @param {Record<string, any>} scaffold
 * @param {Record<string, any> | null | undefined} previous
 * @returns {Record<string, any>}
 */
export function mergeFields(scaffold, previous) {
  if (!previous || typeof previous !== 'object') return scaffold;
  const out = {};
  for (const [key, scaffoldVal] of Object.entries(scaffold)) {
    const prev = previous[key];
    if (prev != null) {
      // Object shape ({ content, meta }) — copy content, keep scaffold meta.
      if (typeof scaffoldVal === 'object' && scaffoldVal !== null) {
        const content = typeof prev === 'object' ? (prev?.content ?? '') : String(prev ?? '');
        out[key] = { ...scaffoldVal, content };
      } else {
        out[key] = typeof prev === 'object' ? (prev?.content ?? '') : prev;
      }
    } else {
      out[key] = scaffoldVal;
    }
  }
  return out;
}

/**
 * Compute the default position for inserting a new slide.
 *
 * Returns `selectedIndex + 2` (i.e. just after the selected slide, 1-indexed),
 * or `slides.length + 1` (end of deck) when no slide is selected.
 *
 * Extracted so vitest can verify the "insert after selected" UX rule that
 * the user explicitly requested.
 *
 * @param {{filename: string}[]} slides
 * @param {string | null | undefined} selectedFilename
 * @returns {number}
 */
export function defaultInsertPosition(slides, selectedFilename) {
  if (!Array.isArray(slides)) return 1;
  if (!selectedFilename) return slides.length + 1;
  const idx = slides.findIndex(s => s.filename === selectedFilename);
  return idx === -1 ? slides.length + 1 : idx + 2;
}
