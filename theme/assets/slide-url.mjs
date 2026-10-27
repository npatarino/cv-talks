// Helpers compartidos por el player y el speaker para localizar slides y
// construir sus URLs. Puro: sin DOM.

export const pad2 = (n) => String(n).padStart(2, "0");

/** Índice de la slide con ese `order`, o -1. */
export function indexByOrder(slides, order) {
  return slides.findIndex((s) => s.order === order);
}

/**
 * `reveal` controla el estado inicial de progressive disclosure en slides con
 * listas: "1" (un item visible; forward), "full" (todos; backward). Si la slide
 * define `revealStart`, ese valor sustituye al "1" por defecto.
 */
export function revealFor(slide, override) {
  if (override) return override;
  if (slide.revealStart != null) return String(slide.revealStart);
  return "1";
}

/** URL de una slide embebida en el player o en un thumbnail del speaker. */
export function embeddedSrc(slide, reveal) {
  const params = new URLSearchParams();
  params.set("present", "1");
  params.set("embedded", "1");
  params.set("reveal", reveal);
  return `${slide.url}?${params.toString()}`;
}

/** Texto del HUD: "03 / 22 · Etiqueta". */
export function hudText(slide, slides) {
  return `${pad2(slide.order)} / ${pad2(slides[slides.length - 1].order)} · ${slide.label}`;
}
