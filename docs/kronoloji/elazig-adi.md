# Elazığ'ın dönem adı

> Durum: **onay bekliyor.** Yeni kaynak `resmi-gazete-3785` `verified: false`. Onaya kadar Elazığ yer kaydı ve ona bağlı 6 kayıt derlemeye girmiyor (kural 1).
> Araştırma tarihi: 2026-11-16.

## Bulgu

| Kaynak | Ne diyor |
|---|---|
| T.C. Resmî Gazete, 17 Kânunuevvel 1937, sayı 3785 (resmî, tarihli birincil belge) | 10/12/1937 tarihli ve 7806 sayılı Kararname: "Elâziz beldesi adının Elazığ olarak değiştirilmesi" İcra Vekilleri Heyeti'nin 10/12/1937 tarihli toplantısında onanmış. İmza: Reisicumhur K. Atatürk |
| Türkçe Vikipedi, «Elazığ» (sürüm 37834682) | Aynı kararnameyi aktarıyor. Resmî adın 1862'den beri Ma'mûretü'l-Azîz olduğunu, halkın kısaca "El-Azîz" dediğini yazıyor |
| Nutuk, 1929 İngilizce baskı | 1919 telgraflarında "Vali of El Aziz" (çeviri) |

- PDF kullanıcının izniyle indirildi ve depoya konmadı (2.624.496 bayt, sha256 `bef6e62e…25638`).
- Wikidata öğesinde (Q2963425) ad için tarihli bir ifade yok.

## Kararlar (kullanıcı, 2026-11-16)

- **1919:** İki bağımsız kaynakla kesinleşen bir ad yok. "Şimdilik Elazığ kalsın."
- **Elâziz:** Yalnız kararnameden önceki Kasım 1937 gezisinde gösterilsin.

## Kayıt

| Ad | Geçerlilik | Kaynak |
|---|---|---|
| Elazığ (tarihsiz) | Dönem adı kaynaklı olmayan her tarih (1919 dahil) | MSB «Yurt Gezileri» |
| Elâziz | 16 Kasım 1937 – 10 Aralık 1937 | Bitiş: Resmî Gazete 3785. **Başlangıç kaynaklı değil:** MSB'ye göre gezinin ilk günü, kullanıcı kararı |
| Elazığ | 10 Aralık 1937'den itibaren | Resmî Gazete 3785 |

## Kod

- `placeNameAt` (src/timeline/status.ts): Tarihli bir ad o günü kesin kapsıyorsa o ad kullanılır.
- Kapsadığı kesin değilse (örneğin ay düzeyinde bir tarih) ad gösterilmez.
- Hiçbir tarihli ad o güne düşmüyorsa tarihsiz ad kullanılır.
- Harita etiketi ve ekran okuyucu metni artık bu kuralla adımın tarihindeki adı yazıyor; önceden her zaman ilk adı yazıyordu.

## Açık

- **Kasım 1937 olay metinleri:** MSB'nin yazımıyla "Elazığ" diyor ("Trenle Elazığ'a gitti", "Elazığ'dan ayrıldı"). Harita ve durum kartuşu "Elâziz" gösterirken metinler bugünkü adı kullanıyor.
- **Elâziz'in başladığı tarih:** Kaynak bulunursa geçerlilik geriye uzatılabilir.
