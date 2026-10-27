/**
 * parseBigList — convierte el Markdown de una slide `big-list` en items.
 *
 * Soporta listas con viñeta (`-`, `*`, `+`) y ordenadas (`1.`, `a)`), checklists
 * (`[ ]`, `[x]`, `[-]`), glosario (`**término**: descripción`) y un nivel de
 * sub-items (indentados 4+ espacios). Lógica pura: sin dependencias de Eleventy.
 *
 * @param {string} markdown
 * @returns {Array<{text: string, n?: string, state?: string, term?: string, desc?: string, sub?: Array}>}
 */
export function parseBigList(markdown) {
  if (!markdown) return [];
  const lines = markdown.split(/\r?\n/);
  const items = [];
  let currentTop = null;

  for (const line of lines) {
    if (!line.trim()) continue;

    const indent = line.match(/^\s*/)[0].length;
    const cleanLine = line.trim();

    const unorderedMatch = cleanLine.match(/^([*+-])\s+(.*)$/);
    const orderedMatch = cleanLine.match(/^([a-zA-Z0-9]+)[\.)]\s+(.*)$/);

    if (!unorderedMatch && !orderedMatch) {
      if (indent >= 4 && currentTop && currentTop.sub && currentTop.sub.length > 0) {
        currentTop.sub[currentTop.sub.length - 1].text += ' ' + cleanLine;
      } else if (currentTop) {
        currentTop.text += ' ' + cleanLine;
      }
      continue;
    }

    const marker = unorderedMatch ? unorderedMatch[1] : orderedMatch[1];
    let content = unorderedMatch ? unorderedMatch[2] : orderedMatch[2];

    let state = null;
    const checklistMatch = content.match(/^\[([ xX-])\]\s+(.*)$/);
    if (checklistMatch) {
      const boxChar = checklistMatch[1];
      content = checklistMatch[2];
      if (boxChar === 'x' || boxChar === 'X') {
        state = 'done';
      } else if (boxChar === '-') {
        state = 'fail';
      } else {
        state = 'todo';
      }
    }

    let term = null;
    let desc = null;
    const glossaryMatch = content.match(/^(?:\*\*(.*?)\*\*|([^*:\s][^:]*))\s*:\s*(.*)$/);
    if (glossaryMatch) {
      const potentialTerm = (glossaryMatch[1] || glossaryMatch[2]).trim();
      if (potentialTerm.toLowerCase() !== 'http' && potentialTerm.toLowerCase() !== 'https') {
        term = potentialTerm;
        desc = glossaryMatch[3].trim();
      }
    }

    const isSub = (indent >= 4);

    if (isSub) {
      if (!currentTop) {
        currentTop = { text: content };
        if (state) currentTop.state = state;
        if (term !== null) {
          currentTop.term = term;
          currentTop.desc = desc;
        }
        items.push(currentTop);
      } else {
        if (!currentTop.sub) {
          currentTop.sub = [];
        }
        const subItem = { n: marker, text: content };
        if (state) subItem.state = state;
        if (term !== null) {
          subItem.term = term;
          subItem.desc = desc;
        }
        currentTop.sub.push(subItem);
      }
    } else {
      currentTop = { text: content };
      if (orderedMatch) {
        currentTop.n = marker;
      }
      if (state) currentTop.state = state;
      if (term !== null) {
        currentTop.term = term;
        currentTop.desc = desc;
      }
      items.push(currentTop);
    }
  }

  return items;
}
