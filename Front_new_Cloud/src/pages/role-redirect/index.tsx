import { useModel, useNavigate } from '@umijs/max';
import React from 'react';
import { getRoleHomePath } from '@/utils/roleRoutes';

const RoleRedirect: React.FC = () => {
  const navigate = useNavigate();
  const { initialState } = useModel('@@initialState');

  React.useEffect(() => {
    navigate(getRoleHomePath(initialState?.currentUser?.access), {
      replace: true,
    });
  }, [initialState?.currentUser?.access, navigate]);

  return null;
};

export default RoleRedirect;
