#!/bin/bash
# create_network_vlan.sh

# Parámetros:
# $1 - VLAN ID
# $2 - Dirección de red en formato CIDR (ej: 192.168.0.0/24)
# $3 - DHCP activo: "yes" o "no"
# $4 - Rango DHCP (si DHCP=yes): "IP_INICIO,IP_FIN"
# Ejemplo: 192.168.0.10,192.168.0.100
#
# Uso:
# ./create_network_vlan.sh 100 192.168.0.0/24 yes 192.168.0.10,192.168.0.100

set -e

VLAN_ID="$1"
CIDR="$2"
DHCP="$3"
DHCP_RANGE="$4"

if [ -z "$VLAN_ID" ] || [ -z "$CIDR" ] || [ -z "$DHCP" ]; then
  echo "Error: parámetros insuficientes."
  echo "Uso: $0 <VLAN_ID> <CIDR> <yes|no> [rango_dhcp]"
  exit 1
fi

BRIDGE="br-int"
PORT_NAME="gw_vlan${VLAN_ID}"
NS_NAME="dhcp_vlan${VLAN_ID}"
VETH_HOST="veth_h_${VLAN_ID}"
VETH_NS="veth_ns_${VLAN_ID}"

# Extraer red y prefijo
NETWORK=$(echo "$CIDR" | cut -d'/' -f1)
PREFIX=$(echo "$CIDR" | cut -d'/' -f2)

# Calcular IPs
GATEWAY=$(echo "$NETWORK" | awk -F'.' '{print $1"."$2"."$3".1"}')
DHCP_IP=$(echo "$NETWORK" | awk -F'.' '{print $1"."$2"."$3".2"}')

echo "=== Configuración ==="
echo "VLAN ID : $VLAN_ID"
echo "CIDR : $CIDR"
echo "Gateway : $GATEWAY/$PREFIX"
echo "DHCP : $DHCP"

# 1. Crear puerto interno en OvS
if sudo ovs-vsctl list-ports "$BRIDGE" | grep -wq "$PORT_NAME"; then
  echo "El puerto $PORT_NAME ya existe en $BRIDGE."
else
  echo "Creando puerto interno OvS: $PORT_NAME (VLAN $VLAN_ID)"
  sudo ovs-vsctl add-port "$BRIDGE" "$PORT_NAME" tag="$VLAN_ID" \
    -- set interface "$PORT_NAME" type=internal
fi

# Asignar IP al gateway
sudo ip link set "$PORT_NAME" up

if ! ip addr show "$PORT_NAME" | grep -q "$GATEWAY/$PREFIX"; then
  sudo ip addr add "$GATEWAY/$PREFIX" dev "$PORT_NAME"
fi

echo "Gateway $GATEWAY/$PREFIX configurado en $PORT_NAME"

# 2. DHCP opcional
if [ "$DHCP" == "yes" ]; then

  if [ -z "$DHCP_RANGE" ]; then
    echo "Error: se requiere rango DHCP cuando DHCP=yes"
    exit 1
  fi

  RANGE_START=$(echo "$DHCP_RANGE" | cut -d',' -f1)
  RANGE_END=$(echo "$DHCP_RANGE" | cut -d',' -f2)

  echo "[INFO] Configurando DHCP..."

  # Crear namespace si no existe
  if ! ip netns list | grep -qw "$NS_NAME"; then
    sudo ip netns add "$NS_NAME"
  fi

  # Crear veth pair si no existe
  if ! ip link show "$VETH_HOST" &>/dev/null; then
    sudo ip link add "$VETH_HOST" type veth peer name "$VETH_NS"
  fi

  # Conectar host side al bridge
  sudo ovs-vsctl --may-exist add-port "$BRIDGE" "$VETH_HOST" tag="$VLAN_ID"

  # Mover veth al namespace
  sudo ip link set "$VETH_NS" netns "$NS_NAME"

  # Levantar interfaces
  sudo ip link set "$VETH_HOST" up
  sudo ip netns exec "$NS_NAME" ip link set lo up
  sudo ip netns exec "$NS_NAME" ip link set "$VETH_NS" up

  # Asignar IP al DHCP
  sudo ip netns exec "$NS_NAME" ip addr add "$DHCP_IP/$PREFIX" dev "$VETH_NS"

  # Ejecutar dnsmasq
  sudo ip netns exec "$NS_NAME" dnsmasq \
    --interface="$VETH_NS" \
    --bind-interfaces \
    --dhcp-range="$RANGE_START,$RANGE_END,$PREFIX" \
    --dhcp-option=3,"$GATEWAY" \
    --dhcp-option=6,8.8.8.8

  echo "[OK] DHCP activo en $NS_NAME ($DHCP_IP)"

else
  echo "[INFO] DHCP deshabilitado"
fi

echo "[OK] VLAN $VLAN_ID configurada correctamente"

