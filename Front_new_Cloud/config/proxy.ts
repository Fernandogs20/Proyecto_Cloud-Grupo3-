/**
 * @name Proxy Configuration
 * @see Proxy cannot take effect in production environment
 * so there is no production environment configuration
 * For details, please see
 * https://pro.ant.design/docs/deploy
 *
 * @doc https://umijs.org/docs/guides/proxy
 */
export default {
  /**
   * @name Detailed proxy configuration
   * @doc https://github.com/chimurai/http-proxy-middleware
   */
  test: {
    // localhost:8000/api/** -> https://pro-api.ant-design-demo.workers.dev/api/**
    '/api/': {
      target: process.env.API_BASE_URL || 'http://localhost:4000',
      changeOrigin: true,
    },
  },
  pre: {
    '/api/': {
      target: process.env.API_BASE_URL || 'http://localhost:4000',
      changeOrigin: true,
    },
  },
};
