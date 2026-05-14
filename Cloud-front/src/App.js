import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [slices, setSlices] = useState([]);

  // Cargar datos del localStorage al montar
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    const storedSlices = localStorage.getItem('slices');
    
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    
    if (storedSlices) {
      setSlices(JSON.parse(storedSlices));
    }
  }, []);

  // Guardar slices en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('slices', JSON.stringify(slices));
  }, [slices]);

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const handleAddSlice = (newSlice) => {
    setSlices([...slices, newSlice]);
  };

  const handleUpdateSlice = (updatedSlice) => {
    setSlices(slices.map(s => s.id === updatedSlice.id ? updatedSlice : s));
  };

  const handleDeleteSlice = (sliceId) => {
    setSlices(slices.filter(s => s.id !== sliceId));
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Dashboard
      currentUser={currentUser}
      onLogout={handleLogout}
      slices={slices}
      onAddSlice={handleAddSlice}
      onUpdateSlice={handleUpdateSlice}
      onDeleteSlice={handleDeleteSlice}
    />
  );
}

export default App;
