# Arquitectura del Orchestrator - R1C + R2

## Descripción General

El Orchestrator implementa dos requerimientos principales:

- **R1C (Slice Manager)**: Gestor central de despliegue de slices
- **R2 (Linux Cluster Driver)**: Soporte para clustering Linux

Juntos forman un sistema de orquestación que permite provisioning dinámico de topologías de máquinas virtuales en clusters Linux.

## Flujo de Despliegue (Ejemplo)

```
Usuario → API REST → Slice Manager (R1C) → Linux Cluster Driver (R2) → Infraestructura
```

### Paso a Paso

1. **Usuario crea slice vía API REST**
   ```
   POST /api/v1/slices
   {
     "name": "topology-linear",
     "topology": "linear",
     "compute_nodes": ["server1", "server2"],
     "networks": [{"vlan_id": 100, "cidr": "192.168.0.0/24"}],
     "vms": [{"name": "vm1", "vcpu": 1, ...}]
   }
   ```

2. **Slice Manager valida y modela**
   - Validación de sintaxis del request (required fields, tipos correctos)
   - Autenticación y autorización del usuario
   - Creación de objetos Slice, Network, VM
   - Persistencia a almacenamiento

3. **Slice entra en cola de despliegue**
   ```python
   self.deployment_queue.put((slice_id, "create"))
   ```

4. **Worker de despliegue procesa slice**
   - Llama a `deploy_slice(slice_id)`
   - Cambia estado a DEPLOYING

5. **Slice Manager orquesta la infraestructura**
   - Paso 1: Crear redes (llama a R2)
   - Paso 2: Crear VMs (llama a R2)
   - Paso 3: Configurar topología

6. **R2 (Linux Cluster Driver) ejecuta operaciones**
   - `create_vlan_network()`: Crea bridges OvS, interfaces
   - `create_vm()`: Crea TAP, descarga imágenes, inicia QEMU/KVM

7. **Infraestructura actualizada**
   - VLANs creadas en headnode
   - VMs corriendo en compute nodes
   - Slice estado = ACTIVE

## Interacción R1C + R2

### R1C: Slice Manager (Orquestación de alto nivel)

```python
class SliceManager:
    """
    Responsabilidades:
    - Validar requests de usuario
    - Autenticación/Autorización
    - Modelar slices como estructura jerárquica
    - Orquestar llamadas a R2 en orden correcto
    - Manejo de transacciones y rollback
    - Persistencia de estado
    - Procesamiento asincrónico
    """
    
    def deploy_slice(self, slice_id: str):
        # 1. Crear redes
        for network in slice.networks:
            self.linux_driver.create_vlan_network(...)
        
        # 2. Crear VMs
        for vm in slice.vms:
            self.linux_driver.create_vm(...)
        
        # 3. Configurar topología
        self._configure_slice_topology(slice)
```

### R2: Linux Cluster Driver (Ejecución de bajo nivel)

```python
class LinuxClusterDriver:
    """
    Responsabilidades:
    - Ejecutar comandos remotos en hosts
    - Crear/eliminar bridges OvS
    - Provisioning de VMs con QCOW2
    - Gestionar TAP interfaces
    - Configurar iptables/netns
    - Manejo de errores en SSH
    """
    
    def create_vlan_network(self, headnode, vlan_id, cidr, dhcp_enabled):
        # Crear puerto OvS
        # Asignar IP
        # Configurar DHCP si aplica
        
    def create_vm(self, compute_host, vm_name, vlan_id, vnc_port):
        # Asegurar directorio /var/lib/vms
        # Descargar/verificar imagen base
        # Crear disco QCOW2
        # Crear interfaz TAP
        # Iniciar QEMU/KVM
```

## Mapeo de Responsabilidades

| Responsabilidad | R1C | R2 | Nota |
|---|---|---|---|
| Validación de requests | ✓ | | R1C valida sintaxis |
| Autenticación/Autorización | ✓ | | R1C controla acceso |
| Modelado de datos | ✓ | | OOP: Slice, VM, Network |
| Orquestación | ✓ | | R1C decide orden |
| Ejecución de comandos | | ✓ | R2 actúa sobre infraestructura |
| Transacciones | ✓ | | R1C maneja rollback |
| Persistencia | ✓ | | R1C guarda estado |
| Manejo de errores | ✓ | ✓ | R1C: alto nivel; R2: bajo nivel |

## Estructura de Datos - Jerarquía

```
Slice
├── owner_id: str
├── topology: str
├── state: SliceState
├── networks: List[Network]
│   ├── vlan_id: int
│   ├── cidr: str
│   ├── dhcp_enabled: bool
│   └── ...
├── vms: List[VirtualMachine]
│   ├── name: str
│   ├── vcpu: int
│   ├── memory_mb: int
│   ├── network_id: str (FK→Network)
│   ├── compute_node: str
│   └── ...
└── compute_nodes: List[str]
    └── ["server1", "server2", ...]
```

## Topologías Soportadas

Las topologías definen cómo se conectan las redes:

### Linear
```
VM1 --- VM2 --- VM3
  VLAN1   VLAN1
```

### Mesh
```
VM1 --- VM2
│       │
VM3 --- VM4
(Routing habilitado entre todos)
```

### Tree
```
       VM1
      /   \
    VM2   VM3
    / \   / \
  VM4 VM5 VM6 VM7
```

### Ring
```
VM1 --- VM2
│       │
VM4 --- VM3
(Circular)
```

### Bus
```
VM1
│
VM2
│
VM3
│
VM4
(Linear compartido)
```

## Ciclo de Vida de un Slice

```
PENDING → DEPLOYING → ACTIVE
           ↓ (error)
          FAILED
           ↓ (delete)
        DELETING → DELETED
```

### Estados
- **PENDING**: Slice creado, aún no desplegado
- **DEPLOYING**: En proceso de despliegue
- **ACTIVE**: Completamente desplegado y funcional
- **FAILED**: Error durante despliegue
- **DELETING**: En proceso de eliminación
- **DELETED**: Completamente eliminado

## Flujo de Persistencia

```
Slice Manager
│
├─→ En memoria (self.slices dict)
│   └─ Acceso rápido durante operaciones
│
└─→ Almacenamiento (FileStorage)
    └─ /var/lib/orchestrator/slices/
       └─ {slice_id}.json
```

Cada cambio de estado persiste automáticamente:

```python
def _persist_slice(self, slice_obj):
    slice_data = asdict(slice_obj)
    self.storage.save_slice(slice_obj.id, slice_data)
```

## Manejo de Errores

### R1C: Alto nivel

```python
try:
    # Crear redes
    # Crear VMs
    # Configurar topología
except Exception as e:
    # Cambiar estado a FAILED
    # Persistir error
    # Revertir cambios si es posible
    logger.error(f"Despliegue fallido: {e}")
```

### R2: Bajo nivel

```python
def create_vm(...):
    if not self._ensure_base_image(host):
        logger.error("Imagen base no disponible")
        return False
    
    if not self._create_vm_disk(host, vm_name):
        logger.error("Error creando disco")
        return False
```

## Concurrencia

### Slice Manager

```python
# Cola de despliegue asincrónica
self.deployment_queue = Queue()

# Worker en thread separado
self._deployment_worker_thread = threading.Thread(
    target=self._deployment_worker, daemon=True
)
```

Beneficios:
- Permite crear múltiples slices simultáneamente
- No bloquea API REST
- Operaciones largas (despliegue) en background

## Validación de Requests

El Slice Manager valida:

1. **Sintaxis**: campos requeridos, tipos correctos
2. **Semántica**: topología válida, CIDRs válidas, puertos VNC únicos
3. **Autorización**: usuario tiene permisos

```python
def validate_slice_request(request):
    required_fields = ["name", "topology"]
    for field in required_fields:
        if field not in request:
            return False, f"Falta: {field}"
    
    if request["topology"] not in ["linear", "mesh", "tree", "ring", "bus"]:
        return False, "Topología inválida"
    
    return True, "OK"
```

## Autenticación y Autorización

### User Roles

```python
class Role(Enum):
    ADMIN = "admin"      # Control total
    USER = "user"        # Crear/editar/borrar propios slices
    VIEWER = "viewer"    # Solo lectura
```

### Autorización por Acción

```python
def authorize_action(user, action, resource=None):
    # Verificar rol del usuario
    if not user.has_permission(action):
        return False
    
    # Si es recurso específico, verificar propiedad
    if resource and action in ["edit_slice", "delete_slice"]:
        slice_obj = self.slices[resource]
        if slice_obj.owner_id != user.username and user.role != Role.ADMIN:
            return False
    
    return True
```

## Escalabilidad

### Actuales Limitaciones
- Almacenamiento basado en archivos (no SQL)
- Ejecución secuencial de slices en cola
- Sin balanceador de carga

### Mejoras Futuras (Fase 2)
- Base de datos MySQL/PostgreSQL
- Múltiples workers de despliegue
- Integración con OpenStack (R3)
- VM Placement inteligente (R4)
- Monitoreo y autohealing

## Monitoreo y Logs

### Logs Generados

```
/var/lib/orchestrator/logs/operations.jsonl
```

Ejemplo:
```json
{
  "timestamp": "2024-05-08T10:30:45.123456",
  "operation": "create_slice",
  "details": {
    "slice_id": "uuid-...",
    "user": "admin",
    "topology": "linear",
    "vm_count": 2,
    "status": "success"
  }
}
```

### Debugging

```python
# Verbose logging
logging.basicConfig(level=logging.DEBUG)

# Ver cada operación
logger.debug(f"Creando VLAN {vlan_id} en {headnode}")
```

## Próximas Fases

### Fase 2: OpenStack Support (R3)
- Implementar driver OpenStack
- Usar APIs de Nova, Neutron, Glance
- Permitir slices en OpenStack

### Fase 3: VM Placement (R4)
- Algoritmo de asignación de recursos
- Considerar CPU, memoria, disco disponible
- Minimizar fragmentación

### Fase 4: Networking Avanzado (R5)
- Firewall policies
- Security groups
- Network ACLs
