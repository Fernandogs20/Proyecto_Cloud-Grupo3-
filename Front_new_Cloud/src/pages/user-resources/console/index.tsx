import {
  CopyOutlined,
  KeyOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  message,
  Select,
  Space,
  Typography,
} from 'antd';
import React, { useState } from 'react';

const { Text } = Typography;

const ConsolePage: React.FC = () => {
  const [form] = Form.useForm();
  const [token, setToken] = useState('');
  const [connectedVm, setConnectedVm] = useState('');

  const generateToken = () => {
    const nextToken = `slice-token-${Date.now()}`;
    setToken(nextToken);
    form.setFieldValue('token', nextToken);
    message.success('Token de acceso generado');
  };

  const connectToVm = (values: { vm: string; token: string }) => {
    if (!values.token) {
      message.error('Genera o ingresa un token antes de conectar');
      return;
    }
    setConnectedVm(values.vm);
    message.success(`Conectado a ${values.vm}`);
  };

  const copyToken = () => {
    navigator.clipboard.writeText(token);
    message.success('Token copiado');
  };

  return (
    <PageContainer header={{ title: 'Consola remota' }}>
      <Alert
        title="Acceso a VMs mediante tokens generados por el sistema"
        description="Selecciona un slice, elige una VM y genera un token temporal para abrir la consola remota."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />
      <Card title="Conectar a una VM" style={{ marginBottom: 24 }}>
        <Form form={form} layout="vertical" onFinish={connectToVm}>
          <Form.Item
            label="Slice"
            name="slice"
            rules={[{ required: true, message: 'Selecciona un slice' }]}
          >
            <Select
              options={[
                { label: 'Cluster de Producción', value: 'slice-001' },
                { label: 'Entorno de Desarrollo', value: 'slice-002' },
                { label: 'Red de Pruebas', value: 'slice-003' },
              ]}
            />
          </Form.Item>
          <Form.Item
            label="VM"
            name="vm"
            rules={[{ required: true, message: 'Selecciona una VM' }]}
          >
            <Select
              options={[
                { label: 'web-01', value: 'web-01' },
                { label: 'web-02', value: 'web-02' },
                { label: 'db-01', value: 'db-01' },
              ]}
            />
          </Form.Item>
          <Form.Item label="Token de acceso" name="token">
            <Input
              value={token}
              placeholder="Genera un token temporal"
              readOnly
              suffix={
                token ? (
                  <Button type="link" size="small" onClick={copyToken}>
                    <CopyOutlined />
                  </Button>
                ) : null
              }
            />
          </Form.Item>
          <Space>
            <Button icon={<KeyOutlined />} onClick={generateToken}>
              Generar token
            </Button>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              htmlType="submit"
            >
              Abrir consola
            </Button>
          </Space>
        </Form>
      </Card>
      {connectedVm && (
        <Card title={`Consola: ${connectedVm}`}>
          <div
            style={{
              background: '#111827',
              color: '#d1fae5',
              borderRadius: 6,
              padding: 16,
              minHeight: 180,
              fontFamily: 'monospace',
            }}
          >
            <Text style={{ color: '#d1fae5' }}>$ conexión establecida</Text>
            <br />
            <Text style={{ color: '#d1fae5' }}>
              $ token validado por el sistema
            </Text>
            <br />
            <Text style={{ color: '#d1fae5' }}>
              $ usuario conectado a {connectedVm}
            </Text>
          </div>
        </Card>
      )}
    </PageContainer>
  );
};

export default ConsolePage;
