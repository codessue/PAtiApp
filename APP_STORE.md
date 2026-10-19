# App Store Yayın Rehberi

Bu dosya Pati'nin App Store incelemesinden geçmesi için yapılanları ve **senin yapman gereken** adımları listeler.

## Kodda yapılanlar

| Apple kuralı | Sorun | Çözüm |
|---|---|---|
| 2.1 Uygulama bütünlüğü (çökme) | `react-native-reanimated` 4 ve `victory-native` zorunlu native bağımlılıkları (`react-native-worklets`, `@shopify/react-native-skia`) olmadan yüklüydü → mağaza derlemesi açılışta çökebilirdi | Kullanılmayan bu paketler kaldırıldı |
| 5.1.1(v) Hesap silme | Hesap oluşturuluyor ama silinemiyordu | `DELETE /api/auth/account` + Profil → "Hesabımı Sil" |
| 5.1.1(i) Gizlilik politikası | Uygulamada gizlilik politikası yoktu | `docs/privacy.html`, Profil ve Kayıt ekranında bağlantı |
| 2.1 / 4.0 Çalışmayan arayüz | "Şifremi Unuttum", "Hesap Bilgileri", "Uygulama Ayarları" butonları hiçbir şey yapmıyordu | Kaldırıldı / gerçek işleve bağlandı |
| 5.1.1 Gereksiz izinler | Kamera ve galeri izin metinleri vardı ama özellik yoktu | Kaldırıldı (image-picker dahil) |
| İhracat uyumluluğu | Her yüklemede şifreleme sorusu | `ITSAppUsesNonExemptEncryption = false` |
| Privacy Manifest | Gerekli API gerekçeleri | `ios.privacyManifests` eklendi |
| Push bildirimleri | `getExpoPushTokenAsync` projectId olmadan standalone derlemede hata verir; `projectId: "pati-mvp"` geçersizdi | projectId `eas init` ile ayarlanacak şekilde düzeltildi |

Ek düzeltmeler: oturum süresi dolunca kullanıcı artık takılı kalmıyor (giriş ekranına döner); çıkışta önceki kullanıcının verileri önbellekte kalmıyor ve zamanlanmış bildirimler iptal ediliyor; kedi detay ekranı yüklenirken boş ekran yerine yükleniyor göstergesi; sunucu tarafı kayıt doğrulaması; Swagger yalnızca geliştirmede açık; uygulama görselleri küçültüldü.

## Senin yapman gerekenler

### 1. Backend'i HTTPS ile yayına al
Apple incelemesi gerçek cihazda yapılır; `localhost` çalışmaz ve iOS düz HTTP'yi engeller (ATS).
- Bir sunucuya (Railway, Render, Azure, VPS…) `docker compose` ile kur, `.env.example` → `.env`.
- `JWT_SECRET` için güçlü rastgele değer kullan; Postgres/Redis portlarını internete açma.
- Önünde HTTPS sağlayan bir reverse proxy / platform olsun. `https://SENIN-ALAN-ADIN/health` → `{"status":"ok"}` dönmeli.
- **İnceleme süresince sunucu açık kalmalı.**

### 2. Gizlilik ve destek sayfalarını yayınla
- `docs/privacy.html` ve `docs/support.html` içindeki `SUPPORT_EMAIL` yerine gerçek e-postanı yaz.
- GitHub Pages (Settings → Pages → `main` / `docs`) ya da başka bir yerde yayınla.
- URL farklıysa `mobile/eas.json` içindeki `EXPO_PUBLIC_PRIVACY_URL` / `EXPO_PUBLIC_SUPPORT_URL` değerlerini güncelle.

### 3. EAS yapılandırması
```bash
cd mobile
npm install -g eas-cli
eas login
eas init                       # gerçek projectId'yi app.json'a yazar
```
- `mobile/eas.json` → `EXPO_PUBLIC_API_URL` değerini gerçek API adresinle değiştir.
- `com.pati.app` paket kimliği App Store'da başkasına ait olabilir; alınamazsa `app.json` → `ios.bundleIdentifier` değerini benzersiz bir değerle değiştir (ör. `com.<adın>.pati`).

### 4. Derle ve gönder
```bash
eas build --platform ios --profile production
eas submit --platform ios --profile production   # eas.json'daki ascAppId'yi doldur
```

### 5. App Store Connect
- **Gizlilik Politikası URL'si** ve **Destek URL'si**: 2. adımdaki adresler.
- **App Privacy (gizlilik etiketleri)**:
  - İletişim bilgileri → Ad, E-posta: *Uygulama İşlevselliği*, kimliğe bağlı, izleme yok
  - Tanımlayıcılar → Kullanıcı Kimliği (hesap): *Uygulama İşlevselliği*, kimliğe bağlı
  - Kullanıcı İçeriği → Diğer kullanıcı içeriği (kedi kayıtları): *Uygulama İşlevselliği*, kimliğe bağlı
  - Takip (tracking): **Hayır**
- **Yaş sınırı**: anketi tümüyle "Yok" olarak doldur → 4+.
- **Kategori**: Lifestyle (Yaşam Tarzı).
- **Ekran görüntüleri**: 6.9" iPhone (1320×2868) zorunlu. iPad desteği kapalı olduğundan iPad görüntüsü gerekmez.
- **App Review bilgileri** — demo hesap ver (zorunlu, yoksa 2.1 ile red alırsın):
  - Sunucuda bir test hesabı oluştur, 1-2 kedi, aşı, kilo ve ilaç kaydı ekle.
  - Notlar alanına örnek:
    > Pati, kedi sahiplerinin aşı, kilo ve ilaç takibini yapmasını sağlar. Demo hesap ile giriş yapabilirsiniz. Hesap silme: Profil sekmesi → "Hesabımı Sil".

## Bilinen eksikler (red sebebi değil, sonra eklenebilir)
- Şifre sıfırlama (e-posta gönderimi gerektirir).
- Kedi fotoğrafı yükleme arayüzü (backend uç noktası hazır).
