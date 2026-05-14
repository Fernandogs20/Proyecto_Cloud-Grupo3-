# Guía de Despliegue - Orchestrator en Infraestructura PUCP Grupo 3

## Arquitectura de Infraestructura Actual

Según tu Lab4 (Grupo 3), tienes:

```
┌─────────────────────────────────────────────┐
│              PUCP VNRT Network              │
├─────────────────────────────────────────────┤
│                                             │
│  Server1 (ens4)  --─ OFS ─── Server3      │
│  Server2 (ens4)  ──/       \─── Server4   │
│  (Compute)     (Data)    (Acceso)          │
│                 10.0.10.0/24               │
│                                             │
│  Rol: Compute      Rol: HeadNode  Rol: CLI│
│  ~ubuntu@s1        ~ubuntu@s3    ~ubuntu@s4
│                                             │
└─────────────────────────────────────────────┘
```

## Paso 1: Preparar Servidores (SSH Passwordless)

### En Server4 (Cliente)
```bash
ssh ubuntu@server4

# Generar claves ECDSA (como Lab4)
ssh-keygen -t ecdsa -b 256 -C "correo@pucp.edu.pe" -N "" -f ~/.ssh/id_ecdsa

# Ver clave pública
cat ~/.ssh/id_ecdsa.pub
```

### En Servers 1, 2, 3
```bash
# En cada servidor
ssh ubuntu@server1
ssh ubuntu@server2
ssh ubuntu@server3

# Agregar clave pública del cliente
mkdir -p ~/.ssh
cat >> ~/.ssh/authorized_keys << 'EOF'
<PEGAR CONTENIDO DE id_ecdsa.pub>
EOF

chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### Verificar Conectividad (desde server4)
```bash
ssh ubuntu@server4

# Probar acceso sin contraseña
ssh ubuntu@server1 'echo OK_Server1'
ssh ubuntu@server2 'echo OK_Server2'
ssh ubuntu@server3 'echo OK_Server3'
```

## Paso 2: Instalar Dependencias en Servidores

### En Servers 1 y 2 (Compute Nodes)
```bash
ssh ubuntu@server1

# Actualizar paquetes
sudo apt update && sudo apt upgrade -y

# Instalar QEMU/KVM
sudo apt install -y qemu-system-x86 qemu-utils libvirt-bin

# Instalar Open vSwitch
sudo apt install -y openvswitch-switch openvswitch-common

# Instalar herramientas necesarias
sudo apt install -y net-tools iproute2 iptables

# Crear directorio para VMs
sudo mkdir -p /var/lib/vms
sudo chown ubuntu:ubuntu /var/lib/vms
sudo chmod 755 /var/lib/vms

# Activar servicios
sudo systemctl start openvswitch-switch
sudo systemctl enable openvswitch-switch
```

Repetir los mismos comandos en **server2**:
```bash
ssh ubuntu@server2
# (ejecutar los mismos comandos)
```

### En Server 3 (HeadNode)
```bash
ssh ubuntu@server3

# Actualizar paquetes
sudo apt update && sudo apt upgrade -y

# Open vSwitch + herramientas networking
sudo apt install -y openvswitch-switch openvswitch-common
sudo apt install -y net-tools iproute2 iptables dnsmasq

# Crear directorio
sudo mkdir -p /var/lib/vms
sudo chown ubuntu:ubuntu /var/lib/vms

# Activar servicios
sudo systemctl start openvswitch-switch
sudo systemctl enable openvswitch-switch
```

### En Server 4 (Cliente/Orchestrator)
```bash
ssh ubuntu@server4

# Python 3 y pip
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv git

# Crear ambiente virtual
python3 -m venv ~/orchestrator-env
source ~/orchestrator-env/bin/activate

# Instalar Orchestrator
cd ~/Cloud/orchestrator
pip install -r requirements.txt

# Verifi conectividad SSH
ssh ubuntu@server1 'sudo ovs-vsctl show'
ssh ubuntu@server2 'sudo ovs-vsctl show'
ssh ubuntu@server3 'sudo ovs-vsctl show'
```

## Paso 3: Copiar Orchestrator a Server4

Desde tu máquina local:
```bash
# Copiar carpeta orchestrator a server4
scp -r ~/Desktop/Cloud/orchestrator ubuntu@server4:~/Cloud/

# O si estás en server4, solo clonar
ssh ubuntu@server4
cd ~/Cloud
# (El orchestrator ya debe estar aquí)
```

## Paso 4: Inicializar Orchestrator

```bash
ssh ubuntu@server4
source ~/orchestrator-env/bin/activate
cd ~/Cloud

# Inicializar sistema
python orchestrator/init_orchestrator.py --storage-path ~/.local/orchestrator

# Salida esperada:
# ✓ Almacenamiento creado
# ✓ Usuario admin creado
# ✓ Credenciales: admin/admin123
```

## Paso 5: Inicializar Infraestructura

### 5a. Ejecutar Setup de Nodos

```bash
ssh ubuntu@server4
source ~/orchestrator-env/bin/activate
cd ~/Cloud

python3 << 'EOF'
from orchestrator.drivers.linux_cluster import LinuxClusterDriver

driver = LinuxClusterDriver()

print("\n=== Inicializando HeadNode ===")
result = driver.init_headnode("server3", ["ens4"])
print(f"HeadNode init: {result}")

print("\n=== Inicializando Compute Nodes ===")
result1 = driver.init_compute_node("server1", ["ens4"])
print(f"Server1 init: {result1}")

result2 = driver.init_compute_node("server2", ["ens4"])
print(f"Server2 init: {result2}")

print("\nInfraestructura inicializada!")
EOF
```

### 5b. Crear Redes VLAN

```bash
python3 << 'EOF'
from orchestrator.drivers.linux_cluster import LinuxClusterDriver

driver = LinuxClusterDriver()

print("\n=== Creando VLAN 100 (192.168.0.0/24) ===")
result = driver.create_vlan_network(
    "server3",
    vlan_id=100,
    cidr="192.168.0.0/24",
    dhcp_enabled=False
)
print(f"VLAN 100 creada: {result}")

print("\n=== Creando VLAN 200 (192.168.2.0/24 con DHCP) ===")
result = driver.create_vlan_network(
    "server3",
    vlan_id=200,
    cidr="192.168.2.0/24",
    dhcp_enabled=True,
    dhcp_range="192.168.2.10,192.168.2.100"
)
print(f"VLAN 200 creada: {result}")

print("\n=== Habilitando acceso a internet ===")
result = driver.enable_internet_access(
    "server3",
    vlan_id=100,
    cidr="192.168.0.0/24"
)
print(f"Internet habilitado: {result}")

print("\nRedes configuradas!")
EOF
```

## Paso 6: Crear y Desplegar Primer Slice

```bash
python3 << 'EOF'
from orchestrator.core.slice_manager import SliceManager
from orchestrator.drivers.linux_cluster import LinuxClusterDriver
from orchestrator.storage.storage import FileStorage
from orchestrator.models.entities import User, Role

# Inicializar componentes
storage = FileStorage("/home/ubuntu/.local/orchestrator")
driver = LinuxClusterDriver()
manager = SliceManager(storage, driver)

# Crear usuario
admin = User("admin", "admin_hash", Role.ADMIN)
manager.users["admin"] = admin

# Definir slice
print("\n=== Creando Slice Linear ===")
success, msg, slice_id = manager.create_slice(
    admin,
    "test-linear",
    "linear",
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

print(f"Slice creado: {success}")
print(f"Mensaje: {msg}")
print(f"Slice ID: {slice_id}")

if success:
    # Esperar a que se despliegue (worker async)
    import time
    time.sleep(10)
    
    # Obtener detalles
    slice_obj = manager.get_slice(admin, slice_id)
    if slice_obj:
        print(f"\nSlice {slice_obj.name}:")
        print(f"  Estado: {slice_obj.state.value}")
        print(f"  VMs: {len(slice_obj.vms)}")
        print(f"  Networks: {len(slice_obj.networks)}")
EOF
```

## Paso 7: Verificar Slice Desplegado

### Verificar en HeadNode (Server3)
```bash
ssh ubuntu@server3

# Ver bridges OvS
sudo ovs-vsctl show

# Ver interfaces de red
ip addr

# Ver iptables rules
sudo iptables -L -v

# Ver namespaces
sudo ip netns list
```

### Verificar en Compute Nodes (Server1/2)
```bash
ssh ubuntu@server1

# Ver bridges
sudo ovs-vsctl show

# Ver TAP interfaces
ip link | grep tap

# Ver procesos QEMU
ps aux | grep kvm

# Ver discos
ls -lh /var/lib/vms/
```

## Paso 8: Acceder a VMs

### Opción A: Via VNC (desde tu PC)
```bash
# Desde tu máquina local (si tienes VNC viewer)
# Conectar a: server1:5901 (vm1)
# Conectar a: server1:5902 (vm2)
# O via SSH tunnel:
ssh -L 5901:server1:5901 ubuntu@server4
# Luego conectar VNC a localhost:5901
```

### Opción B: Desde Server4 (por TAP interface)
```bash
ssh ubuntu@server4

# Si VMs tienen IP asignada
ping 192.168.0.10  # ip de vm1 si le asignaste

# O via serial/console (si lo configuraste)
# Depende de cómo iniciaste la VM
```

## Paso 9: API REST (Opcional)

Desde server4:
```bash
source ~/orchestrator-env/bin/activate
cd ~/Cloud

# Iniciar servidor API
python -m orchestrator.api

# En otra terminal:
curl http://localhost:5000/api/v1/health
curl http://localhost:5000/api/v1/slices

# Desde tu PC (si tienes ssh tunnel):
ssh -L 5000:server4:5000 ubuntu@server4
# Luego: curl http://localhost:5000/api/v1/health
```

## Resumen de Roles

```
┌──────────────────────────────────────────────────────┐
│ SERVIDOR │ ROL              │ COMPONENTES           │
├──────────────────────────────────────────────────────┤
│ Server1  │ Compute Node     │ QEMU/KVM, OvS, TAP    │
│ Server2  │ Compute Node     │ QEMU/KVM, OvS, TAP    │
│ Server3  │ HeadNode         │ OvS, iptables, netns  │
│ Server4  │ Orchestrator CLI │ Python, Flask, API    │
└──────────────────────────────────────────────────────┘
```

## Checklist de Pruebas

- [ ] SSH sin contraseña funciona (server4 → servers 1,2,3)
- [ ] QEMU/KVM instalado en servers 1,2
- [ ] Open vSwitch instalado en servers 1,2,3
- [ ] Python 3.8+ instalado en server4
- [ ] Orchestrator inicializado en server4
- [ ] Infrastructure init completed
- [ ] VLAN 100 y 200 creadas
- [ ] Primer slice desplegado
- [ ] VMs corriendo y accesibles

## Troubleshooting

### SSH no funciona
```bash
ssh -v ubuntu@server1  # Ver detalles
# Verificar authorized_keys tiene permisos 600
# Verificar SSH daemon running: sudo systemctl status ssh
```

### OvS no responde
```bash
ssh ubuntu@server1
sudo systemctl restart openvswitch-switch
sudo ovs-vsctl show
```

### VMs no inician
```bash
ssh ubuntu@server1
ls -l /var/lib/vms/
tail -f /tmp/vm1.log
qemu-system-x86_64 --version  # Verificar QEMU instalado
```

### Slice no despliega
```bash
cd ~/Cloud
tail -f ~/.local/orchestrator/logs/operations.jsonl
# Ver qué error ocurrió
```

## Próximos Pasos

1. ✅ Probar slice linear
2. ✅ Probar topología mesh (múltiples VLANs + routing)
3. ✅ Validar persistencia y load de slices
4. 📋 Implementar R1B (UI)
5. 📋 Agregar monitoreo/métricas
