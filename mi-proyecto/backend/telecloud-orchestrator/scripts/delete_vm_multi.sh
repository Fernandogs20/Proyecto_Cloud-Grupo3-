#!/bin/bash
set -e

if [ "$#" -ne 2 ]; then
    echo "Uso: $0 <VM_NAME> <OVS_BR>"
    echo "Ejemplo: $0 vm1 br-int"
    exit 1
fi

VM_NAME="$1"
OVS_BR="$2"

IMG_DIR="/var/lib/tel141/images"
VM_DISK="$IMG_DIR/${VM_NAME}.qcow2"
SEED_ISO="$IMG_DIR/${VM_NAME}-seed.iso"
PID_FILE="/tmp/${VM_NAME}.pid"

echo "[INFO] Eliminando VM $VM_NAME"

echo "[1] Deteniendo QEMU por PID si existe..."
if [ -f "$PID_FILE" ]; then
    PID="$(sudo cat "$PID_FILE" 2>/dev/null || true)"
    if [ -n "$PID" ]; then
        sudo kill "$PID" 2>/dev/null || true
        sleep 1
        sudo kill -9 "$PID" 2>/dev/null || true
    fi
    sudo rm -f "$PID_FILE"
fi

echo "[2] Deteniendo QEMU por nombre si quedó vivo..."
sudo pkill -f "qemu-system.*-name ${VM_NAME}" 2>/dev/null || true
sudo pkill -f "qemu-system.*${VM_DISK}" 2>/dev/null || true

echo "[3] Eliminando puertos TAP asociados a la VM..."
PORTS=$(sudo ovs-vsctl list-ports "$OVS_BR" 2>/dev/null | grep "^tap_${VM_NAME}_" || true)

for P in $PORTS; do
    echo "  - Eliminando puerto OVS $P"
    sudo ovs-vsctl --if-exists del-port "$OVS_BR" "$P"
done

echo "[4] Eliminando interfaces TAP del sistema..."
LINKS=$(ip -br link | awk '{print $1}' | sed 's/@.*//' | grep "^tap_${VM_NAME}_" || true)

for I in $LINKS; do
    echo "  - Eliminando interfaz $I"
    sudo ip link set "$I" down 2>/dev/null || true
    sudo ip link del "$I" 2>/dev/null || true
    sudo ip tuntap del dev "$I" mode tap 2>/dev/null || true
done

echo "[5] Eliminando disco delta y config-drive..."
sudo rm -f "$VM_DISK"
sudo rm -f "$SEED_ISO"

echo "[6] Verificación posterior..."
pgrep -af "$VM_NAME" || true
sudo ovs-vsctl list-ports "$OVS_BR" 2>/dev/null | grep "^tap_${VM_NAME}_" || true
ip -br link | grep "^tap_${VM_NAME}_" || true
sudo ls -lh "$IMG_DIR" | grep "$VM_NAME" || true

echo "[OK] VM $VM_NAME eliminada correctamente."
