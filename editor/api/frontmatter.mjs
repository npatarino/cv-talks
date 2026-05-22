/**
 * Parse and serialize YAML frontmatter from .md files.
 *
 * Handles the subset of YAML used in cv-talks slides:
 * - scalar strings (quoted and unquoted)
 * - numbers
 * - booleans
 * - nested objects: fields: { key: { content: "...", meta: "..." } }
 * - arrays: items: [ { text: "..." }, ... ]
 * - inline objects on one line: key: { a: "b", c: "d" }
 */

const FENCE_RE = /^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/;

/**
 * Split a .md file into { data, content }.
 * data is the raw YAML string; content is everything after the closing ---.
 */
export function splitFrontmatter(raw) {
  const match = raw.match(FENCE_RE);
  if (!match) return { yamlStr: '', content: raw };
  return {
    yamlStr: match[1],
    content: raw.slice(match[0].length),
  };
}

/**
 * Parse the YAML string into a JS object.
 * Uses a line-by-line parser tuned for the cv-talks frontmatter subset.
 */
export function parseYaml(yamlStr) {
  const lines = yamlStr.split('\n');
  return parseBlock(lines, 0, 0).value;
}

/**
 * Parse a block of YAML lines starting at `startIndex` with minimum `indent`.
 * Returns { value, nextIndex }.
 */
function parseBlock(lines, startIndex, indent) {
  const result = {};
  let i = startIndex;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trimEnd();

    // Skip empty lines
    if (trimmed.trim() === '') { i++; continue; }

    const lineIndent = trimmed.length - trimmed.trimStart().length;

    // Dedent means we've left this block
    if (lineIndent < indent) break;

    // Skip lines that are more indented than expected (handled by recursive calls)
    if (lineIndent > indent) { i++; continue; }

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) { i++; continue; }

    const key = trimmed.slice(lineIndent, colonIdx).trim();
    const rest = trimmed.slice(colonIdx + 1).trim();

    if (rest === '' || rest === '|' || rest === '>') {
      // Could be a block or nested mapping — look ahead
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        const nextIndent = nextLine.length - nextLine.trimStart().length;

        if (nextIndent > indent) {
          const nextTrimmed = nextLine.trimStart();
          if (nextTrimmed.startsWith('- ') || nextTrimmed.startsWith('-\n')) {
            // Array value
            const arr = parseArray(lines, i + 1, nextIndent);
            result[key] = arr.value;
            i = arr.nextIndex;
          } else {
            // Nested mapping
            const nested = parseBlock(lines, i + 1, nextIndent);
            result[key] = nested.value;
            i = nested.nextIndex;
          }
          continue;
        }
      }
      // Empty value
      result[key] = '';
    } else if (rest.startsWith('- ') || rest === '-') {
      // Inline array start — shouldn't happen at key: level, but handle gracefully
      result[key] = [];
    } else if (rest.startsWith('{')) {
      // Inline object: key: { a: "b", c: "d" }
      result[key] = parseInlineObject(rest);
    } else if (rest.startsWith('[')) {
      // Inline array: key: [a, b]
      result[key] = parseInlineArray(rest);
    } else {
      result[key] = parseScalar(rest);
    }

    i++;
  }

  return { value: result, nextIndex: i };
}

/**
 * Parse a YAML array block.
 */
function parseArray(lines, startIndex, indent) {
  const result = [];
  let i = startIndex;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trimEnd();
    if (trimmed.trim() === '') { i++; continue; }

    const lineIndent = trimmed.length - trimmed.trimStart().length;
    if (lineIndent < indent) break;

    const trimStart = trimmed.trimStart();
    if (!trimStart.startsWith('- ') && trimStart !== '-') {
      // Could be continuation or wrong indent
      break;
    }

    const itemContent = trimStart.slice(2).trim();

    if (itemContent.startsWith('{')) {
      result.push(parseInlineObject(itemContent));
      i++;
    } else if (itemContent === '' || itemContent === '~') {
      // Multi-line item — look ahead for nested keys
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        const nextIndent = nextLine.length - nextLine.trimStart().length;
        if (nextIndent > indent) {
          const nested = parseBlock(lines, i + 1, nextIndent);
          result.push(nested.value);
          i = nested.nextIndex;
          continue;
        }
      }
      result.push(null);
      i++;
    } else {
      // Could be "- text" (simple scalar) or "- key: val"
      if (itemContent.includes(': ') || itemContent.endsWith(':')) {
        // Treat as inline key:value for simple cases
        const obj = {};
        const cp = colonPos(itemContent);
        if (cp !== -1) {
          const k = itemContent.slice(0, cp).trim();
          const v = itemContent.slice(cp + 1).trim();
          obj[k] = parseScalar(v);
          result.push(obj);
        } else {
          result.push(parseScalar(itemContent));
        }
      } else {
        result.push(parseScalar(itemContent));
      }
      i++;
    }
  }

  return { value: result, nextIndex: i };
}

/**
 * Find the first colon that's not inside quotes or braces.
 */
function colonPos(str) {
  let depth = 0, inSingle = false, inDouble = false;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === "'" && !inDouble) inSingle = !inSingle;
    else if (c === '"' && !inSingle) inDouble = !inDouble;
    else if (!inSingle && !inDouble) {
      if (c === '{' || c === '[') depth++;
      else if (c === '}' || c === ']') depth--;
      else if (c === ':' && depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Parse an inline YAML object: { key: "val", key2: val2 }
 */
function parseInlineObject(str) {
  const s = str.trim();
  if (s === '{}') return {};
  // Strip outer braces
  const inner = s.slice(1, s.lastIndexOf('}')).trim();
  const obj = {};
  const pairs = splitInlineCommas(inner);
  for (const pair of pairs) {
    const cp = colonPos(pair);
    if (cp === -1) continue;
    const key = pair.slice(0, cp).trim();
    const val = pair.slice(cp + 1).trim();
    obj[key] = parseScalar(val);
  }
  return obj;
}

/**
 * Parse an inline YAML array: [a, b, c]
 */
function parseInlineArray(str) {
  const s = str.trim();
  if (s === '[]') return [];
  const inner = s.slice(1, s.lastIndexOf(']')).trim();
  return splitInlineCommas(inner).map(v => parseScalar(v.trim()));
}

/**
 * Split a comma-separated inline string respecting quotes and nested braces/brackets.
 */
function splitInlineCommas(str) {
  const parts = [];
  let depth = 0, inSingle = false, inDouble = false, start = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === "'" && !inDouble) inSingle = !inSingle;
    else if (c === '"' && !inSingle) inDouble = !inDouble;
    else if (!inSingle && !inDouble) {
      if (c === '{' || c === '[') depth++;
      else if (c === '}' || c === ']') depth--;
      else if (c === ',' && depth === 0) {
        parts.push(str.slice(start, i).trim());
        start = i + 1;
      }
    }
  }
  if (start < str.length) parts.push(str.slice(start).trim());
  return parts.filter(Boolean);
}

/**
 * Parse a scalar YAML value (string, number, boolean, null).
 */
function parseScalar(val) {
  if (val === '' || val === '~' || val === 'null') return null;
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (/^-?\d+$/.test(val)) return parseInt(val, 10);
  if (/^-?\d+\.\d+$/.test(val)) return parseFloat(val);

  // Single-quoted string
  if (val.startsWith("'") && val.endsWith("'")) {
    return val.slice(1, -1).replace(/''/g, "'");
  }
  // Double-quoted string
  if (val.startsWith('"') && val.endsWith('"')) {
    return val.slice(1, -1)
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }
  return val;
}

// ---------- Serialization ----------

/**
 * Serialize a JS object back to YAML frontmatter string (between --- fences).
 */
export function serializeYaml(obj) {
  return '---\n' + dumpValue(obj, 0) + '---\n';
}

function dumpValue(val, indent) {
  if (val === null || val === undefined) return 'null';
  if (typeof val === 'boolean') return String(val);
  if (typeof val === 'number') return String(val);
  if (typeof val === 'string') return quoteString(val);
  if (Array.isArray(val)) return dumpArray(val, indent);
  if (typeof val === 'object') return dumpObject(val, indent);
  return String(val);
}

function dumpObject(obj, indent) {
  const pad = '  '.repeat(indent);
  const keys = Object.keys(obj);
  if (keys.length === 0) return '{}\n';

  // For fields sub-objects: if all values are plain objects with only string/null values,
  // serialize as inline (like the source files)
  if (indent >= 1 && isShallowInlineCandidate(obj)) {
    return serializeInlineObject(obj) + '\n';
  }

  let out = '';
  for (const key of keys) {
    const v = obj[key];
    if (Array.isArray(v)) {
      out += `${pad}${key}:\n`;
      for (const item of v) {
        out += `${pad}  - ${dumpArrayItem(item, indent + 1)}\n`;
      }
    } else if (v !== null && typeof v === 'object') {
      if (isShallowInlineCandidate(v)) {
        out += `${pad}${key}: ${serializeInlineObject(v)}\n`;
      } else {
        out += `${pad}${key}:\n`;
        out += dumpValue(v, indent + 1);
      }
    } else {
      out += `${pad}${key}: ${dumpValue(v, indent)}\n`;
    }
  }
  return out;
}

function dumpArray(arr, indent) {
  const pad = '  '.repeat(indent);
  let out = '';
  for (const item of arr) {
    out += `${pad}- ${dumpArrayItem(item, indent + 1)}\n`;
  }
  return out;
}

function dumpArrayItem(item, indent) {
  if (item === null || item === undefined) return '~';
  if (typeof item !== 'object') return dumpValue(item, indent);
  // Inline if shallow
  if (isShallowInlineCandidate(item)) return serializeInlineObject(item);
  // Multi-line — first key on same line as dash, rest indented
  const keys = Object.keys(item);
  if (keys.length === 0) return '{}';
  const pad = '  '.repeat(indent);
  const [first, ...rest] = keys;
  let out = `${first}: ${dumpValue(item[first], indent)}`;
  for (const k of rest) {
    out += `\n${pad}${k}: ${dumpValue(item[k], indent)}`;
  }
  return out;
}

function isShallowInlineCandidate(obj) {
  const vals = Object.values(obj);
  return vals.every(v => v === null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean');
}

function serializeInlineObject(obj) {
  const pairs = Object.entries(obj)
    .map(([k, v]) => `${k}: ${dumpValue(v, 0)}`)
    .join(', ');
  return `{ ${pairs} }`;
}

function quoteString(str) {
  if (str === '') return '""';
  // Use double quotes if the string contains special characters
  const needsQuoting = /[:#\[\]{},|>&*!'"@`%?]|^\s|\s$/.test(str) || str.includes('\n');
  if (!needsQuoting) return str;
  // Use single quotes if no single quotes in string
  if (!str.includes("'")) return `'${str}'`;
  // Otherwise double quotes with escaping
  return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
}

/**
 * Parse a .md file string into { data, body }.
 * data is a JS object; body is the markdown content after frontmatter.
 */
export function parseMd(raw) {
  const { yamlStr, content } = splitFrontmatter(raw);
  return {
    data: parseYaml(yamlStr),
    body: content,
  };
}

/**
 * Serialize { data, body } back to a .md string.
 */
export function serializeMd(data, body = '') {
  return serializeYaml(data) + (body ? body : '');
}
