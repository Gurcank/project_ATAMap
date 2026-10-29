// Journey, dispatch and border behaviour (SPEC §5.2 M1-M5, §10 steps 2, 4, 9b), run on the
// FICTIONAL dataset in tests/fixtures/e2e (built by global-setup). The real data has no journeys,
// borders or telegrams yet; these tests keep the machinery honest until it does.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';

const GENERATED = join(import.meta.dirname, '..', 'fixtures', '.generated');
const SHOTS = 'tests/e2e/__screenshots__/actual';
const shot = (page: Page, info: TestInfo, name: string) =>
  page.screenshot({ path: `${SHOTS}/${info.project.name}-${name}.png` });

/** Serve the fictional data in place of the real data; the base map stays real. */
async function useFixture(page: Page) {
  await page.route('**/data/**', (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\//, '');
    return route.fulfill({
      contentType: 'application/json',
      body: readFileSync(join(GENERATED, path)),
    });
  });
  await page.route('**/geo/borders/*.topojson', (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\//, '');
    return route.fulfill({
      contentType: 'application/json',
      body: readFileSync(join(GENERATED, path)),
    });
  });
}

async function open(page: Page, step: string) {
  await useFixture(page);
  await page.goto(`/#adim=${step}`);
  await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
}

/** The camera and every route/dispatch animation are done. */
async function settled(page: Page) {
  const transform = () => page.locator('svg g').first().getAttribute('transform');
  let last = await transform();
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(150);
    const now = await transform();
    if (now === last && now !== null) break;
    last = now;
  }
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));
  await page.waitForTimeout(100);
}

test('seyahat mode is available and steps only between journey events', async ({ page }) => {
  await open(page, 'kurgu-olay-1');
  const mode = page.getByLabel('Adım birimi');
  await expect(mode.locator('option[value="seyahat"]')).not.toHaveAttribute('disabled', '');
  await mode.selectOption('seyahat');
  // Nothing before the journey: the first journey step is taken, never one that is earlier.
  await expect(page.getByRole('heading', { level: 2 })).toHaveText('Kurgu yolculuk başladı');
  await expect(page.getByRole('button', { name: 'Önceki' })).toBeDisabled();
  await page.getByRole('button', { name: 'Sonraki' }).click();
  await expect(page.getByRole('heading', { level: 2 })).toHaveText('Kurgu yolculuk sürdü');
  await expect(page.getByRole('button', { name: 'Sonraki' })).toBeDisabled();
});

test('journey step: whole route is drawn, vehicle ends on it, undocumented leg is labelled', async ({
  page,
}, info) => {
  await open(page, 'kurgu-yol-1');
  await settled(page);
  // Two legs, each a masked path.
  await expect(page.locator('svg path[mask]')).toHaveCount(2);
  await expect(page.getByText('yaklaşık rota')).toHaveCount(1); // only the great-circle leg
  // The vehicle shown at the end is the last leg's (a horse), standing on the end of its route.
  const stands = await page.evaluate(() => {
    const routes = [...document.querySelectorAll<SVGPathElement>('svg path[mask]')];
    const glyphs = [...document.querySelectorAll<SVGGElement>('svg g[visibility]')];
    const last = routes.at(-1)!;
    const end = last.getPointAtLength(last.getTotalLength());
    const visible = glyphs.filter((g) => g.getAttribute('visibility') === 'visible');
    const m = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(visible[0]?.getAttribute('transform') ?? '');
    return {
      visible: visible.length,
      title: visible[0]?.querySelector('title')?.textContent,
      dx: m ? Math.abs(Number(m[1]) - end.x) : 999,
      dy: m ? Math.abs(Number(m[2]) - end.y) : 999,
    };
  });
  expect(stands.visible).toBe(1);
  expect(stands.title).toBe('At');
  expect(stands.dx).toBeLessThan(3);
  expect(stands.dy).toBeLessThan(3);
  await shot(page, info, 'seyahat');
});

test('reduced motion: route complete at once, no route animation running', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, 'kurgu-yol-1');
  await expect(page.locator('svg path[mask]')).toHaveCount(2);
  const running = await page.evaluate(
    () =>
      document.getAnimations().filter((a) => {
        const target = (a as CSSAnimation & { effect: KeyframeEffect | null }).effect?.target;
        return target instanceof SVGPathElement && target.getAttribute('pathLength') === '1';
      }).length,
  );
  expect(running).toBe(0);
  await expect(page.locator('svg g[visibility="visible"]')).toHaveCount(1);
});

test('telegram: dispatch line, Courier A4 sheet with the verbatim text', async ({ page }, info) => {
  await open(page, 'kurgu-telgraf');
  await settled(page);
  await expect(page.locator('[data-dispatch="telgraf"]')).toHaveCount(1);
  await page.getByRole('button', { name: /^Telgraf:/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('KURGU TELGRAF METNİ BİRİNCİ SATIR')).toBeVisible();
  const family = await dialog.evaluate((el) => getComputedStyle(el).fontFamily);
  expect(family).toContain('Courier');
  await shot(page, info, 'telgraf');
});

test('letter with an Arabic-script original: envelope dispatch, hollow marker, citation card', async ({
  page,
}) => {
  await open(page, 'kurgu-mektup');
  await settled(page);
  await expect(page.locator('[data-dispatch="mektup"]')).toHaveCount(1);
  const marker = page.getByRole('button', { name: /^Mektup:/ });
  await expect(marker).toHaveAttribute('aria-label', /tam metin gösterilmiyor/);
  await marker.click();
  await expect(
    page.getByRole('dialog').getByText('Aslı Arap harfli; tam metin gösterilmiyor.'),
  ).toBeVisible();
});

test('borders change with the step date, forwards and backwards (M5)', async ({ page }, info) => {
  await open(page, 'kurgu-yol-2'); // 1900-05-05: before every border change
  await settled(page);
  await expect(page.locator('[data-border-id]')).toHaveCount(0);

  await page.getByRole('button', { name: 'Sonraki' }).click(); // 1901-03-03
  await expect(page.locator('[data-border-id="kurgu-sinir-1"]')).toHaveCount(1);
  await settled(page);
  await shot(page, info, 'sinir-1');

  await page.getByRole('button', { name: 'Sonraki' }).click(); // 1901-06-06: unchanged
  await expect(page.locator('[data-border-id="kurgu-sinir-1"]')).toHaveCount(1);

  await page.getByRole('button', { name: 'Sonraki' }).click(); // 1902-02-02: second change
  await expect(page.locator('[data-border-id="kurgu-sinir-2"]')).toHaveCount(1);
  // The first line fades out and is removed once its animation ends.
  await expect(page.locator('[data-border-id="kurgu-sinir-1"]')).toHaveCount(0, { timeout: 3000 });
  // The second border is approximate, so it is hatched.
  await expect(page.locator('[data-border-id="kurgu-sinir-2"]')).toHaveClass(/hatched/);
  await settled(page);
  await shot(page, info, 'sinir-2');

  await page.getByRole('button', { name: 'Önceki' }).click(); // back to 1901-06-06
  await expect(page.locator('[data-border-id="kurgu-sinir-1"]')).toHaveCount(1);
  await expect(page.locator('[data-border-id="kurgu-sinir-2"]')).toHaveCount(0, { timeout: 3000 });
});

test('no accessibility violations on a journey step (axe)', async ({ page }) => {
  await open(page, 'kurgu-yol-1');
  await settled(page);
  type AxePage = ConstructorParameters<typeof AxeBuilder>[0]['page'];
  const results = await new AxeBuilder({ page: page as unknown as AxePage }).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});
