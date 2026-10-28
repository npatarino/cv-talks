/**
 * E2E de la precarga offline en un Chromium real.
 *
 * Corren contra el sitio construido por Eleventy (tests/e2e/site-server.mjs), que
 * se puede apagar de verdad (conexión rechazada, como un corte de red) a través
 * de un puerto de control. Es la prueba de que, una vez guardado el deck, la
 * charla sigue funcionando sin red: slides, recarga del player y página de
 * respaldo.
 */
import { test, expect } from '@playwright/test';

const SITE_PORT = Number(process.env.E2E_SITE_PORT) || 3201;
const SITE = `http://localhost:${SITE_PORT}`;
const CONTROL = `http://localhost:${SITE_PORT + 1}`;
const DECK = 'cuando-el-ego-se-disfraza-de-logica';
const PLAYER = `${SITE}/talks/decks/${DECK}/deck/?view=presentation`;

test.setTimeout(120_000);

const network = (request) => ({
  down: () => request.get(`${CONTROL}/down`),
  up: () => request.get(`${CONTROL}/up`),
  deploy: () => request.get(`${CONTROL}/bump`),   // simula publicar una versión nueva
});

// Pase lo que pase, el siguiente test (y la siguiente ejecución) empieza con red.
test.afterEach(async ({ request }) => { await network(request).up(); });

/** Abre el player con la precarga activada y espera a que el deck esté guardado. */
async function openAndWarm(page, query = '&offline=1') {
  await page.goto(PLAYER + query);
  await expect(page.locator('#deck-offline')).toHaveText('offline ✓', { timeout: 90_000 });
}

/** ¿Responde el servidor? Va con la cabecera de sondeo, que el worker deja pasar a la red. */
const serverReachable = (page) => page.evaluate(() =>
  fetch('/talks/offline/', { cache: 'no-store', headers: { 'X-Offline-Probe': '1' } }).then(() => true, () => false));

const hudText = (page) => page.locator('#deck-hud').textContent();

/** Pulsa → hasta que cambia la slide (una slide con elementos por revelar consume las primeras flechas). */
async function nextSlide(page) {
  const current = await hudText(page);
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(150);
    if ((await hudText(page)) !== current) return;
  }
  throw new Error(`la slide no avanzó desde «${current}»`);
}
const slideVisible = async (page) => {
  const frame = page.frameLocator('#deck-frame');
  await expect(frame.locator('section.slide')).toBeVisible();
  await expect(frame.locator('body.offline-page')).toHaveCount(0);
};

test('con el deck guardado, la charla funciona sin red: avanzar, saltar y recargar el player', async ({ page, request }) => {
  await openAndWarm(page);

  expect(await page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
  const total = await page.evaluate(() => window.__SLIDES__.length);
  expect(total).toBeGreaterThan(10);

  await network(request).down();
  expect(await serverReachable(page)).toBe(false);   // el corte es real

  // Avanzar slide a slide.
  const before = await hudText(page);
  for (let i = 0; i < 4; i++) {
    await nextSlide(page);
    await slideVisible(page);
  }
  expect(await hudText(page)).not.toBe(before);

  // Saltar a la última y a la primera (slides que no se vieron antes del corte).
  await page.keyboard.press('End');
  await expect.poll(() => hudText(page)).toMatch(new RegExp(`^${String(total - 1).padStart(2, '0')} / `));
  await slideVisible(page);
  await page.keyboard.press('Home');
  await expect.poll(() => hudText(page)).toMatch(/^00 \/ /);
  await slideVisible(page);

  // Recargar el player sin red: se sirve de la caché y vuelve a decir «offline ✓».
  await page.reload();
  await expect.poll(() => hudText(page)).toMatch(/^\d+ \/ \d+ · /);
  await slideVisible(page);
  await expect(page.locator('#deck-offline')).toHaveText('offline ✓', { timeout: 30_000 });
});

test('el speaker también queda guardado y abre sin red', async ({ page, request }) => {
  await openAndWarm(page);
  await network(request).down();

  await page.goto(`${SITE}/talks/decks/${DECK}/speaker/?offline=1`);
  await expect(page.locator('#spk-hud')).toHaveText(/^\d+ \/ \d+ · /);
  await expect(page.locator('#spk-offline')).toHaveText('offline ✓', { timeout: 30_000 });
  await expect(page.locator('#spk-frame-current')).toHaveAttribute('src', /present=1/);
  const frame = page.frameLocator('#spk-frame-current');
  await expect(frame.locator('section.slide')).toBeAttached();
});

test('una página que no está guardada muestra «Sin conexión» y se recupera sola al volver la red', async ({ page, request }) => {
  await openAndWarm(page);
  await network(request).down();

  const res = await page.goto(`${SITE}/talks/template-gallery/`);
  expect(res.headers()['x-offline-fallback']).toBe('1');
  await expect(page.locator('body.offline-page h1')).toContainText('Sin conexión');
  await expect(page).toHaveTitle(/Sin conexión/);

  await network(request).up();
  await expect(page.locator('body.offline-page')).toHaveCount(0, { timeout: 20_000 });
  await expect(page).not.toHaveTitle(/Sin conexión/);
  expect(page.url()).toBe(`${SITE}/talks/template-gallery/`);
});

test('un fallo de red dentro del player muestra la página de respaldo en el iframe, no el error del navegador', async ({ page, request }) => {
  await openAndWarm(page);
  await network(request).down();

  // Slide que el player pide pero que no está guardada (p. ej. se publicó después).
  await page.evaluate(() => {
    document.getElementById('deck-frame').src = '/talks/decks/cuando-el-ego-se-disfraza-de-logica/no-guardada/?present=1&embedded=1';
  });
  const frame = page.frameLocator('#deck-frame');
  await expect(frame.locator('body.offline-page h1')).toContainText('Sin conexión');
});

test('al publicar una versión nueva: se guarda en segundo plano, avisa de recargar y limpia la caché vieja', async ({ page, request }) => {
  await openAndWarm(page);
  const cacheNames = () => page.evaluate(async () => (await caches.keys()).filter((k) => k.startsWith('cv-talks-')));
  const [oldName] = await cacheNames();
  expect(oldName).toBeTruthy();

  await network(request).deploy();
  await page.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => r.update()));

  await expect(page.locator('#deck-offline')).toHaveText('offline ↻ recarga', { timeout: 30_000 });
  // La caché nueva se rellena sola y, cuando está completa, desaparece la del build anterior.
  await expect.poll(async () => {
    const names = await cacheNames();
    return names.length === 1 && names[0] !== oldName;
  }, { timeout: 60_000 }).toBe(true);

  // Con la versión nueva ya guardada, se puede perder la red y recargar.
  await network(request).down();
  await page.reload();
  await expect.poll(() => hudText(page)).toMatch(/^\d+ \/ \d+ · /);
  await slideVisible(page);
  await expect(page.locator('#deck-offline')).toHaveText('offline ✓', { timeout: 30_000 });
});

test('el mando sigue siendo cosa de la red: /api/ nunca se sirve desde la caché', async ({ page, request }) => {
  await openAndWarm(page);
  await network(request).down();
  const status = await page.evaluate(() => fetch('/api/remote?room=ABCDEFGH&token=x&v=-1').then((r) => r.status, () => 'network-error'));
  expect(status).toBe('network-error');
});

test('en local, sin ?offline=1, no se instala nada', async ({ page }) => {
  await page.goto(PLAYER);
  await expect(page.locator('#deck-hud')).toHaveText(/^\d+ \/ \d+ · /);
  await expect(page.locator('#deck-offline')).toBeHidden();
  const registrations = await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length);
  expect(registrations).toBe(0);
});

test('?offline=0 desinstala el worker y vacía la caché', async ({ page }) => {
  await openAndWarm(page);
  await page.goto(PLAYER + '&offline=0');
  await expect.poll(() => page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length)).toBe(0);
  await expect.poll(() => page.evaluate(async () => (await caches.keys()).filter((k) => k.startsWith('cv-talks-')).length)).toBe(0);
  await expect(page.locator('#deck-offline')).toBeHidden();
});
