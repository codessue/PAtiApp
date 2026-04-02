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
