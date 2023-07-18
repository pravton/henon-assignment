const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
    })
  );
  app.use(
    '/hubapi',
    createProxyMiddleware({
      target: 'https://api.hubapi.com',
      changeOrigin: true,
      pathRewrite: {
        '^/hubapi': '',
      },
    })
  );
  app.use(
    '/xero',
    createProxyMiddleware({
      target: 'https://api.xero.com',
      changeOrigin: true,
      pathRewrite: {
        '^/xero': '',
      },
    })
  );
};