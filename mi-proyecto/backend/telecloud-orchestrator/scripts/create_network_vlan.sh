#!/bin/bash
set -e

if [ "$#" -lt 3 ]; then
    echo "Uso: $0 <VLAN_ID> <CIDR> <DHCP:true|false> [DHCP_RANGE]"
    echo "Ejemplo sin DHCP: $0 100 192.168.0.0/24 false"
    echo "Ejemplo con DHCP: $0 200 192.168.2.0/24 true 192.168.2.50,192.168.2.150,12h"
    exit 1
fi

VLAN_ID="$1"
CIDR="$2"
DHCP_ENABLED="$3"
DHCP_RANGE="$4"

BRIDGE="br-int"
GW_IFACE="gw_vlan${VLAN_ID}"

NETWORK_INFO=$(python3 - <<EOF
import ipaddress
net = ipaddress.ip_network("$CIDR", strict=False)
hosts = list(net.hosts())
print(hosts[0])
print(hosts[1])
print(net.prefixlen)
EOF
)

GW_IP=$(echo "$NETWORK_INFO" | sed -n '1p')
DHCP_IP=$(echo "$NETWORK_INFO" | sed -n '2p')
PREFIX=$(echo "$NETWORK_INFO" | sed -n '3p')

sudo ovs-vsctl --may-exist add-br "$BRIDGE"

sudo ovs-vsctl --may-exist add-port "$BRIDGE" "$GW_IFACE" tag="$VLAN_ID" -- set interface "$GW_IFACE" type=internal
sudo ip link set "$GW_IFACE" up
sudo ip addr flush dev "$GW_IFACE" || true
sudo ip addr add "$GW_IP/$PREFIX" dev "$GW_IFACE"

echo "Gateway creado: $GW_IFACE con IP $GW_IP/$PREFIX para VLAN $VLAN_ID."

if [ "$DHCP_ENABLED" = "true" ]; then
    if [ -z "$DHCP_RANGE" ]; then
        echo "ERROR: Debe indicar el rango DHCP."
        exit 1
    fi

    NS="ns-dhcp-vlan${VLAN_ID}"
    DHCP_IFACE="dhcp_v${VLAN_ID}"

    sudo ip netns add "$NS" 2>/dev/null || true

    sudo ovs-vsctl --if-exists del-port "$BRIDGE" "$DHCP_IFACE"
    sudo ovs-vsctl add-port "$BRIDGE" "$DHCP_IFACE" tag="$VLAN_ID" -- set interface "$DHCP_IFACE" type=internal

    sudo ip link set "$DHCP_IFACE" netns "$NS"
    sudo ip netns exec "$NS" ip link set lo up
    sudo ip netns exec "$NS" ip link set "$DHCP_IFACE" up
    sudo ip netns exec "$NS" ip addr flush dev "$DHCP_IFACE" || true
    sudo ip netns exec "$NS" ip addr add "$DHCP_IP/$PREFIX" dev "$DHCP_IFACE"

    sudo ip netns exec "$NS" pkill dnsmasq 2>/dev/null || true

    sudo ip netns exec "$NS" dnsmasq \
        --interface="$DHCP_IFACE" \
        --bind-interfaces \
        --except-interface=lo \
        --dhcp-range="$DHCP_RANGE" \
        --dhcp-option=3,"$GW_IP" \
        --dhcp-option=6,8.8.8.8 \
        --port=0 \
        --pid-file="/tmp/dnsmasq-vlan${VLAN_ID}.pid" \
        --dhcp-leasefile="/tmp/dnsmasq-vlan${VLAN_ID}.leases"

    echo "DHCP habilitado en namespace $NS con interfaz $DHCP_IFACE."
fi
