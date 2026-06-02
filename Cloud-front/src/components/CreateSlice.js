import React, { useState } from 'react';
import Alert from './Alert';

function CreateSlice({ currentUser, onAddSlice }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    nodeCount: '3',
    nodeImage: '',
    nodeCpu: '2',
    nodeRam: '4',
    nodeStorage: '50',
    infrastructure: '',
    availabilityZone: 'zone-1'
  });

  const [selectedTopology, setSelectedTopology] = useState(null);
  const [alert, setAlert] = useState(null);

  const topologies = [
    { id: 'lineal', name: 'Lineal' },
    { id: 'malla', name: 'Malla' },
    { id: 'arbol', name: 'Árbol' },
    { id: 'anillo', name: 'Anillo' },
    { id: 'bus', name: 'Bus' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Validación especial para nodeCount
    if (name === 'nodeCount') {
      const num = parseInt(value);
      if (value === '') {
        setFormData({ ...formData, [name]: '' });
      } else if (isNaN(num) || num < 1 || num > 20) {
        // No actualiza si está fuera de rango
        return;
      } else {
        setFormData({ ...formData, [name]: value });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSelectTopology = (topologyId) => {
    setSelectedTopology(topologyId);
  };

  const handleCreateSlice = (e) => {
    e.preventDefault();
    setAlert(null);

    if (!formData.name.trim() || !selectedTopology || !formData.nodeImage || !formData.infrastructure) {
      setAlert({ type: 'error', message: 'Completa todos los campos obligatorios' });
      return;
    }

    const newSlice = {
      id: 'slice-' + Math.random().toString(36).substr(2, 9),
      name: formData.name.trim(),
      description: formData.description.trim(),
      topology: selectedTopology,
      nodeCount: parseInt(formData.nodeCount),
      nodeImage: formData.nodeImage,
      nodeCpu: parseInt(formData.nodeCpu),
      nodeRam: parseInt(formData.nodeRam),
      nodeStorage: parseInt(formData.nodeStorage),
      infrastructure: formData.infrastructure,
      availabilityZone: formData.availabilityZone,
      userId: currentUser.id,
      createdAt: new Date().toISOString(),
      status: 'creating',
      token: 'token_' + Math.random().toString(36).substr(2, 9)
    };

    onAddSlice(newSlice);
    setAlert({ type: 'success', message: 'Slice creado exitosamente. Desplegando...' });

    // Simular cambio de estado después de 2 segundos
    setTimeout(() => {
      newSlice.status = 'active';
      onAddSlice(newSlice);
    }, 2000);

    // Limpiar formulario
    setTimeout(() => {
      handleResetForm();
    }, 1500);
  };

  const handleResetForm = () => {
    setFormData({
      name: '',
      description: '',
      nodeCount: '3',
      nodeImage: '',
      nodeCpu: '2',
      nodeRam: '4',
      nodeStorage: '50',
      infrastructure: '',
      availabilityZone: 'zone-1'
    });
    setSelectedTopology(null);
    setAlert(null);
  };

  return (
    <>
      <h2>Crear Nuevo Slice</h2>

      {alert && <Alert type={alert.type} message={alert.message} />}

      {/* Información del Slice */}
      <div className="card">
        <h3>1. Información del Slice</h3>
        <div className="grid-2">
          <div className="form-group">
            <label htmlFor="name">Nombre del Slice *</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="ej: slice-prod-01"
              value={formData.name}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Descripción</label>
            <input
              type="text"
              id="description"
              name="description"
              placeholder="Descripción"
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>
        </div>
      </div>

      {/* Topología Predefinida */}
      <div className="card">
        <h3>2. Seleccionar Topología Predefinida *</h3>
        <div className="form-group">
          <label htmlFor="topology">Topología</label>
          <select
            id="topology"
            value={selectedTopology || ''}
            onChange={(e) => handleSelectTopology(e.target.value || null)}
          >
            <option value="">-- Selecciona una topología --</option>
            {topologies.map(topo => (
              <option key={topo.id} value={topo.id}>
                {topo.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Configurar Nodos */}
      <div className="card">
        <h3>3. Configurar Nodos</h3>
        <div className="grid-2">
          <div className="form-group">
            <label htmlFor="nodeCount">Número de Nodos * (1-20)</label>
            <input
              type="number"
              id="nodeCount"
              name="nodeCount"
              placeholder="3"
              min="1"
              max="20"
              value={formData.nodeCount}
              onChange={handleInputChange}
            />
            <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>Rango: 1 a 20 nodos</small>
          </div>
          <div className="form-group">
            <label htmlFor="nodeImage">Imagen Base *</label>
            <select
              id="nodeImage"
              name="nodeImage"
              value={formData.nodeImage}
              onChange={handleInputChange}
            >
              <option value="">Seleccionar...</option>
              <option value="ubuntu-20.04">Ubuntu 20.04 LTS</option>
              <option value="ubuntu-22.04">Ubuntu 22.04 LTS</option>
              <option value="centos-8">CentOS 8</option>
              <option value="debian-11">Debian 11</option>
            </select>
          </div>
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label htmlFor="nodeCpu">CPUs por Nodo *</label>
            <select
              id="nodeCpu"
              name="nodeCpu"
              value={formData.nodeCpu}
              onChange={handleInputChange}
            >
              <option value="1">1 CPU</option>
              <option value="2">2 CPUs</option>
              <option value="4">4 CPUs</option>
              <option value="8">8 CPUs</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="nodeRam">RAM por Nodo *</label>
            <select
              id="nodeRam"
              name="nodeRam"
              value={formData.nodeRam}
              onChange={handleInputChange}
            >
              <option value="2">2 GB</option>
              <option value="4">4 GB</option>
              <option value="8">8 GB</option>
              <option value="16">16 GB</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="nodeStorage">Almacenamiento por Nodo *</label>
          <select
            id="nodeStorage"
            name="nodeStorage"
            value={formData.nodeStorage}
            onChange={handleInputChange}
          >
            <option value="20">20 GB</option>
            <option value="50">50 GB</option>
            <option value="100">100 GB</option>
            <option value="200">200 GB</option>
          </select>
        </div>
      </div>

      {/* Infraestructura Destino */}
      <div className="card">
        <h3>4. Infraestructura Destino</h3>
        <div className="grid-2">
          <div className="form-group">
            <label htmlFor="infrastructure">Infraestructura *</label>
            <select
              id="infrastructure"
              name="infrastructure"
              value={formData.infrastructure}
              onChange={handleInputChange}
            >
              <option value="">Seleccionar...</option>
              <option value="linux-cluster">Linux Cluster</option>
              <option value="openstack">OpenStack</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="availabilityZone">Zona de Disponibilidad</label>
            <select
              id="availabilityZone"
              name="availabilityZone"
              value={formData.availabilityZone}
              onChange={handleInputChange}
            >
              <option value="zone-1">Zona 1</option>
              <option value="zone-2">Zona 2</option>
              <option value="zone-3">Zona 3</option>
            </select>
          </div>
        </div>
      </div>

      <div className="button-group">
        <button className="btn btn-primary" onClick={handleCreateSlice}>
          Crear Slice
        </button>
        <button className="btn btn-secondary" onClick={handleResetForm}>
          Limpiar
        </button>
      </div>
    </>
  );
}

export default CreateSlice;
