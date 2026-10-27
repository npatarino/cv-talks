/**
 * Reglas de dependencia entre capas. Si un import las rompe, el test dice cuál.
 *
 * Backend (editor/api):  lib  <-  store  <-  domain  <-  services / http
 *   · lib: puro, no importa nada del editor
 *   · store: acceso a disco; solo lib y config
 *   · domain: reglas del negocio; lib, config, store y domain
 *   · services: Playwright/FS con datos recibidos; lib, config, store y domain
 *   · http: transporte; puede usar todo lo anterior. Nadie importa http salvo server y tests.
 *
 * UI (editor/ui): app.js es la raíz; solo ella importa el controlador. Las vistas
 * hablan con el controlador por eventos, y lib/ no importa nada de la UI.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { TALKS_ROOT } from '../../editor/config.mjs';

function files(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...files(p));
    else if (/\.m?js$/.test(e.name)) out.push(p);
  }
  return out;
}
function importsOf(file) {
  const code = fs.readFileSync(file, 'utf8');
  return [...code.matchAll(/(?:from\s+|import\s*\(\s*|import\s+)['"](\.{1,2}\/[^'"]+)['"]/g)]
    .map(m => path.resolve(path.dirname(file), m[1].split('?')[0]));
}
const rel = (p) => path.relative(TALKS_ROOT, p);

// ─── backend ─────────────────────────────────────────────────────────────────
const API = path.join(TALKS_ROOT, 'editor/api');
const CONFIG = path.join(TALKS_ROOT, 'editor/config.mjs');
const layerOf = (p) => {
  if (p === CONFIG) return 'config';
  const r = path.relative(API, p);
  if (r.startsWith('..')) return 'outside';
  return r.split(path.sep)[0];
};
const ALLOWED = {
  lib: ['lib'],
  store: ['lib', 'store', 'config'],
  domain: ['lib', 'store', 'domain', 'config'],
  services: ['lib', 'store', 'domain', 'services', 'config'],
  http: ['lib', 'store', 'domain', 'services', 'http', 'config', 'outside'],   // outside: api/remote.mjs
};

describe('editor/api layers', () => {
  for (const file of files(API)) {
    const layer = layerOf(file);
    it(`${rel(file)} (${layer}) only imports allowed layers`, () => {
      expect(ALLOWED[layer], `unknown layer for ${rel(file)}`).toBeDefined();
      const bad = importsOf(file).filter(t => !ALLOWED[layer].includes(layerOf(t))).map(rel);
      expect(bad).toEqual([]);
    });
  }

  it('only server.mjs and tests import the http layer', () => {
    const users = [...files(path.join(TALKS_ROOT, 'editor')), ...files(path.join(TALKS_ROOT, 'scripts')), path.join(TALKS_ROOT, 'eleventy.config.mjs')]
      .filter(f => importsOf(f).some(t => layerOf(t) === 'http'))
      .map(rel).filter(f => !f.startsWith('editor/api/http/'));
    expect(users).toEqual(['editor/server.mjs']);
  });
});

// ─── UI ──────────────────────────────────────────────────────────────────────
const UI = path.join(TALKS_ROOT, 'editor/ui');

describe('editor/ui structure', () => {
  const uiFiles = files(UI);

  it('only app.js imports the controller', () => {
    const controller = path.join(UI, 'controller.js');
    const users = uiFiles.filter(f => importsOf(f).includes(controller)).map(rel);
    expect(users).toEqual(['editor/ui/app.js']);
  });

  it('lib/ stays pure: it imports nothing outside lib/', () => {
    for (const f of uiFiles.filter(f => f.startsWith(path.join(UI, 'lib')))) {
      const bad = importsOf(f).filter(t => !t.startsWith(path.join(UI, 'lib'))).map(rel);
      expect(bad, rel(f)).toEqual([]);
    }
  });

  it('base modules (state, dom, events, toast, api-client) do not depend on views', () => {
    for (const name of ['state.js', 'dom.js', 'events.js', 'toast.js', 'api-client.js']) {
      expect(importsOf(path.join(UI, name)).map(rel), name).toEqual([]);
    }
  });

  it('views and form/assets modules never import app.js', () => {
    const app = path.join(UI, 'app.js');
    expect(uiFiles.filter(f => importsOf(f).includes(app)).map(rel)).toEqual([]);
  });

  it('has no import cycles', () => {
    const graph = new Map(uiFiles.map(f => [f, importsOf(f).filter(t => uiFiles.includes(t))]));
    const state = new Map();   // 1 = en curso, 2 = hecho
    const cycles = [];
    const visit = (f, stack) => {
      if (state.get(f) === 2) return;
      if (state.get(f) === 1) { cycles.push([...stack.slice(stack.indexOf(f)), f].map(rel).join(' -> ')); return; }
      state.set(f, 1);
      for (const t of graph.get(f)) visit(t, [...stack, f]);
      state.set(f, 2);
    };
    for (const f of uiFiles) visit(f, []);
    expect(cycles).toEqual([]);
  });
});
