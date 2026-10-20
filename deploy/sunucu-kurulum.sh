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

say "Sunucunun ilk kurulumu bekleniyor (Docker, en fazla 5 dakika)"
for _ in $(seq 1 30); do
  command -v docker >/dev/null 2>&1 && break
  sleep 10
done
# İlk açılış betiği Docker'ı kuramadıysa burada kur.
if ! command -v docker >/dev/null 2>&1; then
  say "Docker kuruluyor"
  sudo pkill -f get.docker.com >/dev/null 2>&1 || true
  curl -fsSL https://get.docker.com | sudo sh
fi
# Güvenlik duvarı kuralları ilk açılışta eklenmediyse ekle.
for port in 80 443; do
  sudo iptables -C INPUT -p tcp --dport "$port" -m state --state NEW -j ACCEPT 2>/dev/null \
    || sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport "$port" -j ACCEPT
done
sudo netfilter-persistent save >/dev/null 2>&1 || true

say "Kod indiriliyor ($REF)"
if [ -d "$DIR/.git" ]; then
  git -C "$DIR" fetch -q origin "$REF"
  git -C "$DIR" checkout -q -B "$REF" "origin/$REF"
else
  git clone -q --branch "$REF" "$REPO" "$DIR"
fi
cd "$DIR"

set_env() { sed -i "s|^$1=.*|$1=$2|" .env; }
# Bekleme sırasında basılmış tuşlar sorulara cevap sanılmasın.
flush_input() { while read -r -t 0.1 -n 10000 _ 2>/dev/null; do :; done; }

if [ ! -f .env ]; then
  # Şifreler yalnızca ilk kurulumda üretilir; veritabanı onlarla oluşturulur.
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
GEMINI_API_KEY=
API_DOMAIN=
EOF
  chmod 600 .env
fi

DOMAIN="${PATI_DOMAIN:-$(grep '^API_DOMAIN=' .env | cut -d= -f2)}"
until [ -n "$DOMAIN" ]; do
  flush_input
  read -rp "API alan adı (örn. pati-api.duckdns.org): " DOMAIN
done
DOMAIN="${DOMAIN#https://}"; DOMAIN="${DOMAIN%%/*}"
set_env API_DOMAIN "$DOMAIN"

if [ -z "$(grep '^GEMINI_API_KEY=' .env | cut -d= -f2)" ]; then
  flush_input
  read -rsp "Gemini API anahtarı (yapıştırınca görünmez; yoksa boş bırakıp Enter): " GEMINI; echo
  [ -n "$GEMINI" ] && set_env GEMINI_API_KEY "$GEMINI"
fi
echo "Alan adı: $DOMAIN | Gemini anahtarı: $(grep -q '^GEMINI_API_KEY=.' .env && echo kayıtlı || echo yok)"

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
