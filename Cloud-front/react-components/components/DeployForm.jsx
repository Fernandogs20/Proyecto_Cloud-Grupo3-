import { useState } from 'react';
import slicesAPI from '../services/slicesAPI';

export default function DeployForm({ onDeployed }) {
  const [formData, setFormData] = useState({
    sliceName: '',
    numVMs: 2,
    vlanId: 100,
    vlanCIDR: '192.168.100.0/24',
    startVncPort: 5900,
    topology: 'linear'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['numVMs', 'vlanId', 'startVncPort'].includes(name) ? parseInt(value) : value
    }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { sliceName, numVMs, vlanId, vlanCIDR, startVncPort, topology } = formData;

      if (!sliceName.trim()) throw new Error('Nombre del slice es requerido');
      if (topology === 'linear' && numVMs < 2) throw new Error('Mínimo 2 VMs para topología lineal');
      if (topology === 'ring' && numVMs < 3) throw new Error('Mínimo 3 VMs para topología anillo');
      if (startVncPort < 5900 || startVncPort > 6000) throw new Error('Puerto VNC debe estar entre 5900-6000');

      let result;
      if (topology === 'linear') {
        result = await slicesAPI.deployLinear(sliceName, numVMs, vlanId, vlanCIDR, startVncPort);
      } else {
        result = await slicesAPI.deployRing(sliceName, numVMs, vlanId, vlanCIDR, startVncPort);
      }

      setSuccess(`✓ Slice ${sliceName} desplegado exitosamente`);
      onDeployed?.(result);

      setFormData({
        sliceName: '',
        numVMs: 2,
        vlanId: 100,
        vlanCIDR: '192.168.100.0/24',
        startVncPort: 5900,
        topology: 'linear'
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="deploy-form">
      <h3>Desplegar Nuevo Slice</h3>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="sliceName">Nombre del Slice</label>
          <input
            id="sliceName"
            type="text"
            name="sliceName"
            value={formData.sliceName}
            onChange={handleChange}
            placeholder="Ej: production_1"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="topology">Topología</label>
          <select
            id="topology"
            name="topology"
            value={formData.topology}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="linear">Lineal (VM1 -- VM2 -- VM3 ...)</option>
            <option value="ring">Anillo (VM1 -- VM2 -- ... -- VMN -- VM1)</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="numVMs">Número de VMs</label>
          <input
            id="numVMs"
            type="number"
            name="numVMs"
            value={formData.numVMs}
            onChange={handleChange}
            min={formData.topology === 'ring' ? 3 : 2}
            max={20}
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="vlanId">VLAN ID</label>
          <input
            id="vlanId"
            type="number"
            name="vlanId"
            value={formData.vlanId}
            onChange={handleChange}
            min="1"
            max="4095"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="vlanCIDR">Red (CIDR)</label>
          <input
            id="vlanCIDR"
            type="text"
            name="vlanCIDR"
            value={formData.vlanCIDR}
            onChange={handleChange}
            placeholder="192.168.100.0/24"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="startVncPort">Puerto VNC Inicial</label>
          <input
            id="startVncPort"
            type="number"
            name="startVncPort"
            value={formData.startVncPort}
            onChange={handleChange}
            min="5900"
            max="6000"
            disabled={loading}
            required
          />
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? 'Desplegando...' : 'Desplegar'}
        </button>
      </form>

      <style jsx>{`
        .deploy-form {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          background: #f9f9f9;
        }

        .deploy-form h3 {
          margin-top: 0;
          color: #333;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 600;
          color: #555;
          font-size: 14px;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
        }

        .form-group input:disabled,
        .form-group select:disabled {
          background-color: #e9ecef;
          cursor: not-allowed;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #0066cc;
          box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
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

        .alert-success {
          background-color: #efe;
          color: #0a0;
          border: 1px solid #cfc;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-primary {
          background-color: #0066cc;
          color: white;
          width: 100%;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #0052a3;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
