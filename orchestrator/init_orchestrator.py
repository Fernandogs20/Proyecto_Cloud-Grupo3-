#!/usr/bin/env python3
"""
Script de inicialización del Orchestrator.
Configura los directorios, usuarios por defecto y pruebas básicas.
"""

import os
import sys
import logging
from pathlib import Path

# Añadir el directorio padre al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from orchestrator.storage.storage import FileStorage
from orchestrator.models.entities import User, Role
from orchestrator.utils.helpers import hash_password

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def setup_orchestrator(storage_path: str = "/var/lib/orchestrator"):
    """Configura el orchestrator."""
    
    logger.info("=" * 60)
    logger.info("INICIALIZANDO ORCHESTRATOR - PUCP Grupo 3")
    logger.info("=" * 60)
    
    # 1. Crear almacenamiento
    logger.info(f"\n1. Creando almacenamiento en {storage_path}...")
    storage = FileStorage(storage_path)
    logger.info("   ✓ Almacenamiento creado")
    
    # 2. Crear usuarios por defecto
    logger.info("\n2. Creando usuarios por defecto...")
    
    users = [
        {
            "username": "admin",
            "password": "admin123",
            "role": Role.ADMIN,
            "email": "admin@orchestrator.local"
        },
        {
            "username": "user1",
            "password": "user123",
            "role": Role.USER,
            "email": "user1@orchestrator.local"
        },
        {
            "username": "viewer",
            "password": "viewer123",
            "role": Role.VIEWER,
            "email": "viewer@orchestrator.local"
        }
    ]
    
    for user_data in users:
        user = User(
            username=user_data["username"],
            password_hash=hash_password(user_data["password"]),
            role=user_data["role"],
            email=user_data["email"]
        )
        
        user_dict = {
            "username": user.username,
            "password_hash": user.password_hash,
            "role": user.role.value,
            "email": user.email,
            "created_at": user.created_at.isoformat()
        }
        
        storage.save_user(user.username, user_dict)
        logger.info(f"   ✓ Usuario {user.username} ({user.role.value}) creado")
    
    # 3. Crear configuración por defecto
    logger.info("\n3. Creando configuración...")
    
    config = {
        "orchestrator": {
            "version": "0.1.0",
            "storage_path": storage_path
        },
        "linux_cluster": {
            "vm_directory": "/var/lib/vms",
            "base_image_url": "https://download.cirros-cloud.net/0.6.2/cirros-0.6.2-x86_64-disk.img",
            "default_vcpu": 1,
            "default_memory_mb": 512,
            "default_disk_gb": 5
        },
        "ssh": {
            "username": "ubuntu",
            "key_path": "/home/ubuntu/.ssh/id_rsa",
            "timeout": 30
        },
        "api": {
            "host": "0.0.0.0",
            "port": 5000,
            "debug": False
        }
    }
    
    config_file = os.path.join(storage_path, "config.json")
    import json
    with open(config_file, 'w') as f:
        json.dump(config, f, indent=2)
    
    logger.info(f"   ✓ Configuración guardada en {config_file}")
    
    # 4. Prueba básica
    logger.info("\n4. Ejecutando pruebas básicas...")
    
    # Verificar que podemos cargar un usuario
    loaded_user = storage.load_user("admin")
    if loaded_user:
        logger.info("   ✓ Carga de usuarios funciona")
    else:
        logger.error("   ✗ Error cargando usuarios")
        return False
    
    # Listar usuarios
    users_list = storage.list_slices()
    logger.info(f"   ✓ Sistema de almacenamiento funcional")
    
    # 5. Resumen
    logger.info("\n" + "=" * 60)
    logger.info("ORCHESTRATOR INICIALIZADO CORRECTAMENTE")
    logger.info("=" * 60)
    
    logger.info("\nCredenciales de prueba:")
    logger.info("  Admin   : admin / admin123")
    logger.info("  User    : user1 / user123")
    logger.info("  Viewer  : viewer / viewer123")
    
    logger.info(f"\nCarpeta de almacenamiento: {storage_path}")
    logger.info(f"Archivo de configuración: {config_file}")
    
    logger.info("\nPróximos pasos:")
    logger.info("  1. Configurar nodos de infraestructura")
    logger.info("  2. Iniciar servidor API: python -m orchestrator.api")
    logger.info("  3. Ejecutar ejemplos: python orchestrator/examples.py")
    
    return True


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Inicializar Orchestrator'
    )
    parser.add_argument(
        '--storage-path',
        default='/var/lib/orchestrator',
        help='Ruta del almacenamiento (default: /var/lib/orchestrator)'
    )
    parser.add_argument(
        '--reset',
        action='store_true',
        help='Reinicializar eliminando datos existentes'
    )
    
    args = parser.parse_args()
    
    # Limpiar si es necesario
    if args.reset:
        import shutil
        if os.path.exists(args.storage_path):
            logger.warning(f"Eliminando {args.storage_path}...")
            shutil.rmtree(args.storage_path)
    
    # Inicializar
    success = setup_orchestrator(args.storage_path)
    
    sys.exit(0 if success else 1)
