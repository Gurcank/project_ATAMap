---
paths:
  - "src/**/*.css"
  - "src/**/*.tsx"
  - "src/map/**"
  - "src/motion/**"
---

# Arayüz kuralları (SPEC §3-5)

- Konsept (2026-11-17, SPEC A35): askerî çadırda masaya serilmiş eski harita. Işık ve gölge sahneyi kurmak için serbest; cam efekti ve süs gradyanı **yok**. Panel = `.cartouche` (manila evrak fişi: kâğıt dokusu + ince kesik kenar + temas gölgesi; başlık ve etiket `.typed`, ataş `.paper-clip`, raptiye `.drawing-pin`), düğme = `.board-button` (mukavva). Harita: kâğıt ve baskı birlikte hareket eder (A42); kâğıt, doku ve rulolar `SheetLayer`da, harita koordinatlarında. Gölge ve doku değerleri `--card-fill`, `--card-shadow` ve sahne token'larından.
- Renk: yalnız `var(--…)`. Tek vurgu `--route`; metinde turuncu gerekiyorsa `--accent-text`. Telgraf/mektup ayrımı renk **ve** ikon biçimiyle.
- Font rolleri: `--font-year` (yalnız yıl rakamları), `--font-display` (harita etiketi, başlık; su adları italik), `--font-ui` (arayüz, olay metni), `--font-letter` (mektup/konuşma A4), `--font-telegram` (telgraf A4).
- Ölçüler token'lardan: `--text-*`, `--space-*`. Ara değer uydurma.
- Yerleşim (§3.5, §4.3, A29, A36): sol altta çerçevesiz yıl, ortada kontroller + kronoloji çizgisi, sağda olay kartı; sol üstte durum kartı (375'te açılır düğme); "ATAMap · Kaynakça" ekranın altındaki sabit ahşap şeritte (A45). Belgeler sağ kenarda okuma panelinde açılır (768+ modal değil). 375'te tek alt şerit, harita ≥ %55 yükseklik.
- Animasyon süreleri `--dur-*` ya da `src/motion/` üzerinden; sabit ms yazma. `prefers-reduced-motion` için §5.3.
- SVG harita: pan/zoom sırasında yeniden projeksiyon yok (`<g transform>`), çizgilerde `vector-effect: non-scaling-stroke`.
- Satır içi `style="…"` niteliği yazma (CSP `style-src 'self'`); gerekirse `el.style.setProperty` veya sınıf.
- Arayüz metinleri Türkçe ve SPEC §2 metin bütçesine uyar (buton ≤ 3 kelime).
