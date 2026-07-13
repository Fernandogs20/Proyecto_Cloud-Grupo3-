export const getRoleHomePath = (role?: string) => {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'profesor' || role === 'professor') return '/professor/monitoring';
  return '/home';
};
