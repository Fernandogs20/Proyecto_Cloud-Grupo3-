import { PageContainer } from '@ant-design/pro-components';
import { Alert, Card, Col, Row, Statistic, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React from 'react';

interface NetworkRecord {
  id: string;
  name: string;
  cidr: string;
  zone: string;
  type: 'Publica' | 'Privada' | 'Gestion';
  status: 'Activa' | 'Mantenimiento';
}

const networks: NetworkRecord[] = [
  {
    id: '1',
    name: 'red-publica',
    cidr: '172.16.10.0/24',
    zone: 'zona-a',
    type: 'Publica',
    status: 'Activa',
  },
  {
    id: '2',
    name: 'red-laboratorio',
    cidr: '10.20.0.0/20',
    zone: 'zona-a',
    type: 'Privada',
    status: 'Activa',
  },
  {
    id: '3',
    name: 'red-gestion',
    cidr: '192.168.10.0/24',
    zone: 'zona-b',
    type: 'Gestion',
    status: 'Mantenimiento',
  },
];

const columns: ColumnsType<NetworkRecord> = [
  { title: 'Red', dataIndex: 'name', key: 'name' },
  { title: 'CIDR', dataIndex: 'cidr', key: 'cidr' },
  { title: 'Zona', dataIndex: 'zone', key: 'zone' },
  {
    title: 'Tipo',
    dataIndex: 'type',
    key: 'type',
    render: (type) => <Tag>{type}</Tag>,
  },
  {
    title: 'Estado',
    dataIndex: 'status',
    key: 'status',
    render: (status) => (
      <Tag color={status === 'Activa' ? 'green' : 'gold'}>{status}</Tag>
    ),
  },
];

const NetworksPage: React.FC = () => {
  return (
    <PageContainer header={{ title: 'Redes y zonas de disponibilidad' }}>
      <Alert
        title="Configuración global de redes, rangos y zonas disponibles"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Redes activas" value={2} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Zonas disponibles" value={2} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Subredes reservadas" value={6} />
          </Card>
        </Col>
      </Row>

      <Card title="Configuración de red">
        <Table
          columns={columns}
          dataSource={networks}
          pagination={{ pageSize: 10 }}
          rowKey="id"
        />
      </Card>
    </PageContainer>
  );
};

export default NetworksPage;
