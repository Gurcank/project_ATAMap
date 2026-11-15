# Kapsam raporu (2026-11-15)

K5 yeniden taraması bitti (parti 1-10b). Sitede 198 olay, 31 yer, 1 seyahat, 20 rütbe/görev, 20 belge, 0 sınır değişikliği var. Bu rapor kullanıcının 2026-11-15'teki sorularını cevaplıyor.

## 1. Vikipedi «Mustafa Kemal Atatürk kronolojisi» ile karşılaştırma

Sayfa: [Mustafa Kemal Atatürk kronolojisi](https://tr.wikipedia.org/wiki/Mustafa_Kemal_Atat%C3%BCrk_kronolojisi), sürüm 36076580. **Maddenin tepesinde "Bu madde hiçbir kaynak içermemektedir" şablonu var.** Bu yüzden kural 10'a göre ancak ikinci kaynak olabilir; tek başına hiçbir kaydı doğrulayamaz.

Sayfada iki bölüm var: ana liste (65 madde) ve "Yurt gezileri" (yaklaşık 50 madde).

**Ana liste (65 madde):**

| Durum | Sayı | Örnekler |
|---|---|---|
| Sitede, aynı ya da uyumlu tarihle | ~39 | Doğum, Harp Akademisi, Kolağası, Sofya, 19. Tümen, 25 Nisan 1915, Muş-Bitlis, 19 Mayıs, Amasya, kongreler, TBMM, Sakarya, Büyük Taarruz, evlilik, İktisat Kongresi, Cumhuriyet, soyadı, ölüm |
| Sitede, ama resmî kaynağın farklı tarihiyle | ~11 | Manastır İdadisi (V: 1895, MSB: 1896), Harbiye (V: 18 Mart, MSB ve Vikipedi ana maddesi: 13 Mart 1899), Vatan ve Hürriyet (V: Ekim 1906, MSB: 1905), 3. Ordu (V: Eylül, MSB: 13 Ekim 1907), Hareket Ordusu (V: 13 Nisan, MSB: 15/16 Nisan), 16. Kolordu, TBMM ikinci başkanlığı (V: 11, MSB: 13 Ağustos), Halk Fırkası (V: 9, MSB: 11 Eylül), Türk Tarihi Tetkik Cemiyeti (V: 15, MSB: 12 Nisan) |
| Bilerek alınmadı (kanun ya da Atatürk'ün kendi eylemi değil; kullanıcı kararları) | ~9 | Saltanat, Halifelik, Teşkilat-ı Esasiye, Terakkiperver Fırka, şapka, takvim, harf kanunu, Serbest Fırka, Hatay |
| Sitede yok | ~6 | "Kemal" adının verilişi (tarihsiz), 9 Ocak 1912 Tobruk Savaşı (resmî kaynakta yok), **28 Mayıs 1919 Havza Genelgesi** (MSB kronolojisinde yok), Sakarya'nın başlangıcı (23 Ağustos 1921), Kocatepe (yer bağlanamadı), 8 Kasım 1934 Yalova dönüşü |

**Yurt gezileri bölümü (~50 madde):** sitede yalnız birkaçı var (İnebolu 1925, İzmir 1922, Dumlupınar 1924). **En büyük boşluk burası.** Vikipedi'nin bu bölümünde açık hatalar da var: 1924 başlığı altında "Eylül 1922 - Afyon, Eskişehir ve Bursa gezileri" yazıyor; İnebolu konuşmasını 27 Ağustos diye veriyor (MSB: 28 Ağustos).

## 2. Kullanılmamış resmî kaynaklar (dürüst cevap: hayır, verimli kullanmadım)

MSB Atatürk sitesinde kronoloji ve «Askerî Görevleri» dışındaki sayfaları taramamıştım:

| Sayfa | Boyut | İçerik | Değeri |
|---|---|---|---|
| [Yurt Gezileri](https://ata.msb.gov.tr/Sayfa/SayfaGoster/ataturkun-yurt-gezileri) | 575 tarih | 1923-1938 arası **gün gün güzergâh**, çoğu yerde araçla (tren, Hamidiye Kruvazörü, vapur, otomobil) | **Çok yüksek:** seyahat kayıtları ve araç animasyonları için doğrudan kaynak |
| Millî Mücadele Dönemi | 337 tarih, ~225 bin karakter | 1911-1922 ayrıntılı anlatı | Yüksek: kronolojide olmayan günler, yerler |
| Atatürk İnkılapları | 55 tarih | Çoğu kanun | Düşük (kanunlar alınmıyor) |
| Belgelerle Atatürk | alt sayfalar | Arşiv belgeleri, özlük bilgileri, nişan ve madalyalar, vasiyet | Taranmadı; özlük bilgileri rütbe/görev için değerli olabilir |
| Konuşma ve Mesajları, Yazdığı Eserler | PDF'ler | Söylev ve demeçler, askerî eserler | Metin kuralı (§2.1) yüzünden ancak künye olarak |
| Kendi Anlatımıyla Hayatı | 1922 mülakatı | Olgular için ipucu | Düşük |

Atatürk Ansiklopedisi'nde (ATAM) 1458 madde var; yalnız birini (Sofya Ataşemiliterliği) kullandım. Site son denemede açılmadı.

## 3. Nutuk'taki mektup ve telgraflar

Nutuk 1929 İngilizce baskısının taramasında "telegram" kelimesi 866, "letter" 109 kez geçiyor; tarihli başlıkla aktarılan belge sayısı kaba tahminle 150-300. Şema mektup ve telgrafı zaten destekliyor (`kind: 'mektup' | 'telgraf'`, gönderen, alıcı, gönderildiği ve ulaştığı yer).

**Kimden, kime, ne zaman, nereden nereye:** alınabilir. Nutuk Atatürk'ün kendi yayımladığı tarihli kaynak; her belge künye kartı olarak haritada gönderildiği yerden alıcıya bir yay çizer.

**İçerik:** mutlak kural 2 ve SPEC §2.1'e göre gösterilemez:
- Telgrafların ve Nutuk'un aslı Arap harfli; transkripsiyon yasak.
- İngilizce baskı bir çeviri; çeviri yasak, arayüz de yalnız Türkçe.
- Özet de yasak.

Nutuk'un Latin harfli bir devlet baskısı olup olmadığını doğrulamadım; olsa bile bir transkripsiyon olur ve kural 2'ye takılır. Bu kural kullanıcınındır; değiştirmek istenirse ayrı karar gerekir.

## 4. Sınır değişiklikleri (ilk isteğin 5. adımı)

Kaynak: [CShapes 2.0](https://icr.ethz.ch/data/cshapes/), lisans **CC BY-NC-SA 4.0** (sayfada doğrulandı, 2026-11-15). Proje ticari olmadığı için uygun; "Paylaşım" şartı yüzünden türetilmiş sınır dosyaları da aynı lisansla yayımlanır, atıf satırına eklenir. Dosya 26,3 MB (sha256 `384b1ea9…9989d42`).

Osmanlı/Türkiye poligonunun CShapes'teki dönemleri:

| Başlangıç | Bitiş | Muhtemel değişiklik |
|---|---|---|
| 1886-01-01 | 1912-10-17 | CShapes'in başlangıcı |
| 1912-10-18 | 1912-12-31 | Trablusgarp'ın İtalya'ya geçişi |
| 1913-01-01 | 1913-05-29 | Balkan Savaşı |
| 1913-05-30 | 1914-11-02 | Londra Antlaşması |
| 1914-11-03 | 1918-03-02 | Kıbrıs'ın ilhakı, I. Dünya Savaşı |
| 1918-03-03 | 1918-10-29 | Brest-Litovsk |
| 1918-10-30 | 1920-04-25 | Mondros |
| 1920-04-26 | 1923-10-13 | San Remo / manda yönetimleri |
| 1923-10-14 | 2019-12-31 | Lozan sonrası Türkiye |

Görüş alanında (Balkanlar, Kafkasya, Orta Doğu) 1881-1938 arasında 55 ayrı değişiklik günü var.

"Muhtemel değişiklik" sütunu benim yorumum, kaynak değil. Her satır CShapes'in kendi kodlama kaynağıyla (Tir vd. 1998) ve ikinci bir kaynakla eşleştirilmeden girmez.

**Sınırlamalar:**
- CShapes 2.0, **1886'dan** başlıyor. 1881-1885 yılları (1881'de Teselya'nın Yunanistan'a geçişi, 1885'te Doğu Rumeli) için CShapes-Europe sürümüne ya da elle çizime bakılacak.
- CShapes devletlerin sınırını gösteriyor: işgal bölgelerini (1918-1922) ve Sevr'i göstermiyor. "Doğru şekilde" gösterebilmek için bunlar ayrı, kaynaklı elle çizim gerektirir.
- Kanonik tarih kuralları, örneğin Mondros'un 30 Ekim 1918 olması, CShapes'in Gleditsch-Ward kodlamasından geliyor. Her tarih için ikinci bir kaynakla karşılaştırma gerekir.
