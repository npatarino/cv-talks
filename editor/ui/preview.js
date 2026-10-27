/**
 * Panel de preview: el iframe 1920x1080 (servido por Eleventy) escalado al
 * espacio disponible, con su etiqueta y estado vacío.
 */

import { dom } from './dom.js';
import { state } from './state.js';

export function scalePreview() {
  if (!dom.previewScaler || dom.previewScaler.style.display === 'none') return;
  const c = dom.previewContainer;
  const pad = 40;
  const availW = c.clientWidth - pad;
  const availH = c.clientHeight - pad;
  const scale = Math.min(availW / 1920, availH / 1080);
  const displayW = Math.round(1920 * scale);
  const displayH = Math.round(1080 * scale);
  dom.previewScaler.style.width  = displayW + 'px';
  dom.previewScaler.style.height = displayH + 'px';
  dom.previewFrame.style.transform = `scale(${scale})`;
}

/** Mantiene el preview escalado al redimensionar el panel. */
export function initPreview() {
  new ResizeObserver(scalePreview).observe(dom.previewContainer);
}

export function updatePreview(slide) {
  // El orden viene de deck.config.json (no del frontmatter), así que usamos la
  // posición real en la lista en vez de `data.order`, que suele ser undefined.
  const pos = state.slides.findIndex(s => s.filename === slide.filename);
  dom.previewLabel.textContent = (pos >= 0 ? `${pos + 1} · ` : '') + (slide.data.label ?? '');
  dom.previewPlaceholder.style.display = 'none';
  dom.previewScaler.style.display = 'block';
  dom.previewFrame.src = slide.previewUrl;
  // Scale after content loads (and on every subsequent live-reload)
  dom.previewFrame.onload = scalePreview;
  scalePreview();
}

export function clearPreview() {
  dom.previewScaler.style.display = 'none';
  dom.previewPlaceholder.style.display = 'flex';
  dom.previewFrame.src = 'about:blank';
  dom.previewLabel.textContent = 'No slide selected';
}
