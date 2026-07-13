#!/bin/bash
set -e

if [ "$#" -ne 2 ]; then
    echo "Uso: $0 <VLAN_ID_1> <VLAN_ID_2>"
    echo "Ejemplo: $0 100 200"
    exit 1
fi

VLAN1="$1"
VLAN2="$2"

IFACE1="gw_vlan${VLAN1}"
IFACE2="gw_vlan${VLAN2}"

while sudo iptables -C FORWARD -i "$IFACE1" -o "$IFACE2" -j ACCEPT 2>/dev/null; do
    sudo iptables -D FORWARD -i "$IFACE1" -o "$IFACE2" -j ACCEPT
done

while sudo iptables -C FORWARD -i "$IFACE2" -o "$IFACE1" -j ACCEPT 2>/dev/null; do
    sudo iptables -D FORWARD -i "$IFACE2" -o "$IFACE1" -j ACCEPT
done

echo "Ruteo deshabilitado entre VLAN $VLAN1 y VLAN $VLAN2."

