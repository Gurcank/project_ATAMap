# Kronoloji, parti 1: Selanik'te doğum ve okullar

> Kapsam: doğumdan Manastır'a gidişe kadar (dönem sınırları 2026-11-14 önerisi; 12 parti 1881-1938'i boşluksuz kapsar).
> Durum: **onaylandı (2026-11-14).** Doğum ve Selanik sitede; tek kaynaklı adaylar sitede değil. Bütün kayıtlar `verified: false`; hiçbiri sitede değil.
> Araştırma tarihi: 2026-11-14. Kaynak kuralı: SPEC §2.2 (A19, K4).

## Kullanılan kaynaklar

| Kimlik | Kaynak | Not |
|---|---|---|
| `vikipedi-tr-ataturk-38564203` | Vikipedi, «Mustafa Kemal Atatürk», [sürüm 38564203](https://tr.wikipedia.org/w/index.php?title=Mustafa_Kemal_Atat%C3%BCrk&oldid=38564203), CC BY-SA 4.0 (madde altbilgisi) | Bu bölümün dayanakları çoğunlukla telifli kitaplar (Aydemir, *Tek Adam*; Mango) |
| `wikidata-q5152-r2569089775` | Wikidata Q5152, [revizyon 2569089775](https://www.wikidata.org/wiki/Special:EntityData/Q5152.json?revision=2569089775), CC0 | Yalnız dayanağı olan ifadeler kullanıldı (P569, P19). Okul ifadelerinin (P69) dayanağı yok |
| `wikidata-q17151-r2566115438` | Wikidata Q17151 (Selanik), P625, [revizyon 2566115438](https://www.wikidata.org/wiki/Special:EntityData/Q17151.json?revision=2566115438), CC0 | Koordinat |
| `naturalearth-ne50m-populated-places` | Natural Earth ne_50m_populated_places, commit 117488dc | Selanik 110m dosyasında yok |
| `wikisource-eb1922-mustapha-kemal` | Encyclopædia Britannica 1922, «Mustapha Kemal», [Vikikaynak](https://en.wikisource.org/w/index.php?title=1922_Encyclop%C3%A6dia_Britannica/Mustapha_Kemal&oldid=16093733), kamu malı | Kayıtta kullanılmadı; yalnız çelişkiyi belgeliyor |

Denenip kullanılamayanlar: ABD Kongre Kütüphanesi *Turkey: A Country Study* sayfası bot doğrulaması istedi, geçilmedi. Atatürk Ansiklopedisi, ata.msb.gov.tr ve atam.gov.tr yalnız ipucudur ve okunmadı.

## Tablo

**`data/` altına girenler** (iki kaynak var, `verified: false`):

| Tarih | Yer | Olay | Kaynak 1 | Kaynak 2 | Belirsizlik / çelişki |
|---|---|---|---|---|---|
| 19 Mayıs 1881 | Selanik | Doğum (`dogum-selanik`, `person.json`) | Vikipedi | Wikidata | **Çelişki.** İki kaynak da 19 Mayıs'ı gerçek doğum günü olarak vermiyor. Vikipedi'ye göre rumî 1296 (miladî 1880-1881), günü bilinmiyor; 19 Mayıs'ı kendisi kabul etmiş. Wikidata'nın tercihli değeri 1881 (en erken 1879, en geç 1881). 1881-05-19 değeri yalnız "conventional date" niteleyicisiyle duruyor. Vikipedi'nin aktardığı Sakaoğlu iddiası 4 Ocak 1879. 1922 Britannica 1879 diyor |
| — | Selanik | Yer koordinatı (`selanik`) | Wikidata (40.640278, 22.935556) | Natural Earth (40.698052, 22.883055) | İki nokta arası yaklaşık **7,8 km**. Ankara'da fark 2,2 km'ydi |
| — | Selanik | Dönem adı | Vikipedi ("Selanik") | Wikidata P1810 ("Selânik") | Yazım farkı: â |

**Yalnız aday olarak kalanlar** (ikinci bağımsız telifsiz kaynak yok; kural 5 derlemeyi durdurduğu için `data/`'ya girmedi):

| Tarih | Yer | Olay | Kaynak 1 | Kaynak 2 | Belirsizlik / çelişki |
|---|---|---|---|---|---|
| tarih yok | Selanik | Önce Hafız Mehmet Efendi'nin mahalle mektebine, birkaç gün sonra Şemsi Efendi Mektebi'ne başladı | Vikipedi | — | Tarih yok. Wikidata P69'da Şemsi Efendi Mektebi var ama dayanaksız |
| 1888 | yer yok | Babası Ali Rıza Efendi öldü | Vikipedi | — | Wikidata Q2372811 P570 = 1888, ama Rusça Vikipedi'den aktarılmış: bağımsız değil |
| tarih yok | Rapla Çiftliği | Bir süre dayısı Hüseyin'in çiftliğinde kaldı, sonra Selanik'e döndü | Vikipedi | — | Tarih ve koordinat yok |
| tarih yok | Selanik | Mülkiye Rüştiyesi'ne kaydoldu | Vikipedi | — | Tarih yok |
| 1893 | Selanik | Selanik Askerî Rüştiyesi'ne girdi | Vikipedi | — | — |
| tarih yok | Selanik | Okulda "Kemal" adını aldı | Vikipedi | — | **Çelişkili.** Vikipedi adı kimin, neden verdiği konusunda üç ayrı görüş aktarıyor (Afet İnan, Ali Fuat Cebesoy, Andrew Mango) |
| 1895 | Selanik | Askerî Rüştiye'den sınıf dördüncüsü olarak mezun oldu | Vikipedi | — | — |
| 1896 | Selanik → Manastır | Manastır Askerî İdadisi'ne kaydoldu | Vikipedi | — | Parti 2'nin ilk olayı. Wikidata P69 başlangıç 1896, ama dayanaksız |

**Bu partide olmayanlar:**
- **Rütbe/görev:** öğrencilik dönemi; kayıt yok.
- **Belge:** açık kaynakta bu döneme ait Atatürk belgesi bulunamadı.
- **Seyahat:** kaynaklı güzergâh yok.
- **Aile olayları:** annesinin yeniden evlenmesi gibi, Atatürk'ün kendisine ait olmayan olaylar alınmadı.

## Kararlar

- **2026-11-14, doğum tarihi:** kullanıcı kararıyla 19 Mayıs 1881 kalır. Kayıt `conventional: true` ile "kabul edilen tarih" olarak işaretli (SPEC A25). İki kaynak bu tarihi kabul edilen tarih olarak destekliyor. Arayüzde rozet yok.
- **2026-11-14, Selanik:** 7,8 km koordinat farkı kabul edildi, Wikidata değeri saklanır. Dönem adı "Selanik".
- **2026-11-14:** parti onaylandı; dört kaynak `verified: true`. 1922 Britannica kayıtta kullanılmadığı için `verified: false` kaldı.

## Genel sonuç

Çocukluk ve okul dönemi için telifsiz ve bağımsız ikinci kaynak bulmak zor. Vikipedi'nin dayanakları telifli kitaplar; Wikidata'nın okul ifadelerinin dayanağı yok ya da Vikipedi'den aktarılmış. Bu kural altında parti 1'den siteye en fazla doğum kaydı ve Selanik girebilir.

## K5 yeniden taraması (2026-11-14)

Kural değişti: resmî devlet kaynağı tek başına yeter (SPEC A27). Kaynak: MSB Atatürk Sitesi, «Atatürk Kronolojisi», 1881-1904 bölümü (`msb-kronoloji-1881-1904`, `official: true`, `rights: 'hakki-sakli-olgu'`; yalnız olgu). Durum: **onay bekliyor**, kayıtlar `verified: false`.

| Tarih | Yer | Olay | Kaynak 1 | Kaynak 2 | Belirsizlik |
|---|---|---|---|---|---|
| 1886 | Selanik | İlk öğrenimine başladı (mahalle mektebi, sonra Şemsi Efendi Okulu) | MSB | — (Vikipedi olayı anlatıyor, yıl vermiyor) | Yıl düzeyinde. Şehir MSB'de yok; Vikipedi'de Selanik |
| 1888 | — | Babası Ali Rıza Efendi öldü | MSB | Vikipedi | Yer kaynakta yok |
| 1893 | Selanik | Mülkiye Rüştiyesi'nden ayrılıp Selanik Askerî Rüştiyesi'ne girdi | MSB | Vikipedi | — |

**Hâlâ girmeyenler:**
- 1895 mezuniyet: yalnız Vikipedi; MSB'de yok.
- "Kemal" adı: Vikipedi'de çelişkili, MSB'de yok.
- Rapla Çiftliği: tarih yok.
- Mülkiye Rüştiyesi'ne giriş: iki kaynakta da tarih yok; 1893 olayının metninde geçiyor.

**Not:** MSB doğumu yalnız "1881" ve "Selanik" olarak veriyor. Mevcut doğum kaydı (19 Mayıs 1881, kabul edilen tarih) bununla çelişmiyor.
