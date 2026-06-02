import {
  CheckCircleOutlined,
  CloudOutlined,
  DatabaseOutlined,
  DesktopOutlined,
  HddOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Alert, Card, Col, Progress, Row, Statistic, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React from 'react';

interface PlatformEvent {
  key: string;
  type: 'info' | 'warning' | 'critical';
  message: string;
  time: string;
}

interface NodeRecord {
  key: string;
  node: string;
  zone: string;
  cpu: number;
  memory: number;
  storage: number;
  status: 'operativo' | 'advertencia' | 'fuera de servicio';
}

const nodeData: NodeRecord[] = [
  {
    key: '1',
    node: 'openstack-node-01',
    zone: 'zona-a',
    cpu: 64,
    memory: 256,
    storage: 4096,
    status: 'operativo',
  },
  {
    key: '2',
    node: 'openstack-node-02',
    zone: 'zona-a',
    cpu: 48,
    memory: 192,
    storage: 3072,
    status: 'operativo',
  },
  {
    key: '3',
    node: 'linux-compute-03',
    zone: 'zona-b',
    cpu: 32,
    memory: 128,
    storage: 2048,
    status: 'advertencia',
  },
];

const events: PlatformEvent[] = [
  {
    key: '1',
    type: 'warning',
    message: 'Uso de CPU elevado en linux-compute-03',
    time: 'Hace 5 minutos',
  },
  {
    key: '2',
    type: 'info',
    message: 'Sincronización de imágenes completada',
    time: 'Hace 35 minutos',
  },
  {
    key: '3',
    type: 'info',
    message: 'Zona de disponibilidad zona-b validada',
    time: 'Hace 1 hora',
  },
];

const nodeColumns: ColumnsType<NodeRecord> = [
  { title: 'Nodo', dataIndex: 'node', key: 'node' },
  { title: 'Zona', dataIndex: 'zone', key: 'zone' },
  {
    title: 'CPU',
    dataIndex: 'cpu',
    key: 'cpu',
    render: (value) => `${value} nucleos`,
  },
  {
    title: 'Memoria',
    dataIndex: 'memory',
    key: 'memory',
    render: (value) => `${value} GB`,
  },
  {
    title: 'Almacenamiento',
    dataIndex: 'storage',
    key: 'storage',
    render: (value) => `${value} GB`,
  },
  {
    title: 'Estado',
    dataIndex: 'status',
    key: 'status',
    render: (status) => (
      <Tag
        color={status === 'operativo' ? 'green' : 'gold'}
        icon={
          status === 'operativo' ? <CheckCircleOutlined /> : <WarningOutlined />
        }
      >
        {status.toUpperCase()}
      </Tag>
    ),
  },
];

const AdminDashboard: React.FC = () => {
  const systemStats = [
    {
      title: 'Servidores físicos',
      value: 12,
      icon: <CloudOutlined />,
      color: '#1677ff',
    },
    {
      title: 'Nodos activos',
      value: 9,
      icon: <DesktopOutlined />,
      color: '#52c41a',
    },
    {
      title: 'VMs activas',
      value: 127,
      icon: <DatabaseOutlined />,
      color: '#722ed1',
    },
    {
      title: 'Almacenamiento usado',
      value: 48,
      suffix: 'TB',
      icon: <HddOutlined />,
      color: '#fa8c16',
    },
  ];

  return (
    <PageContainer header={{ title: 'Estado general de la plataforma' }}>
      <Alert
        title="Plataforma operativa: servicios cloud disponibles"
        type="success"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {systemStats.map((stat) => (
          <Col key={stat.title} xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                suffix={stat.suffix}
                prefix={stat.icon}
                styles={{ content: { color: stat.color } }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Recursos físicos y virtuales">
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>CPU</div>
              <Progress percent={68} status="active" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>Memoria</div>
              <Progress percent={72} status="active" />
            </div>
            <div>
              <div style={{ marginBottom: 8 }}>Almacenamiento</div>
              <Progress percent={45} />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Eventos recientes">
            {events.map((event) => (
              <div
                key={event.key}
                style={{
                  marginBottom: 16,
                  paddingBottom: 12,
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                <Tag color={event.type === 'warning' ? 'gold' : 'blue'}>
                  {event.type.toUpperCase()}
                </Tag>
                <div style={{ marginTop: 8 }}>{event.message}</div>
                <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: 12 }}>
                  {event.time}
                </div>
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      <Card title="Nodos principales">
        <Table
          columns={nodeColumns}
          dataSource={nodeData}
          pagination={false}
          rowKey="key"
          size="small"
          scroll={{ x: true }}
        />
      </Card>
    </PageContainer>
  );
};

export default AdminDashboard;
