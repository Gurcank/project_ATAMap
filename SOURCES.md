# SOURCES — ATAMap kaynak araştırması

> Erişim tarihi (aksi yazılmadıkça): **2026-10-26**.
> Bu dosya hukuki görüş değildir. "Koşul bulunamadı", yeniden kullanım serbest demek değildir.
> Geliştirme sürecinde güncellenebilir.

## 0. Kullanım kuralları (SPEC §2 ile aynı)

1. **Telif politikası (2026-10-27, SPEC §2.1):** Sitede telifli içerik yok. Atatürk'ün kendi metinleri kamu malı (FSEK m.27, 70 yıl). Yeni transkripsiyonlar, sadeleştirmeler ve editör katkıları telifli sayılır. Bu yüzden tam metin **yalnız aslı Latin harfli** belgelerde gösterilir; Arap harfli asıllar künye kartıyla gösterilir. Eski "günümüz Türkçesi > eski Türkçe > Osmanlıca" önceliği kaldırıldı.
2. **Kaynak türü:** Metinler yalnızca devlet kurumlarının yayınlarından alınır. Devlet kaynağı olmayan yayınlar (ör. özel yayınevleri) yalnızca "ipucu" olarak not edilir, siteye metin girmez. **Ücretli kaynak kullanılmaz** (sıfır bütçe).
2a. **Tarih/yer teyidi (SPEC §2.2, A19):** En az 2 bağımsız, ücretsiz, telifsiz kaynak ya da tarihli birincil belgenin kendisi. Hakları saklı yayınlar (bu dosyadaki ATAM, DAB, MSB kitapları, Belleten, ata.msb.gov.tr) **teyit kaynağı değildir**. Yalnız birincil belgeye ulaşmak için ipucu olarak okunur.
3. **İşaretler** (her kayıtta kullanılır):
   - `doğrulanmadı` — tarih, koordinat, sınır veya metin bir kaynakla eşleştirilemedi. Siteye girmez.
   - `atıf tartışmalı` — belgenin Atatürk'e ait olduğu kaynakta tartışmalı gösterilmiş. Siteye girerse etiketle girer.
   - `izin gerekli` — kaynakta yeniden kullanım izni yazmıyor veya hak saklı. **Bu yayının kendi metni (transkripsiyon, editör katkısı) siteye girmez** (kullanıcı kararı, 2026-10-26). Bu dosyanın §7.1 listesine eklenir. İzin başvurusu şimdilik yapılmayacak (SPEC A13). Bu yayınlarda basılmış, aslı Latin harfli Atatürk metinlerinin durumu için SPEC §2.1'e bakın.
   - `yaklaşık` — kaynak tarihi gün düzeyinde vermiyor.

---

## 1. Devlet kaynakları — özet tablo

| # | Kurum | Ne yayımlıyor (doğrulanan) | Biçim | Çevrimiçi erişim | Yeniden kullanım koşulu | Uygun veri türü |
|---|---|---|---|---|---|---|
| 1.1 | Atatürk Araştırma Merkezi (ATAM) | Kitaplar, e-yayınlar, dergi, ansiklopedi | Kitaba göre değişir | [atam.gov.tr/yayinlar](https://atam.gov.tr/yayinlar/), [e-yayın](https://atam.gov.tr/e-yayin/) | Altbilgi: "Tüm Hakları Saklıdır" ([örnek sayfa](https://atam.gov.tr/e-yayin/)); ayrı kullanım koşulu sayfası **bulunamadı**; "Sorumluluk Reddi" bağlantısı ([atam.gov.tr/?page_id=960](https://atam.gov.tr/?page_id=960)) 404 döndü | Kronoloji (ipucu), telgraf (kitap içi) |
| 1.2 | Devlet Arşivleri Başkanlığı (DAB) | Atatürk belgeleri içeren 4 kitap PDF olarak indirilebilir; Osmanlı Yer Adları sözlüğü | Belge kitapları (biçim kitap başına **doğrulanmadı**) | [Yayınlar](https://www.devletarsivleri.gov.tr/Sayfalar/Yayinlar/Yayinlar.aspx), [BETSİS katalog](https://katalog.devletarsivleri.gov.tr/) | Yayınlar için kullanım koşulu **bulunamadı**. SSS'de yayımlama izni sorusu yok ([SSS](https://www.devletarsivleri.gov.tr/Sayfalar/Sayfa.aspx?icerik=3&h=934515957719AB25DF388559A8E86A767FD99E56CFFDE08AE38B07C4F6D43854)) | Mektup, telgraf, yer adı |
| 1.3 | MSB / Genelkurmay ATASE | *Askerî Tarih Belgeleri Dergisi* sayıları PDF ([ör. sayı 117](https://www.msb.gov.tr/Content/Upload/Docs/askeritariharsiv/ATBD_117.pdf)); ata.msb.gov.tr Atatürk sitesi | Belge transkripsiyonu biçimi **doğrulanmadı** (PDF açılamadı) | [ata.msb.gov.tr](https://ata.msb.gov.tr/Sayfa/SayfaGoster/ataturk-kronolojisi), [MSB Arşivi girişi](https://askeriarsiv.msb.gov.tr/) | ata.msb.gov.tr altbilgi: "Her Hakkı Saklıdır" | Seyahat/olay tarihi (ipucu), askerî telgraf |
| 1.4 | TBMM | Atatürk'ün Meclis açılış konuşmaları 1920-1938, "Düzenlenmiş" ve "Orijinal" tutanak | Orijinal: tarama PDF; Düzenlenmiş: HTML (düzenleme yöntemi **doğrulanmadı**) | [tbmm.gov.tr/ataturkun-meclis-acilis-konusmalari](https://tbmm.gov.tr/ataturkun-meclis-acilis-konusmalari), [TBMM Açık Erişim](https://acikerisim.tbmm.gov.tr/handle/11543/1677) | Sayfada koşul **bulunamadı** | Olay (konuşma tarihi + yeri) |
| 1.5 | Türk Tarih Kurumu (TTK) | *Belleten* dergisi (açık erişim), *Nutuk* PDF | Belleten makalelerinde belge transkripsiyonu; Nutuk eski Türkçe | [belleten.gov.tr](https://belleten.gov.tr/sayfa/hakkinda), [Nutuk PDF](https://www.ttk.gov.tr/karekod/nutuk-cilt-I-IV.pdf) | Belleten: **CC BY-NC 4.0** ([hakkında](https://belleten.gov.tr/sayfa/hakkinda)). Nutuk: yayın hakları TTK'ya ait (PDF künye sayfası, arama özetinden; PDF'i ben açmadım → **doğrulanmadı**) | Telgraf/mektup (makale ekleri) |
| 1.6 | Atatürk Ansiklopedisi (AKDTYK) | *Tamim, Telgraf ve Beyannameleri* hakkında madde | — | [ataturkansiklopedisi.gov.tr](https://ataturkansiklopedisi.gov.tr/bilgi/ataturkun-tamim-telgraf-ve-beyannameleri/) | **Erişilemedi** (bağlantı reddedildi, 2026-10-26) | Künye doğrulama |
| 1.7 | MEB Atatürk sitesi | "Hayatı", "Kronoloji", kaynakça sayfaları | — | [meb.gov.tr/ataturk/Hayati](https://www.meb.gov.tr/ataturk/Hayati/), [kaynakça](https://meb.gov.tr/ataturk/Kaynaklar) | **Erişilemedi** (bağlantı reddedildi) | Kronoloji (ipucu) |

---

## 2. Kaynak ayrıntıları

### 2.1 Atatürk Araştırma Merkezi (ATAM)
- **E-yayınlar:** 8 sayfalık listede ([atam.gov.tr/e-yayin](https://atam.gov.tr/e-yayin/)) Atatürk'ün mektup/telgraf/söylev derlemesi **bulunamadı**. En yakın birincil belge yayını:
  *İlk Defa Yayınlanan Belgelerle Mustafa Kemal Paşa ve 16'ncı Kolordu Komutanlığı (1915-1917)*, Oral Ateş, ISBN 978-975-17-6251-1 — [sayfa](https://atam.gov.tr/e-yayin/ilk-defa-yayinlanan-belgelerle-mustafa-kemal-pasa-ve-16nci-kolordu-komutanligi-1915-1917/), [tam metin PDF](https://atam.gov.tr/wp-content/uploads/2025/09/Mustafa-Kemal-Pasa-ve-16nci-Kolordu-Komutanligi-1915-1917-ORAL-ATES.pdf). Belgelerin transkripsiyon biçimi **doğrulanmadı**. Durum: `izin gerekli` (altbilgi "Tüm Hakları Saklıdır").
- **Kronoloji kaynağı:** *Doğumundan Ölümüne Kaynakçalı Atatürk Günlüğü*, Utkan Kocatürk, 2025 yeni baskı (ilk baskı 1999), ISBN 978-975-17-6173-6. Sayfaya göre her kayıt kaynak gösteriyor. Yalnız satın alınabilir, PDF yok — [sayfa](https://atam.gov.tr/kitaplar/dogumundan-olumune-kadar-kaynakcali-ataturk-gunlugu/). **Tarih ve yer bilgisi için en uygun devlet kaynağı adayı**; metni kopyalanmaz, tarih ve yer kaynak olarak gösterilir.
- **Söylev ve Demeçler / Tamim, Telgraf ve Beyannameleri:** ATAM Ağustos 2025 bülteni, *Söylev ve Demeçleri* ile *Tamim, Telgraf ve Beyannameleri*nin özel baskısını listeliyor ([bülten PDF](https://atam.gov.tr/wp-content/uploads/2025/09/ATAM-AGUSTOS-BULTENI-2025-12.09.2025.pdf)). ATAM sitesinde çevrimiçi tam metin **bulunamadı**. E-mağaza: emagaza-atam.ayk.gov.tr (bülten içinden, açılmadı).
- **Tamim, Telgraf ve Beyannameleri künyesi (ikincil bilgi):** Türk İnkılap Tarihi Enstitüsü, *Söylev ve Demeçleri* serisi IV. cilt, ilk baskı 1964, derleyen Nimet Arsan. Belleten makalesine göre derleme eksiksiz değildir — [Belleten tam metin](https://belleten.gov.tr/tam-metin/1908/tur). Durum: `izin gerekli`.

### 2.2 Devlet Arşivleri Başkanlığı (DAB)
[Yayınlar sayfasında](https://www.devletarsivleri.gov.tr/Sayfalar/Yayinlar/Yayinlar.aspx) "İndir" bağlantısıyla sunulan Atatürk kitapları (bağlantılar sayfa HTML'inden çıkarıldı; PDF'lerin içi açılmadı):

| Kitap | Yıl / sayfa | İndirme |
|---|---|---|
| *Atatürk ile İlgili Arşiv Belgeleri (1911-1921)* | 1982, XII+206 s. | [fileId=1](https://www.devletarsivleri.gov.tr/cdn/file/download?fileId=1) |
| *Belgelerle Mustafa Kemal Atatürk ve Türk-Bulgar İlişkileri (1913-1938)* | 2002, LXXVII+957 s. | [fileId=218](https://www.devletarsivleri.gov.tr/cdn/file/download?fileId=218) |
| *Belgelerle Mustafa Kemal Atatürk (1916-1922)* | 2003, XVIII+670 s. | [fileId=87](https://www.devletarsivleri.gov.tr/cdn/file/download?fileId=87) |
| *Osmanlı Belgelerinde Millî Mücadele ve Mustafa Kemal Atatürk* | 2007, XXX+671 s. | [fileId=113](https://www.devletarsivleri.gov.tr/cdn/file/download?fileId=113) |

- **Biçim:** Her kitabın belgeyi tıpkıbasım + transkripsiyon + günümüz Türkçesi olarak verip vermediği **doğrulanmadı**. Bir sonraki adımda PDF'ler açılıp kitap başına not edilecek.
- **Uygunluk:** Sofya ataşeliği (1913-14) ve 1916-1922 dönemi mektup/telgrafları için en güçlü aday.
- **Koşul:** Yayınlar için açık lisans **bulunamadı** → varsayılan durum `izin gerekli`. İletişim: dab@devletarsivleri.gov.tr (SSS sayfası).
- **Arşiv belgeleri (yayın dışı):** *Arşivlerden Yararlanma Usul ve Esasları Hakkında Yönetmelik*, Resmî Gazete 02.10.2021, sayı 31616 ([metin, Lexpera](https://www.lexpera.com.tr/mevzuat/yonetmelikler/arsivlerden-yararlanma-usul-ve-esaslari-hakkinda-yonetmelik-4)). Başkanlık erişim ve kopya vermeyi sınırlayabilir. Yayımlama izniyle ilgili madde **doğrulanmadı**.
- **Yer adları:** *Osmanlı Yer Adları*, Tahir Sezen, DAB yayın no. 26, genişletilmiş 2. baskı, Ankara 2017 — [PDF](https://www.devletarsivleri.gov.tr/cdn?fileId=26). Kapsamı (Rumeli/Anadolu, dönem) **doğrulanmadı**.

### 2.3 MSB / Genelkurmay ATASE
- *Askerî Tarih Belgeleri Dergisi* (eski adı *Harp Tarihi Vesikaları Dergisi*), ISSN 1300-0241, 1952'den beri. Bazı sayılar msb.gov.tr'de PDF: [100](https://www.msb.gov.tr/Content/Upload/Docs/askeritariharsiv/ATBD_100.pdf), [117](https://www.msb.gov.tr/Content/Upload/Docs/askeritariharsiv/ATBD_117.pdf), [118](https://www.msb.gov.tr/Content/Upload/Docs/askeritariharsiv/ATBD_118.pdf), [129](https://www.msb.gov.tr/Content/Upload/Docs/askeritariharsiv/ATBD_129.pdf), [133](https://www.msb.gov.tr/Content/Upload/Docs/askeritariharsiv/ATBD_133.pdf), [139](https://www.msb.gov.tr/Content/Upload/Docs/askeritariharsiv/ATBD_139.pdf), [144/1](https://www.msb.gov.tr/Content/Upload/Docs/askeritariharsiv/ATBD_144_1_Cilt.pdf). Sayı listesi sayfası **bulunamadı**; ATBD_100.pdf yönlendirme döngüsü nedeniyle açılamadı.
- [ata.msb.gov.tr kronoloji](https://ata.msb.gov.tr/Sayfa/SayfaGoster/ataturk-kronolojisi): 1881-1938, yıllara göre; tarih hassasiyeti gün/ay/yıl arasında değişiyor; kayıt başına kaynak **yok**, sayfa sonunda genel kaynakça var. **Yalnız ipucu** olarak kullanılır.
- "Mektup" veya "Telgraf" bölümü **yok** ([Belgeler](https://ata.msb.gov.tr/Sayfa/SayfaGoster/belgelerle-ataturk)). Altbilgi: "Her Hakkı Saklıdır".
- "ATASE Harp Tarihi Belgeleri Dergisi" adlı bir yayın **bulunamadı**. Doğru ad: *Askerî Tarih Belgeleri Dergisi*.

### 2.4 TBMM
- [Atatürk'ün Meclis Açılış Konuşmaları](https://tbmm.gov.tr/ataturkun-meclis-acilis-konusmalari): I-V. Dönem, 1920-1938. Örnek: [24 Nisan 1336 orijinal PDF](https://cdn.tbmm.gov.tr/TbmmWeb/tarihce/ataturk_konusma/24_04_1336.pdf), [düzenlenmiş HTML](https://cdn.tbmm.gov.tr/TbmmWeb/tarihce/ataturk_konusma/1d1yy1.htm).
- [Önsöz PDF](https://cdn.tbmm.gov.tr/TbmmWeb/tarihce/ataturk_konusma/kitaponsoz.pdf) tarama görüntüsü, metni okunamadı → "düzenlenmiş" metnin nasıl hazırlandığı **doğrulanmadı**.
- [TBMM Açık Erişim — Zabıt Ceridesi Devre 1](https://acikerisim.tbmm.gov.tr/handle/11543/1677): kayıt açıklamasına göre eski harfli.
- Koşul: sayfada **bulunamadı**.
- Uygunluk: "Olay" kaydı (tarih + Ankara/TBMM). Konuşma metni mektup/telgraf değildir; **site kapsamına alınıp alınmayacağı açık karardır** (SPEC §9).

### 2.5 Türk Tarih Kurumu
- *Belleten*: "Bu dergideki çalışmalar Creative Commons Atıf-GayriTicari 4.0 Uluslararası (CC BY-NC 4.0) ile lisanslanmıştır." — [belleten.gov.tr/sayfa/hakkinda](https://belleten.gov.tr/sayfa/hakkinda). Makalelerde yayımlanan Atatürk telgraf/mektup transkripsiyonları **bu lisansla kullanılabilecek tek doğrulanmış açık kaynak**. Koşullar: atıf + ticari olmayan kullanım. Örnek: Atatürk'ün toplanmamış telgraf ve mektuplarını yayımlayan makale — [tam metin 1908](https://belleten.gov.tr/tam-metin/1908/tur).
  - Dikkat: Makalenin lisansı, içindeki belge transkripsiyonunun da CC BY-NC olduğu anlamına gelir mi? Hukuki yorum yapılmadı → kayıt başına `izin gerekli` mi `CC BY-NC` mi olacağı **açık karar**.
- *Nutuk* TTK PDF: [nutuk-cilt-I-IV.pdf](https://www.ttk.gov.tr/karekod/nutuk-cilt-I-IV.pdf). Arama özetine göre künyede yayın hakları TTK'ya ait. Durum: `izin gerekli`.

---

## 3. Tarihî sınır veri setleri

### 3.1 Historical Basemaps (aourednik)
- Depo: [github.com/aourednik/historical-basemaps](https://github.com/aourednik/historical-basemaps). Lisans: **GPL-3.0** ([LICENSE](https://github.com/aourednik/historical-basemaps/blob/master/LICENSE)). Veriye GPL uygulanması türev dağıtımda copyleft yükümlülüğü doğurabilir. **Açık karar.**
- 1881-1938 aralığındaki dosyalar ([geojson klasörü](https://github.com/aourednik/historical-basemaps/tree/master/geojson)): `world_1880`, `world_1900`, `world_1914`, `world_1920`, `world_1930`, `world_1938` (+ çevrede `1878`, `1945`).
- README: "work in progress: verify the maps by comparison to other sources before using in academic work." `BORDERPRECISION` alanı: 1 yaklaşık, 2 orta, 3 uluslararası hukukla belirlenmiş — [README](https://github.com/aourednik/historical-basemaps#polygons).
- Bölgedeki ad gözlemleri ([index.json](https://github.com/aourednik/historical-basemaps/blob/master/index.json)):
  - 1920: "Ottoman Sultanate", "Syria (France)", "Mesopotamia (GB)", "Libya (IT)".
  - 1930: hem "Republic of Turkey" hem "Turkey" var (olası tutarsızlık).
  - 1938: Irak hâlâ "Mesopotamia (GB)". CShapes'e göre Irak 1932-10-03'ten itibaren ayrı devlet → **tutarsızlık**.
- Sonuç: Yalnız anlık görüntü (snapshot) veriyor, değişiklik tarihi vermiyor. Bizim "değişiklik tarihi" modelimize doğrudan uymuyor.

### 3.2 CShapes 2.0 (ETH Zürich ICR)
- [icr.ethz.ch/data/cshapes](https://icr.ethz.ch/data/cshapes/): "borders and capitals of independent states and dependent territories from 1886 to 2019". CShapes-Europe 1816'dan başlıyor.
- Lisans: **CC BY-NC-SA 4.0** (aynı sayfa).
- Biçimler: CSV, TXT, GeoJSON, Shapefile, SQL, R paketi; [Codebook PDF](https://icr.ethz.ch/data/cshapes/CShapes-2.0_Codebook.pdf).
- **Kayıtlar başlangıç/bitiş tarihi taşıyor.** Bu, bizim modelimize en yakın açık veri. [`CShapes-2.0.txt`](https://icr.ethz.ch/data/cshapes/CShapes-2.0.txt) dosyasından (sütunlar `cntry_name`, `gwcode`, `gwsdate`, `gwedate`) çıkardığım bölge kayıtları (gwsdate → gwedate):

| Varlık (gwcode) | Geçerlilik aralıkları |
|---|---|
| Turkey (Ottoman Empire) (640) | 1886-01-01→1912-10-17 · 1912-10-18→1912-12-31 · 1913-01-01→1913-05-29 · 1913-05-30→1914-11-02 · 1914-11-03→1918-03-02 · 1918-03-03→1918-10-29 · 1918-10-30→1920-04-25 · 1920-04-26→1923-10-13 · 1923-10-14→2019-12-31 |
| Bulgaria (355) | 1886-01-01→1913-08-09 · 1913-08-10→1918-05-06 · 1918-05-07→1919-11-26 · 1919-11-27→1940-09-06 |
| Greece (350) | 1886-01-01→1913-08-09 · 1913-08-10→1919-11-26 · 1919-11-27→2019-12-31 |
| Serbia (340) | 1886-01-01→1913-08-09 · 1913-08-10→1915-10-01 · 1915-10-02→1918-11-30 |
| Montenegro (341) | 1886-01-01→1913-08-09 · 1913-08-10→1915-07-01 · 1915-07-02→1918-11-30 |
| Albania (339) | 1913-01-01→1914-03-06 · 1914-03-07→1920-02-10 · 1920-02-11→2019-12-31 |
| Yugoslavia (345) | 1918-12-01→1919-09-09 · 1919-09-10→1920-06-03 · 1920-06-04→1991-11-19 |
| Libya (620) | 1912-10-18→1919-09-11 · 1919-09-12→1925-12-05 · 1925-12-06→1934-07-19 · 1934-07-20→1943-05-12 |
| Syria (652) | 1920-04-26→1920-12-23 · 1920-12-24→1922-12-01 · 1922-12-02→1945-12-31 |
| Iraq (645) | 1920-04-26→1920-12-23 · 1920-12-24→1922-12-01 · 1922-12-02→1932-09-22 · 1932-09-23→1932-10-02 · 1932-10-03→2019-12-31 |
| Egypt (651) | 1886-01-01→1899-01-18 · 1899-01-19→1914-12-17 · 1914-12-18→1922-02-27 · 1922-02-28→1925-12-05 · 1925-12-06→1967-06-09 |
| Italy/Sardinia (325) | 1886-01-01→1919-09-09 · 1919-09-10→2019-12-31 |

- Bu tarihlerin hangi antlaşma/olaya karşılık geldiği veri setinde metin olarak yok. Eşleştirme codebook'tan yapılacak → **doğrulanmadı**.
- **Ticari olmayan kullanım şartı** (NC). Sitenin ticari olup olmadığı **açık karar**.

### 3.3 Euratlas
- [euratlas.net/history/europe/gis.html](https://euratlas.net/history/europe/gis.html): yüzyıl başı anlık görüntüler (1800 kesin, 1900 sayfada soru olarak geçiyor). Ücretli lisans (ör. 1800 için basit lisans 150 €). Değişiklik tarihi modeli yok → **uygun değil**.

### 3.4 Boşluk listesi (1881-1938)

Aşağıdaki dönemler ve değişiklikler iki açık veri setinde de ya hiç yok ya da kaba temsil ediliyor. Olayların **adları** liste olarak verilmiştir. **Tarihleri ve geometrileri bu dosyada doğrulanmadı**; her biri `BorderChange` kaydı oluşturulurken bir kaynakla doğrulanacak.

| Dönem | Boşluk | Gözlem kaynağı |
|---|---|---|
| 1881-1885 | CShapes 1886'da başlıyor. HB'de yalnız 1880 anlık görüntüsü var | §3.1, §3.2 |
| 1886-1912 | HB'de yalnız 1900 ve 1914 var. Ara değişiklikler (ör. Girit'in statüsü, 1908 Bosna-Hersek ilhakı, 1908 Bulgaristan bağımsızlığı) HB'de tarihli değil. CShapes'te Osmanlı poligonu 1886→1912 arasında değişmiyor → **doğrulanmalı** | §3.2 tablosu |
| 1911-1912 | Trablusgarp: CShapes'te Libya 1912-10-18'de başlıyor. 1911 savaş/işgal dönemi temsil edilmiyor | §3.2 |
| 1918-1923 | **İşgal bölgeleri** (İstanbul, İzmir ve çevresi, Güney/Kilikya, Doğu cephesi) iki veri setinde de ayrı poligon olarak **bulunamadı**. Sevr (imzalanmış, yürürlüğe girmemiş) temsil edilmiyor | §3.2 listesinde işgal kaydı yok |
| 1920-1923 | CShapes'te Osmanlı/Türkiye poligonu 1920-04-26→1923-10-13 arasında tek. 1921 doğu ve güney sınır antlaşmaları ayrı kayıt olarak görünmüyor | §3.2 |
| 1923-1938 | CShapes'te Türkiye poligonu 1923-10-14'ten sonra değişmiyor; Musul meselesinin çözümü ve Hatay'ın 1937-38 statüsü temsil edilmiyor. HB'de yalnız 1930 ve 1938 var | §3.2 |
| Tüm aralık | Kuzey Afrika, Orta Avrupa ve Kafkasya (Atatürk seyahatleri için gerekli komşular) bu araştırmada kayıt kayıt incelenmedi → **doğrulanmadı** | — |

---

## 4. Dönem yer adları
- **DAB, Osmanlı Yer Adları** (§2.2) — devlet kaynağı; kapsam **doğrulanmadı**.
- **World Historical Gazetteer**: "public" işaretli veri setleri CC BY 4.0 ([kılavuz](https://whgazetteer.org/tutorials/guide/)). 19. yüzyıl Osmanlı yer adları için uygun bir veri seti **bulunamadı**.
- **19th Century Ottoman Gazetteer** (Koç Üniversitesi): erişim durumu "CLOSED" — [kayıt](https://research.hub.ku.edu.tr/entities/data/bc5e147f-52b2-4128-a28d-40854439750e/full) → kullanılamaz.
- **Historical Basemaps `places.geojson`**: README'ye göre taslak ve eksik. Lisans GPL-3.0.
- Sonuç: Yer adı katmanı elle derlenecek. Her ad DAB *Osmanlı Yer Adları* ya da kullanılan belge yayınındaki yazımla kaynaklanacak.

---

## 5. Harita altlığı ve fontlar

| Varlık | Kaynak | Lisans (kaynak linkiyle) | Not |
|---|---|---|---|
| Natural Earth (raster + vektör) | [naturalearthdata.com](https://www.naturalearthdata.com/) | Kamu malı: "All versions of Natural Earth raster + vector map data found on this website are in the public domain." — [terms](https://www.naturalearthdata.com/about/terms-of-use/) | Etiketsiz fiziksel altlık için önerilen aday (sepya tonlanabilir) |
| OpenFreeMap | [openfreemap.org](https://openfreemap.org/) | Proje MIT; atıf zorunlu; veri OpenStreetMap | Güncel etiket ve yol içerir; gizlemek gerekir. Yedek aday |
| MapLibre GL JS | [npm](https://www.npmjs.com/package/maplibre-gl) | BSD-3-Clause (npm registry) | — |
| Old Standard TT | [google/fonts ofl/oldstandardtt](https://github.com/google/fonts/tree/main/ofl/oldstandardtt) | OFL (METADATA.pb) | latin-ext alt kümesi var (Türkçe) |
| Alegreya Sans | [google/fonts ofl/alegreyasans](https://github.com/google/fonts/tree/main/ofl/alegreyasans) | OFL | latin-ext |
| EB Garamond | [google/fonts ofl/ebgaramond](https://github.com/google/fonts/tree/main/ofl/ebgaramond) | OFL | latin-ext |
| Courier Prime | [google/fonts ofl/courierprime](https://github.com/google/fonts/tree/main/ofl/courierprime) | OFL | latin-ext |
| (elendi) IM Fell English / DW Pica | [Google Fonts metadata](https://fonts.google.com/metadata/fonts) | — | Yalnız `latin` alt kümesi; ğ/ş/İ desteği yok sayılır → kullanılmaz |

Alt küme bilgisi [fonts.google.com/metadata/fonts](https://fonts.google.com/metadata/fonts) üzerinden alındı. `latin-ext` alt kümesinin Türkçe glifleri içerdiği bilinen bir durum, ancak her font için glif glif **doğrulanmadı**. Kurulumda "ğĞıİşŞçÇöÖüÜ" ile test edilecek.

---

## 6. Teknik sürüm notları (yalnız not — ARCHITECTURE'da kesinleşecek)

npm registry'den alındı, 2026-10-26:

| Paket | Son sürüm (yayım) | Peer / engine | Lisans |
|---|---|---|---|
| [next](https://www.npmjs.com/package/next) | 16.4.3 (2026-10-23) | react `^18.2.0 \|\| ^19.0.0`; node `>=20.9.0` | MIT |
| [react](https://www.npmjs.com/package/react) / react-dom | 19.3.1 (2026-10-14) | — | MIT |
| [maplibre-gl](https://www.npmjs.com/package/maplibre-gl) | 6.16.0 (2026-10-25) | node `>=16.14.0` | BSD-3-Clause |
| [motion](https://www.npmjs.com/package/motion) | 14.6.0 (2026-10-22) | react `^18 \|\| ^19` | MIT |
| [typescript](https://www.npmjs.com/package/typescript) | 7.0.2 (2026-07-08) | — | — |

- Peer bağımlılıklarına göre next 16 + react 19 + motion 14 **uyumlu görünüyor**. Kurulumla **test edilmedi**.
- maplibre-gl'in React sürümüyle doğrudan bağı yok (peer yok).
- next@16.4.3 ve maplibre-gl@6.16.0 birkaç günlük. SPEC'in sürüm kuralına göre ARCHITECTURE aşamasında en az iki haftalık sürüme sabitlenmeleri önerilir.
- TypeScript 7 ile Next.js uyumu **doğrulanmadı**.

---

## 7. Listeler

### 7.1 İzin gerekli (siteye girmez)
Her satırın linki ve gerekçe kaynağı §2'deki ilgili alt başlıktadır (ATAM §2.1, DAB §2.2, MSB §2.3, TTK §2.5).

| Yayın | Kurum | Gerekçe |
|---|---|---|
| *Tamim, Telgraf ve Beyannameleri* (Söylev ve Demeçleri IV) | ATAM | Çevrimiçi tam metin yok; hak saklı |
| *Atatürk'ün Söylev ve Demeçleri* | ATAM | Aynı |
| *Mustafa Kemal Paşa ve 16'ncı Kolordu Komutanlığı* | ATAM | "Tüm Hakları Saklıdır" |
| DAB'ın 4 Atatürk kitabı (§2.2) | DAB | Açık lisans bulunamadı |
| *Askerî Tarih Belgeleri Dergisi* | MSB/ATASE | Koşul bulunamadı |
| *Nutuk* | TTK | Yayın hakları TTK'da (doğrulanmadı) |
| Belleten makale ekleri | TTK | CC BY-NC 4.0; belge transkripsiyonuna uygulanıp uygulanmadığı açık karar |

### 7.2 Bulunamadı / erişilemedi
- ATAM için ayrı kullanım koşulu veya telif sayfası. "Sorumluluk Reddi" sayfası 404.
- ATAM sitesinde *Söylev ve Demeçler* veya *Tamim, Telgraf ve Beyannameleri* çevrimiçi tam metni.
- "ATASE Harp Tarihi Belgeleri Dergisi" adı (doğru ad: *Askerî Tarih Belgeleri Dergisi*). ATBD sayı listesi sayfası.
- DAB yayınları için kullanım/telif koşulu.
- ataturkansiklopedisi.gov.tr ve meb.gov.tr/ataturk (bağlantı reddedildi).
- 19. yüzyıl Osmanlı yer adları için açık lisanslı gazetteer.
- İşgal bölgeleri (1918-1923) için açık tarihî sınır verisi.
- Atatürk'ün seyahatleri için gün düzeyinde, kaynak gösteren, açık lisanslı devlet kaynağı (yalnız satın alınabilir *Kaynakçalı Atatürk Günlüğü* var).
- Cumhurbaşkanlığı / Anıtkabir kaynaklı çevrimiçi mektup-telgraf yayını.
