#!/bin/bash
set -e

if [ "$#" -ne 4 ]; then
    echo "Uso: $0 <NombreVM> <NombreOvS> <VLAN_ID> <PuertoVNC>"
    echo "Ejemplo: $0 vm_vlan100 br-int 100 1"
    exit 1
fi

VM_NAME="$1"
OVS_BR="$2"
VLAN_ID="$3"
VNC_PORT="$4"

IMG_DIR="/var/lib/tel141/images"
BASE_IMG="$IMG_DIR/cirros-0.5.1-x86_64-disk.img"
VM_DISK="$IMG_DIR/${VM_NAME}.qcow2"
TAP_IFACE="tap_${VM_NAME}"
PID_FILE="/tmp/${VM_NAME}.pid"

SEED_ISO="$IMG_DIR/${VM_NAME}-seed.iso"
SEED_DIR="/tmp/${VM_NAME}-seed"


sudo mkdir -p "$IMG_DIR"

if [ ! -f "$BASE_IMG" ]; then
    echo "Descargando imagen base CirrOS..."
    sudo wget -O "$BASE_IMG" https://download.cirros-cloud.net/0.5.1/cirros-0.5.1-x86_64-disk.img
fi

if [ ! -f "$VM_DISK" ]; then
    sudo qemu-img create -f qcow2 -F qcow2 -b "$BASE_IMG" "$VM_DISK"
fi

if ! ip link show "$TAP_IFACE" >/dev/null 2>&1; then
    sudo ip tuntap add dev "$TAP_IFACE" mode tap
fi

sudo ip link set "$TAP_IFACE" up
sudo ovs-vsctl --may-exist add-port "$OVS_BR" "$TAP_IFACE" tag="$VLAN_ID"

if [ "$VNC_PORT" -ge 5900 ]; then
    VNC_DISPLAY=$((VNC_PORT - 5900))
else
    VNC_DISPLAY="$VNC_PORT"
fi

MAC_SUFFIX=$(python3 -c 'import hashlib,sys; h=hashlib.sha256(sys.argv[1].encode()).hexdigest(); print(":".join([h[0:2],h[2:4],h[4:6]]))' "$VM_NAME")
MAC_ADDR="52:54:00:${MAC_SUFFIX}"

echo "MAC asignada a $VM_NAME: $MAC_ADDR"



echo "Generando config-drive para $VM_NAME..."

sudo rm -rf "$SEED_DIR"
mkdir -p "$SEED_DIR/openstack/latest"

cat > "$SEED_DIR/openstack/latest/meta_data.json" <<EOF_META
{
  "uuid": "$VM_NAME",
  "hostname": "$VM_NAME",
  "name": "$VM_NAME"
}
EOF_META

cat > "$SEED_DIR/openstack/latest/user_data" <<'EOF_USERDATA'
#!/bin/sh

LOG="/tmp/dropbear-autostart.log"

echo "[user-data] iniciando configuración SSH" > "$LOG"

mkdir -p /tmp/dropbear

if [ ! -f /tmp/dropbear/dropbear_rsa_host_key ]; then
    dropbearkey -t rsa -f /tmp/dropbear/dropbear_rsa_host_key >> "$LOG" 2>&1
fi

killall dropbear >> "$LOG" 2>&1 || true

/usr/sbin/dropbear -p 22 -r /tmp/dropbear/dropbear_rsa_host_key >> "$LOG" 2>&1

echo "[user-data] dropbear levantado en puerto 22" >> "$LOG"
EOF_USERDATA

chmod +x "$SEED_DIR/openstack/latest/user_data"

ISO_TOOL=$(command -v genisoimage || command -v mkisofs || true)

if [ -z "$ISO_TOOL" ]; then
    echo "ERROR: No se encontró genisoimage ni mkisofs. Instala genisoimage en este worker."
    exit 1
fi

sudo "$ISO_TOOL" \
    -quiet \
    -output "$SEED_ISO" \
    -volid config-2 \
    -joliet \
    -rock \
    "$SEED_DIR"

sudo rm -rf "$SEED_DIR"

echo "Config-drive creado: $SEED_ISO"




sudo qemu-system-x86_64 \
    -name "$VM_NAME" \
    -enable-kvm \
    -m 256 \
    -smp 1 \
    -drive file="$VM_DISK",format=qcow2 \
    -drive file="$SEED_ISO",format=raw,if=ide,media=cdrom,readonly=on \
    -netdev tap,id=net0,ifname="$TAP_IFACE",script=no,downscript=no \
    -device e1000,netdev=net0,mac="$MAC_ADDR" \
    -vnc 0.0.0.0:"$VNC_DISPLAY" \
    -pidfile "$PID_FILE" \
    -daemonize

echo "VM $VM_NAME creada en VLAN $VLAN_ID con TAP $TAP_IFACE y VNC :$VNC_DISPLAY."

