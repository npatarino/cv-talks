import fs from 'node:fs';
import path from 'node:path';

function parseLineToObj(line) {
  const obj = {};
  const keys = ['n', 'text', 'term', 'desc', 'state'];
  for (const key of keys) {
    const re = new RegExp(`\\b${key}\\s*:\\s*(?:"((?:[^"\\\\]|\\\\.)*)"|'((?:[^'\\\\]|\\\\.)*)'|([^,{}]+))`);
    const match = line.match(re);
    if (match) {
      obj[key] = (match[1] !== undefined ? match[1] : (match[2] !== undefined ? match[2] : match[3])).trim();
    }
  }
  return Object.keys(obj).length > 0 ? obj : null;
}

function parseItemsFromLines(lines) {
  const items = [];
  let currentTop = null;

  for (const line of lines) {
    if (!line.trim()) continue;
    const indent = line.match(/^\s*/)[0].length;
    const parsed = parseLineToObj(line);
    if (!parsed) continue;

    const isSub = (indent >= 6);
    if (isSub) {
      if (currentTop) {
        if (!currentTop.sub) currentTop.sub = [];
        currentTop.sub.push(parsed);
      }
    } else {
      currentTop = parsed;
      items.push(currentTop);
    }
  }
  return items;
}

function structuredItemsToMarkdown(items, variant) {
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

function findMdFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findMdFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
}

function migrateFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fenceMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/);
  if (!fenceMatch) return;

  const frontmatterText = fenceMatch[1];
  const bodyText = content.slice(fenceMatch[0].length);

  const lines = frontmatterText.split(/\r?\n/);
  
  const hasBigList = lines.some(line => {
    const m = line.match(/^template:\s*big-list\s*$/);
    return !!m;
  });
  if (!hasBigList) return;

  const itemsStartIndex = lines.findIndex(line => line.trim().startsWith('items:'));
  if (itemsStartIndex === -1) return;

  let itemsEndIndex = itemsStartIndex + 1;
  const itemsLines = [];
  while (itemsEndIndex < lines.length) {
    const line = lines[itemsEndIndex];
    const indent = line.match(/^\s*/)[0].length;
    if (indent === 0 && line.trim() !== '' && !line.startsWith('-')) {
      break;
    }
    itemsLines.push(line);
    itemsEndIndex++;
  }

  let variant = 'default';
  for (const line of lines) {
    const m = line.match(/^variant:\s*([a-zA-Z0-9_-]+)/);
    if (m) variant = m[1];
  }

  const items = parseItemsFromLines(itemsLines);
  const markdownText = structuredItemsToMarkdown(items, variant);

  const markdownLines = markdownText.split('\n');
  const formattedMarkdownLines = ['itemsMarkdown: |'];
  for (const ml of markdownLines) {
    formattedMarkdownLines.push('  ' + ml);
  }

  const beforeItems = lines.slice(0, itemsStartIndex);
  const afterItems = lines.slice(itemsEndIndex);
  const newFrontmatterLines = [...beforeItems, ...formattedMarkdownLines, ...afterItems];

  const newFrontmatter = newFrontmatterLines.join('\n');
  const newContent = `---\n${newFrontmatter}\n---\n${bodyText}`;

  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`Successfully migrated: ${path.relative(process.cwd(), filePath)}`);
}

const rootDir = process.cwd();
const files = [
  ...findMdFiles(path.join(rootDir, 'decks')),
  ...findMdFiles(path.join(rootDir, 'templates')),
];

console.log(`Starting migration for big-list slides…`);
for (const file of files) {
  migrateFile(file);
}
console.log(`Migration complete.`);
