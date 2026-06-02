import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Card,
  Col,
  Progress,
  Row,
  Space,
  Statistic,
  Table,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React from 'react';

interface QuotaRecord {
  id: string;
  grupo: string;
  cpuLimit: number;
  memoryLimit: number;
  storageLimit: number;
  used: { cpu: number; memory: number; storage: number };
}

const quotas: QuotaRecord[] = [
  {
    id: '1',
    grupo: 'Estudiantes - redes',
    cpuLimit: 320,
    memoryLimit: 640,
    storageLimit: 2048,
    used: { cpu: 244, memory: 416, storage: 760 },
  },
  {
    id: '2',
    grupo: 'Laboratorio cloud',
    cpuLimit: 160,
    memoryLimit: 320,
    storageLimit: 1024,
    used: { cpu: 88, memory: 170, storage: 390 },
  },
];

const columns: ColumnsType<QuotaRecord> = [
  { title: 'Grupo o actividad', dataIndex: 'grupo', key: 'grupo', width: 220 },
  {
    title: 'CPU usado / limite',
    key: 'cpu',
    width: 220,
    render: (_, record) => (
      <div>
        {record.used.cpu}/{record.cpuLimit} nucleos
        <Progress
          percent={Math.round((record.used.cpu / record.cpuLimit) * 100)}
          size="small"
        />
      </div>
    ),
  },
  {
    title: 'Memoria usada / limite',
    key: 'memory',
    width: 220,
    render: (_, record) => (
      <div>
        {record.used.memory}/{record.memoryLimit} GB
        <Progress
          percent={Math.round((record.used.memory / record.memoryLimit) * 100)}
          size="small"
        />
      </div>
    ),
  },
  {
    title: 'Almacenamiento usado / limite',
    key: 'storage',
    width: 240,
    render: (_, record) => (
      <div>
        {record.used.storage}/{record.storageLimit} GB
        <Progress
          percent={Math.round(
            (record.used.storage / record.storageLimit) * 100,
          )}
          size="small"
        />
      </div>
    ),
  },
  {
    title: 'Acciones',
    key: 'actions',
    width: 120,
    render: () => (
      <Space>
        <Button type="text" size="small" icon={<EditOutlined />}>
          Editar limite
        </Button>
      </Space>
    ),
  },
];

const QuotasPage: React.FC = () => {
  return (
    <PageContainer
      header={{
        title: 'Cuotas y limites',
        extra: [
          <Button key="add" type="primary" icon={<PlusOutlined />}>
            Nueva cuota
          </Button>,
        ],
      }}
    >
      <Alert
        title="Gestión de limites de uso para recursos de la plataforma"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card>
            <Statistic title="Grupos con cuota" value={quotas.length} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card>
            <Statistic title="Uso promedio de CPU" value={67} suffix="%" />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={quotas}
          pagination={{ pageSize: 10 }}
          rowKey="id"
          scroll={{ x: true }}
        />
      </Card>
    </PageContainer>
  );
};

export default QuotasPage;
