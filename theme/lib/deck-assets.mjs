/**
 * Assets de deck con path corto. En los .md basta con `assets/x.svg` (en src,
 * href o data-inline); la transformación lo expande a /talks/decks/<slug>/assets/
 * según el deck al que pertenece la página. Después resuelve `data-inline`:
 *   <img src="assets/x.svg" data-inline …>   → SVG incrustado (hereda fuentes y
 *                                              sus animaciones CSS funcionan)
 *   <div data-inline="assets/x.html"></div>  → fragmento HTML incrustado
 * Los atributos class/style/alt del <img> pasan al <svg>.
 */

import fs from 'node:fs';
import path from 'node:path';

/** Lee un asset de texto del deck (slides/assets/ o assets/), o null. */
export function readDeckAsset(decksDir, slug, file) {
  const candidates = [
    path.join(decksDir, slug, 'slides', 'assets', file),
    path.join(decksDir, slug, 'assets', file),
  ];
  const found = candidates.find((f) => fs.existsSync(f));
  return found ? fs.readFileSync(found, 'utf8') : null;
}

/**
 * Transforma el HTML de una página de deck.
 * @param {string} content - HTML renderizado
 * @param {string} inputPath - ruta de entrada de la página (decide el deck)
 * @param {string} outputPath - ruta de salida (solo se procesan .html)
 * @param {string} decksDir - carpeta decks/
 */
export function expandDeckAssets(content, inputPath, outputPath, decksDir) {
  const m = (inputPath || '').match(/decks\/([^/]+)\//);
  if (!m || !/\.html$/.test(outputPath || '')) return content;
  const slug = m[1];
  const base = `/talks/decks/${slug}/assets/`;
  let html = String(content).replace(/\b(src|href|data-inline)="assets\//g, `$1="${base}`);
  html = html.replace(/<div\s+data-inline="\/talks\/decks\/([^/"]+)\/assets\/([^"?#]+\.html)"\s*>\s*<\/div>/g, (tag, s, file) => {
    const frag = readDeckAsset(decksDir, s, file);
    return frag ? frag.trim() : tag;
  });
  // SVGs del deck: se incrustan si llevan `data-inline` o si son animados
  // (contienen <style>, <script> o <animate…>), ya que como <img> perderían
  // la animación. Así no depende de que el editor conserve el atributo.
  return html.replace(/<img\b([^>]*)>/g, (tag, attrs) => {
    const src = (attrs.match(/\bsrc="([^"]+)"/) || [])[1];
    const mm = src && src.match(/^\/talks\/decks\/([^/]+)\/assets\/([^"?#]+\.svg)$/);
    if (!mm) return tag;
    let svg = readDeckAsset(decksDir, mm[1], mm[2]);
    if (!svg) return tag;
    const explicit = /\bdata-inline\b/.test(attrs);
    const animated = /<style\b|<script\b|<animate/i.test(svg);
    if (!explicit && !animated) return tag;
    svg = svg.replace(/<\?xml[^>]*>\s*/, '').trim();
    const cls = (attrs.match(/\bclass="([^"]*)"/) || [])[1];
    const style = (attrs.match(/\bstyle="([^"]*)"/) || [])[1];
    const alt = (attrs.match(/\balt="([^"]*)"/) || [])[1];
    return svg.replace(/<svg\b([^>]*)>/, (open, sa) => {
      let s = sa;
      if (cls) s = /\bclass="/.test(s) ? s.replace(/\bclass="([^"]*)"/, `class="$1 ${cls}"`) : s + ` class="${cls}"`;
      if (style) s = /\bstyle="/.test(s) ? s.replace(/\bstyle="([^"]*)"/, `style="$1;${style}"`) : s + ` style="${style}"`;
      if (alt) s += ` role="img" aria-label="${alt}"`;
      return `<svg${s}>`;
    });
  });
}
