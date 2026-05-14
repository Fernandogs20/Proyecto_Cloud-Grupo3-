import React, { useState } from 'react';
import Alert from './Alert';
import Modal from './Modal';

function AdminDashboard({ currentUser, onLogout, slices }) {
  const [activeSection, setActiveSection] = useState('overview');
  const [alert, setAlert] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', role: '' });
  const [systemUsers, setSystemUsers] = useState([
    {
      id: 'admin-1',
      name: 'Administrador PUCP',
      email: 'admin@pucp.pe',
      role: 'Admin',
      sliceCount: '-',
      deletable: false
    },
    {
      id: 'prof-1',
      name: 'Dr. Carlos López',
      email: 'profesor@pucp.pe',
      role: 'Profesor',
      sliceCount: '-',
      deletable: false
    },
    {
      id: 'user-1',
      name: 'Juan Pérez',
      email: 'estudiante@pucp.pe',
      role: 'Estudiante',
      sliceCount: 'slices',
      deletable: true
    }
  ]);

  // Estadísticas generales
  const totalSlices = slices.length;
  const activeSlices = slices.filter(s => s.status === 'active').length;
  const totalNodos = slices.reduce((sum, s) => sum + s.nodeCount, 0);
  const totalCpus = slices.reduce((sum, s) => sum + (s.nodeCount * s.nodeCpu), 0);
  const totalRam = slices.reduce((sum, s) => sum + (s.nodeCount * s.nodeRam), 0);
  const uniqueStudents = [...new Set(slices.map(s => s.userId))].length;

  // Recursos del sistema (simulados)
  const linuxResources = {
    maxCpu: 32,
    maxRam: 128,
    maxStorage: 5000,
    usedCpu: Math.round(totalCpus * 0.75),
    usedRam: Math.round(totalRam * 0.75),
    usedStorage: Math.round((totalCpus + totalRam) * 25)
  };

  const openstackResources = {
    maxCpu: 32,
    maxRam: 128,
    maxStorage: 5000,
    usedCpu: Math.round(totalCpus * 0.6),
    usedRam: Math.round(totalRam * 0.6),
    usedStorage: Math.round((totalCpus + totalRam) * 18)
  };

  const handleSavePolicy = () => {
    setAlert({ type: 'success', message: 'Política actualizada correctamente' });
    setShowModal(false);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      role: user.role
    });
    setShowUserModal(true);
  };

  const handleSaveUser = (event) => {
    event.preventDefault();

    if (!editingUser) return;

    setSystemUsers(users => users.map(user => (
      user.id === editingUser.id
        ? { ...user, ...userForm }
        : user
    )));

    setAlert({ type: 'success', message: `Usuario ${userForm.name} actualizado correctamente` });
    setShowUserModal(false);
    setEditingUser(null);
  };

  const handleCloseUserModal = () => {
    setShowUserModal(false);
    setEditingUser(null);
  };

  const handleDeleteUser = (userId) => {
    setSystemUsers(users => users.filter(user => user.id !== userId));
    setAlert({ type: 'success', message: `Usuario ${userId} eliminado del sistema` });
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'Admin':
        return 'badge-danger';
      case 'Profesor':
        return 'badge-primary';
      case 'Estudiante':
        return 'badge-info';
      default:
        return 'badge-primary';
    }
  };

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>PUCP Cloud Orchestrator - Administrador</h1>
          <p>Panel de Control y Administración del Sistema</p>
        </div>
        <div className="user-info">
          <div><span>{currentUser.name}</span></div>
          <div style={{ fontSize: '0.85em', opacity: 0.8 }}>Administrador</div>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          Cerrar Sesión
        </button>
      </div>

      <div className="content">
        {/* SIDEBAR */}
        <div className="sidebar">
          <ul className="nav-menu">
            <li className="nav-item">
              <button
                className={`nav-btn ${activeSection === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveSection('overview')}
              >
                Vista General
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-btn ${activeSection === 'resources' ? 'active' : ''}`}
                onClick={() => setActiveSection('resources')}
              >
                Recursos
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-btn ${activeSection === 'users' ? 'active' : ''}`}
                onClick={() => setActiveSection('users')}
              >
                Usuarios
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-btn ${activeSection === 'policies' ? 'active' : ''}`}
                onClick={() => setActiveSection('policies')}
              >
                Políticas
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-btn ${activeSection === 'logs' ? 'active' : ''}`}
                onClick={() => setActiveSection('logs')}
              >
                Logs
              </button>
            </li>
          </ul>
        </div>

        {/* MAIN CONTENT */}
        <div className="main-content">
          {alert && <Alert type={alert.type} message={alert.message} />}

          {activeSection === 'overview' && (
            <>
              <h2>Vista General del Sistema</h2>

              <div className="grid-2">
                <div className="stat-box">
                  <p>Estudiantes Activos</p>
                  <h4>{uniqueStudents}</h4>
                </div>
                <div className="stat-box">
                  <p>Slices Totales</p>
                  <h4>{totalSlices}</h4>
                </div>
                <div className="stat-box">
                  <p>Nodos Desplegados</p>
                  <h4>{totalNodos}</h4>
                </div>
                <div className="stat-box">
                  <p>CPUs Utilizadas</p>
                  <h4>{totalCpus} / 64</h4>
                </div>
              </div>

              <h3 style={{ marginTop: '40px' }}>Salud del Sistema</h3>
              <div className="grid-2">
                <div className="card">
                  <h3>Linux Cluster</h3>
                  <div style={{ marginTop: '15px' }}>
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span>CPUs</span>
                        <span>{((linuxResources.usedCpu / linuxResources.maxCpu) * 100).toFixed(1)}%</span>
                      </div>
                      <div style={{ background: '#e0e0e0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ background: '#667eea', height: '100%', width: `${(linuxResources.usedCpu / linuxResources.maxCpu) * 100}%` }}></div>
                      </div>
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span>RAM</span>
                        <span>{((linuxResources.usedRam / linuxResources.maxRam) * 100).toFixed(1)}%</span>
                      </div>
                      <div style={{ background: '#e0e0e0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ background: '#764ba2', height: '100%', width: `${(linuxResources.usedRam / linuxResources.maxRam) * 100}%` }}></div>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.9em', color: '#666', marginTop: '10px' }}>
                      Estado: <span style={{ color: '#51cf66', fontWeight: '600' }}>✓ Operativo</span>
                    </p>
                  </div>
                </div>

                <div className="card">
                  <h3>OpenStack</h3>
                  <div style={{ marginTop: '15px' }}>
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span>CPUs</span>
                        <span>{((openstackResources.usedCpu / openstackResources.maxCpu) * 100).toFixed(1)}%</span>
                      </div>
                      <div style={{ background: '#e0e0e0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ background: '#667eea', height: '100%', width: `${(openstackResources.usedCpu / openstackResources.maxCpu) * 100}%` }}></div>
                      </div>
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span>RAM</span>
                        <span>{((openstackResources.usedRam / openstackResources.maxRam) * 100).toFixed(1)}%</span>
                      </div>
                      <div style={{ background: '#e0e0e0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ background: '#764ba2', height: '100%', width: `${(openstackResources.usedRam / openstackResources.maxRam) * 100}%` }}></div>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.9em', color: '#666', marginTop: '10px' }}>
                      Estado: <span style={{ color: '#51cf66', fontWeight: '600' }}>✓ Operativo</span>
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSection === 'resources' && (
            <>
              <h2>Gestión de Recursos</h2>

              <h3>Infraestructuras Disponibles</h3>
              <div className="grid-2">
                <div className="card">
                  <h3>Linux Cluster</h3>
                  <table style={{ margin: 0, width: '100%', marginTop: '15px' }}>
                    <tbody>
                      <tr>
                        <td><strong>CPUs Máx:</strong></td>
                        <td>{linuxResources.maxCpu}</td>
                      </tr>
                      <tr>
                        <td><strong>CPUs Usadas:</strong></td>
                        <td>{linuxResources.usedCpu}</td>
                      </tr>
                      <tr>
                        <td><strong>CPUs Disponibles:</strong></td>
                        <td style={{ color: '#51cf66', fontWeight: '600' }}>{linuxResources.maxCpu - linuxResources.usedCpu}</td>
                      </tr>
                      <tr>
                        <td><strong>RAM Máx:</strong></td>
                        <td>{linuxResources.maxRam} GB</td>
                      </tr>
                      <tr>
                        <td><strong>RAM Usada:</strong></td>
                        <td>{linuxResources.usedRam} GB</td>
                      </tr>
                      <tr>
                        <td><strong>RAM Disponible:</strong></td>
                        <td style={{ color: '#51cf66', fontWeight: '600' }}>{linuxResources.maxRam - linuxResources.usedRam} GB</td>
                      </tr>
                      <tr>
                        <td><strong>Almacenamiento:</strong></td>
                        <td>{linuxResources.usedStorage} / {linuxResources.maxStorage} GB</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="card">
                  <h3>OpenStack</h3>
                  <table style={{ margin: 0, width: '100%', marginTop: '15px' }}>
                    <tbody>
                      <tr>
                        <td><strong>CPUs Máx:</strong></td>
                        <td>{openstackResources.maxCpu}</td>
                      </tr>
                      <tr>
                        <td><strong>CPUs Usadas:</strong></td>
                        <td>{openstackResources.usedCpu}</td>
                      </tr>
                      <tr>
                        <td><strong>CPUs Disponibles:</strong></td>
                        <td style={{ color: '#51cf66', fontWeight: '600' }}>{openstackResources.maxCpu - openstackResources.usedCpu}</td>
                      </tr>
                      <tr>
                        <td><strong>RAM Máx:</strong></td>
                        <td>{openstackResources.maxRam} GB</td>
                      </tr>
                      <tr>
                        <td><strong>RAM Usada:</strong></td>
                        <td>{openstackResources.usedRam} GB</td>
                      </tr>
                      <tr>
                        <td><strong>RAM Disponible:</strong></td>
                        <td style={{ color: '#51cf66', fontWeight: '600' }}>{openstackResources.maxRam - openstackResources.usedRam} GB</td>
                      </tr>
                      <tr>
                        <td><strong>Almacenamiento:</strong></td>
                        <td>{openstackResources.usedStorage} / {openstackResources.maxStorage} GB</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <h3 style={{ marginTop: '40px' }}>Imágenes del Sistema</h3>
              <div className="card">
                <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                  <li><strong>Ubuntu 20.04 LTS</strong> - Versión: 20.04.5 - Estado: Activa</li>
                  <li><strong>Ubuntu 22.04 LTS</strong> - Versión: 22.04.1 - Estado: Activa</li>
                  <li><strong>CentOS 8</strong> - Versión: 8.5 - Estado: Activa</li>
                  <li><strong>Debian 11</strong> - Versión: 11.6 - Estado: Activa</li>
                </ul>
              </div>
            </>
          )}

          {activeSection === 'users' && (
            <>
              <h2>Gestión de Usuarios</h2>

              <h3>Usuarios del Sistema ({systemUsers.length})</h3>
              <div className="card">
                <table>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Rol</th>
                      <th>Slices</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {systemUsers.map(user => (
                      <tr key={user.id}>
                        <td><strong>{user.name}</strong></td>
                        <td>{user.email}</td>
                        <td><span className={`badge ${getRoleBadgeClass(user.role)}`}>{user.role}</span></td>
                        <td>{user.sliceCount === 'slices' ? slices.filter(s => s.userId === user.id).length : '-'}</td>
                        <td>
                          <button
                            className="btn btn-secondary btn-small"
                            onClick={() => handleEditUser(user)}
                          >
                            Editar
                          </button>
                          {user.deletable && (
                            <button className="btn btn-danger btn-small" onClick={() => handleDeleteUser(user.id)}>
                              Eliminar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeSection === 'policies' && (
            <>
              <h2>Políticas del Sistema</h2>

              <div className="grid-2">
                <div className="card">
                  <h3>Límites de Recursos</h3>
                  <div className="form-group">
                    <label>Máximo de Nodos por Slice</label>
                    <input type="number" defaultValue="20" />
                  </div>
                  <div className="form-group">
                    <label>Máximo de CPUs por Nodo</label>
                    <input type="number" defaultValue="8" />
                  </div>
                  <div className="form-group">
                    <label>Máximo de RAM por Nodo (GB)</label>
                    <input type="number" defaultValue="64" />
                  </div>
                  <button className="btn btn-primary" onClick={handleSavePolicy}>Guardar Cambios</button>
                </div>

                <div className="card">
                  <h3>Cuotas</h3>
                  <div className="form-group">
                    <label>Slices por Estudiante</label>
                    <input type="number" defaultValue="10" />
                  </div>
                  <div className="form-group">
                    <label>CPUs Máximas por Estudiante</label>
                    <input type="number" defaultValue="16" />
                  </div>
                  <div className="form-group">
                    <label>RAM Máxima por Estudiante (GB)</label>
                    <input type="number" defaultValue="32" />
                  </div>
                  <button className="btn btn-primary" onClick={handleSavePolicy}>Guardar Cambios</button>
                </div>
              </div>

              <div className="card" style={{ marginTop: '20px' }}>
                <h3>SLA y Disponibilidad</h3>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Disponibilidad Objetivo (%)</label>
                    <input type="number" defaultValue="99.99" step="0.01" />
                  </div>
                  <div className="form-group">
                    <label>Ventana de Mantenimiento</label>
                    <input type="time" defaultValue="02:00" />
                  </div>
                </div>
                <button className="btn btn-primary" onClick={handleSavePolicy}>Guardar Cambios</button>
              </div>
            </>
          )}

          {activeSection === 'logs' && (
            <>
              <h2>Logs del Sistema</h2>

              <div className="card">
                <table>
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Evento</th>
                      <th>Usuario</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>2024-04-27 14:35:22</td>
                      <td>Slice creado: slice-web-01</td>
                      <td>Juan Pérez</td>
                      <td><span className="badge badge-success">Exitoso</span></td>
                    </tr>
                    <tr>
                      <td>2024-04-27 14:30:15</td>
                      <td>Usuario registrado: maria@pucp.pe</td>
                      <td>Sistema</td>
                      <td><span className="badge badge-success">Exitoso</span></td>
                    </tr>
                    <tr>
                      <td>2024-04-27 14:25:43</td>
                      <td>Slice eliminado: slice-old-01</td>
                      <td>Juan Pérez</td>
                      <td><span className="badge badge-success">Exitoso</span></td>
                    </tr>
                    <tr>
                      <td>2024-04-27 14:20:01</td>
                      <td>Política actualizada</td>
                      <td>Administrador PUCP</td>
                      <td><span className="badge badge-success">Exitoso</span></td>
                    </tr>
                    <tr>
                      <td>2024-04-27 14:15:30</td>
                      <td>Inicio de sesión: profesor@pucp.pe</td>
                      <td>Dr. Carlos López</td>
                      <td><span className="badge badge-success">Exitoso</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      <Modal
        isOpen={showModal}
        title="Guardar Cambios"
        message="¿Deseas guardar los cambios de la política?"
        onConfirm={handleSavePolicy}
        onCancel={() => setShowModal(false)}
      />

      {showUserModal && editingUser && (
        <div className="modal active">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Editar Usuario</h3>
              <button className="modal-close" onClick={handleCloseUserModal}>×</button>
            </div>

            <form onSubmit={handleSaveUser}>
              <div className="form-group">
                <label>Nombre</label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(event) => setUserForm({ ...userForm, name: event.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(event) => setUserForm({ ...userForm, email: event.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Rol</label>
                <select
                  value={userForm.role}
                  onChange={(event) => setUserForm({ ...userForm, role: event.target.value })}
                >
                  <option value="Admin">Admin</option>
                  <option value="Profesor">Profesor</option>
                  <option value="Estudiante">Estudiante</option>
                </select>
              </div>

              <div className="button-group">
                <button type="submit" className="btn btn-primary">Guardar Cambios</button>
                <button type="button" className="btn btn-secondary" onClick={handleCloseUserModal}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
