import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { request } from '@umijs/max';
import { useModel } from '@umijs/max';
import { Button, Card, Col, Descriptions, Row, Spin, Statistic, Tag, message } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'umi';

type TopologyType = 'linear' | 'mesh' | 'tree' | 'ring' | 'bus' | string;

interface SliceRecord {
  id: string;
  ownerId: string;
  ownerName?: string;
  name: string;
  topologyType: TopologyType;
  status: 'pending' | 'running' | 'stopped' | 'error' | string;
  driver: string;
  availabilityZone: string | null;
  createdAt: string;
  vms?: Array<{
    id?: string;
    name?: string;
    status?: string;
    cpu?: number;
    ram_mb?: number;
    disk_gb?: number;
  }>;
}

const topologyLabels: Record<string, string> = {
  linear: 'Lineal',
  mesh: 'Malla',
  tree: 'Árbol',
  ring: 'Anillo',
  bus: 'Bus',
};

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  running: 'En ejecución',
  stopped: 'Detenido',
  error: 'Error',
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
    vms?: SliceRecord['vms'];
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
  vms: slice.vms ?? [],
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

const SliceDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { initialState } = useModel('@@initialState');
  const [slice, setSlice] = useState<SliceRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const currentUserId =
      initialState?.currentUser?.userid ??
      initialState?.currentUser?.name ??
      readStoredCurrentUser()?.userid;

    const loadSlice = async () => {
      setLoading(true);
      try {
        if (!currentUserId) {
          setSlice(null);
          return;
        }

        const payload = await request<SliceRecord[] | { data?: SliceRecord[] }>(`/api/users/${currentUserId}/slices`, {
          method: 'GET',
          signal: controller.signal,
          headers: { 'Cache-Control': 'no-cache' },
        });
        const records = (Array.isArray(payload) ? payload : payload.data ?? []).map(
          normalizeSlice,
        );
        const found = records.find((item) => item.id === id) ?? null;

        if (!found) {
          message.warning('No se encontró el slice solicitado');
        }

        setSlice(found);
      } catch {
        if (!controller.signal.aborted) {
          message.error('No se pudo cargar el slice');
          setSlice(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadSlice();

    return () => controller.abort();
  }, [id, initialState?.currentUser?.userid, initialState?.currentUser?.name]);

  const topologyLabel = useMemo(
    () =>
      topologyLabels[String(slice?.topologyType ?? '')] ??
      String(slice?.topologyType ?? 'N/D'),
    [slice?.topologyType],
  );

  const statusLabel = useMemo(
    () => statusLabels[slice?.status ?? ''] ?? slice?.status ?? 'N/D',
    [slice?.status],
  );

  const vmTotals = useMemo(() => {
    const vms = slice?.vms ?? [];
    return {
      count: vms.length,
      cpu: vms.reduce((sum, vm) => sum + Number(vm.cpu ?? 0), 0),
      ramMb: vms.reduce((sum, vm) => sum + Number(vm.ram_mb ?? 0), 0),
      diskGb: vms.reduce((sum, vm) => sum + Number(vm.disk_gb ?? 0), 0),
    };
  }, [slice?.vms]);

  return (
    <PageContainer
      header={{
        title: slice?.name ?? 'Detalle del Slice',
        breadcrumb: {
          items: [
            { title: 'Mis Slices', href: '/slices/list' },
            { title: slice?.name ?? id ?? 'Detalle' },
          ],
        },
        extra: [
          <Button key="back" icon={<ArrowLeftOutlined />} onClick={() => navigate('/slices/list')}>
            Volver
          </Button>,
          <Button
            key="edit"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/slices/${id}/edit`)}
            disabled={!slice}
          >
            Editar
          </Button>,
        ],
      }}
    >
      <Spin spinning={loading}>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="Estado" value={statusLabel} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="Topología" value={topologyLabel} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="Driver" value={slice?.driver ?? 'N/D'} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="Zona" value={slice?.availabilityZone ?? 'N/D'} />
            </Card>
          </Col>
        </Row>

        <Card title="Información del Slice">
          <Descriptions column={1} bordered>
            <Descriptions.Item label="ID">{slice?.id ?? id ?? 'N/D'}</Descriptions.Item>
            <Descriptions.Item label="Nombre">{slice?.name ?? 'N/D'}</Descriptions.Item>
            <Descriptions.Item label="Topología">
              <Tag color="blue">{topologyLabel}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Estado">
              <Tag color={slice?.status === 'running' ? 'green' : slice?.status === 'pending' ? 'gold' : slice?.status === 'error' ? 'volcano' : 'default'}>
                {statusLabel}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Driver">{slice?.driver ?? 'N/D'}</Descriptions.Item>
            <Descriptions.Item label="Zona de disponibilidad">{slice?.availabilityZone ?? 'N/D'}</Descriptions.Item>
              <Descriptions.Item label="Propietario">
                {formatOwnerLabel(String(slice?.ownerId ?? 'N/D'), initialState?.currentUser, slice?.ownerName)}
              </Descriptions.Item>
            <Descriptions.Item label="Creado">
                {slice?.createdAt ? new Date(slice.createdAt).toLocaleString('es-PE') : 'N/D'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="Recursos asignados" style={{ marginTop: 24 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12} lg={6}>
              <Statistic title="VMs" value={vmTotals.count} />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Statistic title="CPU total" value={vmTotals.cpu} suffix=" vCPUs" />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Statistic title="RAM total" value={vmTotals.ramMb} suffix=" MB" />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Statistic title="Disco total" value={vmTotals.diskGb} suffix=" GB" />
            </Col>
          </Row>

          <div style={{ marginTop: 16 }}>
            {slice?.vms?.length ? (
              slice.vms.map((vm) => (
                <p key={vm.id ?? vm.name} style={{ marginBottom: 8 }}>
                  - {vm.name ?? 'VM sin nombre'} ({vm.status ?? 'N/D'})
                </p>
              ))
            ) : (
              <p style={{ marginBottom: 0 }}>Este slice no trae VMs asociadas desde la API.</p>
            )}
          </div>
        </Card>
      </Spin>
    </PageContainer>
  );
};

export default SliceDetail;
