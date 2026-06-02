import React, { useState } from 'react';
import Alert from './Alert';
import ProfessorProfile from './ProfessorProfile';
import TopologyVisualization from './TopologyVisualization';

function ProfessorDashboard({ currentUser, onLogout, slices }) {
  const [activeSection, setActiveSection] = useState('monitoring');
  const [searchStudent, setSearchStudent] = useState('');
  const [alert, setAlert] = useState(null);

  // Obtener todos los slices (de todos los estudiantes)
  const allSlices = slices;
  
  // Filtrar por búsqueda
  const filteredSlices = allSlices.filter(s => 
    s.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
    s.description.toLowerCase().includes(searchStudent.toLowerCase())
  );

  // Estadísticas generales
  const totalSlices = allSlices.length;
  const activeSlices = allSlices.filter(s => s.status === 'active').length;
  const totalNodos = allSlices.reduce((sum, s) => sum + s.nodeCount, 0);
  const totalCpus = allSlices.reduce((sum, s) => sum + (s.nodeCount * s.nodeCpu), 0);

  // Estudiantes únicos
  const uniqueStudents = [...new Set(allSlices.map(s => s.userId))].length;

  const handleCreateTemplate = () => {
    setAlert({ type: 'success', message: 'Plantilla creada exitosamente' });
  };

  const handlePauseSlice = (sliceId, sliceName) => {
    setAlert({ type: 'success', message: `Slice "${sliceName}" pausado correctamente` });
  };

  const handleResumeSlice = (sliceId, sliceName) => {
    setAlert({ type: 'success', message: `Slice "${sliceName}" reanudado correctamente` });
  };

  const handleDeleteSlice = (sliceId, sliceName) => {
    setAlert({ type: 'success', message: `Slice "${sliceName}" eliminado del sistema` });
  };

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>PUCP Cloud Orchestrator - Profesor</h1>
          <p>Monitoreo y Supervisión de Estudiantes</p>
        </div>
        <div className="user-info">
          <div><span>{currentUser.name}</span></div>
          <div style={{ fontSize: '0.85em', opacity: 0.8 }}>Profesor</div>
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
                className={`nav-btn ${activeSection === 'monitoring' ? 'active' : ''}`}
                onClick={() => setActiveSection('monitoring')}
              >
                Monitoreo
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-btn ${activeSection === 'slices' ? 'active' : ''}`}
                onClick={() => setActiveSection('slices')}
              >
                Slices Activos
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-btn ${activeSection === 'templates' ? 'active' : ''}`}
                onClick={() => setActiveSection('templates')}
              >
                Plantillas
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-btn ${activeSection === 'reports' ? 'active' : ''}`}
                onClick={() => setActiveSection('reports')}
              >
                Reportes
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-btn ${activeSection === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveSection('profile')}
              >
                Mi Perfil
              </button>
            </li>
          </ul>
        </div>

        {/* MAIN CONTENT */}
        <div className="main-content">
          {activeSection === 'monitoring' && (
            <>
              <h2>Monitoreo de Estudiantes</h2>
              
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
                  <p>Slices Activos</p>
                  <h4>{activeSlices}</h4>
                </div>
                <div className="stat-box">
                  <p>Nodos Desplegados</p>
                  <h4>{totalNodos}</h4>
                </div>
              </div>

              {alert && <Alert type={alert.type} message={alert.message} />}

              <h3 style={{ marginTop: '40px' }}>Distribución por Infraestructura</h3>
              <div className="grid-2">
                <div className="card">
                  <h3>Linux Cluster</h3>
                  <p><strong>Slices:</strong> {allSlices.filter(s => s.infrastructure === 'linux-cluster').length}</p>
                  <p><strong>Nodos:</strong> {allSlices.filter(s => s.infrastructure === 'linux-cluster').reduce((sum, s) => sum + s.nodeCount, 0)}</p>
                  <p><strong>CPUs Utilizadas:</strong> {allSlices.filter(s => s.infrastructure === 'linux-cluster').reduce((sum, s) => sum + (s.nodeCount * s.nodeCpu), 0)}</p>
                </div>
                <div className="card">
                  <h3>OpenStack</h3>
                  <p><strong>Slices:</strong> {allSlices.filter(s => s.infrastructure === 'openstack').length}</p>
                  <p><strong>Nodos:</strong> {allSlices.filter(s => s.infrastructure === 'openstack').reduce((sum, s) => sum + s.nodeCount, 0)}</p>
                  <p><strong>CPUs Utilizadas:</strong> {allSlices.filter(s => s.infrastructure === 'openstack').reduce((sum, s) => sum + (s.nodeCount * s.nodeCpu), 0)}</p>
                </div>
              </div>
            </>
          )}

          {activeSection === 'slices' && (
            <>
              <h2>🖧 Slices Activos en el Sistema</h2>

              <div className="form-group">
                <input
                  type="text"
                  placeholder="🔍 Buscar por nombre o descripción..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                />
              </div>

              {filteredSlices.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  <p>No hay slices que coincidan con la búsqueda</p>
                </div>
              ) : (
                <div>
                  {filteredSlices.map(slice => (
                    <div key={slice.id} className="card" style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                        <div>
                          <h3>{slice.name}</h3>
                          <p style={{ color: '#666', margin: '5px 0' }}>{slice.description}</p>
                        </div>
                        <span className={`badge badge-${slice.status === 'active' ? 'success' : 'info'}`}>
                          {slice.status === 'active' ? '▶️ Activo' : '⏳ Creando'}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginTop: '15px', color: '#666', marginBottom: '15px' }}>
                        <div><strong>🔗 Topología:</strong> <span style={{ textTransform: 'capitalize' }}>{slice.topology}</span></div>
                        <div><strong>Nodos:</strong> {slice.nodeCount}</div>
                        <div><strong>CPU:</strong> {slice.nodeCount * slice.nodeCpu} vCPU</div>
                        <div><strong>RAM:</strong> {slice.nodeCount * slice.nodeRam} GB</div>
                        <div><strong>Imagen:</strong> {slice.nodeImage}</div>
                        <div><strong>Infraestructura:</strong> {slice.infrastructure}</div>
                      </div>

                      {/* Visualización de Topología */}
                      <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                        <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#333' }}>
                          📊 Visualización de Topología ({slice.nodeCount} nodos):
                        </p>
                        <TopologyVisualization 
                          topology={slice.topology} 
                          nodeCount={slice.nodeCount}
                          width={500}
                          height={280}
                        />
                      </div>

                      {/* Controles del Profesor */}
                      <div style={{ 
                        display: 'flex', 
                        gap: '10px',
                        paddingTop: '15px',
                        borderTop: '1px solid #e0e0e0',
                        flexWrap: 'wrap'
                      }}>
                        <button 
                          className="btn btn-primary btn-small"
                          onClick={() => handlePauseSlice(slice.id, slice.name)}
                          title="Pausar la ejecución del slice"
                        >
                          ⏸️ Pausar
                        </button>
                        <button 
                          className="btn btn-primary btn-small"
                          onClick={() => handleResumeSlice(slice.id, slice.name)}
                          title="Reanudar la ejecución del slice"
                        >
                          ▶️ Reanudar
                        </button>
                        <button 
                          className="btn btn-secondary btn-small"
                          onClick={() => {
                            // Modal para ver credenciales
                            setAlert({ type: 'info', message: 'Token: ' + slice.token });
                          }}
                          title="Ver credenciales de acceso"
                        >
                          🔑 Credenciales
                        </button>
                        <button 
                          className="btn btn-danger btn-small"
                          onClick={() => handleDeleteSlice(slice.id, slice.name)}
                          title="Eliminar el slice (no se puede deshacer)"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeSection === 'templates' && (
            <>
              <h2>📋 Plantillas de Slices</h2>
              <p style={{ color: '#666', marginBottom: '20px' }}>Crea plantillas predefinidas para que los estudiantes puedan desplegar rápidamente</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <div className="card">
                  <h3>🌐 Plantilla Web</h3>
                  <p style={{ color: '#666' }}>Servidor web + BD de ejemplo</p>
                  <ul style={{ paddingLeft: '20px', color: '#666', fontSize: '0.9em' }}>
                    <li>Topología: Lineal</li>
                    <li>Nodos: 2</li>
                    <li>CPU: 2 por nodo</li>
                    <li>RAM: 4 GB por nodo</li>
                  </ul>
                  <button className="btn btn-primary btn-small" onClick={handleCreateTemplate} style={{ marginTop: '10px', width: '100%' }}>
                    Usar Plantilla
                  </button>
                </div>

                <div className="card">
                  <h3>🗄️ Plantilla BD</h3>
                  <p style={{ color: '#666' }}>Base de datos distribu ida</p>
                  <ul style={{ paddingLeft: '20px', color: '#666', fontSize: '0.9em' }}>
                    <li>Topología: Malla</li>
                    <li>Nodos: 3</li>
                    <li>CPU: 4 por nodo</li>
                    <li>RAM: 8 GB por nodo</li>
                  </ul>
                  <button className="btn btn-primary btn-small" onClick={handleCreateTemplate} style={{ marginTop: '10px', width: '100%' }}>
                    Usar Plantilla
                  </button>
                </div>

                <div className="card">
                  <h3>Plantilla Cluster</h3>
                  <p style={{ color: '#666' }}>Cluster Kubernetes</p>
                  <ul style={{ paddingLeft: '20px', color: '#666', fontSize: '0.9em' }}>
                    <li>Topología: Árbol</li>
                    <li>Nodos: 5</li>
                    <li>CPU: 4 por nodo</li>
                    <li>RAM: 16 GB por nodo</li>
                  </ul>
                  <button className="btn btn-primary btn-small" onClick={handleCreateTemplate} style={{ marginTop: '10px', width: '100%' }}>
                    Usar Plantilla
                  </button>
                </div>
              </div>
            </>
          )}

          {activeSection === 'reports' && (
            <>
              <h2>📊 Reportes</h2>

              <div className="grid-2">
                <div className="card">
                  <h3>📈 Resumen General</h3>
                  <table style={{ margin: 0, width: '100%' }}>
                    <tbody>
                      <tr>
                        <td><strong>Total Estudiantes:</strong></td>
                        <td>{uniqueStudents}</td>
                      </tr>
                      <tr>
                        <td><strong>Total Slices:</strong></td>
                        <td>{totalSlices}</td>
                      </tr>
                      <tr>
                        <td><strong>Slices Activos:</strong></td>
                        <td>{activeSlices}</td>
                      </tr>
                      <tr>
                        <td><strong>Tasa Actividad:</strong></td>
                        <td>{totalSlices > 0 ? Math.round((activeSlices / totalSlices) * 100) : 0}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="card">
                  <h3>🏗️ Topologías Usadas</h3>
                  <table style={{ margin: 0, width: '100%' }}>
                    <tbody>
                      <tr>
                        <td><strong>Lineal:</strong></td>
                        <td>{allSlices.filter(s => s.topology === 'lineal').length}</td>
                      </tr>
                      <tr>
                        <td><strong>Malla:</strong></td>
                        <td>{allSlices.filter(s => s.topology === 'malla').length}</td>
                      </tr>
                      <tr>
                        <td><strong>Árbol:</strong></td>
                        <td>{allSlices.filter(s => s.topology === 'arbol').length}</td>
                      </tr>
                      <tr>
                        <td><strong>Anillo:</strong></td>
                        <td>{allSlices.filter(s => s.topology === 'anillo').length}</td>
                      </tr>
                      <tr>
                        <td><strong>Bus:</strong></td>
                        <td>{allSlices.filter(s => s.topology === 'bus').length}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ marginTop: '20px', padding: '15px', background: '#d1ecf1', borderRadius: '5px', color: '#0c5460' }}>
                <p><strong>Nota:</strong> Los reportes se generan en tiempo real basados en la actividad actual del sistema.</p>
              </div>
            </>
          )}

          {activeSection === 'profile' && (
            <ProfessorProfile currentUser={currentUser} onLogout={onLogout} />
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfessorDashboard;
