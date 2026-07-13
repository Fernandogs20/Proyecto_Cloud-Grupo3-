#!/bin/bash
set -e

if [ "$#" -lt 8 ]; then
    echo "Uso: $0 <VM_NAME> <OVS_BR> <IMAGE_TYPE> <RAM_MB> <CORES> <DISK_GB> <VNC_DISPLAY> <VLAN_CSV> [ACCESS_CIDR] [ACCESS_GW]"
    echo "Ejemplo:"
    echo "$0 exgv1 br-int ubuntu 512 1 2.2 110 237,230,232,233 192.168.237.11/24 192.168.237.1"
    exit 1
fi

VM_NAME="$1"
OVS_BR="$2"
IMAGE_TYPE="$3"
RAM_MB="$4"
CORES="$5"
DISK_GB="$6"
VNC_DISPLAY="$7"
VLAN_CSV="$8"
ACCESS_CIDR="${9:-none}"
ACCESS_GW="${10:-none}"

IMG_DIR="/var/lib/tel141/images"
VM_DISK="$IMG_DIR/${VM_NAME}.qcow2"
SEED_ISO="$IMG_DIR/${VM_NAME}-seed.iso"
SEED_DIR="/tmp/${VM_NAME}-seed"
PID_FILE="/tmp/${VM_NAME}.pid"

if [ "$IMAGE_TYPE" = "ubuntu" ]; then
    BASE_IMG="$IMG_DIR/ubuntu-focal.img"
elif [ "$IMAGE_TYPE" = "cirros" ]; then
    BASE_IMG="$IMG_DIR/cirros-0.6.2.img"
else
    echo "ERROR: IMAGE_TYPE debe ser ubuntu o cirros"
    exit 1
fi

if [ ! -f "$BASE_IMG" ]; then
    echo "ERROR: No existe imagen base: $BASE_IMG"
    exit 1
fi

echo "[INFO] Creando VM $VM_NAME"
echo "[INFO] Imagen: $IMAGE_TYPE -> $BASE_IMG"
echo "[INFO] RAM=${RAM_MB}MB CORES=$CORES DISK=${DISK_GB}G VNC=:$VNC_DISPLAY"
echo "[INFO] VLANs=$VLAN_CSV"
echo "[INFO] ACCESS_CIDR=$ACCESS_CIDR ACCESS_GW=$ACCESS_GW"

sudo mkdir -p "$IMG_DIR"

echo "[1] Creando disco delta qcow2..."

sudo rm -f "$VM_DISK"

BASE_FORMAT=$(sudo qemu-img info --output=json "$BASE_IMG" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("format","qcow2"))')

sudo qemu-img create \
    -f qcow2 \
    -F "$BASE_FORMAT" \
    -b "$BASE_IMG" \
    "$VM_DISK" \
    "${DISK_GB}G"

echo "[2] Generando config-drive..."

sudo rm -rf "$SEED_DIR" "$SEED_ISO"
mkdir -p "$SEED_DIR/openstack/latest"

cat > "$SEED_DIR/openstack/latest/meta_data.json" <<EOF_META
{
  "uuid": "$VM_NAME",
  "hostname": "$VM_NAME",
  "name": "$VM_NAME"
}
EOF_META

if [ "$IMAGE_TYPE" = "ubuntu" ]; then

cat > "$SEED_DIR/openstack/latest/user_data" <<EOF_USERDATA
#cloud-config
hostname: $VM_NAME
manage_etc_hosts: true
ssh_pwauth: true
disable_root: false

users:
  - default
  - name: ubuntu
    gecos: Ubuntu User
    sudo: ALL=(ALL) NOPASSWD:ALL
    shell: /bin/bash
    lock_passwd: false

chpasswd:
  list: |
    ubuntu:ubuntu
    root:root
  expire: false

write_files:
  - path: /tmp/internal_ifaces.sh
    permissions: '0755'
    content: |
      #!/bin/sh

      VM_NAME="$VM_NAME"

      get_iface() {
          IDX="\$1"
          N=\$((IDX + 1))
          ls /sys/class/net | grep -v '^lo$' | sort | sed -n "\${N}p"
      }

      configure_if() {
          IFACE="\$1"
          IPADDR="\$2"

          if [ -z "\$IFACE" ]; then
              return 0
          fi

          ip link set "\$IFACE" up 2>/dev/null || true
          ip addr flush dev "\$IFACE" 2>/dev/null || true
          ip addr add "\$IPADDR" dev "\$IFACE" 2>/dev/null || true
      }

      case "\$VM_NAME" in
          *v1)
              # VM1: iface0=access, iface1=VM1-VM2, iface2=VM1-VM3, iface3=VM1-VM4
              configure_if "\$(get_iface 1)" 10.10.230.1/30
              configure_if "\$(get_iface 2)" 10.10.231.1/30
              configure_if "\$(get_iface 3)" 10.10.233.1/30
              ;;

          *v2)
              # VM2: iface0=VM1-VM2, iface1=VM2-VM3
              configure_if "\$(get_iface 0)" 10.10.230.2/30
              configure_if "\$(get_iface 1)" 10.10.232.1/30
              ;;

          *v3)
              # VM3: iface0=access, iface1=VM2-VM3, iface2=VM3-VM1, iface3=VM4-VM3
              configure_if "\$(get_iface 1)" 10.10.232.2/30
              configure_if "\$(get_iface 2)" 10.10.231.2/30
              configure_if "\$(get_iface 3)" 10.10.234.1/30
              ;;

          *v4)
              # VM4: iface0=VM4-VM1, iface1=VM4-VM3, iface2=VM4-VM5
              configure_if "\$(get_iface 0)" 10.10.233.2/30
              configure_if "\$(get_iface 1)" 10.10.234.2/30
              configure_if "\$(get_iface 2)" 10.10.235.1/30
              ;;

          *v5)
              # VM5: iface0=VM5-VM4, iface1=VM5-VM6
              configure_if "\$(get_iface 0)" 10.10.235.2/30
              configure_if "\$(get_iface 1)" 10.10.236.1/30
              ;;

          *v6)
              # VM6: iface0=VM6-VM5
              configure_if "\$(get_iface 0)" 10.10.236.2/30
              ;;
      esac
EOF_USERDATA

if [ "$ACCESS_CIDR" != "none" ] && [ "$ACCESS_GW" != "none" ]; then

cat >> "$SEED_DIR/openstack/latest/user_data" <<EOF_USERDATA

runcmd:
  - [ sh, -c, "echo '[cloud-init] $VM_NAME configurando access network $ACCESS_CIDR' > /tmp/vm-init.log" ]
  - [ sh, -c, "pkill dhclient || true" ]
  - [ sh, -c, "rm -f /var/lib/dhcp/* /run/systemd/netif/leases/* || true" ]
  - [ sh, -c, "rm -f /etc/netplan/50-cloud-init.yaml /etc/netplan/00-installer-config.yaml /etc/netplan/99-ex1-static.yaml || true" ]
  - [ sh, -c, "IFACE=\$(ls /sys/class/net | grep -v lo | sort | head -n1); echo Interface access detectada: \$IFACE >> /tmp/vm-init.log; ip addr flush dev \$IFACE || true; ip addr add $ACCESS_CIDR dev \$IFACE; ip link set \$IFACE up; ip route replace default via $ACCESS_GW; echo nameserver 8.8.8.8 > /etc/resolv.conf" ]
  - [ sh, -c, "/tmp/internal_ifaces.sh || true" ]
  - [ sh, -c, "mkdir -p /etc/ssh/sshd_config.d" ]
  - [ sh, -c, "echo 'KexAlgorithms diffie-hellman-group14-sha256,diffie-hellman-group14-sha1' > /etc/ssh/sshd_config.d/99-ex1-kex.conf" ]
  - [ sh, -c, "systemctl restart ssh || true" ]
EOF_USERDATA

else

cat >> "$SEED_DIR/openstack/latest/user_data" <<EOF_USERDATA

runcmd:
  - [ sh, -c, "echo '[cloud-init] $VM_NAME configurando interfaces internas' > /tmp/vm-init.log" ]
  - [ sh, -c, "pkill dhclient || true" ]
  - [ sh, -c, "rm -f /var/lib/dhcp/* /run/systemd/netif/leases/* || true" ]
  - [ sh, -c, "rm -f /etc/netplan/50-cloud-init.yaml /etc/netplan/00-installer-config.yaml /etc/netplan/99-ex1-static.yaml || true" ]
  - [ sh, -c, "/tmp/internal_ifaces.sh || true" ]
  - [ sh, -c, "mkdir -p /etc/ssh/sshd_config.d" ]
  - [ sh, -c, "echo 'KexAlgorithms diffie-hellman-group14-sha256,diffie-hellman-group14-sha1' > /etc/ssh/sshd_config.d/99-ex1-kex.conf" ]
  - [ sh, -c, "systemctl restart ssh || true" ]
EOF_USERDATA

fi

else

cat > "$SEED_DIR/openstack/latest/user_data" <<EOF_USERDATA
#!/bin/sh

LOG="/tmp/cirros-autostart.log"

echo "[user-data] configurando CirrOS $VM_NAME" > "\$LOG"

get_iface() {
    IDX="\$1"
    N=\$((IDX + 1))
    ls /sys/class/net | grep -v '^lo$' | sort | sed -n "\${N}p"
}

configure_if() {
    IFACE="\$1"
    IPADDR="\$2"

    if [ -z "\$IFACE" ]; then
        return 0
    fi

    ip link set "\$IFACE" up 2>/dev/null || true
    ip addr flush dev "\$IFACE" 2>/dev/null || true
    ip addr add "\$IPADDR" dev "\$IFACE" 2>/dev/null || true
}

case "$VM_NAME" in
    *v2)
        configure_if "\$(get_iface 0)" 10.10.230.2/30
        configure_if "\$(get_iface 1)" 10.10.232.1/30
        ;;
    *v6)
        configure_if "\$(get_iface 0)" 10.10.236.2/30
        ;;
esac

mkdir -p /tmp/dropbear

if [ ! -f /tmp/dropbear/dropbear_rsa_host_key ]; then
    dropbearkey -t rsa -f /tmp/dropbear/dropbear_rsa_host_key >> "\$LOG" 2>&1
fi

killall dropbear >> "\$LOG" 2>&1 || true

/usr/sbin/dropbear -p 22 -r /tmp/dropbear/dropbear_rsa_host_key >> "\$LOG" 2>&1

echo "[user-data] CirrOS configurado" >> "\$LOG"
EOF_USERDATA

fi

chmod +x "$SEED_DIR/openstack/latest/user_data"

ISO_TOOL=$(command -v genisoimage || command -v mkisofs || true)

if [ -z "$ISO_TOOL" ]; then
    echo "ERROR: Instala genisoimage o mkisofs en este worker."
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

echo "[3] Creando interfaces TAP y argumentos QEMU..."

IFS=',' read -ra VLANS <<< "$VLAN_CSV"

NET_ARGS=()
IDX=0

for VLAN in "${VLANS[@]}"; do
    TAP_IFACE="tap_${VM_NAME}_${IDX}"

    if [ ${#TAP_IFACE} -gt 15 ]; then
        echo "ERROR: nombre de TAP muy largo: $TAP_IFACE"
        echo "Usa nombres cortos de VM, por ejemplo exgv1."
        exit 1
    fi

    echo "  - TAP $TAP_IFACE VLAN $VLAN"

    sudo ovs-vsctl --if-exists del-port "$OVS_BR" "$TAP_IFACE" || true
    sudo ip link del "$TAP_IFACE" 2>/dev/null || true

    sudo ip tuntap add dev "$TAP_IFACE" mode tap
    sudo ip link set "$TAP_IFACE" up
    sudo ovs-vsctl --may-exist add-port "$OVS_BR" "$TAP_IFACE" tag="$VLAN"

    MAC_SUFFIX=$(python3 -c 'import hashlib,sys; h=hashlib.sha256(sys.argv[1].encode()).hexdigest(); print(":".join([h[0:2],h[2:4],h[4:6]]))' "${VM_NAME}_${IDX}")
    MAC_ADDR="52:54:00:${MAC_SUFFIX}"

    NET_ARGS+=("-netdev" "tap,id=net${IDX},ifname=${TAP_IFACE},script=no,downscript=no")
    NET_ARGS+=("-device" "e1000,netdev=net${IDX},mac=${MAC_ADDR}")

    IDX=$((IDX+1))
done

echo "[4] Iniciando QEMU..."

sudo rm -f "$PID_FILE"

sudo qemu-system-x86_64 \
    -name "$VM_NAME" \
    -enable-kvm \
    -m "$RAM_MB" \
    -smp "$CORES" \
    -object rng-random,filename=/dev/urandom,id=rng0 \
    -device virtio-rng-pci,rng=rng0 \
    -drive file="$VM_DISK",format=qcow2 \
    -drive file="$SEED_ISO",format=raw,if=ide,media=cdrom,readonly=on \
    "${NET_ARGS[@]}" \
    -vnc 0.0.0.0:"$VNC_DISPLAY" \
    -pidfile "$PID_FILE" \
    -daemonize

PID="$(sudo cat "$PID_FILE" 2>/dev/null || true)"

echo "[OK] VM $VM_NAME creada"
echo "PID=$PID"
echo "WORKER=$(hostname)"
echo "DISK=$VM_DISK"
echo "SEED=$SEED_ISO"
echo "VNC=:$VNC_DISPLAY"
