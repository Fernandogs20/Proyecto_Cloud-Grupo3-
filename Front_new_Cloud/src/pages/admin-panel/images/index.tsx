import { PlusOutlined, SyncOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React from 'react';

interface VmImage {
  id: string;
  name: string;
  os: string;
  size: string;
  visibility: 'Publica' | 'Privada';
  status: 'Disponible' | 'Sincronizando';
  source: string;
}

type ImageFormValues = {
  name: string;
  os: string;
  sizeGb: number;
  visibility: VmImage['visibility'];
  source: string;
};

const initialImages: VmImage[] = [
  {
    id: '1',
    name: 'Ubuntu 22.04 LTS',
    os: 'Linux',
    size: '2.4 GB',
    visibility: 'Publica',
    status: 'Disponible',
    source: 'Repositorio oficial',
  },
  {
    id: '2',
    name: 'Debian 12',
    os: 'Linux',
    size: '1.8 GB',
    visibility: 'Publica',
    status: 'Disponible',
    source: 'Repositorio oficial',
  },
  {
    id: '3',
    name: 'Rocky Linux 9',
    os: 'Linux',
    size: '2.1 GB',
    visibility: 'Privada',
    status: 'Sincronizando',
    source: 'https://images.local/rocky-9.qcow2',
  },
];

const columns: ColumnsType<VmImage> = [
  { title: 'Imagen', dataIndex: 'name', key: 'name' },
  { title: 'Sistema', dataIndex: 'os', key: 'os' },
  { title: 'Tamaño', dataIndex: 'size', key: 'size' },
  { title: 'Origen', dataIndex: 'source', key: 'source' },
  {
    title: 'Visibilidad',
    dataIndex: 'visibility',
    key: 'visibility',
    render: (visibility) => <Tag>{visibility}</Tag>,
  },
  {
    title: 'Estado',
    dataIndex: 'status',
    key: 'status',
    render: (status) => (
      <Tag color={status === 'Disponible' ? 'green' : 'blue'}>{status}</Tag>
    ),
  },
];

const ImagesPage: React.FC = () => {
  const [form] = Form.useForm<ImageFormValues>();
  const [images, setImages] = React.useState<VmImage[]>(initialImages);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleAddImage = async () => {
    const values = await form.validateFields();
    const nextImage: VmImage = {
      id: `${Date.now()}`,
      name: values.name,
      os: values.os,
      size: `${values.sizeGb} GB`,
      visibility: values.visibility,
      status: 'Sincronizando',
      source: values.source,
    };

    setImages((currentImages) => [nextImage, ...currentImages]);
    setIsModalOpen(false);
    form.resetFields();
  };

  return (
    <PageContainer
      header={{
        title: 'Imagenes de máquinas virtuales',
        extra: [
          <Button key="sync" icon={<SyncOutlined />}>
            Sincronizar catalogo
          </Button>,
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
          >
            Agregar imagen
          </Button>,
        ],
      }}
    >
      <Alert
        title="Gestión global del catalogo de imágenes disponibles para VMs"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card>
        <Table
          columns={columns}
          dataSource={images}
          pagination={{ pageSize: 10 }}
          rowKey="id"
          scroll={{ x: true }}
        />
      </Card>

      <Modal
        title="Agregar imagen de VM"
        open={isModalOpen}
        okText="Agregar"
        cancelText="Cancelar"
        onOk={handleAddImage}
        onCancel={() => setIsModalOpen(false)}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            os: 'Linux',
            visibility: 'Publica',
            sizeGb: 2,
          }}
        >
          <Form.Item
            label="Nombre de la imagen"
            name="name"
            rules={[{ required: true, message: 'Ingresa el nombre' }]}
          >
            <Input placeholder="Ubuntu 24.04 LTS" />
          </Form.Item>

          <Space style={{ width: '100%' }} size="middle" align="start">
            <Form.Item
              label="Sistema operativo"
              name="os"
              rules={[{ required: true, message: 'Selecciona el sistema' }]}
              style={{ flex: 1 }}
            >
              <Select
                options={[
                  { label: 'Linux', value: 'Linux' },
                  { label: 'Windows', value: 'Windows' },
                  { label: 'BSD', value: 'BSD' },
                ]}
              />
            </Form.Item>

            <Form.Item
              label="Tamaño"
              name="sizeGb"
              rules={[{ required: true, message: 'Ingresa el tamaño' }]}
              style={{ flex: 1 }}
            >
              <InputNumber
                min={0.1}
                max={64}
                step={0.1}
                suffix="GB"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Space>

          <Form.Item
            label="Visibilidad"
            name="visibility"
            rules={[{ required: true, message: 'Selecciona la visibilidad' }]}
          >
            <Select
              options={[
                { label: 'Publica', value: 'Publica' },
                { label: 'Privada', value: 'Privada' },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Origen de la imagen"
            name="source"
            rules={[
              { required: true, message: 'Ingresa una URL o repositorio' },
            ]}
          >
            <Input placeholder="https://repo.local/imagen.qcow2" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ImagesPage;
