---
paths:
  - "data/**"
  - "tests/fixtures/**"
  - "scripts/build-data.ts"
  - "scripts/fetch-reference.ts"
  - "src/schema/**"
---

# Veri kuralları (SPEC §2, §6)

- Şema SPEC §6'nın birebir karşılığıdır. Alan eklemek/çıkarmak SPEC değişikliğidir: önce kullanıcıya sor.
- Derleme kuralları (SPEC §6, 1-8) `scripts/build-data.ts` içinde, her biri için reddedilmesi gereken bir örnek `tests/fixtures/` altında ve bir birim testi var.
- `fullText` yalnız `originalScript === 'latin'` ve kaynağı `kamu-mali` iken. Metin kaynaktan **karakter karakter**; düzeltme, kısaltma, köşeli parantez ekleme yok. Kaynakta "…" varsa aynen kalır.
- Her tam metin için `data/reference/<docId>.txt` + `<docId>.meta.json` (URL, sayfa, alım tarihi, sha256, `method`) (ADR-08).
- Hakları saklı yayınlar (ata.msb.gov.tr, Belleten, ATAM/DAB/MSB kitapları) teyit kaynağı **değildir**; yalnız birincil belgeye ulaşmak için ipucu (A19).
- Olay metni: ≤ 240 karakter, başlık ≤ 60, geçmiş zaman, sıfatsız, kaynakta olmayan bilgi yok, kaynaktan cümle kopyalanmaz.
- Yer adı dönem adıyla. Güncel ad yalnız `modernName` alanında (haritada asla görünmez).
- Rumi/Hicri tarih: `original` aynen; Miladi karşılık önce kaynaktan, yoksa TTK çevirici ile ve `conversion: 'ttk-cevirici'`.
- Taranmış tutanaktan aktarım (A20-A22): stenograf notları ("(Alkışlar)") alınmaz; satır sonu tirelemesi birleştirilir; dönem yazımı aynen. Aktarım kullanıcı onaylayana kadar `verified: false`.
- Koordinat: Natural Earth populated places + Wikidata (CC0) (A23). Koordinatı asla bellekten yazma; kaynaktan oku ve değeri kaynaktaki gibi kaydet.
- TBMM "düzenlenmiş" HTML metinleri sadeleştirilmiştir, kullanılmaz (SOURCES §2.4.1).
- `tests/fixtures/` içindeki kayıtlar kurgudur; dosya başında bunu belirten bir alan/not taşır ve asla `data/` altına kopyalanmaz.
