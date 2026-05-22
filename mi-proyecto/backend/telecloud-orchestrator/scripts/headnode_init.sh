#!/bin/bash
set -e

if [ "$#" -lt 1 ]; then
    echo "Uso: $0 <InterfacesAConectar>"
    echo "Ejemplo: $0 ens4"
    exit 1
fi

BRIDGE="br-int"
INTERFACES="$@"

sudo ovs-vsctl --may-exist add-br "$BRIDGE"
sudo ip link set "$BRIDGE" up

for IFACE in $INTERFACES; do
    if [ "$IFACE" = "ens3" ]; then
        echo "ERROR: No se permite agregar ens3 al bridge OVS."
        exit 1
    fi

    sudo ip link set "$IFACE" up
    sudo ovs-vsctl --may-exist add-port "$BRIDGE" "$IFACE"
done

sudo sysctl -w net.ipv4.ip_forward=1
sudo iptables -P FORWARD DROP

echo "Head Node inicializado correctamente."
