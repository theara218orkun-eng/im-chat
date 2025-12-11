const path = require('path');

module.exports = {
  runtimeCompiler: true,
  devServer: {
    https: true,
    host: '0.0.0.0',
    port: '3001',
    // This setting is for the dev server's own hot-reload websocket
    client: {
      webSocketURL: 'wss://localhost:3001/ws',
    },
    proxy: {
      // WebSocket proxy
      '/wss': {
        target: 'ws://127.0.0.1:8282',
        ws: true,
        changeOrigin: true,
        secure: false,
        pathRewrite: {
          '^/wss': '/'
        }
      },
      // API proxy
      '/common': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  chainWebpack: config => {
    config.resolve.alias
      .set('@', path.resolve(__dirname, './src'))
  },
  publicPath: './',
  productionSourceMap: false
}
