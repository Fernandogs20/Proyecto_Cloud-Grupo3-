import { TestBrowser } from '@@/testBrowser';
import { render } from '@testing-library/react';
import React from 'react';

describe('Login Page', () => {
  it('shows the Spanish login form', async () => {
    const historyRef = React.createRef<any>();
    const rootContainer = render(
      <TestBrowser
        historyRef={historyRef}
        location={{
          pathname: '/user/login',
        }}
      />,
    );

    await rootContainer.findAllByText('Panel de Slices');

    expect(
      rootContainer.baseElement?.querySelector('.ant-pro-form-login-desc')
        ?.textContent,
    ).toBe('Plataforma de gestión de slices y máquinas virtuales');

    await rootContainer.findByPlaceholderText(
      'Usuario: admin, user o profesor',
    );
    await rootContainer.findByPlaceholderText('Contraseña: ant.design');

    rootContainer.unmount();
  });
});
