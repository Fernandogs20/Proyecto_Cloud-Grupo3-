export const getRoleHomePath = (role?: string) => {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'profesor') return '/professor/monitoring';
  return '/home';
};
