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
- Derleme kuralları (SPEC §6, 1-11) `scripts/lib/rules.ts` içinde, her biri için reddedilmesi gereken bir örnek `tests/fixtures/` altında ve bir birim testi var.
- `fullText` yalnız `originalScript === 'latin'` ve kaynağı `kamu-mali` iken. Metin kaynaktan **karakter karakter**; düzeltme, kısaltma, köşeli parantez ekleme yok. Kaynakta "…" varsa aynen kalır.
- Her tam metin için `data/reference/<docId>.txt` + `<docId>.meta.json` (URL, sayfa, alım tarihi, sha256, `method`) (ADR-08).
- Resmî devlet kaynağı tek başına yeter (A27, K5): TBMM, Resmî Gazete/mevzuat, MSB (ata.msb.gov.tr), ATAM (atam.gov.tr, Atatürk Ansiklopedisi), DAB, KHO, TTK (Belleten). `official: true`; metni hakları saklıysa `rights: 'hakki-sakli-olgu'` ve yalnız olgu alınır, cümle ve tam metin asla. Devlet dışı hakları saklı yayınlar teyit kaynağı değildir.
- Vikipedi ≥ 2 kaynaktan en çok biri olabilir; `oldid`'li kalıcı bağlantı, `rights: 'acik-lisans'`, `licence` (maddenin kendi altbilgisindeki). Birbirine dayanan kaynaklar `basedOn` ile işaretlenir. isteataturk.com, add.org.tr ve *Gençler İçin Nutuk* yalnız ipucudur (kural 10-11, K4, K5).
- Rütbe/görev (`data/tenures.json`): unvan kaynakta yazıldığı gibi, dönem adıyla; ezberden liste yok, kaynakta olmayan aralık yazılmaz.
- Olay metni: ≤ 240 karakter, başlık ≤ 60, geçmiş zaman, sıfatsız, kaynakta olmayan bilgi yok, kaynaktan cümle kopyalanmaz.
- Yer adı dönem adıyla. Güncel ad yalnız `modernName` alanında (haritada asla görünmez).
- Rumi/Hicri tarih: `original` aynen; Miladi karşılık önce kaynaktan, yoksa TTK çevirici ile ve `conversion: 'ttk-cevirici'`.
- Taranmış tutanaktan aktarım (A20-A22): stenograf notları ("(Alkışlar)") alınmaz; satır sonu tirelemesi birleştirilir; dönem yazımı aynen. Aktarım kullanıcı onaylayana kadar `verified: false`.
- Not işareti `{…}`: cümle notun önünde bitmişse ("olur. (Alkışlar).") notun sonundaki nokta nota aittir ve süslü parantezin içine yazılır `{(Alkışlar).}`; cümle noktası notun arkasındaysa ("olur (Alkışlar).") dışarıda kalır. Sütun sınırı sayfa işaretine yazılır: `## s.3 sol 0.56`.
- Koordinat: Natural Earth populated places + Wikidata (CC0) (A23). Koordinatı asla bellekten yazma; kaynaktan oku ve değeri kaynaktaki gibi kaydet.
- TBMM "düzenlenmiş" HTML metinleri sadeleştirilmiştir, kullanılmaz (SOURCES §2.4.1).
- `tests/fixtures/` içindeki kayıtlar kurgudur; dosya başında bunu belirten bir alan/not taşır ve asla `data/` altına kopyalanmaz.
