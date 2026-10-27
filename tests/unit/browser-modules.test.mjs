/**
 * Puerta de calidad para el código que solo corre en el navegador (editor/ui y
 * theme/assets): no hay build ni tipos, así que un identificador duplicado o un
 * import mal escrito solo se vería al abrir la página. Aquí se parsea todo con
 * `node --check` (como módulo) y se comprueba que cada import relativo resuelve a un fichero y a un
 * export que existen.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { TALKS_ROOT } from '../../editor/config.mjs';
import { findUndefinedNames, findUnusedImports } from '../helpers/undefined-names.mjs';

function files(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) files(p, out);
    else if (/\.(m?js)$/.test(e.name)) out.push(p);
  }
  return out;
}

const modules = [
  ...files(path.join(TALKS_ROOT, 'editor/ui')),
  ...files(path.join(TALKS_ROOT, 'theme/assets')),
  ...files(path.join(TALKS_ROOT, 'theme/lib')),
];

const rel = (f) => path.relative(TALKS_ROOT, f);

function exportsOf(code) {
  const names = new Set();
  for (const m of code.matchAll(/^export\s+(?:async\s+)?(?:function\*?|const|let|var|class)\s+([A-Za-z_$][\w$]*)/gm)) names.add(m[1]);
  for (const m of code.matchAll(/^export\s*\{([^}]*)\}/gm)) {
    for (const part of m[1].split(',')) { const n = part.trim().split(/\s+as\s+/).pop(); if (n) names.add(n); }
  }
  return names;
}

describe('browser modules', () => {
  it('finds the modules', () => {
    expect(modules.length).toBeGreaterThan(10);
  });

  for (const file of modules) {
    describe(rel(file), () => {
      const code = fs.readFileSync(file, 'utf8');

      const classicScript = /theme\/assets\/(present|viz)\.js$/.test(file);

      it.skipIf(classicScript)('parses as an ES module (no duplicate or invalid declarations)', () => {
        // node --check solo trata el fichero como módulo si termina en .mjs
        const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'modcheck-')), 'm.mjs');
        fs.writeFileSync(tmp, code);
        const r = spawnSync(process.execPath, ['--check', tmp], { encoding: 'utf8' });
        fs.rmSync(path.dirname(tmp), { recursive: true, force: true });
        expect(r.stderr.split('\n').slice(0, 4).join('\n') + (r.status === 0 ? '' : ' [exit ' + r.status + ']')).toBe('');
        expect(r.status).toBe(0);
      });

      it('references only names it declares, imports or the browser provides', () => {
        const classic = /theme\/assets\/(present|viz)\.js$/.test(file);
        const missing = findUndefinedNames(code, { sourceType: classic ? 'script' : 'module' });
        expect(missing.map(m => `${m.name} (line ${m.line})`)).toEqual([]);
      });

      it.skipIf(classicScript)('has no unused imports', () => {
        expect(findUnusedImports(code)).toEqual([]);
      });

      it('imports only files and names that exist', () => {
        const imports = [...code.matchAll(/^import\s+(?:([\s\S]*?)\s+from\s+)?['"](\.{1,2}\/[^'"]+)['"]/gm)];
        for (const [, clause, spec] of imports) {
          const target = path.resolve(path.dirname(file), spec.split('?')[0]);
          expect(fs.existsSync(target), `${rel(file)} imports missing file ${spec}`).toBe(true);
          const m = clause && clause.match(/\{([\s\S]*)\}/);
          if (!m) continue;
          const available = exportsOf(fs.readFileSync(target, 'utf8'));
          for (const part of m[1].split(',')) {
            const name = part.trim().split(/\s+as\s+/)[0].trim();
            if (name) expect(available.has(name), `${rel(file)}: '${name}' is not exported by ${spec}`).toBe(true);
          }
        }
      });
    });
  }
});
