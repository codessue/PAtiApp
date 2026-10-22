# App Store Mağaza Sayfası — Kopyala-Yapıştır Metinler

App Store Connect → **Pati** → **Distribution** sekmesindeki alanlar için hazır metinler.
Her bölümün başlığı App Store Connect'teki alan adıdır.

---

## App Information (Uygulama Bilgileri)

| Alan | Değer |
|---|---|
| **Name** (en fazla 30) | `Pati: Evcil Hayvan Sağlığı` |
| **Subtitle** (en fazla 30) | `Aşı, ilaç, kilo ve günlük` |
| **Primary Category** | Lifestyle (Yaşam Tarzı) |
| **Secondary Category** | Utilities (Araçlar) |
| **Content Rights** | "Does not contain, show, or access third-party content" |

> Uygulama kedi dışında köpek, kuş, hamster ve tavşanı da desteklediği için ad "Kedi Sağlık
> Takibi" yerine "Evcil Hayvan Sağlığı" önerildi. Mevcut adı korumak istersen Name alanını
> değiştirme.

---

## Version (Sürüm 1.0) sayfası

### Promotional Text (en fazla 170)

```
Dostunun aşılarını, ilaçlarını ve kilosunu tek yerde takip et; hatırlatmaları kaçırma. Belirtileri yapay zekâ asistanına danış, anılarını günlüğe yaz.
```

### Description

```
Pati, evcil dostunun sağlığını takip etmenin en sıcak yolu. Kedin, köpeğin, kuşun, hamsterın ya da tavşanın için aşıları, ilaçları, kiloyu ve harcamaları tek bir yerde tut; zamanı gelince Pati sana hatırlatsın.

DOSTLARIN TEK YERDE
• Birden fazla dost ekle: kedi, köpek, kuş, hamster, tavşan
• Fotoğraf, cins, doğum tarihi ve önemli bilgiler

AŞI TAKİBİ
• Aşı programını ve geçmişini kaydet
• Yaklaşan ve geciken aşıları ana sayfada gör
• Aşı zamanı yaklaşınca bildirim al

İLAÇ HATIRLATMALARI
• Günlük ya da haftalık ilaç programı oluştur
• Doz saatinde bildirim al, hiçbir dozu kaçırma

KİLO TAKİBİ
• Ölçümleri kaydet, grafikte değişimi izle

SAĞLIK ASİSTANI
• Dostundaki belirtileri yaz, yapay zekâ destekli ön değerlendirme al
• Aciliyet seviyesi, olası nedenler ve veterinere sorabileceğin sorular
• Asistan bilgilendirme amaçlıdır, teşhis koymaz ve veteriner muayenesinin yerini tutmaz

GÜNLÜK
• Anılarını, gözlemlerini ve fotoğraflarını kaydet
• Not ve hatırlatıcılar ekle; akşam günlük hatırlatması
• Günlük kayıtların yalnızca kendi telefonunda saklanır

HARCAMALAR VE VETERİNER ÖDEMELERİ
• Mama, kum, oyuncak ve veteriner harcamalarını fişiyle kaydet
• Toplam harcamayı ve kalan veteriner borcunu otomatik gör

ÜCRETSİZ
Pati tamamen ücretsizdir ve reklam içermez. İstersen uygulama içinden sokak kedilerinin mamasına küçük bir destek gönderebilirsin; destek isteğe bağlıdır ve hiçbir özelliği açmaz.

GİZLİLİK
Verilerin satılmaz ve reklam amacıyla kullanılmaz. Hesabını ve tüm kayıtlarını istediğin an uygulama içinden silebilirsin.

Pati bir veteriner hekim değildir. Acil durumlarda ve endişe duyduğunda lütfen bir veteriner hekime başvur.
```

> Mama Desteği henüz açık değilse "ÜCRETSİZ" bölümündeki ikinci cümleyi sil; Apple açıklamadaki
> özelliklerin uygulamada çalışmasını bekliyor.

### Keywords (en fazla 100, virgülle, boşluksuz)

```
kedi,köpek,veteriner,aşı takvimi,ilaç hatırlatma,kilo takibi,pet,kuş,tavşan,hamster,mama
```

> Ad ve alt başlıktaki kelimeler (evcil hayvan, sağlık, aşı, ilaç, kilo, günlük) zaten
> aranıyor; burada tekrar etmek boşa yer harcar.

### Support URL / Marketing URL

| Alan | Değer |
|---|---|
| **Support URL** | `https://codessue.github.io/PAtiApp/support.html` |
| **Marketing URL** | Boş bırak |

### What's New in This Version

```
İlk sürüm. Pati'ye hoş geldin! 🐾
```

### Copyright

```
2026 Duru Sue Güneş
```

---

## Screenshots (Ekran Görüntüleri)

**Zorunlu boyut:** 6.9" iPhone — **1320 × 2868** piksel (dikey). En az 3, en fazla 10 görüntü.
iPad desteği kapalı olduğu için iPad görüntüsü gerekmez.

Nasıl çekilir: Mac'te Xcode simülatöründe **iPhone 17 Pro Max** (ya da 16 Pro Max) seç,
uygulamayı aç, **⌘ + S** ile kaydet. 6.9" bir iPhone'un varsa telefondan da çekebilirsin.

Önerilen sıra (demo hesapta örnek verilerle):

1. **Ana sayfa:** yaklaşan aşılar ve bugünkü ilaçlar
2. **Dost detayı:** bir kedinin profili
3. **Aşılar listesi**
4. **Kilo grafiği**
5. **Sağlık asistanı:** örnek bir belirti ve yanıtı
6. **Günlük:** fotoğraflı bir anı kaydı
7. **Harcamalar**

---

## App Privacy (Gizlilik Etiketleri)

**Data Collection → "Yes, we collect data from this app"** ve şunları işaretle.
Hepsinde: **Purpose = App Functionality**, **Tracking = No**.

| Kategori → Veri türü | Kimliğe bağlı mı? | Neden |
|---|---|---|
| Contact Info → **Name** | Evet | Hesap adı |
| Contact Info → **Email Address** | Evet | Giriş |
| Identifiers → **User ID** | Evet | Hesap kimliği |
| User Content → **Photos or Videos** | Evet | Dost fotoğrafları ve fiş görselleri sunucuya yükleniyor |
| User Content → **Other User Content** | Evet | Dost kayıtları (aşı, ilaç, kilo, harcama) ve Sağlık Asistanı'na yazılan belirtiler |

**İşaretleme:** Health & Fitness (kullanıcının değil, hayvanın sağlığı), Purchases (bağış
ödemesini Apple yönetiyor, sunucuya gelmiyor), Location, Diagnostics, Usage Data. Günlük
kayıtları ve günlük fotoğrafları telefondan çıkmadığı için "toplanan veri" sayılmaz.

---

## Age Rating (Yaş Derecelendirmesi)

Anketteki tüm şiddet, cinsellik, kumar, küfür vb. sorulara **None / No** de.

- **Medical or Treatment Information:** Sağlık asistanı evcil hayvan sağlığı hakkında bilgi
  verdiği için **Infrequent/Mild** seçmek dürüst olur.
- **Unrestricted Web Access:** No
- **User-Generated Content shared with others / Social features:** No (kullanıcılar birbirini
  görmüyor)
- **In-App Purchases:** Mama Desteği açıksa Yes

---

## App Review Information (İnceleme Bilgileri)

**Sign-in required:** Yes. İnceleme için ayrı bir test hesabı oluştur; 1–2 dost, birkaç aşı,
kilo ve ilaç kaydı ekle.

| Alan | Değer |
|---|---|
| **User name** | test hesabının e-postası |
| **Password** | test hesabının şifresi |
| **Contact** | Duru Sue Güneş · durusuegunes@gmail.com · telefonun |

**Notes:**

```
Pati helps pet owners track vaccines, medications, weight, expenses and a personal journal for their pets.

Demo account: please sign in with the credentials above. Sample pets and records are already added.

- Account deletion: Profile tab → "Hesabımı Sil" (Delete my account). This permanently deletes the account and all records on the server.
- Health Assistant (Sağlık Asistanı): provides general, AI-generated information about pet symptoms using Google Gemini. It does not diagnose and every answer includes a disclaimer recommending a veterinarian. Limited to 5 questions per user per day.
- Journal (Günlük) entries and their photos are stored only on the device and are not sent to our server.
- Privacy policy: https://codessue.github.io/PAtiApp/privacy.html
```

Mama Desteği bu sürümde açıksa notlara şunu ekle:

```
- Food Support (Mama Desteği, Profile tab): optional one-time consumable in-app purchases (tips). They do not unlock any feature or content. The developer uses the support to buy food for stray cats they care for.
```
