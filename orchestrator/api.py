"""
API REST del Orquestador - Punto de entrada principal.
Expone funcionalidades de R1C (Slice Manager) y R2 (Linux Cluster).
"""

import logging
from typing import Dict, Any, Optional, Tuple
from flask import Flask, request, jsonify
from functools import wraps

from .core.slice_manager import SliceManager
from .drivers.linux_cluster import LinuxClusterDriver
from .storage.storage import FileStorage
from .models.entities import User, Role

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class OrchestratorAPI:
    """API del Orquestador."""
    
    def __init__(self, storage_path: str = "/var/lib/orchestrator"):
        self.storage = FileStorage(storage_path)
        self.linux_driver = LinuxClusterDriver()
        self.slice_manager = SliceManager(self.storage, self.linux_driver)
        self.app = Flask(__name__)
        self._setup_routes()
    
    def _setup_routes(self):
        """Configura las rutas de la API."""
        
        @self.app.route('/api/v1/health', methods=['GET'])
        def health():
            """Health check."""
            return jsonify({"status": "healthy"}), 200
        
        # Autenticación
        @self.app.route('/api/v1/auth/login', methods=['POST'])
        def login():
            """Autentica un usuario."""
            data = request.get_json()
            username = data.get('username')
            password_hash = data.get('password_hash')
            
            user = self.slice_manager.authenticate_user(username, password_hash)
            
            if user:
                return jsonify({
                    "success": True,
                    "message": "Autenticado",
                    "user": {
                        "username": user.username,
                        "role": user.role.value
                    }
                }), 200
            else:
                return jsonify({
                    "success": False,
                    "message": "Credenciales inválidas"
                }), 401
        
        # Slices
        @self.app.route('/api/v1/slices', methods=['POST'])
        def create_slice():
            """Crea un nuevo slice."""
            data = request.get_json()
            
            # Validar request
            valid, msg = self.slice_manager.validate_slice_request(data)
            if not valid:
                return jsonify({"success": False, "message": msg}), 400
            
            # Obtener usuario (en producción, usar JWT/tokens)
            username = data.get('owner_id', 'admin')
            user = User(username, "", Role.ADMIN)  # Simplificado para demo
            
            success, message, slice_id = self.slice_manager.create_slice(
                user,
                data.get('name'),
                data.get('topology'),
                data.get('networks', []),
                data.get('vms', []),
                data.get('compute_nodes', [])
            )
            
            if success:
                return jsonify({
                    "success": True,
                    "message": message,
                    "slice_id": slice_id
                }), 201
            else:
                return jsonify({
                    "success": False,
                    "message": message
                }), 400
        
        @self.app.route('/api/v1/slices', methods=['GET'])
        def list_slices():
            """Lista slices."""
            username = request.args.get('owner_id', 'admin')
            user = User(username, "", Role.ADMIN)
            
            slices = self.slice_manager.list_slices(user)
            
            return jsonify({
                "success": True,
                "slices": [
                    {
                        "id": s.id,
                        "name": s.name,
                        "topology": s.topology,
                        "state": s.state.value,
                        "vm_count": len(s.vms),
                        "network_count": len(s.networks)
                    }
                    for s in slices
                ]
            }), 200
        
        @self.app.route('/api/v1/slices/<slice_id>', methods=['GET'])
        def get_slice(slice_id):
            """Obtiene detalles de un slice."""
            username = request.args.get('owner_id', 'admin')
            user = User(username, "", Role.ADMIN)
            
            slice_obj = self.slice_manager.get_slice(user, slice_id)
            
            if not slice_obj:
                return jsonify({
                    "success": False,
                    "message": "Slice no encontrado"
                }), 404
            
            return jsonify({
                "success": True,
                "slice": {
                    "id": slice_obj.id,
                    "name": slice_obj.name,
                    "topology": slice_obj.topology,
                    "state": slice_obj.state.value,
                    "owner_id": slice_obj.owner_id,
                    "networks": [
                        {
                            "id": n.id,
                            "vlan_id": n.vlan_id,
                            "cidr": n.cidr,
                            "gateway": n.gateway,
                            "dhcp_enabled": n.dhcp_enabled
                        }
                        for n in slice_obj.networks
                    ],
                    "vms": [
                        {
                            "id": v.id,
                            "name": v.name,
                            "state": v.state.value,
                            "vcpu": v.vcpu,
                            "memory_mb": v.memory_mb,
                            "vnc_port": v.vnc_port
                        }
                        for v in slice_obj.vms
                    ]
                }
            }), 200
        
        @self.app.route('/api/v1/slices/<slice_id>', methods=['DELETE'])
        def delete_slice(slice_id):
            """Elimina un slice."""
            username = request.args.get('owner_id', 'admin')
            user = User(username, "", Role.ADMIN)
            
            success, message = self.slice_manager.delete_slice(user, slice_id)
            
            if success:
                return jsonify({
                    "success": True,
                    "message": message
                }), 200
            else:
                return jsonify({
                    "success": False,
                    "message": message
                }), 400
        
        @self.app.route('/api/v1/slices/<slice_id>/edit', methods=['PATCH'])
        def edit_slice(slice_id):
            """Edita un slice."""
            data = request.get_json()
            username = data.get('owner_id', 'admin')
            user = User(username, "", Role.ADMIN)
            
            operations = data.get('operations', [])
            
            success, message = self.slice_manager.edit_slice(user, slice_id, operations)
            
            if success:
                return jsonify({
                    "success": True,
                    "message": message
                }), 200
            else:
                return jsonify({
                    "success": False,
                    "message": message
                }), 400
        
        # Linux Cluster Operations (R2)
        @self.app.route('/api/v1/nodes/headnode/init', methods=['POST'])
        def init_headnode():
            """Inicializa un headnode."""
            data = request.get_json()
            
            host = data.get('host')
            interfaces = data.get('interfaces', [])
            
            success = self.linux_driver.init_headnode(host, interfaces)
            
            return jsonify({
                "success": success,
                "message": "Headnode inicializado" if success else "Error inicializando headnode"
            }), 200 if success else 500
        
        @self.app.route('/api/v1/nodes/compute/init', methods=['POST'])
        def init_compute():
            """Inicializa un nodo de cómputo."""
            data = request.get_json()
            
            host = data.get('host')
            interfaces = data.get('interfaces', [])
            
            success = self.linux_driver.init_compute_node(host, interfaces)
            
            return jsonify({
                "success": success,
                "message": "Compute node inicializado" if success else "Error inicializando"
            }), 200 if success else 500
        
        @self.app.route('/api/v1/networks/vlan', methods=['POST'])
        def create_vlan():
            """Crea una red VLAN."""
            data = request.get_json()
            
            headnode = data.get('headnode')
            vlan_id = data.get('vlan_id')
            cidr = data.get('cidr')
            dhcp_enabled = data.get('dhcp_enabled', False)
            dhcp_range = data.get('dhcp_range')
            
            success = self.linux_driver.create_vlan_network(
                headnode, vlan_id, cidr, dhcp_enabled, dhcp_range
            )
            
            return jsonify({
                "success": success,
                "message": f"VLAN {vlan_id} creada" if success else "Error creando VLAN"
            }), 200 if success else 500
        
        @self.app.route('/api/v1/networks/internet', methods=['POST'])
        def enable_internet():
            """Habilita acceso a internet para una VLAN."""
            data = request.get_json()
            
            headnode = data.get('headnode')
            vlan_id = data.get('vlan_id')
            cidr = data.get('cidr')
            
            success = self.linux_driver.enable_internet_access(
                headnode, vlan_id, cidr
            )
            
            return jsonify({
                "success": success,
                "message": "Acceso a internet habilitado" if success else "Error"
            }), 200 if success else 500
    
    def run(self, host: str = '0.0.0.0', port: int = 5000, debug: bool = False):
        """Inicia el servidor API."""
        logger.info(f"Iniciando Orchestrator API en {host}:{port}")
        self.app.run(host=host, port=port, debug=debug)


if __name__ == '__main__':
    api = OrchestratorAPI()
    api.run(debug=True)
