import React from 'react';

function Modal({ isOpen, title, message, onConfirm, onCancel, isDanger = false }) {
  if (!isOpen) return null;

  return (
    <div className="modal active">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <p style={{ marginBottom: '20px', color: '#666' }}>{message}</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            style={{ flex: 1 }}
          >
            {isDanger ? 'Eliminar' : 'Confirmar'}
          </button>
          <button className="btn btn-secondary" onClick={onCancel} style={{ flex: 1 }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export default Modal;
