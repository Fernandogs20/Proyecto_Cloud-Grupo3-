"""
Orquestador de Nube Privada - PUCP 2026-1
Sistema de provisioning automático de máquinas virtuales y topologías de red.

Módulos:
- models: Entidades de datos (Slice, VM, Network, etc.)
- drivers: Drivers para diferentes infraestructuras
  - linux_cluster: Driver para clusters Linux con OvS
- core: Componentes centrales
  - slice_manager: R1C - Gestor de slices
- storage: Persistencia de datos
- api: API REST
"""

__version__ = "0.1.0"
__author__ = "Grupo 3 - PUCP"

from .core.slice_manager import SliceManager
from .drivers.linux_cluster import LinuxClusterDriver
from .storage.storage import FileStorage
from .models.entities import Slice, VirtualMachine, Network, User, Role

__all__ = [
    'SliceManager',
    'LinuxClusterDriver',
    'FileStorage',
    'Slice',
    'VirtualMachine',
    'Network',
    'User',
    'Role'
]
