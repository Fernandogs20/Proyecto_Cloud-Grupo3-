#!/bin/bash
# internet_to_network.sh
# Parámetros:
# $1 - VLAN ID
# $2 - Dirección de red en formato CIDR (ej: 192.168.0.0/24)
# Uso: ./internet_to_network.sh 100 192.168.0.0/24

set -e

VLAN_ID="$1"
CIDR="$2"

if [ -z "$VLAN_ID" ] || [ -z "$CIDR" ]; then
  echo "Error: parámetros insuficientes."
  echo "Uso: $0 <VLAN_ID> <CIDR>"
  exit 1
fi

PORT_NAME="gw_vlan${VLAN_ID}"
INTERNET_IFACE="ens3"

echo "=== Configurando salida a internet para VLAN $VLAN_ID ($CIDR) ==="

# 1. FORWARD: VLAN -> Internet
sudo iptables -A FORWARD -i "$PORT_NAME" -o "$INTERNET_IFACE" -s "$CIDR" -j ACCEPT

# 2. FORWARD: Internet -> VLAN (solo respuestas)
sudo iptables -A FORWARD -i "$INTERNET_IFACE" -o "$PORT_NAME" \
  -d "$CIDR" -m state --state RELATED,ESTABLISHED -j ACCEPT

# 3. NAT
sudo iptables -t nat -A POSTROUTING -s "$CIDR" -o "$INTERNET_IFACE" -j MASQUERADE

echo "Reglas NAT y FORWARD configuradas para VLAN $VLAN_ID ($CIDR) -> $INTERNET_IFACE"
echo "internet_to_network.sh completado exitosamente."
