import { useState, useEffect } from 'react';
import slicesAPI from '../services/slicesAPI';

export default function SlicesList({ refreshTrigger }) {
  const [slices, setSlices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSlices();
  }, [refreshTrigger]);

  useEffect(() => {
    const interval = setInterval(loadSlices, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadSlices = async () => {
    setError(null);
    try {
      const data = await slicesAPI.getSlices();
      setSlices(data.slices || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDestroy = async (sliceName) => {
    if (window.confirm(`¿Estás seguro de destruir ${sliceName}?`)) {
      try {
        await slicesAPI.destroySlice(sliceName);
        setSlices(prev => prev.filter(s => s.name !== sliceName));
      } catch (err) {
        alert(`✗ Error: ${err.message}`);
      }
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await loadSlices();
  };

  if (error && slices.length === 0) {
    return (
      <div className="slices-list">
        <div className="alert alert-error">{error}</div>
        <button onClick={handleRefresh} className="btn btn-secondary">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="slices-list">
      <div className="list-header">
        <h3>Slices Activos ({slices.length})</h3>
        <button onClick={handleRefresh} disabled={loading} className="btn btn-secondary">
          {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {slices.length === 0 ? (
        <div className="empty-state">
          <p>No hay slices activos</p>
        </div>
      ) : (
        <div className="slices-container">
          {slices.map(slice => (
            <div key={slice.name} className="slice-card">
              <div className="card-header">
                <div>
                  <h4>{slice.name}</h4>
                  <div className="slice-meta">
                    <span className="badge" data-type={slice.topology}>
                      {slice.topology.toUpperCase()}
                    </span>
                    <span className="meta-item">VLAN {slice.VLAN_ID}</span>
                    <span className="meta-item">{slice.NUM_VMS} VMs</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDestroy(slice.name)}
                  className="btn btn-danger btn-sm"
                >
                  Destruir
                </button>
              </div>

              <div className="card-body">
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Red:</span>
                    <span className="value">{slice.VLAN_CIDR}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Gateway:</span>
                    <span className="value">{slice.GW_IP}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Puerto VNC:</span>
                    <span className="value">{slice.START_VNC_PORT}</span>
                  </div>
                </div>

                <div className="vms-section">
                  <span className="label">VMs:</span>
                  <div className="vms-list">
                    {slice.VMS?.split(' ').map(vm => (
                      <span key={vm} className="vm-tag">{vm}</span>
                    ))}
                  </div>
                </div>

                <div className="timestamp">
                  Creado: {slice.CREATED_AT || 'N/A'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .slices-list {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          background: #f9f9f9;
        }

        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .list-header h3 {
          margin: 0;
          color: #333;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #999;
        }

        .slices-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .slice-card {
          background: white;
          border: 1px solid #ddd;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          transition: box-shadow 0.3s;
        }

        .slice-card:hover {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          padding: 16px;
          border-bottom: 1px solid #eee;
          background: #fafafa;
        }

        .card-header h4 {
          margin: 0 0 8px 0;
          color: #333;
        }

        .slice-meta {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }

        .badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 3px;
          font-size: 12px;
          font-weight: 600;
          color: white;
        }

        .badge[data-type="linear"] {
          background-color: #0066cc;
        }

        .badge[data-type="ring"] {
          background-color: #cc6600;
        }

        .meta-item {
          font-size: 13px;
          color: #666;
        }

        .card-body {
          padding: 16px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .label {
          font-size: 12px;
          font-weight: 600;
          color: #999;
          text-transform: uppercase;
        }

        .value {
          font-size: 14px;
          color: #333;
          font-family: monospace;
        }

        .vms-section {
          margin-bottom: 12px;
        }

        .vms-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;
        }

        .vm-tag {
          display: inline-block;
          padding: 4px 8px;
          background-color: #e0e7ff;
          color: #0066cc;
          border-radius: 3px;
          font-size: 12px;
          font-family: monospace;
        }

        .timestamp {
          font-size: 12px;
          color: #999;
          border-top: 1px solid #eee;
          padding-top: 8px;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-secondary {
          background-color: #666;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: #555;
        }

        .btn-danger {
          background-color: #cc0000;
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          background-color: #aa0000;
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 12px;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .alert {
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .alert-error {
          background-color: #fee;
          color: #c00;
          border: 1px solid #fcc;
        }
      `}</style>
    </div>
  );
}
