#!/usr/bin/env python3
"""
Script de Prueba Rápida del Orchestrator en Infraestructura PUCP
Diseñado para ejecutarse en Server4 (Cliente)

Verifica:
1. Conectividad SSH a todos los servidores
2. Inicialización de infraestructura
3. Creación de slice de prueba
4. Validación de despliegue
"""

import sys
import subprocess
import time
import os

# Colores para output
RED = '\033[91m'
GREEN = '\033[92m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
END = '\033[0m'

class TestRunner:
    def __init__(self):
        self.results = []
        self.servers = ["server1", "server2", "server3"]
        self.username = "ubuntu"
    
    def run_command(self, cmd, host=None):
        """Ejecuta comando localmente o en remoto."""
        if host:
            full_cmd = f"ssh {self.username}@{host} '{cmd}'"
        else:
            full_cmd = cmd
        
        try:
            result = subprocess.run(
                full_cmd,
                shell=True,
                capture_output=True,
                text=True,
                timeout=10
            )
            return result.returncode == 0, result.stdout, result.stderr
        except subprocess.TimeoutExpired:
            return False, "", "Timeout"
        except Exception as e:
            return False, "", str(e)
    
    def print_header(self, text):
        print(f"\n{BLUE}{'='*60}{END}")
        print(f"{BLUE}{text:^60}{END}")
        print(f"{BLUE}{'='*60}{END}\n")
    
    def print_test(self, name, passed, details=""):
        status = f"{GREEN}✓ PASS{END}" if passed else f"{RED}✗ FAIL{END}"
        print(f"  [{status}] {name}")
        if details:
            print(f"       {details}")
        self.results.append((name, passed))
    
    def test_ssh_connectivity(self):
        """Test 1: Conectividad SSH."""
        self.print_header("TEST 1: Conectividad SSH")
        
        for server in self.servers:
            success, out, err = self.run_command("echo OK", server)
            self.print_test(
                f"SSH {server}",
                success,
                f"OK" if success else err
            )
    
    def test_dependencies(self):
        """Test 2: Dependencias instaladas."""
        self.print_header("TEST 2: Dependencias en Servidores")
        
        # Compute nodes
        for server in ["server1", "server2"]:
            success, _, _ = self.run_command("which qemu-system-x86_64", server)
            self.print_test(f"QEMU en {server}", success)
            
            success, _, _ = self.run_command("which ovs-vsctl", server)
            self.print_test(f"OvS en {server}", success)
        
        # HeadNode
        success, _, _ = self.run_command("which ovs-vsctl", "server3")
        self.print_test("OvS en server3", success)
        
        success, _, _ = self.run_command("which iptables", "server3")
        self.print_test("iptables en server3", success)
    
    def test_orchestrator_setup(self):
        """Test 3: Orchestrator setup."""
        self.print_header("TEST 3: Orchestrator Setup")
        
        # Verificar que orchestrator existe
        success = os.path.exists("orchestrator")
        self.print_test("Carpeta orchestrator existe", success)
        
        # Verificar archivos clave
        files = [
            "orchestrator/core/slice_manager.py",
            "orchestrator/drivers/linux_cluster.py",
            "orchestrator/storage/storage.py",
            "orchestrator/requirements.txt"
        ]
        
        for f in files:
            success = os.path.exists(f)
            self.print_test(f"  {f}", success)
    
    def test_initialization(self):
        """Test 4: Inicialización de infraestructura."""
        self.print_header("TEST 4: Inicialización de Infraestructura")
        
        print(f"{YELLOW}Ejecutando init_orchestrator.py...{END}\n")
        
        cmd = "python orchestrator/init_orchestrator.py --storage-path ~/.local/orchestrator 2>&1"
        success, out, err = self.run_command(cmd)
        
        self.print_test("Orchestrator inicializado", success)
        
        # Verificar usuarios creados
        success = os.path.exists(os.path.expanduser("~/.local/orchestrator/users/admin.json"))
        self.print_test("Usuario admin creado", success)
    
    def test_infrastructure_init(self):
        """Test 5: Inicialización de nodos."""
        self.print_header("TEST 5: Inicialización de Infraestructura")
        
        print(f"{YELLOW}Inicializando HeadNode y Compute Nodes...{END}\n")
        
        test_script = """
from orchestrator.drivers.linux_cluster import LinuxClusterDriver
driver = LinuxClusterDriver()

# HeadNode
result_h = driver.init_headnode("server3", ["ens4"])
print(f"HeadNode: {result_h}")

# Compute
result_1 = driver.init_compute_node("server1", ["ens4"])
print(f"Server1: {result_1}")

result_2 = driver.init_compute_node("server2", ["ens4"])
print(f"Server2: {result_2}")

if result_h and result_1 and result_2:
    print("SUCCESS")
else:
    print("FAILED")
"""
        
        cmd = f"python3 -c \"{test_script}\""
        success, out, err = self.run_command(cmd)
        
        success = "SUCCESS" in out
        self.print_test("Infrastructure init", success, out.split('\n')[-2] if out else "")
    
    def test_vlan_creation(self):
        """Test 6: Creación de VLANs."""
        self.print_header("TEST 6: Creación de VLANs")
        
        print(f"{YELLOW}Creando VLANs...{END}\n")
        
        test_script = """
from orchestrator.drivers.linux_cluster import LinuxClusterDriver
driver = LinuxClusterDriver()

# VLAN 100
result_100 = driver.create_vlan_network(
    "server3", 100, "192.168.0.0/24", dhcp_enabled=False
)
print(f"VLAN 100: {result_100}")

# VLAN 200
result_200 = driver.create_vlan_network(
    "server3", 200, "192.168.2.0/24", dhcp_enabled=True,
    dhcp_range="192.168.2.10,192.168.2.100"
)
print(f"VLAN 200: {result_200}")

if result_100 and result_200:
    print("SUCCESS")
"""
        
        cmd = f"python3 -c \"{test_script}\""
        success, out, err = self.run_command(cmd)
        
        success = "SUCCESS" in out
        self.print_test("VLANs creadas", success)
    
    def test_slice_creation(self):
        """Test 7: Creación de Slice."""
        self.print_header("TEST 7: Creación de Slice de Prueba")
        
        print(f"{YELLOW}Creando y desplegando slice...{END}\n")
        
        test_script = """
from orchestrator.core.slice_manager import SliceManager
from orchestrator.drivers.linux_cluster import LinuxClusterDriver
from orchestrator.storage.storage import FileStorage
from orchestrator.models.entities import User, Role
import time

storage = FileStorage("/home/ubuntu/.local/orchestrator")
driver = LinuxClusterDriver()
manager = SliceManager(storage, driver)

admin = User("admin", "admin_hash", Role.ADMIN)
manager.users["admin"] = admin

success, msg, slice_id = manager.create_slice(
    admin, "test-linear", "linear",
    networks=[{"vlan_id": 100, "cidr": "192.168.0.0/24"}],
    vms=[
        {"name": "vm1", "network_id": 100, "vcpu": 1, "memory_mb": 512, "disk_gb": 5, "vnc_port": 5901}
    ],
    compute_nodes=["server1"]
)

print(f"Created: {success}")
print(f"SliceID: {slice_id}")

if success:
    time.sleep(5)  # Esperar despliegue
    slice_obj = manager.get_slice(admin, slice_id)
    if slice_obj:
        print(f"State: {slice_obj.state.value}")
        print(f"VMs: {len(slice_obj.vms)}")
        print("SUCCESS")
"""
        
        cmd = f"python3 -c \"{test_script}\""
        success, out, err = self.run_command(cmd)
        
        success = "SUCCESS" in out
        details = [line for line in out.split('\n') if line][-1] if out else ""
        self.print_test("Slice creado y desplegado", success, details)
    
    def print_summary(self):
        """Imprime resumen de pruebas."""
        self.print_header("RESUMEN DE PRUEBAS")
        
        passed = sum(1 for _, result in self.results if result)
        total = len(self.results)
        percentage = (passed / total * 100) if total > 0 else 0
        
        print(f"\nTotal: {passed}/{total} pruebas pasaron ({percentage:.1f}%)\n")
        
        if passed == total:
            print(f"{GREEN}{'✓ TODAS LAS PRUEBAS PASARON':^60}{END}\n")
        else:
            print(f"{RED}{'✗ ALGUNAS PRUEBAS FALLARON':^60}{END}\n")
        
        print("Próximos pasos:")
        print("  1. Verificar logs: tail ~/.local/orchestrator/logs/operations.jsonl")
        print("  2. SSH a servers para debugging: ssh ubuntu@server1")
        print("  3. Ver bridges OvS: sudo ovs-vsctl show")
        print("  4. Ver procesos KVM: ps aux | grep kvm")
        print("  5. Consultar documentación: DEPLOYMENT_GUIDE.md\n")
    
    def run_all_tests(self):
        """Ejecuta todas las pruebas."""
        self.print_header("ORCHESTRATOR - TEST SUITE")
        print("Grupo 3 PUCP 2026-1\n")
        
        try:
            self.test_ssh_connectivity()
            time.sleep(1)
            
            self.test_dependencies()
            time.sleep(1)
            
            self.test_orchestrator_setup()
            time.sleep(1)
            
            self.test_initialization()
            time.sleep(2)
            
            self.test_infrastructure_init()
            time.sleep(2)
            
            self.test_vlan_creation()
            time.sleep(2)
            
            self.test_slice_creation()
            
            self.print_summary()
        
        except KeyboardInterrupt:
            print(f"\n{RED}Test interrumpido por usuario{END}")
        except Exception as e:
            print(f"\n{RED}Error durante tests: {str(e)}{END}")


if __name__ == '__main__':
    runner = TestRunner()
    runner.run_all_tests()
