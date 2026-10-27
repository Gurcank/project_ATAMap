# SPEC — ATAMap

> Faz 1 çıktısı. Kaynaklar ve lisanslar için: [SOURCES.md](SOURCES.md).
> Geliştirme sürecinde değişebilir. Değişiklikler bu dosyada tarihle işlenir.
> **Verilmiş kararlar** kullanıcıdan gelir; bu dosyada değiştirilmez, yalnızca ayrıntılandırılır.

### Değişiklik kaydı

| Tarih | Yer | Değişiklik | Gerekçe |
|---|---|---|---|
| 2026-10-27 | §4.2, §10 adım 10 | "altlık karoları" → "altlık dosyası" | Karo kullanılmıyor; altlık TopoJSON dosyaları ([ARCHITECTURE](ARCHITECTURE.md) ADR-05) |
| 2026-10-27 | §6 giriş notu | Şemanın kesin hâli ve ek alanlar belirtildi | ARCHITECTURE ADR-07, ADR-08 |
| 2026-10-27 | §7 altlık satırı | "İlk görünüm karoları" → "İlk görünüm altlığı (50m)" | ADR-05 |
| 2026-10-27 | §7 genel bütçe | Öneri kesinleşti; MapLibre çıkarıldı, hedef 120 KB, tavan 300 KB | MapLibre 6.14.0 tek başına 287 KB gzip; harita d3-geo + SVG (ADR-03, kullanıcı kararı) |
| 2026-10-27 | §9 A17 | Açık → kararlaştırıldı | ARCHITECTURE.md |
| 2026-10-27 | §9.2 A20-A23 | Belge metni aktarım kuralları ve koordinat kaynakları eklendi (kullanıcı kararları) | TBMM taranmış tutanaklarının incelenmesi (SOURCES §2.4.1) |
| 2026-10-27 | §7 fontlar satırı | "toplam ≤ 250 KB" → açılışta inen fontlar ≤ 250 KB + belge fontları ayrıca ≤ 200 KB (kullanıcı kararı) | Türkçe için `latin-ext` zorunlu; 7 kesimin toplamı 369,4 KB ölçüldü. Kesim çıkarmak tek başına sınırı karşılamıyordu (ARCHITECTURE ADR-12) |

---

## 1. Amaç, hedef kitle, başarı ölçütü

- **Amaç:** Atatürk'ün 1881-1938 arasındaki hayatını, o tarihteki gerçek sınırların çizildiği bir harita üzerinde, gönderdiği mektup ve telgrafları ve yaptığı seyahatleri kronolojik ve etkileşimli olarak göstermek.
- **Hedef kitle:** Ön bilgi varsaymadan keşfetmek isteyen genel meraklı yetişkin ziyaretçi.
- **Başarı ölçütü:** Beş kişilik bir kullanılabilirlik testinde katılımcıların en az dördü, yardım almadan üç dakika içinde kendilerine söylenen bir adıma ulaşır, o adımdaki belgenin tam metnini açar ve belgenin kaynağını söyleyebilir. *(Onaylandı, 2026-10-27.)*
- **Bütçe:** Sıfır. Kişisel gelişim projesi, ticari değil. Ücretli kaynak, servis, font veya veri kullanılmaz (kullanıcı kararı, 2026-10-27).

---

## 2. İçerik dili, ton, yazım kuralları, metin bütçesi

**Dil:** Yalnız Türkçe. Arayüz metinleri dahil İngilizce yok.

**İki ayrı metin türü var:**

| Tür | Kim yazar | Kural |
|---|---|---|
| **Belge metni** (mektup, telgraf, konuşma) | Atatürk'ün kendisi (kamu malı), devlet kaynağındaki basımından | Yalnız aslı **Latin harfli** belgelerin tam metni gösterilir (§2.1). Metin birebir alınır. Çeviri, sadeleştirme, yeniden yazım, kısaltma, yazım düzeltmesi **yok**. Editörün eklediği dipnot, açıklama, köşeli parantezli tamamlama ve günümüz Türkçesine aktarım **alınmaz**. Kaynakta "…" veya okunamayan yer işareti varsa aynen kalır. |
| **Olay metni** (sağ alt) ve arayüz metni | Biz | Nesnel, sıfatsız, övgü/yergi yok. Geniş zaman değil, geçmiş zaman (biçim örneği: "X'ten Y'ye geçti."). Her olay metni bir kaynağa bağlanır; kaynakta olmayan bilgi eklenmez. |

### 2.1 Telif politikası (kullanıcı kararı, 2026-10-27)

- **Sitede telifli içerik kullanılmaz.**
- Atatürk'ün kendi yazdığı metinler (mektup, telgraf, konuşma, Nutuk, resmî belgeler) **kamu malıdır**. Dayanak: 5846 sayılı FSEK m.27, "Koruma süresi eser sahibinin yaşadığı müddetçe ve ölümünden itibaren 70 yıl devam eder". Kanun metni ikincil kopyalardan okundu ([MESAM](https://www.mesam.org.tr/mevzuat/yasal-mevzuat/fikir-ve-sanat-eserleri-kanunu), [SETEM](https://setem.org.tr/fikir-ve-sanat-eserleri-kanunu-kanun-no-5846/)). Resmî [mevzuat.gov.tr PDF](https://mevzuat.gov.tr/mevzuatmetin/1.3.5846.pdf) metin olarak okunamadı. Hukuki görüş değildir.
- **Telifli sayılanlar:** yeni transkripsiyonlar, günümüz Türkçesine sadeleştirmeler, editör katkıları, araştırmacı kitapları, fotoğraflar, stilize "Atatürk imzası" çizimi.
- **Sonuç:** Aslı Arap harfli belgelerin (Harf İnkılabı öncesi) yayımlanmış transkripsiyonları telifli sayılır. Kendi transkripsiyonumuzu yapmak da yasak (§2 tablo). Bu nedenle bu belgeler **tam metinsiz** gösterilir: tarih, yer, gönderen, alıcı ve künye görünür (§4.2 "künye kartı").
- Bu karar, Faz 1'deki "öncelik: günümüz Türkçesi > eski Türkçe > Osmanlıca" kuralını **kaldırır**.
- **Veri lisansları ayrı tutulur:** CShapes 2.0 (CC BY-NC-SA 4.0) ücretsizdir ve ticari olmayan kullanıma atıfla izin verir. Bu proje ticari değil (§1 bütçe), bu yüzden sınır geometrisi için kullanılır. Türettiğimiz sınır dosyaları da CC BY-NC-SA 4.0 ile yayımlanır.

### 2.2 Tarih ve yer doğrulama kuralı (kullanıcı kararı, 2026-10-27)

- Her tarih ve yer, **en az iki bağımsız, ücretsiz, telifsiz ve güvenilir** kaynakla teyit edilir.
- İstisna: Tarihli birincil belgenin kendisi (ör. telgrafın kendi tarihi, TBMM tutanağı) tek başına yeter.
- İki kaynak çelişirse kayıt `doğrulanmadı` olur ve siteye girmez.
- Kaynaklardan cümle kopyalanmaz; olay metnini biz yazarız (§2 tablo). Ücretli kaynak kullanılmaz.
- **Teyit yalnız telifsiz kaynaklar ve birincil belgelerle yapılır (A19).** Hakları saklı yayınlar teyit kaynağı sayılmaz, ücretsiz olsalar bile. Örnekler: ata.msb.gov.tr kronolojisi, Belleten makaleleri, DAB/ATAM/MSB kitapları.
- Bu yayınlar yalnızca birincil belgeye ulaşmak için **ipucu** olarak okunabilir. Kayıtta kaynak olarak yer almazlar.

### 2.3 Yazım kuralları (bizim metinlerimiz)
- TDK yazım kuralları. Yer adları **dönem adıyla** yazılır (Selanik, Dersaadet, Manastır…).
- Tarih biçimi (biçim örneği, tarihsel iddia değildir): `3 Mart 1900`. Ay düzeyinde: `Mart 1900`. Yıl düzeyinde: `1900`.
- Belirsiz tarih: tarihin önüne küçük harfli **"yaklaşık"** etiketi (`yaklaşık 1886`). Etiket rengi `--ink-muted`, metin değil rozet.
- Atıf tartışmalı belge: A4 başlığının üstünde **"Atfı tartışmalı"** rozeti + künyede gerekçe.
- Rumi/Hicri tarihli belgelerde belge metnindeki tarih aynen kalır. Miladi karşılık künye satırında gösterilir → §6 `DateValue.original`. Miladi karşılık önce kaynaktan alınır. Kaynak vermiyorsa [TTK Tarih Çevirme Kılavuzu](https://www.ttk.gov.tr/tarih-cevirme-kilavuzu/) ile hesaplanır ve `conversion: 'ttk-cevirici'` diye işaretlenir.
- Güncel yer adı haritada **hiç** görünmez. Yalnız A4 künye satırında, dönem adından sonra parantez içinde verilir.

**Metin uzunluğu bütçesi:**

| Alan | Bütçe | Gerekçe |
|---|---|---|
| Olay metni (sağ alt) | ≤ 240 karakter, ≤ 3 satır (1280'de) | 375 px'te 5 satırı geçmemeli; haritayı kapatmamalı |
| Olay başlığı | ≤ 60 karakter, tek satır | Panel üst satırı |
| Yıl göstergesi | 4 rakam + isteğe bağlı "yaklaşık" | Sol alt, dekoratif ölçek |
| Yer etiketi (harita) | ≤ 20 karakter | Çakışma önleme |
| Belge metni (A4) | Sınırsız (kaynak ne ise) | Birebir kural; A4 içinde kaydırma |
| Künye satırı | ≤ 2 satır | Kurum, yayın, cilt/sayfa, belge no |
| Buton/araç ipucu | ≤ 3 kelime | "Önceki", "Sonraki", "Otomatik" |

---

## 3. Tasarım yönü

### 3.1 Konsept
**"Masada açık duran, elle renklendirilmiş bir 19. yüzyıl atlası."** Harita sararmış kâğıttır. Sınırlar ince el boyası çizgilerle, rotalar mürekkeple çizilir. Arayüz öğeleri (yıl, kontroller, olay metni) haritanın köşelerine yapıştırılmış **kartuşlar** gibi durur: düz kâğıt dolgu, ince çift çerçeve çizgisi, gölge yok. Modern UI kalıpları (cam efekti, yuvarlak kart gölgesi, gradient) **kullanılmaz**.

### 3.2 Palet

Kontrast oranları WCAG 2.x formülüyle hesaplandı (2026-10-26).

| Token | Hex | Kullanım | Gerekçe | Kontrast |
|---|---|---|---|---|
| `--paper` | `#F3E7CF` | A4 belge zemini, kartuş dolgusu | Asitsiz kâğıdın açık krem tonu. Uzun metin okumak için en açık zemin | — |
| `--panel` | `#EADBB9` | Kartuş alternatifi, hover zemini | Kâğıdın bir ton koyusu; katman ayrımı gölgesiz sağlanır | — |
| `--land` | `#E4CFA3` | Kara | Sararmış atlas kâğıdı. Kara denizden açık, eski atlaslardaki gibi | — |
| `--sea` | `#D6C29A` | Deniz | Karadan bir ton koyu. Mavi yok: sepya bütünlüğü bozulmaz. Kıyıya paralel ince tarama ile ayrılır | — |
| `--ink` | `#2B1D0E` | Birincil metin, kıyı çizgisi | Demir-mazı mürekkebi kahvesi. Saf siyah sepya üzerinde sert durur | paper 13.34 · land 10.70 · panel 11.93 |
| `--ink-muted` | `#5C4327` | İkincil metin, künye, "yaklaşık" rozeti | Solmuş mürekkep | paper 7.49 · land 6.01 · panel 6.70 |
| `--border-line` | `#8B3A1A` | Devlet sınırı çizgisi | Atlaslarda el boyası sınır kırmızısı; kahveye yakın tutuldu | land 5.06 (grafik ≥ 3:1 ✓) |
| `--route` | `#B4561A` | Seyahat rotası, aktif araç | Paletteki tek doygun turuncu: hareketin rengi | land 3.21 (grafik ✓; **metin için kullanılmaz**) |
| `--accent-text` | `#9A3F14` | Turuncu vurgulu metin (aktif mod adı vb.) | `--route`'un metinde AA geçen koyu karşılığı | paper 5.54 ✓ |
| `--telegram` | `#7A2E12` | Telgraf işareti ve hattı | Koyu pas: mektuptan ayrışır, sınır çizgisiyle karışmaz | paper 7.70 |
| `--letter` | `#8B6A2E` | Mektup işareti (mühür) | Okra/mum mühür tonu | paper 4.08 (grafik ✓) |

**Kurallar:** Ham hex yalnız token tanımında yazılır. Tek vurgu rengi `--route`. Sepya dışı renk yok; telgraf ve mektup ayrımı renk + **biçim** (ikon şekli) ile yapılır, yalnız renkle yapılmaz. Karanlık tema **yok** (§8). Kâğıt zaten "ışık"tır.

### 3.3 Tipografi

| Rol | Font | Lisans | Gerekçe |
|---|---|---|---|
| Harita etiketleri, yıl göstergesi, başlıklar | **Old Standard TT** (normal + italik) | OFL | 19. yüzyıl sonu Avrupa kitap ve atlas baskısındaki modern-yüz (Didone) karakteri; dönemle uyumlu. İtalik su adları için kullanılır (atlas geleneği) |
| Arayüz ve olay metni | **Alegreya Sans** | OFL | Hümanist sans: küçük puntoda okunur, Old Standard'ın sertliğini yumuşatır, kâğıt dokusunda "dijital" durmaz |
| Mektup ve konuşma tam metni (A4) | **EB Garamond** | OFL | Uzun metin için klasik kitap yüzü; dönem kitap dizgisini çağrıştırır |
| Telgraf tam metni (A4) | **Courier Prime** | OFL | Daktilo/telgraf formu hissi; mektuptan ilk bakışta ayrılır. Dönemsel yorumdur; onaylandı (A15, 2026-10-27) |

- Elenen: IM Fell English / DW Pica. Google Fonts metadata'sında yalnız `latin` alt kümesi var; Türkçe glif desteği yok sayıldı (SOURCES §5).
- Tip ölçeği (1.25 oranlı, 16 px taban): 12 · 14 · 16 · 20 · 25 · 31 · 39 · 49 · 61 · 96 (yalnız yıl göstergesi, masaüstü).
- Belge gövdesi 17 px / satır yüksekliği 1.6; A4 satır uzunluğu ≤ 72 karakter.
- Rakamlar: yıl göstergesinde eski stil (oldstyle) rakam, varsa.

### 3.4 Boşluk ölçeği
4 px tabanlı: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96`.
Gerekçe: Kartuş çerçeveleri 1 px çift çizgi + 4 px ara kullanır, bu yüzden taban 4'tür. 16 px mobil kenar boşluğu, 24/32 masaüstü kenar boşluğu.

### 3.5 Yerleşim konsepti
- Tam ekran harita (`100dvh`). Arayüz yalnız alt kenarda, **asimetrik** üç kartuş:
  - **Sol alt — Yıl:** büyük, dekoratif, haritanın "lejantı" gibi. Görsel ağırlık burada.
  - **Orta alt — Kontroller:** küçük ve dar; önceki/sonraki + mod seçici + otomatik.
  - **Sağ alt — Olay:** okunacak metin; en geniş kartuş.
- Üç kartuş eşit genişlikte **değildir**, aynı taban çizgisine de oturmaz: yıl kartuşu en alçak, olay kartuşu en yüksek.
- Üst kenar boş. Haritanın kendisi başlıktır. Sitenin adı yalnız küçük bir künye olarak sol üstte, yazı karakteriyle, logo olmadan durur.

### 3.6 Akılda kalacak tek öğe
**Gönderildiği noktadan açılan A4 belge.** Telgraf veya mektup işaretinin üzerine gelince, belge haritanın üstünde, gönderildiği şehrin hemen yanında, sararmış A4 kâğıdı olarak açılır. Önizleme yok, doğrudan tam metin ve altında künye. Diğer her şey (araçlar, rotalar, sınırlar) bu anı hazırlar.

---

## 4. Ekranlar ve bileşenler

Tek ekran. Bileşenler:

| Bileşen | Görev | Notlar |
|---|---|---|
| `MapCanvas` | Altlık + dönem sınırları + kendi etiket katmanımız | Güncel etiket katmanları kapalı. Sınır, aktif adımın tarihine göre seçilir |
| `PlaceLabels` | Dönem yer adları | `PlaceName` kayıtlarından; tarihe göre ad seçer |
| `DocumentMarker` | Mektup (mühür), telgraf (telgraf formu) ve konuşma (kürsü) işaretleri | Hover/dokunma/odak hedefi ≥ 44×44 px. Tam metni olmayan belgenin işareti içi boş çizilir |
| `JourneyLayer` | Rota çizgisi + araç | Araç SVG'si rota üzerinde ilerler |
| `DocumentSheet` (A4) | Tam metin + künye + rozetler | `role="dialog"`, en-boy 1:1.414. Yalnız aslı Latin harfli belgelerde |
| `CitationCard` (künye kartı) | Tam metni gösterilemeyen belge: tür, tarih, gönderen, alıcı, künye + "Aslı Arap harfli; tam metin gösterilmiyor" notu | A4 ile aynı etkileşim, kartpostal boyutu. Gerekçe §2.1 |
| `YearCartouche` (sol alt) | Yıl + "yaklaşık" rozeti | Yıl değişiminde rakam geçiş animasyonu |
| `StepControls` (orta alt) | Önceki / Sonraki, adım birimi seçici (olay/seyahat/yıl), Otomatik | Klavye: ← → adım, Boşluk otomatik |
| `EventCartouche` (sağ alt) | Olay başlığı + metni + kaynak bağlantısı | `aria-live="polite"` |
| `Attribution` | Altlık ve veri atıfları | Lisanslar gerektirdiği için zorunlu (SOURCES §3, §5) |

### 4.1 Etkileşim
- **Masaüstü:** İşaretin üzerine gelince A4 açılır (hover niyeti: 150 ms). İmleç işaretten A4'e geçebilir. A4 açıkken içinde kaydırılabilir. İmleç ikisinden de çıkınca 300 ms sonra kapanır. `Esc` kapatır.
- **Mobil/dokunma:** İşarete dokununca A4 alttan tam ekran sayfa olarak açılır, kapatma düğmesi vardır. Dışına dokunmak veya aşağı kaydırmak kapatır.
- **Klavye:** İşaretler sekme sırasındadır. Odak + `Enter` A4'ü açar, odak A4'e taşınır, `Esc` kapatıp odağı işarete döndürür.
- Hover ile açılan belge, başka işarete geçilince değişir; aynı anda tek A4 açıktır.

### 4.2 Durumlar

| Durum | Ne görünür |
|---|---|
| **Yükleniyor** (ilk açılış) | `--paper` zemin, ortada Old Standard ile "Harita hazırlanıyor" ve ince bir mürekkep çizgisi ilerlemesi. Kartuşlar iskelet çizgileriyle yerinde durur (yerleşim kayması olmaz) |
| **Yükleniyor** (adım geçişi) | Önceki adımın görüntüsü kalır; yeni veri hazır olunca geçiş animasyonu başlar. Döner simge yok |
| **Hata: altlık dosyası** | Gömülü düşük çözünürlüklü kara/deniz çizimine düşülür (Natural Earth 1:110m). Kartuşta küçük not: "Harita altlığı yüklenemedi" |
| **Hata: veri JSON** | Orta kartuşta "Kayıtlar yüklenemedi" + "Yeniden dene". Harita boş kâğıt olarak kalır |
| **Boş: adımda belge yok** | Olay kartuşu dolu, haritada işaret yok. Normal durumdur, ayrıca mesaj gösterilmez |
| **Boş: yıl modunda kayıtsız yıl** | Atlanır. Yıl göstergesi aradaki yılları hızla sayarak geçer (A4) |
| **Boş: belgenin tam metni yok** (aslı Arap harfli) | A4 yerine `CitationCard` açılır |
| **Boş: telifli metin** | Bu durum oluşmaz: telifli metin veri derlemesine girmez (§6 kuralı) |
| **Uç: ilk/son adım** | İlgili buton `disabled` + görsel olarak soluk; otomatik mod sonda durur |
| **Uç: hareket azaltma** | §5.3 |

### 4.3 Responsive

| Genişlik | Yerleşim |
|---|---|
| **375** | Kartuşlar tek bir alt şeritte birleşir: üst satırda yıl (39 px) + olay başlığı, altında olay metni (en fazla 5 satır; uzunsa "devamı" ile açılır), en altta kontroller (her biri ≥ 44 px). Mod seçici açılır menü olur. A4 tam ekran sayfa olarak açılır. Haritanın görünen alanı ≥ ekran yüksekliğinin %55'i |
| **768** | Yıl sol alt, olay sağ alt (genişlik 320); kontroller ikisinin üstünde ortada. A4 ekran yüksekliğinin %85'i, ortada |
| **1280** | §3.5 tam asimetrik yerleşim. Yıl 96 px. Olay kartuşu 360 px. A4 yüksekliği 80vh, işaretin yanında açılır; ekrana sığmazsa ortalanır |

---

## 5. Modlar ve animasyon envanteri

### 5.1 Modlar (verilmiş karar + açık karar)
- **Adım** = bir olay. Kullanıcı adım birimini değiştirebilir:
  - **Olay:** her kayıt bir adım.
  - **Seyahat:** yalnız `Journey` kayıtları arasında atlar.
  - **Yıl:** bir sonraki yılın ilk kaydına atlar.
- **Otomatik:** Adımlar kendiliğinden ilerler. Kullanıcı herhangi bir kontrole dokununca durur.

Kararlaştırılanlar (2026-10-27):
- **Adım süresi (A2):** animasyon süresi + olay metninin uzunluğuna göre okuma süresi.
- **Belgeler (A3):** Otomatik mod belge açmaz. İşaret vurgulanır, kullanıcı isterse açar; otomatik mod durmaz.
- **Kayıtsız yıllar (A4):** Yıl modunda atlanır.
- **Seyahat modu (A5):** Yalnız seyahatlere adım atılır. Aradaki belgelerin işaretleri haritada kalır ve açılabilir.

Açık (A1): mod değişince konumun nasıl korunacağı, okuma süresi formülü. **Geliştirme sürecinde netleşecek.**

### 5.2 Animasyon envanteri

| # | Animasyon | Tetikleyici | Davranış | Süre (öneri) |
|---|---|---|---|---|
| M1 | Seyahat rotası çizimi | Seyahat adımı | Rota mürekkep gibi baştan sona çizilir (`--route`). Kaynakta güzergâh yoksa büyük daire yayı, daha soluk ve kesik çizilir, "yaklaşık rota" etiketi alır (A8) | Mesafeyle orantılı, 1,5-6 s |
| M2 | Araç hareketi | M1 ile eşzamanlı | Aracın SVG'si rota üzerinde ilerler, yöne göre döner/aynalanır. Araçlar: **at, tren, gemi, otomobil, uçak**. Sade, stilize, gravür/siluet tarzı | M1 ile aynı |
| M3 | Mektup gönderimi | Mektup adımı | Mühürlü zarf ikonu çıkış noktasından varış noktasına yay çizerek gider, varışta mühür izi kalır | 1,2 s |
| M4 | Telgraf gönderimi | Telgraf adımı | İki nokta arasında ince düz hat çizilir, üzerinde nokta-çizgi darbesi ilerler | 0,8 s |
| M5 | Sınır değişimi | Adım tarihi bir `BorderChange` sınırını geçince | Eski çizgi solar, yeni çizgi belirir; değişen alan kısa süre taranır. İşgal bölgeleri kalıcı çapraz tarama ile gösterilir; sınırı kaba olanlar "yaklaşık" etiketlidir (A14) | 0,6 s |
| M6 | Yıl göstergesi | Yıl değişince | Rakamlar dikey kayarak değişir | 0,4 s |
| M7 | A4 açılışı | Hover/dokunma/Enter | Kâğıt işaret noktasından ölçeklenerek açılır (masaüstü), alttan kayar (mobil) | 0,2 s |
| M8 | Kamera | Her adım | Harita yeni olayın konumuna yumuşak geçer; seyahatte rotanın tamamını sığdırır | 0,8-1,5 s |

### 5.3 Hareket azaltma (`prefers-reduced-motion: reduce`)
M1-M4 son hâlleriyle anında gösterilir (rota tam çizili, araç varış noktasında). M5-M7 yalnız saydamlık geçişi (≤ 150 ms). M8 animasyonsuz atlama. Otomatik mod çalışır, ama geçişler anlıktır.

---

## 6. Veri şeması taslağı

JSON dosyaları. Kesin hâli `src/schema/` altında Zod şemasıdır (ARCHITECTURE ADR-07); aşağıdaki alanlar korunur. Ekler: tekrar eden `SourceRef`'ler `data/sources.json`'da tutulur ve kimlikle referanslanır (ADR-07); tam metinli her belgenin `data/reference/` altında referans metni ve meta verisi bulunur (ADR-08). *(2026-10-27)*

```ts
// ---- Shared ----
type DatePrecision = 'day' | 'month' | 'year' | 'range';

interface DateValue {
  iso: string;            // Gregorian, ISO 8601: "1919-05-19", "1919-05", "1919"
  isoEnd?: string;        // only when precision === 'range'
  precision: DatePrecision;
  approximate: boolean;   // true => UI shows "yaklaşık"
  original?: string;      // verbatim date as printed in the source (e.g. a Rumi date)
  conversion?: 'source' | 'ttk-cevirici'; // where iso came from when original is non-Gregorian (§2.3)
  sources: SourceRef[];   // REQUIRED: ≥ 2 independent sources, or 1 if it is the dated primary document (§2.2)
  primaryDocument?: boolean; // true => a single source is allowed
}

type OriginalScript = 'latin' | 'arap';

type RightsStatus =
  | 'kamu-mali'           // public domain: the only status allowed for any text shown on the site (§2.1)
  | 'acik-lisans'         // data only (e.g. CShapes CC BY-NC-SA 4.0); licence field required; never for text
  | 'telifli';            // build MUST reject: never shipped

interface SourceRef {
  institution: string;    // e.g. "Devlet Arşivleri Başkanlığı"
  citation: string;       // full bibliographic line (author, title, volume, page, year)
  url?: string;
  page?: string;
  archiveRef?: string;    // archive fonds/file/document number, if given
  accessedAt: string;     // ISO date
  rights: RightsStatus;
  licence?: string;       // SPDX-like id or URL when rights === 'acik-lisans'
  free: true;             // paid sources are not allowed (§1 budget)
  verified: boolean;      // false => record is excluded from the build
}

interface GeoPoint {
  lon: number;
  lat: number;
  sources: SourceRef[];   // REQUIRED: same ≥ 2 rule as dates (§2.2)
}

// ---- Records ----
interface Event {
  id: string;
  date: DateValue;
  title: string;          // ≤ 60 chars
  text: string;           // ≤ 240 chars, written by us, must be supported by `sources`
  placeId?: string;       // -> PlaceName.id
  sources: SourceRef[];
  documentIds?: string[]; // documents shown at this step
  journeyId?: string;
}

interface DocumentRecord {
  id: string;
  kind: 'mektup' | 'telgraf' | 'konusma'; // 'konusma' e.g. TBMM opening speeches (A7)
  date: DateValue;
  fromPlaceId: string;
  toPlaceId?: string;    // unknown recipient location => no M3/M4 animation
  sender: string;        // as written in source
  recipient?: string;    // as written in source
  originalScript: OriginalScript;
  fullText?: string;     // ONLY when originalScript === 'latin'; Atatürk's own words verbatim, no editorial additions
  attributionDisputed: boolean;
  disputeNote?: string;  // required when attributionDisputed === true
  sources: SourceRef[];
}

type Vehicle = 'at' | 'tren' | 'gemi' | 'otomobil' | 'ucak';

interface JourneyLeg {
  fromPlaceId: string;
  toPlaceId: string;
  vehicle: Vehicle;
  departure: DateValue;
  arrival?: DateValue;
  path?: GeoPoint[];      // only if a source documents the route
  routeKind: 'kaynakli' | 'yaklasik'; // 'yaklasik' => great-circle arc + "yaklaşık rota" label (A8)
  sources: SourceRef[];
}

interface Journey {
  id: string;
  title: string;
  legs: JourneyLeg[];     // ordered
  sources: SourceRef[];
}

interface BorderChange {
  id: string;
  effective: DateValue;   // date the change takes effect
  kind: 'antlasma' | 'ilhak' | 'isgal' | 'bagimsizlik' | 'diger';
  title: string;          // e.g. treaty name as in source
  polity: string;         // state/territory name in period form
  geometry: string;       // path to GeoJSON (Polygon/MultiPolygon) valid from `effective`
  geometryOrigin: 'cshapes' | 'elle-cizim'; // hand-drawn only from a sourced description (A14)
  geometryApproximate: boolean;            // true => "yaklaşık" hatching
  geometrySources: SourceRef[];            // e.g. CShapes 2.0 record (gwcode + gwsdate)
  sources: SourceRef[];   // historical sources for date + kind
}

interface PlaceName {
  id: string;
  point: GeoPoint;
  names: {
    name: string;         // period name as written (e.g. "Selanik", "Dersaadet")
    validFrom?: DateValue;
    validTo?: DateValue;
    sources: SourceRef[];
  }[];
  modernName?: string;    // shown only in the künye line, in parentheses; never on the map (A10)
}
```

**Derleme kuralları (build zamanında doğrulanır):**
1. Herhangi bir kaynağı `verified === false` olan kayıt dışarıda kalır.
2. `rights === 'telifli'` olan kayıt dışarıda kalır. Metin alanlarının (`fullText`) kaynağı yalnız `kamu-mali` olabilir.
3. `fullText` yalnız `originalScript === 'latin'` iken bulunabilir; aksi hâlde derleme başarısız olur.
4. `attributionDisputed === true` ise `disputeNote` zorunlu.
5. Her `DateValue` ve `GeoPoint` en az 2 kaynak taşır; tek kaynak yalnız `primaryDocument === true` ise kabul edilir.
6. `BorderChange.geometry` kendi kaynağını taşır; `elle-cizim` ise kaynak tarifi zorunlu.
7. `fullText` kaynakla karakter karakter karşılaştırılabilir olmalı (kaynak sayfa no zorunlu).
8. Her kaynak `free === true` olmalı.

---

## 7. Medya envanteri

| Tür | Kaynak | Lisans | Adet | En-boy oranı | Performans bütçesi |
|---|---|---|---|---|---|
| Altlık (kara/deniz/kıyı, etiketsiz) | Natural Earth 1:10m-1:50m vektör, kendimiz barındırırız (A16) | Kamu malı (SOURCES §5) | 1 set | — (harita) | İlk görünüm altlığı (50m) ≤ 400 KB (gzip) |
| Yedek altlık (çevrimdışı) | Natural Earth 1:110m, gömülü | Kamu malı | 1 | — | ≤ 120 KB |
| Dönem sınır geometrileri | CShapes 2.0 + gerektiğinde elle çizim (kaynaklı) | CC BY-NC-SA 4.0 (SOURCES §3.2) | Değişiklik başına 1 (tahmin ~40-60, **doğrulanmadı**) | — | Tarih başına ≤ 150 KB, basitleştirilmiş; yalnız aktif ve sonraki tarih önden yüklenir |
| Araç SVG'leri (at, tren, gemi, otomobil, uçak) | Bizim çizimimiz | Proje lisansı | 5 | 1:1 tuval (64×64 viewBox) | Her biri ≤ 4 KB, toplam ≤ 20 KB, satır içi |
| İşaret ikonları (mektup mührü, telgraf formu, konuşma kürsüsü, yer noktası) | Bizim çizimimiz | Proje lisansı | 4 (+ dolu/boş, hover/aktif durumları) | 1:1 (24×24 viewBox) | Toplam ≤ 8 KB |
| Kâğıt dokusu (A4 + kartuş) | Bizim üretimimiz (SVG gürültü filtresi veya küçük döşenen görsel) | Proje lisansı | 1-2 | Döşenebilir 1:1 | ≤ 30 KB |
| Fontlar | Old Standard TT, Alegreya Sans, EB Garamond, Courier Prime | OFL (SOURCES §5) | 4 aile, ≤ 7 kesim | — | `latin` + `latin-ext` alt küme, WOFF2. Açılışta inen fontlar (Old Standard TT + Alegreya Sans) ≤ 250 KB; belge fontları (EB Garamond + Courier Prime) yalnız A4 ilk açılışta yüklenir, ayrıca ≤ 200 KB *(2026-10-27)* |
| Belge tam metinleri | Atatürk'ün kendi metni, devlet kaynağındaki basımından; yalnız aslı Latin harfli (§2.1) | Kamu malı (FSEK m.27, §2.1) | Kayıt sayısına bağlı | — | Tüm metin JSON'u ≤ 500 KB gzip; gerekirse yıla göre parçalanır |
| Fotoğraf / belge tıpkıbasımı | — | — | **0** | — | Kapsam dışı (§8) |

**Genel bütçe (kesinleşti, 2026-10-27; ayrıntı ARCHITECTURE §5):** İlk yükleme JS hedefi ≤ 120 KB gzip, tavan ≤ 300 KB gzip. MapLibre kullanılmıyor; harita d3-geo + SVG (ADR-03). LCP ≤ 2,5 s (4G, orta mobil), adım geçişinde ana iş parçacığı bloğu ≤ 50 ms, CLS ≤ 0,1.

---

## 8. Kapsam dışı

- Ses, müzik, seslendirme.
- İngilizce ve diğer diller.
- Fotoğraf, film, belge tıpkıbasım görselleri.
- Karanlık tema.
- Kullanıcı hesabı, giriş, yorum, favori.
- Arama kutusu ve metin içi arama.
- İçerik yönetim sistemi (CMS). Veri JSON dosyalarında elle tutulur.
- Aslı Arap harfli belgelerin tam metni (yalnız künye kartı gösterilir, §2.1).
- Bizim tarafımızdan transkripsiyon, çeviri, sadeleştirme, özetleme veya belge metni yorumu.
- Telifli herhangi bir metin: yeni transkripsiyonlar, sadeleştirmeler, editör katkıları, araştırmacı metinleri.
- Ücretli kaynak, servis, veri veya font. Mapbox gibi ücretli harita servisleri dahil.
- Kurumlardan izin başvurusu (A13: şimdilik yapılmayacak).
- 1881 öncesi ve 1938 sonrası olaylar ve sınır değişiklikleri.
- Harita dışı görünümler (zaman çizelgesi sayfası, liste sayfası, belge arşivi sayfası).
- Paylaşım butonları, sosyal medya entegrasyonu.
- Çevrimdışı kullanım (PWA).

---

## 9. Kararlar ve açık kararlar

### 9.1 Hâlâ açık

| # | Konu | Durum |
|---|---|---|
| A1 | Mod mantığının kalan ayrıntısı (verilmiş karar: geliştirmede netleşecek) | Mod değişince konumun korunması, okuma süresi formülü |

### 9.2 Kararlaştırılanlar (2026-10-27)

| # | Konu | Karar |
|---|---|---|
| A2 | Otomatik modda adım süresi | Animasyon süresi + olay metni uzunluğuna göre okuma süresi |
| A3 | Otomatik mod belge açar mı? | Açmaz; işaret vurgulanır, otomatik mod durmaz |
| A4 | Yıl modunda kayıtsız yıllar | Atlanır |
| A5 | Seyahat modunda seyahat dışı olaylar | Atlanır; işaretleri haritada kalır ve açılabilir |
| A6 | Başarı ölçütü | §1'deki gibi onaylandı (5 kişi / en az 4 / 3 dk) |
| A7 | TBMM konuşmaları vb. | Belge olarak (`kind: 'konusma'`), A4'te tam metin. §2.1 kuralı geçerli: yalnız aslı Latin harfli olanlar |
| A8 | Belgelenmemiş rotalar | Büyük daire yayı + "yaklaşık rota" etiketi |
| A9 | Rumi/Hicri → Miladi | Önce kaynaktaki karşılık; yoksa [TTK Tarih Çevirme Kılavuzu](https://www.ttk.gov.tr/tarih-cevirme-kilavuzu/) (`ttk-cevirici`) |
| A10 | Güncel yer adı | Yalnız A4 künye satırında parantez içinde |
| A11 | Lisans uyumu | Proje ticari değil. CShapes 2.0 (CC BY-NC-SA 4.0, ücretsiz) kullanılır; türev sınır dosyaları aynı lisansla. Historical Basemaps (GPL-3.0) yalnız karşılaştırma için kullanılır, dağıtılmaz |
| A12 | Telifli içerik | Sitede telifli içerik kullanılmaz (§2.1). Belleten transkripsiyonları dahil hiçbir yayımlanmış transkripsiyon alınmaz |
| A13 | Kurumlardan izin | Şimdilik başvuru yapılmayacak |
| A14 | 1918-1923 işgal bölgeleri | Kaynaklı elle çizim; sınırı kaba olan "yaklaşık" taramalı; çizim kaynağı bulunamayan bölge gösterilmez |
| A15 | Telgraf için daktilo yüzü | Kabul (Courier Prime) |
| A16 | Altlık | Natural Earth, kendimiz barındırırız. Gerekçe: kamu malı ve ücretsiz, etiketsiz olduğu için güncel ad sızmaz, dış servise ve anahtara bağımlılık yok. Mapbox ücretli kullanım koşulları ve erişim anahtarı gerektirdiği için sıfır bütçe kuralına uymuyor; MapLibre zaten Mapbox GL'in açık kaynak çatalı, kullanım deneyimi benzer |
| A18 | Kronoloji kaynağı | Tek ana kaynak yok. Her tarih ve yer en az 2 bağımsız, ücretsiz, telifsiz, güvenilir kaynakla ya da tarihli birincil belgenin kendisiyle teyit edilir (§2.2). Ücretli *Kaynakçalı Atatürk Günlüğü* kullanılmaz |
| A17 | Teknik yığın ve sürüm sabitleme | [ARCHITECTURE.md](ARCHITECTURE.md): Vite + Preact + d3-geo/SVG, Vercel Hobby; sürümler en az iki haftalık kararlı sürüme tam sabitlenir (ARCHITECTURE §2). Kapandı: 2026-10-27 |
| A20 | Tutanaktaki stenograf notları ("(Alkışlar)" vb.) | A4 metnine **alınmaz**. Birebirlik testi bu notları bilinçli olarak atlar; künyede "Stenograf notları çıkarıldı" yazar |
| A21 | Satır sonu tirelemesi (taranmış baskı) | Bölünmüş kelimeler birleştirilir (dizgi gereğidir). Paragraf, noktalama ve dönem yazımı (â, î, "Cümhuriyet") aynen kalır |
| A22 | Elle aktarılan metnin ikinci okuması | Kullanıcı, tarama ile aktarımı yan yana karşılaştırıp onaylar. Onaydan önce kayıt `verified: false` kalır, siteye girmez |
| A23 | Yer koordinatı kaynakları | Natural Earth populated places (kamu malı) + Wikidata (CC0). Biri yoksa başka telifsiz ikinci kaynak aranır |
| A19 | Hakları saklı ücretsiz yayınlar teyit sayılır mı? | Hayır. Teyit için yalnız telifsiz kaynaklar ve birincil belgeler kullanılır. Hakları saklı yayınlar yalnız ipucudur (§2.2) |

---

## 10. Uçtan uca doğrulama

**Senaryo:** Kaynağı doğrulanmış küçük bir veri seti. İçinde en az **bir seyahat** (en az iki etap, iki farklı araç), aslı Latin harfli **bir telgraf**, aslı Arap harfli **bir belge** ve **bir sınır değişikliği** bulunur.

Adımlar (her biri ekran görüntüsü veya test çıktısıyla kanıtlanır):
1. Derleme şu örnek kayıtları **reddeder**: `verified:false`, `telifli`, tek kaynaklı (birincil belge değil) tarih, Arap harfli asılda `fullText`. Test: derleme çıkış kodu ≠ 0 ya da kayıt çıktıda yok.
2. 1280 px: Sonraki → seyahat adımı. Rota çizilir, araç değişir, kamera rotayı sığdırır, yıl kartuşu güncellenir.
3. 1280 px: Telgraf işaretine hover → A4 tam metin açılır. Metin kaynakla **karakter karakter** aynı (otomatik karşılaştırma testi), künye ve sayfa görünür.
4. Sınır değişikliğinin tarihini geçen adımda sınır çizgisi değişir. Önceki adıma dönünce eski sınır geri gelir.
5. 375 px: Aynı telgrafa dokunma → A4 tam ekran açılır, kapatma çalışır, kontroller ≥ 44 px.
6. 768 px: Kartuş yerleşimi §4.3'e uygun, yatay kaydırma yok.
7. Klavye: ← → adım, Tab ile işarete odak, Enter A4, Esc kapatır ve odak geri döner.
8. `prefers-reduced-motion` açıkken §5.3 davranışı.
9. "yaklaşık" etiketli bir tarih ve "Atfı tartışmalı" rozetli bir belge doğru görünür.
9a. Aslı Arap harfli belgeye hover → A4 değil, künye kartı açılır ve "tam metin gösterilmiyor" notu görünür.
9b. Kaynakta güzergâhı olmayan etap "yaklaşık rota" etiketiyle çizilir.
10. Altlık dosyası engellenince yedek altlığa düşülür, hata notu görünür.

---

## Faz 1 → 2 kapı kontrolü

- [x] Amaç, hedef kitle, ölçülebilir başarı ölçütü (§1)
- [x] Dil, ton, yazım kuralları, metin bütçesi (§2)
- [x] Tasarım yönü: palet, tipografi, boşluk ölçeği, yerleşim, tek öğe (§3)
- [x] Ekranlar, durumlar, responsive (§4)
- [x] Modlar ve animasyon envanteri (§5)
- [x] Veri şeması, zorunlu tarih + kaynak (§6)
- [x] Medya envanteri (§7)
- [x] Kapsam dışı (§8)
- [x] Açık kararlar (§9)
- [x] Uçtan uca doğrulama (§10)
