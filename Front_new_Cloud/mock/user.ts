import type { Request, Response } from 'express';

const { ANT_DESIGN_PRO_ONLY_DO_NOT_USE_IN_YOUR_PRODUCTION } = process.env;

const waitTime = (time: number = 100): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, time);
  });
};

const defaultUser = {
  name: 'Usuario',
  avatar:
    'https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*ck3jS4ll3rsAAAAAAAAAAAAADgCCAQ/original',
  userid: '00000001',
  email: 'usuario@local.dev',
  signature: 'Plataforma de slices',
  title: 'Usuario de la plataforma',
  group: 'Infraestructura virtualizada',
  access: '',
};

let access = ANT_DESIGN_PRO_ONLY_DO_NOT_USE_IN_YOUR_PRODUCTION === 'site' ? 'admin' : '';

const getAccess = () => {
  return access;
};

const getCurrentUser = () => {
  if (access === 'profesor') {
    return {
      ...defaultUser,
      name: 'Profesor Académico',
      userid: 'prof-0001',
      email: 'profesor@universidad.edu',
      title: 'Profesor',
      group: 'Coordinación Académica',
      signature: 'Supervisión y monitoreo de prácticas',
      access,
    };
  }
  return {
    ...defaultUser,
    access: getAccess(),
  };
};

export default {
  'GET /api/currentUser': (_req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    if (!getAccess()) {
      res.status(401).send({
        data: {
          isLogin: false,
        },
        errorCode: '401',
        errorMessage: 'Please login first!',
        success: true,
      });
      return;
    }
    res.send({
      success: true,
      data: getCurrentUser(),
    });
  },
  'GET /api/users': [
    {
      key: '1',
      name: 'John Brown',
      age: 32,
      address: 'New York No. 1 Lake Park',
    },
    {
      key: '2',
      name: 'Jim Green',
      age: 42,
      address: 'London No. 1 Lake Park',
    },
    {
      key: '3',
      name: 'Joe Black',
      age: 32,
      address: 'Sidney No. 1 Lake Park',
    },
  ],
  'POST /api/login/account': async (req: Request, res: Response) => {
    const { password, username, type } = req.body;
    await waitTime(2000);
    if (password === 'ant.design' && username === 'admin') {
      res.send({
        status: 'ok',
        type,
        currentAuthority: 'admin',
      });
      access = 'admin';
      return;
    }
    if (password === 'ant.design' && username === 'user') {
      res.send({
        status: 'ok',
        type,
        currentAuthority: 'user',
      });
      access = 'user';
      return;
    }
    if (password === 'ant.design' && username === 'profesor') {
      res.send({
        status: 'ok',
        type,
        currentAuthority: 'profesor',
      });
      access = 'profesor';
      return;
    }
    if (type === 'mobile') {
      res.send({
        status: 'ok',
        type,
        currentAuthority: 'admin',
      });
      access = 'admin';
      return;
    }

    res.send({
      status: 'error',
      type,
      currentAuthority: 'guest',
    });
    access = 'guest';
  },
  'POST /api/login/outLogin': (_req: Request, res: Response) => {
    access = '';
    res.send({ data: {}, success: true });
  },
  'GET /api/500': (_req: Request, res: Response) => {
    res.status(500).send({
      timestamp: 1513932555104,
      status: 500,
      error: 'error',
      message: 'error',
      path: '/base/category/list',
    });
  },
  'GET /api/404': (_req: Request, res: Response) => {
    res.status(404).send({
      timestamp: 1513932643431,
      status: 404,
      error: 'Not Found',
      message: 'No message available',
      path: '/base/category/list/2121212',
    });
  },
  'GET /api/403': (_req: Request, res: Response) => {
    res.status(403).send({
      timestamp: 1513932555104,
      status: 403,
      error: 'Forbidden',
      message: 'Forbidden',
      path: '/base/category/list',
    });
  },
  'GET /api/401': (_req: Request, res: Response) => {
    res.status(401).send({
      timestamp: 1513932555104,
      status: 401,
      error: 'Unauthorized',
      message: 'Unauthorized',
      path: '/base/category/list',
    });
  },

  'GET /api/login/captcha': async (_req: Request, res: Response) => {
    await waitTime(2000);
    return res.json('captcha-xxx');
  },
};
