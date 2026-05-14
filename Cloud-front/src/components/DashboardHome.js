import React from 'react';

function DashboardHome({ userSlices }) {
  const activeSlices = userSlices.filter(s => s.status === 'active').length;
  const totalNodes = userSlices.reduce((sum, s) => sum + s.nodeCount, 0);
  const totalCpus = userSlices.reduce((sum, s) => sum + (s.nodeCount * s.nodeCpu), 0);
  const totalRam = userSlices.reduce((sum, s) => sum + (s.nodeCount * s.nodeRam), 0);

  return (
    <>
      <h2>Dashboard del Sistema</h2>
      
      <div className="grid-2">
        <div className="stat-box">
          <p>Slices Activos</p>
          <h4>{activeSlices}</h4>
        </div>
        <div className="stat-box">
          <p>Nodos Totales</p>
          <h4>{totalNodes}</h4>
        </div>
        <div className="stat-box">
          <p>CPUs Utilizadas</p>
          <h4>{totalCpus} / 32</h4>
        </div>
        <div className="stat-box">
          <p>RAM Utilizada</p>
          <h4>{totalRam} / 128 GB</h4>
        </div>
      </div>

      <h3 style={{ marginTop: '40px' }}>Slices Recientes</h3>
      
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Topología</th>
            <th>Nodos</th>
            <th>Estado</th>
            <th>Creado</th>
          </tr>
        </thead>
        <tbody>
          {userSlices.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', color: '#999' }}>
                Sin slices
              </td>
            </tr>
          ) : (
            userSlices.slice(-5).reverse().map(slice => (
              <tr key={slice.id}>
                <td><strong>{slice.name}</strong></td>
                <td>{slice.topology}</td>
                <td>{slice.nodeCount}</td>
                <td>
                  <span className={`badge badge-${slice.status === 'active' ? 'success' : 'info'}`}>
                    {slice.status}
                  </span>
                </td>
                <td>{new Date(slice.createdAt).toLocaleDateString('es-PE')}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  );
}

export default DashboardHome;
