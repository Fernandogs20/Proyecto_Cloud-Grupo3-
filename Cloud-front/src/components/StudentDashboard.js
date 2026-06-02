import React, { useState } from 'react';
import DashboardHome from './DashboardHome';
import CreateSlice from './CreateSlice';
import SlicesList from './SlicesList';
import Resources from './Resources';
import StudentProfile from './StudentProfile';

function StudentDashboard({ currentUser, onLogout, slices, onAddSlice, onUpdateSlice, onDeleteSlice }) {
  const [activeSection, setActiveSection] = useState('dashboard');

  const userSlices = slices.filter(s => s.userId === currentUser.id);

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>PUCP Cloud Orchestrator - Estudiante</h1>
          <p>Gestión de tus Slices de Máquinas Virtuales</p>
        </div>
        <div className="user-info">
          <div><span>{currentUser.name}</span></div>
          <div style={{ fontSize: '0.85em', opacity: 0.8 }}>
            Token: <span style={{ fontFamily: 'monospace' }}>
              {currentUser.token.substr(0, 20)}...
            </span>
          </div>
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
                className={`nav-btn ${activeSection === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveSection('dashboard')}
              >
                Dashboard
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-btn ${activeSection === 'slices' ? 'active' : ''}`}
                onClick={() => setActiveSection('slices')}
              >
                Mis Slices
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-btn ${activeSection === 'create' ? 'active' : ''}`}
                onClick={() => setActiveSection('create')}
              >
                Crear Slice
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
          {activeSection === 'dashboard' && (
            <DashboardHome userSlices={userSlices} />
          )}

          {activeSection === 'slices' && (
            <SlicesList
              slices={userSlices}
              onUpdate={onUpdateSlice}
              onDelete={onDeleteSlice}
            />
          )}

          {activeSection === 'create' && (
            <CreateSlice
              currentUser={currentUser}
              onAddSlice={onAddSlice}
            />
          )}

          {activeSection === 'resources' && (
            <Resources />
          )}

          {activeSection === 'profile' && (
            <StudentProfile currentUser={currentUser} onLogout={onLogout} />
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
