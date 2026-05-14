#!/bin/bash
# create_vm.sh
# Parámetros:
#   $1 - Nombre VM
#   $2 - Nombre OvS (bridge)
#   $3 - VLAN ID
#   $4 - Puerto VNC
# Uso: ./create_vm.sh vm-vlan100 br-int 100 1

set -e

VM_NAME="$1"
OVS_NAME="$2"
VLAN_ID="$3"
VNC_PORT="$4"

if [ -z "$VM_NAME" ] || [ -z "$OVS_NAME" ] || [ -z "$VLAN_ID" ] || [ -z "$VNC_PORT" ]; then
    echo "Error: parámetros insuficientes."
    echo "Uso: $0 <NombreVM> <NombreOvS> <VLAN_ID> <PuertoVNC>"
    exit 1
fi

TAP_NAME="tap_${VM_NAME}"
VM_DIR="/var/lib/vms"
BASE_IMAGE="${VM_DIR}/cirros-base.img"
DISK_PATH="${VM_DIR}/${VM_NAME}.qcow2"
BASE_IMAGE_URL="https://download.cirros-cloud.net/0.6.2/cirros-0.6.2-x86_64-disk.img"

echo "=== Creando VM: $VM_NAME ==="
echo "Bridge OvS : $OVS_NAME"
echo "VLAN ID    : $VLAN_ID"
echo "Puerto VNC : $VNC_PORT"
echo "TAP        : $TAP_NAME"
echo "Disco      : $DISK_PATH"

# 0. Crear directorio para VMs
sudo mkdir -p "$VM_DIR"

# 1. Verificar/descargar imagen base cirros
if [ -f "$BASE_IMAGE" ]; then
    FORMAT=$(sudo qemu-img info "$BASE_IMAGE" 2>/dev/null | grep "file format" | awk '{print $3}')
    if [ -z "$FORMAT" ]; then
        echo "Imagen base corrupta. Eliminando y volviendo a descargar..."
        sudo rm -f "$BASE_IMAGE"
    else
        echo "Imagen base encontrada: $BASE_IMAGE (formato: $FORMAT)"
    fi
fi

if [ ! -f "$BASE_IMAGE" ]; then
    echo "Descargando imagen cirros..."
    sudo wget --no-check-certificate -O "$BASE_IMAGE" "$BASE_IMAGE_URL"
    echo "Imagen descargada."
fi

# 2. Convertir a qcow2 si la imagen base no lo es
FORMAT=$(sudo qemu-img info "$BASE_IMAGE" | grep "file format" | awk '{print $3}')
if [ "$FORMAT" != "qcow2" ]; then
    echo "Convirtiendo imagen base a formato qcow2..."
    sudo qemu-img convert -f "$FORMAT" -O qcow2 "$BASE_IMAGE" "${BASE_IMAGE}.qcow2"
    sudo mv "${BASE_IMAGE}.qcow2" "$BASE_IMAGE"
    echo "Conversion completada."
fi

# 3. Crear disco delta sobre imagen base
if [ -f "$DISK_PATH" ]; then
    echo "El disco $DISK_PATH ya existe, se omite la creacion."
else
    echo "Creando disco delta..."
    sudo qemu-img create -f qcow2 -b "$BASE_IMAGE" -F qcow2 "$DISK_PATH"
    echo "Disco delta creado: $DISK_PATH"
fi

# 4. Crear interfaz TAP
if ip link show "$TAP_NAME" &>/dev/null; then
    echo "La interfaz TAP $TAP_NAME ya existe."
else
    echo "Creando interfaz TAP: $TAP_NAME"
    sudo ip tuntap add mode tap name "$TAP_NAME"
    sudo ip link set "$TAP_NAME" up
fi

# 5. Conectar TAP al OvS con tag VLAN
if sudo ovs-vsctl list-ports "$OVS_NAME" | grep -q "^${TAP_NAME}$"; then
    echo "TAP $TAP_NAME ya esta en el bridge $OVS_NAME."
else
    echo "Conectando $TAP_NAME al bridge $OVS_NAME con tag VLAN $VLAN_ID"
    sudo ovs-vsctl add-port "$OVS_NAME" "$TAP_NAME" tag="$VLAN_ID"
fi

# 6. Lanzar VM con KVM
echo "Lanzando VM $VM_NAME..."
sudo kvm \
    -name "$VM_NAME" \
    -m 256 \
    -drive file="$DISK_PATH",format=qcow2 \
    -netdev tap,id=net0,ifname="$TAP_NAME",script=no,downscript=no \
    -device virtio-net-pci,netdev=net0 \
    -vnc :"$VNC_PORT" \
    -daemonize \
    -pidfile "/var/run/${VM_NAME}.pid"

echo "VM $VM_NAME lanzada exitosamente."
echo "Puerto VNC: $((5900 + VNC_PORT))"
echo "create_vm.sh completado exitosamente."