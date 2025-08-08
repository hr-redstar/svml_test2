const express = require('express');

class HealthCheckServer {
  constructor(port = process.env.PORT || 8080) {
    this.port = port;
    this.app = express();
    this.setupRoutes();
  }

  setupRoutes() {
    // 健全性チェックエンドポイント
    this.app.get('/', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString()
      });
    });

    // 健全性チェック用エンドポイント
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'ok',
        uptime: process.uptime()
      });
    });

    // 準備完了チェック
    this.app.get('/ready', (req, res) => {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    });
  }

  start() {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, '0.0.0.0', (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`Health check server running on port ${this.port}`);
          resolve(this.server);
        }
      });

      // エラーハンドリング
      this.server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.warn(`Port ${this.port} is already in use`);
          reject(error);
        } else {
          console.error('Health check server error:', error);
          reject(error);
        }
      });
    });
  }

  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(resolve);
      } else {
        resolve();
      }
    });
  }
}

module.exports = HealthCheckServer;
