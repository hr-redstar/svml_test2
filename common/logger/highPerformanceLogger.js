// common/logger/highPerformanceLogger.js
const winston = require('winston');
const path = require('path');
const fs = require('fs');

/**
 * 高性能ロガークラス
 * バッファリング、非同期書き込み、メトリクス収集
 */
class HighPerformanceLogger {
  constructor() {
    this.logDir = path.join(__dirname, '..', '..', 'logs');
    this.ensureLogDir();
    
    // ログバッファ（メモリ効率化）
    this.logBuffer = [];
    this.bufferSize = 100;
    this.flushInterval = 5000; // 5秒
    
    // メトリクス
    this.metrics = {
      logsWritten: 0,
      errorsLogged: 0,
      bufferFlushes: 0,
      avgFlushTime: 0,
      totalFlushTime: 0
    };
    
    // レベル別カウンター
    this.levelCounts = {
      error: 0,
      warn: 0,
      info: 0,
      debug: 0
    };

    this.initializeLogger();
    this.startBufferFlusher();
  }

  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  initializeLogger() {
    // 高性能なトランスポート設定
    const transports = [
      // エラーログ（即座に書き込み）
      new winston.transports.File({
        filename: path.join(this.logDir, 'error.log'),
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        tailable: true
      }),

      // 一般ログ（バッファ経由）
      new winston.transports.File({
        filename: path.join(this.logDir, 'combined.log'),
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
        maxsize: 20 * 1024 * 1024, // 20MB
        maxFiles: 10,
        tailable: true
      })
    ];

    // 開発環境のみコンソール出力
    if (process.env.NODE_ENV !== 'production') {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.printf(this.devConsoleFormat)
          )
        })
      );
    }

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] })
      ),
      transports,
      // パフォーマンス重視の設定
      exitOnError: false,
      silent: false
    });
  }

  devConsoleFormat(info) {
    const { level, message, timestamp, metadata } = info;
    const ts = new Date(timestamp).toLocaleTimeString();
    
    let output = `\x1b[90m${ts}\x1b[0m ${level}: ${message}`;
    
    if (metadata && Object.keys(metadata).length > 0) {
      if (metadata.error) {
        output += `\n  \x1b[31m❌ ${metadata.error.message || metadata.error}\x1b[0m`;
      }
      
      const otherData = { ...metadata };
      delete otherData.error;
      
      if (Object.keys(otherData).length > 0) {
        output += `\n  \x1b[36m📊 ${JSON.stringify(otherData, null, 2)}\x1b[0m`;
      }
    }
    
    return output;
  }

  /**
   * バッファフラッシュの開始
   */
  startBufferFlusher() {
    this.flushTimer = setInterval(() => {
      this.flushBuffer();
    }, this.flushInterval);
  }

  /**
   * ログバッファの書き込み
   */
  async flushBuffer() {
    if (this.logBuffer.length === 0) return;

    const startTime = Date.now();
    const logsToFlush = this.logBuffer.splice(0, this.bufferSize);
    
    try {
      // 並列書き込み
      await Promise.all(
        logsToFlush.map(logEntry => 
          new Promise((resolve, reject) => {
            this.logger.log(logEntry, (error) => {
              if (error) reject(error);
              else resolve();
            });
          })
        )
      );

      this.metrics.logsWritten += logsToFlush.length;
      this.metrics.bufferFlushes++;
      
      const flushTime = Date.now() - startTime;
      this.metrics.totalFlushTime += flushTime;
      this.metrics.avgFlushTime = this.metrics.totalFlushTime / this.metrics.bufferFlushes;
      
    } catch (error) {
      this.metrics.errorsLogged++;
      // エラー時は直接ログ出力
      this.logger.error('ログバッファフラッシュエラー', { error });
    }
  }

  /**
   * 高性能ログ記録
   */
  log(level, message, metadata = {}) {
    this.levelCounts[level] = (this.levelCounts[level] || 0) + 1;

    const logEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...metadata
    };

    // エラーレベルは即座に書き込み
    if (level === 'error') {
      this.logger.error(message, metadata);
      this.metrics.errorsLogged++;
      return;
    }

    // その他はバッファリング
    this.logBuffer.push(logEntry);

    // バッファサイズ超過時は即座にフラッシュ
    if (this.logBuffer.length >= this.bufferSize) {
      this.flushBuffer();
    }
  }

  // レベル別メソッド
  error(message, metadata = {}) {
    this.log('error', message, metadata);
  }

  warn(message, metadata = {}) {
    this.log('warn', message, metadata);
  }

  info(message, metadata = {}) {
    this.log('info', message, metadata);
  }

  debug(message, metadata = {}) {
    this.log('debug', message, metadata);
  }

  /**
   * 構造化ログ（高性能バージョン）
   */
  logStructured(data) {
    const { level = 'info', message, ...metadata } = data;
    this.log(level, message, metadata);
  }

  /**
   * パフォーマンス測定ログ
   */
  logPerformance(operation, duration, details = {}) {
    this.info(`⚡ ${operation} 完了`, {
      duration: `${duration}ms`,
      performance: true,
      ...details
    });
  }

  /**
   * API呼び出しログ
   */
  logApiCall(method, endpoint, statusCode, duration, details = {}) {
    const level = statusCode >= 400 ? 'error' : 'info';
    this.log(level, `🌐 API ${method} ${endpoint}`, {
      statusCode,
      duration: `${duration}ms`,
      api: true,
      ...details
    });
  }

  /**
   * データベース操作ログ
   */
  logDbOperation(operation, table, duration, rowsAffected = null, details = {}) {
    this.info(`🗄️ DB ${operation} ${table}`, {
      duration: `${duration}ms`,
      rowsAffected,
      database: true,
      ...details
    });
  }

  /**
   * ユーザーアクション追跡
   */
  logUserAction(userId, action, details = {}) {
    this.info(`👤 ユーザーアクション: ${action}`, {
      userId,
      action,
      userAction: true,
      ...details
    });
  }

  /**
   * システムヘルス記録
   */
  logSystemHealth(metrics) {
    this.info('💻 システムヘルス', {
      ...metrics,
      systemHealth: true,
      timestamp: Date.now()
    });
  }

  /**
   * メトリクス取得
   */
  getMetrics() {
    return {
      ...this.metrics,
      levelCounts: { ...this.levelCounts },
      bufferSize: this.logBuffer.length,
      avgLogsPerFlush: this.metrics.bufferFlushes > 0 
        ? Math.round(this.metrics.logsWritten / this.metrics.bufferFlushes)
        : 0
    };
  }

  /**
   * ログレベル動的変更
   */
  setLogLevel(level) {
    this.logger.level = level;
    this.info(`ログレベル変更: ${level}`);
  }

  /**
   * 即座にバッファフラッシュ
   */
  async forceFlush() {
    await this.flushBuffer();
  }

  /**
   * クリーンアップ
   */
  async cleanup() {
    // タイマー停止
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    // 残りのバッファをフラッシュ
    await this.forceFlush();

    // Winstonロガークリーンアップ
    this.logger.close();
    
    this.info('ログシステムクリーンアップ完了');
  }
}

// シングルトンインスタンス
const highPerformanceLogger = new HighPerformanceLogger();

module.exports = highPerformanceLogger;
