#!/usr/bin/env bash
# Gemini API anahtarını sunucuya kaydeder ve Google'a gerçekten bağlanıp bağlanmadığını test eder.
# Sunucunun içinde çalıştırın (anahtar sorulunca yapıştırın; ekranda görünmez):
#   bash <(curl -fsSL https://raw.githubusercontent.com/codessue/PAtiApp/main/deploy/gemini-anahtar.sh)
set -euo pipefail
cd ~/patiapp

read -rsp "Gemini API anahtarını yapıştırıp Enter'a basın (görünmez, mevcut anahtarı test etmek için boş bırakın): " KEY; echo
if [ -n "$KEY" ]; then
  sed -i "s|^GEMINI_API_KEY=.*|GEMINI_API_KEY=$KEY|" .env
  echo "Anahtar kaydedildi, API yeniden başlatılıyor..."
  sudo docker compose -f docker-compose.prod.yml up -d api >/dev/null 2>&1
fi
KEY=$(grep '^GEMINI_API_KEY=' .env | cut -d= -f2)
[ -n "$KEY" ] || { echo "Sunucuda kayıtlı Gemini anahtarı yok."; exit 1; }

MODEL=$(grep -o '"Model": *"[^"]*"' backend/Pati.API/appsettings.json | cut -d'"' -f4)
API=https://generativelanguage.googleapis.com/v1beta

echo
echo "== Uygulamanın kullandığı model: $MODEL"
code=$(curl -sS --max-time 60 -o /tmp/gemini.json -w '%{http_code}' -H "x-goog-api-key: $KEY" -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Sadece OK yaz."}]}]}' "$API/models/$MODEL:generateContent" 2>/tmp/gemini.err) \
  || { echo "Google'a bağlanılamadı:"; cat /tmp/gemini.err; exit 1; }
echo "HTTP $code"
if [ "$code" = 200 ]; then
  echo "BAŞARILI: Gemini anahtarı ve model çalışıyor."
else
  head -c 600 /tmp/gemini.json; echo
  echo
  echo "== Bu anahtarla kullanılabilen 'flash' modelleri:"
  curl -s -H "x-goog-api-key: $KEY" "$API/models?pageSize=200" \
    | grep -o '"name": *"models/[^"]*flash[^"]*"' | cut -d'"' -f4 | sed 's|models/|  |'
fi
