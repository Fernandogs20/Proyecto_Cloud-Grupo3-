import { useState } from 'react';
import DeployForm from '../components/DeployForm';
import SlicesList from '../components/SlicesList';
import TopologyViewer from '../components/TopologyViewer';

export default function SlicesPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedSlice, setSelectedSlice] = useState(null);

  const handleSliceDeployed = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="slices-page">
      <header className="page-header">
        <h1>PUCP Cloud - Gestión de Slices</h1>
        <p>Desplega, visualiza y gestiona slices de VMs en topología lineal o anillo</p>
      </header>

      <div className="page-content">
        <div className="left-column">
          <DeployForm onDeployed={handleSliceDeployed} />
        </div>

        <div className="right-column">
          <SlicesList refreshTrigger={refreshKey} />
        </div>

        <div className="full-width">
          <TopologyViewer slice={selectedSlice} />
        </div>
      </div>

      <style jsx>{`
        .slices-page {
          min-height: 100vh;
          background-color: #f5f5f5;
          padding: 20px;
        }

        .page-header {
          max-width: 1200px;
          margin: 0 auto 30px;
          text-align: center;
          color: #333;
        }

        .page-header h1 {
          margin: 0 0 10px 0;
          font-size: 28px;
        }

        .page-header p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }

        .page-content {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .left-column {
          grid-column: 1;
        }

        .right-column {
          grid-column: 2;
        }

        .full-width {
          grid-column: 1 / -1;
          margin-top: 10px;
        }

        @media (max-width: 1024px) {
          .page-content {
            grid-template-columns: 1fr;
          }

          .left-column {
            grid-column: 1;
          }

          .right-column {
            grid-column: 1;
          }

          .full-width {
            grid-column: 1;
          }
        }
      `}</style>
    </div>
  );
}
