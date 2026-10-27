/** Acciones sobre el deck completo: exportar a PDF y presentar (local u online + mando). */

import { exportPdf as exportPdfApi } from './api-client.js';
import { dom } from './dom.js';
import { state } from './state.js';
import { toast } from './toast.js';

export async function exportPdf() {
  if (!state.currentDeck) return;
  const btn = dom.btnExportPdf;
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="animation:spin 1s linear infinite">
      <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.4" stroke-dasharray="20" stroke-dashoffset="10"/>
    </svg>
    <span>Exporting…</span>`;

  try {
    const blob = await exportPdfApi(state.currentDeck);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.currentDeck}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    toast('PDF exported', 'success');
  } catch (e) {
    toast('PDF export failed: ' + e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

export async function presentDeck() {
  if (!state.currentDeck || state.slides.length === 0) return;
  const slide = state.slides.find(s => s.filename === state.selectedFilename) || state.slides[0];
  let baseUrl = window.location.origin;
  if (slide.previewUrl && slide.previewUrl.includes('/talks/')) {
    baseUrl = slide.previewUrl.split('/talks/')[0];
  }
  const playerUrl = `${baseUrl}/talks/decks/${state.currentDeck}/deck/#/${slide.order}`;
  window.open(playerUrl, '_blank');
}

/** Present online (talks.chimi.pro) with the phone remote enabled: opens the
 *  player with ?remote=1, which creates a private room on load. Press R in the
 *  player to show the one-time pairing code + QR for the phone. */
/** Present online (talks.chimi.pro) with the phone remote enabled: opens the
 *  player with ?remote=1, which creates a private room on load. Press R in the
 *  player to show the one-time pairing code + QR for the phone. */
const PUBLIC_SITE = 'https://talks.chimi.pro';

export function presentDeckWithPhone() {
  if (!state.currentDeck || state.slides.length === 0) return;
  const slide = state.slides.find(s => s.filename === state.selectedFilename) || state.slides[0];
  const playerUrl = `${PUBLIC_SITE}/talks/decks/${state.currentDeck}/deck/?remote=1#/${slide.order}`;
  window.open(playerUrl, '_blank');
  toast('Player abierto con mando. Pulsa R en el player para ver el código y el QR del móvil.', 'success');
}
