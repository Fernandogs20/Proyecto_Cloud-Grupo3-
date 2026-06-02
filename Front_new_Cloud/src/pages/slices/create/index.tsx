import {
  ArrowLeftOutlined,
  DeleteOutlined,
  PlusOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Form,
  Input,
  message,
  Row,
  Select,
  Space,
  Steps,
  Tag,
} from 'antd';
import React, { useState } from 'react';
import { useNavigate } from 'umi';
import useStyles from './index.style';

interface VMConfig {
  id: string;
  name: string;
  cpu: number;
  memory: number;
  storage: number;
  image: string;
}

interface SliceConfig {
  name: string;
  topology: 'linear' | 'mesh' | 'tree' | 'ring' | 'bus' | '';
  description: string;
  vms: VMConfig[];
}

const topologyDescriptions: Record<string, string> = {
  linear: 'Nodos organizados en línea. Útil para cadenas simples.',
  mesh: 'Todos los nodos conectados entre sí. Máxima redundancia.',
  tree: 'Estructura jerárquica. Útil para sistemas distribuidos.',
  ring: 'Nodos organizados en círculo. Útil para balanceo de carga.',
  bus: 'Todos los nodos comparten un bus común. Red de difusión simple.',
};

const topologyLabels: Record<string, string> = {
  linear: 'Lineal',
  mesh: 'Malla',
  tree: 'Árbol',
  ring: 'Anillo',
  bus: 'Bus',
};

const cpuOptions = [1, 2, 4, 8, 16, 32].map((value) => ({
  label: `${value} ${value === 1 ? 'núcleo' : 'núcleos'}`,
  value,
}));

const memoryOptions = [2, 4, 8, 16, 32, 64].map((value) => ({
  label: `${value} GB`,
  value,
}));

const storageOptions = [
  { label: '512 MB', value: 0.5 },
  { label: '1 GB', value: 1 },
  { label: '2 GB', value: 2 },
  { label: '4 GB', value: 4 },
  { label: '8 GB', value: 8 },
  { label: '16 GB', value: 16 },
];

const imageOptions = [
  { label: 'Ubuntu 20.04', value: 'ubuntu-20.04' },
  { label: 'Ubuntu 22.04', value: 'ubuntu-22.04' },
  { label: 'CentOS 7', value: 'centos-7' },
  { label: 'CentOS 8', value: 'centos-8' },
  {
    label: 'Windows Server 2019',
    value: 'win-2019',
  },
];

const topologyIcons: Record<string, string> = {
  linear: '━━━━━',
  mesh: '◊◊◊',
  tree: '🌳',
  ring: '◯◯◯',
  bus: '═══',
};

const CreateSlice: React.FC = () => {
  const { styles } = useStyles();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [config, setConfig] = useState<SliceConfig>({
    name: '',
    topology: '',
    description: '',
    vms: [],
  });

  const handleAddVM = () => {
    const newVM: VMConfig = {
      id: `vm-${Date.now()}`,
      name: `VM-${config.vms.length + 1}`,
      cpu: 2,
      memory: 4,
      storage: 2,
      image: 'ubuntu-20.04',
    };
    setConfig((prev) => ({
      ...prev,
      vms: [...prev.vms, newVM],
    }));
  };

  const handleRemoveVM = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      vms: prev.vms.filter((vm) => vm.id !== id),
    }));
  };

  const handleUpdateVM = (id: string, field: keyof VMConfig, value: any) => {
    setConfig((prev) => ({
      ...prev,
      vms: prev.vms.map((vm) =>
        vm.id === id ? { ...vm, [field]: value } : vm,
      ),
    }));
  };

  const handleNext = () => {
    if (currentStep === 0) {
      if (!config.name || !config.topology) {
        message.error('Completa todos los campos obligatorios');
        return;
      }
    }
    if (currentStep === 1) {
      if (config.vms.length === 0) {
        message.error('Agrega al menos una VM');
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleCreate = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      message.success('Slice creado correctamente');
      navigate('/slices/list');
    } catch (_error) {
      message.error('No se pudo crear el slice');
    }
  };

  return (
    <PageContainer
      header={{
        title: 'Crear Slice',
        breadcrumb: {
          items: [
            { title: 'Mis Slices', href: '/slices/list' },
            { title: 'Crear' },
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
      <div className={styles.container}>
        <Card>
          <Steps
            current={currentStep}
            items={[
              {
                title: 'Información básica',
                description: 'Topología y nombre',
              },
              { title: 'Configuración de VMs', description: 'Agregar VMs' },
              { title: 'Revisión', description: 'Confirmar y crear' },
            ]}
            style={{ marginBottom: 32 }}
          />

          {/* Step 0: Basic Information */}
          {currentStep === 0 && (
            <div className={styles.stepContent}>
              <h3>Selecciona la topología</h3>
              <div className={styles.topologyGrid}>
                {(['linear', 'mesh', 'tree', 'ring', 'bus'] as const).map(
                  (topo) => (
                    <Card
                      key={topo}
                      hoverable
                      className={`${styles.topologyCard} ${
                        config.topology === topo ? styles.selected : ''
                      }`}
                      onClick={() =>
                        setConfig((prev) => ({ ...prev, topology: topo }))
                      }
                      style={{
                        borderColor:
                          config.topology === topo ? '#1890ff' : undefined,
                        borderWidth: config.topology === topo ? 2 : 1,
                      }}
                    >
                      <div className={styles.topologyIcon}>
                        {topologyIcons[topo]}
                      </div>
                      <div className={styles.topologyName}>
                        {topologyLabels[topo]}
                      </div>
                      <div className={styles.topologyDesc}>
                        {topologyDescriptions[topo]}
                      </div>
                    </Card>
                  ),
                )}
              </div>

              <Divider />

              <Form form={form} layout="vertical">
                <Form.Item
                  label="Nombre del Slice"
                  required
                  tooltip="Identificador único del slice"
                >
                  <Input
                    placeholder="Ej.: Mi cluster de producción"
                    value={config.name}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                </Form.Item>

                <Form.Item label="Descripción">
                  <Input.TextArea
                    placeholder="Describe el propósito de este slice..."
                    rows={3}
                    value={config.description}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </Form.Item>
              </Form>
            </div>
          )}

          {/* Step 1: VM Configuration */}
          {currentStep === 1 && (
            <div className={styles.stepContent}>
              <div className={styles.vmHeader}>
                <h3>Configura las máquinas virtuales</h3>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddVM}
                >
                  Agregar VM
                </Button>
              </div>

              {config.vms.length === 0 ? (
                <Empty
                  description="Aún no agregaste VMs"
                  style={{ marginTop: 48, marginBottom: 48 }}
                />
              ) : (
                <div className={styles.vmList}>
                  {config.vms.map((vm) => (
                    <Card key={vm.id} className={styles.vmCard} size="small">
                      <div className={styles.vmFields}>
                        <Form.Item label="Nombre de la VM" layout="vertical">
                          <Input
                            placeholder="Nombre de la VM"
                            value={vm.name}
                            onChange={(e) =>
                              handleUpdateVM(vm.id, 'name', e.target.value)
                            }
                          />
                        </Form.Item>
                        <Form.Item label="CPU (núcleos)" layout="vertical">
                          <Select
                            value={vm.cpu}
                            onChange={(val) =>
                              handleUpdateVM(vm.id, 'cpu', val)
                            }
                            options={cpuOptions}
                          />
                        </Form.Item>
                        <Form.Item label="Memoria (GB)" layout="vertical">
                          <Select
                            value={vm.memory}
                            onChange={(val) =>
                              handleUpdateVM(vm.id, 'memory', val)
                            }
                            options={memoryOptions}
                          />
                        </Form.Item>
                        <Form.Item
                          label="Almacenamiento (GB)"
                          layout="vertical"
                        >
                          <Select
                            value={vm.storage}
                            onChange={(val) =>
                              handleUpdateVM(vm.id, 'storage', val)
                            }
                            options={storageOptions}
                          />
                        </Form.Item>
                        <Form.Item label="Imagen" layout="vertical">
                          <Select
                            value={vm.image}
                            onChange={(val) =>
                              handleUpdateVM(vm.id, 'image', val)
                            }
                            options={imageOptions}
                          />
                        </Form.Item>
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveVM(vm.id)}
                        >
                          Eliminar VM
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              <Button
                type="dashed"
                block
                icon={<PlusOutlined />}
                onClick={handleAddVM}
                style={{ marginTop: 16 }}
              >
                Agregar otra VM
              </Button>
            </div>
          )}

          {/* Step 2: Review */}
          {currentStep === 2 && (
            <div className={styles.stepContent}>
              <Alert
                title="Revisa tu configuración"
                description="Verifica todos los detalles antes de crear el slice"
                type="info"
                showIcon
                style={{ marginBottom: 24 }}
              />

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Card title="Información del Slice">
                    <div className={styles.reviewItem}>
                      <span className={styles.label}>Nombre:</span>
                      <strong>{config.name}</strong>
                    </div>
                    <div className={styles.reviewItem}>
                      <span className={styles.label}>Topología:</span>
                      <Tag color="blue">
                        {config.topology ? topologyLabels[config.topology] : ''}
                      </Tag>
                    </div>
                    <div className={styles.reviewItem}>
                      <span className={styles.label}>Descripción:</span>
                      <p>{config.description || 'No aplica'}</p>
                    </div>
                    <div className={styles.reviewItem}>
                      <span className={styles.label}>Total de VMs:</span>
                      <strong>{config.vms.length}</strong>
                    </div>
                  </Card>
                </Col>

                <Col xs={24} md={12}>
                  <Card title="Resumen de recursos">
                    <div className={styles.reviewItem}>
                      <span className={styles.label}>
                        Total de núcleos CPU:
                      </span>
                      <strong>
                        {config.vms.reduce((sum, vm) => sum + vm.cpu, 0)}
                      </strong>
                    </div>
                    <div className={styles.reviewItem}>
                      <span className={styles.label}>Memoria total (GB):</span>
                      <strong>
                        {config.vms.reduce((sum, vm) => sum + vm.memory, 0)}
                      </strong>
                    </div>
                    <div className={styles.reviewItem}>
                      <span className={styles.label}>
                        Almacenamiento total (GB):
                      </span>
                      <strong>
                        {config.vms.reduce((sum, vm) => sum + vm.storage, 0)}
                      </strong>
                    </div>
                  </Card>
                </Col>
              </Row>

              <Card title="Máquinas virtuales" style={{ marginTop: 24 }}>
                {config.vms.map((vm) => (
                  <div key={vm.id} className={styles.vmReviewItem}>
                    <span className={styles.vmName}>{vm.name}</span>
                    <Tag>{vm.image}</Tag>
                    <span className={styles.vmSpecs}>
                      {vm.cpu}C / {vm.memory}GB RAM / {vm.storage}GB
                      almacenamiento
                    </span>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {/* Navigation */}
          <div className={styles.stepActions}>
            <Space>
              {currentStep > 0 && (
                <Button onClick={handlePrev}>Anterior</Button>
              )}
              {currentStep < 2 && (
                <Button type="primary" onClick={handleNext}>
                  Siguiente
                </Button>
              )}
              {currentStep === 2 && (
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleCreate}
                >
                  Crear Slice
                </Button>
              )}
            </Space>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};

export default CreateSlice;
