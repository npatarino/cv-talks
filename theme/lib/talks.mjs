/**
 * Agrupa los decks en charlas.
 *
 * Una misma charla puede darse varias veces (CommitConf, FresOn, ...): cada
 * vez es un deck propio con su `deck.edition`, y todas comparten `deck.talk`
 * (si falta, el slug del deck hace de clave y la charla tiene una sola edición).
 *
 * El listado muestra una entrada por charla, fechada con el mes y año de la
 * edición más reciente.
 */

/** "2025-09-18" → "2025-09"; "2026-05" → "2026-05"; vacío → "". */
export function monthOf(date) {
  if (!date) return '';
  const m = String(date).match(/^(\d{4})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}` : String(date);
}

/** Orden descendente por fecha (string ISO parcial); sin fecha va al final. */
function byDateDesc(a, b) {
  return String(b.date || '').localeCompare(String(a.date || ''));
}

/**
 * @param {Array<{slug: string, talk?: string, title?: string, subtitle?: string, date?: string, edition?: string}>} decks
 * @returns {Array<{key: string, title: string, subtitle: string, date: string, month: string, latest: object, editions: object[]}>}
 *   ordenadas de la más reciente a la más antigua.
 */
export function groupTalks(decks) {
  const groups = new Map();
  for (const deck of decks) {
    const key = deck.talk || deck.slug;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(deck);
  }
  return [...groups.entries()]
    .map(([key, editions]) => {
      const sorted = [...editions].sort(byDateDesc);
      const latest = sorted[0];
      return {
        key,
        title: latest.title || key,
        subtitle: latest.subtitle || '',
        date: latest.date || '',
        month: monthOf(latest.date),
        latest,
        editions: sorted.map((d) => ({ ...d, month: monthOf(d.date) })),
      };
    })
    .sort(byDateDesc);
}
