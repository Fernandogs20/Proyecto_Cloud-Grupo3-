import { PageContainer } from '@ant-design/pro-components';
import { Alert, Card, Col, Progress, Row, Statistic, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React from 'react';

interface ResourcePool {
  key: string;
  name: string;
  type: 'Fisico' | 'Virtual';
  cpu: number;
  memory: number;
  storage: number;
  status: 'Normal' | 'Observacion';
}

const pools: ResourcePool[] = [
  {
    key: '1',
    name: 'Pool compute-a',
    type: 'Fisico',
    cpu: 68,
    memory: 71,
    storage: 42,
    status: 'Normal',
  },
  {
    key: '2',
    name: 'Pool compute-b',
    type: 'Fisico',
    cpu: 81,
    memory: 76,
    storage: 55,
    status: 'Observacion',
  },
  {
    key: '3',
    name: 'Pool virtual academico',
    type: 'Virtual',
    cpu: 63,
    memory: 58,
    storage: 39,
    status: 'Normal',
  },
];

const columns: ColumnsType<ResourcePool> = [
  { title: 'Recurso', dataIndex: 'name', key: 'name' },
  {
    title: 'Tipo',
    dataIndex: 'type',
    key: 'type',
    render: (type) => <Tag>{type}</Tag>,
  },
  {
    title: 'CPU',
    dataIndex: 'cpu',
    key: 'cpu',
    render: (value) => <Progress percent={value} size="small" />,
  },
  {
    title: 'Memoria',
    dataIndex: 'memory',
    key: 'memory',
    render: (value) => <Progress percent={value} size="small" />,
  },
  {
    title: 'Almacenamiento',
    dataIndex: 'storage',
    key: 'storage',
    render: (value) => <Progress percent={value} size="small" />,
  },
  {
    title: 'Estado',
    dataIndex: 'status',
    key: 'status',
    render: (status) => (
      <Tag color={status === 'Normal' ? 'green' : 'gold'}>{status}</Tag>
    ),
  },
];

const ResourcesPage: React.FC = () => {
  return (
    <PageContainer header={{ title: 'Recursos físicos y virtuales' }}>
      <Alert
        title="Supervisión de CPU, memoria y almacenamiento de la infraestructura"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="CPU total" value={512} suffix="nucleos" />
            <Progress percent={67} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Memoria total" value={2048} suffix="GB" />
            <Progress percent={76} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Almacenamiento total" value={100} suffix="TB" />
            <Progress percent={48} />
          </Card>
        </Col>
      </Row>

      <Card title="Pools de recursos">
        <Table
          columns={columns}
          dataSource={pools}
          pagination={false}
          rowKey="key"
          scroll={{ x: true }}
        />
      </Card>
    </PageContainer>
  );
};

export default ResourcesPage;
