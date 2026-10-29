# ARCHITECTURE — ATAMap

> Faz 2 çıktısı (2026-10-27). Girdiler: [SPEC.md](SPEC.md), [SOURCES.md](SOURCES.md).
> SPEC'teki **verilmiş kararlar** burada değiştirilmez; yalnız teknik karşılığı belirlenir.
> Değişiklikler bu dosyada tarihle işlenir. Bu dosya SPEC A17'yi (teknik yığın) kapatır.

### Değişiklik kaydı

| Tarih | Yer | Değişiklik |
|---|---|---|
| 2026-10-27 | §2.3 | Faz 3 kurulumunda eklenen tip ve lint paketleri tabloya işlendi |
| 2026-10-27 | ADR-12, §5 | Font yükleme yöntemi ölçümle kesinleşti; toplam font boyutu SPEC sınırını aşıyor (ayrıntı ADR-12) |
| 2026-10-27 | §8 | T4 ve T5 kapandı |
| 2026-10-27 | ADR-08, §2.3, §4 | Referans metni satır satır ("diplomatik") aktarım oldu; site metni ondan otomatik üretiliyor. `fetch-scan` betiği, `tools/review/` kontrol sayfası ve `pdfjs-dist` eklendi |
| 2026-10-29 | ADR-06, §4 | Sınır ve seyahat altyapısı: `scripts/build-borders.ts` (elle çizim → `public/geo/borders/<id>.topojson`, kayıtlı `geometry` yolu `data/` köküne göre), `BorderLayer` (M5), `JourneyLayer` (M1, M2), `TransmissionLayer` (M3, M4), `--data`/`--out` bayrakları, kurgu e2e veri seti (`tests/fixtures/e2e`). CShapes geometrisi henüz bağlı değil; gerekçe SOURCES §3.2 |
| 2026-10-29 | ADR-03, ADR-04, §8 | Faz 4 ilk dilim: harita, yıl/olay/kontrol kartuşları, A4 ve künye kartı, adım motoru. T1 ve T6 kapandı (ölçümler ADR-03 ve ADR-04'te). `d3-selection` ve `d3-interpolate` doğrudan bağımlılık oldu (d3-zoom zaten getiriyordu). `.github/workflows/ci.yml` eklendi |
| 2026-10-29 | ADR-05, ADR-07, ADR-13, §4, §8 | Faz 3 tamamlandı: Zod şeması (`src/schema/`), `build-data` + 8 kural + bütünlük denetimi (`scripts/lib/rules.ts`), `fetch-geo`/`build-geo`, kural fixture'ları. T2 ve T3 kapandı (ayrıntı ADR-05, ADR-13, §8) |
| 2026-10-27 | ADR-12, §5, §8 | T7 kapandı: font sınırı açılışta ≤ 250 KB + belge fontları ≤ 200 KB olarak bölündü (kullanıcı kararı); `check:size` iki sınırı da denetliyor |

---

## 1. Genel bakış

Site sunucusuz, tek sayfalık statik bir uygulamadır. Tüm veri derleme zamanında doğrulanır ve dönüştürülür. Tarayıcı yalnız hazır JSON/TopoJSON dosyalarını okur. Harita WebGL değil, SVG ile çizilir.

```
data/*.json  (elle tutulan kayıtlar)  ──┐
data/reference/*.txt (kaynak metinler) ─┤
                                        ├─► scripts/build-data.ts ──► public/data/*.json
geo-src/ (Natural Earth, CShapes 2.0) ──┴─► scripts/build-geo.ts  ──► public/geo/*.topojson
                                                    │
                     herhangi bir kural ihlali → çıkış kodu ≠ 0, yayın durur
                                                    │
src/ (Preact + d3-geo + SVG) ──► Vite derlemesi ──► dist/ ──► Vercel (statik CDN)
```

Bütçe sıfır (SPEC §1): Aşağıdaki her paket, veri ve hizmet ücretsizdir. Dış servis, API anahtarı ve çalışma zamanı sunucusu yoktur.

---

## 2. Sürüm tablosu

**Kural:** En az iki haftalık (yayım tarihi ≤ 2026-10-13) en yeni kararlı sürüm seçilir ve `package.json`'da **tam sürüme** sabitlenir (`^`/`~` yok).
**Kaynak:** npm registry (`npm view <paket> time`), erişim 2026-10-27. Node.js: [nodejs.org/dist/index.json](https://nodejs.org/dist/index.json). Paket boyutları: [bundlephobia](https://bundlephobia.com/).
**Durum:** Peer bağımlılıkları registry verisinden kontrol edildi. Birlikte kurulum **test edilmedi**; Faz 3'te `npm install --save-exact` ile doğrulanacak.

### 2.1 Çalışma ortamı

| Araç | Sabitlenen | Gerekçe |
|---|---|---|
| Node.js | **24.x LTS** ("Krypton"; yerelde 24.13.1, son 24.22.1 / 2026-10-20) | Vercel derlemede yalnız 22.x ve 24.x sunuyor, varsayılan 24.x ([Vercel](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)). 26.x henüz LTS değil. `package.json`: `"engines": { "node": "24.x" }` |
| npm | 11.x (Node ile gelir) | Ek araç kurulmaz. `.npmrc`: `save-exact=true` |

### 2.2 Tarayıcıya giden paketler

| Paket | Sürüm | Yayım | En yeni (neden değil) | Lisans | Boyut (gzip) |
|---|---|---|---|---|---|
| preact | **10.29.8** | 2026-08-01 | 11.0.2. 11.x dört haftalık; `@preact/preset-vite` yalnız 10.x ile test ediliyor (devDependencies `preact ^10.27.2`) | MIT | ~5 KB (11.0.1 ölçümü) |
| @preact/signals | **2.11.3** | 2026-09-30 | 2.11.4 (bugün yayımlandı). Peer: `preact >= 10.25.0` ✓ | MIT | ~3 KB (tahmin, doğrulanmadı) |
| d3-geo | **3.1.1** | 2024-03-12 | — | ISC | 13,4 KB |
| d3-zoom | **3.0.0** | 2021-06-10 | — (d3-interpolate, d3-selection, d3-transition'ı getirir) | ISC | 15,5 KB |
| d3-selection | **3.0.0** | 2021-06-07 | — (d3-zoom zaten getiriyordu; kodumuz `select` çağırdığı için açıkça yazıldı, 2026-10-29) | ISC | d3-zoom ölçümüne dahil |
| d3-interpolate | **3.0.1** | 2021-06-05 | — (aynı gerekçe; kamera için `interpolateZoom`, 2026-10-29) | ISC | d3-zoom ölçümüne dahil |
| d3-selection | **3.0.0** | 2021-06-10 | — (d3-zoom zaten getiriyordu; kodun doğrudan `select` çağırması nedeniyle açıkça yazıldı) | ISC | d3-zoom ölçümüne dahil |
| d3-interpolate | **3.0.1** | 2022-01-27 | — (aynı gerekçe: `interpolateZoom` kamera için) | ISC | d3-zoom ölçümüne dahil |
| topojson-client | **3.1.0** | 2019-11-06 | — | ISC | ~3 KB (tahmin, doğrulanmadı) |
| @fontsource/old-standard-tt | **5.3.0** | 2026-07-19 | — | OFL-1.1 | font dosyası |
| @fontsource/alegreya-sans | **5.3.0** | 2026-07-19 | — | OFL-1.1 | font dosyası |
| @fontsource/eb-garamond | **5.3.0** | 2026-07-19 | — | OFL-1.1 | font dosyası |
| @fontsource/courier-prime | **5.3.0** | 2026-07-19 | — | OFL-1.1 | font dosyası |

### 2.3 Derleme ve geliştirme paketleri

| Paket | Sürüm | Yayım | En yeni (neden değil) | Lisans |
|---|---|---|---|---|
| vite | **8.3.4** | 2026-10-08 | 8.3.5 (6 günlük). Engine: node `^20.19.0 \|\| >=22.12.0` ✓ | MIT |
| @preact/preset-vite | **2.10.6** | 2026-07-18 | — Peer: `vite 8.x` ✓, `@babel/core 7.x` | MIT |
| @babel/core | **7.29.7** | 2026-05-25 | 8.0.9. Preset 7.x istiyor | MIT |
| typescript | **6.0.3** | 2026-04-16 | 7.0.2. `typescript-eslint` peer: `typescript >=4.8.4 <6.1.0` | Apache-2.0 |
| eslint | **10.12.0** | 2026-10-02 | 10.13.0 (11 günlük) | MIT |
| typescript-eslint | **8.71.2** | 2026-10-12 | 8.72.1 (1 günlük). Peer: `eslint ^10` ✓ | MIT |
| prettier | **3.9.10** | 2026-10-10 | — | MIT |
| zod | **4.6.7** | 2026-10-12 | — Yalnız derleme betiklerinde | MIT |
| mapshaper | **0.7.85** | 2026-10-13 | 0.7.98. Yalnız derleme | MPL-2.0 |
| topojson-server | **3.0.1** | 2019-09-05 | — Yalnız derleme | ISC |
| vitest | **5.0.4** | 2026-10-12 | 5.0.5. Engine: node `^24.0.0` ✓; peer `vite ^8` ✓ | MIT |
| @playwright/test | **1.64.0** | 2026-10-07 | 1.64.1 | Apache-2.0 |
| @axe-core/playwright | **4.13.0** | 2026-08-11 | 4.14.0 (12 günlük). Engine: node `>=22.12.0` ✓ | MPL-2.0 |
| @eslint/js | **10.0.1** | 2026-02-06 | — Peer: `eslint ^10` ✓ | MIT |
| globals | **17.13.0** | 2026-10-01 | — | MIT |
| @types/node | **24.19.2** | 2026-10-09 | 26.x; Node 24 kullanılıyor | MIT |
| @types/d3-geo · @types/d3-zoom | **3.1.1 · 3.0.9** | 2026-07-31 · 2026-09-29 | — | MIT |
| @types/topojson-client · -server · -specification | **3.1.5 · 3.0.4 · 1.0.5** | 2024-09-16 · 2023-11-07 · 2023-11-07 | — | MIT |
| @types/geojson | **7946.0.16** | 2025-01-23 | — | MIT |
| pdfjs-dist | **6.4.299** | 2026-10-03 | — Yalnız `scripts/fetch-scan.ts`: taranmış kaynak PDF'ten sayfa görüntüsü çıkarır (ADR-08). Engine: node `>=24` ✓ | Apache-2.0 |

**Kurulum testi (T4, 2026-10-27):** `npm install` peer çakışması olmadan tamamlandı; `npm ls` hatasız; `npm audit` 0 açık. İki kullanımdan kaldırma uyarısı yalnız mapshaper'ın dolaylı bağımlılıklarından geliyor (`geographiclib@1.48.0`, isteğe bağlı `prebuild-install`). İkisi de yalnız derleme zamanında çalışıyor, tarayıcıya gitmiyor. mapshaper yükseltilirken yeniden bakılır.

### 2.4 Değerlendirilip elenenler

| Paket | Sürüm (2 haftalık) | Neden elendi |
|---|---|---|
| maplibre-gl | 6.14.0 | Tek başına **287 KB gzip** (bundlephobia). SPEC §7'nin 300 KB toplam bütçesini dolduruyor. ADR-03 |
| react / react-dom | 19.3.0 | react-dom istemcisi ~45-60 KB gzip (bilinen değer, bu oturumda ölçülmedi). ADR-02 |
| next | 16.4.0 | SSR/sunucu özelliklerine ihtiyaç yok, React'e bağlı. ADR-01 |
| astro | 7.3.8 | Çok sayfalı içerik siteleri için güçlü; tek etkileşimli ekranda katkısı az. ADR-01 |
| svelte | 5.57.2 | Boyut olarak uygun; JSX/React bilgisini aktarmıyor. ADR-02 |
| motion | 14.2.0 | React peer'i istiyor. ADR-10 |
| @turf/great-circle | 7.4.0 | d3-geo'nun `geoInterpolate` fonksiyonu büyük daire yayını zaten veriyor (A8) |
| pmtiles | 4.5.0 | Karo gerekmiyor. ADR-05 |
| @typescript/native-preview / typescript 7 | 7.0.2 | typescript-eslint uyumsuz. ADR-14 |

---

## 3. Kararlar

Her karar: **Bağlam / Alternatifler / Sonuç / Ödünleşim**, ardından kararın ne zaman yeniden açılacağı (**Geri dönüş tetikleyicisi**).

### ADR-01 — Uygulama biçimi: Vite ile statik SPA

**Bağlam:** Tek ekran (SPEC §4), sunucu tarafı veri yok, CMS yok (§8). Arama motoru görünürlüğü hedef değil. Başarı ölçütü etkileşime dayanıyor (§1). Bütçe sıfır.

**Alternatifler:**
- Next.js 16 static export: Yönlendirme ve SSR altyapısı kullanılmaz, React'e bağlar.
- Astro 7: Statik içerik için güçlü; tüm sayfa tek bir etkileşimli ada olacağı için avantajı kalmıyor.
- Vite 8 + SPA: Yalnız derleyici ve geliştirme sunucusu.

**Sonuç:** Vite 8.3.4 ile tek sayfalık statik uygulama. `index.html` içinde, JS yüklenmeden görünen **statik iskelet** bulunur: `--paper` zemin, "Harita hazırlanıyor" yazısı ve kartuş çerçeveleri (SPEC §4.2 ilk yükleme durumu). Bu iskelet LCP öğesidir ve yerleşim kaymasını önler.

**Ödünleşim:** İçerik JS çalışmadan görünmez (JS kapalıyken yalnız iskelet ve bir `<noscript>` notu). Sunucu tarafı ön-çizim yok. SEO kapsam dışı olduğu için kabul edildi.

**Geri dönüş tetikleyicisi:** Ölçülen LCP 2,5 s'yi geçerse ve iskelet LCP öğesi değilse, `vite-prerender-plugin` (preset ile gelir) ile ön-çizim denenir.

### ADR-02 — Arayüz katmanı: Preact 10 + @preact/signals

**Bağlam:** Harita motoru küçük olunca (ADR-03) bütçe UI katmanına alan bırakıyor, ama React bu alanın yarısını tek başına alıyor. Bileşen sayısı az (SPEC §4, 10 bileşen). Durum küçük: aktif adım, mod, otomatik oynatma, açık belge.

**Alternatifler:**
- React 19: En geniş ekosistem; ~45-60 KB gzip.
- Svelte 5: Küçük çıktı; ayrı dil ve derleyici.
- Saf TypeScript + DOM: Sıfır bağımlılık; odak yönetimi, dialog, durum güncellemesi elle yazılır.
- Preact 10: ~5 KB, React ile aynı JSX ve hook API'si.

**Sonuç:** Preact 10.29.8 + @preact/signals 2.11.3. Signals, adım değişince yalnız ilgili kartuşu günceller; harita katmanları kendi `effect`'leriyle güncellenir.

**Ödünleşim:** React'e özgü kütüphaneler (`preact/compat` gerekir) kullanılmaz. Bu projede ihtiyaç duyulan bir React kütüphanesi yok. Preact 11 yerine 10 seçildi: daha olgun, araç zinciri onunla test edilmiş; ileride sürüm yükseltmesi gerekecek.

**Geri dönüş tetikleyicisi:** `@preact/preset-vite` Preact 11'i resmen desteklediğinde ve 11.x iki haftalık kuralı geçtiğinde yükseltilir.

### ADR-03 — Harita motoru: d3-geo + d3-zoom + SVG

*(Kullanıcı kararı, 2026-10-27.)*

**Bağlam:** SPEC §3.1 "elle renklendirilmiş 19. yüzyıl atlası" istiyor: tarama desenleri (işgal, yaklaşık sınır), mürekkep gibi çizilen rota (M1), rota üzerinde ilerleyen araç (M2), kâğıt dokusu. İşaretler klavyeyle odaklanabilmeli ve ≥ 44×44 px dokunma hedefi olmalı (§4). Veri küçük: tek bölge, ~40-60 sınır anlık görüntüsü. Toplam JS bütçesi 300 KB gzip (§7). maplibre-gl 6.14.0 tek başına 287 KB gzip.

**Alternatifler:**
- MapLibre GL JS (WebGL, vektör karo): Hazır zoom/pan ve etiket çakışma çözümü. Bütçeyi aşıyor; tarama için sprite görselleri, rota çizimi için `line-progress` ifadeleri gerekiyor; işaretler canvas içinde olduğu için erişilebilirlik ayrıca kurulmalı.
- Leaflet + SVG katmanı: Karo odaklı; projeksiyon Web Mercator'a bağlı.
- d3-geo + Canvas: Hızlı; desen, odak ve isabet testi elle yazılır.
- d3-geo + SVG: Desen (`<pattern>`), çizim animasyonu (`stroke-dashoffset`), yol üstünde konum (`getPointAtLength`), doku (`feTurbulence`) tarayıcıda yerleşik.

**Sonuç:** d3-geo 3.1.1 (projeksiyon ve yol üretimi) + d3-zoom 3.0.0 (pan/zoom) + SVG. Katman sırası: deniz → kara → sınır → işgal taraması → rota → araç → yer etiketleri → belge işaretleri. Belge işaretleri SVG içinde `role="button"` ve `tabindex="0"` taşıyan `<g>` öğeleridir. Pan/zoom sırasında yeniden projeksiyon yapılmaz: tek bir `<g transform>` değişir, çizgiler `vector-effect: non-scaling-stroke` ile sabit kalınlıkta kalır. Hareket bitince ölçeğe uygun ayrıntı düzeyi (ADR-05) yüklenir ve etiket çakışması yeniden hesaplanır.

**Ödünleşim:** Zoom sınırları, ayrıntı düzeyi geçişi ve etiket çakışma algoritması (öncelik sıralı açgözlü yerleşim) bizim kodumuzdur. Çok yakın (şehir sokak) zoom yok. Büyük SVG'lerde düşük güçlü telefonda pan akıcılığı riski var.

**Ölçüm (T6, 2026-10-29):** headless Chromium, 4× CPU yavaşlatma, 10m altlık (yaklaşık 6× zoom), 90 adımlık sürükleme: 375 px'te **59,5 fps** (p95 16,8 ms), 1280 px'te **49,2 fps** (p95 33,4 ms). Gerçek telefonda ölçülmedi.

**Geri dönüş tetikleyicisi:** Chrome DevTools 4× CPU yavaşlatmasıyla 375 px'te pan sırasında 30 fps altı ölçülürse altlık (kara/deniz/sınır) Canvas'a taşınır; işaretler, rota ve etiketler SVG'de kalır.

### ADR-04 — Projeksiyon: Lambert konik konform

**Bağlam:** Olaylar Balkanlar, Anadolu, Levant, Trablusgarp ve Orta Avrupa'yı kapsıyor (kabaca 5°B–50°D, 25°K–55°K). Atlas görünümü ve şekil doğruluğu öncelikli.

**Alternatifler:**
- Web Mercator: Alışılmış; 45°K üstünde alanları büyütür, dönem atlaslarına benzemez.
- Lambert azimutal eşalan: Alan doğru; kenarlarda şekil bozulur.
- Lambert konik konform (`d3.geoConicConformal`): Orta enlemlerde şekli korur; 19. yüzyıl–20. yüzyıl başı Avrupa atlaslarında yaygın konik projeksiyon ailesinden.

**Sonuç:** `geoConicConformal`, standart paraleller 33° ve 48°, `rotate([-25, 0])`. *2026-10-29 (T1, kapandı):* değerler olduğu gibi kaldı. İlk görünüm `[3°D, 27°K]–[47°D, 52°K]` kutusuna sığdırılır (`src/map/projection.ts`); bir adımda kamera yere 2,6× yaklaşır. Kırpma kutusu `src/map/region.ts` içinde tek yerde durur; `build-geo` ve pan sınırı aynı sabiti okur.

**Ödünleşim:** Dünya geneli görünüm yok (SPEC kapsamında da yok). Fransa (1910 manevraları gibi) bölgenin kenarına düşer; bozulma kabul edilebilir düzeyde, doğrulanmadı.

**Geri dönüş tetikleyicisi:** Bir kaydın konumu kırpma alanının dışına düşerse kırpma kutusu ve merkez meridyen genişletilir.

### ADR-05 — Altlık verisi: Natural Earth → mapshaper → TopoJSON (karo yok)

**Bağlam:** A16: Natural Earth, kendimiz barındırırız, etiketsiz. SPEC §4.2 altlık yüklenemezse gömülü 1:110m yedek istiyor. §7: ilk görünüm ≤ 400 KB gzip, yedek ≤ 120 KB. ADR-03 vektör karo okuyucusu içermiyor.

**Alternatifler:**
- PMTiles + tippecanoe/planetiler: Ölçeklenebilir karo; tippecanoe Windows'ta yerel çalışmıyor (WSL/Docker gerekir), d3 tarafında karo okuyucu yazmak gerekir.
- Ham GeoJSON: Basit; TopoJSON'a göre 3-5 kat büyük.
- Raster gölgelendirilmiş altlık: Kâğıt görünümü kolay; çözünürlük ve boyut sorunu, renk tokenlarıyla yönetilemez.
- TopoJSON, ölçeğe göre üç ayrıntı düzeyi.

**Sonuç:** `scripts/build-geo.ts`, mapshaper 0.7.85 ile Natural Earth kara/kıyı/göl katmanlarını bölgeye kırpar, sadeleştirir ve topojson-server 3.0.1 ile TopoJSON üretir:
- **110m** → JS paketine gömülü yedek (SPEC §4.2 "Hata: altlık" durumu).
- **50m** → ilk görünüm, ilk boyamadan sonra yüklenir.
- **10m** → zoom belli eşiği geçince tembel yüklenir.

*2026-10-29 güncellemesi (ilk çalıştırma):* `scripts/fetch-geo.ts` altı Natural Earth katmanını (land + lakes × 110m/50m/10m) sabit bir commit'ten indirir ve `scripts/geo-sources.json` içindeki sha256 ile doğrular. `build-geo` mapshaper ile `[-10, 20, 55, 60]` kutusuna kırpar, topojson-server ile 1e5 adımla nicemleyerek TopoJSON yazar. Ölçülen gzip boyutları: 110m **4,3 KB**, 50m **38,3 KB**, 10m **185,5 KB**. **Sadeleştirme gerekmedi** (en büyüğü bile 400 KB'ın yarısından az), bu yüzden `-simplify` kullanılmıyor. Kırpma kutusu ADR-04'ün geri dönüş tetikleyicisi gereği geniş tutuldu ve `build-geo` kutunun dışına düşen bir yeri reddeder. GeoJSON (RFC 7946) halkaları d3-geo'nun beklediğinin tersi yönde yazılır (d3 her çokgenin tümleyenini doldurur); `build-geo` halkaları ters çevirir ve boyutu 0,44 sr'nin altında kalan alanlarla doğrulandı.

**Ödünleşim:** Ayrıntı 1:10m ile sınırlı. Karo sistemi olmadığı için 10m dosyası bölge için tek parça iner (ölçüldü: 185,5 KB gzip, bölmeye gerek yok). SPEC'teki "karo" ifadeleri "altlık dosyası" olarak okunur (§7).

**Geri dönüş tetikleyicisi:** 10m dosyası 400 KB gzip'i aşarsa 4-6 coğrafi parçaya bölünür; yine aşarsa PMTiles yeniden değerlendirilir.

### ADR-06 — Dönem sınırları: CShapes 2.0 + kaynaklı elle çizim, değişiklik başına bir TopoJSON

**Bağlam:** SPEC §6 `BorderChange`: her değişiklik kendi geometrisini, tarihini ve kaynağını taşır. CShapes 2.0 kayıtları başlangıç/bitiş tarihi taşıyor (SOURCES §3.2), lisansı CC BY-NC-SA 4.0. İşgal bölgeleri ve 1881-1885 aralığı veri setinde yok (SOURCES §3.4) → A14 elle çizim. Sınır dosyası başına ≤ 150 KB, yalnız aktif ve sonraki tarih önden yüklenir (§7).

**Alternatifler:**
- Historical Basemaps (GPL-3.0): Yalnız anlık görüntü, tarih yok; A11 gereği dağıtılmaz.
- Tüm dönemleri tek dosyada toplamak: Basit; bütçeyi aşar.
- Değişiklik başına tam dünya poligonu: Tekrar eden geometri.
- Değişiklik başına bölgeye kırpılmış TopoJSON (komşu sınırlar ortak yay).

**Sonuç:** `geo-src/cshapes/` ham veri → mapshaper ile `gwsdate`'e göre filtre, kırpma, sadeleştirme → `public/geo/borders/<BorderChange.id>.topojson`. Elle çizimler `data/borders/manual/<id>.geojson` olarak kaynağıyla girilir ve aynı hattan geçer. İşgal bölgeleri ayrı nesne olarak tutulur, çizimde çapraz tarama deseni alır. `public/geo/borders/LICENSE.txt` CC BY-NC-SA 4.0 ve CShapes atfını içerir; aynı atıf `Attribution` bileşeninde görünür.

*2026-10-29 güncellemesi:* ilk uygulama yalnız `elle-cizim` yolunu bağlar. CShapes incelemesi (SOURCES §3.2) iki sonuç verdi: Türkiye poligonu 1920-2019 arasında bugünkü Türkiye'dir, dönem sınırı olarak kullanılamaz; ve CShapes tarihleri antlaşma imza gününe dayanır ama kaynak yoksa ayın/yılın ilk gününe düşer, yani tek başına tarih kaynağı olamaz. `geometryOrigin: 'cshapes'` kaydı `build-borders` içinde bilerek hata verir; bağlanacağı gün seçici (`gwcode` + başlangıç tarihi) ve UTC kaydırma düzeltmesi buraya yazılır.

**Ödünleşim:** CShapes tarihleri ile antlaşma adları arasındaki eşleştirme elle yapılır ve her biri iki kaynakla teyit edilir (SPEC §2.2). Bu iş kod değil, veri işidir ve zaman alır. Sadeleştirme kıyıyla sınır arasında küçük boşluklar üretebilir; altlık ile sınır aynı sadeleştirme oranından geçirilir.

**Geri dönüş tetikleyicisi:** Bir tarih dosyası 150 KB'ı aşarsa sadeleştirme oranı o dosya için artırılır; görsel fark kabul edilemezse yalnız değişen devletler ayrı dosyaya alınır.

### ADR-07 — Veri saklama ve derleme zamanı doğrulama

**Bağlam:** CMS yok, veri elle JSON'da (SPEC §8). Derleme 8 kuralı zorunlu kılıyor (§6): doğrulanmamış, telifli, tek kaynaklı, Arap harfli asılda tam metin içeren kayıtlar sitede olmamalı. Bu kurallar projenin hukuki ve tarihsel güvencesi.

**Alternatifler:**
- Headless CMS: Ücretsiz katmanlar var ama dış bağımlılık, SPEC §8 kapsam dışı.
- SQLite: Sorgu gücü; elle düzenleme ve git farkı zor.
- YAML: Okunması kolay; tip ve şema araçları JSON'dan zayıf, girinti hatası riski.
- JSON + şema doğrulaması.

**Sonuç:**
- Kaynak: `data/events.json`, `documents.json`, `journeys.json`, `borders.json`, `places.json`, `sources.json` (tekrar eden `SourceRef`'ler kimlikle referanslanır).
- Şema: `src/schema/` altında Zod 4.6.7 ile SPEC §6'nın birebir karşılığı. TypeScript tipleri `z.infer` ile şemadan türetilir; tarayıcı kodu yalnız tipleri import eder, Zod paketi tarayıcıya gitmez.
- Doğrulama: `scripts/build-data.ts` şemayı ve 8 kuralı uygular. Kural 1-2 (doğrulanmamış, telifli) kaydı çıkarır ve raporlar; kural 3-8 derlemeyi **başarısız** kılar. Her ihlal kayıt kimliği ve kural numarasıyla yazdırılır.
- `npm run build` = `build-data` → `build-geo` → `vite build`. Vercel de bu komutu çalıştırır; ihlalde yayın olmaz.
- Betikler Node 24'ün yerleşik TypeScript tip ayıklamasıyla çalışır (`node scripts/x.ts`); tsx gibi ek araç yok. Bu yüzden betiklerde yalnız silinebilir tip sözdizimi kullanılır (`enum`, `namespace` yok).
- Çıktı: `public/data/steps.json` (sıralı adımlar, olay metinleri, yerler, seyahatler) + yıla göre parçalanmış `public/data/documents/<yıl>.json` (tam metinler; SPEC §7 ≤ 500 KB gzip).

**Ödünleşim:** Elle JSON düzenlemek hataya açık; şema hataları açık mesajla bunu dengeler. İlişkisel bütünlük (ör. `placeId` var mı) şemaya ek kontrol olarak yazılmalı.

**Geri dönüş tetikleyicisi:** Kayıt sayısı elle yönetilemeyecek düzeye gelirse (> ~1000 kayıt) kayıt başına dosya yapısına geçilir; biçim yine JSON kalır.

### ADR-08 — Belge metninin birebirliği: referans metin dosyaları

**Bağlam:** SPEC §2: belge metni kaynaktan birebir alınır. §6 kural 7 ve §10 adım 3: metin kaynakla "karakter karakter" karşılaştırılabilir olmalı.

**Alternatifler:**
- Yalnız göz kontrolü: Kanıt üretmez.
- Her derlemede kaynağı canlı çekmek: Kaynak sitelere bağımlılık, kaynak kapalıysa derleme kırılır; taranmış PDF'lerde metin yok.
- Kaynaktan bir kez alınmış, sabitlenmiş referans metin + karşılaştırma testi.

**Sonuç:** Her tam metinli belge için `data/reference/<docId>.txt` ve yanında `<docId>.meta.json` (kaynak URL, sayfa, alım tarihi, sha256, `method: 'otomatik' | 'elle'`, şüpheli yerler listesi, onaylayan).

*2026-10-27 güncellemesi (TBMM incelemesi sonrası):* TBMM'nin "düzenlenmiş" HTML'i sadeleştirilmiş çıktı, kullanılamıyor (SOURCES §2.4.1); kaynaklar taranmış PDF. Bu yüzden:
- Referans dosyası taramanın **satır satır** aktarımıdır: baskı satırları, satır sonu tireleri, sayfa/sütun işaretleri (`## s.3 sol`) ve `{…}` ile işaretli stenograf notları aynen durur. Biçim `scripts/lib/diplomatic.ts` başında.
- `fullText` bu dosyadan `diplomaticToText()` ile **otomatik** üretilir: tireler birleşir (A21), notlar çıkar (A20), dizgi boşlukları temizlenir (`, . ; : ) ! ?` öncesi, `(` sonrası); yazım ve noktalama değişmez. Cümle notun önünde bitmişse notun sonundaki nokta nota aittir ve `{(Alkışlar).}` diye parantezin içine yazılır; böylece metinde çift nokta oluşmaz (1930 aktarımında çıktı). `tests/unit/reference.test.ts` eşitliği ve referansın sha256'sını denetler.
- `node scripts/fetch-scan.ts <docId>` kaynak PDF'in sayfalarını `research/scans/` altına PNG olarak çıkarır (git'te değil, siteye girmez). `npm run dev` ile `/tools/review/?doc=<docId>` sayfası taramayı ve aktarımı sütun sütun yan yana gösterir; kullanıcı buradan onaylar (SPEC A22).
- Metni çekilebilen kaynaklar çıkarsa `scripts/fetch-reference.ts` ile `method: 'otomatik'` yolu yine açık.

**Ödünleşim:** Taranmış PDF kaynaklarında referans elle yazılır (`method: 'elle'`); bu durumda test bizim iki kopyamızı karşılaştırır, kaynağa sadakati kanıtlamaz. Bu kayıtlar raporda ayrı listelenir ve elle ikinci kişi kontrolü gerektirir.

**Geri dönüş tetikleyicisi:** Elle referans oranı %50'yi geçerse kaynak sayfa görüntüsünün yerel kopyasıyla yan yana inceleme aracı değerlendirilir (siteye girmez).

### ADR-09 — Durum ve adım motoru

**Bağlam:** Üç adım birimi (olay, seyahat, yıl), otomatik mod, klavye kısayolları (SPEC §4, §5.1). A1 (mod değişince konum, okuma süresi formülü) geliştirme sırasında netleşecek; bu mantık değişkenlik taşıyor ve test edilebilir olmalı.

**Alternatifler:**
- Mantığı bileşenlerin içine yaymak: Hızlı başlar; A1 değişiklikleri birçok dosyaya dağılır.
- Durum makinesi kütüphanesi (XState vb.): Güçlü; boyut ve öğrenme maliyeti.
- DOM'dan bağımsız saf TypeScript modülü + signals.

**Sonuç:** `src/timeline/` saf fonksiyonlar: `buildSteps(data, mode)`, `next/prev(state)`, `stepDuration(step)` (A2: animasyon süresi + metin uzunluğuna bağlı okuma süresi), `remapOnModeChange(state, newMode)` (A1). Durum `@preact/signals` ile tutulur: `currentStepId`, `mode`, `autoplay`, `openDocumentId`. Aktif adım URL'ye yansır: `#adim=<eventId>` (geri tuşu ve E2E testleri adıma doğrudan başlar).

**Ödünleşim:** URL karması paylaşım butonu değildir (SPEC §8 paylaşım kapsam dışı); yalnız adres çubuğunda görünür. Tarayıcı geçmişi her adımda dolmasın diye `history.replaceState` kullanılır, yani geri tuşu adım adım geri gitmez.

**Geri dönüş tetikleyicisi:** Kullanılabilirlik testinde katılımcılar geri tuşuyla adım geri almaya çalışırsa `pushState`'e geçilir.

### ADR-10 — Animasyon: kütüphanesiz (CSS + Web Animations API + rAF)

**Bağlam:** SPEC §5.2'de 8 animasyon (M1-M8), §5.3'te hareket azaltma. Çoğu SVG özelliği veya yol üstünde konumla ilgili. Bütçe sıkı.

**Alternatifler:**
- motion 14: React peer'i istiyor.
- GSAP: Güçlü zaman çizelgesi; bundle boyutu ve lisans koşulları ek inceleme ister.
- d3-transition: d3-zoom ile zaten gelir; seçim tabanlı, Preact ile çakışabilir.
- CSS geçişleri + Web Animations API + `requestAnimationFrame`.

**Sonuç:** Ek kütüphane yok.
- M1 rota: `stroke-dasharray/dashoffset` WAAPI ile.
- M2 araç: rAF döngüsünde `path.getPointAtLength()` ve teğet açısına göre dönüş/aynalama.
- M3-M4: d3-geo `geoInterpolate` ile yay noktaları + WAAPI.
- M5-M7: CSS opacity/transform geçişleri.
- M8 kamera: `d3.interpolateZoom` (d3-zoom bağımlılığıyla zaten paket içinde) + rAF.
- `src/motion/motionPolicy.ts` `prefers-reduced-motion`'ı tek yerden okur; her animasyon süresini buradan alır (SPEC §5.3: anında, ≤ 150 ms saydamlık, kamera atlaması).

**Ödünleşim:** Animasyon sıralama ve iptal (kullanıcı otomatik modu durdurunca) elle yönetilir. Bunun için her adım geçişi tek bir `AbortController` taşır.

**Geri dönüş tetikleyicisi:** Animasyon koordinasyon kodu ~400 satırı geçer ve hatalar tekrarlarsa küçük bir zaman çizelgesi yardımcısı yazılır; kütüphane yine son seçenektir.

### ADR-11 — Stil: düz CSS + tasarım token'ları + CSS Modules

**Bağlam:** SPEC §3.2: "Ham hex yalnız token tanımında yazılır." Palet, tip ölçeği ve boşluk ölçeği tanımlı (§3.2-3.4). Karanlık tema yok. Kartuş çerçeveleri ve kâğıt hissi özel CSS istiyor.

**Alternatifler:**
- Tailwind: Hızlı yazım; dönem estetiği için yine özel CSS gerekir, sınıf kalabalığı.
- CSS-in-JS: Çalışma zamanı maliyeti.
- Düz CSS + custom properties + Vite'ın yerleşik CSS Modules desteği.

**Sonuç:** `src/styles/tokens.css` tek doğruluk kaynağıdır (renk, font ailesi, tip ölçeği, boşluk, süre). Bileşen stilleri `*.module.css`. SVG desenleri ve filtreler de token renklerini `var(--…)` ile kullanır. `scripts/check-tokens.ts` `src/` içinde `tokens.css` dışında `#rgb`, `#rrggbb`, `rgb(` veya `hsl(` bulursa çıkış ≠ 0 verir (CI'da).

**Ödünleşim:** Stil linter'ı (stylelint) yok; kural basit bir betikle denetlenir. Yanlış pozitif (ör. URL içindeki `#`) için betik yalnız renk desenlerine bakar.

**Geri dönüş tetikleyicisi:** Betik ikiden fazla yanlış pozitif üretirse stylelint (`color-no-hex`) eklenir.

### ADR-12 — Fontlar: @fontsource ile kendi barındırmamız

**Bağlam:** SPEC §3.3 dört OFL aile; §7 `latin` + `latin-ext` WOFF2, belge fontları yalnız A4 ilk açılışta. Sınır başlangıçta "toplam ≤ 250 KB" idi; 2026-10-27'de açılışta ≤ 250 KB + belge fontları ≤ 200 KB olarak bölündü (aşağıda). Google Fonts CDN dış bağlantı ve CSP istisnası gerektirir.

**Alternatifler:**
- Google Fonts CDN: Kolay; dış istek, gizlilik ve CSP istisnası.
- Dosyaları elle indirmek: Sürüm takibi yok.
- @fontsource npm paketleri: Sürümlü, alt küme başına CSS dosyaları.

**Sonuç:** @fontsource 5.3.0 paketlerinin woff2 dosyaları, kendi yazdığımız `src/styles/fonts.css` ile tanımlanır. 7 kesim: Old Standard TT 400 + 400 italik, Alegreya Sans 400 + 700, EB Garamond 400 + 400 italik, Courier Prime 400. Her kesim `latin` ve `latin-ext` olarak iki `@font-face` ve `unicode-range` ile tanımlanır, yalnız woff2, `font-display: swap`.

*Kurulumda netleşen (2026-10-27):*
- @fontsource'un alt küme başına CSS dosyalarında (`latin-400.css` gibi) `unicode-range` **yok**. İkisi birlikte import edilirse son tanımlanan yüz kazanır ve temel Latin harfleri kaybolabilir. Bu yüzden paket CSS'leri değil, kendi `fonts.css` dosyamız kullanılır.
- Tarayıcı bir yüzü yalnız o yüzde metin çizildiğinde indirir. EB Garamond ve Courier Prime bu yüzden ilk A4 açılışına kadar inmez; ayrı dinamik import gerekmez.
- `<link rel="preload">` henüz yok (hash'li dosya adı gerektiriyor). LCP ölçümünde gerekirse Faz 4'te bir Vite eklentisiyle eklenir.
- **T5 sonucu:** 7 kesimin hepsi "ğĞıİşŞçÇöÖüÜ" örneğini kendi yüzüyle çiziyor; `document.fonts.check` 7/7 doğru, yedek fonta düşen glif yok. Test sayfası: `tests/visual/fonts.html` (`npm run dev` ile açılır).
- **Boyut (ölçülen, woff2):** İlk yüklemede inen yüzler (Old Standard TT + Alegreya Sans, latin + latin-ext) **190,6 KB**: 250 KB içinde. Belge fontları (EB Garamond + Courier Prime) **+178,7 KB**, toplam **369,4 KB**. Türkçe metin her zaman `latin-ext` dosyasını da indirdiği için bu alt kümeden kaçılamıyor. En büyük kalemler EB Garamond `latin-ext` dosyaları (normal 55,6 KB + italik 44,4 KB). KB = 1024 bayt, `check:size` ile aynı.

**Ödünleşim:** İlk A4 açılışında belge fontu birkaç yüz ms gecikebilir (swap ile metin hemen görünür, sonra yazı yüzü değişir). Kabul edildi; hover niyet süresi (150 ms) bu sırada fontu önden istemek için kullanılır.

*Sınır kararı (kullanıcı, 2026-10-27, T7):* Toplam 369,4 KB eski 250 KB sınırını aşıyordu. Kesim çıkarmak yetmiyordu (EB Garamond italik + Alegreya Sans 700 çıksa bile 255,3 KB). Sınır ikiye bölündü: **açılışta inen fontlar ≤ 250 KB** (ölçülen 190,6 KB) ve **belge fontları ayrıca ≤ 200 KB** (ölçülen 178,7 KB). Tasarım ve 7 kesim aynen kalır. Belge fontları yalnız belge açan ziyaretçiye iner. `check:size` iki sınırı da her derlemede denetler.

**Geri dönüş tetikleyicisi:** Açılış fontları 250 KB'ı ya da belge fontları 200 KB'ı geçerse (ör. yeni kesim eklenirse) önce EB Garamond italik çıkarılır (−69,2 KB), sonra kesim listesi kullanıcıyla yeniden ele alınır.

### ADR-13 — Barındırma: Vercel Hobby

*(Kullanıcı kararı, 2026-10-27.)*

**Bağlam:** Çıktı saf statik dosyalardır. Bütçe sıfır. Proje ticari değil (SPEC §1, CShapes NC şartı).

**Alternatifler:**
- GitHub Pages: Ücretsiz; özel HTTP başlıkları (CSP, önbellek) ayarlanamaz.
- Cloudflare Pages: Ücretsiz; başlıklar ayarlanabilir.
- Vercel Hobby: Ücretsiz; `vercel.json` ile başlıklar, Git entegrasyonu, önizleme yayınları.

**Sonuç:** Vercel Hobby. [Vercel'e göre](https://vercel.com/docs/plans/hobby) Hobby ücretsizdir ve **yalnız ticari olmayan kişisel kullanıma** izin verir; bu proje uyumlu. Dahil kullanım: ayda 100 GB Fast Data Transfer, 1.000.000 CDN isteği, günde 100 yayın (erişim 2026-10-27). Fonksiyon kullanılmaz. Framework ön ayarı: Vite; derleme komutu `npm run build`; çıktı `dist/`. `vercel.json`:
- `Content-Security-Policy`: `default-src 'self'; img-src 'self' data:; style-src 'self'; font-src 'self'; script-src 'self'; frame-ancestors 'none'` (dış kaynak yok; satır içi stil gerekiyorsa Faz 4'te gerekçesiyle eklenir).
- `/assets/*` (hash'li): `Cache-Control: public, max-age=31536000, immutable`.
- `/geo/*`, `/data/*`: kısa önbellek + yeniden doğrulama (dosya adları hash'siz olduğu için). Karar (2026-10-29, T3): hash'siz dosya adı + `max-age=0, must-revalidate` olduğu gibi kalır. Dosyalar küçük (en büyüğü 185,5 KB gzip), yeniden doğrulama 304 ile döner ve derlemeye içerik hash'i eklemek Faz 4'ün yükleme koduna ek karmaşıklık getirirdi. Ölçümde sorun çıkarsa hash'li ada geçilir.
- `cleanUrls: true`.

**Ödünleşim:** Kullanım limiti aşılırsa Hobby'de site 30 güne kadar durabilir (aynı sayfa). Beklenen trafik çok altında. Sağlayıcıya bağımlılık düşük: çıktı her statik barındırıcıya taşınabilir; yalnız `vercel.json` başlıkları yeniden yazılır.

**Geri dönüş tetikleyicisi:** Aylık transfer 50 GB'ı geçerse veya proje ticari nitelik kazanırsa (ki CShapes lisansı da buna izin vermez) barındırma yeniden değerlendirilir.

### ADR-14 — Kalite araçları, testler ve CI

**Bağlam:** SPEC §10 on adımlı uçtan uca doğrulama ve üç genişlik (375/768/1280) istiyor; dev-process kılavuzu "iddia değil kanıt" diyor. Derleme kuralları (§6) otomatik doğrulanmalı.

**Alternatifler:**
- TypeScript 7 (yerel derleyici, hızlı): typescript-eslint 8.71.2 peer'i `<6.1.0`; birlikte kullanılamaz.
- Jest: Vite ile ek dönüştürücü gerekir.
- Cypress: Çoklu görünüm alanı ve `prefers-reduced-motion` emülasyonunda Playwright daha doğrudan.
- Biome (lint + format tek araç): Hızlı; typescript-eslint'in tip bilgili kuralları yok.

**Sonuç:**
- **Tip ve lint:** TypeScript 6.0.3 (`strict`), ESLint 10.12.0 + typescript-eslint 8.71.2, Prettier 3.9.10.
- **Birim (Vitest 5.0.4):** Şema + 8 derleme kuralı (her kural için reddedilmesi gereken örnek kayıt), adım motoru (modlar, sınırlar, A2 süre), tarih biçimlendirme (§2.3: `3 Mart 1900`, "yaklaşık"), referans metin karşılaştırması (ADR-08), etiket çakışması.
- **Uçtan uca (Playwright 1.64.0 + @axe-core/playwright 4.13.0):** `tests/fixtures/` küçük veri setiyle SPEC §10 senaryosu; üç görünüm alanı projesi; `reducedMotion: 'reduce'`; `page.route` ile `/geo/*` engellenip yedek altlık testi; her sayfa durumunda axe taraması (ihlal 0).
- **Bütçe:** `scripts/check-size.ts` `dist/` dosyalarını `node:zlib` ile gzip'leyip §5'teki sınırlarla karşılaştırır (ek bağımlılık yok).
- **CI:** GitHub Actions (herkese açık depoda ücretsiz; gizli depoda aylık ücretsiz dakika kotası): `lint → typecheck → test → build → check-size → check-tokens → e2e`. Vercel kendi derlemesinde `npm run build`'i çalıştırır, böylece veri kuralları yayından önce de uygulanır.

**Ödünleşim:** TypeScript 7'nin hız kazancı yok; tip denetimi birkaç saniye daha uzun. E2E testleri CI süresini uzatır; yalnız `main`'e giden PR'larda tam koşar.

**Geri dönüş tetikleyicisi:** typescript-eslint TypeScript 7'yi peer olarak kabul edip iki haftalık kuralı geçtiğinde yükseltme denenir.

---

## 4. Klasör yapısı

```
ATAMap/
├─ SPEC.md  SOURCES.md  ARCHITECTURE.md  CLAUDE.md (Faz 3)
├─ data/                      # elle tutulan kayıtlar (ADR-07)
│  ├─ events.json  documents.json  journeys.json  borders.json  places.json  sources.json
│  ├─ borders/manual/         # kaynaklı elle çizimler (A14)
│  └─ reference/              # birebir metin referansları (ADR-08)
├─ geo-src/                   # ham Natural Earth + CShapes; git'te değil, betik indirir
├─ research/scans/            # fetch-scan çıktısı, kaynak taramaları; git'te değil (ADR-08)
├─ tools/review/              # yalnız geliştirmede: tarama ↔ aktarım kontrol sayfası (ADR-08)
├─ scripts/
│  ├─ build-data.ts  build-geo.ts  fetch-reference.ts  fetch-scan.ts  fetch-geo.ts
│  ├─ lib/diplomatic.ts       # referans aktarımı → site metni (A20/A21)
│  └─ check-size.ts  check-tokens.ts
├─ public/
│  ├─ geo/                    # üretilmiş TopoJSON (git'te değil)
│  │  └─ borders/LICENSE.txt  # CC BY-NC-SA 4.0
│  └─ data/                   # üretilmiş JSON (git'te değil)
├─ src/
│  ├─ main.tsx  App.tsx
│  ├─ schema/                 # Zod şeması + türetilen tipler (Zod yalnız scripts'te çalışır)
│  ├─ timeline/               # saf adım motoru (ADR-09)
│  ├─ state/                  # signals
│  ├─ map/                    # projection.ts, MapCanvas, BaseLayer, BorderLayer, PlaceLabels,
│  │                          # JourneyLayer, DocumentMarker, labelPlacement.ts, lod.ts
│  ├─ components/             # DocumentSheet, CitationCard, YearCartouche, StepControls,
│  │                          # EventCartouche, Attribution, Cartouche (ortak çerçeve)
│  ├─ motion/                 # motionPolicy.ts + animasyon yardımcıları (ADR-10)
│  ├─ format/                 # Türkçe tarih biçimi (§2.3)
│  ├─ assets/svg/             # araç ve işaret SVG'leri (satır içi, §7)
│  └─ styles/                 # tokens.css, global.css, paper.css
├─ tests/
│  ├─ unit/  e2e/
│  └─ fixtures/               # SPEC §10 küçük veri seti (+ reddedilmesi gereken örnekler)
├─ index.html                 # statik iskelet (ADR-01)
├─ vercel.json  vite.config.ts  tsconfig.json  eslint.config.js  .npmrc  .gitignore
└─ package.json               # tam sürümler, engines.node "24.x"
```

---

## 5. Performans bütçesi (kesinleşen)

SPEC §7 önerisinin kesin hâli. Ölçüm `scripts/check-size.ts` (boyut) ve Lighthouse/Playwright (zaman) ile yapılır.

| Kalem | Sınır | Not |
|---|---|---|
| İlk yükleme JS | **≤ 120 KB gzip** (hedef), ≤ 300 KB (SPEC tavanı) | Preact ~5 + signals ~3 + d3-geo 13 + d3-zoom 15 + topojson-client ~3 + gömülü 110m altlık + uygulama |
| Gömülü yedek altlık (110m) | ≤ 120 KB gzip | JS içinde |
| İlk görünüm altlığı (50m) | ≤ 400 KB gzip | |
| Yakın zoom altlığı (10m) | ≤ 400 KB gzip / dosya | Aşarsa bölünür (ADR-05) |
| Sınır dosyası | ≤ 150 KB gzip / tarih | Yalnız aktif + sonraki önden |
| Belge metinleri | ≤ 500 KB gzip toplam | Yıla göre parçalı |
| Açılış fontları (Old Standard TT + Alegreya Sans) | ≤ 250 KB (SPEC §7) | Ölçülen 190,6 KB ✓ |
| Belge fontları (EB Garamond + Courier Prime) | ≤ 200 KB, ilk A4 açılışında (SPEC §7) | Ölçülen 178,7 KB ✓ (ADR-12) |
| Araç SVG'leri | ≤ 4 KB / adet, ≤ 20 KB toplam | Satır içi |
| İşaret ikonları | ≤ 8 KB toplam | |
| Kâğıt dokusu | ≤ 30 KB | `feTurbulence` tercih edilir (0 KB dosya) |
| LCP | ≤ 2,5 s | 4G, orta mobil profil (Lighthouse) |
| Adım geçişi | ana iş parçacığı bloğu ≤ 50 ms | Performance paneli, 4× CPU yavaşlatma |
| CLS | ≤ 0,1 | Statik iskelet sayesinde |

---

## 6. Doğrulama eşlemesi

### 6.1 SPEC §6 derleme kuralları → test

| Kural | Test | Beklenen |
|---|---|---|
| 1 `verified === false` | birim + `build-data` | Kayıt çıktıda yok, raporda listelenir |
| 2 `telifli` | birim + `build-data` | Kayıt çıktıda yok |
| 3 Arap harfli asılda `fullText` | birim | Derleme çıkış ≠ 0 |
| 4 `attributionDisputed` + `disputeNote` yok | birim | Çıkış ≠ 0 |
| 5 Tek kaynaklı `DateValue`/`GeoPoint` (birincil belge değil) | birim | Çıkış ≠ 0 |
| 6 `elle-cizim` geometride kaynak yok | birim | Çıkış ≠ 0 |
| 7 `fullText` sayfa no'suz / referansla uyuşmaz | birim (ADR-08) | Çıkış ≠ 0 |
| 8 `free !== true` | birim | Çıkış ≠ 0 |

### 6.2 SPEC §10 adımları → test

| Adım | Test | Kanıt |
|---|---|---|
| 1 Reddedilen kayıtlar | Vitest + `build-data` fixture | Çıkış kodu, rapor |
| 2 Seyahat adımı (1280) | Playwright | Ekran görüntüsü, rota `path` var, araç değişti, yıl metni |
| 3 Telgraf A4 + birebir metin | Playwright + Vitest (ADR-08) | Ekran görüntüsü, metin eşitliği |
| 4 Sınır değişimi ileri/geri | Playwright | Aktif sınır dosyası kimliği DOM'da |
| 5 375 px dokunma + ≥ 44 px | Playwright (mobil proje, `hasTouch`) | Ekran görüntüsü, `boundingBox` ölçümü |
| 6 768 px yerleşim, yatay kaydırma yok | Playwright | `scrollWidth <= clientWidth` |
| 7 Klavye akışı | Playwright | Odaklanan öğe kontrolleri |
| 8 Hareket azaltma | Playwright `reducedMotion: 'reduce'` | Rota anında tam çizili |
| 9 "yaklaşık" ve "Atfı tartışmalı" | Playwright | Rozet metni görünür |
| 9a Arap harfli → künye kartı | Playwright | `CitationCard` ve not metni |
| 9b Yaklaşık rota etiketi | Playwright | Etiket metni + kesik çizgi sınıfı |
| 10 Altlık engellenince yedek | Playwright `page.route('/geo/**', abort)` | Hata notu + kara çizimi var |
| Erişilebilirlik (her durum) | @axe-core/playwright | İhlal sayısı 0 |

---

## 7. SPEC'e işlenecek notlar

ARCHITECTURE kararlarının SPEC'teki ifadelere etkisi. **SPEC'e işlendi: 2026-10-27** (kullanıcı onayıyla; SPEC başındaki "Değişiklik kaydı" tablosu). A16'nın gerekçesindeki MapLibre anışı verilmiş karar metni olduğu için değiştirilmedi; altlık kararı (Natural Earth, kendimiz barındırırız) aynen geçerli.

| SPEC yeri | Şu anki ifade | Önerilen |
|---|---|---|
| §4.2 "Hata: altlık karoları" | karolar | "altlık dosyası" (ADR-05, karo yok) |
| §7 medya tablosu, altlık satırı | "İlk görünüm karoları ≤ 400 KB" | "İlk görünüm altlığı (50m) ≤ 400 KB" |
| §7 genel bütçe | "(MapLibre dahil)" | MapLibre yok; hedef 120 KB, tavan 300 KB (ADR-03, §5) |
| §10 adım 10 | "Altlık karoları engellenince" | "Altlık dosyası engellenince" |
| §9.1 A17 | Açık | Kapandı → ARCHITECTURE.md |
| §6 başlık notu | "kesin hâli ARCHITECTURE'da" | Şema `src/schema/` altında Zod ile; SPEC §6 alanları korunur, ek alan: `sources.json` kimlik referansı (ADR-07) ve referans metin meta verisi (ADR-08) |

---

## 8. Açık kalanlar

| # | Konu | Ne zaman |
|---|---|---|
| A1 | Mod değişince konum, okuma süresi formülü | İlk kural yazıldı ve test edildi (`src/timeline/steps.ts`): geçişte yeni moddaki, mevcut olaydan geç olmayan son adım; okuma süresi 55 ms/karakter, en az 2,5 s. Gerçek kullanıcıyla ayarlanacak (SPEC A6 denemesi) |
| ~~T1~~ | Projeksiyon parametrelerinin kesinleşmesi | **Kapandı 2026-10-29** (ADR-04) |
| ~~T2~~ | 10m altlığın gerçek boyutu, bölme gereği | **Kapandı 2026-10-29:** 185,5 KB gzip, bölme ve sadeleştirme gerekmedi (ADR-05) |
| ~~T3~~ | `/geo`, `/data` için hash'li dosya adı mı kısa önbellek mi | **Kapandı 2026-10-29:** hash'siz + must-revalidate (ADR-13) |
| ~~T4~~ | Paketlerin birlikte kurulumu ve peer uyarıları | **Kapandı 2026-10-27:** çakışma yok (§2.3 kurulum testi) |
| ~~T5~~ | Fontların Türkçe glif testi | **Kapandı 2026-10-27:** 7/7 kesim geçti (ADR-12) |
| ~~T6~~ | SVG pan akıcılığı ölçümü | **Kapandı 2026-10-29:** 49-60 fps, tetikleyici (30 fps) aşılmadı (ADR-03) |
| ~~T7~~ | Toplam font boyutu 369,4 KB, SPEC §7 sınırı 250 KB | **Kapandı 2026-10-27:** sınır açılışta ≤ 250 KB + belge fontları ≤ 200 KB olarak bölündü (kullanıcı kararı, ADR-12) |

---

## Faz 2 → 3 kapı kontrolü

- [x] Her önemli karar Bağlam / Alternatifler / Sonuç / Ödünleşim içeriyor (ADR-01 … ADR-14)
- [x] Sürümler web'den (npm registry, Node, Vercel) doğrulandı, iki haftalık kurala göre sabitlendi (§2)
- [x] Bütçe sıfır: tüm paketler açık lisanslı, barındırma ücretsiz katman, dış servis yok
- [x] Klasör yapısı (§4), performans bütçesi (§5), doğrulama eşlemesi (§6)
- [x] SPEC'e etkiler listelendi (§7), açık kalanlar sahipli (§8)
- [x] Birlikte kurulum testi (T4, 2026-10-27)
