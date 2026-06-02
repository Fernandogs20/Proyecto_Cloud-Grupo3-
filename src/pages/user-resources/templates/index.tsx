import {
  ExportOutlined,
  ImportOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Modal,
  message,
  Select,
  Space,
  Table,
  Tag,
  Upload,
} from 'antd';
import React, { useState } from 'react';
import { useNavigate } from 'umi';

type TopologyType = 'linear' | 'mesh' | 'tree' | 'ring' | 'bus';

interface SliceTemplate {
  id: string;
  name: string;
  topology: TopologyType;
  vms: number;
  cpu: number;
  memory: number;
  storage: number;
}

const topologyLabels: Record<TopologyType, string> = {
  linear: 'Lineal',
  mesh: 'Malla',
  tree: 'Árbol',
  ring: 'Anillo',
  bus: 'Bus',
};

const TemplatesPage: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [templates, setTemplates] = useState<SliceTemplate[]>([
    {
      id: 'tpl-mesh-small',
      name: 'Malla ligera',
      topology: 'mesh',
      vms: 4,
      cpu: 2,
      memory: 4,
      storage: 8,
    },
    {
      id: 'tpl-linear-lab',
      name: 'Laboratorio lineal',
      topology: 'linear',
      vms: 3,
      cpu: 1,
      memory: 2,
      storage: 4,
    },
  ]);

  const exportTemplate = (template: SliceTemplate) => {
    const blob = new Blob([JSON.stringify(template, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.name.toLowerCase().replaceAll(' ', '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    message.success('Plantilla exportada');
  };

  const handleCreateTemplate = (values: SliceTemplate) => {
    setTemplates((currentTemplates) => [
      ...currentTemplates,
      {
        ...values,
        id: `tpl-${Date.now()}`,
      },
    ]);
    message.success('Plantilla creada');
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleImportTemplate = async (file: File) => {
    try {
      const content = await file.text();
      const importedTemplate = JSON.parse(content) as SliceTemplate;
      setTemplates((currentTemplates) => [
        ...currentTemplates,
        {
          ...importedTemplate,
          id: importedTemplate.id || `tpl-${Date.now()}`,
        },
      ]);
      message.success('Plantilla importada');
    } catch (_error) {
      message.error('No se pudo importar la plantilla');
    }
    return false;
  };

  const columns = [
    {
      title: 'Plantilla',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Topología',
      dataIndex: 'topology',
      key: 'topology',
      render: (topology: TopologyType) => (
        <Tag color="blue">{topologyLabels[topology]}</Tag>
      ),
    },
    {
      title: 'VMs',
      dataIndex: 'vms',
      key: 'vms',
    },
    {
      title: 'Recursos por VM',
      key: 'resources',
      render: (_: unknown, record: SliceTemplate) =>
        `${record.cpu} CPU / ${record.memory} GB RAM / ${record.storage} GB`,
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_: unknown, record: SliceTemplate) => (
        <Space>
          <Button
            icon={<ExportOutlined />}
            onClick={() => exportTemplate(record)}
          >
            Exportar
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/slices/create')}
          >
            Usar plantilla
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      header={{
        title: 'Plantillas de Slices',
        extra: [
          <Upload
            key="import"
            accept=".json,application/json"
            showUploadList={false}
            beforeUpload={handleImportTemplate}
          >
            <Button icon={<ImportOutlined />}>Importar plantilla</Button>
          </Upload>,
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
          >
            Crear plantilla
          </Button>,
        ],
      }}
    >
      <Alert
        title="Importa y exporta plantillas de slices"
        description="Guarda configuraciones repetibles de topología y recursos para crear slices más rápido."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />
      <Card>
        <Table columns={columns} dataSource={templates} rowKey="id" />
      </Card>
      <Modal
        title="Crear plantilla"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateTemplate}>
          <Form.Item
            label="Nombre"
            name="name"
            rules={[{ required: true, message: 'Ingresa un nombre' }]}
          >
            <Input placeholder="Ej.: Laboratorio pequeño" />
          </Form.Item>
          <Form.Item
            label="Topología"
            name="topology"
            rules={[{ required: true, message: 'Selecciona una topología' }]}
          >
            <Select
              options={Object.entries(topologyLabels).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </Form.Item>
          <Form.Item label="VMs" name="vms" initialValue={2}>
            <Select
              options={[1, 2, 3, 4, 5, 6].map((value) => ({
                value,
                label: value,
              }))}
            />
          </Form.Item>
          <Form.Item label="CPU por VM" name="cpu" initialValue={1}>
            <Select
              options={[1, 2, 4, 8, 16, 32].map((value) => ({
                value,
                label: `${value} ${value === 1 ? 'núcleo' : 'núcleos'}`,
              }))}
            />
          </Form.Item>
          <Form.Item label="Memoria por VM" name="memory" initialValue={2}>
            <Select
              options={[2, 4, 8, 16, 32, 64].map((value) => ({
                value,
                label: `${value} GB`,
              }))}
            />
          </Form.Item>
          <Form.Item
            label="Almacenamiento por VM"
            name="storage"
            initialValue={4}
          >
            <Select
              options={[0.5, 1, 2, 4, 8, 16].map((value) => ({
                value,
                label: value === 0.5 ? '512 MB' : `${value} GB`,
              }))}
            />
          </Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="primary" htmlType="submit">
              Guardar
            </Button>
          </Space>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default TemplatesPage;
