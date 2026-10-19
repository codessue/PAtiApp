# 🐾 Pati — Kedi Sağlık Takip Uygulaması

Pati, kedi sahipleri için geliştirilmiş kapsamlı bir sağlık takip uygulamasıdır.

## Proje Yapısı

```
PatiApp/
├── backend/           # ASP.NET Core 8 Web API
│   └── Pati.API/
├── mobile/            # React Native + Expo
├── docker-compose.yml
└── .env
```

## Hızlı Başlangıç

### 1. Ortam Değişkenleri

```bash
cp .env.example .env
# .env dosyasını düzenleyin
```

### 2. Docker ile Backend Başlatma

```bash
docker compose up -d
```

API: http://localhost:8080  
Swagger: http://localhost:8080/swagger  
Hangfire: http://localhost:8080/hangfire  
pgAdmin: http://localhost:5050

### 3. Mobile Geliştirme

```bash
cd mobile
npm install
npx expo start
```

## Özellikler (Phase 1 MVP)

- 🔐 **Auth**: Kayıt / Giriş / JWT token yenileme
- 🐱 **Kedi Yönetimi**: Profil, fotoğraf, bilgiler
- 💉 **Aşı Takibi**: Program, hatırlatmalar, geçmiş
- ⚖️ **Kilo Takibi**: Grafik, istatistikler, trend
- 💊 **İlaç Hatırlatmaları**: Günlük/haftalık program, bildirimler

## Teknoloji Yığını

### Backend
- ASP.NET Core 8 + Entity Framework Core 8
- PostgreSQL 16 + Redis
- Hangfire (arka plan görevler)
- JWT Authentication
- Swagger / Scalar

### Frontend
- React Native + Expo SDK
- TypeScript (strict)
- React Query v5 + Zustand
- Expo Notifications
- React Navigation v6

## API Endpoints

| Kategori | Metot | Endpoint |
|---------|-------|---------|
| Auth | POST | `/api/auth/register` |
| Auth | POST | `/api/auth/login` |
| Auth | POST | `/api/auth/refresh` |
| Cats | GET | `/api/cats` |
| Cats | POST | `/api/cats` |
| Vaccines | GET | `/api/cats/{catId}/vaccines` |
| Vaccines | GET | `/api/vaccines/upcoming` |
| Weight | GET | `/api/cats/{catId}/weight` |
| Weight | GET | `/api/cats/{catId}/weight/summary` |
| Medications | GET | `/api/cats/{catId}/medications` |
| Medications | GET | `/api/medications/today` |

## Mama Desteği (uygulama içi bahşiş)

Profil → **Mama Desteği** ekranı, `expo-iap` ile App Store / Google Play üzerinden
tek seferlik (consumable) destek alır. Kurulum:

1. App Store Connect ve Google Play Console'da şu tüketilebilir ürünleri oluşturun:
   `pati.support.food_small`, `pati.support.food_medium`, `pati.support.food_large`
   ve "Tutarı sen seç" için `pati.support.custom_50`, `_100`, `_150`, `_300`, `_500`,
   `_750`, `_1500`, `_3000`, `_5000` (liste: `mobile/src/constants/supportProducts.ts`).
2. Ödemeler mağazalar tarafından aylık olarak hesaplarda tanımlı banka hesabına aktarılır.
3. Uygulama içi satın alma Expo Go'da çalışmaz; development build gerekir:
   `npx expo run:ios` / `npx expo run:android` veya EAS Build.
