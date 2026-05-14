"""
Driver de Linux Cluster para R2 - Soporte de cluster de servidores Linux.
Implementa la lógica de provisioning de VMs en clusters Linux.
"""

import subprocess
import os
import logging
from typing import List, Tuple, Optional, Dict
from dataclasses import dataclass
from abc import ABC, abstractmethod
import json
import re
import ipaddress

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RemoteExecutor:
    """Ejecuta comandos en hosts remotos vía SSH."""
    
    def __init__(self, username: str = "ubuntu"):
        self.username = username
    
    def execute(self, host: str, command: str, use_sudo: bool = True, timeout: int = 30) -> Tuple[int, str, str]:
        """
        Ejecuta un comando en un host remoto.
        
        Returns:
            (return_code, stdout, stderr)
        """
        cmd = f"ssh {self.username}@{host}"
        if use_sudo:
            full_cmd = f"{cmd} 'sudo bash -c \"{command}\"'"
        else:
            full_cmd = f"{cmd} '{command}'"
        
        try:
            result = subprocess.run(
                full_cmd,
                shell=True,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            return result.returncode, result.stdout, result.stderr
        except subprocess.TimeoutExpired:
            logger.error(f"Timeout ejecutando comando en {host}")
            return -1, "", "Timeout"
        except Exception as e:
            logger.error(f"Error ejecutando comando en {host}: {str(e)}")
            return -1, "", str(e)
    
    def execute_script(self, host: str, script_path: str, args: List[str] = None, use_sudo: bool = True) -> Tuple[int, str, str]:
        """
        Ejecuta un script local en un host remoto.
        """
        if args is None:
            args = []
        
        args_str = ' '.join([f'"{arg}"' for arg in args])
        cmd = f"ssh {self.username}@{host} 'bash -s' < {script_path} {args_str}"
        
        try:
            result = subprocess.run(
                cmd,
                shell=True,
                capture_output=True,
                text=True,
                timeout=60
            )
            return result.returncode, result.stdout, result.stderr
        except Exception as e:
            logger.error(f"Error ejecutando script en {host}: {str(e)}")
            return -1, "", str(e)


class LinuxClusterDriver:
    """
    Driver de Linux Cluster - Implementa R2.
    Maneja provisioning de VMs en clusters Linux usando QEMU/KVM y OvS.
    """
    
    def __init__(self, vm_directory: str = "/var/lib/vms"):
        self.executor = RemoteExecutor()
        self.vm_directory = vm_directory
        self.base_image_url = "https://download.cirros-cloud.net/0.6.2/cirros-0.6.2-x86_64-disk.img"
        self.base_image_name = "cirros-base.img"
    
    # ========== Inicialización de Nodos ==========
    
    def init_headnode(self, host: str, interfaces: List[str]) -> bool:
        """Inicializa un nodo head node con OvS e iptables."""
        logger.info(f"Inicializando head node en {host} con interfaces {interfaces}")
        
        if not interfaces:
            logger.error("Debe especificar al menos una interfaz")
            return False
        
        commands = [
            self._create_ovs_bridge(host),
            self._connect_interfaces(host, interfaces),
            self._enable_ipv4_forwarding(host),
            self._set_iptables_forward_policy(host)
        ]
        
        return all(commands)
    
    def init_compute_node(self, host: str, interfaces: List[str]) -> bool:
        """Inicializa un nodo de cómputo con OvS."""
        logger.info(f"Inicializando nodo de cómputo en {host} con interfaces {interfaces}")
        
        if not interfaces:
            logger.error("Debe especificar al menos una interfaz")
            return False
        
        return (
            self._create_ovs_bridge(host) and
            self._connect_interfaces(host, interfaces)
        )
    
    def _create_ovs_bridge(self, host: str, bridge_name: str = "br-int") -> bool:
        """Crea un bridge OvS."""
        cmd = f"ovs-vsctl br-exists {bridge_name} || ovs-vsctl add-br {bridge_name}"
        ret, out, err = self.executor.execute(host, cmd)
        
        if ret == 0:
            logger.info(f"Bridge {bridge_name} creado en {host}")
            return True
        else:
            logger.error(f"Error creando bridge: {err}")
            return False
    
    def _connect_interfaces(self, host: str, interfaces: List[str], bridge_name: str = "br-int") -> bool:
        """Conecta interfaces al bridge OvS."""
        for iface in interfaces:
            cmd = f"ovs-vsctl list-ports {bridge_name} | grep -q ^{iface}$ || ovs-vsctl add-port {bridge_name} {iface}"
            ret, out, err = self.executor.execute(host, cmd)
            if ret != 0:
                logger.error(f"Error conectando interfaz {iface}: {err}")
                return False
        
        logger.info(f"Interfaces conectadas a {bridge_name} en {host}")
        return True
    
    def _enable_ipv4_forwarding(self, host: str) -> bool:
        """Habilita IPv4 forwarding."""
        cmd = "sysctl -w net.ipv4.ip_forward=1 && echo 'net.ipv4.ip_forward=1' | tee -a /etc/sysctl.conf > /dev/null"
        ret, out, err = self.executor.execute(host, cmd)
        
        if ret == 0:
            logger.info(f"IPv4 forwarding habilitado en {host}")
            return True
        else:
            logger.error(f"Error habilitando IPv4 forwarding: {err}")
            return False
    
    def _set_iptables_forward_policy(self, host: str) -> bool:
        """Configura la política por defecto de FORWARD en iptables."""
        cmd = "iptables -P FORWARD DROP"
        ret, out, err = self.executor.execute(host, cmd)
        
        if ret == 0:
            logger.info(f"Política FORWARD configurada a DROP en {host}")
            return True
        else:
            logger.error(f"Error configurando iptables: {err}")
            return False
    
    # ========== Gestión de Redes VLAN ==========
    
    def create_vlan_network(
        self,
        headnode: str,
        vlan_id: int,
        cidr: str,
        dhcp_enabled: bool = False,
        dhcp_range: Optional[str] = None
    ) -> bool:
        """Crea una red VLAN con gateway y opcionalmente DHCP."""
        logger.info(f"Creando red VLAN {vlan_id} ({cidr}) en {headnode}")
        
        try:
            network = ipaddress.ip_network(cidr)
            gateway_ip = str(list(network.hosts())[0]) if network.num_addresses > 2 else str(network[1])
            dhcp_ip = str(list(network.hosts())[1]) if network.num_addresses > 3 else str(network[2])
        except Exception as e:
            logger.error(f"Error parseando CIDR {cidr}: {str(e)}")
            return False
        
        # Crear puerto OvS para el gateway
        port_name = f"gw_vlan{vlan_id}"
        cmd_create_port = f"""
        ovs-vsctl --may-exist add-port br-int {port_name} \
            -- set Interface {port_name} type=internal \
            -- set Interface {port_name} external-ids:iface-status=active
        """
        
        ret, _, err = self.executor.execute(headnode, cmd_create_port)
        if ret != 0:
            logger.error(f"Error creando puerto OvS: {err}")
            return False
        
        # Configurar IP en la interfaz
        cmd_ip = f"ip addr add {gateway_ip}/{network.prefixlen} dev {port_name} || true"
        ret, _, err = self.executor.execute(headnode, cmd_ip)
        if ret != 0 and "RTNETLINK answers" not in err:
            logger.error(f"Error asignando IP: {err}")
            return False
        
        # Activar interfaz
        cmd_up = f"ip link set {port_name} up"
        ret, _, err = self.executor.execute(headnode, cmd_up)
        if ret != 0:
            logger.error(f"Error activando interfaz: {err}")
            return False
        
        # Configurar DHCP si está habilitado
        if dhcp_enabled:
            if not self._setup_dhcp_namespace(headnode, vlan_id, dhcp_ip, gateway_ip, cidr, dhcp_range):
                logger.error(f"Error configurando DHCP para VLAN {vlan_id}")
                return False
        
        logger.info(f"Red VLAN {vlan_id} creada exitosamente")
        return True
    
    def _setup_dhcp_namespace(
        self,
        headnode: str,
        vlan_id: int,
        dhcp_ip: str,
        gateway_ip: str,
        cidr: str,
        dhcp_range: Optional[str]
    ) -> bool:
        """Configura un namespace de Linux con servicio DHCP."""
        ns_name = f"dhcp_vlan{vlan_id}"
        port_name = f"gw_vlan{vlan_id}"
        
        # Crear namespace
        cmd_ns = f"ip netns add {ns_name} || true"
        self.executor.execute(headnode, cmd_ns)
        
        # Crear veth pair
        veth_host = f"veth_h_{vlan_id}"
        veth_ns = f"veth_ns_{vlan_id}"
        
        cmd_veth = f"""
        ip link add {veth_host} type veth peer name {veth_ns} || true
        ip link set {veth_host} up
        ip netns exec {ns_name} ip link set {veth_ns} up
        """
        ret, _, err = self.executor.execute(headnode, cmd_veth)
        if ret != 0:
            logger.error(f"Error creando veth pair: {err}")
            return False
        
        logger.info(f"DHCP namespace {ns_name} configurado")
        return True
    
    def delete_vlan_network(self, headnode: str, vlan_id: int, cidr: str) -> bool:
        """Elimina una red VLAN."""
        logger.info(f"Eliminando red VLAN {vlan_id} en {headnode}")
        
        port_name = f"gw_vlan{vlan_id}"
        ns_name = f"dhcp_vlan{vlan_id}"
        
        # Eliminar puerto OvS
        cmd_del_port = f"ovs-vsctl del-port br-int {port_name} 2>/dev/null || true"
        self.executor.execute(headnode, cmd_del_port)
        
        # Eliminar namespace
        cmd_del_ns = f"ip netns delete {ns_name} 2>/dev/null || true"
        self.executor.execute(headnode, cmd_del_ns)
        
        logger.info(f"Red VLAN {vlan_id} eliminada")
        return True
    
    # ========== Gestión de Máquinas Virtuales (R2) ==========
    
    def create_vm(
        self,
        compute_host: str,
        vm_name: str,
        vlan_id: int,
        vnc_port: int,
        vcpu: int = 1,
        memory_mb: int = 512,
        disk_gb: int = 10
    ) -> bool:
        """Crea una máquina virtual en un host de cómputo."""
        logger.info(f"Creando VM {vm_name} en {compute_host} (VLAN {vlan_id}, puerto VNC {vnc_port})")
        
        # Preparar directorio
        self._ensure_vm_directory(compute_host)
        
        # Descargar/verificar imagen base
        if not self._ensure_base_image(compute_host):
            logger.error("Error preparando imagen base")
            return False
        
        # Crear disco QCOW2
        if not self._create_vm_disk(compute_host, vm_name):
            logger.error("Error creando disco VM")
            return False
        
        # Crear interfaz TAP
        tap_name = f"tap_{vm_name}"
        if not self._create_tap_interface(compute_host, tap_name, vlan_id):
            logger.error("Error creando interfaz TAP")
            return False
        
        # Iniciar QEMU/KVM
        if not self._start_kvm_process(compute_host, vm_name, tap_name, vnc_port, vcpu, memory_mb, disk_gb):
            logger.error("Error iniciando proceso KVM")
            return False
        
        logger.info(f"VM {vm_name} creada exitosamente")
        return True
    
    def delete_vm(
        self,
        compute_host: str,
        vm_name: str,
        vlan_id: int,
        vnc_port: int
    ) -> bool:
        """Elimina una máquina virtual."""
        logger.info(f"Eliminando VM {vm_name} en {compute_host}")
        
        tap_name = f"tap_{vm_name}"
        disk_path = f"{self.vm_directory}/{vm_name}.qcow2"
        pid_file = f"/var/run/{vm_name}.pid"
        
        # Detener proceso KVM
        self._stop_kvm_process(compute_host, vm_name, pid_file)
        
        # Eliminar interfaz TAP
        self._delete_tap_interface(compute_host, tap_name)
        
        # Eliminar disco
        cmd_del_disk = f"rm -f {disk_path}"
        self.executor.execute(compute_host, cmd_del_disk)
        
        logger.info(f"VM {vm_name} eliminada")
        return True
    
    def _ensure_vm_directory(self, host: str) -> bool:
        """Asegura que el directorio de VMs existe."""
        cmd = f"mkdir -p {self.vm_directory}"
        ret, _, _ = self.executor.execute(host, cmd)
        return ret == 0
    
    def _ensure_base_image(self, host: str) -> bool:
        """Descarga/verifica la imagen base de Cirros."""
        base_image_path = f"{self.vm_directory}/{self.base_image_name}"
        
        # Verificar si existe
        cmd_check = f"[ -f {base_image_path} ] && echo 'exists' || echo 'not_exists'"
        ret, out, _ = self.executor.execute(host, cmd_check, use_sudo=False)
        
        if "exists" in out:
            logger.info(f"Imagen base encontrada en {host}")
            return True
        
        # Descargar imagen
        logger.info(f"Descargando imagen base en {host}")
        cmd_download = f"cd {self.vm_directory} && wget -q {self.base_image_url} -O {self.base_image_name}"
        ret, _, err = self.executor.execute(host, cmd_download)
        
        if ret == 0:
            logger.info(f"Imagen base descargada")
            return True
        else:
            logger.error(f"Error descargando imagen: {err}")
            return False
    
    def _create_vm_disk(self, host: str, vm_name: str) -> bool:
        """Crea un disco QCOW2 basado en la imagen base."""
        base_image_path = f"{self.vm_directory}/{self.base_image_name}"
        disk_path = f"{self.vm_directory}/{vm_name}.qcow2"
        
        cmd = f"qemu-img create -f qcow2 -b {base_image_path} {disk_path}"
        ret, _, err = self.executor.execute(host, cmd)
        
        if ret == 0:
            logger.info(f"Disco QCOW2 creado: {disk_path}")
            return True
        else:
            logger.error(f"Error creando disco: {err}")
            return False
    
    def _create_tap_interface(self, host: str, tap_name: str, vlan_id: int, bridge: str = "br-int") -> bool:
        """Crea una interfaz TAP conectada al bridge OvS."""
        cmd = f"""
        ip tuntap add dev {tap_name} mode tap
        ip link set {tap_name} up
        ovs-vsctl add-port {bridge} {tap_name}
        """
        ret, _, err = self.executor.execute(host, cmd)
        
        if ret == 0:
            logger.info(f"Interfaz TAP {tap_name} creada")
            return True
        else:
            logger.error(f"Error creando TAP: {err}")
            return False
    
    def _delete_tap_interface(self, host: str, tap_name: str, bridge: str = "br-int") -> bool:
        """Elimina una interfaz TAP."""
        cmd = f"""
        ovs-vsctl del-port {bridge} {tap_name} 2>/dev/null || true
        ip link delete {tap_name} 2>/dev/null || true
        """
        ret, _, _ = self.executor.execute(host, cmd)
        return ret == 0
    
    def _start_kvm_process(
        self,
        host: str,
        vm_name: str,
        tap_name: str,
        vnc_port: int,
        vcpu: int,
        memory_mb: int,
        disk_gb: int
    ) -> bool:
        """Inicia el proceso QEMU/KVM para la VM."""
        disk_path = f"{self.vm_directory}/{vm_name}.qcow2"
        pid_file = f"/var/run/{vm_name}.pid"
        
        kvm_cmd = f"""
        nohup qemu-system-x86_64 \\
            -name {vm_name} \\
            -m {memory_mb} \\
            -smp {vcpu} \\
            -drive file={disk_path},format=qcow2 \\
            -net nic,model=virtio \\
            -net tap,ifname={tap_name},script=no,downscript=no \\
            -vnc 127.0.0.1:{vnc_port} \\
            -daemonize \\
            -pidfile {pid_file} \\
            > /tmp/{vm_name}.log 2>&1 &
        """
        
        ret, _, err = self.executor.execute(host, kvm_cmd)
        
        if ret == 0:
            logger.info(f"Proceso KVM iniciado para {vm_name}")
            return True
        else:
            logger.error(f"Error iniciando KVM: {err}")
            return False
    
    def _stop_kvm_process(self, host: str, vm_name: str, pid_file: str) -> bool:
        """Detiene el proceso QEMU/KVM."""
        cmd = f"""
        if [ -f {pid_file} ]; then
            kill $(cat {pid_file}) 2>/dev/null || true
            sleep 1
            kill -9 $(cat {pid_file}) 2>/dev/null || true
            rm -f {pid_file}
        fi
        """
        ret, _, _ = self.executor.execute(host, cmd)
        return ret == 0
    
    # ========== Gestión de Networking (Routing y NAT) ==========
    
    def enable_internet_access(
        self,
        headnode: str,
        vlan_id: int,
        cidr: str,
        internet_interface: str = "ens3"
    ) -> bool:
        """Habilita acceso a internet para una VLAN con NAT."""
        logger.info(f"Habilitando acceso a internet para VLAN {vlan_id}")
        
        port_name = f"gw_vlan{vlan_id}"
        
        # FORWARD: VLAN -> Internet
        cmd1 = f"iptables -A FORWARD -i {port_name} -o {internet_interface} -s {cidr} -j ACCEPT"
        
        # FORWARD: Internet -> VLAN (respuestas)
        cmd2 = f"iptables -A FORWARD -i {internet_interface} -o {port_name} -d {cidr} -m state --state RELATED,ESTABLISHED -j ACCEPT"
        
        # NAT (MASQUERADE)
        cmd3 = f"iptables -t nat -A POSTROUTING -s {cidr} -o {internet_interface} -j MASQUERADE"
        
        for cmd in [cmd1, cmd2, cmd3]:
            ret, _, err = self.executor.execute(headnode, cmd)
            if ret != 0:
                logger.error(f"Error en iptables: {err}")
                return False
        
        logger.info(f"Acceso a internet habilitado para VLAN {vlan_id}")
        return True
    
    def disable_internet_access(
        self,
        headnode: str,
        vlan_id: int,
        cidr: str,
        internet_interface: str = "ens3"
    ) -> bool:
        """Deshabilita acceso a internet para una VLAN."""
        logger.info(f"Deshabilitando acceso a internet para VLAN {vlan_id}")
        
        port_name = f"gw_vlan{vlan_id}"
        
        # Eliminar reglas
        cmd = f"""
        iptables -D FORWARD -i {port_name} -o {internet_interface} -s {cidr} -j ACCEPT 2>/dev/null || true
        iptables -D FORWARD -i {internet_interface} -o {port_name} -d {cidr} -m state --state RELATED,ESTABLISHED -j ACCEPT 2>/dev/null || true
        iptables -t nat -D POSTROUTING -s {cidr} -o {internet_interface} -j MASQUERADE 2>/dev/null || true
        """
        
        ret, _, _ = self.executor.execute(headnode, cmd)
        return ret == 0
    
    def enable_vlan_routing(
        self,
        headnode: str,
        vlan_id_1: int,
        vlan_id_2: int
    ) -> bool:
        """Habilita routing entre dos VLANs."""
        logger.info(f"Habilitando routing entre VLAN {vlan_id_1} y VLAN {vlan_id_2}")
        
        port1 = f"gw_vlan{vlan_id_1}"
        port2 = f"gw_vlan{vlan_id_2}"
        
        cmd = f"""
        iptables -A FORWARD -i {port1} -o {port2} -j ACCEPT
        iptables -A FORWARD -i {port2} -o {port1} -j ACCEPT
        """
        
        ret, _, err = self.executor.execute(headnode, cmd)
        
        if ret == 0:
            logger.info(f"Routing habilitado")
            return True
        else:
            logger.error(f"Error en iptables: {err}")
            return False
    
    def disable_vlan_routing(
        self,
        headnode: str,
        vlan_id_1: int,
        vlan_id_2: int
    ) -> bool:
        """Deshabilita routing entre dos VLANs."""
        logger.info(f"Deshabilitando routing entre VLAN {vlan_id_1} y VLAN {vlan_id_2}")
        
        port1 = f"gw_vlan{vlan_id_1}"
        port2 = f"gw_vlan{vlan_id_2}"
        
        cmd = f"""
        iptables -D FORWARD -i {port1} -o {port2} -j ACCEPT 2>/dev/null || true
        iptables -D FORWARD -i {port2} -o {port1} -j ACCEPT 2>/dev/null || true
        """
        
        ret, _, _ = self.executor.execute(headnode, cmd)
        return ret == 0
