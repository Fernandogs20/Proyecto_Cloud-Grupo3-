import React, { useState } from 'react';
import Alert from './Alert';

function StudentProfile({ currentUser, onLogout }) {
  const [alert, setAlert] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [userData, setUserData] = useState({
    name: currentUser.name,
    email: currentUser.email,
    phone: '(+51) 987 654 321',
    university: 'PUCP - Pontificia Universidad Católica del Perú',
    program: 'Ingeniería de Sistemas',
    year: '4to Año',
    joinDate: '15 de Enero, 2024'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const handleSaveChanges = () => {
    setAlert({ type: 'success', message: 'Perfil actualizado correctamente' });
    setEditMode(false);
    setTimeout(() => setAlert(null), 3000);
  };

  return (
    <>
      <h2>Mi Perfil</h2>

      {alert && <Alert type={alert.type} message={alert.message} />}

      {/* Información Principal */}
      <div className="card">
        <h3>Información Personal</h3>
        {!editMode && (
          <div>
            <table style={{ width: '100%' }}>
              <tbody>
                <tr>
                  <td style={{ fontWeight: '600', width: '30%' }}>Nombre Completo:</td>
                  <td>{userData.name}</td>
                </tr>
                <tr style={{ background: '#f9f9f9' }}>
                  <td style={{ fontWeight: '600' }}>Correo Electrónico:</td>
                  <td>{userData.email}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Teléfono:</td>
                  <td>{userData.phone}</td>
                </tr>
                <tr style={{ background: '#f9f9f9' }}>
                  <td style={{ fontWeight: '600' }}>Universidad:</td>
                  <td>{userData.university}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Programa Académico:</td>
                  <td>{userData.program}</td>
                </tr>
                <tr style={{ background: '#f9f9f9' }}>
                  <td style={{ fontWeight: '600' }}>Año:</td>
                  <td>{userData.year}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Miembro desde:</td>
                  <td>{userData.joinDate}</td>
                </tr>
                <tr style={{ background: '#f9f9f9' }}>
                  <td style={{ fontWeight: '600' }}>Token de Acceso:</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.9em' }}>{currentUser.token.substr(0, 30)}...</td>
                </tr>
              </tbody>
            </table>

            <button
              className="btn btn-primary"
              onClick={() => setEditMode(true)}
              style={{ marginTop: '20px' }}
            >
              Editar Información
            </button>
          </div>
        )}

        {editMode && (
          <div>
            <div className="grid-2">
              <div className="form-group">
                <label htmlFor="name">Nombre Completo</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={userData.name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Correo Electrónico</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={userData.email}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label htmlFor="phone">Teléfono</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={userData.phone}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="program">Programa Académico</label>
                <input
                  type="text"
                  id="program"
                  name="program"
                  value={userData.program}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="button-group" style={{ marginTop: '20px' }}>
              <button className="btn btn-primary" onClick={handleSaveChanges}>
                Guardar Cambios
              </button>
              <button className="btn btn-secondary" onClick={() => setEditMode(false)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Estadísticas de Cuenta */}
      <div className="grid-2" style={{ marginTop: '20px' }}>
        <div className="stat-box">
          <p>Estado de Cuenta</p>
          <h4 style={{ color: '#51cf66' }}>Activo</h4>
        </div>
        <div className="stat-box">
          <p>Rol</p>
          <h4>Estudiante</h4>
        </div>
      </div>

      {/* Seguridad */}
      <div className="card" style={{ marginTop: '20px' }}>
        <h3>Seguridad</h3>
        <div style={{ marginBottom: '15px' }}>
          <p style={{ color: '#666' }}>Gestiona la seguridad de tu cuenta</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary">Cambiar Contraseña</button>
          <button className="btn btn-secondary">Configurar Autenticación 2FA</button>
        </div>
      </div>

      {/* Cerrar Sesión */}
      <div className="card" style={{ marginTop: '20px', background: '#fff5f5' }}>
        <h3 style={{ color: '#c92a2a' }}>Cerrar Sesión</h3>
        <button
          className="btn btn-secondary"
          onClick={onLogout}
          style={{ background: '#c92a2a', color: 'white', border: 'none', marginTop: '10px' }}
        >
          Cerrar Sesión
        </button>
      </div>
    </>
  );
}

export default StudentProfile;
