# Panel de Slices

Panel web con acceso separado para administradores, profesores y usuarios.

## Requisitos

- Node.js 20 o superior
- npm

## Desarrollo local

```bash
npm install
npm start
```

La aplicación queda disponible en `http://localhost:8002`.

## Verificación

```bash
npm run lint
npx antd lint ./src
npm run test
npm run build
```

El Worker de Cloudflare se valida por separado:

```bash
cd cloudflare-worker
npm run typecheck
```
