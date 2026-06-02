import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Alert, Button, Card, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React from 'react';

interface PolicyRecord {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  description: string;
  sla: string;
}

const policies: PolicyRecord[] = [
  {
    id: '1',
    name: 'Disponibilidad minima',
    type: 'SLA',
    enabled: true,
    description: 'Objetivo de disponibilidad mensual para servicios cloud.',
    sla: '99.5%',
  },
  {
    id: '2',
    name: 'Ventana de mantenimiento',
    type: 'Mantenimiento',
    enabled: true,
    description: 'Mantenimiento programado domingos 02:00-04:00.',
    sla: 'Planificado',
  },
  {
    id: '3',
    name: 'Retención de logs',
    type: 'Auditoria',
    enabled: true,
    description: 'Conserva eventos de plataforma por 90 dias.',
    sla: '90 dias',
  },
];

const columns: ColumnsType<PolicyRecord> = [
  { title: 'Politica', dataIndex: 'name', key: 'name', width: 220 },
  {
    title: 'Tipo',
    dataIndex: 'type',
    key: 'type',
    width: 140,
    render: (type) => <Tag>{type}</Tag>,
  },
  { title: 'Descripción', dataIndex: 'description', key: 'description' },
  { title: 'SLA', dataIndex: 'sla', key: 'sla', width: 130 },
  {
    title: 'Estado',
    dataIndex: 'enabled',
    key: 'enabled',
    width: 120,
    render: (enabled) => (
      <Tag color={enabled ? 'green' : 'red'}>
        {enabled ? 'Activa' : 'Inactiva'}
      </Tag>
    ),
  },
  {
    title: 'Acciones',
    key: 'actions',
    width: 120,
    render: () => (
      <Space>
        <Button type="text" size="small" icon={<EditOutlined />}>
          Editar
        </Button>
      </Space>
    ),
  },
];

const PoliciesPage: React.FC = () => {
  return (
    <PageContainer
      header={{
        title: 'Politicas del sistema y SLA',
        extra: [
          <Button key="add" type="primary" icon={<PlusOutlined />}>
            Nueva politica
          </Button>,
        ],
      }}
    >
      <Alert
        title="Definición de politicas globales de operación, auditoria y disponibilidad"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />
      <Card>
        <Table
          columns={columns}
          dataSource={policies}
          pagination={{ pageSize: 10 }}
          rowKey="id"
          scroll={{ x: true }}
        />
      </Card>
    </PageContainer>
  );
};

export default PoliciesPage;
