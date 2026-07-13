#!/bin/bash
set -e

if [ "$#" -ne 2 ]; then
    echo "Uso: $0 <VLAN_ID> <CIDR>"
    echo "Ejemplo: $0 100 192.168.0.0/24"
    exit 1
fi

VLAN_ID="$1"
CIDR="$2"

GW_IFACE="gw_vlan${VLAN_ID}"
WAN_IFACE="ens3"

while sudo iptables -t nat -C POSTROUTING -s "$CIDR" -o "$WAN_IFACE" -j MASQUERADE 2>/dev/null; do
    sudo iptables -t nat -D POSTROUTING -s "$CIDR" -o "$WAN_IFACE" -j MASQUERADE
done

while sudo iptables -C FORWARD -i "$GW_IFACE" -o "$WAN_IFACE" -j ACCEPT 2>/dev/null; do
    sudo iptables -D FORWARD -i "$GW_IFACE" -o "$WAN_IFACE" -j ACCEPT
done

while sudo iptables -C FORWARD -i "$WAN_IFACE" -o "$GW_IFACE" -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT 2>/dev/null; do
    sudo iptables -D FORWARD -i "$WAN_IFACE" -o "$GW_IFACE" -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
done

echo "Internet deshabilitado para VLAN $VLAN_ID."
