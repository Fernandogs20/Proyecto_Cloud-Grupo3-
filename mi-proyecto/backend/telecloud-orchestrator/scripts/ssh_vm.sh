#!/bin/bash

if [ "$#" -ne 1 ]; then
    echo "Uso: $0 <IP_VM>"
    echo "Ejemplo: $0 192.168.122.186"
    exit 1
fi

VM_IP="$1"

ssh -tt \
  -J ubuntu@10.0.10.3 \
  -o ConnectTimeout=10 \
  -o StrictHostKeyChecking=no \
  -o UserKnownHostsFile=/dev/null \
  -o PreferredAuthentications=password \
  -o PubkeyAuthentication=no \
  -o KexAlgorithms=diffie-hellman-group14-sha1 \
  -o HostKeyAlgorithms=ssh-rsa \
  -o Ciphers=aes128-ctr \
  -o MACs=hmac-sha1 \
  cirros@"$VM_IP"
