import { ShareAltOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Button, Card, message, Table, Tag } from 'antd';
import React, { useState } from 'react';

const ProfessorTemplates: React.FC = () => {
  const [sharedTemplates, setSharedTemplates] = useState<string[]>([
    'tpl-mesh-small',
  ]);

  const templates = [
    {
      id: 'tpl-mesh-small',
      name: 'Malla ligera',
      topology: 'Malla',
      audience: 'Redes I',
    },
    {
      id: 'tpl-tree-services',
      name: 'Servicios en árbol',
      topology: 'Árbol',
      audience: 'Sistemas Distribuidos',
    },
  ];

  const shareTemplate = (id: string) => {
    setSharedTemplates((currentTemplates) => [...currentTemplates, id]);
    message.success('Plantilla compartida con estudiantes');
  };

  return (
    <PageContainer header={{ title: 'Plantillas académicas' }}>
      <Card title="Crear y compartir plantillas reutilizables">
        <Table
          columns={[
            { title: 'Plantilla', dataIndex: 'name', key: 'name' },
            { title: 'Topología', dataIndex: 'topology', key: 'topology' },
            { title: 'Curso', dataIndex: 'audience', key: 'audience' },
            {
              title: 'Estado',
              key: 'status',
              render: (_: unknown, record: { id: string }) =>
                sharedTemplates.includes(record.id) ? (
                  <Tag color="green">Compartida</Tag>
                ) : (
                  <Tag>Privada</Tag>
                ),
            },
            {
              title: 'Acciones',
              key: 'actions',
              render: (_: unknown, record: { id: string }) => (
                <Button
                  icon={<ShareAltOutlined />}
                  disabled={sharedTemplates.includes(record.id)}
                  onClick={() => shareTemplate(record.id)}
                >
                  Compartir
                </Button>
              ),
            },
          ]}
          dataSource={templates}
          rowKey="id"
        />
      </Card>
    </PageContainer>
  );
};

export default ProfessorTemplates;
