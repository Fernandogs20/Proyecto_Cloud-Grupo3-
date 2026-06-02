# Guía de Inicio Rápido - Orchestrator Grupo 3

## Instalación

### 1. Requisitos

```bash
# Python 3.8+
python --version

# GIT
git --version

# SSH (sin contraseña)
ssh-keygen -t ed25519  # O ECDSA como en Lab4
```

### 2. Clonar/Descargar

```bash
cd ~/Desktop/Cloud
# O tu ruta del proyecto
```

### 3. Instalar Dependencias

```bash
pip install -r orchestrator/requirements.txt
```

### 4. Inicializar Orchestrator

```bash
python orchestrator/init_orchestrator.py --storage-path /var/lib/orchestrator
```

Salida esperada:
```
============================================================
INICIALIZANDO ORCHESTRATOR - PUCP Grupo 3
============================================================

1. Creando almacenamiento en /var/lib/orchestrator...
   ✓ Almacenamiento creado

2. Creando usuarios por defecto...
   ✓ Usuario admin (admin) creado
   ✓ Usuario user1 (user) creado
   ✓ Usuario viewer (viewer) creado

...

ORCHESTRATOR INICIALIZADO CORRECTAMENTE
============================================================

Credenciales de prueba:
  Admin   : admin / admin123
  User    : user1 / user123
  Viewer  : viewer / viewer123
```

## Uso Básico

### Opción 1: API REST

```bash
# Iniciar servidor
python -m orchestrator.api

# En otra terminal, probar
curl -X GET http://localhost:5000/api/v1/health
```

### Opción 2: Python Direct

```python
from orchestrator.core.slice_manager import SliceManager
from orchestrator.drivers.linux_cluster import LinuxClusterDriver
from orchestrator.storage.storage import FileStorage
from orchestrator.models.entities import User, Role

# Inicializar
storage = FileStorage("/var/lib/orchestrator")
driver = LinuxClusterDriver()
manager = SliceManager(storage, driver)

# Crear usuario
user = User("admin", "admin_hash", Role.ADMIN)

# Crear slice
success, msg, slice_id = manager.create_slice(
    user,
    "mi-primer-slice",
    "linear",
    networks=[{"vlan_id": 100, "cidr": "192.168.0.0/24"}],
    vms=[{"name": "vm1", "vcpu": 1, "memory_mb": 512}],
    compute_nodes=["server1"]
)

print(f"Slice creado: {slice_id}")
```

### Opción 3: Ejemplos

```bash
python orchestrator/examples.py
```

## Lab4 → Orchestrator: Mapping

El Orchestrator implementa la lógica de los scripts bash del Lab4 en Python:

### Scripts Bash → Python

| Script Bash | Función Python | Ubicación |
|---|---|---|
| `headnode_init.sh` | `init_headnode()` | `LinuxClusterDriver.init_headnode()` |
| `compute_init.sh` | `init_compute_node()` | `LinuxClusterDriver.init_compute_node()` |
| `create_network_vlan.sh` | `create_vlan_network()` | `LinuxClusterDriver.create_vlan_network()` |
| `create_vm.sh` | `create_vm()` | `LinuxClusterDriver.create_vm()` |
| `delete_vm.sh` | `delete_vm()` | `LinuxClusterDriver.delete_vm()` |
| `internet_to_network.sh` | `enable_internet_access()` | `LinuxClusterDriver.enable_internet_access()` |
| `routing_networks.sh` | `enable_vlan_routing()` | `LinuxClusterDriver.enable_vlan_routing()` |

### Mejoras sobre Bash

1. **Modularidad**: Código reutilizable en clases
2. **OOP**: Modelado de datos con `@dataclass`
3. **Persistencia**: Almacenamiento automático
4. **Autenticación**: Control de acceso
5. **Manejo de errores**: Try/except estructurado
6. **Logging**: Trazabilidad completa
7. **Concurrencia**: Despliegue asincrónico
8. **APIs**: REST para integración

## Guía de Configuración

### 1. Nodos de Infraestructura

Antes de desplegar slices, inicializar los nodos:

```python
# Inicializar headnode
driver.init_headnode("server3", ["ens4"])

# Inicializar compute nodes
driver.init_compute_node("server1", ["ens4"])
driver.init_compute_node("server2", ["ens4"])
```

### 2. Crear Redes

```python
# VLAN 100 sin DHCP
driver.create_vlan_network(
    headnode="server3",
    vlan_id=100,
    cidr="192.168.0.0/24",
    dhcp_enabled=False
)

# VLAN 200 con DHCP
driver.create_vlan_network(
    headnode="server3",
    vlan_id=200,
    cidr="192.168.2.0/24",
    dhcp_enabled=True,
    dhcp_range="192.168.2.10,192.168.2.100"
)
```

### 3. Crear Slice

```python
success, msg, slice_id = manager.create_slice(
    user,
    name="topology-linear",
    topology="linear",
    networks=[
        {
            "vlan_id": 100,
            "cidr": "192.168.0.0/24",
            "dhcp_enabled": False
        }
    ],
    vms=[
        {
            "name": "vm1",
            "network_id": 100,
            "vcpu": 1,
            "memory_mb": 512,
            "disk_gb": 5,
            "vnc_port": 5901
        },
        {
            "name": "vm2",
            "network_id": 100,
            "vcpu": 1,
            "memory_mb": 512,
            "disk_gb": 5,
            "vnc_port": 5902
        }
    ],
    compute_nodes=["server1", "server2"]
)
```

El Slice Manager automáticamente:
1. Crea las redes VLAN (llama a R2)
2. Crea las máquinas virtuales (llama a R2)
3. Configura la topología

## Debugging

### Ver Logs

```bash
# Logs del sistema
tail -f /var/lib/orchestrator/logs/operations.jsonl

# O activar verbose logging en Python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Probar Conectividad SSH

```bash
# Asegurar SSH sin contraseña
ssh ubuntu@server1 'echo OK'
ssh ubuntu@server2 'echo OK'
ssh ubuntu@server3 'echo OK'
```

### Verificar Infraestructura

```bash
# En server3 (headnode)
sudo ovs-vsctl show  # Ver bridges OvS
sudo ip netns list   # Ver namespaces
sudo iptables -L     # Ver reglas iptables

# En server1, server2 (compute)
sudo ovs-vsctl show
ip link | grep tap   # Ver TAP interfaces
ps aux | grep kvm    # Ver procesos QEMU
```

## Topologías de Ejemplo

### Linear
```python
{
    "name": "linear-topology",
    "topology": "linear",
    "networks": [{"vlan_id": 100, "cidr": "192.168.0.0/24"}],
    "vms": [
        {"name": "vm1", ...},
        {"name": "vm2", ...},
        {"name": "vm3", ...}
    ]
}
```

### Mesh con Routing
```python
{
    "name": "mesh-topology",
    "topology": "mesh",
    "networks": [
        {"vlan_id": 100, "cidr": "192.168.0.0/24"},
        {"vlan_id": 200, "cidr": "192.168.1.0/24"}
    ],
    "vms": [
        {"name": "vm1", "network_id": 100, ...},
        {"name": "vm2", "network_id": 200", ...}
    ]
}
```

## Operaciones Comunes

### Listar Slices
```python
slices = manager.list_slices(user)
for s in slices:
    print(f"{s.name}: {s.state.value}")
```

### Obtener Detalles de Slice
```python
slice_obj = manager.get_slice(user, slice_id)
print(f"VMs: {len(slice_obj.vms)}")
print(f"Networks: {len(slice_obj.networks)}")
for vm in slice_obj.vms:
    print(f"  {vm.name}: {vm.state.value}")
```

### Editar Slice
```python
success, msg = manager.edit_slice(
    user, slice_id,
    operations=[
        {
            "op": "add_vm",
            "vm": {"name": "vm4", "network_id": 100, ...}
        }
    ]
)
```

### Eliminar Slice
```python
success, msg = manager.delete_slice(user, slice_id)
```

## Troubleshooting

### Problema: SSH Connection Timeout
**Solución**: Verificar `~/.ssh/config` y probar conectividad manual
```bash
ssh -v ubuntu@server1
```

### Problema: Imagen Cirros no descarga
**Solución**: Verificar conectividad a internet y manual:
```bash
ssh ubuntu@server1
cd /var/lib/vms
wget https://download.cirros-cloud.net/0.6.2/cirros-0.6.2-x86_64-disk.img
```

### Problema: OvS no responde
**Solución**: Verificar servicio
```bash
ssh ubuntu@server1
sudo systemctl restart openvswitch-switch
sudo ovs-vsctl show
```

### Problema: QEMU no inicia
**Solución**: Verificar logs
```bash
ssh ubuntu@server1
tail -f /tmp/vm1.log
```

## Próximos Pasos

1. ✅ Instalación y configuración completada
2. ✅ Despliegue de topologías básicas
3. 📋 Implementar R1B (Interface de Usuario)
4. 📋 Agregar R3 (OpenStack Support)
5. 📋 Implementar R4 (VM Placement)
6. 📋 Agregar R5 (Networking Avanzado)

## Contacto y Soporte

- **Grupo**: PUCP 2026-1 Grupo 3
- **Proyecto**: Orquestador de Nube Privada
- **Coach**: Revisar documento ASESORÍAS en proyecto original

## Referencias

- [Arquitectura Completa](./ARCHITECTURE.md)
- [README Técnico](./README.md)
- [Ejemplos Detallados](./examples.py)
- [Lab4 Original](../Lab4_documentation.pdf)
