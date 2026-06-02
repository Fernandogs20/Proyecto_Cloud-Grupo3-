# Orquestador de Nube Privada - PUCP 2026-1
# Grupo 3

Sistema de provisioning automático de máquinas virtuales y topologías de red basado en Python.

## Estructura del Proyecto

```
orchestrator/
├── models/              # Modelos de datos
│   ├── entities.py     # Definiciones de Slice, VM, Network, User, etc.
│   └── __init__.py
├── drivers/             # Drivers para diferentes infraestructuras
│   ├── linux_cluster.py # R2: Driver para clusters Linux con OvS/QEMU
│   └── __init__.py
├── core/                # Componentes centrales
│   ├── slice_manager.py # R1C: Gestor de ciclo de vida de slices
│   └── __init__.py
├── storage/             # Persistencia de datos
│   ├── storage.py      # FileStorage para guardar slices, usuarios, etc.
│   └── __init__.py
├── utils/               # Utilidades
│   ├── helpers.py      # Funciones auxiliares
│   └── __init__.py
├── api.py              # API REST con Flask
├── examples.py         # Ejemplos de uso
├── requirements.txt    # Dependencias
└── README.md           # Este archivo
```

## Componentes Principales

### R1C: Slice Manager (`core/slice_manager.py`)

El Slice Manager es el gestor central de despliegue de slices (R1C). Responsabilidades:

- **Autenticación y Autorización**: Valida usuarios y permisos
- **Modelado de Slices**: Estructura jerárquica de Slice → Networks → VMs
- **Orquestación**: Coordina la creación de elementos en el orden correcto
- **Persistencia**: Guarda estado de slices, usuarios y nodos
- **Manejo de Errores**: Transaccionalidad y rollback en caso de fallo
- **Procesamiento Asincrónico**: Cola de despliegue para operaciones no-bloqueantes

**API del Slice Manager:**

```python
# Crear slice
success, msg, slice_id = slice_manager.create_slice(
    user=admin_user,
    slice_name="topology-1",
    topology="linear",
    networks=[...],
    vms=[...],
    compute_nodes=["server1", "server2"]
)

# Listar slices
slices = slice_manager.list_slices(user)

# Obtener detalles de slice
slice_obj = slice_manager.get_slice(user, slice_id)

# Editar slice
success, msg = slice_manager.edit_slice(
    user, slice_id,
    operations=[
        {"op": "add_vm", "vm": {...}},
        {"op": "add_network", "network": {...}}
    ]
)

# Eliminar slice
success, msg = slice_manager.delete_slice(user, slice_id)
```

### R2: Linux Cluster Driver (`drivers/linux_cluster.py`)

Driver para provisioning de VMs en clusters Linux usando QEMU/KVM y Open vSwitch.

**Características:**

- Inicialización de nodos (headnode y compute nodes)
- Creación/eliminación de redes VLAN con DHCP
- Provisioning de máquinas virtuales (QCOW2 backing)
- Acceso a internet (NAT con iptables)
- Routing entre VLANs
- Gestión de TAP interfaces

**API del Linux Driver:**

```python
driver = LinuxClusterDriver()

# Inicializar headnode
driver.init_headnode("server3", ["ens4"])

# Inicializar compute node
driver.init_compute_node("server1", ["ens4"])

# Crear red VLAN
driver.create_vlan_network(
    headnode="server3",
    vlan_id=100,
    cidr="192.168.0.0/24",
    dhcp_enabled=False
)

# Crear máquina virtual
driver.create_vm(
    compute_host="server1",
    vm_name="vm1",
    vlan_id=100,
    vnc_port=5901,
    vcpu=1,
    memory_mb=512,
    disk_gb=10
)

# Habilitar internet
driver.enable_internet_access("server3", 100, "192.168.0.0/24")

# Habilitar routing entre VLANs
driver.enable_vlan_routing("server3", 100, 200)
```

## Modelos de Datos

### Slice
Representa una topología de máquinas virtuales con sus redes y configuración.

```python
@dataclass
class Slice:
    id: str                              # UUID
    name: str                            # Nombre del slice
    owner_id: str                        # Usuario propietario
    topology: str                        # linear, mesh, tree, ring, bus
    state: SliceState                    # pending, deploying, active, failed
    networks: List[Network]              # Redes del slice
    vms: List[VirtualMachine]           # VMs del slice
    compute_nodes: List[str]            # Hosts donde desplegar
    created_at: datetime
    updated_at: datetime
```

### VirtualMachine
Representa una máquina virtual.

```python
@dataclass
class VirtualMachine:
    id: str                              # UUID
    name: str                            # Nombre VM
    state: VMState                       # pending, running, stopped, failed
    network_id: str                      # VLAN a la que conectar
    compute_node: str                    # Host donde corre
    vcpu: int                           # CPUs virtuales
    memory_mb: int                      # RAM en MB
    disk_gb: int                        # Disco en GB
    vnc_port: int                       # Puerto VNC
```

### Network
Representa una red VLAN.

```python
@dataclass
class Network:
    id: str                              # UUID
    vlan_id: int                         # ID de VLAN
    cidr: str                           # Ej: 192.168.0.0/24
    gateway: str                        # Gateway IP
    network_type: NetworkType           # vlan, overlay
    dhcp_enabled: bool                  # Habilitar DHCP
    dhcp_range: Optional[str]          # Rango de IPs para DHCP
```

## API REST

### Autenticación

```bash
POST /api/v1/auth/login
{
  "username": "admin",
  "password_hash": "hash_sha256"
}
```

### Slices

```bash
# Crear slice
POST /api/v1/slices
{
  "owner_id": "admin",
  "name": "topology-1",
  "topology": "linear",
  "compute_nodes": ["server1", "server2"],
  "networks": [
    {
      "vlan_id": 100,
      "cidr": "192.168.0.0/24",
      "dhcp_enabled": false
    }
  ],
  "vms": [
    {
      "name": "vm1",
      "network_id": 100,
      "vcpu": 1,
      "memory_mb": 512,
      "disk_gb": 5,
      "vnc_port": 5901
    }
  ]
}

# Listar slices
GET /api/v1/slices?owner_id=admin

# Obtener slice
GET /api/v1/slices/{slice_id}?owner_id=admin

# Eliminar slice
DELETE /api/v1/slices/{slice_id}?owner_id=admin

# Editar slice
PATCH /api/v1/slices/{slice_id}/edit
{
  "owner_id": "admin",
  "operations": [
    {
      "op": "add_vm",
      "vm": {
        "name": "vm3",
        "network_id": 100,
        "vcpu": 1,
        "memory_mb": 512
      }
    }
  ]
}
```

### Linux Cluster Operations

```bash
# Inicializar headnode
POST /api/v1/nodes/headnode/init
{
  "host": "server3",
  "interfaces": ["ens4"]
}

# Inicializar compute node
POST /api/v1/nodes/compute/init
{
  "host": "server1",
  "interfaces": ["ens4"]
}

# Crear VLAN
POST /api/v1/networks/vlan
{
  "headnode": "server3",
  "vlan_id": 100,
  "cidr": "192.168.0.0/24",
  "dhcp_enabled": false
}

# Habilitar internet
POST /api/v1/networks/internet
{
  "headnode": "server3",
  "vlan_id": 100,
  "cidr": "192.168.0.0/24"
}
```

## Instalación y Uso

### Requisitos

- Python 3.8+
- SSH key configurada para acceso sin contraseña a los servers
- Instalación de QEMU/KVM y Open vSwitch en los nodos

### Instalación

```bash
# Clonar repositorio
git clone <repo> && cd orchestrator

# Instalar dependencias
pip install -r requirements.txt

# Crear directorio de almacenamiento
mkdir -p /var/lib/orchestrator
chmod 755 /var/lib/orchestrator
```

### Uso

```python
from orchestrator.api import OrchestratorAPI

# Crear API
api = OrchestratorAPI(storage_path="/var/lib/orchestrator")

# Ejecutar servidor
api.run(host='0.0.0.0', port=5000, debug=False)
```

O ejecutar ejemplos:

```bash
python orchestrator/examples.py
```

## Características Principales

### R1C: Slice Manager
- ✅ Autenticación y autorización de usuarios
- ✅ Validación de requests (sintaxis)
- ✅ Modelado OOP de slices y elementos
- ✅ Creación en orden correcto (networks → VMs)
- ✅ Manejo de errores y rollback
- ✅ Procesamiento asincrónico con cola
- ✅ Persistencia a disco
- ✅ Logs detallados para troubleshooting

### R2: Linux Cluster Support
- ✅ Inicialización de nodos (headnode + compute)
- ✅ Creación/eliminación de redes VLAN
- ✅ Provisioning de VMs con QCOW2 backing
- ✅ Eliminación con limpieza de imágenes
- ✅ Acceso SSH sin contraseña
- ✅ Ejecución remota de comandos
- ✅ Manejo de errores y timeouts

### Topologías Soportadas
- Linear
- Mesh
- Tree
- Ring
- Bus

## Logging y Troubleshooting

Los logs se guardan en:
- `/var/lib/orchestrator/logs/operations.jsonl` - Operaciones del sistema
- Salida estándar - Logs en tiempo real

Cada operación registra:
- Timestamp
- Tipo de operación
- Detalles (hosts, VLANs, VMs, etc.)
- Estado (éxito/fallo)

## Próximas Mejoras (Fase 2)

- [ ] Soporte para OpenStack (R3)
- [ ] VM Placement inteligente (R4)
- [ ] Mejores políticas de seguridad (R5)
- [ ] Dashboard web (R1B)
- [ ] Interfaz gráfica
- [ ] Autoscaling
- [ ] Monitoreo en tiempo real
- [ ] Snapshots y backups

## Contribuidores

- Grupo 3 - PUCP 2026-1

## Licencia

Proyecto académico - PUCP
