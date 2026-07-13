#!/bin/bash

# Mensajes locales que leerá FastAPI
echo "[SCRIPT] Iniciando proceso de despliegue..."
echo "[SCRIPT] Conectando por SSH al servidor 10.0.10.2..."

# Conexión SSH y creación del archivo en el servidor remoto
ssh -o StrictHostKeyChecking=no ubuntu@10.0.10.2 '
    echo "==================================================" > /home/ubuntu/exito_topologia.txt
    echo "¡TOPOLOGÍA CREADA CON ÉXITO POR FASTAPI + KEYCLOAK!" >> /home/ubuntu/exito_topologia.txt
    echo "Fecha y hora de ejecución: $(date)" >> /home/ubuntu/exito_topologia.txt
    echo "==================================================" >> /home/ubuntu/exito_topologia.txt
    
    echo "¡Genial! Se ha creado el archivo /home/ubuntu/exito_topologia.txt en el servidor remoto."
'

echo "[SCRIPT] Proceso finalizado correctamente."