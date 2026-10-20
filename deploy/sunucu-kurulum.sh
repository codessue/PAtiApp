#!/usr/bin/env bash
# Pati backend'ini sunucuda kurar/günceller. Sunucunun içinde çalıştırın:
#   bash <(curl -fsSL https://raw.githubusercontent.com/codessue/PAtiApp/main/deploy/sunucu-kurulum.sh)
#
# İlk çalıştırmada alan adını ve (isteğe bağlı) Gemini anahtarını sorar,
# şifreleri kendisi üretir. Sonraki çalıştırmalar kodu günceller ve yeniden başlatır.
set -euo pipefail

REPO=https://github.com/codessue/PAtiApp.git
REF="${PATI_REF:-main}"
DIR=~/patiapp

say() { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }

say "Sunucunun ilk kurulumu bekleniyor (Docker)"
sudo cloud-init status --wait >/dev/null 2>&1 || true
until command -v docker >/dev/null 2>&1; do sleep 10; done

say "Kod indiriliyor ($REF)"
if [ -d "$DIR/.git" ]; then
  git -C "$DIR" fetch -q origin "$REF"
  git -C "$DIR" checkout -q -B "$REF" "origin/$REF"
else
  git clone -q --branch "$REF" "$REPO" "$DIR"
fi
cd "$DIR"

if [ ! -f .env ]; then
  say "Ayarlar"
  read -rp "API alan adı (örn. pati-api.duckdns.org): " DOMAIN
  DOMAIN="${DOMAIN#https://}"; DOMAIN="${DOMAIN%%/*}"
  read -rp "Gemini API anahtarı (yoksa boş bırakıp Enter): " GEMINI
  cat > .env <<EOF
ASPNETCORE_ENVIRONMENT=Production
DB_HOST=postgres
DB_PORT=5432
DB_NAME=pati_db
DB_USER=pati_user
DB_PASS=$(openssl rand -hex 24)
JWT_SECRET=$(openssl rand -hex 48)
JWT_ISSUER=pati-api
JWT_AUDIENCE=pati-mobile
GEMINI_API_KEY=$GEMINI
API_DOMAIN=$DOMAIN
EOF
  chmod 600 .env
fi
DOMAIN=$(grep '^API_DOMAIN=' .env | cut -d= -f2)

MYIP=$(curl -fsS https://api.ipify.org || true)
DNSIP=$(getent hosts "$DOMAIN" | awk '{print $1; exit}' || true)
if [ "$MYIP" != "$DNSIP" ]; then
  echo
  echo "UYARI: $DOMAIN şu an '$DNSIP' adresini gösteriyor, bu sunucu ise '$MYIP'."
  echo "DuckDNS'te IP'yi $MYIP olarak güncelleyin, yoksa HTTPS sertifikası alınamaz."
fi

say "Uygulama derleniyor ve başlatılıyor (ilk seferde 5-10 dakika)"
sudo docker compose -f docker-compose.prod.yml up -d --build

say "HTTPS ve sağlık kontrolü bekleniyor"
for _ in $(seq 1 60); do
  if curl -fsS "https://$DOMAIN/health" >/dev/null 2>&1; then
    say "Hazır: https://$DOMAIN/api"
    curl -fsS "https://$DOMAIN/health"; echo
    exit 0
  fi
  sleep 5
done

echo
echo "5 dakika içinde https://$DOMAIN/health yanıt vermedi. Kayıtlar:"
sudo docker compose -f docker-compose.prod.yml logs --tail 40 api caddy
exit 1
