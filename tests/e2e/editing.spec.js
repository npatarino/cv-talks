/**
 * E2E de edición del editor. Corren contra un deck de fixture temporal
 * (tests/e2e/start-server.mjs), así que pueden guardar, borrar y reordenar.
 * Cada test crea sus propias slides por API con etiquetas únicas.
 */
import { test, expect } from '@playwright/test';

const DECK = 'e2e-deck';
let counter = 0;
const uniq = (prefix) => `${prefix} ${Date.now().toString(36)}${counter++}`;

const api = {
  async add(request, opts) {
    const r = await request.post(`/api/decks/${DECK}/slides`, { data: opts });
    expect(r.ok()).toBe(true);
    return r.json();
  },
  async list(request) {
    return (await request.get(`/api/decks/${DECK}/slides`)).json();
  },
  async get(request, filename) {
    return (await request.get(`/api/decks/${DECK}/slides/${filename}`)).json();
  },
};

// Cada test parte del fixture: borramos lo que haya creado (por API o por la UI).
test.afterEach(async ({ request }) => {
  for (const s of await api.list(request)) {
    if (!s.label.startsWith('E2E ')) await request.delete(`/api/decks/${DECK}/slides/${s.filename}`);
  }
});

async function openDeck(page, hash = '') {
  await page.goto('/' + hash);
  await page.waitForFunction(() => document.querySelectorAll('#deck-selector option[value="e2e-deck"]').length > 0);
  if (!hash) await page.locator('#deck-selector').selectOption(DECK);
  await expect(page.locator('#slide-list .slide-item').first()).toBeVisible();
}

const item = (page, label) => page.locator('#slide-list .slide-item', { hasText: label });
const select = async (page, label) => { await item(page, label).click(); await expect(page.locator('[data-field="label"]')).toHaveValue(label); };
const livePreview = (page, on) => page.locator('#toggle-live-preview').setChecked(on);

// ─── guardar ──────────────────────────────────────────────────────────────────

test('editing the label and clicking Save persists it', async ({ page, request }) => {
  const label = uniq('Label');
  const { filename } = await api.add(request, { template: 'big-concept', label });
  await openDeck(page);
  await livePreview(page, false);
  await select(page, label);

  await page.locator('[data-field="label"]').fill(label + ' edited');
  await expect(page.locator('#save-status')).toHaveText('Unsaved changes');
  await expect(item(page, label).locator('.badge-dirty')).toBeVisible();
  expect((await api.get(request, filename)).data.label).toBe(label);   // aún no está en disco

  await page.locator('#btn-save').click();
  await expect(page.locator('#btn-save')).toBeDisabled();
  expect((await api.get(request, filename)).data.label).toBe(label + ' edited');
  await expect(item(page, label + ' edited')).toBeVisible();
  await expect(item(page, label + ' edited').locator('.badge-dirty')).toHaveCount(0);
});

test('Ctrl+S saves', async ({ page, request }) => {
  const label = uniq('CtrlS');
  const { filename } = await api.add(request, { template: 'big-concept', label });
  await openDeck(page);
  await livePreview(page, false);
  await select(page, label);
  await page.locator('[data-field="label"]').fill(label + '!');
  await page.keyboard.press('Control+s');
  await expect.poll(async () => (await api.get(request, filename)).data.label).toBe(label + '!');
});

test('live preview writes to disk without saving', async ({ page, request }) => {
  const label = uniq('Live');
  const { filename } = await api.add(request, { template: 'big-concept', label });
  await openDeck(page);
  await livePreview(page, true);
  await select(page, label);
  await page.locator('[data-field="label"]').fill(label + ' live');
  await expect.poll(async () => (await api.get(request, filename)).data.label).toBe(label + ' live');
  await expect(page.locator('#btn-save')).toBeEnabled();   // sigue pendiente de Save
});

test('speaker notes are saved with the slide', async ({ page, request }) => {
  const label = uniq('Notes');
  const { filename } = await api.add(request, { template: 'big-concept', label, notes: 'nota inicial' });
  await openDeck(page);
  await livePreview(page, false);
  await select(page, label);
  await expect(page.locator('#notes-textarea')).toHaveValue('nota inicial');

  await page.locator('#notes-textarea').fill('nueva nota\nsegunda línea');
  await page.locator('#btn-save').click();
  await expect.poll(async () => (await api.get(request, filename)).data.notes).toContain('segunda línea');
});

test('a rich-text field edit is saved into fields.<name>.content', async ({ page, request }) => {
  const label = uniq('Rich');
  const { filename } = await api.add(request, { template: 'big-concept', label });
  await openDeck(page);
  await livePreview(page, false);
  await select(page, label);

  const title = page.locator('.rte-editor[data-field="fields.title"]');
  await title.click();
  await page.keyboard.type('Hola mundo');
  await page.locator('#btn-save').click();
  await expect.poll(async () => (await api.get(request, filename)).data.fields.title.content).toContain('Hola mundo');
});

test('big-list markdown items are saved as itemsMarkdown', async ({ page, request }) => {
  const label = uniq('List');
  const { filename } = await api.add(request, { template: 'big-list', variant: 'bullets', label });
  await openDeck(page);
  await livePreview(page, false);
  await select(page, label);

  await page.locator('[data-field="itemsMarkdown"]').fill('* uno\n* dos\n* tres');
  await page.locator('#btn-save').click();
  await expect.poll(async () => (await api.get(request, filename)).data.itemsMarkdown).toBe('* uno\n* dos\n* tres\n');   // el bloque YAML | termina en salto de línea
});

test('an items editor row can be added, edited and saved', async ({ page, request }) => {
  const label = uniq('Items');
  const { filename } = await api.add(request, { template: 'three-ideas', label });
  const before = (await api.get(request, filename)).data.items?.length ?? 0;
  await openDeck(page);
  await livePreview(page, false);
  await select(page, label);

  await expect(page.locator('.item-row')).toHaveCount(before);
  await page.locator('.btn-add-item').click();
  await expect(page.locator('.item-row')).toHaveCount(before + 1);
  await page.locator('.item-row').last().locator('textarea').first().fill('item nuevo');
  await page.locator('#btn-save').click();
  await expect.poll(async () => (await api.get(request, filename)).data.items.length).toBe(before + 1);
  const saved = (await api.get(request, filename)).data.items.at(-1);
  expect(Object.values(saved)).toContain('item nuevo');
});

test('changing the template reshapes the form and saves the new template', async ({ page, request }) => {
  const label = uniq('Reshape');
  const { filename } = await api.add(request, { template: 'big-concept', label });
  await openDeck(page);
  await livePreview(page, false);
  await select(page, label);
  await expect(page.locator('[data-field="fields.stat_number"]')).toHaveCount(0);

  await page.locator('select[data-field="template"]').selectOption('big-stat');
  await expect(page.locator('[data-field="fields.stat_number"]')).toHaveCount(1);
  await page.locator('#btn-save').click();
  await expect.poll(async () => (await api.get(request, filename)).data.template).toBe('big-stat');
  expect((await api.get(request, filename)).data.fields.stat_number).toBeDefined();
});

// ─── añadir, duplicar, borrar ─────────────────────────────────────────────────

test('adding a slide from the gallery inserts it after the selected one', async ({ page, request }) => {
  const label = uniq('Anchor');
  await api.add(request, { template: 'big-concept', label });
  const added = uniq('Added');
  await openDeck(page);
  await select(page, label);
  const before = (await api.list(request)).length;

  await page.locator('#btn-add-slide').click();
  await page.locator('#gallery-grid .tmpl-card').first().click();
  await page.locator('#new-label').fill(added);
  await page.locator('#btn-add-confirm').click();

  await expect(item(page, added)).toBeVisible();
  const slides = await api.list(request);
  expect(slides).toHaveLength(before + 1);
  const i = slides.findIndex(s => s.label === label);
  expect(slides[i + 1].label).toBe(added);
  await expect(page.locator('[data-field="label"]')).toHaveValue(added);   // queda seleccionada
});

test('duplicating from the context menu copies the slide next to it', async ({ page, request }) => {
  const label = uniq('Dup');
  await api.add(request, { template: 'big-concept', label, notes: 'copia mis notas' });
  await openDeck(page);
  await select(page, label);   // deja la lista ya desplazada antes de abrir el menú
  const before = (await api.list(request)).length;

  await item(page, label).click({ button: 'right' });
  await page.locator('.context-menu-item', { hasText: 'Duplicate' }).click();

  await expect.poll(async () => (await api.list(request)).length).toBe(before + 1);
  const slides = await api.list(request);
  const i = slides.findIndex(s => s.label === label);
  expect(slides[i + 1].label).toBe(label);
  expect((await api.get(request, slides[i + 1].filename)).data.notes).toBe('copia mis notas');
});

test('deleting a slide asks for confirmation and removes it', async ({ page, request }) => {
  const label = uniq('Del');
  await api.add(request, { template: 'big-concept', label });
  await openDeck(page);
  await select(page, label);
  const before = (await api.list(request)).length;

  await page.locator('#btn-delete-slide').click();
  await expect(page.locator('#confirm-message')).toContainText(label);
  await page.locator('#btn-confirm-ok').click();

  await expect(item(page, label)).toHaveCount(0);
  expect(await api.list(request)).toHaveLength(before - 1);
});

// ─── orden ────────────────────────────────────────────────────────────────────

test('move up / down buttons reorder the deck', async ({ page, request }) => {
  const a = uniq('MoveA'), b = uniq('MoveB');
  await api.add(request, { template: 'big-concept', label: a });
  await api.add(request, { template: 'big-concept', label: b });
  await openDeck(page);
  await select(page, b);

  await page.locator('#btn-move-up').click();
  await expect.poll(async () => {
    const labels = (await api.list(request)).map(s => s.label);
    return labels.indexOf(b) < labels.indexOf(a);
  }).toBe(true);

  await page.locator('#btn-move-down').click();
  await expect.poll(async () => {
    const labels = (await api.list(request)).map(s => s.label);
    return labels.indexOf(b) > labels.indexOf(a);
  }).toBe(true);
});

test('dragging a slide onto another reorders the deck', async ({ page, request }) => {
  const a = uniq('DragA'), b = uniq('DragB');
  await api.add(request, { template: 'big-concept', label: a });
  await api.add(request, { template: 'big-concept', label: b });
  await openDeck(page);

  await item(page, b).dragTo(item(page, a));
  await expect.poll(async () => {
    const labels = (await api.list(request)).map(s => s.label);
    return labels.indexOf(b) < labels.indexOf(a);
  }).toBe(true);
});

// ─── navegación y vistas ──────────────────────────────────────────────────────

test('arrow keys move the slide selection', async ({ page, request }) => {
  const a = uniq('ArrowA'), b = uniq('ArrowB');
  await api.add(request, { template: 'big-concept', label: a });
  await api.add(request, { template: 'big-concept', label: b });
  await openDeck(page);
  await select(page, a);
  await page.locator('body').click({ position: { x: 5, y: 5 } });

  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[data-field="label"]')).toHaveValue(b);
  await page.keyboard.press('ArrowUp');
  await expect(page.locator('[data-field="label"]')).toHaveValue(a);
});

test('the URL hash restores deck and slide', async ({ page }) => {
  await openDeck(page, '#/e2e-deck/2');
  await expect(page.locator('#deck-selector')).toHaveValue(DECK);
  await expect(page.locator('#slide-list .slide-item.selected .slide-order')).toHaveText('2');
});

test('the MD button shows the raw markdown of the slide', async ({ page, request }) => {
  const label = uniq('Raw');
  await api.add(request, { template: 'big-concept', label });
  await openDeck(page);
  await select(page, label);

  await page.locator('#btn-view-md').click();
  await expect(page.locator('.md-viewer-pre')).toContainText(`label: ${label}`);
  await page.keyboard.press('Escape');
  await expect(page.locator('.md-viewer')).toHaveCount(0);
});

test('no JS errors while editing', async ({ page, request }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const label = uniq('Errors');
  await api.add(request, { template: 'big-concept', label });
  await openDeck(page);
  await select(page, label);
  await page.locator('[data-field="label"]').fill(label + 'x');
  await page.locator('#btn-save').click();
  await expect(page.locator('#btn-save')).toBeDisabled();
  expect(errors).toEqual([]);
});
