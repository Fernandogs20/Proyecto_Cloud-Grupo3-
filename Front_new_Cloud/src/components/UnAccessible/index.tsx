import { Button } from 'antd';
import { Link } from '@umijs/max';
import React from 'react';

export default () => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
      }}
    >
      <div style={{ textAlign: 'center', padding: '40px 20px', maxWidth: 600 }}>
        <div style={{ fontSize: '72px', marginBottom: '24px' }}>🔒</div>
        <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '16px', color: '#000' }}>
          403
        </h1>
        <p
          style={{
            fontSize: '18px',
            color: '#666',
            marginBottom: '32px',
            lineHeight: '1.6',
          }}
        >
          No tienes autorización para acceder a esta página.
        </p>
        <Link to="/" prefetch>
          <Button type="primary" size="large" style={{ minWidth: 200 }}>
            Volver al inicio
          </Button>
        </Link>
      </div>
    </div>
  );
};
