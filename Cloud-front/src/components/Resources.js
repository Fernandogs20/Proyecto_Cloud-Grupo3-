import React from 'react';

function Resources() {
  return (
    <>
      <h2>Recursos del Sistema</h2>

      <div className="grid-2">
        <div className="card">
          <h3>Linux Cluster</h3>
          <table style={{ margin: 0 }}>
            <tbody>
              <tr>
                <td>CPUs:</td>
                <td>
                  <strong>24 / 32</strong>
                </td>
              </tr>
              <tr>
                <td>RAM:</td>
                <td>
                  <strong>64 / 128 GB</strong>
                </td>
              </tr>
              <tr>
                <td>Almacenamiento:</td>
                <td>
                  <strong>2.5 / 5 TB</strong>
                </td>
              </tr>
            </tbody>
          </table>
          <div style={{ marginTop: '15px', fontSize: '0.9em', color: '#666' }}>
            <p>
              <strong>Disponibilidad:</strong> 99.99%
            </p>
            <p>
              <strong>Nodos Activos:</strong> 4/4
            </p>
            <p>
              <strong>Zona:</strong> Zona 1 - Lima
            </p>
          </div>
        </div>

        <div className="card">
          <h3>OpenStack</h3>
          <table style={{ margin: 0 }}>
            <tbody>
              <tr>
                <td>CPUs:</td>
                <td>
                  <strong>20 / 32</strong>
                </td>
              </tr>
              <tr>
                <td>RAM:</td>
                <td>
                  <strong>48 / 128 GB</strong>
                </td>
              </tr>
              <tr>
                <td>Almacenamiento:</td>
                <td>
                  <strong>1.8 / 5 TB</strong>
                </td>
              </tr>
            </tbody>
          </table>
          <div style={{ marginTop: '15px', fontSize: '0.9em', color: '#666' }}>
            <p>
              <strong>Disponibilidad:</strong> 99.95%
            </p>
            <p>
              <strong>Nodos Activos:</strong> 6/6
            </p>
            <p>
              <strong>Zona:</strong> Zona 2 - Lima
            </p>
          </div>
        </div>
      </div>

      <h3 style={{ marginTop: '40px' }}>Información de Imágenes Disponibles</h3>

      <div style={{ marginTop: '20px' }}>
        <div className="card">
          <h4 style={{ marginTop: 0 }}>Linux</h4>
          <ul style={{ paddingLeft: '20px', color: '#666' }}>
            <li>Ubuntu 20.04 LTS (últimas actualizaciones)</li>
            <li>Ubuntu 22.04 LTS (últimas actualizaciones)</li>
            <li>CentOS 8 (soporte extendido)</li>
            <li>Debian 11 (estable)</li>
          </ul>
        </div>

        <div className="card">
          <h4 style={{ marginTop: 0 }}>Información Técnica</h4>
          <ul style={{ paddingLeft: '20px', color: '#666' }}>
            <li>Máximo 20 nodos por slice</li>
            <li>Máximo 8 CPUs por nodo</li>
            <li>Máximo 64 GB RAM por nodo</li>
            <li>Máximo 1 TB almacenamiento por nodo</li>
            <li>Network: Gigabit Ethernet</li>
            <li>Backup automático diario</li>
          </ul>
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#d1ecf1', borderRadius: '5px', color: '#0c5460' }}>
        <p>
          <strong>Nota:</strong> Los recursos mostrados son aproximados y pueden variar según la carga
          actual del sistema. Para slices de gran escala, contacta a tu administrador.
        </p>
      </div>
    </>
  );
}

export default Resources;
