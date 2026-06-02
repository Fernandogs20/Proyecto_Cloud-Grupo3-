import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
} from 'antd';
import React from 'react';
import { useNavigate, useParams } from 'umi';

type TopologyType = 'linear' | 'mesh' | 'tree' | 'ring' | 'bus';

const SliceDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const mockData = {
    id: 'slice-001',
    name: 'Cluster de Producción',
    topology: 'mesh' as TopologyType,
    status: 'running',
    vms: 12,
    owner: 'admin',
    createdAt: '2026-05-15',
    cpuUsage: 75,
    memoryUsage: 82,
    storageUsage: 45,
    description: 'Cluster principal de producción para servicios web',
  };

  const topologyLabels: Record<TopologyType, string> = {
    linear: 'Lineal',
    mesh: 'Malla',
    tree: 'Árbol',
    ring: 'Anillo',
    bus: 'Bus',
  };

  const renderTopologyGraph = (topology: TopologyType) => {
    const commonNodeStyle: React.CSSProperties = {
      width: 56,
      height: 56,
      borderRadius: 8,
      border: '2px solid #1677ff',
      background: '#e6f4ff',
      color: '#0958d9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
      position: 'absolute',
      zIndex: 2,
    };

    const nodePositions: Record<
      TopologyType,
      { id: string; style: React.CSSProperties }[]
    > = {
      linear: [
        { id: 'vm-1', style: { left: '8%', top: '42%' } },
        { id: 'vm-2', style: { left: '30%', top: '42%' } },
        { id: 'vm-3', style: { left: '52%', top: '42%' } },
        { id: 'vm-4', style: { left: '74%', top: '42%' } },
      ],
      mesh: [
        { id: 'vm-1', style: { left: '18%', top: '18%' } },
        { id: 'vm-2', style: { left: '64%', top: '18%' } },
        { id: 'vm-3', style: { left: '18%', top: '62%' } },
        { id: 'vm-4', style: { left: '64%', top: '62%' } },
      ],
      tree: [
        { id: 'vm-1', style: { left: '41%', top: '8%' } },
        { id: 'vm-2', style: { left: '20%', top: '42%' } },
        { id: 'vm-3', style: { left: '62%', top: '42%' } },
        { id: 'vm-4', style: { left: '8%', top: '72%' } },
        { id: 'vm-5', style: { left: '32%', top: '72%' } },
        { id: 'vm-6', style: { left: '56%', top: '72%' } },
        { id: 'vm-7', style: { left: '80%', top: '72%' } },
      ],
      ring: [
        { id: 'vm-1', style: { left: '41%', top: '8%' } },
        { id: 'vm-2', style: { left: '70%', top: '34%' } },
        { id: 'vm-3', style: { left: '58%', top: '70%' } },
        { id: 'vm-4', style: { left: '24%', top: '70%' } },
        { id: 'vm-5', style: { left: '12%', top: '34%' } },
      ],
      bus: [
        { id: 'vm-1', style: { left: '10%', top: '24%' } },
        { id: 'vm-2', style: { left: '31%', top: '58%' } },
        { id: 'vm-3', style: { left: '52%', top: '24%' } },
        { id: 'vm-4', style: { left: '73%', top: '58%' } },
      ],
    };

    const lines: Record<TopologyType, string[]> = {
      linear: ['M 82 110 L 450 110'],
      mesh: [
        'M 120 62 L 360 62',
        'M 120 172 L 360 172',
        'M 120 62 L 120 172',
        'M 360 62 L 360 172',
        'M 120 62 L 360 172',
        'M 360 62 L 120 172',
      ],
      tree: [
        'M 250 46 L 145 120',
        'M 250 46 L 355 120',
        'M 145 120 L 84 192',
        'M 145 120 L 205 192',
        'M 355 120 L 325 192',
        'M 355 120 L 448 192',
      ],
      ring: [
        'M 250 46 L 398 104',
        'M 398 104 L 338 192',
        'M 338 192 L 176 192',
        'M 176 192 L 102 104',
        'M 102 104 L 250 46',
      ],
      bus: [
        'M 80 120 L 450 120',
        'M 110 82 L 110 120',
        'M 220 162 L 220 120',
        'M 330 82 L 330 120',
        'M 440 162 L 440 120',
      ],
    };

    return (
      <div
        style={{
          position: 'relative',
          minHeight: 260,
          border: '1px solid #f0f0f0',
          borderRadius: 8,
          background: '#fbfdff',
          overflow: 'hidden',
        }}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 520 240"
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
          }}
        >
          {lines[topology].map((path) => (
            <path
              key={path}
              d={path}
              stroke="#91caff"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
          ))}
        </svg>
        {nodePositions[topology].map((node) => (
          <div
            key={`${topology}-${node.id}`}
            style={{ ...commonNodeStyle, ...node.style }}
          >
            {node.id.toUpperCase().replace('-', ' ')}
          </div>
        ))}
      </div>
    );
  };

  const vmColumns = [
    {
      title: 'Nombre de la VM',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Dirección IP',
      dataIndex: 'ip',
      key: 'ip',
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'running' ? 'green' : 'red'}>
          {status === 'running' ? 'en ejecución' : status}
        </Tag>
      ),
    },
    {
      title: 'CPU',
      dataIndex: 'cpu',
      key: 'cpu',
    },
    {
      title: 'Memoria',
      dataIndex: 'memory',
      key: 'memory',
    },
  ];

  const vmData = [
    {
      key: '1',
      name: 'web-01',
      ip: '10.0.0.10',
      status: 'running',
      cpu: '2 núcleos',
      memory: '4GB',
    },
    {
      key: '2',
      name: 'web-02',
      ip: '10.0.0.11',
      status: 'running',
      cpu: '2 núcleos',
      memory: '4GB',
    },
    {
      key: '3',
      name: 'db-01',
      ip: '10.0.0.20',
      status: 'running',
      cpu: '4 núcleos',
      memory: '8GB',
    },
  ];

  return (
    <PageContainer
      header={{
        title: mockData.name,
        breadcrumb: {
          items: [
            { title: 'Mis Slices', href: '/slices/list' },
            { title: mockData.name },
          ],
        },
        extra: [
          <Button
            key="back"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/slices/list')}
          >
            Volver
          </Button>,
          <Button
            key="edit"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/slices/${id}/edit`)}
          >
            Editar
          </Button>,
        ],
      }}
    >
      <div style={{ marginBottom: 24 }}>
        {/* Status Alert */}
        {mockData.status === 'running' && (
          <Alert
            title="El slice se está ejecutando correctamente"
            type="success"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Estado"
                value={
                  mockData.status === 'running'
                    ? 'En ejecución'
                    : mockData.status
                }
                styles={{
                  content: {
                    color:
                      mockData.status === 'running' ? '#52c41a' : '#f5222d',
                  },
                }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="Total de VMs" value={mockData.vms} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Uso de CPU"
                value={mockData.cpuUsage}
                suffix="%"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Uso de memoria"
                value={mockData.memoryUsage}
                suffix="%"
              />
            </Card>
          </Col>
        </Row>

        <Card
          title="Topología gráfica"
          extra={<Tag color="blue">{topologyLabels[mockData.topology]}</Tag>}
          style={{ marginBottom: 24 }}
        >
          {renderTopologyGraph(mockData.topology)}
        </Card>

        {/* Details */}
        <Card title="Información del Slice" style={{ marginBottom: 24 }}>
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Nombre">
              {mockData.name}
            </Descriptions.Item>
            <Descriptions.Item label="Topología">
              <Tag color="blue">{topologyLabels[mockData.topology]}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Descripción">
              {mockData.description}
            </Descriptions.Item>
            <Descriptions.Item label="Creado">
              {mockData.createdAt}
            </Descriptions.Item>
            <Descriptions.Item label="Propietario">
              {mockData.owner}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Control Buttons */}
        <Card title="Acciones" style={{ marginBottom: 24 }}>
          <Space>
            <Button type="primary" icon={<PlayCircleOutlined />}>
              Iniciar
            </Button>
            <Button icon={<PauseCircleOutlined />}>Detener</Button>
            <Button icon={<ReloadOutlined />}>Reiniciar</Button>
            <Divider orientation="vertical" />
            <Button danger icon={<DeleteOutlined />}>
              Eliminar Slice
            </Button>
          </Space>
        </Card>

        {/* VMs Tab */}
        <Card title="Máquinas virtuales">
          <Table
            columns={vmColumns}
            dataSource={vmData}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </div>
    </PageContainer>
  );
};

export default SliceDetail;
