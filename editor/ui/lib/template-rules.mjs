/**
 * Reglas del editor que dependen del template: campos opcionales, campos que
 * se editan como código, items vacíos y conversión de items a Markdown.
 */

// Fields a template supports but a slide may not carry yet. They're surfaced
// (empty) in the editor so the user can add them without hand-editing the .md.
// Empty values are dropped on save (see collectFormData) so the markdown stays
// clean for slides that don't use them.
export const TEMPLATE_OPTIONAL_FIELDS = {
  'big-concept': { icon: { content: '', meta: 'Image_Src' } },
  // Animaciones de fondo (HTML/JS) separadas de la imagen de fondo.
  'cover': { animation: { content: '', meta: 'Animation_HTML' } },
};

/**
 * True when a field's content is a raw HTML/JS block rather than rich text.
 * Such content (animated backgrounds, embeds, absolutely/fixed-positioned
 * markup, <script>/<style>/<iframe>) breaks the contenteditable RTE — both
 * visually (overlay capturing pointer events) and on save (cleanHTML strips
 * style/script). These fields are edited as plain code in a textarea.
 */
export function isRawHtmlField(content, meta) {
  return meta === 'Image_Background' || meta === 'Animation_HTML' || meta === 'Stage_HTML'
    || /<script\b|<style\b|<iframe\b|position\s*:\s*(absolute|fixed)/i.test(content || '');
}

export function emptyItem(template, variant) {
  if (template === 'big-list') {
    if (variant === 'glossary') return { term: '', desc: '' };
    if (variant === 'checklist') return { text: '', state: 'todo' };
    return { text: '' };
  }
  if (template === 'icon') return { glyph: '' };
  if (template === 'three-ideas') return { title: '', desc: '' };
  if (template === 'agenda') return { content: '' };
  return { text: '' };
}

export function structuredItemsToMarkdown(items, variant) {
  if (!Array.isArray(items)) return '';
  let markdownLines = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let line = '';
    if (variant === 'bullets') {
      line = `* ${item.text || ''}`;
    } else if (variant === 'checklist') {
      let box = ' ';
      if (item.state === 'done') box = 'x';
      else if (item.state === 'fail') box = '-';
      line = `- [${box}] ${item.text || ''}`;
    } else if (variant === 'glossary') {
      const term = item.term || '';
      const desc = item.desc || '';
      line = `* **${term}**: ${desc}`;
    } else {
      const n = item.n || `${i + 1}`;
      const displayN = /^[a-zA-Z0-9]+$/.test(n) ? `${n}.` : n;
      line = `${displayN} ${item.text || ''}`;
    }
    markdownLines.push(line);

    if (Array.isArray(item.sub)) {
      for (let j = 0; j < item.sub.length; j++) {
        const sub = item.sub[j];
        const subN = sub.n || 'a';
        const displaySubN = /^[a-zA-Z0-9]+$/.test(subN) ? `${subN}.` : subN;
        markdownLines.push(`    ${displaySubN} ${sub.text || ''}`);
      }
    }
  }
  return markdownLines.join('\n');
}
