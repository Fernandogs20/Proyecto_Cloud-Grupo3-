#!/bin/bash
set -e

if [ "$#" -ne 1 ]; then
    echo "Uso: $0 <SLICE_NAME>"
    echo "Ejemplo: $0 ex1"
    exit 1
fi

SLICE="$1"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
STATE_FILE="$ROOT_DIR/state/${SLICE}_ex1.json"
DELETE_MULTI="$ROOT_DIR/scripts/delete_vm_multi.sh"

if [ ! -f "$STATE_FILE" ]; then
    echo "ERROR: no existe el archivo de estado $STATE_FILE"
    exit 1
fi

HEADNODE="10.0.10.3"

ACCESS_VLAN=$(python3 -c "import json; print(json.load(open('$STATE_FILE'))['access_vlan'])")
ACCESS_NET=$(python3 -c "import json; print(json.load(open('$STATE_FILE'))['access_network'])")

echo "================ DELETE EX1 SLICE ================"
echo "Slice: $SLICE"
echo "Access VLAN: $ACCESS_VLAN"
echo "Access network: $ACCESS_NET"
echo "State file: $STATE_FILE"
echo "=================================================="

run_remote_script() {
    local IP="$1"
    local SCRIPT="$2"
    shift 2
    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ubuntu@"$IP" "bash -s -- $*" < "$SCRIPT"
}

echo ""
echo "[1] Mostrando qemu-img info antes del borrado..."
python3 - <<PY | while read -r VM_NAME WORKER_IP; do
import json
data=json.load(open("$STATE_FILE"))
for logical, vm in data["vms"].items():
    print(vm["name"], vm["worker_ip"])
PY
    echo "---- $VM_NAME en $WORKER_IP ----"
    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ubuntu@"$WORKER_IP" "sudo qemu-img info --force-share /var/lib/tel141/images/${VM_NAME}.qcow2 2>/dev/null || sudo qemu-img info /var/lib/tel141/images/${VM_NAME}.qcow2 2>/dev/null || true"
done

echo ""
echo "[2] Eliminando VMs del slice..."
python3 - <<PY | while read -r VM_NAME WORKER_IP; do
import json
data=json.load(open("$STATE_FILE"))
for logical, vm in data["vms"].items():
    print(vm["name"], vm["worker_ip"])
PY
    echo "---- Eliminando $VM_NAME en $WORKER_IP ----"
    run_remote_script "$WORKER_IP" "$DELETE_MULTI" "$VM_NAME" "br-int"
done

echo ""
echo "[3] Eliminando red de acceso VLAN $ACCESS_VLAN en Head Node..."
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ubuntu@"$HEADNODE" "
set +e

echo '[3.1] Eliminando reglas NAT/FORWARD asociadas...'
sudo iptables -D FORWARD -i gw_vlan$ACCESS_VLAN -o ens3 -j ACCEPT 2>/dev/null || true
sudo iptables -D FORWARD -s $ACCESS_NET -o ens3 -j ACCEPT 2>/dev/null || true
sudo iptables -D FORWARD -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT 2>/dev/null || true
sudo iptables -t nat -D POSTROUTING -s $ACCESS_NET -o ens3 -j MASQUERADE 2>/dev/null || true

echo '[3.2] Eliminando DHCP namespace...'
sudo ip netns exec ns-dhcp-vlan$ACCESS_VLAN pkill dnsmasq 2>/dev/null || true
sudo ip netns del ns-dhcp-vlan$ACCESS_VLAN 2>/dev/null || true

echo '[3.3] Eliminando puertos OVS de acceso...'
sudo ovs-vsctl --if-exists del-port br-int dhcp_v$ACCESS_VLAN
sudo ovs-vsctl --if-exists del-port br-int gw_vlan$ACCESS_VLAN

echo '[3.4] Eliminando interfaces Linux...'
sudo ip link del dhcp_v$ACCESS_VLAN 2>/dev/null || true
sudo ip link del gw_vlan$ACCESS_VLAN 2>/dev/null || true

echo '[3.5] Verificación Head Node...'
ip netns list | grep $ACCESS_VLAN || true
ip -br addr | grep $ACCESS_VLAN || true
sudo ovs-vsctl show | grep $ACCESS_VLAN || true
"

echo ""
echo "[4] Eliminando archivo de estado..."
rm -f "$STATE_FILE"

echo ""
echo "[5] Verificación final por worker..."
for IP in 10.0.10.1 10.0.10.2 10.0.10.3; do
    echo "================ $IP ================"
    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ubuntu@"$IP" "
      hostname
      echo '[QEMU ex1]'; pgrep -af 'qemu-system.*${SLICE}v' || true
      echo '[TAP ex1]'; ip -br link | grep 'tap_${SLICE}v' || true
      echo '[OVS ex1]'; sudo ovs-vsctl show | grep 'tap_${SLICE}v' || true
      echo '[IMAGES ex1]'; sudo ls -lh /var/lib/tel141/images 2>/dev/null | grep '${SLICE}v' || true
    "
done

echo ""
echo "[OK] Slice $SLICE eliminado."
