// Status cartouche (SPEC §3.5, §4, §4.2, §4.3, A24-A26), run at 375 / 768 / 1280 on the FICTIONAL
// dataset in tests/fixtures/e2e (built by global-setup): birth 19 May 1880, two ranks, two duties
// that overlap in 1901. Nothing here is a historical claim.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';

const GENERATED = join(import.meta.dirname, '..', 'fixtures', '.generated');
const SHOTS = 'tests/e2e/__screenshots__/actual';
const shot = (page: Page, info: TestInfo, name: string) =>
  page.screenshot({ path: `${SHOTS}/${info.project.name}-${name}.png` });

const isMobile = (info: TestInfo) => info.project.name === 'mobil-375';

async function open(page: Page, step: string) {
  await page.route('**/data/**', (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\//, '');
    return route.fulfill({
      contentType: 'application/json',
      body: readFileSync(join(GENERATED, path)),
    });
  });
  await page.goto(`/#adim=${step}`);
  await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
}

const status = (page: Page) => page.getByRole('region', { name: 'Durum' });
const toggle = (page: Page) => status(page).getByRole('button');
const terms = (page: Page) => status(page).locator('dt');

/** The value cells that follow a label, up to the next label. */
async function valuesOf(page: Page, label: string): Promise<string[]> {
  return status(page)
    .locator('dl')
    .evaluate((dl, wanted) => {
      const out: string[] = [];
      let inside = false;
      // Pairs may be grouped in divs (a dl allows it), so walk dt/dd in document order.
      for (const el of Array.from(dl.querySelectorAll('dt, dd'))) {
        if (el.tagName === 'DT') inside = el.textContent === wanted;
        else if (inside) out.push((el.textContent ?? '').trim());
      }
      return out;
    }, label);
}

async function showPanel(page: Page, info: TestInfo) {
  if (isMobile(info)) await toggle(page).click();
  await expect(status(page).locator('dl')).toBeVisible();
}

const overlaps = (a: { x: number; y: number; width: number; height: number }, b: typeof a) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

async function box(locator: Locator) {
  const b = await locator.boundingBox();
  expect(b).not.toBeNull();
  return b!;
}

test('shows age, rank, every duty in start order and the place', async ({ page }, info) => {
  await open(page, 'kurgu-telgraf'); // 3 March 1901
  await showPanel(page, info);
  await expect(terms(page)).toHaveText(['Yaş', 'Rütbe', 'Görev', 'Yer']);
  expect(await valuesOf(page, 'Yaş')).toEqual(['20']);
  expect(await valuesOf(page, 'Rütbe')).toEqual(['Kurgu İkinci Rütbe']);
  expect(await valuesOf(page, 'Görev')).toEqual([
    'Kurgu Vilayeti Birinci Kurgu Kıtaatı Kumandanlığı ve Uzun Unvan Denemesi',
    'Kurgu İkinci Görev',
  ]);
  expect(await valuesOf(page, 'Yer')).toEqual(['Kurgu C']);
  await expect(status(page).getByText('yaklaşık')).toHaveCount(0);
  await shot(page, info, 'durum-dolu');
});

test('a field without data is left out', async ({ page }, info) => {
  await open(page, 'kurgu-olay-2'); // 2 February 1902: no duty in force
  await showPanel(page, info);
  await expect(terms(page)).toHaveText(['Yaş', 'Rütbe', 'Yer']);
});

test('credits sit bottom right; Kaynakça opens them and Esc closes (2026-11-17)', async ({
  page,
}) => {
  await open(page, 'kurgu-telgraf');
  const viewport = page.viewportSize()!;
  const button = page.getByRole('button', { name: 'Kaynakça', exact: true });
  const b = await box(button);
  expect(b.x).toBeGreaterThan(viewport.width / 2);
  expect(b.y).toBeGreaterThan(viewport.height / 2);
  const credits = page.getByText(/^Altlık: Natural Earth/);
  await expect(credits).toBeHidden();
  await button.click();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(credits).toBeVisible();
  expect(overlaps(await box(credits), await box(status(page)))).toBe(false);
  await page.keyboard.press('Escape');
  await expect(credits).toBeHidden();
  await expect(button).toBeFocused();
});

test.describe('375: toggle', () => {
  test('shows the age, is a 44 px target, opens and closes', async ({ page }, info) => {
    test.skip(!isMobile(info));
    await open(page, 'kurgu-telgraf');
    const button = toggle(page);
    await expect(button).toHaveAccessibleName(/Durum:\s*20 yaşında/);
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(status(page).locator('dl')).toBeHidden();
    const b = await box(button);
    expect(b.width).toBeGreaterThanOrEqual(44);
    expect(b.height).toBeGreaterThanOrEqual(44);
    await shot(page, info, 'durum-kapali');

    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(status(page).locator('dl')).toBeVisible();
    await shot(page, info, 'durum-acik');

    await page.keyboard.press('Escape');
    await expect(status(page).locator('dl')).toBeHidden();
    await expect(button).toBeFocused();

    await button.click();
    await page.mouse.click(180, 400); // the map, outside the cartouche
    await expect(status(page).locator('dl')).toBeHidden();
  });

  test('closed, it leaves the map at least 55 % of the height', async ({ page }, info) => {
    test.skip(!isMobile(info));
    await open(page, 'kurgu-telgraf');
    const viewport = page.viewportSize()!;
    const button = await box(toggle(page));
    const dock = await box(page.locator('[class*="dock"]').first());
    expect((dock.y - (button.y + button.height)) / viewport.height).toBeGreaterThanOrEqual(0.55);
  });
});

test('768 and 1280: the cartouche is always open, no toggle', async ({ page }, info) => {
  test.skip(isMobile(info));
  await open(page, 'kurgu-telgraf');
  await expect(toggle(page)).toBeHidden();
  await expect(status(page).locator('dl')).toBeVisible();
  const b = await box(status(page).locator('dl'));
  // SPEC §4.3 (A41, 2026-11-17): 14rem at 768, 15rem at 1280.
  expect(b.width).toBe(info.project.name === 'tablet-768' ? 14 * 16 : 15 * 16);
});

type AxePage = ConstructorParameters<typeof AxeBuilder>[0]['page'];

test('no accessibility violations with the panel shown (axe)', async ({ page }, info) => {
  await open(page, 'kurgu-telgraf');
  await showPanel(page, info);
  const results = await new AxeBuilder({ page: page as unknown as AxePage }).analyze();
  expect(results.violations).toEqual([]);
});
