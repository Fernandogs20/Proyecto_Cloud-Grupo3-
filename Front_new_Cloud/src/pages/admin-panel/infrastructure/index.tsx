import { CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Alert, Card, Col, Progress, Row, Statistic, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React from 'react';

interface InfrastructureNode {
  id: string;
  name: string;
  type: 'Servidor físico' | 'Nodo Linux' | 'Nodo OpenStack';
  ip: string;
  zone: string;
  cpu: number;
  memory: number;
  storage: number;
  status: 'Operativo' | 'Observación';
}

const nodes: InfrastructureNode[] = [
  {
    id: '1',
    name: 'srv-cloud-01',
    type: 'Servidor físico',
    ip: '192.168.10.11',
    zone: 'zona-a',
    cpu: 64,
    memory: 256,
    storage: 4096,
    status: 'Operativo',
  },
  {
    id: '2',
    name: 'openstack-node-02',
    type: 'Nodo OpenStack',
    ip: '192.168.10.12',
    zone: 'zona-a',
    cpu: 48,
    memory: 192,
    storage: 3072,
    status: 'Operativo',
  },
  {
    id: '3',
    name: 'linux-compute-03',
    type: 'Nodo Linux',
    ip: '192.168.10.13',
    zone: 'zona-b',
    cpu: 32,
    memory: 128,
    storage: 2048,
    status: 'Observación',
  },
];

const columns: ColumnsType<InfrastructureNode> = [
  { title: 'Servidor o nodo', dataIndex: 'name', key: 'name' },
  {
    title: 'Tipo',
    dataIndex: 'type',
    key: 'type',
    render: (type) => <Tag>{type}</Tag>,
  },
  { title: 'IP', dataIndex: 'ip', key: 'ip' },
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
        color={status === 'Operativo' ? 'green' : 'gold'}
        icon={
          status === 'Operativo' ? <CheckCircleOutlined /> : <WarningOutlined />
        }
      >
        {status}
      </Tag>
    ),
  },
];

const InfrastructurePage: React.FC = () => {
  return (
    <PageContainer header={{ title: 'Servidores físicos y nodos' }}>
      <Alert
        title="Gestión de servidores físicos, nodos Linux y nodos OpenStack"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Servidores físicos" value={4} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Nodos OpenStack" value={5} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Salud de infraestructura" value={92} suffix="%" />
            <Progress percent={92} />
          </Card>
        </Col>
      </Row>

      <Card title="Inventario de infraestructura">
        <Table
          columns={columns}
          dataSource={nodes}
          pagination={{ pageSize: 10 }}
          rowKey="id"
          scroll={{ x: true }}
        />
      </Card>
    </PageContainer>
  );
};

export default InfrastructurePage;
