/**
 * Arranca el editor para los e2e contra un deck de fixture temporal, de modo
 * que los tests puedan guardar, borrar y reordenar sin tocar los decks reales.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cv-talks-e2e-'));
process.env.TALKS_DECKS_DIR = root;   // lo lee editor/config.mjs al importarse

const { createDeck } = await import('../../editor/api/domain/decks.mjs');
const { createSlide } = await import('../../editor/api/domain/slides.mjs');

createDeck('e2e-deck', { title: 'E2E Deck', author: 'Test', date: '2026-10' }, root);
createSlide('e2e-deck', { template: 'cover', label: 'E2E Cover' }, root);
createSlide('e2e-deck', { template: 'big-concept', label: 'E2E Idea', notes: 'nota inicial' }, root);
createSlide('e2e-deck', { template: 'big-list', variant: 'bullets', label: 'E2E List' }, root);
createSlide('e2e-deck', { template: 'big-stat', label: 'E2E Stat' }, root);

// Estructura narrativa (secciones) y un repo git para probar sección y revert.
const { readDeckConfig, writeDeckConfig, deckDir } = await import('../../editor/api/store/deck-store.mjs');
const dir = deckDir('e2e-deck', root);
const cfg = readDeckConfig(dir);
cfg.structure = {
  type: 'ANSVA',
  sections: [
    { id: 'A1', label: 'Atención', description: 'Abre con una historia.', start: 1, end: 2 },
    { id: 'N', label: 'Necesidad', description: 'El problema.', start: 3, end: 4 },
  ],
};
writeDeckConfig(dir, cfg);
const git = (...a) => spawnSync('git', ['-c', 'user.email=e2e@test', '-c', 'user.name=e2e', ...a], { cwd: root });
git('init', '-q'); git('add', '.'); git('commit', '-q', '-m', 'fixture');

const cleanup = () => { fs.rmSync(root, { recursive: true, force: true }); };
process.on('exit', cleanup);
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { cleanup(); process.exit(0); });

await import('../../editor/server.mjs');
