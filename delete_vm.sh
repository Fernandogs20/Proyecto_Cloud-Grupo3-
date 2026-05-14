#!/bin/bash
# delete_vm.sh
# Parámetros:
# $1 - Nombre VM
# $2 - Nombre OvS (bridge)
# $3 - VLAN ID
# $4 - Puerto VNC
# Uso: ./delete_vm.sh vm1 br-int 100 5901
set -e
VM_NAME="$1"
OVS_NAME="$2"
VLAN_ID="$3"
VNC_PORT="$4"
if [ -z "$VM_NAME" ] || [ -z "$OVS_NAME" ] || [ -z "$VLAN_ID" ] || [ -z "$VNC_PORT"
]; then
 echo "Error: parámetros insuficientes."
echo "Uso: $0 <NombreVM> <NombreOvS> <VLAN_ID> <PuertoVNC>"
exit 1
fi
TAP_NAME="tap_${VM_NAME}"
DISK_PATH="/var/lib/vms/${VM_NAME}.qcow2"
BASE_IMAGE="/var/lib/vms/cirros-base.img"
PID_FILE="/var/run/${VM_NAME}.pid"
echo "=== Eliminando VM: $VM_NAME ==="
# 1. Detener la VM usando el PID file
if [ -f "$PID_FILE" ]; then
 VM_PID=$(cat "$PID_FILE")
if sudo kill -0 "$VM_PID" 2>/dev/null; then
 echo "Deteniendo VM $VM_NAME (PID: $VM_PID)..."
sudo kill "$VM_PID"
sleep 2
# Forzar si sigue corriendo
sudo kill -9 "$VM_PID" 2>/dev/null || true
 fi
sudo rm -f "$PID_FILE"
echo "PID file eliminado."
else
 echo "Advertencia: PID file no encontrado para $VM_NAME."
# Intentar matar por nombre
sudo pkill -f "kvm.*-name $VM_NAME" 2>/dev/null || true
fi
# 2. Eliminar puerto TAP del OvS
if sudo ovs-vsctl list-ports "$OVS_NAME" | grep -q "^${TAP_NAME}$"; then
 echo "Eliminando puerto TAP $TAP_NAME del bridge $OVS_NAME..."
sudo ovs-vsctl del-port "$OVS_NAME" "$TAP_NAME"
fi
# Eliminar interfaz TAP del sistema
if ip link show "$TAP_NAME" &>/dev/null; then
 echo "Eliminando interfaz TAP $TAP_NAME..."
sudo ip link delete "$TAP_NAME"
fi
# 3. Eliminar disco delta (overlay) de la VM
if [ -f "$DISK_PATH" ]; then
 echo "Eliminando disco de VM: $DISK_PATH"
sudo rm -f "$DISK_PATH"
else
 echo "Disco $DISK_PATH no encontrado."
fi

