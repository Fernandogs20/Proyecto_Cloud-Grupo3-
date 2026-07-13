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
import { request } from '@umijs/max';
import { useModel } from '@umijs/max';
import {
  Button,
  Card,
  Col,
  Dropdown,
  type MenuProps,
  Spin,
  message,
  Popconfirm,
  Row,
  Space,
  Statistic,
  Tag,
  Tooltip,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'umi';
import useStyles from './index.style';

interface SliceRecord {
  id: string;
  ownerId: string;
  ownerName?: string;
  name: string;
  topologyType: 'linear' | 'mesh' | 'tree' | 'ring' | 'bus' | string;
  status: 'pending' | 'running' | 'stopped' | 'error' | string;
  driver: string;
  availabilityZone: string | null;
  createdAt: string;
}

type SliceApiResponse =
  | SliceRecord[]
  | {
      success?: boolean;
      data?: SliceRecord[];
      message?: string;
    };

const currentUserStorageKey = 'pucp-current-user';

const readStoredCurrentUser = (): API.CurrentUser | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    const storedUser = window.localStorage.getItem(currentUserStorageKey);
    return storedUser ? (JSON.parse(storedUser) as API.CurrentUser) : undefined;
  } catch {
    return undefined;
  }
};

const normalizeSlice = (
  slice: Partial<SliceRecord> & {
    id?: string;
    owner_id?: string;
    topology_type?: string;
    availability_zone?: string | null;
    created_at?: string;
  },
): SliceRecord => ({
  id: slice.id ?? `slice-${Math.random().toString(36).slice(2, 9)}`,
  ownerId: slice.ownerId ?? slice.owner_id ?? 'N/D',
  ownerName: slice.ownerName,
  name: slice.name ?? 'Sin nombre',
  topologyType: slice.topologyType ?? slice.topology_type ?? 'linear',
  status: slice.status ?? 'pending',
  driver: slice.driver ?? 'N/D',
  availabilityZone: slice.availabilityZone ?? slice.availability_zone ?? null,
  createdAt: slice.createdAt ?? slice.created_at ?? new Date().toISOString(),
});

const formatOwnerLabel = (
  ownerId: string,
  currentUser?: API.CurrentUser,
  ownerName?: string,
) => {
  if (ownerName) {
    return ownerName;
  }

  if (currentUser?.userid === ownerId || currentUser?.name === ownerId) {
    return currentUser.name ?? currentUser.userid ?? ownerId;
  }

  return ownerId;
};

const SliceList: React.FC = () => {
  const { styles } = useStyles();
  const navigate = useNavigate();
  const { initialState } = useModel('@@initialState');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [slices, setSlices] = useState<SliceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'gold';
      case 'running':
        return 'green';
      case 'stopped':
        return 'red';
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
      pending: 'PENDIENTE',
      running: 'EN EJECUCIÓN',
      stopped: 'DETENIDO',
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
      dataIndex: 'topologyType',
      key: 'topologyType',
      width: 120,
      render: (topologyType) => (
        <Tag color="blue">{getTopologyLabel(String(topologyType ?? ''))}</Tag>
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
      title: 'Propietario',
      dataIndex: 'ownerId',
      key: 'ownerId',
      width: 140,
      render: (ownerId, record) =>
        formatOwnerLabel(String(ownerId ?? 'N/D'), initialState?.currentUser, record.ownerName),
    },
    {
      title: 'Driver',
      dataIndex: 'driver',
      key: 'driver',
      width: 140,
      render: (driver) => <Tag color="geekblue">{String(driver ?? 'N/D')}</Tag>,
    },
    {
      title: 'Zona',
      dataIndex: 'availabilityZone',
      key: 'availabilityZone',
      width: 140,
      render: (zone) => zone ?? 'N/D',
    },
    {
      title: 'Creado',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (value) => new Date(String(value ?? '')).toLocaleString('es-PE'),
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

  useEffect(() => {
    const controller = new AbortController();
    const currentUserId =
      initialState?.currentUser?.userid ??
      initialState?.currentUser?.name ??
      readStoredCurrentUser()?.userid;

    const loadSlices = async () => {
      setLoading(true);
      try {
        if (!currentUserId) {
          setSlices([]);
          return;
        }

        const payload = await request<SliceApiResponse>(
          `/api/users/${currentUserId}/slices`,
          {
            method: 'GET',
            signal: controller.signal,
            headers: { 'Cache-Control': 'no-cache' },
          },
        );
        const records = Array.isArray(payload)
          ? payload
          : payload.data ?? [];

        setSlices(records.map((slice) => normalizeSlice(slice)));
      } catch (error) {
        if (!controller.signal.aborted) {
          message.error('No se pudieron cargar los slices desde la API');
          setSlices([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadSlices();

    return () => controller.abort();
  }, [initialState?.currentUser?.userid, initialState?.currentUser?.name]);

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
                title="Pendientes"
                value={slices.filter((s) => s.status === 'pending').length}
                styles={{ content: { color: '#52c41a' } }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Con zona asignada"
                value={slices.filter((s) => Boolean(s.availabilityZone)).length}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Drivers distintos"
                value={new Set(slices.map((slice) => slice.driver)).size}
              />
            </Card>
          </Col>
        </Row>

        {/* Table */}
        <Card>
          <Spin spinning={loading}>
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
          </Spin>
        </Card>
      </div>
    </PageContainer>
  );
};

export default SliceList;
