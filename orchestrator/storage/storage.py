"""
Sistema de almacenamiento para persistencia de datos.
"""

import json
import os
import logging
from typing import Optional, Dict, List, Any
from datetime import datetime
import threading

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FileStorage:
    """Sistema de almacenamiento basado en archivos JSON."""
    
    def __init__(self, base_path: str = "/var/lib/orchestrator"):
        self.base_path = base_path
        self.lock = threading.RLock()
        self._ensure_directories()
    
    def _ensure_directories(self):
        """Crea los directorios necesarios."""
        try:
            os.makedirs(os.path.join(self.base_path, "slices"), exist_ok=True)
            os.makedirs(os.path.join(self.base_path, "users"), exist_ok=True)
            os.makedirs(os.path.join(self.base_path, "nodes"), exist_ok=True)
            os.makedirs(os.path.join(self.base_path, "logs"), exist_ok=True)
        except Exception as e:
            logger.error(f"Error creando directorios: {str(e)}")
    
    def save_slice(self, slice_id: str, slice_data: Dict[str, Any]) -> bool:
        """Guarda un slice en disco."""
        try:
            with self.lock:
                file_path = os.path.join(self.base_path, "slices", f"{slice_id}.json")
                with open(file_path, 'w') as f:
                    json.dump(slice_data, f, indent=2, default=str)
                logger.info(f"Slice {slice_id} guardado")
                return True
        except Exception as e:
            logger.error(f"Error guardando slice: {str(e)}")
            return False
    
    def load_slice(self, slice_id: str) -> Optional[Dict[str, Any]]:
        """Carga un slice desde disco."""
        try:
            with self.lock:
                file_path = os.path.join(self.base_path, "slices", f"{slice_id}.json")
                if not os.path.exists(file_path):
                    return None
                
                with open(file_path, 'r') as f:
                    return json.load(f)
        except Exception as e:
            logger.error(f"Error cargando slice: {str(e)}")
            return None
    
    def delete_slice(self, slice_id: str) -> bool:
        """Elimina un slice."""
        try:
            with self.lock:
                file_path = os.path.join(self.base_path, "slices", f"{slice_id}.json")
                if os.path.exists(file_path):
                    os.remove(file_path)
                    logger.info(f"Slice {slice_id} eliminado")
                    return True
                return False
        except Exception as e:
            logger.error(f"Error eliminando slice: {str(e)}")
            return False
    
    def list_slices(self) -> List[str]:
        """Lista todos los slices."""
        try:
            slices_dir = os.path.join(self.base_path, "slices")
            if not os.path.exists(slices_dir):
                return []
            
            return [f[:-5] for f in os.listdir(slices_dir) if f.endswith('.json')]
        except Exception as e:
            logger.error(f"Error listando slices: {str(e)}")
            return []
    
    def save_user(self, username: str, user_data: Dict[str, Any]) -> bool:
        """Guarda un usuario."""
        try:
            with self.lock:
                file_path = os.path.join(self.base_path, "users", f"{username}.json")
                with open(file_path, 'w') as f:
                    json.dump(user_data, f, indent=2, default=str)
                logger.info(f"Usuario {username} guardado")
                return True
        except Exception as e:
            logger.error(f"Error guardando usuario: {str(e)}")
            return False
    
    def load_user(self, username: str) -> Optional[Dict[str, Any]]:
        """Carga un usuario."""
        try:
            with self.lock:
                file_path = os.path.join(self.base_path, "users", f"{username}.json")
                if not os.path.exists(file_path):
                    return None
                
                with open(file_path, 'r') as f:
                    return json.load(f)
        except Exception as e:
            logger.error(f"Error cargando usuario: {str(e)}")
            return None
    
    def save_compute_node(self, node_id: str, node_data: Dict[str, Any]) -> bool:
        """Guarda información de un nodo de cómputo."""
        try:
            with self.lock:
                file_path = os.path.join(self.base_path, "nodes", f"{node_id}.json")
                with open(file_path, 'w') as f:
                    json.dump(node_data, f, indent=2, default=str)
                logger.info(f"Nodo {node_id} guardado")
                return True
        except Exception as e:
            logger.error(f"Error guardando nodo: {str(e)}")
            return False
    
    def load_compute_node(self, node_id: str) -> Optional[Dict[str, Any]]:
        """Carga información de un nodo."""
        try:
            with self.lock:
                file_path = os.path.join(self.base_path, "nodes", f"{node_id}.json")
                if not os.path.exists(file_path):
                    return None
                
                with open(file_path, 'r') as f:
                    return json.load(f)
        except Exception as e:
            logger.error(f"Error cargando nodo: {str(e)}")
            return None
    
    def list_compute_nodes(self) -> List[str]:
        """Lista todos los nodos."""
        try:
            nodes_dir = os.path.join(self.base_path, "nodes")
            if not os.path.exists(nodes_dir):
                return []
            
            return [f[:-5] for f in os.listdir(nodes_dir) if f.endswith('.json')]
        except Exception as e:
            logger.error(f"Error listando nodos: {str(e)}")
            return []
    
    def log_operation(self, operation: str, details: Dict[str, Any]) -> bool:
        """Registra una operación en logs."""
        try:
            with self.lock:
                timestamp = datetime.now().isoformat()
                log_entry = {
                    "timestamp": timestamp,
                    "operation": operation,
                    "details": details
                }
                
                log_file = os.path.join(self.base_path, "logs", "operations.jsonl")
                with open(log_file, 'a') as f:
                    f.write(json.dumps(log_entry, default=str) + '\n')
                
                return True
        except Exception as e:
            logger.error(f"Error registrando operación: {str(e)}")
            return False
