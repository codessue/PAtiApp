# Pati Backend — Oracle Cloud (Ücretsiz) Kurulum Rehberi

Bu rehber Pati sunucusunu (API + PostgreSQL + Redis) **Oracle Cloud Always Free**
üzerinde, ücretsiz bir **DuckDNS** adresi ve otomatik **HTTPS** ile kurar.
Toplam maliyet: **0 ₺**.

Sonuçta API şu adreste çalışır: `https://SENIN-ADIN.duckdns.org/api`

---

## 1. Oracle Cloud hesabı aç

1. https://www.oracle.com/cloud/free/ → **Start for free**
2. Bilgilerini gir. Kredi kartı yalnızca doğrulama içindir, ücret çekilmez.
3. **Home Region** olarak **Germany Central (Frankfurt)** veya
   **Netherlands Northwest (Amsterdam)** seç. Bu seçim sonradan değiştirilemez.

> **Önerilir:** Hesap açıldıktan sonra **Billing → Upgrade and Manage Payment**
> ile hesabı **Pay As You Go**'ya yükselt. Always Free kaynaklar yine ücretsizdir,
> ama Oracle'ın "az kullanılan ücretsiz sunucuyu geri alma" kuralı kalkar.
> Ücretsiz sınırların dışına çıkmadıkça ücret çıkmaz.

## 2. Sunucuyu oluştur

> **Kısa yol (önerilir):** 2, 3 ve 6. adımları tek komutla yapar.
> Konsolda sağ üstteki **>_** (Developer tools → **Cloud Shell**) simgesine bas,
> açılan terminale şunu yapıştır:
>
> ```bash
> bash <(curl -fsSL https://raw.githubusercontent.com/codessue/PAtiApp/main/deploy/oracle-sunucu-olustur.sh)
> ```
>
> Komut bitince IP adresini ve bağlanma komutunu yazar. Sonra 4. adımdan devam et;
> sunucuya Cloud Shell'den `ssh -i ~/.ssh/pati ubuntu@IP` ile bağlanırsın.

**Elle oluşturmak istersen:**


1. Menü → **Compute → Instances → Create instance**
2. **Name:** `pati-server`
3. **Image and shape → Edit:**
   - Image: **Canonical Ubuntu 24.04**
   - Shape: **Ampere → VM.Standard.A1.Flex**, **2 OCPU, 12 GB** bellek
     (ücretsiz sınır 4 OCPU / 24 GB)
4. **Add SSH keys → Generate a key pair for me → Save private key**
   (`ssh-key-....key` dosyasını güvenli bir yere kaydet, kaybedersen sunucuya giremezsin)
5. **Create.** Birkaç dakika içinde durum **Running** olur.
6. Sayfadaki **Public IP address** değerini not al (örn. `152.70.10.20`).

> "Out of capacity" hatası alırsan birkaç saat sonra tekrar dene ya da
> **Availability domain**'i değiştir.

## 3. 80 ve 443 portlarını aç (Oracle tarafı)

1. Sunucu sayfasında **Primary VNIC → Subnet** bağlantısına tıkla.
2. **Security Lists → Default Security List → Add Ingress Rules:**
   - Source CIDR: `0.0.0.0/0`, IP Protocol: TCP, Destination Port: `80`
   - Aynısını `443` için tekrarla.

## 4. Ücretsiz alan adı al (DuckDNS)

1. https://www.duckdns.org → GitHub veya Google ile giriş yap.
2. Bir alt alan adı oluştur, örn. `pati-api` → `pati-api.duckdns.org`
3. **current ip** kutusuna 2. adımdaki Public IP'yi yaz → **update ip**.

## 5. Sunucuya bağlan

Mac'te Terminal:

```bash
chmod 600 ~/Downloads/ssh-key-*.key
ssh -i ~/Downloads/ssh-key-*.key ubuntu@PUBLIC_IP
```

## 6. Sunucuyu hazırla

Sunucuda sırayla çalıştır:

```bash
# Ubuntu'nun kendi güvenlik duvarında 80/443'ü aç
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save

# Docker'ı kur
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
exit
```

`exit` sonrası 5. adımdaki `ssh` komutuyla tekrar bağlan.

## 7. Projeyi indir ve ayarla

```bash
git clone https://github.com/codessue/patiapp.git
cd patiapp
```

> Depo gizliyse GitHub şifre yerine **token** ister: GitHub → Settings →
> Developer settings → Personal access tokens → **Fine-grained token**
> (yalnızca bu depo, Contents: Read-only). Şifre sorulunca token'ı yapıştır.

Ayar dosyasını oluştur:

```bash
cp .env.example .env
echo "DB_PASS=$(openssl rand -hex 24)"
echo "JWT_SECRET=$(openssl rand -base64 48)"
nano .env
```

`nano` içinde şunları doldur (üstte üretilen değerleri kopyala):

| Satır | Değer |
|---|---|
| `DB_PASS` | üretilen rastgele şifre |
| `JWT_SECRET` | üretilen rastgele anahtar |
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey adresinden ücretsiz anahtar |
| `API_DOMAIN` | `pati-api.duckdns.org` (kendi adresin, `https://` olmadan) |

Kaydet: `Ctrl+O`, `Enter`, çık: `Ctrl+X`.

> `.env` dosyasını kimseyle paylaşma ve GitHub'a yükleme.

## 8. Başlat

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

İlk derleme 5–10 dakika sürer. Sonra kontrol et:

```bash
curl https://pati-api.duckdns.org/health
# {"status":"ok"} görmelisin
```

Sorun olursa kayıtlara bak:

```bash
docker compose -f docker-compose.prod.yml logs -f api caddy
```

## 9. Uygulamayı sunucuya bağla

`mobile/eas.json` içindeki iki `EXPO_PUBLIC_API_URL` değerini değiştir:

```
"EXPO_PUBLIC_API_URL": "https://pati-api.duckdns.org/api"
```

---

## Güncelleme (yeni sürüm yayınlayınca)

```bash
cd ~/patiapp
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## Yedekleme (önerilir)

Her gece veritabanı yedeği almak için:

```bash
mkdir -p ~/backups
crontab -e
```

En alta ekle:

```
0 3 * * * cd ~/patiapp && docker compose -f docker-compose.prod.yml exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > ~/backups/pati-$(date +\%F).sql.gz && find ~/backups -mtime +14 -delete
```

Son 14 günün yedeği saklanır.
