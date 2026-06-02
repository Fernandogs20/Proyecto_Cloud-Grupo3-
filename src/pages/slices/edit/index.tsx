import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Button, Card, Form, Input, message, Select, Space } from 'antd';
import React from 'react';
import { useNavigate, useParams } from 'umi';

const topologyOptions = [
  { label: 'Lineal', value: 'linear' },
  { label: 'Malla', value: 'mesh' },
  { label: 'Árbol', value: 'tree' },
  { label: 'Anillo', value: 'ring' },
  { label: 'Bus', value: 'bus' },
];

const EditSlice: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const handleSave = () => {
    message.success('Slice actualizado correctamente');
    navigate('/slices/list');
  };

  return (
    <PageContainer
      header={{
        title: 'Editar Slice',
        breadcrumb: {
          items: [
            { title: 'Mis Slices', href: '/slices/list' },
            { title: 'Editar' },
          ],
        },
        extra: [
          <Button
            key="back"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/slices/list')}
          >
            Volver
          </Button>,
        ],
      }}
    >
      <Card title={`Configuración del slice ${id}`}>
        <Form
          layout="vertical"
          initialValues={{
            name: 'Cluster de Producción',
            topology: 'mesh',
            description: 'Cluster principal de producción para servicios web',
            cpu: 2,
            memory: 4,
            storage: 8,
          }}
          onFinish={handleSave}
        >
          <Form.Item
            label="Nombre del Slice"
            name="name"
            rules={[{ required: true, message: 'Ingresa el nombre del slice' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Topología"
            name="topology"
            rules={[{ required: true, message: 'Selecciona una topología' }]}
          >
            <Select options={topologyOptions} />
          </Form.Item>
          <Form.Item label="Descripción" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="CPU por VM" name="cpu">
            <Select
              options={[1, 2, 4, 8, 16, 32].map((value) => ({
                value,
                label: `${value} ${value === 1 ? 'núcleo' : 'núcleos'}`,
              }))}
            />
          </Form.Item>
          <Form.Item label="Memoria por VM" name="memory">
            <Select
              options={[2, 4, 8, 16, 32, 64].map((value) => ({
                value,
                label: `${value} GB`,
              }))}
            />
          </Form.Item>
          <Form.Item label="Almacenamiento por VM" name="storage">
            <Select
              options={[0.5, 1, 2, 4, 8, 16].map((value) => ({
                value,
                label: value === 0.5 ? '512 MB' : `${value} GB`,
              }))}
            />
          </Form.Item>
          <Space>
            <Button onClick={() => navigate('/slices/list')}>Cancelar</Button>
            <Button type="primary" icon={<SaveOutlined />} htmlType="submit">
              Guardar cambios
            </Button>
          </Space>
        </Form>
      </Card>
    </PageContainer>
  );
};

export default EditSlice;
