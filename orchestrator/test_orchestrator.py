"""
Tests unitarios básicos del Orchestrator.
Pruebas para validar funcionalidad de R1C y R2.
"""

import unittest
import tempfile
import os
from pathlib import Path

# Agregar path
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from orchestrator.models.entities import (
    Slice, VirtualMachine, Network, User, Role, 
    SliceState, VMState, NetworkType
)
from orchestrator.storage.storage import FileStorage
from orchestrator.core.slice_manager import SliceManager
from orchestrator.drivers.linux_cluster import LinuxClusterDriver
from orchestrator.utils.helpers import (
    validate_cidr,
    calculate_gateway,
    hash_password,
    verify_password
)


class TestModels(unittest.TestCase):
    """Tests de modelos de datos."""
    
    def test_slice_creation(self):
        """Test crear un slice."""
        slice_obj = Slice(
            name="test-slice",
            owner_id="admin",
            topology="linear"
        )
        
        self.assertEqual(slice_obj.name, "test-slice")
        self.assertEqual(slice_obj.state, SliceState.PENDING)
        self.assertEqual(len(slice_obj.vms), 0)
    
    def test_slice_add_network(self):
        """Test agregar red a slice."""
        slice_obj = Slice(name="test")
        net = Network(vlan_id=100, cidr="192.168.0.0/24")
        
        slice_obj.add_network(net)
        
        self.assertEqual(len(slice_obj.networks), 1)
        self.assertEqual(slice_obj.networks[0].vlan_id, 100)
    
    def test_slice_add_vm(self):
        """Test agregar VM a slice."""
        slice_obj = Slice(name="test")
        vm = VirtualMachine(name="vm1", vcpu=2, memory_mb=1024)
        
        slice_obj.add_vm(vm)
        
        self.assertEqual(len(slice_obj.vms), 1)
        self.assertEqual(slice_obj.vms[0].name, "vm1")
    
    def test_vm_states(self):
        """Test estados de VM."""
        vm = VirtualMachine(name="vm1")
        
        self.assertEqual(vm.state, VMState.PENDING)
        
        vm.state = VMState.RUNNING
        self.assertEqual(vm.state, VMState.RUNNING)
    
    def test_user_permissions(self):
        """Test permisos de usuario."""
        admin = User(username="admin", password_hash="hash", role=Role.ADMIN)
        user = User(username="user1", password_hash="hash", role=Role.USER)
        viewer = User(username="viewer", password_hash="hash", role=Role.VIEWER)
        
        self.assertTrue(admin.has_permission("create_slice"))
        self.assertTrue(user.has_permission("create_slice"))
        self.assertFalse(viewer.has_permission("create_slice"))


class TestStorage(unittest.TestCase):
    """Tests de almacenamiento."""
    
    def setUp(self):
        """Crear almacenamiento temporal."""
        self.temp_dir = tempfile.mkdtemp()
        self.storage = FileStorage(self.temp_dir)
    
    def tearDown(self):
        """Limpiar almacenamiento."""
        import shutil
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)
    
    def test_save_and_load_user(self):
        """Test guardar y cargar usuario."""
        user_data = {
            "username": "admin",
            "password_hash": "hash",
            "role": "admin",
            "email": "admin@test.com"
        }
        
        # Guardar
        result = self.storage.save_user("admin", user_data)
        self.assertTrue(result)
        
        # Cargar
        loaded = self.storage.load_user("admin")
        self.assertIsNotNone(loaded)
        self.assertEqual(loaded["username"], "admin")
    
    def test_save_and_load_slice(self):
        """Test guardar y cargar slice."""
        slice_data = {
            "id": "slice-123",
            "name": "test-slice",
            "owner_id": "admin",
            "topology": "linear",
            "state": "active"
        }
        
        # Guardar
        result = self.storage.save_slice("slice-123", slice_data)
        self.assertTrue(result)
        
        # Cargar
        loaded = self.storage.load_slice("slice-123")
        self.assertIsNotNone(loaded)
        self.assertEqual(loaded["name"], "test-slice")
    
    def test_list_slices(self):
        """Test listar slices."""
        self.storage.save_slice("slice-1", {"id": "slice-1", "name": "s1"})
        self.storage.save_slice("slice-2", {"id": "slice-2", "name": "s2"})
        
        slices = self.storage.list_slices()
        
        self.assertEqual(len(slices), 2)
        self.assertIn("slice-1", slices)
        self.assertIn("slice-2", slices)


class TestSliceManager(unittest.TestCase):
    """Tests del Slice Manager (R1C)."""
    
    def setUp(self):
        """Crear componentes."""
        self.temp_dir = tempfile.mkdtemp()
        self.storage = FileStorage(self.temp_dir)
        self.driver = LinuxClusterDriver()
        self.slice_manager = SliceManager(self.storage, self.driver)
        
        # Crear usuario
        self.user = User(
            username="admin",
            password_hash="hash",
            role=Role.ADMIN
        )
        self.slice_manager.users["admin"] = self.user
    
    def tearDown(self):
        """Limpiar."""
        import shutil
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)
    
    def test_validate_slice_request(self):
        """Test validación de slice request."""
        valid_request = {
            "name": "test",
            "topology": "linear",
            "networks": [],
            "vms": []
        }
        
        valid, msg = self.slice_manager.validate_slice_request(valid_request)
        self.assertTrue(valid)
        
        # Falta campo requerido
        invalid_request = {"topology": "linear"}
        valid, msg = self.slice_manager.validate_slice_request(invalid_request)
        self.assertFalse(valid)
    
    def test_create_slice(self):
        """Test crear slice."""
        success, msg, slice_id = self.slice_manager.create_slice(
            self.user,
            "test-slice",
            "linear",
            networks=[],
            vms=[],
            compute_nodes=[]
        )
        
        self.assertTrue(success)
        self.assertIsNotNone(slice_id)
    
    def test_get_slice(self):
        """Test obtener slice."""
        success, msg, slice_id = self.slice_manager.create_slice(
            self.user, "test", "linear", [], [], []
        )
        
        slice_obj = self.slice_manager.get_slice(self.user, slice_id)
        
        self.assertIsNotNone(slice_obj)
        self.assertEqual(slice_obj.name, "test")
    
    def test_authenticate_user(self):
        """Test autenticación."""
        user = self.slice_manager.authenticate_user("admin", "hash")
        
        self.assertIsNotNone(user)
        self.assertEqual(user.username, "admin")


class TestHelpers(unittest.TestCase):
    """Tests de funciones auxiliares."""
    
    def test_validate_cidr(self):
        """Test validación CIDR."""
        self.assertTrue(validate_cidr("192.168.0.0/24"))
        self.assertTrue(validate_cidr("10.0.0.0/8"))
        self.assertFalse(validate_cidr("192.168.0.0"))
        self.assertFalse(validate_cidr("256.0.0.0/24"))
    
    def test_calculate_gateway(self):
        """Test calcular gateway."""
        gateway = calculate_gateway("192.168.0.0/24")
        self.assertEqual(gateway, "192.168.0.1")
        
        gateway = calculate_gateway("10.20.30.0/24")
        self.assertEqual(gateway, "10.20.30.1")
    
    def test_password_hashing(self):
        """Test hash de contraseña."""
        password = "mypassword123"
        password_hash = hash_password(password)
        
        # Debe ser diferente al original
        self.assertNotEqual(password, password_hash)
        
        # Debe verificarse correctamente
        self.assertTrue(verify_password(password, password_hash))
        
        # Debe fallar con contraseña incorrecta
        self.assertFalse(verify_password("wrongpassword", password_hash))


class TestLinuxClusterDriver(unittest.TestCase):
    """Tests del Linux Cluster Driver (R2)."""
    
    def setUp(self):
        """Crear driver."""
        self.driver = LinuxClusterDriver()
    
    def test_driver_creation(self):
        """Test crear driver."""
        self.assertIsNotNone(self.driver)
        self.assertEqual(self.driver.vm_directory, "/var/lib/vms")


if __name__ == '__main__':
    # Ejecutar tests con verbosity
    unittest.main(verbosity=2)
