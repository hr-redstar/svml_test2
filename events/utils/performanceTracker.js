// events/utils/performanceTracker.js - パフォーマンス監視ユーティリティ
const logger = require('../../common/logger').createModuleLogger('performance-tracker');

/**
 * イベント実行時間を追跡し、パフォーマンス問題を検出します
 */
class PerformanceTracker {
  /**
   * イベントの実行時間を追跡
   * @param {string} eventName イベント名
   * @param {number} startTime 開始時間
   * @param {Object} additionalInfo 追加情報
   */
  static trackEventExecution(eventName, startTime, additionalInfo = {}) {
    const duration = Date.now() - startTime;
    
    // パフォーマンス閾値の設定
    const thresholds = {
      warning: 3000,  // 3秒
      critical: 10000 // 10秒
    };
    
    if (duration > thresholds.critical) {
      logger.error(`🚨 重大なパフォーマンス問題: ${eventName} (${duration}ms)`, additionalInfo);
    } else if (duration > thresholds.warning) {
      logger.warn(`⚠️ 重い処理検出: ${eventName} (${duration}ms)`, additionalInfo);
    } else {
      logger.debug(`⚡ ${eventName} 完了 (${duration}ms)`, additionalInfo);
    }
    
    return {
      eventName,
      duration,
      status: duration > thresholds.critical ? 'critical' : 
              duration > thresholds.warning ? 'warning' : 'normal',
      additionalInfo
    };
  }

  /**
   * メモリ使用量とパフォーマンスメトリクスをログ出力
   */
  static logSystemMetrics() {
    const usage = process.memoryUsage();
    const formatMB = (bytes) => Math.round(bytes / 1024 / 1024 * 100) / 100;
    
    const metrics = {
      memory: {
        rss: formatMB(usage.rss),
        heapUsed: formatMB(usage.heapUsed),
        heapTotal: formatMB(usage.heapTotal),
        external: formatMB(usage.external)
      },
      uptime: Math.floor(process.uptime()),
      cpuUsage: process.cpuUsage()
    };
    
    logger.info(`📊 システムメトリクス`, metrics);
    
    // メモリ使用量の警告
    if (metrics.memory.heapUsed > 800) {
      logger.warn(`⚠️ 高メモリ使用量: ${metrics.memory.heapUsed}MB`);
    }
    
    return metrics;
  }

  /**
   * 非同期処理のタイムアウト監視
   * @param {Promise} promise 監視対象のPromise
   * @param {number} timeout タイムアウト時間（ミリ秒）
   * @param {string} operationName 処理名
   */
  static async withTimeout(promise, timeout, operationName) {
    const startTime = Date.now();
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Timeout: ${operationName} exceeded ${timeout}ms`));
      }, timeout);
    });
    
    try {
      const result = await Promise.race([promise, timeoutPromise]);
      this.trackEventExecution(operationName, startTime, { status: 'success' });
      return result;
    } catch (error) {
      this.trackEventExecution(operationName, startTime, { 
        status: 'error', 
        error: error.message 
      });
      throw error;
    }
  }
}

module.exports = {
  PerformanceTracker
};