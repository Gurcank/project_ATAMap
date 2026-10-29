// Faz 4, first vertical slice (SPEC §4, §4.1, §4.2, §4.3, §5.3), run at 375 / 768 / 1280.
// The data is the real, verified set: 20 TBMM speeches 1920-1938, all at Ankara. The 1920 card has
// no full text (Arabic-script original), 1930 is a Latin-script A4 sheet.
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';

const FIRST = '/#adim=tbmm-nutuk-1920-04-24'; // citation card
const LATIN = '/#adim=tbmm-acilis-1930-11-01'; // A4 sheet

const SHOTS = 'tests/e2e/__screenshots__/actual';
const shot = (page: Page, info: TestInfo, name: string) =>
  page.screenshot({ path: `${SHOTS}/${info.project.name}-${name}.png` });

/** The camera (M8) is done when the viewport transform stops changing. */
async function settled(page: Page) {
  const transform = () => page.locator('svg g').first().getAttribute('transform');
  let last = await transform();
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(120);
    const now = await transform();
    if (now === last && now !== null && !now.endsWith('scale(1)')) return;
    last = now;
  }
}

async function open(page: Page, url: string) {
  await page.goto(url);
  await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
  await settled(page);
}

test('first step: map, year, event text, controls', async ({ page }, info) => {
  await open(page, FIRST);
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(
    'Mustafa Kemal Paşa Meclise siyasi ahvali anlattı',
  );
  await expect(page.getByText('24 Nisan 1920')).toBeVisible();
  await expect(page.getByText('1920', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Önceki' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Sonraki' })).toBeEnabled();
  await expect(page.getByText('Ankara', { exact: true })).toBeVisible();
  // No horizontal scroll at any width (SPEC §10 step 6).
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await shot(page, info, 'ilk-adim');
});

test('map keeps at least 55 % of the height at 375 (SPEC §4.3)', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobil-375');
  await open(page, FIRST);
  const dock = await page.locator('[class*="dock"]').first().boundingBox();
  const viewport = page.viewportSize();
  expect(dock && viewport && dock.y / viewport.height).toBeGreaterThanOrEqual(0.55);
});

test('next / previous buttons and the URL', async ({ page }) => {
  await open(page, FIRST);
  await page.getByRole('button', { name: 'Sonraki' }).click();
  await expect(page.getByText('1 Mart 1921')).toBeVisible();
  await expect(page).toHaveURL(/#adim=tbmm-acilis-1921-03-01/);
  await expect(page.getByRole('button', { name: 'Önceki' })).toBeEnabled();
  await page.getByRole('button', { name: 'Önceki' }).click();
  await expect(page.getByText('24 Nisan 1920')).toBeVisible();
});

test('arrow keys step, Space starts and stops autoplay', async ({ page }) => {
  await open(page, FIRST);
  await page.keyboard.press('ArrowRight');
  await expect(page.getByText('1 Mart 1921')).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByText('24 Nisan 1920')).toBeVisible();
  const auto = page.getByRole('button', { name: 'Otomatik' });
  await page.keyboard.press(' ');
  await expect(auto).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press(' ');
  await expect(auto).toHaveAttribute('aria-pressed', 'false');
});

test('the last step disables Sonraki, a manual step stops autoplay', async ({ page }) => {
  await open(page, '/#adim=tbmm-nutuk-1938-11-01');
  await expect(page.getByRole('button', { name: 'Sonraki' })).toBeDisabled();
  await page.getByRole('button', { name: 'Önceki' }).click();
  await page.getByRole('button', { name: 'Otomatik' }).click();
  await expect(page.getByRole('button', { name: 'Otomatik' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Önceki' }).click();
  await expect(page.getByRole('button', { name: 'Otomatik' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
});

test('mode selector: years skip, Seyahat is unavailable (no journeys yet)', async ({ page }) => {
  await open(page, '/#adim=tbmm-nutuk-1923-08-13');
  const mode = page.getByLabel('Adım birimi');
  // An <option> is not an actionable control, so check the attribute itself.
  await expect(mode.locator('option[value="seyahat"]')).toHaveAttribute('disabled', '');
  await mode.selectOption('yil');
  // 1923 has two events; year mode lands on the first of the year, never later than where we were.
  await expect(page.getByText('1 Mart 1923')).toBeVisible();
  await page.getByRole('button', { name: 'Sonraki' }).click();
  await expect(page.getByText('1 Mart 1924')).toBeVisible();
});

test('a Latin-script speech opens as an A4 sheet with its citation', async ({ page }, info) => {
  await open(page, LATIN);
  const marker = page.getByRole('button', { name: /^Konuşma:/ });
  await marker.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Büyük Millet Meclisinin Muhterem Âzası!')).toBeVisible();
  await expect(dialog.getByText('Stenograf notları çıkarıldı.')).toBeVisible();
  // A Gregorian printed date is not repeated next to the date line.
  await expect(dialog.getByText(/belgede:/)).toHaveCount(0);
  await expect(dialog.getByText(/Zabıt Ceridesi/)).toBeVisible();
  expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  await shot(page, info, 'a4');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(marker).toBeFocused();
});

test('desktop: hovering the marker opens the sheet, leaving closes it (SPEC §4.1)', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'masaustu-1280');
  await open(page, LATIN);
  const marker = page.getByRole('button', { name: /^Konuşma:/ });
  await marker.hover();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  // A hover opening does not take focus away from the page.
  expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(false);
  await page.mouse.move(40, 300);
  await expect(dialog).toBeHidden();
});

test('an Arabic-script original opens a citation card, not an A4 sheet', async ({ page }, info) => {
  await open(page, FIRST);
  await page.getByRole('button', { name: /^Konuşma:/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Aslı Arap harfli; tam metin gösterilmiyor.')).toBeVisible();
  await expect(dialog.getByText(/belgede: 24\.4\.1336/)).toBeVisible();
  await shot(page, info, 'kunye-karti');
  await dialog.getByRole('button', { name: 'Kapat' }).click();
  await expect(dialog).toBeHidden();
});

test('touch targets are at least 44 x 44 px (SPEC §4)', async ({ page }) => {
  await open(page, FIRST);
  const targets = [
    page.getByRole('button', { name: 'Sonraki' }),
    page.getByRole('button', { name: 'Otomatik' }),
    page.getByLabel('Adım birimi'),
  ];
  for (const t of targets) {
    const box = await t.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.width).toBeGreaterThanOrEqual(44);
  }
  const hit = await page.locator('[data-marker-id] rect').first().boundingBox();
  expect(hit?.width).toBeGreaterThanOrEqual(44);
  expect(hit?.height).toBeGreaterThanOrEqual(44);
});

test('blocked base map: fallback drawing stays and a note appears (SPEC §10 step 10)', async ({
  page,
}, info) => {
  await page.route('**/geo/**', (route) => route.abort());
  await open(page, FIRST);
  await expect(page.getByText('Harita altlığı yüklenemedi.')).toBeVisible();
  const landPath = await page.locator('svg g path').first().getAttribute('d');
  expect(landPath?.length).toBeGreaterThan(100);
  await shot(page, info, 'altlik-hatasi');
});

test('blocked data: error card with a working retry (SPEC §4.2)', async ({ page }, info) => {
  let blocked = true;
  await page.route('**/data/steps.json', (route) => (blocked ? route.abort() : route.continue()));
  await page.goto(FIRST);
  await expect(page.getByText('Kayıtlar yüklenemedi')).toBeVisible();
  await shot(page, info, 'veri-hatasi');
  blocked = false;
  await page.getByRole('button', { name: 'Yeniden dene' }).click();
  await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
});

test('reduced motion: the camera jumps, no waiting for an animation (SPEC §5.3)', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(FIRST);
  await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
  await expect
    .poll(() => page.locator('svg g').first().getAttribute('transform'), { timeout: 1500 })
    .toMatch(/scale\(2\.6/);
});

type AxePage = ConstructorParameters<typeof AxeBuilder>[0]['page'];
const axe = (page: Page) => new AxeBuilder({ page: page as unknown as AxePage }).analyze();

test('no accessibility violations (axe)', async ({ page }) => {
  await open(page, FIRST);
  const results = await axe(page);
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  await page.getByRole('button', { name: /^Konuşma:/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  // Contrast is measured on the settled sheet, not mid-animation (M7 fades it in).
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));
  const withDialog = await axe(page);
  expect(withDialog.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});
