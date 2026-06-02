import React from 'react';

function CredentialsModal({ isOpen, slice, onClose }) {
  if (!isOpen || !slice) return null;

  return (
    <div className="modal active">
      <div className="modal-content">
        <div className="modal-header">
          <h3>🔑 Credenciales de Acceso</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
          <p>
            <strong>Slice:</strong> {slice.name}
          </p>
          <p>
            <strong>Token:</strong>{' '}
            <code style={{ color: '#667eea', fontFamily: 'monospace' }}>
              {slice.token}
            </code>
          </p>
          <p>
            <strong>Usuario:</strong> <code>admin</code>
          </p>
          <p>
            <strong>Topología:</strong> {slice.topology} ({slice.nodeCount} nodos)
          </p>
          <p>
            <strong>Nodos:</strong> {slice.nodeCount} × {slice.nodeCpu} CPU × {slice.nodeRam}GB RAM
          </p>
          <p>
            <strong>Infraestructura:</strong> {slice.infrastructure}
          </p>
          <p>
            <strong>Estado:</strong> <span className={`badge badge-${slice.status === 'active' ? 'success' : 'info'}`}>{slice.status}</span>
          </p>
        </div>

        <button className="btn btn-primary" onClick={onClose} style={{ marginTop: '20px' }}>
          Cerrar
        </button>
      </div>
    </div>
  );
}

export default CredentialsModal;
