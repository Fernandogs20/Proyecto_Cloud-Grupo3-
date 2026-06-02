import {
  CopyOutlined,
  DeleteOutlined,
  DesktopOutlined,
  EditOutlined,
  EyeOutlined,
  MoreOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  PageContainer,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import {
  Button,
  Card,
  Col,
  Dropdown,
  type MenuProps,
  message,
  Popconfirm,
  Row,
  Space,
  Statistic,
  Tag,
  Tooltip,
} from 'antd';
import React, { useState } from 'react';
import { useNavigate } from 'umi';
import useStyles from './index.style';

interface SliceRecord {
  id: string;
  name: string;
  topology: 'linear' | 'mesh' | 'tree' | 'ring' | 'bus';
  status: 'running' | 'stopped' | 'creating' | 'error';
  vms: number;
  owner: string;
  createdAt: string;
  cpuUsage: number;
  memoryUsage: number;
  storageUsage: number;
}

const SliceList: React.FC = () => {
  const { styles } = useStyles();
  const navigate = useNavigate();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [slices, setSlices] = useState<SliceRecord[]>([
    {
      id: 'slice-001',
      name: 'Cluster de Producción',
      topology: 'mesh',
      status: 'running',
      vms: 12,
      owner: 'admin',
      createdAt: '2026-05-15',
      cpuUsage: 75,
      memoryUsage: 82,
      storageUsage: 45,
    },
    {
      id: 'slice-002',
      name: 'Entorno de Desarrollo',
      topology: 'linear',
      status: 'running',
      vms: 5,
      owner: 'admin',
      createdAt: '2026-05-10',
      cpuUsage: 32,
      memoryUsage: 48,
      storageUsage: 28,
    },
    {
      id: 'slice-003',
      name: 'Red de Pruebas',
      topology: 'tree',
      status: 'stopped',
      vms: 8,
      owner: 'admin',
      createdAt: '2026-04-20',
      cpuUsage: 0,
      memoryUsage: 0,
      storageUsage: 15,
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'green';
      case 'stopped':
        return 'red';
      case 'creating':
        return 'blue';
      case 'error':
        return 'volcano';
      default:
        return 'default';
    }
  };

  const getTopologyLabel = (topology: string) => {
    const labels: Record<string, string> = {
      linear: 'Lineal',
      mesh: 'Malla',
      tree: 'Árbol',
      ring: 'Anillo',
      bus: 'Bus',
    };
    return labels[topology] || topology;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      running: 'EN EJECUCIÓN',
      stopped: 'DETENIDO',
      creating: 'CREANDO',
      error: 'ERROR',
    };
    return labels[status] || status.toUpperCase();
  };

  const handleDelete = (id: string) => {
    setSlices((currentSlices) =>
      currentSlices.filter((slice) => slice.id !== id),
    );
    message.success(`Slice ${id} eliminado correctamente`);
  };

  const handleBatchDelete = () => {
    setSlices((currentSlices) =>
      currentSlices.filter((slice) => !selectedRowKeys.includes(slice.id)),
    );
    message.success(`${selectedRowKeys.length} slices eliminados`);
    setSelectedRowKeys([]);
  };

  const handleViewDetails = (id: string) => {
    navigate(`/slices/${id}`);
  };

  const handleEditSlice = (id: string) => {
    navigate(`/slices/${id}/edit`);
  };

  const columns: ProColumns<SliceRecord>[] = [
    {
      title: 'Nombre del Slice',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (text, record) => (
        <a onClick={() => handleViewDetails(record.id)}>
          <DesktopOutlined /> {text}
        </a>
      ),
    },
    {
      title: 'Topología',
      dataIndex: 'topology',
      key: 'topology',
      width: 120,
      render: (topology) => (
        <Tag color="blue">{getTopologyLabel(String(topology ?? ''))}</Tag>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(String(status ?? ''))}>
          {getStatusLabel(String(status ?? ''))}
        </Tag>
      ),
    },
    {
      title: 'VMs',
      dataIndex: 'vms',
      key: 'vms',
      width: 80,
      render: (vms) => <strong>{Number(vms ?? 0)}</strong>,
    },
    {
      title: 'Uso de CPU',
      dataIndex: 'cpuUsage',
      key: 'cpuUsage',
      width: 120,
      render: (usage) => `${Number(usage ?? 0)}%`,
    },
    {
      title: 'Uso de Memoria',
      dataIndex: 'memoryUsage',
      key: 'memoryUsage',
      width: 120,
      render: (usage) => `${Number(usage ?? 0)}%`,
    },
    {
      title: 'Creado',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 180,
      render: (_, record) => {
        const items: MenuProps['items'] = [
          {
            key: '1',
            icon: <EyeOutlined />,
            label: 'Ver detalles',
            onClick: () => handleViewDetails(record.id),
          },
          {
            key: '2',
            icon: <EditOutlined />,
            label: 'Editar',
            onClick: () => handleEditSlice(record.id),
          },
          {
            key: '3',
            icon: <CopyOutlined />,
            label: 'Clonar',
          },
          {
            type: 'divider',
          },
          {
            key: '4',
            icon: <DeleteOutlined />,
            label: 'Eliminar',
            danger: true,
            onClick: () => handleDelete(record.id),
          },
        ];

        return (
          <Space size="small">
            <Tooltip title="Ver">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleViewDetails(record.id)}
              />
            </Tooltip>
            <Tooltip title="Editar">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditSlice(record.id)}
              />
            </Tooltip>
            <Dropdown menu={{ items }}>
              <Button type="text" size="small" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  return (
    <PageContainer
      header={{
        title: 'Mis Slices',
        breadcrumb: {},
        extra: [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/slices/create')}
          >
            Crear Slice
          </Button>,
        ],
      }}
    >
      <div className={styles.container}>
        {/* Statistics Cards */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total de Slices"
                value={slices.length}
                prefix={<DesktopOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="En ejecución"
                value={slices.filter((s) => s.status === 'running').length}
                styles={{ content: { color: '#52c41a' } }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total de VMs"
                value={slices.reduce((sum, s) => sum + s.vms, 0)}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Uso promedio de CPU"
                value={(
                  slices.reduce((sum, s) => sum + s.cpuUsage, 0) /
                  Math.max(slices.length, 1)
                ).toFixed(1)}
                suffix="%"
              />
            </Card>
          </Col>
        </Row>

        {/* Table */}
        <Card>
          <ProTable
            headerTitle="Slice"
            columns={columns}
            dataSource={slices}
            rowKey="id"
            search={false}
            toolBarRender={() => [
              selectedRowKeys.length > 0 && (
                <Popconfirm
                  key="delete-batch"
                  title="Eliminar slices"
                  description="¿Seguro que quieres eliminar los slices seleccionados?"
                  okText="Sí"
                  cancelText="No"
                  onConfirm={handleBatchDelete}
                >
                  <Button danger>
                    Eliminar seleccionados ({selectedRowKeys.length})
                  </Button>
                </Popconfirm>
              ),
            ]}
            rowSelection={rowSelection}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
            }}
          />
        </Card>
      </div>
    </PageContainer>
  );
};

export default SliceList;
