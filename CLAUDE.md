# ATAMap

Atatürk'ün 1881-1938 hayatı; mektup, telgraf, konuşma ve seyahatleri dönem sınırlarıyla çizilmiş tek ekranlık bir harita üzerinde. Kişisel, ticari olmayan proje.

- Ne yapılacak: [SPEC.md](SPEC.md). Nasıl yapılacak: [ARCHITECTURE.md](ARCHITECTURE.md). Kaynaklar ve lisanslar: [SOURCES.md](SOURCES.md).
- SPEC'teki "verilmiş kararlar" kullanıcıya aittir. Değiştirmeden önce sor. SPEC/ARCHITECTURE değişirse dosyanın başındaki değişiklik kaydına tarihle işle.

## Mutlak kurallar

1. **Bütçe sıfır.** Ücretli paket, servis, font, veri, API anahtarı yok. Dış ağ isteği yok (CSP `default-src 'self'`).
2. **Telifli içerik yok.** Belge tam metni yalnız aslı Latin harfli, Atatürk'ün kendi metni ise ve kaynaktan birebir. Transkripsiyon, sadeleştirme, çeviri, özet, editör notu yazma veya ekleme (SPEC §2.1).
3. **Veri uydurma.** Tarih, yer, olay, koordinat, kaynak künyesi asla tahminle yazılmaz. Her tarih ve yer için ≥ 2 bağımsız telifsiz kaynak ya da tarihli birincil belge (SPEC §2.2). Test için gereken kayıtlar `tests/fixtures/` altında ve açıkça kurgu olarak işaretli.
4. **Dil yalnız Türkçe.** Arayüzde İngilizce kelime yok. Kod, tanımlayıcı ve yorumlar İngilizce olabilir.
5. **Ham renk yalnız `src/styles/tokens.css`'te.** Başka her yerde `var(--…)`. `npm run check:tokens` denetler.
6. **Sürümler tam sabit.** `package.json`'da `^`/`~` yok. Yeni paket: en az iki haftalık en yeni kararlı sürüm, lisansı açık, ARCHITECTURE §2'ye satır eklenir. Önce ihtiyacı sorgula; bütçe çok sıkı (§5).

## Komutlar

```
npm run dev            # geliştirme sunucusu
npm run check          # typecheck + lint + check:tokens + test + build + check:size (iş bitmeden önce geçmeli)
npm run test           # Vitest (tests/unit)
npm run e2e            # Playwright, 375/768/1280 (önce: npx playwright install chromium)
npm run format         # Prettier (md dosyalarına dokunmaz)
node scripts/fetch-scan.ts <docId>   # kaynak taramasını research/scans/ altına indirir
# kontrol sayfası: npm run dev → /tools/review/?doc=<docId>
```

Belge metni ekleme akışı (ADR-08): taramayı `data/reference/<docId>.txt` dosyasına satır satır aktar → `fullText`'i `diplomaticToText()` ile üret, elle yazma → `.meta.json`'a sha256 ve şüpheli yerleri yaz → kullanıcı kontrol sayfasından onaylayana kadar kaynak `verified: false`.

Betikler (`scripts/*.ts`) Node 24'ün yerleşik tip ayıklamasıyla çalışır: `node scripts/x.ts`. Bu yüzden `enum`, `namespace`, parametre özellikleri yok (`erasableSyntaxOnly`). Yerel import'lar `.ts`/`.tsx` uzantısıyla yazılır.

## Yığın (ayrıntı ARCHITECTURE §2-3)

- Vite 8 statik SPA, Preact 10 + `@preact/signals` (React değil; `preact/compat` kullanma).
- Harita: d3-geo + d3-zoom + **SVG**. MapLibre/Leaflet yok. Projeksiyon `geoConicConformal`.
- Altlık: Natural Earth → mapshaper → TopoJSON (110m gömülü yedek, 50m ilk, 10m yakın zoom). Karo yok.
- Sınırlar: CShapes 2.0 (CC BY-NC-SA 4.0) + kaynaklı elle çizim, değişiklik başına bir TopoJSON.
- Veri: `data/*.json` elle → `scripts/build-data.ts` Zod ile doğrular → `public/data/`. Zod tarayıcıya gitmez.
- Animasyon kütüphanesi yok: CSS + Web Animations API + rAF. Her süre `src/motion/` üzerinden; `prefers-reduced-motion` tek yerden.
- Stil: düz CSS + CSS Modules + token'lar. Tailwind yok.
- Yayın: Vercel Hobby (`vercel.json`).

## Klasörler

`src/timeline/` saf TS adım motoru (DOM yok, birim testli) · `src/map/` harita katmanları · `src/components/` kartuşlar ve A4 · `src/state/` signals · `src/schema/` Zod şeması · `src/format/` Türkçe tarih biçimi · `scripts/` derleme ve denetim · `tests/unit`, `tests/e2e`, `tests/fixtures`.

## Çalışma biçimi

- **Bitti demeden önce kanıt:** `npm run check` çıktısı; görsel işte 375, 768 ve 1280'de ekran görüntüsü. Ekran görüntüsünü SPEC §3 ve §4.3 ile karşılaştır, farkları listele.
- Her dilim uçtan uca: veri + yerleşim + responsive + yükleniyor/hata/boş durumları (SPEC §4.2) + klavye ve odak + hareket azaltma.
- Mobile-first CSS. Kırılımlar: `48rem` (768), `80rem` (1280).
- Dokunma/tıklama hedefleri ≥ 44×44 px. Dialog: `role="dialog"`, odak içeri taşınır, `Esc` kapatır, odak geri döner.
- Bir hatayı bastırma; kök nedeni çöz. İki başarısız denemeden sonra dur ve durumu raporla.
- Bütçe aşımı (`check:size`) kod eklemeden önce düşünülür; ilk yükleme JS hedefi 120 KB gzip.
