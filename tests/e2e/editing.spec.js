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
/** Arrastra una slide sobre otra con ratón real (más determinista que locator.dragTo). */
async function dragSlide(page, fromLabel, toLabel, { holdMs = 0 } = {}) {
  const from = await item(page, fromLabel).boundingBox();
  const to = await item(page, toLabel).boundingBox();
  await page.mouse.move(from.x + 40, from.y + from.height / 2);
  await page.mouse.down();
  if (holdMs) await page.waitForTimeout(holdMs);
  await page.mouse.move(from.x + 40, from.y + from.height / 2 - 6);
  await page.mouse.move(to.x + 40, to.y + to.height / 2, { steps: 8 });
  await page.mouse.up();
}
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

  await dragSlide(page, b, a);
  await expect.poll(async () => {
    const labels = (await api.list(request)).map(s => s.label);
    return labels.indexOf(b) < labels.indexOf(a);
  }).toBe(true);
});

test('a late git-status refresh does not break a drag that is about to start', async ({ page, request }) => {
  // La respuesta de /api/git-status repinta la sidebar; si llega con un arrastre en curso
  // no debe destruir el nodo arrastrado (el drop dejaría de dispararse).
  await page.route('**/api/git-status', async route => {
    await new Promise(r => setTimeout(r, 900));
    await route.continue();
  });
  const a = uniq('GitA'), b = uniq('GitB');
  await api.add(request, { template: 'big-concept', label: a });
  await api.add(request, { template: 'big-concept', label: b });
  await openDeck(page);

  await dragSlide(page, b, a, { holdMs: 1300 });         // la respuesta retrasada llega antes de que el drag empiece

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

// ─── assets: selector compartido, glyph e iconos ─────────────────────────────

const PNG_1x1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

async function uploadPng(request, name) {
  const r = await request.post(`/api/decks/${DECK}/assets`, { data: { basename: name, mimeType: 'image/png', dataBase64: PNG_1x1 } });
  expect(r.ok()).toBe(true);
  return (await r.json()).filename;
}

test('the rich-text image button inserts an existing deck asset', async ({ page, request }) => {
  const label = uniq('Img');
  const file = await uploadPng(request, uniq('pic').replace(/\s/g, '-'));
  const { filename } = await api.add(request, { template: 'big-concept', label });
  await openDeck(page);
  await livePreview(page, false);
  await select(page, label);

  const title = page.locator('.rte-wrapper', { has: page.locator('[data-field="fields.title"]') });
  await title.locator('[data-cmd="img"]').click();
  await expect(page.locator('.asset-picker')).toBeVisible();
  await expect(page.locator('.asset-picker .asset-action')).toHaveCount(3);   // Upload, Paste, Icons
  await page.locator('.asset-picker .asset-item:not(.asset-action)', { hasText: file }).click();

  await expect(page.locator('.asset-picker')).toHaveCount(0);
  await expect(page.locator('.rte-editor[data-field="fields.title"] img')).toHaveCount(1);
  await page.locator('#btn-save').click();
  await expect.poll(async () => (await api.get(request, filename)).data.fields.title.content).toContain(`assets/${file}`);
});

test('the asset picker filters by name and closes on outside click', async ({ page, request }) => {
  const label = uniq('Filter');
  const a = await uploadPng(request, uniq('alpha').replace(/\s/g, '-'));
  const b = await uploadPng(request, uniq('bravo').replace(/\s/g, '-'));
  await api.add(request, { template: 'big-concept', label });
  await openDeck(page);
  await select(page, label);

  const title = page.locator('.rte-wrapper', { has: page.locator('[data-field="fields.title"]') });
  await title.locator('[data-cmd="img"]').click();
  const items = page.locator('.asset-picker .asset-item:not(.asset-action)');
  await expect(items.filter({ hasText: a })).toHaveCount(1);
  await expect(items.filter({ hasText: b })).toHaveCount(1);

  await page.locator('.asset-picker-search').fill('alpha');
  await expect(items.filter({ hasText: a })).toHaveCount(1);
  await expect(items.filter({ hasText: b })).toHaveCount(0);

  await page.locator('#preview-label').click();   // fuera del selector
  await expect(page.locator('.asset-picker')).toHaveCount(0);
});

test('a glyph field can pick a deck asset and saves it as an <img>', async ({ page, request }) => {
  const label = uniq('Glyph');
  const file = await uploadPng(request, uniq('glyph').replace(/\s/g, '-'));
  const { filename } = await api.add(request, { template: 'icon', label });
  const items = (await api.get(request, filename)).data.items ?? [];
  test.skip(!items.length || !('glyph' in items[0]), 'el template icon no siembra items con glyph');
  await openDeck(page);
  await livePreview(page, false);
  await select(page, label);

  await page.locator('.glyph-input-wrap').first().locator('button.rte-btn').click();
  await expect(page.locator('.asset-picker')).toBeVisible();
  await expect(page.locator('.asset-picker-search')).toBeFocused();
  await page.locator('.asset-picker .asset-item:not(.asset-action)', { hasText: file }).click();

  await expect(page.locator('.glyph-text-input').first()).toHaveValue(file);
  await expect(page.locator('.glyph-preview img').first()).toHaveAttribute('src', new RegExp(`/talks/decks/${DECK}/assets/${file}$`));   // Eleventy no corre en e2e: solo comprobamos la URL
  await page.locator('#btn-save').click();
  await expect.poll(async () => (await api.get(request, filename)).data.items[0].glyph).toBe(`<img src="assets/${file}" alt="">`);
});

test('the icon browser opens from the picker and closes with Escape', async ({ page, request }) => {
  const label = uniq('Icons');
  await api.add(request, { template: 'big-concept', label });
  await openDeck(page);
  await select(page, label);

  const title = page.locator('.rte-wrapper', { has: page.locator('[data-field="fields.title"]') });
  await title.locator('[data-cmd="img"]').click();
  await page.locator('.asset-picker .asset-action', { hasText: 'Icons' }).dispatchEvent('mousedown');
  await expect(page.locator('.icon-browser-modal')).toBeVisible();
  await expect.poll(async () => page.locator('.icon-browser-item').count()).toBeGreaterThan(10);

  await page.locator('.icon-search-input').fill('zzzz-no-existe');
  await expect(page.locator('.icon-browser-container .empty-state')).toContainText('No icons found');
  await page.keyboard.press('Escape');
  await expect(page.locator('.icon-browser-modal')).toHaveCount(0);
});
