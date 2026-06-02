import {
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  message,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
  Upload,
} from 'antd';
import React, { useState } from 'react';

interface ImageRecord {
  id: string;
  name: string;
  os: string;
  size: string;
  uploadedAt: string;
  status: 'ready' | 'uploading' | 'error';
}

const ImagesPage: React.FC = () => {
  const [images, setImages] = useState<ImageRecord[]>([
    {
      id: '1',
      name: 'ubuntu-20.04-server.iso',
      os: 'Ubuntu 20.04 LTS',
      size: '2.8 GB',
      uploadedAt: '2026-05-20',
      status: 'ready',
    },
    {
      id: '2',
      name: 'ubuntu-22.04-server.iso',
      os: 'Ubuntu 22.04 LTS',
      size: '3.2 GB',
      uploadedAt: '2026-05-15',
      status: 'ready',
    },
    {
      id: '3',
      name: 'centos-8-minimal.iso',
      os: 'CentOS 8',
      size: '1.9 GB',
      uploadedAt: '2026-05-10',
      status: 'ready',
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleDelete = (id: string) => {
    setImages(images.filter((img) => img.id !== id));
    message.success('Imagen eliminada correctamente');
  };

  const handleUpload = async (values: any) => {
    // Simulate upload
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const newImage: ImageRecord = {
      id: `img-${Date.now()}`,
      name: values.imageName,
      os: values.osType,
      size: 'Pendiente',
      uploadedAt: new Date().toISOString().split('T')[0],
      status: 'uploading',
    };
    setImages([...images, newImage]);
    message.success('Carga de imagen iniciada');
    setIsModalOpen(false);
    form.resetFields();
  };

  const columns = [
    {
      title: 'Nombre de la imagen',
      dataIndex: 'name',
      key: 'name',
      width: 250,
    },
    {
      title: 'Sistema operativo',
      dataIndex: 'os',
      key: 'os',
      width: 180,
      render: (os: string) => <Tag>{os}</Tag>,
    },
    {
      title: 'Tamaño',
      dataIndex: 'size',
      key: 'size',
      width: 120,
    },
    {
      title: 'Subida',
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      width: 120,
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const colors: Record<string, string> = {
          ready: 'green',
          uploading: 'blue',
          error: 'red',
        };
        const labels: Record<string, string> = {
          ready: 'LISTA',
          uploading: 'SUBIENDO',
          error: 'ERROR',
        };
        return <Tag color={colors[status]}>{labels[status]}</Tag>;
      },
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 120,
      render: (_: any, record: ImageRecord) => (
        <Space size="small">
          <Tooltip title="Ver">
            <Button type="text" size="small" icon={<EyeOutlined />} />
          </Tooltip>
          <Tooltip title="Descargar">
            <Button type="text" size="small" icon={<DownloadOutlined />} />
          </Tooltip>
          <Popconfirm
            title="Eliminar imagen"
            description="¿Seguro que quieres eliminar esta imagen?"
            onConfirm={() => handleDelete(record.id)}
            okText="Sí"
            cancelText="No"
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      header={{
        title: 'Imágenes de VM',
        extra: [
          <Button
            key="upload"
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => setIsModalOpen(true)}
          >
            Subir imagen
          </Button>,
        ],
      }}
    >
      <Alert
        title="Importar imágenes de VM"
        description="Sube imágenes personalizadas de sistema operativo para crear máquinas virtuales"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card>
        {images.length === 0 ? (
          <Empty
            description="Aún no subiste imágenes"
            style={{ marginTop: 48, marginBottom: 48 }}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={images}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      {/* Upload Modal */}
      <Modal
        title="Subir imagen de VM"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleUpload}>
          <Form.Item
            label="Nombre de la imagen"
            name="imageName"
            rules={[
              { required: true, message: 'Ingresa el nombre de la imagen' },
            ]}
          >
            <Input placeholder="Ej.: ubuntu-22.04-server.iso" />
          </Form.Item>

          <Form.Item
            label="Sistema operativo"
            name="osType"
            rules={[
              { required: true, message: 'Ingresa el sistema operativo' },
            ]}
          >
            <Input placeholder="Ej.: Ubuntu 22.04 LTS" />
          </Form.Item>

          <Form.Item
            label="Archivo de imagen"
            name="imageFile"
            rules={[{ required: true, message: 'Sube un archivo de imagen' }]}
          >
            <Upload maxCount={1} beforeUpload={() => false}>
              <Button icon={<UploadOutlined />}>Seleccionar archivo</Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="primary" htmlType="submit">
                Subir
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ImagesPage;
