/**
 * E2E tests for the cv-talks Slide Editor.
 *
 * Run against the real Bun server (http://localhost:3001).
 * Uses the existing "2026-03-productividad-toxica" deck for read operations.
 */
import { test, expect } from '@playwright/test';

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Wait until the deck selector has real options (not just the placeholder). */
async function waitForDecks(page) {
  await page.waitForFunction(() => {
    const sel = document.getElementById('deck-selector');
    return sel && sel.querySelectorAll('option[value]:not([value=""])').length > 0;
  }, { timeout: 8000 });
}

/** Select the first real deck and wait for its slides to load. */
async function selectFirstDeck(page) {
  await waitForDecks(page);
  const slug = await page.evaluate(() => {
    const sel = document.getElementById('deck-selector');
    return sel.querySelector('option[value]:not([value=""])').value;
  });
  await page.locator('#deck-selector').selectOption(slug);
  // Wait for at least one slide item in the sidebar
  await page.waitForFunction(() => {
    return document.querySelectorAll('#slide-list .slide-item').length > 0;
  }, { timeout: 8000 });
}

// ─── App loading ──────────────────────────────────────────────────────────────

test('loads the editor and shows the deck selector', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#deck-selector')).toBeVisible();
  await expect(page.locator('#slide-list')).toBeVisible();
});

test('populates deck selector with available decks', async ({ page }) => {
  await page.goto('/');
  await waitForDecks(page);
  const count = await page.locator('#deck-selector option[value]:not([value=""])').count();
  expect(count).toBeGreaterThan(0);
});

// ─── Deck selection ───────────────────────────────────────────────────────────

test('selecting a deck loads its slide list', async ({ page }) => {
  await page.goto('/');
  await selectFirstDeck(page);
  const count = await page.locator('#slide-list .slide-item').count();
  expect(count).toBeGreaterThan(0);
});

test('selected deck title appears in topbar', async ({ page }) => {
  await page.goto('/');
  await selectFirstDeck(page);
  await expect(page.locator('#deck-title')).not.toHaveText('Select a deck');
});

// ─── Slide selection ──────────────────────────────────────────────────────────

test('clicking a slide shows its properties in the form panel', async ({ page }) => {
  await page.goto('/');
  await selectFirstDeck(page);

  await page.locator('#slide-list .slide-item').first().click();

  // Form panel no longer shows empty state
  await expect(page.locator('#form-body .empty-state')).not.toBeVisible();
  // Action buttons become enabled
  await expect(page.locator('#btn-delete-slide')).not.toBeDisabled();
});

// ─── Add slide modal ──────────────────────────────────────────────────────────

test('clicking + opens the Add Slide modal', async ({ page }) => {
  await page.goto('/');
  await selectFirstDeck(page);

  await page.locator('#btn-add-slide').click();
  await expect(page.locator('#modal-add')).not.toHaveAttribute('hidden');
  await expect(page.locator('#gallery-grid')).toBeVisible();
});

test('Add Slide modal closes on Cancel', async ({ page }) => {
  await page.goto('/');
  await selectFirstDeck(page);

  await page.locator('#btn-add-slide').click();
  await expect(page.locator('#modal-add')).not.toHaveAttribute('hidden');

  await page.locator('#modal-add .btn-secondary.modal-close').click();
  await expect(page.locator('#modal-add')).toHaveAttribute('hidden', '');
});

test('template gallery loads template cards in modal', async ({ page }) => {
  await page.goto('/');
  await selectFirstDeck(page);

  await page.locator('#btn-add-slide').click();

  // Gallery should populate with template cards
  await page.waitForFunction(() => {
    return document.querySelectorAll('#gallery-grid .tmpl-card').length > 5;
  }, { timeout: 8000 });

  const count = await page.locator('#gallery-grid .tmpl-card').count();
  expect(count).toBeGreaterThan(5);
});

// ─── Delete slide modal ───────────────────────────────────────────────────────

test('clicking delete opens the confirm modal', async ({ page }) => {
  await page.goto('/');
  await selectFirstDeck(page);

  await page.locator('#slide-list .slide-item').first().click();
  await page.locator('#btn-delete-slide').click();

  await expect(page.locator('#modal-confirm')).not.toHaveAttribute('hidden');
  await expect(page.locator('#confirm-message')).toBeVisible();
});

test('cancel on delete confirm closes modal without deleting', async ({ page }) => {
  await page.goto('/');
  await selectFirstDeck(page);

  const countBefore = await page.locator('#slide-list .slide-item').count();

  await page.locator('#slide-list .slide-item').first().click();
  await page.locator('#btn-delete-slide').click();
  await page.locator('#btn-confirm-cancel').click();

  await expect(page.locator('#modal-confirm')).toHaveAttribute('hidden', '');
  expect(await page.locator('#slide-list .slide-item').count()).toBe(countBefore);
});

// ─── Move slide buttons ───────────────────────────────────────────────────────

test('move up button is disabled for first slide', async ({ page }) => {
  await page.goto('/');
  await selectFirstDeck(page);

  await page.locator('#slide-list .slide-item').first().click();
  await expect(page.locator('#btn-move-up')).toBeDisabled();
});

test('move down button is disabled for last slide', async ({ page }) => {
  await page.goto('/');
  await selectFirstDeck(page);

  await page.locator('#slide-list .slide-item').last().click();
  await expect(page.locator('#btn-move-down')).toBeDisabled();
});

// ─── No JS errors ─────────────────────────────────────────────────────────────

test('page loads without JS errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  await page.goto('/');
  await waitForDecks(page);

  expect(errors).toHaveLength(0);
});
