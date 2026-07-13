import { LogoutOutlined } from '@ant-design/icons';
import { history, useModel } from '@umijs/max';
import type { MenuProps } from 'antd';
import { Spin } from 'antd';
import React, { startTransition } from 'react';
import { outLogin } from '@/services/ant-design-pro/api';
import HeaderDropdown from '../HeaderDropdown';

type GlobalHeaderRightProps = {
  children?: React.ReactNode;
};

export const AvatarDropdown: React.FC<GlobalHeaderRightProps> = ({
  children,
}) => {
  const currentUserStorageKey = 'pucp-current-user';

  const loginOut = async () => {
    try {
      await outLogin({ skipErrorHandler: true });
    } catch {
      // Backend logout is optional; local session cleanup still continues.
    } finally {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(currentUserStorageKey);
      }
      startTransition(() => {
        setInitialState((s) => ({ ...s, currentUser: undefined }));
      });
    }
    const { search, pathname } = window.location;
    const urlParams = new URL(window.location.href).searchParams;
    const searchParams = new URLSearchParams({
      redirect: pathname + search,
    });
    const redirect = urlParams.get('redirect');
    if (window.location.pathname !== '/user/login' && !redirect) {
      history.replace({
        pathname: '/user/login',
        search: searchParams.toString(),
      });
    }
  };
  const { initialState, setInitialState } = useModel('@@initialState');

  const onMenuClick: MenuProps['onClick'] = (event) => {
    const { key } = event;
    if (key === 'logout') {
      loginOut();
      return;
    }
  };

  if (!initialState) {
    return <Spin size="small" />;
  }

  const { currentUser } = initialState;

  if (!currentUser) {
    return <Spin size="small" />;
  }

  // Map access level to role name
  const getRoleName = (access?: string): string => {
    const roleMap: Record<string, string> = {
      admin: 'Administrador',
      profesor: 'Profesor',
      user: 'Estudiante',
    };
    return roleMap[access ?? ''] || 'Usuario';
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'userInfo',
      label: (
        <div style={{ padding: '8px 0' }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
            {currentUser.name}
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {currentUser.email}
          </div>
          <div style={{ fontSize: '12px', color: '#1677ff', marginTop: '4px' }}>
            Rol: {getRoleName(currentUser.access)}
          </div>
        </div>
      ),
      disabled: true,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Cerrar sesión',
      danger: true,
    },
  ];

  return (
    <HeaderDropdown
      placement="bottomRight"
      menu={{
        selectedKeys: [],
        onClick: onMenuClick,
        items: menuItems,
      }}
      arrow
    >
      {children}
    </HeaderDropdown>
  );
};
