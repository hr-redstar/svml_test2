// common/monitoring/performanceMonitor.js
const logger = require('../logger');
const highPerformanceLogger = require('../logger/highPerformanceLogger');

/**
 * リアルタイムパフォーマンス監視システム
 * CPU、メモリ、応答時間、エラー率の追跡
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      // システムメトリクス
      cpu: {
        usage: 0,
        loadAverage: [0, 0, 0],
        history: []
      },
      memory: {
        used: 0,
        free: 0,
        total: 0,
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        history: []
      },
      // アプリケーションメトリクス
      requests: {
        total: 0,
        success: 0,
        errors: 0,
        avgResponseTime: 0,
        responseTimes: []
      },
      // 機能別メトリクス
      features: new Map(),
      // イベントループメトリクス
      eventLoop: {
        lag: 0,
        history: []
      }
    };

    this.thresholds = {
      cpu: 80,      // CPU使用率80%以上で警告
      memory: 85,   // メモリ使用率85%以上で警告
      responseTime: 1000, // 応答時間1秒以上で警告
      errorRate: 5  // エラー率5%以上で警告
    };

    this.alertHistory = [];
    this.isMonitoring = false;
    this.monitoringInterval = null;
    
    this.startMonitoring();
  }

  /**
   * 監視開始
   */
  startMonitoring() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    highPerformanceLogger.info('🚀 パフォーマンス監視開始');

    // メトリクス収集間隔：5秒
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, 5000);

    // イベントループラグ監視
    this.monitorEventLoop();
  }

  /**
   * システムメトリクス収集
   */
  collectMetrics() {
    try {
      this.collectCpuMetrics();
      this.collectMemoryMetrics();
      this.checkThresholds();
      this.cleanupHistory();
    } catch (error) {
      highPerformanceLogger.error('メトリクス収集エラー', { error });
    }
  }

  /**
   * CPU メトリクス収集
   */
  collectCpuMetrics() {
    const usage = process.cpuUsage();
    const loadAverage = require('os').loadavg();

    // CPU使用率計算（概算）
    const cpuPercent = (usage.user + usage.system) / 1000000; // マイクロ秒をミリ秒に変換

    this.metrics.cpu = {
      usage: Math.min(100, cpuPercent * 100), // パーセント表示
      loadAverage,
      history: this.addToHistory(this.metrics.cpu.history, cpuPercent * 100, 60) // 5分間の履歴
    };
  }

  /**
   * メモリメトリクス収集
   */
  collectMemoryMetrics() {
    const memUsage = process.memoryUsage();
    const totalMem = require('os').totalmem();
    const freeMem = require('os').freemem();
    const usedMem = totalMem - freeMem;

    this.metrics.memory = {
      used: usedMem,
      free: freeMem,
      total: totalMem,
      usagePercent: (usedMem / totalMem) * 100,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      heapPercent: (memUsage.heapUsed / memUsage.heapTotal) * 100,
      external: memUsage.external,
      history: this.addToHistory(this.metrics.memory.history, usedMem, 60)
    };
  }

  /**
   * イベントループラグ監視
   */
  monitorEventLoop() {
    const start = process.hrtime.bigint();
    
    setImmediate(() => {
      const lag = Number(process.hrtime.bigint() - start) / 1000000; // ナノ秒をミリ秒に変換
      
      this.metrics.eventLoop = {
        lag,
        history: this.addToHistory(this.metrics.eventLoop.history, lag, 60)
      };

      // 再帰的に監視継続
      if (this.isMonitoring) {
        setTimeout(() => this.monitorEventLoop(), 1000);
      }
    });
  }

  /**
   * リクエスト処理時間記録
   */
  recordRequest(responseTime, success = true) {
    this.metrics.requests.total++;
    if (success) {
      this.metrics.requests.success++;
    } else {
      this.metrics.requests.errors++;
    }

    // 応答時間履歴更新
    this.metrics.requests.responseTimes = this.addToHistory(
      this.metrics.requests.responseTimes, 
      responseTime, 
      100 // 直近100リクエストの履歴
    );

    // 平均応答時間計算
    const times = this.metrics.requests.responseTimes;
    this.metrics.requests.avgResponseTime = times.length > 0
      ? times.reduce((sum, time) => sum + time, 0) / times.length
      : 0;
  }

  /**
   * 機能別パフォーマンス記録
   */
  recordFeatureMetrics(featureName, operation, duration, success = true) {
    if (!this.metrics.features.has(featureName)) {
      this.metrics.features.set(featureName, {
        operations: 0,
        totalDuration: 0,
        avgDuration: 0,
        successCount: 0,
        errorCount: 0,
        lastUsed: Date.now()
      });
    }

    const feature = this.metrics.features.get(featureName);
    feature.operations++;
    feature.totalDuration += duration;
    feature.avgDuration = feature.totalDuration / feature.operations;
    feature.lastUsed = Date.now();

    if (success) {
      feature.successCount++;
    } else {
      feature.errorCount++;
    }

    highPerformanceLogger.logPerformance(`${featureName}.${operation}`, duration, {
      success,
      avgDuration: feature.avgDuration
    });
  }

  /**
   * 閾値チェックとアラート
   */
  checkThresholds() {
    const alerts = [];

    // CPU使用率チェック
    if (this.metrics.cpu.usage > this.thresholds.cpu) {
      alerts.push({
        type: 'cpu',
        level: 'warning',
        message: `CPU使用率が高い: ${this.metrics.cpu.usage.toFixed(1)}%`,
        value: this.metrics.cpu.usage,
        threshold: this.thresholds.cpu
      });
    }

    // メモリ使用率チェック
    if (this.metrics.memory.usagePercent > this.thresholds.memory) {
      alerts.push({
        type: 'memory',
        level: 'warning',
        message: `メモリ使用率が高い: ${this.metrics.memory.usagePercent.toFixed(1)}%`,
        value: this.metrics.memory.usagePercent,
        threshold: this.thresholds.memory
      });
    }

    // 応答時間チェック
    if (this.metrics.requests.avgResponseTime > this.thresholds.responseTime) {
      alerts.push({
        type: 'response_time',
        level: 'warning',
        message: `平均応答時間が長い: ${this.metrics.requests.avgResponseTime.toFixed(0)}ms`,
        value: this.metrics.requests.avgResponseTime,
        threshold: this.thresholds.responseTime
      });
    }

    // エラー率チェック
    const errorRate = this.metrics.requests.total > 0
      ? (this.metrics.requests.errors / this.metrics.requests.total) * 100
      : 0;
    
    if (errorRate > this.thresholds.errorRate) {
      alerts.push({
        type: 'error_rate',
        level: 'error',
        message: `エラー率が高い: ${errorRate.toFixed(1)}%`,
        value: errorRate,
        threshold: this.thresholds.errorRate
      });
    }

    // アラート発行
    alerts.forEach(alert => {
      this.sendAlert(alert);
    });
  }

  /**
   * アラート送信
   */
  sendAlert(alert) {
    // 重複アラート防止（10分間）
    const alertKey = `${alert.type}:${alert.level}`;
    const lastAlert = this.alertHistory.find(a => a.key === alertKey);
    const now = Date.now();

    if (lastAlert && (now - lastAlert.timestamp) < 600000) {
      return; // 10分以内の重複アラートはスキップ
    }

    // アラート履歴更新
    this.alertHistory = this.alertHistory.filter(a => (now - a.timestamp) < 3600000); // 1時間で履歴クリア
    this.alertHistory.push({
      key: alertKey,
      timestamp: now,
      ...alert
    });

    // ログ出力
    const logLevel = alert.level === 'error' ? 'error' : 'warn';
    highPerformanceLogger[logLevel](`🚨 ${alert.message}`, {
      type: alert.type,
      value: alert.value,
      threshold: alert.threshold,
      alert: true
    });
  }

  /**
   * 履歴データ管理
   */
  addToHistory(history, value, maxLength) {
    const newHistory = [...history, { timestamp: Date.now(), value }];
    return newHistory.slice(-maxLength); // 最新のmaxLength件のみ保持
  }

  /**
   * 古い履歴データクリーンアップ
   */
  cleanupHistory() {
    const oneHourAgo = Date.now() - 3600000; // 1時間前

    // CPU履歴クリーンアップ
    this.metrics.cpu.history = this.metrics.cpu.history.filter(
      entry => entry.timestamp > oneHourAgo
    );

    // メモリ履歴クリーンアップ
    this.metrics.memory.history = this.metrics.memory.history.filter(
      entry => entry.timestamp > oneHourAgo
    );

    // イベントループ履歴クリーンアップ
    this.metrics.eventLoop.history = this.metrics.eventLoop.history.filter(
      entry => entry.timestamp > oneHourAgo
    );
  }

  /**
   * パフォーマンスサマリー取得
   */
  getPerformanceSummary() {
    const now = Date.now();
    const errorRate = this.metrics.requests.total > 0
      ? (this.metrics.requests.errors / this.metrics.requests.total) * 100
      : 0;

    return {
      timestamp: now,
      system: {
        cpu: {
          current: `${this.metrics.cpu.usage.toFixed(1)}%`,
          status: this.metrics.cpu.usage > this.thresholds.cpu ? '⚠️' : '✅'
        },
        memory: {
          used: this.formatBytes(this.metrics.memory.used),
          percent: `${this.metrics.memory.usagePercent.toFixed(1)}%`,
          heap: `${this.formatBytes(this.metrics.memory.heapUsed)}/${this.formatBytes(this.metrics.memory.heapTotal)}`,
          status: this.metrics.memory.usagePercent > this.thresholds.memory ? '⚠️' : '✅'
        },
        eventLoop: {
          lag: `${this.metrics.eventLoop.lag.toFixed(2)}ms`,
          status: this.metrics.eventLoop.lag > 10 ? '⚠️' : '✅'
        }
      },
      application: {
        requests: {
          total: this.metrics.requests.total,
          success: this.metrics.requests.success,
          errors: this.metrics.requests.errors,
          errorRate: `${errorRate.toFixed(1)}%`,
          avgResponseTime: `${this.metrics.requests.avgResponseTime.toFixed(0)}ms`,
          status: errorRate > this.thresholds.errorRate ? '❌' : '✅'
        }
      },
      features: Array.from(this.metrics.features.entries()).map(([name, data]) => ({
        name,
        operations: data.operations,
        avgDuration: `${data.avgDuration.toFixed(0)}ms`,
        successRate: `${((data.successCount / data.operations) * 100).toFixed(1)}%`,
        lastUsed: new Date(data.lastUsed).toLocaleString()
      }))
    };
  }

  /**
   * 詳細メトリクス取得
   */
  getDetailedMetrics() {
    return {
      ...this.metrics,
      thresholds: this.thresholds,
      alertHistory: this.alertHistory,
      uptime: process.uptime()
    };
  }

  /**
   * 閾値設定更新
   */
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    highPerformanceLogger.info('パフォーマンス閾値更新', { thresholds: this.thresholds });
  }

  /**
   * バイト数フォーマット
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 監視停止
   */
  stopMonitoring() {
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    highPerformanceLogger.info('⏹️ パフォーマンス監視停止');
  }

  /**
   * 監視状態リセット
   */
  reset() {
    this.metrics.requests = {
      total: 0,
      success: 0,
      errors: 0,
      avgResponseTime: 0,
      responseTimes: []
    };
    
    this.metrics.features.clear();
    this.alertHistory = [];
    
    highPerformanceLogger.info('📊 パフォーマンスメトリクスリセット');
  }
}

// シングルトンインスタンス
const performanceMonitor = new PerformanceMonitor();

module.exports = performanceMonitor;
