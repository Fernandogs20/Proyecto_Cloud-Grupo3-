import React from 'react';
import StudentDashboard from './StudentDashboard';
import ProfessorDashboard from './ProfessorDashboard';
import AdminDashboard from './AdminDashboard';

function Dashboard({ currentUser, onLogout, slices, onAddSlice, onUpdateSlice, onDeleteSlice }) {
  // Renderizar el dashboard correcto según el rol del usuario
  if (currentUser.role === 'student') {
    return (
      <StudentDashboard
        currentUser={currentUser}
        onLogout={onLogout}
        slices={slices}
        onAddSlice={onAddSlice}
        onUpdateSlice={onUpdateSlice}
        onDeleteSlice={onDeleteSlice}
      />
    );
  } else if (currentUser.role === 'professor') {
    return (
      <ProfessorDashboard
        currentUser={currentUser}
        onLogout={onLogout}
        slices={slices}
      />
    );
  } else if (currentUser.role === 'admin') {
    return (
      <AdminDashboard
        currentUser={currentUser}
        onLogout={onLogout}
        slices={slices}
      />
    );
  }

  // Fallback en caso de rol desconocido
  return <div className="container"><div style={{ padding: '40px', textAlign: 'center' }}>Rol no reconocido</div></div>;
}

export default Dashboard;
