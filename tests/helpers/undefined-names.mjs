/**
 * Detector de identificadores no declarados para código de navegador sin build.
 *
 * Análisis deliberadamente simple (ámbito plano por fichero): reúne todo lo que
 * el fichero declara (imports, funciones, variables, parámetros, catch…) y
 * marca las referencias a nombres que no están ahí ni son globales conocidos
 * del navegador. No distingue ámbitos, así que no detecta un nombre declarado
 * en otra función, pero sí el caso habitual tras trocear módulos: un import
 * olvidado.
 */

import { parse } from 'acorn';

const GLOBALS = new Set(`
Array Boolean Date Error TypeError RangeError Infinity JSON Map Math NaN Number Object Promise RegExp Set String Symbol URL
URLSearchParams WeakMap WeakSet undefined isFinite isNaN parseFloat parseInt encodeURIComponent decodeURIComponent encodeURI
decodeURI console window document navigator location history localStorage sessionStorage fetch setTimeout clearTimeout
setInterval clearInterval requestAnimationFrame cancelAnimationFrame getComputedStyle ResizeObserver MutationObserver
IntersectionObserver FileReader Blob File Image KeyboardEvent MouseEvent Event CustomEvent BroadcastChannel DOMParser
XMLSerializer QRCode performance alert confirm prompt Node Element HTMLElement TextEncoder TextDecoder atob btoa crypto
structuredClone queueMicrotask globalThis arguments Intl Reflect Proxy Uint8Array ArrayBuffer DataTransfer ClipboardItem
AbortController getSelection matchMedia Buffer process escape unescape
`.split(/\s+/).filter(Boolean));

const CHILD_KEYS = (node) => Object.keys(node).filter(k => k !== 'type' && k !== 'start' && k !== 'end' && k !== 'loc');

function patternNames(p, out) {
  if (!p) return;
  switch (p.type) {
    case 'Identifier': out.add(p.name); break;
    case 'ObjectPattern': p.properties.forEach(pr => patternNames(pr.type === 'RestElement' ? pr.argument : pr.value, out)); break;
    case 'ArrayPattern': p.elements.forEach(e => patternNames(e, out)); break;
    case 'RestElement': patternNames(p.argument, out); break;
    case 'AssignmentPattern': patternNames(p.left, out); break;
  }
}

function walk(node, parent, key, visit) {
  if (!node || typeof node.type !== 'string') return;
  visit(node, parent, key);
  for (const k of CHILD_KEYS(node)) {
    const v = node[k];
    if (Array.isArray(v)) v.forEach(c => c && typeof c.type === 'string' && walk(c, node, k, visit));
    else if (v && typeof v.type === 'string') walk(v, node, k, visit);
  }
}

/** @returns {{name: string, line: number}[]} referencias no declaradas */
export function findUndefinedNames(code, { sourceType = 'module' } = {}) {
  const ast = parse(code, { ecmaVersion: 'latest', sourceType, locations: true });
  const declared = new Set();

  walk(ast, null, null, (n) => {
    switch (n.type) {
      case 'ImportSpecifier': case 'ImportDefaultSpecifier': case 'ImportNamespaceSpecifier': declared.add(n.local.name); break;
      case 'FunctionDeclaration': case 'FunctionExpression': case 'ArrowFunctionExpression':
        if (n.id) declared.add(n.id.name);
        n.params.forEach(p => patternNames(p, declared));
        break;
      case 'ClassDeclaration': case 'ClassExpression': if (n.id) declared.add(n.id.name); break;
      case 'VariableDeclarator': patternNames(n.id, declared); break;
      case 'CatchClause': patternNames(n.param, declared); break;
    }
  });

  const missing = [];
  walk(ast, null, null, (n, parent, key) => {
    if (n.type !== 'Identifier') return;
    if (parent) {
      if (parent.type === 'MemberExpression' && key === 'property' && !parent.computed) return;
      if ((parent.type === 'Property' || parent.type === 'PropertyDefinition' || parent.type === 'MethodDefinition') && key === 'key' && !parent.computed) return;
      if ((parent.type === 'LabeledStatement' || parent.type === 'BreakStatement' || parent.type === 'ContinueStatement') && key === 'label') return;
      if (parent.type === 'ImportSpecifier' && key === 'imported') return;
      if (parent.type === 'ExportSpecifier' && key === 'exported') return;
      if (parent.type === 'MetaProperty') return;
    }
    if (!declared.has(n.name) && !GLOBALS.has(n.name)) missing.push({ name: n.name, line: n.loc.start.line });
  });
  return missing;
}
