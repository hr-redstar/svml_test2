// common/cache/stateCache.js
const logger = require('../logger');

/**
 * インメモリ状態キャッシュ（TTL付き）
 * GCS API呼び出しを大幅削減
 */
class StateCache {
  constructor() {
    this.cache = new Map();
    this.ttl = 5 * 60 * 1000; // 5分TTL
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0
    };
    
    // 定期クリーンアップ
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000); // 1分ごと
  }

  /**
   * キャッシュからデータ取得
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // TTL期限チェック
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.evictions++;
      return null;
    }

    this.stats.hits++;
    entry.lastAccessed = Date.now();
    return entry.data;
  }

  /**
   * キャッシュにデータ設定
   */
  set(key, data, customTTL = null) {
    const ttl = customTTL || this.ttl;
    const now = Date.now();
    
    this.cache.set(key, {
      data: JSON.parse(JSON.stringify(data)), // ディープコピー
      expiry: now + ttl,
      createdAt: now,
      lastAccessed: now,
      accessCount: 0
    });

    this.stats.sets++;
    logger.debug(`[StateCache] キャッシュ設定: ${key} (TTL: ${ttl}ms)`);
  }

  /**
   * キャッシュ削除（状態更新時）
   */
  invalidate(key) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
      logger.debug(`[StateCache] キャッシュ無効化: ${key}`);
    }
  }

  /**
   * パターンによる一括無効化
   */
  invalidatePattern(pattern) {
    const regex = new RegExp(pattern);
    let invalidated = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    logger.debug(`[StateCache] パターン無効化: ${pattern} (${invalidated}件)`);
  }

  /**
   * 期限切れエントリのクリーンアップ
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
        cleaned++;
        this.stats.evictions++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`[StateCache] 期限切れエントリクリーンアップ: ${cleaned}件`);
    }
  }

  /**
   * キャッシュ統計取得
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(1)
      : 0;

    return {
      size: this.cache.size,
      hitRate: `${hitRate}%`,
      ...this.stats,
      memoryUsage: `${Math.round(JSON.stringify([...this.cache.entries()]).length / 1024)}KB`
    };
  }

  /**
   * 全キャッシュクリア
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    logger.info(`[StateCache] 全キャッシュクリア: ${size}件`);
  }

  /**
   * シャットダウン処理
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// シングルトンインスタンス
const stateCache = new StateCache();

module.exports = stateCache;
