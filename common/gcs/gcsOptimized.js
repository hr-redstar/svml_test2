// common/gcs/gcsOptimized.js
const { Storage } = require('@google-cloud/storage');
const logger = require('../logger');
const PromiseUtils = require('../utils/promiseUtils');

const bucketName = process.env.GCS_BUCKET_NAME;
if (!bucketName) {
  console.warn('[gcsOptimized] 警告: 環境変数 GCS_BUCKET_NAME が設定されていません。GCS最適化機能は無効化されます。');
  
  // GCS機能を無効化した場合のダミークラスをエクスポート
  class DummyGCSOptimized {
    async batchUpload() { console.warn('[gcsOptimized] GCS機能が無効です'); return []; }
    async batchDownload() { console.warn('[gcsOptimized] GCS機能が無効です'); return []; }
    async parallelExists() { console.warn('[gcsOptimized] GCS機能が無効です'); return []; }
  }
  
  module.exports = new DummyGCSOptimized();
  return;
}

/**
 * 高性能GCSユーティリティクラス
 * バッチ処理、並列最適化、キャッシュ機能付き
 */
class GCSOptimized {
  constructor() {
    try {
      logger.info('[GCSOptimized] GCSクライアント初期化開始');
      logger.info(`[GCSOptimized] 環境変数:
        GOOGLE_APPLICATION_CREDENTIALS=${process.env.GOOGLE_APPLICATION_CREDENTIALS}
        GCS_BUCKET_NAME=${bucketName}
        PROJECT_ID=${process.env.PROJECT_ID}
      `);
      
      this.storage = new Storage();
      this.bucket = this.storage.bucket(bucketName);
      logger.info('[GCSOptimized] GCSクライアント初期化成功');
    } catch (error) {
      logger.error('[GCSOptimized] GCSクライアント初期化エラー:', error);
      throw error;
    }
    
    // メタデータキャッシュ（1分TTL）
    this.metadataCache = new Map();
    this.metadataTTL = 60 * 1000;
    
    // 統計情報
    this.stats = {
      reads: 0,
      writes: 0,
      deletes: 0,
      batchOperations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0
    };
  }

  /**
   * バッチJSON読み込み（並列処理）
   * @param {Array<string>} filePaths ファイルパス配列
   * @param {number} concurrency 並列数
   * @returns {Promise<Object>} パス -> データのマップ
   */
  async batchReadJson(filePaths, concurrency = 5) {
    logger.debug(`[GCSOptimized] バッチ読み込み開始: ${filePaths.length}件`);
    const startTime = Date.now();

    const results = await PromiseUtils.batchProcess(
      filePaths,
      async (filePath) => {
        const data = await this.readJsonFromGCS(filePath);
        return { filePath, data };
      },
      concurrency,
      10 // バッチサイズ
    );

    const resultMap = {};
    const errors = [];

    results.results.forEach(result => {
      if (result.success) {
        resultMap[result.data.filePath] = result.data.data;
      } else {
        errors.push({ filePath: filePaths[result.index], error: result.error });
      }
    });

    this.stats.batchOperations++;
    const duration = Date.now() - startTime;
    
    logger.info(`[GCSOptimized] バッチ読み込み完了: ${Object.keys(resultMap).length}/${filePaths.length}件 (${duration}ms)`);
    
    if (errors.length > 0) {
      logger.warn(`[GCSOptimized] バッチ読み込みエラー: ${errors.length}件`, { errors: errors.slice(0, 3) });
    }

    return { data: resultMap, errors };
  }

  /**
   * バッチJSON書き込み（並列処理）
   * @param {Array<{filePath: string, data: object}>} operations 書き込み操作配列
   * @param {number} concurrency 並列数
   */
  async batchWriteJson(operations, concurrency = 3) {
    logger.debug(`[GCSOptimized] バッチ書き込み開始: ${operations.length}件`);
    const startTime = Date.now();

    const results = await PromiseUtils.batchProcess(
      operations,
      async ({ filePath, data }) => {
        await this.saveJsonToGCS(filePath, data);
        return filePath;
      },
      concurrency,
      5 // 書き込みは小さなバッチサイズ
    );

    this.stats.batchOperations++;
    const duration = Date.now() - startTime;
    const successCount = results.results.filter(r => r.success).length;
    
    logger.info(`[GCSOptimized] バッチ書き込み完了: ${successCount}/${operations.length}件 (${duration}ms)`);
    
    return results;
  }

  /**
   * 効率的なJSON読み込み（リトライ付き）
   */
  async readJsonFromGCS(filePath, defaultValue = null) {
    return PromiseUtils.retryWithBackoff(async () => {
      try {
        const file = this.bucket.file(filePath);
        
        // メタデータキャッシュチェック
        const cacheKey = `exists:${filePath}`;
        const cached = this.getFromCache(cacheKey);
        
        let exists;
        if (cached !== null) {
          exists = cached;
          this.stats.cacheHits++;
        } else {
          [exists] = await file.exists();
          this.setCache(cacheKey, exists);
          this.stats.cacheMisses++;
        }

        if (!exists) {
          return defaultValue;
        }

        const [content] = await file.download();
        this.stats.reads++;
        
        return JSON.parse(content.toString('utf8'));
      } catch (error) {
        if (error.code === 404) {
          return defaultValue;
        }
        this.stats.errors++;
        logger.error(`[GCSOptimized] 読み込みエラー: ${filePath}`, { error });
        throw error;
      }
    }, 3, 100, 2000);
  }

  /**
   * 効率的なJSON書き込み（リトライ付き）
   */
  async saveJsonToGCS(filePath, data) {
    return PromiseUtils.retryWithBackoff(async () => {
      try {
        const file = this.bucket.file(filePath);
        const content = JSON.stringify(data, null, 2);
        
        await file.save(content, {
          contentType: 'application/json',
          resumable: false,
          metadata: {
            cacheControl: 'no-cache',
            contentType: 'application/json',
            customTime: new Date().toISOString()
          }
        });

        this.stats.writes++;
        
        // キャッシュ更新
        this.setCache(`exists:${filePath}`, true);
        
        logger.debug(`[GCSOptimized] JSON保存完了: ${filePath}`);
        return true;
      } catch (error) {
        this.stats.errors++;
        logger.error(`[GCSOptimized] 保存エラー: ${filePath}`, { error });
        throw error;
      }
    }, 3, 100, 2000);
  }

  /**
   * 並列ファイル削除
   * @param {Array<string>} filePaths 削除対象パス配列
   * @param {number} concurrency 並列数
   */
  async batchDelete(filePaths, concurrency = 5) {
    logger.debug(`[GCSOptimized] バッチ削除開始: ${filePaths.length}件`);

    const results = await PromiseUtils.batchProcess(
      filePaths,
      async (filePath) => {
        await this.deleteFile(filePath);
        return filePath;
      },
      concurrency
    );

    const successCount = results.results.filter(r => r.success).length;
    logger.info(`[GCSOptimized] バッチ削除完了: ${successCount}/${filePaths.length}件`);
    
    return results;
  }

  /**
   * ファイル削除（単体）
   */
  async deleteFile(filePath) {
    try {
      await this.bucket.file(filePath).delete();
      this.stats.deletes++;
      
      // キャッシュ無効化
      this.invalidateCache(`exists:${filePath}`);
      
      logger.debug(`[GCSOptimized] ファイル削除: ${filePath}`);
      return true;
    } catch (error) {
      if (error.code === 404) {
        return true; // 既に存在しない場合は成功とみなす
      }
      this.stats.errors++;
      throw error;
    }
  }

  /**
   * プレフィックス検索（効率化）
   * @param {string} prefix 検索プレフィックス
   * @param {Object} options 検索オプション
   */
  async listFiles(prefix, options = {}) {
    try {
      const [files] = await this.bucket.getFiles({
        prefix,
        maxResults: options.maxResults || 1000,
        delimiter: options.delimiter,
        ...options
      });
      
      logger.debug(`[GCSOptimized] ファイル一覧取得: ${files.length}件 (prefix: ${prefix})`);
      return files;
    } catch (error) {
      this.stats.errors++;
      logger.error(`[GCSOptimized] ファイル一覧取得エラー: ${prefix}`, { error });
      throw error;
    }
  }

  /**
   * メタデータキャッシュ操作
   */
  getFromCache(key) {
    const entry = this.metadataCache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.metadataCache.delete(key);
      return null;
    }
    
    return entry.value;
  }

  setCache(key, value) {
    this.metadataCache.set(key, {
      value,
      expiry: Date.now() + this.metadataTTL
    });
  }

  invalidateCache(key) {
    this.metadataCache.delete(key);
  }

  /**
   * キャッシュクリーンアップ
   */
  cleanupCache() {
    const now = Date.now();
    for (const [key, entry] of this.metadataCache.entries()) {
      if (now > entry.expiry) {
        this.metadataCache.delete(key);
      }
    }
  }

  /**
   * 統計情報取得
   */
  getStats() {
    const cacheSize = this.metadataCache.size;
    const hitRate = this.stats.cacheHits + this.stats.cacheMisses > 0
      ? Math.round(this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) * 100)
      : 0;

    return {
      ...this.stats,
      cacheSize,
      cacheHitRate: `${hitRate}%`,
      cacheTTL: `${this.metadataTTL}ms`
    };
  }

  /**
   * リソースクリーンアップ
   */
  cleanup() {
    this.metadataCache.clear();
    logger.debug('[GCSOptimized] リソースクリーンアップ完了');
  }
}

// シングルトンインスタンス
const gcsOptimized = new GCSOptimized();

module.exports = gcsOptimized;
