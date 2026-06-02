#!/usr/bin/env python3
"""
Ejemplo de uso del Orchestrator - R1C (Slice Manager) y R2 (Linux Cluster).

Este script demuestra:
1. Inicialización de nodos
2. Creación de redes VLAN
3. Creación y gestión de slices
4. Despliegue de máquinas virtuales
"""

import sys
import json
sys.path.insert(0, '/path/to/orchestrator')

from orchestrator.core.slice_manager import SliceManager
from orchestrator.drivers.linux_cluster import LinuxClusterDriver
from orchestrator.storage.storage import FileStorage
from orchestrator.models.entities import User, Role


def example_1_init_nodes():
    """Ejemplo 1: Inicializar nodos de la infraestructura."""
    print("\n=== EJEMPLO 1: Inicializar Nodos ===\n")
    
    driver = LinuxClusterDriver()
    
    # Inicializar headnode
    print("Inicializando headnode en server3...")
    success = driver.init_headnode("server3", ["ens4"])
    print(f"Headnode inicializado: {success}\n")
    
    # Inicializar compute nodes
    print("Inicializando nodos de cómputo...")
    success = driver.init_compute_node("server1", ["ens4"])
    print(f"server1 inicializado: {success}")
    
    success = driver.init_compute_node("server2", ["ens4"])
    print(f"server2 inicializado: {success}\n")


def example_2_create_networks():
    """Ejemplo 2: Crear redes VLAN."""
    print("\n=== EJEMPLO 2: Crear Redes VLAN ===\n")
    
    driver = LinuxClusterDriver()
    
    # VLAN 100 sin DHCP
    print("Creando VLAN 100 (192.168.0.0/24) sin DHCP...")
    success = driver.create_vlan_network(
        "server3",
        vlan_id=100,
        cidr="192.168.0.0/24",
        dhcp_enabled=False
    )
    print(f"VLAN 100 creada: {success}\n")
    
    # VLAN 200 con DHCP
    print("Creando VLAN 200 (192.168.2.0/24) con DHCP...")
    success = driver.create_vlan_network(
        "server3",
        vlan_id=200,
        cidr="192.168.2.0/24",
        dhcp_enabled=True,
        dhcp_range="192.168.2.10,192.168.2.100"
    )
    print(f"VLAN 200 creada: {success}\n")
    
    # Habilitar acceso a internet
    print("Habilitando acceso a internet para VLAN 100...")
    success = driver.enable_internet_access(
        "server3",
        vlan_id=100,
        cidr="192.168.0.0/24"
    )
    print(f"Acceso a internet habilitado: {success}\n")


def example_3_slice_manager():
    """Ejemplo 3: Gestión de slices con R1C."""
    print("\n=== EJEMPLO 3: Slice Manager (R1C) ===\n")
    
    # Inicializar componentes
    storage = FileStorage("/tmp/orchestrator_demo")
    driver = LinuxClusterDriver()
    slice_manager = SliceManager(storage, driver)
    
    # Crear usuario
    user = User(
        username="admin",
        password_hash="admin_hash",
        role=Role.ADMIN,
        email="admin@example.com"
    )
    slice_manager.users["admin"] = user
    
    # Definir slice
    slice_config = {
        "name": "test-slice-linear",
        "topology": "linear",
        "compute_nodes": ["server1", "server2"],
        "networks": [
            {
                "vlan_id": 100,
                "cidr": "192.168.0.0/24",
                "gateway": "192.168.0.1",
                "dhcp_enabled": False
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
            },
            {
                "name": "vm2",
                "network_id": 100,
                "vcpu": 1,
                "memory_mb": 512,
                "disk_gb": 5,
                "vnc_port": 5902
            }
        ]
    }
    
    # Validar
    valid, msg = slice_manager.validate_slice_request(slice_config)
    print(f"Request válido: {valid} - {msg}\n")
    
    # Crear slice
    if valid:
        print("Creando slice...")
        success, message, slice_id = slice_manager.create_slice(
            user,
            slice_config["name"],
            slice_config["topology"],
            slice_config["networks"],
            slice_config["vms"],
            slice_config["compute_nodes"]
        )
        print(f"Slice creado: {success}")
        print(f"Mensaje: {message}")
        print(f"Slice ID: {slice_id}\n")
        
        # Listar slices
        print("Listando slices...")
        slices = slice_manager.list_slices(user)
        for s in slices:
            print(f"  - {s.name} ({s.id}): {s.state.value}")
        print()


def example_4_advanced_topology():
    """Ejemplo 4: Topología avanzada con múltiples redes."""
    print("\n=== EJEMPLO 4: Topología Avanzada (Mesh) ===\n")
    
    storage = FileStorage("/tmp/orchestrator_demo")
    driver = LinuxClusterDriver()
    slice_manager = SliceManager(storage, driver)
    
    user = User(
        username="admin",
        password_hash="admin_hash",
        role=Role.ADMIN
    )
    slice_manager.users["admin"] = user
    
    slice_config = {
        "name": "mesh-topology",
        "topology": "mesh",
        "compute_nodes": ["server1", "server2"],
        "networks": [
            {
                "vlan_id": 100,
                "cidr": "192.168.0.0/24",
                "dhcp_enabled": False
            },
            {
                "vlan_id": 200,
                "cidr": "192.168.1.0/24",
                "dhcp_enabled": True,
                "dhcp_range": "192.168.1.10,192.168.1.100"
            }
        ],
        "vms": [
            {
                "name": "mesh-vm1",
                "network_id": 100,
                "vcpu": 2,
                "memory_mb": 1024,
                "disk_gb": 10,
                "vnc_port": 5901
            },
            {
                "name": "mesh-vm2",
                "network_id": 200,
                "vcpu": 2,
                "memory_mb": 1024,
                "disk_gb": 10,
                "vnc_port": 5902
            }
        ]
    }
    
    valid, msg = slice_manager.validate_slice_request(slice_config)
    if valid:
        success, message, slice_id = slice_manager.create_slice(
            user,
            slice_config["name"],
            slice_config["topology"],
            slice_config["networks"],
            slice_config["vms"],
            slice_config["compute_nodes"]
        )
        
        print(f"Slice mesh creado: {success}")
        print(f"Slice ID: {slice_id}\n")
        
        # Obtener detalles
        slice_obj = slice_manager.get_slice(user, slice_id)
        if slice_obj:
            print(f"Slice: {slice_obj.name}")
            print(f"Topología: {slice_obj.topology}")
            print(f"Networks: {len(slice_obj.networks)}")
            for net in slice_obj.networks:
                print(f"  - VLAN {net.vlan_id}: {net.cidr}")
            print(f"VMs: {len(slice_obj.vms)}")
            for vm in slice_obj.vms:
                print(f"  - {vm.name}: {vm.vcpu}vCPU, {vm.memory_mb}MB RAM")
            print()


if __name__ == '__main__':
    print("=" * 60)
    print("EJEMPLOS DE USO DEL ORCHESTRATOR - Grupo 3 PUCP")
    print("=" * 60)
    
    try:
        example_1_init_nodes()
        example_2_create_networks()
        example_3_slice_manager()
        example_4_advanced_topology()
        
        print("\n" + "=" * 60)
        print("EJEMPLOS COMPLETADOS EXITOSAMENTE")
        print("=" * 60)
    
    except Exception as e:
        print(f"\nError: {str(e)}")
        import traceback
        traceback.print_exc()
