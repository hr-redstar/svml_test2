// common/cache/connectionPool.js
const logger = require('../logger');

/**
 * データベース接続プール管理クラス
 * 接続の再利用とリソース効率化
 */
class ConnectionPool {
  constructor(maxConnections = 10, idleTimeout = 30000) {
    this.maxConnections = maxConnections;
    this.idleTimeout = idleTimeout;
    this.pool = [];
    this.activeConnections = new Set();
    this.waitingQueue = [];
    this.stats = {
      created: 0,
      reused: 0,
      destroyed: 0,
      timeouts: 0,
      queueWaits: 0
    };

    // 定期的なアイドル接続クリーンアップ
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleConnections();
    }, 10000); // 10秒ごと
  }

  /**
   * 接続取得（プールから再利用または新規作成）
   */
  async acquire() {
    // プールから利用可能な接続を取得
    if (this.pool.length > 0) {
      const connection = this.pool.pop();
      this.activeConnections.add(connection);
      this.stats.reused++;
      logger.debug(`[ConnectionPool] 接続再利用 (アクティブ: ${this.activeConnections.size})`);
      return connection;
    }

    // 最大接続数チェック
    if (this.activeConnections.size >= this.maxConnections) {
      // 待機キューに追加
      return new Promise((resolve, reject) => {
        this.waitingQueue.push({ resolve, reject, timestamp: Date.now() });
        this.stats.queueWaits++;
        logger.debug(`[ConnectionPool] 接続待機中 (キュー: ${this.waitingQueue.length})`);

        // タイムアウト設定
        setTimeout(() => {
          const index = this.waitingQueue.findIndex(item => item.resolve === resolve);
          if (index !== -1) {
            this.waitingQueue.splice(index, 1);
            this.stats.timeouts++;
            reject(new Error('Connection acquisition timeout'));
          }
        }, this.idleTimeout);
      });
    }

    // 新しい接続作成
    const connection = await this.createConnection();
    this.activeConnections.add(connection);
    this.stats.created++;
    logger.debug(`[ConnectionPool] 新規接続作成 (アクティブ: ${this.activeConnections.size})`);
    return connection;
  }

  /**
   * 接続解放（プールに戻す）
   */
  release(connection) {
    if (!this.activeConnections.has(connection)) {
      logger.warn('[ConnectionPool] 不明な接続の解放試行');
      return;
    }

    this.activeConnections.delete(connection);

    // 待機中のリクエストがあれば優先的に割り当て
    if (this.waitingQueue.length > 0) {
      const waiting = this.waitingQueue.shift();
      this.activeConnections.add(connection);
      waiting.resolve(connection);
      logger.debug(`[ConnectionPool] 待機リクエストに接続割り当て`);
      return;
    }

    // プールに戻す
    connection.lastUsed = Date.now();
    this.pool.push(connection);
    logger.debug(`[ConnectionPool] 接続をプールに戻しました (プール: ${this.pool.length})`);
  }

  /**
   * 新しい接続作成（オーバーライド用）
   */
  async createConnection() {
    // サブクラスで実装
    return {
      id: Math.random().toString(36).substring(2),
      createdAt: Date.now(),
      lastUsed: Date.now()
    };
  }

  /**
   * アイドル接続のクリーンアップ
   */
  cleanupIdleConnections() {
    const now = Date.now();
    const initialSize = this.pool.length;

    this.pool = this.pool.filter(connection => {
      const isIdle = (now - connection.lastUsed) > this.idleTimeout;
      if (isIdle) {
        this.destroyConnection(connection);
        this.stats.destroyed++;
        return false;
      }
      return true;
    });

    const cleaned = initialSize - this.pool.length;
    if (cleaned > 0) {
      logger.debug(`[ConnectionPool] アイドル接続クリーンアップ: ${cleaned}件`);
    }
  }

  /**
   * 接続破棄（オーバーライド用）
   */
  destroyConnection(connection) {
    // サブクラスで実装
    logger.debug(`[ConnectionPool] 接続破棄: ${connection.id}`);
  }

  /**
   * プール統計取得
   */
  getStats() {
    return {
      maxConnections: this.maxConnections,
      activeConnections: this.activeConnections.size,
      pooledConnections: this.pool.length,
      waitingRequests: this.waitingQueue.length,
      idleTimeout: `${this.idleTimeout}ms`,
      ...this.stats,
      efficiency: this.stats.created > 0 
        ? `${Math.round(this.stats.reused / (this.stats.created + this.stats.reused) * 100)}%`
        : '0%'
    };
  }

  /**
   * 全接続クローズ
   */
  async close() {
    // アクティブ接続の強制クローズ
    for (const connection of this.activeConnections) {
      this.destroyConnection(connection);
    }
    this.activeConnections.clear();

    // プール内接続のクローズ
    for (const connection of this.pool) {
      this.destroyConnection(connection);
    }
    this.pool.length = 0;

    // 待機中リクエストの拒否
    while (this.waitingQueue.length > 0) {
      const waiting = this.waitingQueue.shift();
      waiting.reject(new Error('Connection pool closed'));
    }

    // クリーンアップ間隔停止
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    logger.info('[ConnectionPool] 全接続クローズ完了');
  }
}

module.exports = ConnectionPool;
