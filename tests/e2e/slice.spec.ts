// Faz 4, first vertical slice (SPEC §4, §4.1, §4.2, §4.3, §5.3), run at 375 / 768 / 1280.
// The data is the real, verified set: the birth at Selanik (19 May 1881, a conventional date, A25)
// and 20 TBMM speeches 1920-1938 at Ankara. The 1920 card has no full text (Arabic-script
// original), 1930 is a Latin-script A4 sheet.
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';

const BIRTH = '/#adim=dogum-selanik'; // the first step
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

test('the first step is the birth at Selanik', async ({ page }, info) => {
  await open(page, BIRTH);
  await expect(page.getByRole('heading', { level: 2 })).toHaveText("Selanik'te doğdu");
  await expect(page.getByText('19 Mayıs 1881')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Önceki' })).toBeDisabled();
  await expect(page.locator('svg').getByText('Selanik', { exact: true })).toBeVisible();
  await shot(page, info, 'dogum');
});

test('a Gallipoli step: place on the map, age and place in the status', async ({ page }, info) => {
  await open(page, '/#adim=canakkale-1915-08-10');
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(
    "Conk Bayırı'nda hücumu bizzat yönetti",
  );
  await expect(page.getByText('10 Ağustos 1915')).toBeVisible();
  await expect(page.locator('svg').getByText('Conk Bayırı', { exact: true })).toBeVisible();
  const status = page.getByRole('region', { name: 'Durum' });
  if (info.project.name === 'mobil-375') await status.getByRole('button').click();
  await expect(status.locator('dd')).toHaveText(['34', 'Albay', 'Conk Bayırı']);
  await shot(page, info, 'canakkale');
});

test('the Adana handover: a date from a dated order, place and age', async ({ page }, info) => {
  await open(page, '/#adim=adana-1918-10-31');
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(
    "Ordular Grubu'nun komutasını devraldı",
  );
  await expect(page.getByText('31 Ekim 1918')).toBeVisible();
  await expect(page.locator('svg').getByText('Adana', { exact: true })).toBeVisible();
  const status = page.getByRole('region', { name: 'Durum' });
  if (info.project.name === 'mobil-375') await status.getByRole('button').click();
  await expect(status.locator('dd')).toHaveText([
    '37',
    'Tümgeneral',
    '7. Ordu Komutanı',
    'Yıldırım Orduları Grubu Komutanı',
    'Adana',
  ]);
  await shot(page, info, 'adana');
});

test('1920 step: map, year, event text, controls', async ({ page }, info) => {
  await open(page, FIRST);
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(
    'Mustafa Kemal Paşa Meclise siyasi ahvali anlattı',
  );
  await expect(page.getByText('24 Nisan 1920')).toBeVisible();
  // The year itself (a span); the chronology line's "1920" label is a list item.
  await expect(page.locator('span', { hasText: /^1920$/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Önceki' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Sonraki' })).toBeEnabled();
  // The map label; the status cartouche also names the place (SPEC K3).
  await expect(page.locator('svg').getByText('Ankara', { exact: true })).toBeVisible();
  // No horizontal scroll at any width (SPEC §10 step 6).
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await shot(page, info, 'ilk-adim');
});

test('status cartouche: age from the birth date, place; no tenures in the data yet', async ({
  page,
}, info) => {
  await open(page, FIRST); // 24 April 1920, 19 May 1881 + 38 years not yet reached the 39th
  const status = page.getByRole('region', { name: 'Durum' });
  if (info.project.name === 'mobil-375') {
    await expect(status.getByRole('button')).toHaveAccessibleName('Durum: 38 yaşında');
    await status.getByRole('button').click();
  }
  await expect(status.locator('dt')).toHaveText(['Yaş', 'Yer']);
  await expect(status.locator('dd')).toHaveText(['38', 'Ankara']);
  await expect(status.getByText('yaklaşık')).toHaveCount(0);
});

test('map keeps at least 55 % of the height at 375 (SPEC §4.3)', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobil-375');
  await open(page, FIRST);
  const dock = await page.locator('[class*="dock"]').first().boundingBox();
  const viewport = page.viewportSize();
  expect(dock && viewport && dock.y / viewport.height).toBeGreaterThanOrEqual(0.55);
});

test('next / previous buttons; the address stays the plain site link', async ({ page }) => {
  await open(page, FIRST);
  // An old #adim link opens its step, then the address is cleared (2026-11-18).
  await expect(page).not.toHaveURL(/#adim=/);
  await page.getByRole('button', { name: 'Sonraki' }).click();
  await expect(page.getByRole('heading', { level: 2 })).toHaveText('TBMM Başkanı seçildi');
  await expect(page).not.toHaveURL(/#/);
  await expect(page.getByRole('button', { name: 'Önceki' })).toBeEnabled();
  await page.getByRole('button', { name: 'Önceki' }).click();
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(
    'Mustafa Kemal Paşa Meclise siyasi ahvali anlattı',
  );
  await expect(page).not.toHaveURL(/#/);
});

test('arrow keys step, Space starts and stops autoplay', async ({ page }) => {
  await open(page, FIRST);
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('heading', { level: 2 })).toHaveText('TBMM Başkanı seçildi');
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(
    'Mustafa Kemal Paşa Meclise siyasi ahvali anlattı',
  );
  const auto = page.getByRole('button', { name: 'Otomatik' });
  await page.keyboard.press(' ');
  await expect(auto).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press(' ');
  await expect(auto).toHaveAttribute('aria-pressed', 'false');
});

test('the last step disables Sonraki, a manual step stops autoplay', async ({ page }) => {
  await open(page, '/#adim=olum-1938-11-10');
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

test('chronology line: End and Home jump to the ends, speed cycles 1x 2x 4x', async ({ page }) => {
  await open(page, '/#adim=tbmm-nutuk-1923-08-13');
  const line = page.getByRole('slider', { name: 'Kronoloji' });
  await line.focus();
  await page.keyboard.press('End');
  await expect(page.getByRole('heading', { level: 2 })).toHaveText("Dolmabahçe Sarayı'nda öldü");
  await expect(page.getByRole('button', { name: 'Sonraki' })).toBeDisabled();
  await page.keyboard.press('Home');
  await expect(page.getByRole('button', { name: 'Önceki' })).toBeDisabled();
  const speed = page.getByRole('button', { name: /^Hız/ });
  await expect(speed).toHaveText('1×');
  await speed.click();
  await expect(speed).toHaveText('2×');
  await speed.click();
  await expect(speed).toHaveText('4×');
  await expect(speed).toHaveAccessibleName('Hız: 4×');
  await speed.click();
  await expect(speed).toHaveText('1×');
});

test('the first real journey: Amasya to Erzurum by car, approximate route', async ({
  page,
}, info) => {
  await open(page, '/#adim=amasya-erzurum-1919-06-26');
  await expect(page.getByRole('heading', { level: 2 })).toHaveText("Amasya'dan Erzurum'a gitti");
  await expect(page.getByText('yaklaşık rota')).toHaveCount(1);
  const status = page.getByRole('region', { name: 'Durum' });
  if (info.project.name === 'mobil-375') await status.getByRole('button').click();
  await expect(status.locator('dd')).toHaveText([
    '38',
    'Tümgeneral',
    '9. Ordu Kıtaatı Müfettişi',
    'Amasya',
  ]);
  await shot(page, info, 'seyahat');
});

test('the Republic: age, rank, duty and place in the status', async ({ page }, info) => {
  await open(page, '/#adim=cumhuriyet-1923-10-29');
  const status = page.getByRole('region', { name: 'Durum' });
  if (info.project.name === 'mobil-375') await status.getByRole('button').click();
  await expect(status.locator('dt')).toHaveText(['Yaş', 'Rütbe', 'Görev', 'Yer']);
  await expect(status.locator('dd')).toHaveText(['42', 'Müşîr', 'Reisicümhur', 'Ankara']);
  await shot(page, info, 'cumhuriyet');
});

test('a duty in force shows in the status (1920-1921)', async ({ page }, info) => {
  await open(page, '/#adim=tbmm-acilis-1921-03-01');
  await expect(page.getByText('1 Mart 1921')).toBeVisible();
  const status = page.getByRole('region', { name: 'Durum' });
  if (info.project.name === 'mobil-375') await status.getByRole('button').click();
  // 1 March 1921 is after the duty ended (24 January 1921): no "Görev" row.
  await expect(status.locator('dt')).toHaveText(['Yaş', 'Yer']);
});

test('an event without a place: no place in the status, the page still works', async ({
  page,
}, info) => {
  await open(page, '/#adim=buyuk-taarruz-1922-08-26');
  await expect(page.getByRole('heading', { level: 2 })).toHaveText('Büyük Taarruz başladı');
  const status = page.getByRole('region', { name: 'Durum' });
  if (info.project.name === 'mobil-375') await status.getByRole('button').click();
  await expect(status.locator('dt')).toHaveText(['Yaş', 'Rütbe']);
  await expect(status.locator('dd')).toHaveText(['41', 'Müşîr']);
  await shot(page, info, 'yersiz');
});

test('the last step: death at Dolmabahçe Palace', async ({ page }, info) => {
  await open(page, '/#adim=olum-1938-11-10');
  await expect(page.getByRole('heading', { level: 2 })).toHaveText("Dolmabahçe Sarayı'nda öldü");
  await expect(page.getByText('10 Kasım 1938')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sonraki' })).toBeDisabled();
  const status = page.getByRole('region', { name: 'Durum' });
  if (info.project.name === 'mobil-375') await status.getByRole('button').click();
  await expect(status.locator('dd')).toHaveText(['57', 'Reisicümhur', 'Dolmabahçe Sarayı']);
  await shot(page, info, 'olum');
});

test('a step without a place keeps the camera where it was', async ({ page }) => {
  await open(page, '/#adim=baskomutan-1921-08-05'); // Ankara
  const view = () => page.locator('svg g').first().getAttribute('transform');
  // The base layer is redrawn shortly after the camera rests; read it once it has.
  await page.waitForTimeout(1500);
  const before = await view();
  await page.getByRole('button', { name: 'Sonraki' }).click(); // 7-8 Aug 1921, no place
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(
    'Tekâlif-i Milliye emirlerini yayımladı',
  );
  await page.waitForTimeout(1500);
  expect(await view()).toBe(before);
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

test('documents open in a reading panel on the right; modal only at 375 (SPEC A29)', async ({
  page,
}, info) => {
  await open(page, LATIN);
  const viewport = page.viewportSize()!;
  await page.getByRole('button', { name: /^Konuşma:/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  // Finite animations only: a vehicle's smoke loops while it moves and is cancelled on arrival.
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => undefined)),
    ),
  );
  const b = (await dialog.boundingBox())!;
  const rightGap = viewport.width - (b.x + b.width);
  if (info.project.name === 'mobil-375') {
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(b.x).toBeLessThanOrEqual(1);
    expect(rightGap).toBeLessThanOrEqual(1);
  } else {
    await expect(dialog).toHaveAttribute('aria-modal', 'false');
    expect(rightGap).toBeGreaterThan(0);
    // Inside the sheet: the table margin plus, at 1280, the rolled edge (2026-11-17).
    expect(rightGap).toBeLessThanOrEqual(24 + 48 + 1);
    expect(b.x).toBeGreaterThan(viewport.width * 0.4);
    // The panel ends above the step controls, which stay whole.
    const controls = (await page.getByRole('group', { name: 'Adım kontrolleri' }).boundingBox())!;
    expect(b.y + b.height).toBeLessThanOrEqual(controls.y);
    // The map beside the panel stays visible and takes the pointer: the step controls still work.
    await expect(page.getByRole('region', { name: 'Durum' })).toBeVisible();
    // A typed label, not a value: values may hold glossary words, whose card Esc closes first.
    await page.getByRole('region', { name: 'Durum' }).locator('dt').first().click();
    await expect(dialog).toBeVisible();
    // Esc closes the panel even when focus has left it.
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  }
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
  // The shot shows the settled card, not the slide-in (M7).
  // Finite animations only: a vehicle's smoke loops while it moves and is cancelled on arrival.
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => undefined)),
    ),
  );
  await shot(page, info, 'kunye-karti');
  await dialog.getByRole('button', { name: 'Kapat' }).click();
  await expect(dialog).toBeHidden();
});

test('touch targets are at least 44 x 44 px (SPEC §4)', async ({ page }) => {
  await open(page, FIRST);
  const targets = [
    page.getByRole('button', { name: 'Sonraki' }),
    page.getByRole('button', { name: 'Otomatik' }),
    page.getByRole('button', { name: /^Hız/ }),
    page.getByRole('slider', { name: 'Kronoloji' }),
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
  // The scale is computed, so it may land a hair off 2.6 (2.5999999999999996).
  await expect
    .poll(
      async () => {
        const t = (await page.locator('svg g').first().getAttribute('transform')) ?? '';
        return Number(/scale\(([\d.]+)/.exec(t)?.[1] ?? 0);
      },
      { timeout: 1500 },
    )
    .toBeCloseTo(2.6, 5);
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
  // Finite animations only: a vehicle's smoke loops while it moves and is cancelled on arrival.
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => undefined)),
    ),
  );
  const withDialog = await axe(page);
  expect(withDialog.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});

test('place names on a many-stop journey do not overlap (2026-11-16)', async ({ page }) => {
  // Ankara, Sivas, Malatya, Ergani, Diyarbakır: Malatya and Ergani used to collide at 768.
  await open(page, '/#adim=yg-1937-11-12-trenle-dogu-gezisine-cikti');
  const names = page.locator('svg text');
  await expect(names.filter({ hasText: 'Ergani' })).toHaveCount(1);
  const boxes = await names.evaluateAll((els) =>
    els.map((el) => {
      const b = el.getBoundingClientRect();
      return { t: el.textContent, x0: b.left, y0: b.top, x1: b.right, y1: b.bottom };
    }),
  );
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i]!;
      const b = boxes[j]!;
      const hit = a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
      expect(hit, `${a.t} / ${b.t}`).toBe(false);
    }
  }
});

test('period borders follow the step date (SPEC A33, A34)', async ({ page }) => {
  const border = (id: string) => page.locator(`[data-border-id="${id}"]`);
  // 1881: CShapes starts in 1886, so no border is drawn yet.
  await open(page, '/#adim=dogum-selanik');
  await expect(page.locator('[data-border-id]')).toHaveCount(0);
  // 1899: the 1886-1912 outline.
  await open(page, '/#adim=harbiye-1899-03-13');
  await expect(border('osmanli-1886')).toHaveCount(1);
  // 1916: after Cyprus left in 1914.
  await open(page, '/#adim=mus-1916-08-07');
  await expect(border('kibris-1914')).toHaveCount(1);
  // 1930: the Lausanne outline.
  await open(page, '/#adim=yg-1930-02-26-ankara-dan-izmir-e-yola-cikti');
  await expect(border('lozan-1923')).toHaveCount(1);
});
