import {
  DeleteOutlined,
  DesktopOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Col, message, Row } from 'antd';
import React from 'react';
import { useNavigate } from 'umi';

const actionCardStyle: React.CSSProperties = {
  padding: '16px',
  textAlign: 'center',
  border: '1px solid #f0f0f0',
  borderRadius: '4px',
};

const actionIconStyle: React.CSSProperties = {
  fontSize: 32,
  marginBottom: '8px',
  display: 'block',
};

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageContainer header={{ title: 'Home', breadcrumb: {} }}>
      <Card title="Acciones disponibles">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={8}>
            <div
              style={{ ...actionCardStyle, cursor: 'pointer' }}
              onClick={() => navigate('/slices/create')}
            >
              <PlusOutlined style={{ ...actionIconStyle, color: '#1890ff' }} />
              <h4 style={{ marginTop: '8px' }}>Crear Slice</h4>
            </div>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <div style={actionCardStyle}>
              <EditOutlined style={{ ...actionIconStyle, color: '#faad14' }} />
              <h4 style={{ marginTop: '8px' }}>Editar y configurar</h4>
            </div>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <div
              style={{ ...actionCardStyle, cursor: 'pointer' }}
              onClick={() => navigate('/user-resources/templates')}
            >
              <DownloadOutlined
                style={{ ...actionIconStyle, color: '#52c41a' }}
              />
              <h4 style={{ marginTop: '8px' }}>Plantillas</h4>
            </div>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <div
              style={{ ...actionCardStyle, cursor: 'pointer' }}
              onClick={() => navigate('/user-resources/consumption')}
            >
              <DesktopOutlined
                style={{ ...actionIconStyle, color: '#13c2c2' }}
              />
              <h4 style={{ marginTop: '8px' }}>Monitoreo</h4>
            </div>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <div
              style={{ ...actionCardStyle, cursor: 'pointer' }}
              onClick={() => navigate('/user-resources/console')}
            >
              <EyeOutlined style={{ ...actionIconStyle, color: '#722ed1' }} />
              <h4 style={{ marginTop: '8px' }}>Consola</h4>
            </div>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <div
              style={{ ...actionCardStyle, cursor: 'pointer' }}
              onClick={() => message.info('Selecciona slices para eliminar')}
            >
              <DeleteOutlined
                style={{ ...actionIconStyle, color: '#f5222d' }}
              />
              <h4 style={{ marginTop: '8px' }}>Eliminar</h4>
            </div>
          </Col>
        </Row>
      </Card>
    </PageContainer>
  );
};

export default Home;
