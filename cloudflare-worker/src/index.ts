import { Hono } from 'hono';
import { cors } from 'hono/cors';
import userRoutes from './routes/user';
import { corsOrigin } from './utils/cors';

const app = new Hono();

// CORS middleware
app.use(
  '/*',
  cors({
    origin: (origin) => (corsOrigin(origin) ? origin : ''),
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Mount routes under /api
app.route('/api', userRoutes);

// 404 handler with URL in message
app.notFound((c) => {
  const url = c.req.url;
  return c.json(
    {
      message: `Response status: 404, URL: ${url}`,
      success: false,
    },
    404,
  );
});

export default app;
