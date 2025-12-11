const path = require('path');
module.exports = {
    runtimeCompiler: true,
    devServer: {
        server: {
            type: 'https',
        },
        host: '0.0.0.0',
        port: '3001',
        client: {
            webSocketURL: 'wss://localhost:3001/ws',
        },
        proxy: {
            '/wss': {
                target: 'http://127.0.0.1:8282',
                ws: true,
                changeOrigin: true
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