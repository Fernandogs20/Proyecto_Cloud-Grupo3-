import { useEffect, useRef } from 'react';

export default function TopologyViewer({ slice }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!slice || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const vms = slice.VMS?.split(' ') || [];
    if (vms.length === 0) return;

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 60;

    // Dibujar topología
    if (slice.topology === 'linear') {
      drawLinear(ctx, vms, centerX, centerY, radius);
    } else {
      drawRing(ctx, vms, centerX, centerY, radius);
    }
  }, [slice]);

  const drawLinear = (ctx, vms, centerX, centerY, radius) => {
    const spacing = 80;
    const startX = centerX - ((vms.length - 1) * spacing) / 2;

    vms.forEach((vm, i) => {
      const x = startX + i * spacing;
      const y = centerY;

      // Dibujar líneas de conexión
      if (i < vms.length - 1) {
        ctx.strokeStyle = '#0066cc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 30, y);
        ctx.lineTo(x + spacing - 30, y);
        ctx.stroke();
      }

      // Dibujar nodo VM
      drawNode(ctx, x, y, vm, i);
    });

    // Dibujar gateway
    drawGateway(ctx, centerX, centerY - 100, 'Gateway');
  };

  const drawRing = (ctx, vms, centerX, centerY, radius) => {
    const angleStep = (2 * Math.PI) / vms.length;

    // Dibujar conexiones (anillo)
    ctx.strokeStyle = '#cc6600';
    ctx.lineWidth = 2;
    vms.forEach((vm, i) => {
      const angle1 = i * angleStep - Math.PI / 2;
      const x1 = centerX + radius * Math.cos(angle1);
      const y1 = centerY + radius * Math.sin(angle1);

      const nextAngle = ((i + 1) % vms.length) * angleStep - Math.PI / 2;
      const x2 = centerX + radius * Math.cos(nextAngle);
      const y2 = centerY + radius * Math.sin(nextAngle);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    // Dibujar nodos
    vms.forEach((vm, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      drawNode(ctx, x, y, vm, i);
    });

    // Dibujar gateway en el centro
    drawGateway(ctx, centerX, centerY, 'Gateway');
  };

  const drawNode = (ctx, x, y, label, index) => {
    const size = 25;
    ctx.fillStyle = '#0066cc';
    ctx.beginPath();
    ctx.arc(x, y, size, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = 'white';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`VM${index + 1}`, x, y);

    // Etiqueta debajo
    ctx.fillStyle = '#333';
    ctx.font = '11px Arial';
    ctx.fillText(label, x, y + 40);
  };

  const drawGateway = (ctx, x, y, label) => {
    const size = 20;
    ctx.fillStyle = '#00aa00';
    ctx.fillRect(x - size, y - size, size * 2, size * 2);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GW', x, y);

    ctx.fillStyle = '#00aa00';
    ctx.font = '10px Arial';
    ctx.fillText(label, x, y + 35);
  };

  if (!slice) {
    return (
      <div className="topology-viewer empty">
        <p>Selecciona un slice para ver la topología</p>
      </div>
    );
  }

  return (
    <div className="topology-viewer">
      <h4>Topología: {slice.topology.toUpperCase()}</h4>
      <canvas ref={canvasRef} width={400} height={300} />

      <style jsx>{`
        .topology-viewer {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          background: #f9f9f9;
          text-align: center;
        }

        .topology-viewer h4 {
          margin: 0 0 16px 0;
          color: #333;
        }

        .topology-viewer canvas {
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          display: block;
          margin: 0 auto;
        }

        .topology-viewer.empty {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 300px;
          color: #999;
        }
      `}</style>
    </div>
  );
}
