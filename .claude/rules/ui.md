---
paths:
  - "src/**/*.css"
  - "src/**/*.tsx"
  - "src/map/**"
  - "src/motion/**"
---

# Arayüz kuralları (SPEC §3-5)

- Konsept: masada açık duran, elle renklendirilmiş 19. yüzyıl atlası. Cam efekti, gradient, yuvarlak köşeli gölgeli kart **yok**. Kartuş = `.cartouche` (düz kâğıt dolgu + 1 px çift çizgi, 4 px ara).
- Renk: yalnız `var(--…)`. Tek vurgu `--route`; metinde turuncu gerekiyorsa `--accent-text`. Telgraf/mektup ayrımı renk **ve** ikon biçimiyle.
- Font rolleri: `--font-display` (harita etiketi, yıl, başlık; su adları italik), `--font-ui` (arayüz, olay metni), `--font-letter` (mektup/konuşma A4), `--font-telegram` (telgraf A4).
- Ölçüler token'lardan: `--text-*`, `--space-*`. Ara değer uydurma.
- Yerleşim (§3.5, §4.3): üç asimetrik alt kartuş; üst kenar boş. 375'te tek alt şerit, harita ≥ %55 yükseklik.
- Animasyon süreleri `--dur-*` ya da `src/motion/` üzerinden; sabit ms yazma. `prefers-reduced-motion` için §5.3.
- SVG harita: pan/zoom sırasında yeniden projeksiyon yok (`<g transform>`), çizgilerde `vector-effect: non-scaling-stroke`.
- Satır içi `style="…"` niteliği yazma (CSP `style-src 'self'`); gerekirse `el.style.setProperty` veya sınıf.
- Arayüz metinleri Türkçe ve SPEC §2 metin bütçesine uyar (buton ≤ 3 kelime).
