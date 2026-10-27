/**
 * Extract an SVG fragment from arbitrary clipboard text.
 *
 * Lives in its own ESM module so vitest can exercise it without booting
 * a browser. The runtime `app.js` imports it as a sibling module.
 *
 * Handles three common shapes seen on the clipboard:
 *  - Bare SVG markup (most "Copy SVG" buttons in design tools).
 *  - HTML payloads that contain a <svg> somewhere in the body.
 *  - XML-wrapped SVG with a `<?xml … ?>` prelude.
 */

/**
 * @param {string} text  raw clipboard text (text/plain or text/html)
 * @returns {string|null} serialized <svg>…</svg> markup, or null if none
 */
export function extractSvgFromText(text) {
  if (typeof text !== 'string' || !text.trim()) return null;
  // Quick reject — must contain "<svg" to even try.
  if (!/<svg[\s>]/i.test(text)) return null;

  const start = text.search(/<svg[\s>]/i);
  if (start < 0) return null;

  let svg;
  const lower = text.toLowerCase();
  const endIdx = lower.lastIndexOf('</svg>');
  if (endIdx > start) {
    // Standard <svg>…</svg> form.
    svg = text.slice(start, endIdx + '</svg>'.length);
  } else {
    // Self-closing <svg … /> form. Find the first matching '/>' after start.
    const selfClose = text.indexOf('/>', start);
    if (selfClose < 0) return null;
    svg = text.slice(start, selfClose + 2);
  }

  // Ensure the namespace is declared — pasting from some sources strips it.
  return /xmlns\s*=/.test(svg)
    ? svg
    : svg.replace(/<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"');
}
