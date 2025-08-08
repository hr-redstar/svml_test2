// common/utils/promiseUtils.js
const logger = require('../logger');

/**
 * 高性能Promise最適化ユーティリティ
 * バッチ処理、並列実行制限、リトライ機能
 */
class PromiseUtils {
  /**
   * 並列実行数制限付きバッチ処理
   * @param {Array} items 処理対象の配列
   * @param {Function} processor 各要素の処理関数
   * @param {number} concurrency 同時実行数
   * @param {number} batchSize バッチサイズ
   */
  static async batchProcess(items, processor, concurrency = 3, batchSize = 10) {
    const results = [];
    const errors = [];
    let processed = 0;

    logger.debug(`[PromiseUtils] バッチ処理開始: ${items.length}件 (並列度: ${concurrency}, バッチ: ${batchSize})`);
    const startTime = Date.now();

    // バッチに分割
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await this.limitConcurrency(
        batch.map((item, index) => async () => {
          try {
            const result = await processor(item, i + index);
            processed++;
            
            if (processed % 50 === 0) {
              logger.debug(`[PromiseUtils] 進捗: ${processed}/${items.length} (${Math.round(processed/items.length*100)}%)`);
            }
            
            return { success: true, data: result, index: i + index };
          } catch (error) {
            errors.push({ item, index: i + index, error });
            return { success: false, error, index: i + index };
          }
        }),
        concurrency
      );

      results.push(...batchResults);
    }

    const duration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    
    logger.info(`[PromiseUtils] バッチ処理完了: ${successCount}/${items.length}件成功 (${duration}ms)`);
    
    if (errors.length > 0) {
      logger.warn(`[PromiseUtils] ${errors.length}件のエラーが発生しました`, { 
        errors: errors.slice(0, 3) // 最初の3件のみログ出力
      });
    }

    return {
      results,
      errors,
      stats: {
        total: items.length,
        success: successCount,
        failed: errors.length,
        duration,
        throughput: Math.round(items.length / (duration / 1000))
      }
    };
  }

  /**
   * 同時実行数制限
   * @param {Array} tasks タスク関数の配列
   * @param {number} limit 同時実行数
   */
  static async limitConcurrency(tasks, limit) {
    const results = [];
    const executing = [];

    for (const task of tasks) {
      const promise = task().then(result => {
        executing.splice(executing.indexOf(promise), 1);
        return result;
      });

      results.push(promise);
      executing.push(promise);

      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }

    return Promise.all(results);
  }

  /**
   * 指数バックオフリトライ
   * @param {Function} fn 実行する関数
   * @param {number} maxRetries 最大リトライ回数
   * @param {number} baseDelay 基本遅延時間（ms）
   * @param {number} maxDelay 最大遅延時間（ms）
   */
  static async retryWithBackoff(fn, maxRetries = 3, baseDelay = 100, maxDelay = 5000) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt === maxRetries) {
          logger.error(`[PromiseUtils] 最大リトライ回数に達しました: ${maxRetries}回`, { error });
          throw error;
        }

        // 指数バックオフ計算
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        const jitter = Math.random() * 0.1 * delay; // ジッター追加
        const actualDelay = Math.floor(delay + jitter);

        logger.debug(`[PromiseUtils] リトライ ${attempt + 1}/${maxRetries} (${actualDelay}ms後)`, { error: error.message });
        await this.delay(actualDelay);
      }
    }
  }

  /**
   * タイムアウト付きPromise
   * @param {Promise} promise 元のPromise
   * @param {number} timeout タイムアウト時間（ms）
   * @param {string} errorMessage タイムアウト時のエラーメッセージ
   */
  static withTimeout(promise, timeout, errorMessage = 'Operation timed out') {
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error(errorMessage)), timeout);
      })
    ]);
  }

  /**
   * 遅延実行
   * @param {number} ms 遅延時間（ミリ秒）
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Promise結果のチャンク処理
   * @param {Array} promises Promise配列
   * @param {number} chunkSize チャンクサイズ
   */
  static async processInChunks(promises, chunkSize = 10) {
    const results = [];
    
    for (let i = 0; i < promises.length; i += chunkSize) {
      const chunk = promises.slice(i, i + chunkSize);
      const chunkResults = await Promise.allSettled(chunk);
      results.push(...chunkResults);
      
      // チャンク間の小休止（メモリ圧迫回避）
      if (i + chunkSize < promises.length) {
        await this.delay(10);
      }
    }

    return results;
  }

  /**
   * 条件待ち（ポーリング）
   * @param {Function} condition 条件関数
   * @param {number} interval チェック間隔（ms）
   * @param {number} timeout タイムアウト時間（ms）
   */
  static async waitForCondition(condition, interval = 100, timeout = 10000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return true;
      }
      await this.delay(interval);
    }

    throw new Error(`Condition not met within ${timeout}ms`);
  }

  /**
   * デバウンスされたPromise実行
   * @param {Function} fn 実行する関数
   * @param {number} delay 遅延時間（ms）
   */
  static debounce(fn, delay) {
    let timeoutId;
    let resolvePromise;
    let rejectPromise;

    return function(...args) {
      return new Promise((resolve, reject) => {
        // 既存のタイマーをクリア
        clearTimeout(timeoutId);

        // 前のPromiseを拒否
        if (rejectPromise) {
          rejectPromise(new Error('Debounced'));
        }

        resolvePromise = resolve;
        rejectPromise = reject;

        timeoutId = setTimeout(async () => {
          try {
            const result = await fn.apply(this, args);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, delay);
      });
    };
  }

  /**
   * レート制限付き実行
   * @param {Array} tasks タスク配列
   * @param {number} rateLimit 1秒あたりの実行数
   */
  static async rateLimit(tasks, rateLimit) {
    const interval = 1000 / rateLimit;
    const results = [];

    for (let i = 0; i < tasks.length; i++) {
      const startTime = Date.now();
      
      try {
        const result = await tasks[i]();
        results.push({ success: true, data: result });
      } catch (error) {
        results.push({ success: false, error });
      }

      // レート制限のための待機
      const elapsed = Date.now() - startTime;
      const waitTime = Math.max(0, interval - elapsed);
      
      if (waitTime > 0 && i < tasks.length - 1) {
        await this.delay(waitTime);
      }
    }

    return results;
  }
}

module.exports = PromiseUtils;
