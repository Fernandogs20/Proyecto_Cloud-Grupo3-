#!/bin/bash
# headnode_init.sh
# Parámetros: InterfacesAConectar (puede ser una o varias, separadas por espacio)
# Uso: ./headnode_init.sh ens4 ens5 ...
set -e
INTERFACES=("$@")
if [ ${#INTERFACES[@]} -eq 0 ]; then
 echo "Error: debe especificar al menos una interfaz como parámetro."
 echo "Uso: $0 <interfaz1> [interfaz2] ..."
 exit 1
fi
BRIDGE="br-int"
# 1. Crear bridge OvS si no existe
if ! sudo ovs-vsctl br-exists "$BRIDGE"; then
 echo "Creando bridge OvS: $BRIDGE"
 sudo ovs-vsctl add-br "$BRIDGE"
else
 echo "El bridge $BRIDGE ya existe, se omite la creación."
fi
# 2. Conectar interfaces al OvS
for IFACE in "${INTERFACES[@]}"; do
 if sudo ovs-vsctl list-ports "$BRIDGE" | grep -q "^${IFACE}$"; then
 echo "La interfaz $IFACE ya está conectada al bridge $BRIDGE."
 else
 echo "Conectando interfaz $IFACE al bridge $BRIDGE"
 sudo ovs-vsctl add-port "$BRIDGE" "$IFACE"
 fi
done
# 3. Activar IPv4 Forwarding
echo "Activando IPv4 Forwarding..."
sudo sysctl -w net.ipv4.ip_forward=1
# Persistir el cambio
if ! grep -q "^net.ipv4.ip_forward=1" /etc/sysctl.conf; then
 echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf
fi
# 4. Cambiar default action del chain FORWARD de ACCEPT a DROP
echo "Configurando política por defecto FORWARD -> DROP en iptables..."
sudo iptables -P FORWARD DROP
echo "headnode_init.sh completado exitosamente."
