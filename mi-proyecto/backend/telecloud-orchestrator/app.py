#!/usr/bin/env python3
import argparse
import getpass
import ipaddress
import json
import os
import re
import shlex
import subprocess
import sys
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional


BASE_DIR = Path(__file__).resolve().parent
STATE_DIR = BASE_DIR / "state"
SCRIPTS_DIR = BASE_DIR / "scripts"
LOG_DIR = BASE_DIR / "logs"

USERS_FILE = STATE_DIR / "users.json"
SLICES_FILE = STATE_DIR / "slices.json"
PORTS_FILE = STATE_DIR / "ports.json"
SESSION_FILE = STATE_DIR / "session.json"
LOG_FILE = LOG_DIR / "orchestrator.log"


SERVERS = {
    "server1": {
        "ip": "10.0.10.1",
        "gateway_ip": "10.20.12.117",
        "ssh_port": 5801,
        "role": "compute",
    },
    "server2": {
        "ip": "10.0.10.2",
        "gateway_ip": "10.20.12.117",
        "ssh_port": 5802,
        "role": "compute",
    },
    "server3": {
        "ip": "10.0.10.3",
        "gateway_ip": "10.20.12.117",
        "ssh_port": 5803,
        "role": "headnode",
    },
}


@dataclass
class VM:
    name: str
    server: str
    vlan: int
    vnc_display: int
    local_tunnel_port: int
    status: str = "CREATED"

    @property
    def vnc_remote_port(self) -> int:
        return 5900 + self.vnc_display

    def tunnel_command(self) -> str:
        srv = SERVERS[self.server]
        return (
            f"ssh -NL {self.local_tunnel_port}:127.0.0.1:{self.vnc_remote_port} "
            f"ubuntu@{srv['gateway_ip']} -p {srv['ssh_port']}"
        )

    def vnc_target(self) -> str:
        return f"127.0.0.1:{self.local_tunnel_port}"


@dataclass
class Slice:
    name: str
    owner: str
    topology: str
    vlan: int
    network: str
    gateway: str
    dhcp: bool
    vms: List[VM]
    status: str
    created_at: str


def ensure_dirs() -> None:
    STATE_DIR.mkdir(exist_ok=True)
    SCRIPTS_DIR.mkdir(exist_ok=True)
    LOG_DIR.mkdir(exist_ok=True)


def log(message: str) -> None:
    ensure_dirs()
    line = f"{datetime.now().isoformat(timespec='seconds')} | {message}"
    with LOG_FILE.open("a") as f:
        f.write(line + "\n")


def load_json(path: Path, default):
    if not path.exists():
        return default
    with path.open() as f:
        return json.load(f)


def save_json(path: Path, data) -> None:
    path.parent.mkdir(exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w") as f:
        json.dump(data, f, indent=2)
    tmp.replace(path)


def require_script(script_name: str) -> Path:
    path = SCRIPTS_DIR / script_name
    if not path.exists():
        raise FileNotFoundError(f"No existe el script requerido: {path}")
    return path


def run_local(cmd: List[str], input_text: Optional[str] = None) -> str:
    print(f"\n[CMD] {' '.join(cmd)}")
    result = subprocess.run(
        cmd,
        input=input_text,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    print(result.stdout)
    log(f"CMD: {' '.join(cmd)} | RC={result.returncode}")
    if result.returncode != 0:
        raise RuntimeError(result.stdout)
    return result.stdout


def run_ssh(server: str, command: str) -> str:
    ip = SERVERS[server]["ip"]
    return run_local(["ssh", f"ubuntu@{ip}", command])


def run_remote_script(server: str, script_name: str, args: List[str]) -> str:
    script_path = require_script(script_name)
    script_content = script_path.read_text()
    ip = SERVERS[server]["ip"]
    remote_cmd = "bash -s -- " + " ".join(shlex.quote(str(a)) for a in args)
    return run_local(["ssh", f"ubuntu@{ip}", remote_cmd], input_text=script_content)


def get_current_user() -> str:
    session = load_json(SESSION_FILE, {})
    user = session.get("username")
    if not user:
        raise PermissionError("No hay sesión activa. Ejecuta primero: python3 app.py login")
    return user


def get_role(username: str) -> str:
    users = load_json(USERS_FILE, {})
    if username not in users:
        raise PermissionError("Usuario de sesión no existe en users.json")
    return users[username]["role"]


def require_admin() -> str:
    user = get_current_user()
    role = get_role(user)
    if role != "admin":
        raise PermissionError("Solo un usuario admin puede ejecutar esta acción.")
    return user


def validate_slice_request(name: str, topology: str, vms: int) -> None:
    if not re.match(r"^[a-zA-Z][a-zA-Z0-9_]{2,8}$", name):
        raise ValueError(
            "Nombre inválido. Usa 3 a 9 caracteres, empieza con letra, solo letras/números/_"
        )
    if topology not in ["lineal", "anillo"]:
        raise ValueError("Topología inválida. Usa: lineal o anillo.")
    if vms < 1 or vms > 4:
        raise ValueError("Para esta demo usa entre 1 y 4 VMs.")


def reserve_resources() -> Dict:
    ports = load_json(
        PORTS_FILE,
        {
            "next_vnc_display": 1,
            "next_local_tunnel_port": 30011,
            "next_vlan": 110,
        },
    )

    vlan = int(ports["next_vlan"])
    if vlan < 10 or vlan > 240:
        raise ValueError("Rango de VLAN agotado o inválido para esta demo.")

    third_octet = vlan
    network = f"192.168.{third_octet}.0/24"
    gateway = f"192.168.{third_octet}.1"
    dhcp_range = f"192.168.{third_octet}.50,192.168.{third_octet}.200,12h"

    reserved = {
        "vlan": vlan,
        "network": network,
        "gateway": gateway,
        "dhcp_range": dhcp_range,
        "first_vnc_display": int(ports["next_vnc_display"]),
        "first_local_tunnel_port": int(ports["next_local_tunnel_port"]),
    }

    ports["next_vlan"] = vlan + 1
    save_json(PORTS_FILE, ports)
    return reserved


def commit_vm_port_reservation(count: int) -> None:
    ports = load_json(PORTS_FILE, {})
    ports["next_vnc_display"] = int(ports.get("next_vnc_display", 1)) + count
    ports["next_local_tunnel_port"] = int(ports.get("next_local_tunnel_port", 30011)) + count
    save_json(PORTS_FILE, ports)


def cmd_login(args) -> None:
    users = load_json(USERS_FILE, {})
    username = input("Usuario: ").strip()
    password = getpass.getpass("Password: ")

    if username not in users or users[username]["password"] != password:
        raise PermissionError("Credenciales inválidas.")

    save_json(
        SESSION_FILE,
        {
            "username": username,
            "role": users[username]["role"],
            "login_at": datetime.now().isoformat(timespec="seconds"),
        },
    )
    log(f"LOGIN usuario={username} role={users[username]['role']}")
    print(f"[OK] Login correcto. Usuario={username}, rol={users[username]['role']}")


def cmd_whoami(args) -> None:
    session = load_json(SESSION_FILE, {})
    print(json.dumps(session, indent=2))


def cmd_init_cluster(args) -> None:
    require_admin()
    print("[INFO] Inicializando cluster Linux...")
    run_remote_script("server3", "headnode_init.sh", ["ens4"])
    run_remote_script("server1", "compute_init.sh", ["ens4"])
    run_remote_script("server2", "compute_init.sh", ["ens4"])
    print("[OK] Cluster inicializado.")


def build_vm_plan(slice_name: str, vlan: int, count: int, first_display: int, first_local: int) -> List[VM]:
    compute_servers = ["server1", "server2"]
    vms: List[VM] = []

    for i in range(1, count + 1):
        server = compute_servers[(i - 1) % len(compute_servers)]
        vm_name = f"{slice_name}v{i}"
        vms.append(
            VM(
                name=vm_name,
                server=server,
                vlan=vlan,
                vnc_display=first_display + i - 1,
                local_tunnel_port=first_local + i - 1,
            )
        )
    return vms


def cmd_create_slice(args) -> None:
    owner = require_admin()
    validate_slice_request(args.name, args.topology, args.vms)

    slices = load_json(SLICES_FILE, {})
    if args.name in slices:
        raise ValueError(f"Ya existe un slice con nombre: {args.name}")

    reserved = reserve_resources()
    vlan = reserved["vlan"]
    network = reserved["network"]
    gateway = reserved["gateway"]
    dhcp_range = reserved["dhcp_range"]

    vms = build_vm_plan(
        args.name,
        vlan,
        args.vms,
        reserved["first_vnc_display"],
        reserved["first_local_tunnel_port"],
    )

    print("[INFO] Solicitud validada por Slice Manager")
    print(f"[INFO] Slice={args.name}, topology={args.topology}, vms={args.vms}")
    print(f"[INFO] VLAN reservada={vlan}, network={network}, gateway={gateway}")

    created_vms: List[VM] = []

    try:
        print("\n[STEP 1] Crear red VLAN con DHCP en Head Node")
        run_remote_script("server3", "create_network_vlan.sh", [str(vlan), network, "true", dhcp_range])

        print("\n[STEP 2] Crear VMs en servidores Linux")
        for vm in vms:
            print(f"\n[VM] Creando {vm.name} en {vm.server}")
            run_remote_script(
                vm.server,
                "create_vm.sh",
                [vm.name, "br-int", str(vlan), str(vm.vnc_display)],
            )
            created_vms.append(vm)

        commit_vm_port_reservation(len(vms))

        slice_obj = Slice(
            name=args.name,
            owner=owner,
            topology=args.topology,
            vlan=vlan,
            network=network,
            gateway=gateway,
            dhcp=True,
            vms=created_vms,
            status="ACTIVE",
            created_at=datetime.now().isoformat(timespec="seconds"),
        )

        slices[args.name] = asdict(slice_obj)
        save_json(SLICES_FILE, slices)
        log(f"CREATE_SLICE ok name={args.name} vlan={vlan} vms={len(created_vms)}")

        print("\n[OK] Slice creado correctamente.")
        print_access(slice_obj)

    except Exception as exc:
        log(f"CREATE_SLICE error name={args.name} error={exc}")
        print("\n[ERROR] Falló la creación. Iniciando rollback de VMs creadas...")
        for vm in created_vms:
            try:
                run_remote_script(
                    vm.server,
                    "delete_vm.sh",
                    [vm.name, "br-int", str(vm.vlan), str(vm.vnc_display)],
                )
            except Exception as rollback_error:
                print(f"[WARN] No se pudo borrar {vm.name}: {rollback_error}")
        raise


def print_access(slice_obj: Slice) -> None:
    print("\n=== Acceso a consola virtual de VMs ===")
    for vm in slice_obj.vms:
        print(f"\nVM: {vm.name}")
        print(f"Servidor: {vm.server}")
        print(f"VLAN: {vm.vlan}")
        print(f"Túnel:")
        print(f"  {vm.tunnel_command()}")
        print(f"Abrir VNC en:")
        print(f"  {vm.vnc_target()}")


def cmd_list_slices(args) -> None:
    get_current_user()
    slices = load_json(SLICES_FILE, {})
    if not slices:
        print("No hay slices registrados.")
        return

    print("SLICES:")
    for name, data in slices.items():
        print(
            f"- {name} | owner={data['owner']} | topology={data['topology']} | "
            f"vlan={data['vlan']} | vms={len(data['vms'])} | status={data['status']}"
        )


def cmd_show_slice(args) -> None:
    get_current_user()
    slices = load_json(SLICES_FILE, {})
    if args.name not in slices:
        raise ValueError(f"No existe slice: {args.name}")

    data = slices[args.name]
    print(json.dumps(data, indent=2))

    vms = [VM(**vm_data) for vm_data in data["vms"]]
    slice_obj = Slice(
        name=data["name"],
        owner=data["owner"],
        topology=data["topology"],
        vlan=data["vlan"],
        network=data["network"],
        gateway=data["gateway"],
        dhcp=data["dhcp"],
        vms=vms,
        status=data["status"],
        created_at=data["created_at"],
    )
    print_access(slice_obj)


def cmd_delete_slice(args) -> None:
    require_admin()
    slices = load_json(SLICES_FILE, {})
    if args.name not in slices:
        raise ValueError(f"No existe slice: {args.name}")

    data = slices[args.name]
    vlan = data["vlan"]

    print(f"[INFO] Eliminando slice {args.name} VLAN {vlan}")

    for vm_data in data["vms"]:
        vm = VM(**vm_data)
        print(f"\n[VM] Borrando {vm.name} en {vm.server}")
        run_remote_script(
            vm.server,
            "delete_vm.sh",
            [vm.name, "br-int", str(vm.vlan), str(vm.vnc_display)],
        )

    print("\n[NET] Eliminando red VLAN del Head Node")
    cleanup_cmd = f"""
set -e
sudo ip netns exec ns-dhcp-vlan{vlan} pkill dnsmasq 2>/dev/null || true
sudo ovs-vsctl --if-exists del-port br-int dhcp_v{vlan} || true
sudo ip netns del ns-dhcp-vlan{vlan} 2>/dev/null || true
sudo ovs-vsctl --if-exists del-port br-int gw_vlan{vlan} || true
sudo ip link del gw_vlan{vlan} 2>/dev/null || true
echo "VLAN {vlan} eliminada del Head Node"
"""
    run_ssh("server3", cleanup_cmd)

    del slices[args.name]
    save_json(SLICES_FILE, slices)
    log(f"DELETE_SLICE ok name={args.name} vlan={vlan}")
    print("[OK] Slice eliminado correctamente.")


def cmd_status(args) -> None:
    get_current_user()

    for server in ["server1", "server2", "server3"]:
        print(f"\n================ {server} ================")
        run_ssh(
            server,
            """
echo '[HOSTNAME]'; hostname
echo '[OVS]'; sudo ovs-vsctl show
echo '[QEMU]'; pgrep -af qemu || true
echo '[IP IMPORTANTES]'; ip -br addr | egrep 'ens3|ens4|br-int|gw_vlan|tap' || true
""",
        )


def build_parser():
    parser = argparse.ArgumentParser(description="TeleCloud Orchestrator CLI")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("login")
    p.set_defaults(func=cmd_login)

    p = sub.add_parser("whoami")
    p.set_defaults(func=cmd_whoami)

    p = sub.add_parser("init-cluster")
    p.set_defaults(func=cmd_init_cluster)

    p = sub.add_parser("create-slice")
    p.add_argument("--name", required=True)
    p.add_argument("--topology", required=True, choices=["lineal", "anillo"])
    p.add_argument("--vms", required=True, type=int)
    p.set_defaults(func=cmd_create_slice)

    p = sub.add_parser("list-slices")
    p.set_defaults(func=cmd_list_slices)

    p = sub.add_parser("show-slice")
    p.add_argument("name")
    p.set_defaults(func=cmd_show_slice)

    p = sub.add_parser("delete-slice")
    p.add_argument("name")
    p.set_defaults(func=cmd_delete_slice)

    p = sub.add_parser("status")
    p.set_defaults(func=cmd_status)

    return parser


def main():
    ensure_dirs()
    parser = build_parser()
    args = parser.parse_args()

    try:
        args.func(args)
    except Exception as exc:
        print(f"\n[ERROR] {exc}")
        log(f"ERROR {args.cmd}: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    main()
