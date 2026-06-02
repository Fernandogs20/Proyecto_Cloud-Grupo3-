import { Link } from '@umijs/max';
import { Button, Card } from 'antd';
import React from 'react';

const Exception404: React.FC = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Card variant="borderless" style={{ maxWidth: 600 }}>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔍</div>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>404</h1>
          <p style={{ fontSize: '16px', color: '#666', marginBottom: '24px' }}>
            La página que buscas no existe.
          </p>
          <Link to="/" prefetch>
            <Button type="primary" size="large">
              Volver al inicio
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Exception404;
