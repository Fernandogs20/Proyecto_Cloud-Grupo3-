import React, { useState } from 'react';
import Modal from './Modal';
import CredentialsModal from './CredentialsModal';
import TopologyVisualization from './TopologyVisualization';

function SlicesList({ slices, onDelete, onUpdate }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [selectedSlice, setSelectedSlice] = useState(null);

  const handleDeleteClick = (slice) => {
    setSelectedSlice(slice);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (selectedSlice) {
      onDelete(selectedSlice.id);
      setShowDeleteModal(false);
      setSelectedSlice(null);
    }
  };

  const handleShowCredentials = (slice) => {
    setSelectedSlice(slice);
    setShowCredentialsModal(true);
  };

  return (
    <>
      <h2>Mis Slices de Máquinas Virtuales</h2>

      {slices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          <p>No hay slices creados. ¡Crea tu primer slice!</p>
        </div>
      ) : (
        <div>
          {slices.map(slice => (
            <div key={slice.id} className="card" style={{ marginBottom: '20px' }}>
              <h3>{slice.name}</h3>
              <p style={{ color: '#666' }}>{slice.description || 'Sin descripción'}</p>

              <div style={{ margin: '10px 0', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>🔗 {slice.topology}</span>
                <span className="badge badge-info">
                  {slice.nodeCount} nodos
                </span>
                <span
                  className={`badge ${
                    slice.status === 'active' ? 'badge-success' : 'badge-info'
                  }`}
                >
                  {slice.status === 'active' ? '▶️ Activo' : '⏳ Creando'}
                </span>
              </div>

              <div style={{ margin: '15px 0', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#333' }}>Visualización de Topología ({slice.nodeCount} nodos):</p>
                <TopologyVisualization 
                  topology={slice.topology} 
                  nodeCount={slice.nodeCount}
                  width={400}
                  height={250}
                />
              </div>

              <div style={{ marginTop: '15px', fontSize: '0.9em', color: '#666' }}>
                <p>
                  <strong>Recursos:</strong> {slice.nodeCount} nodos × {slice.nodeCpu} CPU ×{' '}
                  {slice.nodeRam}GB RAM = <strong>{slice.nodeCount * slice.nodeCpu} CPUs, {slice.nodeCount * slice.nodeRam}GB RAM</strong>
                </p>
                <p>
                  <strong>Imagen:</strong> {slice.nodeImage}
                </p>
                <p>
                  <strong>Almacenamiento:</strong> {slice.nodeCount} × {slice.nodeStorage}GB
                </p>
                <p>
                  <strong>Infraestructura:</strong> {slice.infrastructure} ({slice.availabilityZone})
                </p>
                <p>
                  <strong>Creado:</strong> {new Date(slice.createdAt).toLocaleDateString('es-PE')}
                </p>
              </div>

              <div
                style={{
                  marginTop: '15px',
                  paddingTop: '15px',
                  borderTop: '1px solid #e0e0e0',
                  display: 'flex',
                  gap: '10px'
                }}
              >
                <button
                  className="btn btn-primary btn-small"
                  onClick={() => handleShowCredentials(slice)}
                  style={{ flex: 1 }}
                >
                  🔑 Credenciales
                </button>
                <button
                  className="btn btn-danger btn-small"
                  onClick={() => handleDeleteClick(slice)}
                  style={{ flex: 1 }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showDeleteModal}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que deseas eliminar el slice "${selectedSlice?.name}"? Esta acción no se puede deshacer.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedSlice(null);
        }}
        isDanger={true}
      />

      {selectedSlice && (
        <CredentialsModal
          isOpen={showCredentialsModal}
          slice={selectedSlice}
          onClose={() => {
            setShowCredentialsModal(false);
            setSelectedSlice(null);
          }}
        />
      )}
    </>
  );
}

export default SlicesList;
