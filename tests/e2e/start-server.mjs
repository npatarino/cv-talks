/**
 * Arranca el editor para los e2e contra un deck de fixture temporal, de modo
 * que los tests puedan guardar, borrar y reordenar sin tocar los decks reales.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cv-talks-e2e-'));
process.env.TALKS_DECKS_DIR = root;   // lo lee editor/config.mjs al importarse

const { createDeck } = await import('../../editor/api/domain/decks.mjs');
const { createSlide } = await import('../../editor/api/slides.mjs');

createDeck('e2e-deck', { title: 'E2E Deck', author: 'Test', date: '2026-10' }, root);
createSlide('e2e-deck', { template: 'cover', label: 'E2E Cover' }, root);
createSlide('e2e-deck', { template: 'big-concept', label: 'E2E Idea', notes: 'nota inicial' }, root);
createSlide('e2e-deck', { template: 'big-list', variant: 'bullets', label: 'E2E List' }, root);
createSlide('e2e-deck', { template: 'big-stat', label: 'E2E Stat' }, root);

const cleanup = () => { fs.rmSync(root, { recursive: true, force: true }); };
process.on('exit', cleanup);
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { cleanup(); process.exit(0); });

await import('../../editor/server.mjs');
