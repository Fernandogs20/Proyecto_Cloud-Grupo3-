#!/bin/bash
# disable_routing_networks.sh
# Parámetros:
# $1 - VLAN ID 1
# $2 - VLAN ID 2
# Uso: ./disable_routing_networks.sh 100 200
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
echo "=== Deshabilitando ruteo entre VLAN $VLAN_ID1 y VLAN $VLAN_ID2 ==="
# Eliminar reglas FORWARD creadas por routing_networks.sh
sudo iptables -D FORWARD -i "$PORT1" -o "$PORT2" -j ACCEPT 2>/dev/null && \
 echo "Regla FORWARD ($PORT1 -> $PORT2) eliminada." || \
 echo "Advertencia: regla ($PORT1 -> $PORT2) no encontrada."
sudo iptables -D FORWARD -i "$PORT2" -o "$PORT1" -j ACCEPT 2>/dev/null && \
 echo "Regla FORWARD ($PORT2 -> $PORT1) eliminada." || \
 echo "Advertencia: regla ($PORT2 -> $PORT1) no encontrada."
echo "Ruteo deshabilitado: VLAN $VLAN_ID1 <-> VLAN $VLAN_ID2"
echo "disable_routing_networks.sh completado exitosamente."
