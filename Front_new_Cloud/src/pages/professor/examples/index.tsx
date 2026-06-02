import { PlusOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Button, Card, Form, Input, message, Select, Table } from 'antd';
import React, { useState } from 'react';

interface ExampleSlice {
  id: string;
  name: string;
  practice: string;
  topology: string;
  resources: string;
}

const ProfessorExamples: React.FC = () => {
  const [form] = Form.useForm();
  const [examples, setExamples] = useState<ExampleSlice[]>([
    {
      id: 'example-001',
      name: 'Ejemplo de red lineal',
      practice: 'Práctica 1',
      topology: 'Lineal',
      resources: '2 CPU / 4 GB RAM / 4 GB disco',
    },
  ]);

  const createExample = (values: Omit<ExampleSlice, 'id'>) => {
    setExamples((currentExamples) => [
      ...currentExamples,
      {
        ...values,
        id: `example-${Date.now()}`,
      },
    ]);
    message.success('Slice de ejemplo creado');
    form.resetFields();
  };

  return (
    <PageContainer header={{ title: 'Slices de ejemplo' }}>
      <Card
        title="Crear slice de ejemplo para práctica"
        style={{ marginBottom: 24 }}
      >
        <Form form={form} layout="vertical" onFinish={createExample}>
          <Form.Item
            label="Nombre"
            name="name"
            rules={[{ required: true, message: 'Ingresa un nombre' }]}
          >
            <Input placeholder="Ej.: Topología para balanceo" />
          </Form.Item>
          <Form.Item
            label="Práctica"
            name="practice"
            rules={[{ required: true, message: 'Ingresa la práctica' }]}
          >
            <Input placeholder="Ej.: Práctica 2" />
          </Form.Item>
          <Form.Item
            label="Topología"
            name="topology"
            rules={[{ required: true, message: 'Selecciona una topología' }]}
          >
            <Select
              options={['Lineal', 'Malla', 'Árbol', 'Anillo', 'Bus'].map(
                (value) => ({
                  value,
                  label: value,
                }),
              )}
            />
          </Form.Item>
          <Form.Item
            label="Recursos"
            name="resources"
            initialValue="2 CPU / 4 GB RAM / 4 GB disco"
          >
            <Select
              options={[
                '1 CPU / 2 GB RAM / 2 GB disco',
                '2 CPU / 4 GB RAM / 4 GB disco',
                '4 CPU / 8 GB RAM / 8 GB disco',
              ].map((value) => ({ value, label: value }))}
            />
          </Form.Item>
          <Button type="primary" icon={<PlusOutlined />} htmlType="submit">
            Crear ejemplo
          </Button>
        </Form>
      </Card>
      <Card title="Ejemplos disponibles">
        <Table
          columns={[
            { title: 'Nombre', dataIndex: 'name', key: 'name' },
            { title: 'Práctica', dataIndex: 'practice', key: 'practice' },
            { title: 'Topología', dataIndex: 'topology', key: 'topology' },
            { title: 'Recursos', dataIndex: 'resources', key: 'resources' },
          ]}
          dataSource={examples}
          rowKey="id"
        />
      </Card>
    </PageContainer>
  );
};

export default ProfessorExamples;
