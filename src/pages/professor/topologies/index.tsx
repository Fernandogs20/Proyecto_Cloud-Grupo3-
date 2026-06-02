import { EyeOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Button, Card, Col, Row, Tag } from 'antd';
import React from 'react';
import { useNavigate } from 'umi';

const topologies = [
  {
    id: 'slice-est-001',
    student: 'Ana Torres',
    slice: 'Práctica Malla',
    topology: 'Malla',
    nodes: ['VM 1', 'VM 2', 'VM 3', 'VM 4'],
  },
  {
    id: 'slice-est-002',
    student: 'Luis Rojas',
    slice: 'Laboratorio Lineal',
    topology: 'Lineal',
    nodes: ['VM 1', 'VM 2', 'VM 3'],
  },
  {
    id: 'slice-est-003',
    student: 'María Pérez',
    slice: 'Árbol de Servicios',
    topology: 'Árbol',
    nodes: ['VM 1', 'VM 2', 'VM 3', 'VM 4', 'VM 5'],
  },
];

const ProfessorTopologies: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageContainer header={{ title: 'Topologías desplegadas' }}>
      <Row gutter={[16, 16]}>
        {topologies.map((item) => (
          <Col xs={24} md={12} xl={8} key={item.id}>
            <Card
              title={item.slice}
              extra={<Tag color="blue">{item.topology}</Tag>}
              actions={[
                <Button
                  key="review"
                  type="link"
                  icon={<EyeOutlined />}
                  onClick={() => navigate('/slices/slice-001')}
                >
                  Revisar topología
                </Button>,
              ]}
            >
              <p>Estudiante: {item.student}</p>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  padding: 12,
                  borderRadius: 6,
                  background: '#f5f9ff',
                }}
              >
                {item.nodes.map((node) => (
                  <Tag color="processing" key={`${item.id}-${node}`}>
                    {node}
                  </Tag>
                ))}
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </PageContainer>
  );
};

export default ProfessorTopologies;
