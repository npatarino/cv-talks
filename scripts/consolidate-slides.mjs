import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readSlides } from '../editor/api/renumber.mjs';
import { getStructure } from '../editor/api/structure.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const deckSlug = 'el-mito-de-la-productividad-toxica';
const deckDir = path.join(projectRoot, 'decks', deckSlug);
const outputFilePath = '/Users/malvinas/.gemini/antigravity-ide/brain/91b36011-5ffb-49e3-942f-2b58de66be1d/consolidated_slides.md';

const slides = readSlides(deckDir);
const structure = getStructure(deckSlug, path.join(projectRoot, 'decks'));

let md = `# Presentación: El mito de la productividad tóxica (Consolidada)\n\n`;
md += `Este documento contiene la estructura completa y el contenido de todas las slides de la presentación, incluyendo notas de orador y campos de datos. Diseñado para ser procesado por una IA para refinar, acortar, cerrar o dar retroalimentación a la presentación.\n\n`;

// Add structural overview
if (structure && structure.sections) {
  md += `## Estructura de la Presentación (ANSVA)\n\n`;
  structure.sections.forEach(sec => {
    md += `- **[Slide ${sec.start} - ${sec.end}] ${sec.label}** (${sec.description})\n`;
    if (sec.children) {
      sec.children.forEach(child => {
        md += `  - **[Slide ${child.start} - ${child.end}] ${child.id}: ${child.label}** (${child.description})\n`;
      });
    }
  });
  md += `\n---\n\n`;
}

slides.forEach((slide) => {
  const order = slide.data.order; // 1-indexed
  const filename = slide.filename;

  // Find parent and child section
  let secLabel = '';
  let subSecLabel = '';
  if (structure && structure.sections) {
    for (const section of structure.sections) {
      if (order >= section.start && order <= section.end) {
        secLabel = `${section.id}: ${section.label}`;
        if (section.children) {
          for (const child of section.children) {
            if (order >= child.start && order <= child.end) {
              subSecLabel = `${child.id}: ${child.label}`;
              break;
            }
          }
        }
        break;
      }
    }
  }

  md += `## Slide ${order}: \`${filename.replace(/\.md$/, '')}\`\n`;
  if (secLabel) {
    md += `- **Sección narrativa**: ${secLabel}${subSecLabel ? ` -> ${subSecLabel}` : ''}\n`;
  }
  md += `- **Template**: \`${slide.data.template || 'N/A'}\` | **Recipe**: \`${slide.data.recipe || 'N/A'}\` | **Variant**: \`${slide.data.variant || 'N/A'}\` | **Label**: \`${slide.data.label || 'N/A'}\`\n\n`;

  // Fields
  if (slide.data.fields && Object.keys(slide.data.fields).length > 0) {
    md += `### Campos/Textos:\n`;
    for (const [key, val] of Object.entries(slide.data.fields)) {
      if (val && typeof val === 'object' && 'content' in val) {
        md += `- **${key}**: ${val.content || '*(vacío)*'}\n`;
      } else {
        md += `- **${key}**: ${val || '*(vacío)*'}\n`;
      }
    }
    md += `\n`;
  }

  // List Items
  if (slide.data.items && slide.data.items.length > 0) {
    md += `### Items de Lista:\n`;
    slide.data.items.forEach((item, index) => {
      md += `${index + 1}. ${item.text || '*(vacío)*'}\n`;
    });
    md += `\n`;
  }

  // Items Markdown (from markdown list support)
  if (slide.data.itemsMarkdown) {
    md += `### Items en Markdown:\n\`\`\`markdown\n${slide.data.itemsMarkdown.trim()}\n\`\`\`\n\n`;
  }

  // Body content if any
  if (slide.body && slide.body.trim()) {
    md += `### Contenido Adicional (Body):\n${slide.body.trim()}\n\n`;
  }

  // Notes
  md += `### Notas del Orador:\n`;
  if (slide.data.notes && slide.data.notes.trim()) {
    md += `> ${slide.data.notes.trim().replace(/\n/g, '\n> ')}\n\n`;
  } else {
    md += `*(Sin notas)*\n\n`;
  }

  md += `---\n\n`;
});

fs.writeFileSync(outputFilePath, md, 'utf8');
console.log(`Successfully consolidated slides to ${outputFilePath}`);
