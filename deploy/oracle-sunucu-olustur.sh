#!/usr/bin/env bash
# Pati sunucusunu Oracle Cloud Always Free üzerinde oluşturur.
# Oracle Cloud Shell'de çalıştırın (konsolda sağ üstteki >_ simgesi):
#   bash <(curl -fsSL https://raw.githubusercontent.com/codessue/PAtiApp/main/deploy/oracle-sunucu-olustur.sh)
#
# Yalnızca Always Free kaynakları kullanır:
#   VM.Standard.A1.Flex (2 OCPU / 12 GB), 50 GB disk, 1 VCN, herkese açık IP.
# Tekrar çalıştırılabilir: var olan ağı ve sunucuyu yeniden oluşturmaz.
set -euo pipefail

C="${OCI_TENANCY:?Bu betik Oracle Cloud Shell içinde çalıştırılmalı}"
NAME=pati-server
KEY=~/.ssh/pati

say() { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }

# --- SSH anahtarı (Cloud Shell'de saklanır, buradan sunucuya bağlanılır) ---
if [ ! -f "$KEY" ]; then
  say "SSH anahtarı oluşturuluyor"
  mkdir -p ~/.ssh && rm -f "$KEY" "$KEY.pub"
  ssh-keygen -t rsa -b 4096 -N "" -f "$KEY" -C pati-server >/dev/null
fi

# --- Ağ (VCN, internet geçidi, 22/80/443 açık) ---
VCN=$(oci network vcn list -c "$C" --display-name pati-vcn --lifecycle-state AVAILABLE \
  --query 'data[0].id' --raw-output 2>/dev/null || true)
if [ -z "$VCN" ] || [ "$VCN" = "null" ]; then
  say "Ağ oluşturuluyor"
  VCN=$(oci network vcn create -c "$C" --cidr-blocks '["10.0.0.0/16"]' \
    --display-name pati-vcn --dns-label pativcn \
    --wait-for-state AVAILABLE --query data.id --raw-output)

  IGW=$(oci network internet-gateway create -c "$C" --vcn-id "$VCN" --is-enabled true \
    --display-name pati-igw --wait-for-state AVAILABLE --query data.id --raw-output)

  RT=$(oci network vcn get --vcn-id "$VCN" --query 'data."default-route-table-id"' --raw-output)
  oci network route-table update --rt-id "$RT" --force \
    --route-rules "[{\"destination\":\"0.0.0.0/0\",\"destinationType\":\"CIDR_BLOCK\",\"networkEntityId\":\"$IGW\"}]" >/dev/null

  SL=$(oci network vcn get --vcn-id "$VCN" --query 'data."default-security-list-id"' --raw-output)
  rule() { echo "{\"source\":\"0.0.0.0/0\",\"protocol\":\"6\",\"tcpOptions\":{\"destinationPortRange\":{\"min\":$1,\"max\":$1}}}"; }
  oci network security-list update --security-list-id "$SL" --force \
    --ingress-security-rules "[$(rule 22),$(rule 80),$(rule 443),{\"source\":\"0.0.0.0/0\",\"protocol\":\"1\",\"icmpOptions\":{\"type\":3,\"code\":4}}]" \
    --egress-security-rules '[{"destination":"0.0.0.0/0","protocol":"all"}]' >/dev/null
fi

SUBNET=$(oci network subnet list -c "$C" --vcn-id "$VCN" --display-name pati-subnet \
  --lifecycle-state AVAILABLE --query 'data[0].id' --raw-output 2>/dev/null || true)
if [ -z "$SUBNET" ] || [ "$SUBNET" = "null" ]; then
  SUBNET=$(oci network subnet create -c "$C" --vcn-id "$VCN" --cidr-block 10.0.0.0/24 \
    --display-name pati-subnet --dns-label patisub \
    --wait-for-state AVAILABLE --query data.id --raw-output)
fi

# --- Ubuntu 24.04 (ARM) imajı ---
IMG=$(oci compute image list -c "$C" --operating-system "Canonical Ubuntu" \
  --operating-system-version "24.04" --shape VM.Standard.A1.Flex \
  --sort-by TIMECREATED --sort-order DESC --query 'data[0].id' --raw-output)
[ -n "$IMG" ] && [ "$IMG" != "null" ] || { echo "Ubuntu 24.04 imajı bulunamadı"; exit 1; }

# --- İlk açılışta güvenlik duvarını aç ve Docker'ı kur ---
INIT=$(mktemp)
cat > "$INIT" <<'EOF'
#!/bin/bash
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
netfilter-persistent save
curl -fsSL https://get.docker.com | sh
usermod -aG docker ubuntu
EOF

# --- Sunucu ---
INSTANCE=$(oci compute instance list -c "$C" --display-name "$NAME" \
  --query 'data[?"lifecycle-state"!=`TERMINATED`] | [0].id' --raw-output 2>/dev/null || true)
if [ -z "$INSTANCE" ] || [ "$INSTANCE" = "null" ]; then
  for AD in $(oci iam availability-domain list -c "$C" --query 'data[].name' --raw-output | tr -d '[]",'); do
    say "Sunucu oluşturuluyor ($AD)"
    if INSTANCE=$(oci compute instance launch -c "$C" --availability-domain "$AD" \
        --display-name "$NAME" --shape VM.Standard.A1.Flex \
        --shape-config '{"ocpus":2,"memoryInGBs":12}' \
        --image-id "$IMG" --subnet-id "$SUBNET" --assign-public-ip true \
        --ssh-authorized-keys-file "$KEY.pub" --user-data-file "$INIT" \
        --wait-for-state RUNNING --query data.id --raw-output 2>/tmp/pati-launch.err); then
      break
    fi
    INSTANCE=""
    if grep -qi "capacity" /tmp/pati-launch.err; then
      echo "Bu bölgede şu an kapasite yok, diğerine geçiliyor..."
    else
      cat /tmp/pati-launch.err; exit 1
    fi
  done
fi
[ -n "$INSTANCE" ] || { echo; echo "Şu an hiçbir bölgede ücretsiz ARM kapasitesi yok. Birkaç saat sonra aynı komutu tekrar çalıştırın."; exit 1; }

IP=$(oci compute instance list-vnics --instance-id "$INSTANCE" --query 'data[0]."public-ip"' --raw-output)

say "Sunucu hazır"
cat <<EOF

  Herkese açık IP:  $IP

  Sunucuya bağlanmak için (Docker kurulumu için 3-4 dakika bekleyin):
    ssh -i $KEY ubuntu@$IP

EOF
