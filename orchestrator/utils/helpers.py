"""
Utilidades y funciones auxiliares.
"""

import logging
import subprocess
from typing import Tuple
import hashlib

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def hash_password(password: str) -> str:
    """Genera hash SHA-256 de una contraseña."""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, password_hash: str) -> bool:
    """Verifica una contraseña contra su hash."""
    return hash_password(password) == password_hash


def check_command_available(command: str) -> bool:
    """Verifica si un comando está disponible en el sistema."""
    try:
        subprocess.run(['which', command], capture_output=True, check=True)
        return True
    except subprocess.CalledProcessError:
        return False


def get_ip_from_cidr(cidr: str) -> str:
    """Extrae la IP de una notación CIDR."""
    return cidr.split('/')[0]


def get_network_from_cidr(cidr: str) -> Tuple[str, int]:
    """Extrae red y prefixlen de CIDR."""
    parts = cidr.split('/')
    if len(parts) == 2:
        return parts[0], int(parts[1])
    return parts[0], 24


def validate_cidr(cidr: str) -> bool:
    """Valida que una dirección sea válida CIDR."""
    try:
        parts = cidr.split('/')
        if len(parts) != 2:
            return False
        
        ip_parts = parts[0].split('.')
        if len(ip_parts) != 4:
            return False
        
        for part in ip_parts:
            num = int(part)
            if num < 0 or num > 255:
                return False
        
        prefix = int(parts[1])
        if prefix < 0 or prefix > 32:
            return False
        
        return True
    except:
        return False


def calculate_gateway(cidr: str) -> str:
    """Calcula la dirección de gateway para una red CIDR."""
    ip = cidr.split('/')[0]
    parts = ip.split('.')
    parts[3] = '1'
    return '.'.join(parts)


def calculate_dhcp_start(cidr: str) -> str:
    """Calcula la primera IP disponible para DHCP."""
    ip = cidr.split('/')[0]
    parts = ip.split('.')
    parts[3] = '10'
    return '.'.join(parts)


def calculate_dhcp_end(cidr: str) -> str:
    """Calcula la última IP disponible para DHCP."""
    ip = cidr.split('/')[0]
    parts = ip.split('.')
    parts[3] = '254'
    return '.'.join(parts)
