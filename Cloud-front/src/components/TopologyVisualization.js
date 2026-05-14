import React from 'react';

function TopologyVisualization({ topology, nodeCount, width = 300, height = 200 }) {
  const padding = 20;
  const nodeRadius = 20;

  // Función para dibujar topología LINEAL
  const drawLineal = () => {
    const nodes = [];
    const spacing = (width - 2 * padding - 2 * nodeRadius) / (nodeCount - 1 || 1);

    // Líneas conectoras
    const lines = [];
    for (let i = 0; i < nodeCount - 1; i++) {
      const x1 = padding + nodeRadius + i * spacing;
      const y1 = height / 2;
      const x2 = padding + nodeRadius + (i + 1) * spacing;
      const y2 = height / 2;
      lines.push(
        <line
          key={`line-${i}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#667eea"
          strokeWidth="2"
        />
      );
    }

    // Nodos
    for (let i = 0; i < nodeCount; i++) {
      const x = padding + nodeRadius + i * spacing;
      const y = height / 2;
      nodes.push(
        <circle
          key={`node-${i}`}
          cx={x}
          cy={y}
          r={nodeRadius}
          fill="#667eea"
          stroke="#fff"
          strokeWidth="2"
        />
      );
      nodes.push(
        <text
          key={`text-${i}`}
          x={x}
          y={y}
          textAnchor="middle"
          dy="0.3em"
          fill="white"
          fontSize="12"
          fontWeight="bold"
        >
          {i + 1}
        </text>
      );
    }

    return [...lines, ...nodes];
  };

  // Función para dibujar topología MALLA
  const drawMalla = () => {
    const nodes = [];
    const cols = Math.ceil(Math.sqrt(nodeCount));
    const rows = Math.ceil(nodeCount / cols);
    const spacingX = (width - 2 * padding) / (cols - 1 || 1);
    const spacingY = (height - 2 * padding) / (rows - 1 || 1);

    const lines = [];

    // Líneas entre nodos
    for (let i = 0; i < nodeCount; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x1 = padding + col * spacingX;
      const y1 = padding + row * spacingY;

      // Conexión horizontal
      if (col < cols - 1 && i + 1 < nodeCount && (i + 1) % cols !== 0) {
        const x2 = padding + (col + 1) * spacingX;
        const y2 = padding + row * spacingY;
        lines.push(
          <line
            key={`h-line-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#667eea"
            strokeWidth="1.5"
            opacity="0.7"
          />
        );
      }

      // Conexión vertical
      if (row < rows - 1 && i + cols < nodeCount) {
        const x2 = padding + col * spacingX;
        const y2 = padding + (row + 1) * spacingY;
        lines.push(
          <line
            key={`v-line-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#667eea"
            strokeWidth="1.5"
            opacity="0.7"
          />
        );
      }
    }

    // Nodos
    for (let i = 0; i < nodeCount; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = padding + col * spacingX;
      const y = padding + row * spacingY;

      nodes.push(
        <circle
          key={`node-${i}`}
          cx={x}
          cy={y}
          r={nodeRadius}
          fill="#667eea"
          stroke="#fff"
          strokeWidth="2"
        />
      );
      nodes.push(
        <text
          key={`text-${i}`}
          x={x}
          y={y}
          textAnchor="middle"
          dy="0.3em"
          fill="white"
          fontSize="11"
          fontWeight="bold"
        >
          {i + 1}
        </text>
      );
    }

    return [...lines, ...nodes];
  };

  // Función para dibujar topología ÁRBOL (Binario) - Corregido
  const drawArbol = () => {
    const nodes = [];
    const lines = [];
    const positions = {};
    let nodeCounter = 0;

    // Calcular altura del árbol
    const treeHeight = Math.ceil(Math.log2(nodeCount + 1));
    const levelHeight = (height - 2 * padding) / (treeHeight + 1);

    // Función recursiva que posiciona nodos correctamente
    const positionTree = (nodeIndex, level, horizontalPosition, horizontalSpacing) => {
      if (nodeIndex >= nodeCount) return null;

      const x = horizontalPosition;
      const y = padding + levelHeight * (level + 1);

      positions[nodeIndex] = { x, y };

      const leftChildIndex = 2 * nodeIndex + 1;
      const rightChildIndex = 2 * nodeIndex + 2;

      const newSpacing = horizontalSpacing / 2;

      // Posicionar hijo izquierdo
      if (leftChildIndex < nodeCount) {
        const leftChild = positionTree(leftChildIndex, level + 1, x - horizontalSpacing, newSpacing);
        if (leftChild) {
          lines.push(
            <line
              key={`line-${nodeIndex}-left`}
              x1={x}
              y1={y + nodeRadius}
              x2={leftChild.x}
              y2={leftChild.y - nodeRadius}
              stroke="#667eea"
              strokeWidth="2"
            />
          );
        }
      }

      // Posicionar hijo derecho
      if (rightChildIndex < nodeCount) {
        const rightChild = positionTree(rightChildIndex, level + 1, x + horizontalSpacing, newSpacing);
        if (rightChild) {
          lines.push(
            <line
              key={`line-${nodeIndex}-right`}
              x1={x}
              y1={y + nodeRadius}
              x2={rightChild.x}
              y2={rightChild.y - nodeRadius}
              stroke="#667eea"
              strokeWidth="2"
            />
          );
        }
      }

      return { x, y };
    };

    // Empezar desde la raíz (nodo 0) en el centro
    const centerX = width / 2;
    const initialSpacing = (width - 2 * padding) / 3;
    positionTree(0, 0, centerX, initialSpacing);

    // Dibujar todos los nodos
    Object.keys(positions).forEach((key) => {
      const { x, y } = positions[key];
      const idx = parseInt(key);

      nodes.push(
        <circle
          key={`node-${idx}`}
          cx={x}
          cy={y}
          r={nodeRadius}
          fill="#667eea"
          stroke="#fff"
          strokeWidth="2"
        />
      );
      nodes.push(
        <text
          key={`text-${idx}`}
          x={x}
          y={y}
          textAnchor="middle"
          dy="0.3em"
          fill="white"
          fontSize="11"
          fontWeight="bold"
        >
          {idx + 1}
        </text>
      );
    });

    return [...lines, ...nodes];
  };

  // Función para dibujar topología ANILLO
  const drawAnillo = () => {
    const nodes = [];
    const lines = [];
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - padding - nodeRadius;

    // Líneas conectoras (círculo)
    for (let i = 0; i < nodeCount; i++) {
      const angle1 = (i / nodeCount) * 2 * Math.PI;
      const angle2 = (((i + 1) % nodeCount) / nodeCount) * 2 * Math.PI;

      const x1 = centerX + radius * Math.cos(angle1);
      const y1 = centerY + radius * Math.sin(angle1);
      const x2 = centerX + radius * Math.cos(angle2);
      const y2 = centerY + radius * Math.sin(angle2);

      lines.push(
        <line
          key={`line-${i}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#667eea"
          strokeWidth="2"
        />
      );
    }

    // Nodos
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      nodes.push(
        <circle
          key={`node-${i}`}
          cx={x}
          cy={y}
          r={nodeRadius}
          fill="#667eea"
          stroke="#fff"
          strokeWidth="2"
        />
      );
      nodes.push(
        <text
          key={`text-${i}`}
          x={x}
          y={y}
          textAnchor="middle"
          dy="0.3em"
          fill="white"
          fontSize="11"
          fontWeight="bold"
        >
          {i + 1}
        </text>
      );
    }

    return [...lines, ...nodes];
  };

  // Función para dibujar topología BUS
  const drawBus = () => {
    const nodes = [];
    const lines = [];

    // Línea central del bus
    const busY = height / 2;
    const busStartX = padding + nodeRadius;
    const busEndX = width - padding - nodeRadius;

    lines.push(
      <line
        key="bus-main"
        x1={busStartX}
        y1={busY}
        x2={busEndX}
        y2={busY}
        stroke="#667eea"
        strokeWidth="3"
      />
    );

    // Nodos conectados al bus
    const spacing = (busEndX - busStartX) / (nodeCount - 1 || 1);
    for (let i = 0; i < nodeCount; i++) {
      const x = busStartX + i * spacing;
      const y = busY;

      // Línea de conexión vertical
      lines.push(
        <line
          key={`branch-${i}`}
          x1={x}
          y1={y}
          x2={x}
          y2={y - 40}
          stroke="#667eea"
          strokeWidth="1.5"
          opacity="0.7"
        />
      );

      // Nodo
      nodes.push(
        <circle
          key={`node-${i}`}
          cx={x}
          cy={y - 50}
          r={nodeRadius}
          fill="#667eea"
          stroke="#fff"
          strokeWidth="2"
        />
      );
      nodes.push(
        <text
          key={`text-${i}`}
          x={x}
          y={y - 50}
          textAnchor="middle"
          dy="0.3em"
          fill="white"
          fontSize="11"
          fontWeight="bold"
        >
          {i + 1}
        </text>
      );
    }

    return [...lines, ...nodes];
  };

  // Seleccionar función según topología
  let elements = [];
  switch (topology?.toLowerCase()) {
    case 'lineal':
      elements = drawLineal();
      break;
    case 'malla':
      elements = drawMalla();
      break;
    case 'arbol':
      elements = drawArbol();
      break;
    case 'anillo':
      elements = drawAnillo();
      break;
    case 'bus':
      elements = drawBus();
      break;
    default:
      elements = [];
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px' }}>
      <svg
        width={width}
        height={height}
        style={{
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          backgroundColor: '#fafafa'
        }}
      >
        {elements}
      </svg>
    </div>
  );
}

export default TopologyVisualization;
