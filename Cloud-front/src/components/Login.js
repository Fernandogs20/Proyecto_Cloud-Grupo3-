import React, { useState } from 'react';
import Alert from './Alert';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [alert, setAlert] = useState(null);
  const [isRegister, setIsRegister] = useState(false);
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    password2: '',
    role: 'student'
  });

  const roles = [
    { id: 'student', name: 'Estudiante', desc: 'Crear y gestionar mis slices' },
    { id: 'professor', name: 'Profesor', desc: 'Monitorear estudiantes' },
    { id: 'admin', name: 'Administrador', desc: 'Gestionar sistema' }
  ];

  const demoAccounts = {
    student: { email: 'estudiante@pucp.pe', password: 'password123', name: 'Juan Pérez' },
    professor: { email: 'profesor@pucp.pe', password: 'password123', name: 'Dr. Carlos López' },
    admin: { email: 'admin@pucp.pe', password: 'password123', name: 'Administrador PUCP' }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setAlert(null);

    if (!email || !password || !selectedRole) {
      setAlert({ type: 'error', message: 'Por favor completa todos los campos y selecciona un rol' });
      return;
    }

    // Demo credentials
    const demoAccount = demoAccounts[selectedRole];
    if (email === demoAccount.email && password === demoAccount.password) {
      onLogin({
        id: 'user-' + Math.random().toString(36).substr(2, 9),
        name: demoAccount.name,
        email: email,
        role: selectedRole,
        token: 'token_' + Math.random().toString(36).substr(2, 9)
      });
    } else {
      setAlert({ type: 'error', message: 'Correo o contraseña incorrectos para este rol' });
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setAlert(null);

    const { name, email: regEmail, password: regPassword, password2, role } = registerData;

    if (!name || !regEmail || !regPassword || !password2 || !role) {
      setAlert({ type: 'error', message: 'Por favor completa todos los campos' });
      return;
    }

    if (regPassword.length < 6) {
      setAlert({ type: 'error', message: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    if (regPassword !== password2) {
      setAlert({ type: 'error', message: 'Las contraseñas no coinciden' });
      return;
    }

    onLogin({
      id: 'user-' + Math.random().toString(36).substr(2, 9),
      name: name,
      email: regEmail,
      role: role,
      token: 'token_' + Math.random().toString(36).substr(2, 9)
    });
  };

  return (
    <div className="container" style={{ maxWidth: '600px', margin: '50px auto', height: 'auto' }}>
      <div className="header" style={{ flexDirection: 'column', textAlign: 'center' }}>
        <h1>PUCP Cloud Orchestrator</h1>
        <p>Sistema de Gestión de Slices de Máquinas Virtuales</p>
      </div>

      <div style={{ padding: '40px' }}>
        {!isRegister ? (
          <>
            <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>Iniciar Sesión</h2>

            {alert && <Alert type={alert.type} message={alert.message} />}

            <h3 style={{ marginBottom: '15px', fontSize: '1.1em' }}>Selecciona tu Rol</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '20px' }}>
              {roles.map(role => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  style={{
                    padding: '15px',
                    border: `2px solid ${selectedRole === role.id ? '#667eea' : '#e0e0e0'}`,
                    borderRadius: '8px',
                    background: selectedRole === role.id ? '#f0f3ff' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontWeight: '600', color: '#333' }}>{role.name}</div>
                  <div style={{ fontSize: '0.8em', color: '#666', marginTop: '5px' }}>{role.desc}</div>
                </button>
              ))}
            </div>

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="email">Correo Electrónico</label>
                <input
                  type="email"
                  id="email"
                  placeholder="usuario@pucp.pe"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Contraseña</label>
                <input
                  type="password"
                  id="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary">
                Iniciar Sesión
              </button>
            </form>

            {selectedRole && (
              <p style={{ textAlign: 'center', marginTop: '20px', color: '#666', fontSize: '0.9em' }}>
                Demo: <strong>{demoAccounts[selectedRole].email}</strong> / <strong>password123</strong>
              </p>
            )}

            <p style={{ textAlign: 'center', marginTop: '15px' }}>
              ¿No tienes cuenta?{' '}
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#667eea',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '1em'
                }}
                onClick={() => setIsRegister(true)}
              >
                Regístrate aquí
              </button>
            </p>
          </>
        ) : (
          <>
            <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>Crear Nueva Cuenta</h2>

            {alert && <Alert type={alert.type} message={alert.message} />}

            <h3 style={{ marginBottom: '15px', fontSize: '1.1em' }}>Selecciona tu Rol</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '20px' }}>
              {roles.map(role => (
                <button
                  key={role.id}
                  onClick={() => setRegisterData({ ...registerData, role: role.id })}
                  style={{
                    padding: '15px',
                    border: `2px solid ${registerData.role === role.id ? '#667eea' : '#e0e0e0'}`,
                    borderRadius: '8px',
                    background: registerData.role === role.id ? '#f0f3ff' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontWeight: '600', color: '#333' }}>{role.name}</div>
                </button>
              ))}
            </div>

            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label htmlFor="name">👤 Nombre Completo</label>
                <input
                  type="text"
                  id="name"
                  placeholder="Tu nombre"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="regEmail">📧 Correo Electrónico</label>
                <input
                  type="email"
                  id="regEmail"
                  placeholder="tu@pucp.pe"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
              <label htmlFor="regPassword">Contraseña</label>
                <input
                  type="password"
                  id="regPassword"
                  placeholder="Mínimo 6 caracteres"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                />
              </div>

              <div className="form-group">
              <label htmlFor="regPassword2">Confirmar Contraseña</label>
                <input
                  type="password"
                  id="regPassword2"
                  placeholder="Confirma tu contraseña"
                  value={registerData.password2}
                  onChange={(e) => setRegisterData({ ...registerData, password2: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary">
                Registrarse
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '15px' }}>
              ¿Ya tienes cuenta?{' '}
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#667eea',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '1em'
                }}
                onClick={() => setIsRegister(false)}
              >
                Inicia sesión aquí
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;
