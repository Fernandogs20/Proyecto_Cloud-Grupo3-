"""
Slice Manager (R1C) - Gestor central de despliegue de slices.
Orquesta la creación, edición y eliminación de slices de máquinas virtuales.
"""

import logging
import threading
from typing import List, Dict, Optional, Tuple
from dataclasses import asdict
from datetime import datetime
from queue import Queue

from ..models.entities import (
    Slice, SliceState, VirtualMachine, VMState, Network, NetworkType, 
    ComputeNode, User, Role
)
from ..drivers.linux_cluster import LinuxClusterDriver
from ..storage.storage import FileStorage

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SliceManager:
    """
    Gestor de slices (R1C) - Orquesta el ciclo de vida de slices.
    
    Responsabilidades:
    - Validar autenticación y autorización
    - Modelar slices y sus elementos
    - Crear elementos en orden correcto
    - Manejar errores y conflictos de recursos
    - Exponer APIs del sistema
    - Persistencia de datos
    """
    
    def __init__(self, storage: FileStorage, linux_driver: LinuxClusterDriver):
        self.storage = storage
        self.linux_driver = linux_driver
        self.slices: Dict[str, Slice] = {}
        self.users: Dict[str, User] = {}
        self.compute_nodes: Dict[str, ComputeNode] = {}
        self.deployment_queue = Queue()
        self.lock = threading.RLock()
        
        # Cargar datos persistidos
        self._load_data()
        
        # Iniciar worker de despliegue
        self._deployment_worker_thread = threading.Thread(
            target=self._deployment_worker, daemon=True
        )
        self._deployment_worker_thread.start()
    
    # ========== Autenticación y Autorización ==========
    
    def authenticate_user(self, username: str, password_hash: str) -> Optional[User]:
        """Autentica un usuario."""
        logger.info(f"Autenticando usuario {username}")
        
        user = self.users.get(username)
        if user and user.password_hash == password_hash:
            logger.info(f"Usuario {username} autenticado exitosamente")
            return user
        
        logger.warning(f"Autenticación fallida para {username}")
        return None
    
    def authorize_action(self, user: User, action: str, resource: Optional[str] = None) -> bool:
        """Verifica autorización para una acción."""
        logger.info(f"Verificando autorización para {user.username}: {action}")
        
        if resource:
            # Verificar propiedad del recurso
            if action in ["edit_slice", "delete_slice"]:
                slice_obj = self.slices.get(resource)
                if slice_obj and slice_obj.owner_id != user.username and user.role != Role.ADMIN:
                    logger.warning(f"Usuario no autorizado para {action} en {resource}")
                    return False
        
        return user.has_permission(action)
    
    # ========== Validación de Requests ==========
    
    def validate_slice_request(self, request: Dict) -> Tuple[bool, str]:
        """Valida que un request de creación de slice tenga la sintaxis correcta."""
        required_fields = ["name", "topology"]
        
        for field in required_fields:
            if field not in request:
                return False, f"Campo requerido faltante: {field}"
        
        if request.get("topology") not in ["linear", "mesh", "tree", "ring", "bus"]:
            return False, f"Topología no válida: {request['topology']}"
        
        if "networks" not in request or not isinstance(request["networks"], list):
            return False, "networks debe ser una lista"
        
        if "vms" not in request or not isinstance(request["vms"], list):
            return False, "vms debe ser una lista"
        
        return True, "OK"
    
    # ========== Gestión de Slices ==========
    
    def create_slice(
        self,
        user: User,
        slice_name: str,
        topology: str,
        networks: List[Dict],
        vms: List[Dict],
        compute_nodes: List[str]
    ) -> Tuple[bool, str, Optional[str]]:
        """
        Crea un nuevo slice.
        
        Returns:
            (success, message, slice_id)
        """
        logger.info(f"Iniciando creación de slice '{slice_name}' por {user.username}")
        
        # Validar autorización
        if not self.authorize_action(user, "create_slice"):
            return False, "No autorizado para crear slices", None
        
        # Crear objeto Slice
        slice_obj = Slice(
            name=slice_name,
            owner_id=user.username,
            topology=topology,
            compute_nodes=compute_nodes,
            state=SliceState.PENDING
        )
        
        # Agregar networks al slice
        for net_def in networks:
            try:
                net = Network(
                    vlan_id=net_def.get("vlan_id", 0),
                    cidr=net_def.get("cidr", ""),
                    gateway=net_def.get("gateway", ""),
                    dhcp_enabled=net_def.get("dhcp_enabled", False),
                    dhcp_range=net_def.get("dhcp_range")
                )
                slice_obj.add_network(net)
            except Exception as e:
                logger.error(f"Error creando red: {str(e)}")
                return False, f"Error en definición de red: {str(e)}", None
        
        # Agregar VMs al slice
        for vm_def in vms:
            try:
                vm = VirtualMachine(
                    name=vm_def.get("name", ""),
                    network_id=vm_def.get("network_id", ""),
                    vcpu=vm_def.get("vcpu", 1),
                    memory_mb=vm_def.get("memory_mb", 512),
                    disk_gb=vm_def.get("disk_gb", 10),
                    vnc_port=vm_def.get("vnc_port", 0),
                    owner_id=user.username
                )
                slice_obj.add_vm(vm)
            except Exception as e:
                logger.error(f"Error creando VM: {str(e)}")
                return False, f"Error en definición de VM: {str(e)}", None
        
        # Guardar slice
        with self.lock:
            self.slices[slice_obj.id] = slice_obj
            self._persist_slice(slice_obj)
        
        # Encolar para despliegue
        self.deployment_queue.put((slice_obj.id, "create"))
        
        logger.info(f"Slice {slice_obj.id} creado y encolado para despliegue")
        return True, "Slice creado exitosamente", slice_obj.id
    
    def get_slice(self, user: User, slice_id: str) -> Optional[Slice]:
        """Obtiene un slice."""
        slice_obj = self.slices.get(slice_id)
        
        if not slice_obj:
            logger.warning(f"Slice {slice_id} no encontrado")
            return None
        
        # Validar acceso
        if slice_obj.owner_id != user.username and user.role != Role.ADMIN:
            logger.warning(f"Usuario {user.username} no autorizado para ver slice {slice_id}")
            return None
        
        return slice_obj
    
    def list_slices(self, user: User) -> List[Slice]:
        """Lista slices accesibles para el usuario."""
        if user.role == Role.ADMIN:
            return list(self.slices.values())
        
        return [s for s in self.slices.values() if s.owner_id == user.username]
    
    def delete_slice(self, user: User, slice_id: str) -> Tuple[bool, str]:
        """Elimina un slice."""
        logger.info(f"Iniciando eliminación de slice {slice_id}")
        
        slice_obj = self.slices.get(slice_id)
        if not slice_obj:
            return False, "Slice no encontrado"
        
        # Validar autorización
        if not self.authorize_action(user, "delete_slice", slice_id):
            return False, "No autorizado para eliminar este slice"
        
        # Encolar para eliminación
        with self.lock:
            slice_obj.state = SliceState.DELETING
            self._persist_slice(slice_obj)
        
        self.deployment_queue.put((slice_obj.id, "delete"))
        
        logger.info(f"Slice {slice_id} encolado para eliminación")
        return True, "Slice encolado para eliminación"
    
    def edit_slice(
        self,
        user: User,
        slice_id: str,
        operations: List[Dict]
    ) -> Tuple[bool, str]:
        """
        Edita un slice existente (agregar nodos y enlaces).
        
        Operaciones soportadas:
        - {"op": "add_vm", "vm": {...}}
        - {"op": "add_network", "network": {...}}
        - {"op": "remove_vm", "vm_id": "..."}
        """
        logger.info(f"Iniciando edición de slice {slice_id}")
        
        slice_obj = self.slices.get(slice_id)
        if not slice_obj:
            return False, "Slice no encontrado"
        
        # Validar autorización
        if not self.authorize_action(user, "edit_slice", slice_id):
            return False, "No autorizado para editar este slice"
        
        # Validar estado
        if slice_obj.state != SliceState.ACTIVE:
            return False, f"Slice no está en estado ACTIVE (estado actual: {slice_obj.state})"
        
        try:
            for op in operations:
                op_type = op.get("op")
                
                if op_type == "add_vm":
                    vm_def = op.get("vm", {})
                    vm = VirtualMachine(
                        name=vm_def.get("name", ""),
                        network_id=vm_def.get("network_id", ""),
                        vcpu=vm_def.get("vcpu", 1),
                        memory_mb=vm_def.get("memory_mb", 512),
                        disk_gb=vm_def.get("disk_gb", 10),
                        owner_id=user.username
                    )
                    slice_obj.add_vm(vm)
                    logger.info(f"VM {vm.id} agregada al slice")
                
                elif op_type == "add_network":
                    net_def = op.get("network", {})
                    net = Network(
                        vlan_id=net_def.get("vlan_id", 0),
                        cidr=net_def.get("cidr", ""),
                        dhcp_enabled=net_def.get("dhcp_enabled", False)
                    )
                    slice_obj.add_network(net)
                    logger.info(f"Network {net.id} agregada al slice")
                
                elif op_type == "remove_vm":
                    vm_id = op.get("vm_id")
                    slice_obj.vms = [v for v in slice_obj.vms if v.id != vm_id]
                    logger.info(f"VM {vm_id} removida del slice")
            
            slice_obj.updated_at = datetime.now()
            self._persist_slice(slice_obj)
            
            return True, "Slice editado exitosamente"
        
        except Exception as e:
            logger.error(f"Error editando slice: {str(e)}")
            return False, f"Error editando slice: {str(e)}"
    
    # ========== Despliegue de Slices (R1C + R2) ==========
    
    def deploy_slice(self, slice_id: str) -> Tuple[bool, str]:
        """Despliega un slice (orquesta toda la infraestructura)."""
        logger.info(f"Desplegando slice {slice_id}")
        
        slice_obj = self.slices.get(slice_id)
        if not slice_obj:
            return False, "Slice no encontrado"
        
        slice_obj.state = SliceState.DEPLOYING
        self._persist_slice(slice_obj)
        
        try:
            # Paso 1: Crear redes
            for network in slice_obj.networks:
                headnode = slice_obj.compute_nodes[0] if slice_obj.compute_nodes else None
                if not headnode:
                    raise Exception("No hay headnode disponible")
                
                success = self.linux_driver.create_vlan_network(
                    headnode,
                    network.vlan_id,
                    network.cidr,
                    network.dhcp_enabled,
                    network.dhcp_range
                )
                
                if not success:
                    raise Exception(f"Error creando red VLAN {network.vlan_id}")
                
                network.network_type = NetworkType.VLAN
                logger.info(f"Red {network.vlan_id} creada")
            
            # Paso 2: Crear VMs en nodos de cómputo
            for idx, vm in enumerate(slice_obj.vms):
                compute_node = slice_obj.compute_nodes[idx % len(slice_obj.compute_nodes)]
                
                success = self.linux_driver.create_vm(
                    compute_node,
                    vm.name,
                    vm.network_id,
                    vm.vnc_port,
                    vm.vcpu,
                    vm.memory_mb,
                    vm.disk_gb
                )
                
                if not success:
                    raise Exception(f"Error creando VM {vm.name}")
                
                vm.state = VMState.RUNNING
                vm.compute_node = compute_node
                logger.info(f"VM {vm.name} creada en {compute_node}")
            
            # Paso 3: Configurar topología (según sea necesario)
            # Esto puede incluir routing, networking policies, etc.
            self._configure_slice_topology(slice_obj)
            
            slice_obj.state = SliceState.ACTIVE
            self._persist_slice(slice_obj)
            
            logger.info(f"Slice {slice_id} desplegado exitosamente")
            return True, "Slice desplegado exitosamente"
        
        except Exception as e:
            logger.error(f"Error desplegando slice: {str(e)}")
            slice_obj.state = SliceState.FAILED
            self._persist_slice(slice_obj)
            return False, f"Error en despliegue: {str(e)}"
    
    def undeploy_slice(self, slice_id: str) -> Tuple[bool, str]:
        """Elimina todas las máquinas y redes de un slice."""
        logger.info(f"Desdesplegando slice {slice_id}")
        
        slice_obj = self.slices.get(slice_id)
        if not slice_obj:
            return False, "Slice no encontrado"
        
        try:
            # Paso 1: Eliminar VMs
            for vm in slice_obj.vms:
                if vm.state != VMState.DELETED:
                    success = self.linux_driver.delete_vm(
                        vm.compute_node,
                        vm.name,
                        vm.network_id,
                        vm.vnc_port
                    )
                    if success:
                        vm.state = VMState.DELETED
                        logger.info(f"VM {vm.name} eliminada")
            
            # Paso 2: Eliminar redes
            for network in slice_obj.networks:
                headnode = slice_obj.compute_nodes[0] if slice_obj.compute_nodes else None
                if headnode:
                    success = self.linux_driver.delete_vlan_network(
                        headnode,
                        network.vlan_id,
                        network.cidr
                    )
                    if success:
                        logger.info(f"Red VLAN {network.vlan_id} eliminada")
            
            slice_obj.state = SliceState.DELETED
            self._persist_slice(slice_obj)
            
            logger.info(f"Slice {slice_id} desdesplegado")
            return True, "Slice desdesplegado"
        
        except Exception as e:
            logger.error(f"Error desdesplegando: {str(e)}")
            return False, f"Error: {str(e)}"
    
    def _configure_slice_topology(self, slice_obj: Slice) -> None:
        """Configura networking según la topología del slice."""
        logger.info(f"Configurando topología {slice_obj.topology} para slice {slice_obj.id}")
        
        headnode = slice_obj.compute_nodes[0] if slice_obj.compute_nodes else None
        if not headnode:
            return
        
        # Para topologías con múltiples redes, habilitar routing
        if len(slice_obj.networks) > 1 and slice_obj.topology in ["mesh", "tree"]:
            for i in range(len(slice_obj.networks) - 1):
                self.linux_driver.enable_vlan_routing(
                    headnode,
                    slice_obj.networks[i].vlan_id,
                    slice_obj.networks[i + 1].vlan_id
                )
    
    # ========== Worker de Despliegue Asincrónico ==========
    
    def _deployment_worker(self) -> None:
        """Worker que procesa la cola de despliegue."""
        while True:
            try:
                slice_id, action = self.deployment_queue.get(timeout=5)
                
                if action == "create":
                    self.deploy_slice(slice_id)
                elif action == "delete":
                    success, msg = self.undeploy_slice(slice_id)
                    if success:
                        with self.lock:
                            del self.slices[slice_id]
                            self.storage.delete_slice(slice_id)
            
            except Exception as e:
                logger.error(f"Error en deployment worker: {str(e)}")
    
    # ========== Persistencia ==========
    
    def _persist_slice(self, slice_obj: Slice) -> None:
        """Persiste un slice a almacenamiento."""
        slice_data = {
            "id": slice_obj.id,
            "name": slice_obj.name,
            "owner_id": slice_obj.owner_id,
            "topology": slice_obj.topology,
            "state": slice_obj.state.value,
            "networks": [asdict(n) for n in slice_obj.networks],
            "vms": [asdict(v) for v in slice_obj.vms],
            "compute_nodes": slice_obj.compute_nodes,
            "metadata": slice_obj.metadata,
            "created_at": slice_obj.created_at.isoformat(),
            "updated_at": slice_obj.updated_at.isoformat()
        }
        self.storage.save_slice(slice_obj.id, slice_data)
    
    def _load_data(self) -> None:
        """Carga datos persistidos del almacenamiento."""
        logger.info("Cargando datos persistidos")
        
        # Cargar slices
        for slice_id in self.storage.list_slices():
            data = self.storage.load_slice(slice_id)
            if data:
                slice_obj = self._deserialize_slice(data)
                self.slices[slice_id] = slice_obj
        
        logger.info(f"Cargados {len(self.slices)} slices")
    
    def _deserialize_slice(self, data: Dict) -> Slice:
        """Deserializa un slice desde almacenamiento."""
        slice_obj = Slice(
            id=data.get("id"),
            name=data.get("name"),
            owner_id=data.get("owner_id"),
            topology=data.get("topology"),
            state=SliceState(data.get("state", "pending")),
            compute_nodes=data.get("compute_nodes", [])
        )
        
        for net_data in data.get("networks", []):
            net = Network(
                id=net_data.get("id"),
                vlan_id=net_data.get("vlan_id", 0),
                cidr=net_data.get("cidr", ""),
                gateway=net_data.get("gateway", ""),
                dhcp_enabled=net_data.get("dhcp_enabled", False),
                dhcp_range=net_data.get("dhcp_range")
            )
            slice_obj.add_network(net)
        
        for vm_data in data.get("vms", []):
            vm = VirtualMachine(
                id=vm_data.get("id"),
                name=vm_data.get("name"),
                state=VMState(vm_data.get("state", "pending")),
                network_id=vm_data.get("network_id", ""),
                compute_node=vm_data.get("compute_node", ""),
                vcpu=vm_data.get("vcpu", 1),
                memory_mb=vm_data.get("memory_mb", 512),
                disk_gb=vm_data.get("disk_gb", 10),
                vnc_port=vm_data.get("vnc_port", 0),
                owner_id=vm_data.get("owner_id", "")
            )
            slice_obj.add_vm(vm)
        
        return slice_obj
