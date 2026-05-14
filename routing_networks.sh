#!/bin/bash
# routing_networks.sh
# Parámetros:
# $1 - VLAN ID 1
# $2 - VLAN ID 2
# Uso: ./routing_networks.sh 100 200
set -e
VLAN_ID1="$1"
VLAN_ID2="$2"
if [ -z "$VLAN_ID1" ] || [ -z "$VLAN_ID2" ]; then
 echo "Error: parámetros insuficientes."
 echo "Uso: $0 <VLAN_ID_1> <VLAN_ID_2>"
 exit 1
fi
PORT1="gw_vlan${VLAN_ID1}"
PORT2="gw_vlan${VLAN_ID2}"
echo "=== Habilitando ruteo entre VLAN $VLAN_ID1 y VLAN $VLAN_ID2 ==="
# Permitir tráfico FORWARD entre las dos VLANs (bidireccional)
sudo iptables -A FORWARD -i "$PORT1" -o "$PORT2" -j ACCEPT
sudo iptables -A FORWARD -i "$PORT2" -o "$PORT1" -j ACCEPT
echo "Ruteo habilitado: VLAN $VLAN_ID1 <-> VLAN $VLAN_ID2"
echo "routing_networks.sh completado exitosamente."
