#!/bin/bash
set -e

if [ "$#" -lt 1 ]; then
    echo "Uso: $0 <SLICE_NAME> [BASE_VLAN] [FIRST_VNC_DISPLAY] [FIRST_LOCAL_TUNNEL_PORT]"
    echo "Ejemplo: $0 ex2 210 70 30600"
    exit 1
fi

SLICE="$1"
BASE_VLAN="${2:-210}"
FIRST_VNC="${3:-70}"
FIRST_LOCAL="${4:-30600}"

if ! echo "$SLICE" | grep -Eq '^[a-zA-Z0-9]{1,4}$'; then
    echo "ERROR: usa un nombre corto de slice, máximo 4 caracteres. Ejemplo: ex2"
    exit 1
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
STATE_DIR="$ROOT_DIR/state"

CREATE_MULTI="$ROOT_DIR/scripts/create_vm_multi.sh"
CREATE_NET="$ROOT_DIR/scripts/create_network_vlan.sh"
INTERNET_NET="$ROOT_DIR/scripts/internet_to_network.sh"

mkdir -p "$STATE_DIR"

STATE_FILE="$STATE_DIR/${SLICE}_ex1.json"

if [ -f "$STATE_FILE" ]; then
    echo "ERROR: ya existe estado para el slice $SLICE en $STATE_FILE"
    echo "Bórralo primero con delete_ex1_slice.sh"
    exit 1
fi

WORKER1="10.0.10.1"
WORKER2="10.0.10.2"
WORKER3="10.0.10.3"
HEADNODE="10.0.10.3"

GW_IP="10.20.12.117"

SSH_PORT_W1="5801"
SSH_PORT_W2="5802"
SSH_PORT_W3="5803"

# VLANs de enlaces L2
VLAN_12=$((BASE_VLAN + 0))
VLAN_23=$((BASE_VLAN + 1))
VLAN_31=$((BASE_VLAN + 2))
VLAN_41=$((BASE_VLAN + 3))
VLAN_43=$((BASE_VLAN + 4))
VLAN_45=$((BASE_VLAN + 5))
VLAN_56=$((BASE_VLAN + 6))

# VLAN de acceso para VM1 y VM3
VLAN_ACCESS=$((BASE_VLAN + 7))

if [ "$VLAN_ACCESS" -gt 240 ]; then
    echo "ERROR: BASE_VLAN demasiado alto. Usa un valor <= 233."
    exit 1
fi

ACCESS_NET="192.168.${VLAN_ACCESS}.0/24"
ACCESS_GW="192.168.${VLAN_ACCESS}.1"

VM1_ACCESS_IP="192.168.${VLAN_ACCESS}.11/24"
VM3_ACCESS_IP="192.168.${VLAN_ACCESS}.13/24"

VM1_SSH_IP="192.168.${VLAN_ACCESS}.11"
VM3_SSH_IP="192.168.${VLAN_ACCESS}.13"

echo "================ EX1 SLICE CREATE ================"
echo "Slice: $SLICE"
echo "Base VLAN: $BASE_VLAN"
echo "Access VLAN: $VLAN_ACCESS"
echo "Access network: $ACCESS_NET"
echo "Access gateway: $ACCESS_GW"
echo "VM1 static IP: $VM1_ACCESS_IP"
echo "VM3 static IP: $VM3_ACCESS_IP"
echo "=================================================="

run_remote_script() {
    local IP="$1"
    local SCRIPT="$2"
    shift 2
    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ubuntu@"$IP" "bash -s -- $*" < "$SCRIPT"
}

create_vm() {
    local LOGICAL="$1"
    local VM_NAME="$2"
    local WORKER="$3"
    local IMAGE="$4"
    local RAM="$5"
    local CORES="$6"
    local DISK="$7"
    local VNC="$8"
    local VLANS="$9"
    local ACCESS_CIDR="${10:-none}"
    local ACCESS_GW_ARG="${11:-none}"

    echo ""
    echo "--------------------------------------------------"
    echo "Creando $LOGICAL como $VM_NAME en $WORKER"
    echo "Imagen=$IMAGE RAM=${RAM}MB CORES=$CORES DISK=${DISK}G VNC=:$VNC VLANs=$VLANS"
    echo "Access=$ACCESS_CIDR GW=$ACCESS_GW_ARG"
    echo "--------------------------------------------------"

    run_remote_script "$WORKER" "$CREATE_MULTI" "$VM_NAME" "br-int" "$IMAGE" "$RAM" "$CORES" "$DISK" "$VNC" "$VLANS" "$ACCESS_CIDR" "$ACCESS_GW_ARG"

    PID="$(ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ubuntu@"$WORKER" "sudo cat /tmp/${VM_NAME}.pid 2>/dev/null || true")"
    HOST="$(ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ubuntu@"$WORKER" "hostname")"

    echo "[OK] $LOGICAL desplegada"
    echo "     VM_NAME=$VM_NAME"
    echo "     WORKER=$HOST"
    echo "     PID=$PID"
}

echo ""
echo "[1] Creando red de acceso SIN DHCP para VM1 y VM3..."
echo "Gateway: $ACCESS_GW"

run_remote_script "$HEADNODE" "$CREATE_NET" "$VLAN_ACCESS" "$ACCESS_NET" "false"
run_remote_script "$HEADNODE" "$INTERNET_NET" "$VLAN_ACCESS" "$ACCESS_NET"

echo ""
echo "[2] Desplegando VMs según round robin requerido..."

VNC1=$((FIRST_VNC + 0))
VNC2=$((FIRST_VNC + 1))
VNC3=$((FIRST_VNC + 2))
VNC4=$((FIRST_VNC + 3))
VNC5=$((FIRST_VNC + 4))
VNC6=$((FIRST_VNC + 5))

VM1="${SLICE}v1"
VM2="${SLICE}v2"
VM3="${SLICE}v3"
VM4="${SLICE}v4"
VM5="${SLICE}v5"
VM6="${SLICE}v6"

# Orden de interfaces:
# VM1: ens3=access, ens4=VM1-VM2, ens5=VM3-VM1, ens6=VM4-VM1
# VM3: ens3=access, ens4=VM2-VM3, ens5=VM3-VM1, ens6=VM4-VM3
# VM4: ens3=VM4-VM1, ens4=VM4-VM3, ens5=VM4-VM5

create_vm "VM1" "$VM1" "$WORKER1" "ubuntu" 512 1 2.2 "$VNC1" "${VLAN_ACCESS},${VLAN_12},${VLAN_31},${VLAN_41}" "$VM1_ACCESS_IP" "$ACCESS_GW"
create_vm "VM2" "$VM2" "$WORKER2" "cirros" 512 1 1.0 "$VNC2" "${VLAN_12},${VLAN_23}" "none" "none"
create_vm "VM3" "$VM3" "$WORKER3" "ubuntu" 512 1 2.2 "$VNC3" "${VLAN_ACCESS},${VLAN_23},${VLAN_31},${VLAN_43}" "$VM3_ACCESS_IP" "$ACCESS_GW"
create_vm "VM4" "$VM4" "$WORKER1" "ubuntu" 512 1 2.2 "$VNC4" "${VLAN_41},${VLAN_43},${VLAN_45}" "none" "none"
create_vm "VM5" "$VM5" "$WORKER2" "ubuntu" 512 1 2.2 "$VNC5" "${VLAN_45},${VLAN_56}" "none" "none"
create_vm "VM6" "$VM6" "$WORKER3" "cirros" 512 1 1.0 "$VNC6" "${VLAN_56}" "none" "none"

echo ""
echo "[3] Guardando estado del slice..."

cat > "$STATE_FILE" <<EOF
{
  "slice": "$SLICE",
  "base_vlan": $BASE_VLAN,
  "access_vlan": $VLAN_ACCESS,
  "access_network": "$ACCESS_NET",
  "access_gateway": "$ACCESS_GW",
  "vm1_ssh_ip": "$VM1_SSH_IP",
  "vm3_ssh_ip": "$VM3_SSH_IP",
  "vms": {
    "VM1": {
      "name": "$VM1",
      "worker_ip": "$WORKER1",
      "worker": "worker1",
      "vnc": $VNC1,
      "local_port": $((FIRST_LOCAL + 0)),
      "ssh_ip": "$VM1_SSH_IP"
    },
    "VM2": {
      "name": "$VM2",
      "worker_ip": "$WORKER2",
      "worker": "worker2",
      "vnc": $VNC2,
      "local_port": $((FIRST_LOCAL + 1))
    },
    "VM3": {
      "name": "$VM3",
      "worker_ip": "$WORKER3",
      "worker": "worker3",
      "vnc": $VNC3,
      "local_port": $((FIRST_LOCAL + 2)),
      "ssh_ip": "$VM3_SSH_IP"
    },
    "VM4": {
      "name": "$VM4",
      "worker_ip": "$WORKER1",
      "worker": "worker1",
      "vnc": $VNC4,
      "local_port": $((FIRST_LOCAL + 3))
    },
    "VM5": {
      "name": "$VM5",
      "worker_ip": "$WORKER2",
      "worker": "worker2",
      "vnc": $VNC5,
      "local_port": $((FIRST_LOCAL + 4))
    },
    "VM6": {
      "name": "$VM6",
      "worker_ip": "$WORKER3",
      "worker": "worker3",
      "vnc": $VNC6,
      "local_port": $((FIRST_LOCAL + 5))
    }
  },
  "links": {
    "VM1-VM2": $VLAN_12,
    "VM2-VM3": $VLAN_23,
    "VM3-VM1": $VLAN_31,
    "VM4-VM1": $VLAN_41,
    "VM4-VM3": $VLAN_43,
    "VM4-VM5": $VLAN_45,
    "VM5-VM6": $VLAN_56
  }
}
EOF

echo ""
echo "================ RESUMEN EX1 ================"
echo "VM1, VM4 -> Worker1/server1"
echo "VM2, VM5 -> Worker2/server2"
echo "VM3, VM6 -> Worker3/server3"
echo ""
echo "VLAN enlaces:"
echo "VM1-VM2: $VLAN_12"
echo "VM2-VM3: $VLAN_23"
echo "VM3-VM1: $VLAN_31"
echo "VM4-VM1: $VLAN_41"
echo "VM4-VM3: $VLAN_43"
echo "VM4-VM5: $VLAN_45"
echo "VM5-VM6: $VLAN_56"
echo "Access VM1/VM3: $VLAN_ACCESS ($ACCESS_NET)"
echo ""
echo "IPs estáticas de acceso:"
echo "VM1: $VM1_SSH_IP"
echo "VM3: $VM3_SSH_IP"
echo "Gateway: $ACCESS_GW"
echo ""
echo "Comandos VNC desde tu laptop:"
echo "VM1: ssh -NL $((FIRST_LOCAL + 0)):127.0.0.1:$((5900 + VNC1)) ubuntu@$GW_IP -p $SSH_PORT_W1  -> VNC 127.0.0.1:$((FIRST_LOCAL + 0))"
echo "VM2: ssh -NL $((FIRST_LOCAL + 1)):127.0.0.1:$((5900 + VNC2)) ubuntu@$GW_IP -p $SSH_PORT_W2  -> VNC 127.0.0.1:$((FIRST_LOCAL + 1))"
echo "VM3: ssh -NL $((FIRST_LOCAL + 2)):127.0.0.1:$((5900 + VNC3)) ubuntu@$GW_IP -p $SSH_PORT_W3  -> VNC 127.0.0.1:$((FIRST_LOCAL + 2))"
echo "VM4: ssh -NL $((FIRST_LOCAL + 3)):127.0.0.1:$((5900 + VNC4)) ubuntu@$GW_IP -p $SSH_PORT_W1  -> VNC 127.0.0.1:$((FIRST_LOCAL + 3))"
echo "VM5: ssh -NL $((FIRST_LOCAL + 4)):127.0.0.1:$((5900 + VNC5)) ubuntu@$GW_IP -p $SSH_PORT_W2  -> VNC 127.0.0.1:$((FIRST_LOCAL + 4))"
echo "VM6: ssh -NL $((FIRST_LOCAL + 5)):127.0.0.1:$((5900 + VNC6)) ubuntu@$GW_IP -p $SSH_PORT_W3  -> VNC 127.0.0.1:$((FIRST_LOCAL + 5))"
echo ""
echo "Comandos SSH desde server4:"
echo "VM1: ssh -J ubuntu@$HEADNODE ubuntu@$VM1_SSH_IP"
echo "VM3: ssh -J ubuntu@$HEADNODE ubuntu@$VM3_SSH_IP"
echo ""
echo "Validar internet:"
echo "VM1: ping -c 4 8.8.8.8"
echo "VM3: ping -c 4 8.8.8.8"
echo "============================================="
