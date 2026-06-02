import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Alert, Button, Card, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React from 'react';

interface LogRecord {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  source: string;
  message: string;
}

const logs: LogRecord[] = [
  {
    id: '1',
    timestamp: '2026-05-29 01:42:15',
    level: 'info',
    source: 'OpenStack',
    message: 'Servicio nova-compute validado en openstack-node-01',
  },
  {
    id: '2',
    timestamp: '2026-05-29 01:31:42',
    level: 'warning',
    source: 'Nodo Linux',
    message: 'CPU de linux-compute-03 superó 85%',
  },
  {
    id: '3',
    timestamp: '2026-05-29 01:18:20',
    level: 'info',
    source: 'Imagenes',
    message: 'Imagen Ubuntu 22.04 sincronizada',
  },
  {
    id: '4',
    timestamp: '2026-05-29 00:55:33',
    level: 'error',
    source: 'Red',
    message: 'Latencia elevada detectada en red-publica',
  },
];

const columns: ColumnsType<LogRecord> = [
  {
    title: 'Fecha y hora',
    dataIndex: 'timestamp',
    key: 'timestamp',
    width: 180,
  },
  {
    title: 'Nivel',
    dataIndex: 'level',
    key: 'level',
    width: 110,
    render: (level) => {
      const colors: Record<string, string> = {
        info: 'blue',
        warning: 'gold',
        error: 'red',
        critical: 'volcano',
      };
      return <Tag color={colors[level]}>{level.toUpperCase()}</Tag>;
    },
  },
  { title: 'Origen', dataIndex: 'source', key: 'source', width: 140 },
  { title: 'Evento', dataIndex: 'message', key: 'message' },
];

const LogsPage: React.FC = () => {
  return (
    <PageContainer header={{ title: 'Logs y eventos del sistema' }}>
      <Alert
        title="Historial de eventos técnicos de la plataforma"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card style={{ marginBottom: 24 }}>
        <Space wrap>
          <Select
            placeholder="Filtrar por nivel"
            style={{ width: 180 }}
            options={[
              { label: 'Todos los niveles', value: '' },
              { label: 'Info', value: 'info' },
              { label: 'Advertencia', value: 'warning' },
              { label: 'Error', value: 'error' },
              { label: 'Critico', value: 'critical' },
            ]}
          />
          <Select
            placeholder="Filtrar por origen"
            style={{ width: 180 }}
            options={[
              { label: 'Todos los origenes', value: '' },
              { label: 'OpenStack', value: 'OpenStack' },
              { label: 'Nodo Linux', value: 'Nodo Linux' },
              { label: 'Red', value: 'Red' },
            ]}
          />
          <Button icon={<ReloadOutlined />}>Actualizar</Button>
          <Button icon={<DownloadOutlined />}>Exportar</Button>
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={logs}
          pagination={{ pageSize: 20 }}
          rowKey="id"
          scroll={{ x: true }}
        />
      </Card>
    </PageContainer>
  );
};

export default LogsPage;
