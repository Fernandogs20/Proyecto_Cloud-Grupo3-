/**
 * @name Infraestructura Virtualizada - Rutas
 * @description Plataforma de gestión de slices/VMs - Vista de Usuario
 */
export default [
  // Auth routes (no layout)
  {
    path: '/user',
    layout: false,
    routes: [
      {
        path: '/user/login',
        name: 'login',
        component: './user/login',
      },
      {
        path: '/user',
        redirect: '/user/login',
      },
      {
        name: '404',
        component: './exception/404',
        path: '/user/*',
      },
    ],
  },

  {
    path: '/home',
    name: 'home',
    icon: 'home',
    access: 'canStudent',
    component: './home',
  },

  {
    path: '/admin',
    name: 'admin',
    icon: 'control',
    access: 'canAdmin',
    routes: [
      {
        path: '/admin',
        redirect: '/admin/dashboard',
      },
      {
        name: 'dashboard',
        icon: 'dashboard',
        path: '/admin/dashboard',
        component: './admin-panel/dashboard',
      },
      {
        name: 'infrastructure',
        icon: 'cluster',
        path: '/admin/infrastructure',
        component: './admin-panel/infrastructure',
      },
      {
        name: 'images',
        icon: 'file',
        path: '/admin/images',
        component: './admin-panel/images',
      },
      {
        name: 'networks',
        icon: 'global',
        path: '/admin/networks',
        component: './admin-panel/networks',
      },
      {
        name: 'resources',
        icon: 'hdd',
        path: '/admin/resources',
        component: './admin-panel/resources',
      },
      {
        name: 'quotas',
        icon: 'safety',
        path: '/admin/quotas',
        component: './admin-panel/quotas',
      },
      {
        name: 'policies',
        icon: 'profile',
        path: '/admin/policies',
        component: './admin-panel/policies',
      },
      {
        name: 'logs',
        icon: 'fileSearch',
        path: '/admin/logs',
        component: './admin-panel/logs',
      },
    ],
  },

  {
    path: '/professor',
    name: 'professor',
    icon: 'team',
    access: 'canProfessor',
    routes: [
      {
        path: '/professor',
        redirect: '/professor/monitoring',
      },
      {
        name: 'monitoring',
        icon: 'dashboard',
        path: '/professor/monitoring',
        component: './professor/monitoring',
      },
      {
        name: 'topologies',
        icon: 'cluster',
        path: '/professor/topologies',
        component: './professor/topologies',
      },
      {
        name: 'examples',
        icon: 'plus',
        path: '/professor/examples',
        component: './professor/examples',
      },
      {
        name: 'templates',
        icon: 'profile',
        path: '/professor/templates',
        component: './professor/templates',
      },
      {
        name: 'access',
        icon: 'safety',
        path: '/professor/access',
        component: './professor/access',
      },
    ],
  },

  // Slices - Gestión de máquinas virtuales
  {
    path: '/slices',
    redirect: '/slices/list',
    access: 'canStudent',
    hideInMenu: true,
  },
  {
    name: 'slices.list',
    icon: 'cluster',
    path: '/slices/list',
    access: 'canStudent',
    component: './slices/list',
  },
  {
    name: 'slices.create',
    icon: 'plus',
    path: '/slices/create',
    access: 'canStudent',
    component: './slices/create',
  },
  {
    name: 'slices.detail',
    path: '/slices/:id',
    access: 'canStudent',
    component: './slices/detail',
    hideInMenu: true,
  },
  {
    name: 'slices.edit',
    path: '/slices/:id/edit',
    access: 'canStudent',
    component: './slices/edit',
    hideInMenu: true,
  },

  // Recursos - Consumo, imágenes y credenciales
  {
    path: '/user-resources',
    name: 'resources',
    icon: 'hdd',
    access: 'canProfessorOrStudent',
    routes: [
      {
        path: '/user-resources',
        redirect: '/user-resources/consumption',
      },
      {
        name: 'consumption',
        icon: 'barChart',
        path: '/user-resources/consumption',
        component: './user-resources/consumption',
      },
      {
        name: 'images',
        icon: 'file',
        path: '/user-resources/images',
        component: './user-resources/images',
      },
      {
        name: 'templates',
        icon: 'profile',
        path: '/user-resources/templates',
        component: './user-resources/templates',
      },
      {
        name: 'console',
        icon: 'code',
        path: '/user-resources/console',
        component: './user-resources/console',
      },
    ],
  },

  // Default redirect y 404
  {
    path: '/',
    component: './role-redirect',
  },
  {
    component: './exception/404',
    path: '/*',
  },
];
