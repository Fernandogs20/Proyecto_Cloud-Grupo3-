import { EyeOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Button, Card, message, Table, Tag } from 'antd';
import React from 'react';
import { useNavigate } from 'umi';

const permissions = [
  {
    id: 'perm-001',
    student: 'Ana Torres',
    slice: 'Práctica Malla',
    permission: 'Supervisión',
    scope: 'Topología, métricas y consola de lectura',
  },
  {
    id: 'perm-002',
    student: 'Luis Rojas',
    slice: 'Laboratorio Lineal',
    permission: 'Lectura',
    scope: 'Topología y métricas',
  },
];

const ProfessorAccess: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageContainer header={{ title: 'Acceso parcial a slices' }}>
      <Card title="Permisos asignados">
        <Table
          columns={[
            { title: 'Estudiante', dataIndex: 'student', key: 'student' },
            { title: 'Slice', dataIndex: 'slice', key: 'slice' },
            {
              title: 'Permiso',
              dataIndex: 'permission',
              key: 'permission',
              render: (permission: string) => (
                <Tag color="blue">{permission}</Tag>
              ),
            },
            { title: 'Alcance', dataIndex: 'scope', key: 'scope' },
            {
              title: 'Acciones',
              key: 'actions',
              render: () => (
                <>
                  <Button
                    icon={<EyeOutlined />}
                    onClick={() => navigate('/slices/slice-001')}
                    style={{ marginRight: 8 }}
                  >
                    Acceder
                  </Button>
                  <Button
                    icon={<SafetyCertificateOutlined />}
                    onClick={() => message.success('Permiso verificado')}
                  >
                    Verificar permiso
                  </Button>
                </>
              ),
            },
          ]}
          dataSource={permissions}
          rowKey="id"
        />
      </Card>
    </PageContainer>
  );
};

export default ProfessorAccess;
