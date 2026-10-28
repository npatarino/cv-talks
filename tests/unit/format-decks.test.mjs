import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { TALKS_ROOT } from '../../editor/config.mjs';

let root;
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'format-decks-'));
  fs.mkdirSync(path.join(root, 'd', 'slides'), { recursive: true });
  fs.writeFileSync(path.join(root, 'd', 'deck.config.json'), JSON.stringify({ slides: ['ok.md', 'broken.md', 'canonical.md'] }));
});
afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

const slide = (name, text) => fs.writeFileSync(path.join(root, 'd', 'slides', name), text);
const read = (name) => fs.readFileSync(path.join(root, 'd', 'slides', name), 'utf8');
const run = (...args) => spawnSync(process.execPath, [path.join(TALKS_ROOT, 'scripts/format-decks.mjs'), ...args], {
  env: { ...process.env, TALKS_DECKS_DIR: root }, encoding: 'utf8',
});

const NON_CANONICAL = "---\ntemplate: cover\nlabel: 'Hola'\nnotes: |\n  una\n  dos\n---\n";

describe('scripts/format-decks', () => {
  it('reescribe una slide no canónica sin cambiar su contenido y deja las canónicas', () => {
    slide('ok.md', NON_CANONICAL);
    const r = run();
    expect(r.status).toBe(0);
    expect(read('ok.md')).not.toBe(NON_CANONICAL);
    const again = run('--check');
    expect(again.status).toBe(0);
    const canonical = read('ok.md');
    run();
    expect(read('ok.md')).toBe(canonical);   // idempotente
  });

  it('--check sale con 1 y no escribe', () => {
    slide('ok.md', NON_CANONICAL);
    const r = run('--check');
    expect(r.status).toBe(1);
    expect(r.stdout).toContain('needs formatting');
    expect(read('ok.md')).toBe(NON_CANONICAL);
  });

  it('un fichero sin `---` de cierre no se reescribe y falla con un mensaje claro', () => {
    const broken = "---\ntemplate: big-concept\nlabel: Sin cierre\nnotes: |\n  texto\n";
    slide('broken.md', broken);
    slide('ok.md', NON_CANONICAL);
    const r = run();
    expect(read('broken.md')).toBe(broken);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('broken.md');
    expect(r.stderr).toContain('no frontmatter block');
    expect(read('ok.md')).not.toBe(NON_CANONICAL);   // el resto sí se formatea
  });

  it('ignora documentos que no son slides del deck', () => {
    slide('ok.md', NON_CANONICAL);
    fs.writeFileSync(path.join(root, 'd', 'notas.md'), '# Solo notas\n');
    const r = run();
    expect(r.status).toBe(0);
    expect(fs.readFileSync(path.join(root, 'd', 'notas.md'), 'utf8')).toBe('# Solo notas\n');
  });
});
