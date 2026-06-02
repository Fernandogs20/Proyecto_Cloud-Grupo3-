import { HddOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Alert, Card, Col, Progress, Row, Statistic, Table, Tag } from 'antd';
import React from 'react';

interface ResourceData {
  service: string;
  cpu: number;
  memory: number;
  storage: number;
  status: 'normal' | 'warning' | 'critical';
}

const ConsumptionPage: React.FC = () => {
  const mockResources: ResourceData[] = [
    {
      service: 'Cluster de Producción',
      cpu: 75,
      memory: 82,
      storage: 45,
      status: 'normal',
    },
    {
      service: 'Entorno de Desarrollo',
      cpu: 32,
      memory: 48,
      storage: 28,
      status: 'normal',
    },
    {
      service: 'Pruebas',
      cpu: 0,
      memory: 0,
      storage: 15,
      status: 'normal',
    },
  ];

  const totalCPU =
    mockResources.reduce((sum, r) => sum + r.cpu, 0) / mockResources.length;
  const totalMemory =
    mockResources.reduce((sum, r) => sum + r.memory, 0) / mockResources.length;
  const totalStorage =
    mockResources.reduce((sum, r) => sum + r.storage, 0) / mockResources.length;

  const columns = [
    {
      title: 'Servicio/Slice',
      dataIndex: 'service',
      key: 'service',
      width: 200,
    },
    {
      title: 'CPU',
      dataIndex: 'cpu',
      key: 'cpu',
      render: (value: number) => (
        <div>
          <div>{value}%</div>
          <Progress percent={value} size="small" />
        </div>
      ),
    },
    {
      title: 'Memoria',
      dataIndex: 'memory',
      key: 'memory',
      render: (value: number) => (
        <div>
          <div>{value}%</div>
          <Progress percent={value} size="small" />
        </div>
      ),
    },
    {
      title: 'Almacenamiento',
      dataIndex: 'storage',
      key: 'storage',
      render: (value: number) => (
        <div>
          <div>{value}%</div>
          <Progress percent={value} size="small" />
        </div>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          normal: 'green',
          warning: 'gold',
          critical: 'red',
        };
        const labels: Record<string, string> = {
          normal: 'NORMAL',
          warning: 'ADVERTENCIA',
          critical: 'CRÍTICO',
        };
        return <Tag color={colors[status]}>{labels[status]}</Tag>;
      },
    },
  ];

  return (
    <PageContainer header={{ title: 'Monitoreo de Recursos' }}>
      <Alert
        title="Resumen de uso de recursos"
        description="Monitorea el consumo de recursos en todos tus slices"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* Summary Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Uso promedio de CPU"
              value={totalCPU.toFixed(1)}
              suffix="%"
              prefix={<HddOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Uso promedio de memoria"
              value={totalMemory.toFixed(1)}
              suffix="%"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Uso promedio de almacenamiento"
              value={totalStorage.toFixed(1)}
              suffix="%"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Slices activos"
              value={mockResources.filter((r) => r.cpu > 0).length}
              styles={{ content: { color: '#52c41a' } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Detailed Table */}
      <Card title="Detalle de recursos">
        <Table
          columns={columns}
          dataSource={mockResources}
          rowKey="service"
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </PageContainer>
  );
};

export default ConsumptionPage;
