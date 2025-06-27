const path = require('path');
const common = require('./webpack.common.js');
const { merge } = require('webpack-merge');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
        ],
      },
    ],
  },
  devServer: {
    static: path.resolve(__dirname, 'dist'),
    port: 9000,
    hot: false,
    liveReload: false,
    open: false,
    compress: true,
    watchFiles: {
      paths: ['src/**/*'],
      options: {
        ignored: /node_modules/,
        usePolling: false,
      }
    },
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
      progress: false,
      reconnect: 3,
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    },
    historyApiFallback: {
      disableDotRule: true,
      index: '/index.html'
    },
    proxy: [
      {
        context: ['/v1'],
        target: 'https://story-api.dicoding.dev',
        changeOrigin: true,
        secure: true,
        logLevel: 'debug',
        onProxyReq: (proxyReq, req, res) => {

          proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
          proxyReq.setHeader('Accept', 'application/json, text/plain, */*');
          proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.9,id;q=0.8');
          proxyReq.setHeader('Accept-Encoding', 'gzip, deflate, br');
          proxyReq.setHeader('Cache-Control', 'no-cache');
          proxyReq.setHeader('Pragma', 'no-cache');
        },
        onProxyRes: (proxyRes, req, res) => {

          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
        },
        onError: (err, req, res) => {

        }
      }
    ],
  },
});
