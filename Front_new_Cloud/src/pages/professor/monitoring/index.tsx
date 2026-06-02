import { EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Alert, Button, Card, Progress, Table, Tag } from 'antd';
import React from 'react';
import { useNavigate } from 'umi';

const studentSlices = [
  {
    id: 'slice-est-001',
    student: 'Ana Torres',
    name: 'Práctica Malla',
    topology: 'Malla',
    cpu: 42,
    memory: 58,
    storage: 31,
    permission: 'Supervisión',
  },
  {
    id: 'slice-est-002',
    student: 'Luis Rojas',
    name: 'Laboratorio Lineal',
    topology: 'Lineal',
    cpu: 24,
    memory: 36,
    storage: 18,
    permission: 'Lectura',
  },
  {
    id: 'slice-est-003',
    student: 'María Pérez',
    name: 'Árbol de Servicios',
    topology: 'Árbol',
    cpu: 68,
    memory: 73,
    storage: 44,
    permission: 'Supervisión',
  },
];

const ProfessorMonitoring: React.FC = () => {
  const navigate = useNavigate();
  const columns = [
    {
      title: 'Estudiante',
      dataIndex: 'student',
      key: 'student',
    },
    {
      title: 'Slice',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Topología',
      dataIndex: 'topology',
      key: 'topology',
      render: (topology: string) => <Tag color="blue">{topology}</Tag>,
    },
    {
      title: 'CPU',
      dataIndex: 'cpu',
      key: 'cpu',
      render: (value: number) => <Progress percent={value} size="small" />,
    },
    {
      title: 'Memoria',
      dataIndex: 'memory',
      key: 'memory',
      render: (value: number) => <Progress percent={value} size="small" />,
    },
    {
      title: 'Almacenamiento',
      dataIndex: 'storage',
      key: 'storage',
      render: (value: number) => <Progress percent={value} size="small" />,
    },
    {
      title: 'Permiso',
      dataIndex: 'permission',
      key: 'permission',
      render: (permission: string) => <Tag>{permission}</Tag>,
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: () => (
        <Button
          icon={<EyeOutlined />}
          onClick={() => navigate('/slices/slice-001')}
        >
          Revisar
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      header={{
        title: 'Monitoreo académico',
        extra: [
          <Button
            key="example"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/professor/examples')}
          >
            Crear slice de ejemplo
          </Button>,
        ],
      }}
    >
      <Alert
        title="Supervisión de slices creados por estudiantes"
        description="Revisa consumo de recursos, topologías desplegadas y permisos de acceso asignados."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Card title="Slices de estudiantes">
          <Table
            columns={columns}
            dataSource={studentSlices}
            rowKey="id"
            scroll={{ x: true }}
          />
        </Card>
      </div>
    </PageContainer>
  );
};

export default ProfessorMonitoring;
