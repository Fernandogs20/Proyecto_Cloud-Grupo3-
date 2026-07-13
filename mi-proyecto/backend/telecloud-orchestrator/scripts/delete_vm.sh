#!/bin/bash
set -e

if [ "$#" -ne 4 ]; then
    echo "Uso: $0 <NombreVM> <NombreOvS> <VLAN_ID> <PuertoVNC>"
    echo "Ejemplo: $0 demo3v1 br-int 120 20"
    exit 1
fi

VM_NAME="$1"
OVS_BR="$2"
VLAN_ID="$3"
VNC_PORT="$4"

IMG_DIR="/var/lib/tel141/images"
BASE_IMG="$IMG_DIR/cirros-0.5.1-x86_64-disk.img"
VM_DISK="$IMG_DIR/${VM_NAME}.qcow2"
SEED_ISO="$IMG_DIR/${VM_NAME}-seed.iso"
TAP_IFACE="tap_${VM_NAME}"
PID_FILE="/tmp/${VM_NAME}.pid"

echo "[INFO] Eliminando VM $VM_NAME"

echo "[1] Deteniendo proceso QEMU por PID si existe..."
if [ -f "$PID_FILE" ]; then
    PID="$(sudo cat "$PID_FILE" 2>/dev/null || true)"
    if [ -n "$PID" ]; then
        sudo kill "$PID" 2>/dev/null || true
        sleep 1
        sudo kill -9 "$PID" 2>/dev/null || true
    fi
    sudo rm -f "$PID_FILE"
fi

echo "[2] Deteniendo proceso QEMU por nombre si quedó vivo..."
sudo pkill -f "qemu-system.*-name ${VM_NAME}" 2>/dev/null || true
sudo pkill -f "qemu-system.*${VM_DISK}" 2>/dev/null || true
sudo pkill -f "qemu-system.*${TAP_IFACE}" 2>/dev/null || true

echo "[3] Eliminando TAP de OVS..."
sudo ovs-vsctl --if-exists del-port "$OVS_BR" "$TAP_IFACE" || true

echo "[4] Eliminando interfaz TAP..."
sudo ip link del "$TAP_IFACE" 2>/dev/null || true

echo "[5] Eliminando disco delta..."
sudo rm -f "$VM_DISK" "$SEED_ISO"

echo "[6] Verificación posterior..."
pgrep -af "$VM_NAME" || true
ip -br link | grep "$TAP_IFACE" || true
sudo ovs-vsctl list-ports "$OVS_BR" 2>/dev/null | grep "$TAP_IFACE" || true

echo "VM $VM_NAME eliminada correctamente."
