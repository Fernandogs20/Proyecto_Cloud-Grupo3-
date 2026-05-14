"""
Entidades de datos para el orquestador.
"""

from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Dict, Optional
import uuid


class Role(Enum):
    """Roles de usuario en el sistema."""
    ADMIN = "admin"
    USER = "user"
    VIEWER = "viewer"


class SliceState(Enum):
    """Estados posibles de un slice."""
    PENDING = "pending"
    DEPLOYING = "deploying"
    ACTIVE = "active"
    FAILED = "failed"
    DELETING = "deleting"
    DELETED = "deleted"


class VMState(Enum):
    """Estados posibles de una máquina virtual."""
    PENDING = "pending"
    RUNNING = "running"
    STOPPED = "stopped"
    FAILED = "failed"
    DELETED = "deleted"


class NetworkType(Enum):
    """Tipos de redes soportadas."""
    VLAN = "vlan"
    OVERLAY = "overlay"


@dataclass
class User:
    """Modelo de usuario del sistema."""
    username: str
    password_hash: str
    role: Role
    email: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    
    def has_permission(self, action: str) -> bool:
        """Verifica si el usuario tiene permiso para una acción."""
        admin_actions = ["create_slice", "delete_slice", "manage_nodes"]
        user_actions = ["create_slice", "delete_slice"]
        viewer_actions = ["view_slice", "view_nodes"]
        
        permissions = {
            Role.ADMIN: admin_actions,
            Role.USER: user_actions,
            Role.VIEWER: viewer_actions
        }
        
        return action in permissions.get(self.role, [])


@dataclass
class Network:
    """Modelo de red virtual."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    vlan_id: int = 0
    cidr: str = ""
    gateway: str = ""
    network_type: NetworkType = NetworkType.VLAN
    dhcp_enabled: bool = False
    dhcp_range: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class VirtualMachine:
    """Modelo de máquina virtual."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    state: VMState = VMState.PENDING
    network_id: str = ""
    compute_node: str = ""
    vcpu: int = 1
    memory_mb: int = 512
    disk_gb: int = 10
    vnc_port: int = 0
    image_url: str = "https://download.cirros-cloud.net/0.6.2/cirros-0.6.2-x86_64-disk.img"
    tap_interface: str = ""
    created_at: datetime = field(default_factory=datetime.now)
    owner_id: str = ""


@dataclass
class ComputeNode:
    """Modelo de nodo de cómputo."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    hostname: str = ""
    ip_address: str = ""
    role: str = "compute"  # compute, headnode, gateway
    ovs_bridge: str = "br-int"
    interfaces: List[str] = field(default_factory=list)
    is_active: bool = True
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class Slice:
    """Modelo de slice (topología de VMs)."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    state: SliceState = SliceState.PENDING
    owner_id: str = ""
    topology: str = "linear"  # linear, mesh, tree, ring, bus
    networks: List[Network] = field(default_factory=list)
    vms: List[VirtualMachine] = field(default_factory=list)
    compute_nodes: List[str] = field(default_factory=list)
    metadata: Dict = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    
    def add_vm(self, vm: VirtualMachine) -> None:
        """Agrega una VM al slice."""
        self.vms.append(vm)
    
    def add_network(self, network: Network) -> None:
        """Agrega una red al slice."""
        self.networks.append(network)
    
    def get_network(self, network_id: str) -> Optional[Network]:
        """Obtiene una red por ID."""
        for net in self.networks:
            if net.id == network_id:
                return net
        return None
    
    def get_vm(self, vm_id: str) -> Optional[VirtualMachine]:
        """Obtiene una VM por ID."""
        for vm in self.vms:
            if vm.id == vm_id:
                return vm
        return None
