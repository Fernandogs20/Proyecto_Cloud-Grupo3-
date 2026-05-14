#!/bin/bash
# disable_internet_to_network.sh
# Parámetros:
# $1 - VLAN ID
# $2 - Dirección de red en formato CIDR (ej: 192.168.0.0/24)
# Uso: ./disable_internet_to_network.sh 100 192.168.0.0/24
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
echo "=== Eliminando reglas de salida a internet para VLAN $VLAN_ID ($CIDR) ==="
# Eliminar reglas FORWARD creadas por internet_to_network.sh
sudo iptables -D FORWARD -i "$PORT_NAME" -o "$INTERNET_IFACE" -s "$CIDR" -j ACCEPT
2>/dev/null && \
 echo "Regla FORWARD ($PORT_NAME -> $INTERNET_IFACE) eliminada." || \
 echo "Advertencia: regla FORWARD ($PORT_NAME -> $INTERNET_IFACE) no
encontrada."
sudo iptables -D FORWARD -i "$INTERNET_IFACE" -o "$PORT_NAME" -d "$CIDR" -m state -
-state RELATED,ESTABLISHED -j ACCEPT 2>/dev/null && \
 echo "Regla FORWARD ($INTERNET_IFACE -> $PORT_NAME) eliminada." || \
 echo "Advertencia: regla FORWARD ($INTERNET_IFACE -> $PORT_NAME) no
encontrada."
# Eliminar regla NAT POSTROUTING
sudo iptables -t nat -D POSTROUTING -s "$CIDR" -o "$INTERNET_IFACE" -j MASQUERADE
2>/dev/null && \
 echo "Regla NAT MASQUERADE eliminada." || \
 echo "Advertencia: regla NAT MASQUERADE no encontrada."
echo "disable_internet_to_network.sh completado exitosamente."
