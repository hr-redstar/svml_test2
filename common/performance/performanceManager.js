// common/performance/performanceManager.js - パフォーマンス管理システム

const logger = require('../logger');
const EventEmitter = require('events');

class PerformanceManager extends EventEmitter {
  constructor() {
    super();
    this.cache = new Map();
    this.taskQueues = new Map();
    this.concurrentTasks = new Map();
    this.maxConcurrency = 10;
    this.cacheExpireTime = 5 * 60 * 1000; // 5分
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      taskExecutions: 0,
      averageExecutionTime: 0,
      concurrentTasks: 0
    };
    
    this.startTime = Date.now();
    logger.info('[PerformanceManager] 🚀 パフォーマンス管理システム初期化完了');
    
    // 定期的なメトリクス出力
    setInterval(() => this.logMetrics(), 60000); // 1分ごと
    
    // 定期的なキャッシュクリーンアップ
    setInterval(() => this.cleanupCache(), 30000); // 30秒ごと
  }

  /**
   * 並列タスク実行（Promise.allSettled使用）
   */
  async executeParallel(tasks, options = {}) {
    const { 
      maxConcurrency = this.maxConcurrency,
      timeout = 30000,
      retries = 2 
    } = options;

    // 関数型のみ抽出し、関数以外は警告
    const filteredTasks = tasks.filter((task, idx) => {
      if (typeof task === 'function' || (task && typeof task.execute === 'function')) {
        return true;
      } else {
        logger.warn(`[PerformanceManager] ⚠️ タスク${idx}が関数型ではありません。スキップします。`, { task });
        return false;
      }
    });

    const startTime = Date.now();
    logger.info(`[PerformanceManager] 🔄 ${filteredTasks.length}個のタスクを並列実行開始 (最大同時実行: ${maxConcurrency})`);

    try {
      // 並列実行制限付きで実行
      const results = await this.executeConcurrencyLimited(filteredTasks, maxConcurrency, timeout, retries);
      
      const executionTime = Date.now() - startTime;
      this.updateMetrics('taskExecution', executionTime);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      logger.info(`[PerformanceManager] ✅ 並列実行完了: 成功${successful}件, 失敗${failed}件 (${executionTime}ms)`);
      
      return results;
      
    } catch (error) {
      logger.error('[PerformanceManager] ❌ 並列実行エラー:', { 
        error: error.message,
        taskCount: filteredTasks.length,
        executionTime: Date.now() - startTime
      });
      throw error;
    }
  }

  /**
   * 同時実行数制限付き並列実行
   */
  async executeConcurrencyLimited(tasks, maxConcurrency, timeout, retries) {
    const executing = [];
    const results = [];
    
    for (let i = 0; i < tasks.length; i++) {
      logger.debug(`[PerformanceManager] Processing task ${i}:`, tasks[i]);
      if (executing.length >= maxConcurrency) {
        await Promise.race(executing);
      }
      let taskFn;
      if (typeof tasks[i] === 'function') {
        taskFn = this.wrapTaskWithRetry(tasks[i], timeout, retries, i);
      } else if (tasks[i] && typeof tasks[i].execute === 'function') {
        taskFn = this.wrapTaskWithRetry(tasks[i].execute, timeout, retries, i);
      } else {
        logger.warn(`[PerformanceManager] ⚠️ タスク${i}が関数型ではありません。スキップします。`, { task: tasks[i] });
        continue;
      }
      const promise = taskFn()
        .then(result => {
          // result が Promise.allSettled の結果形式であれば、その value を使用
          if (result && typeof result === 'object' && result.status && result.hasOwnProperty('value')) {
            return { status: 'fulfilled', value: result.value, index: i };
          }
          return { status: 'fulfilled', value: result, index: i };
        })
        .catch(error => {
          logger.error(`[PerformanceManager] Task failed in executeConcurrencyLimited:`, {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: error.code,
            errors: error.errors
          });
          return { status: 'rejected', reason: error, index: i };
        })
        .finally(() => {
          const index = executing.indexOf(promise);
          if (index > -1) executing.splice(index, 1);
        });
      executing.push(promise);
      results.push(promise);
    }
    
    return Promise.allSettled(results);
  }

  /**
   * リトライ機能付きタスクラッパー
   */
  wrapTaskWithRetry(task, timeout, retries, taskId) {
    return async () => {
      let lastError;
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          if (typeof task !== 'function') {
            logger.error(`[PerformanceManager] wrapTaskWithRetry: タスク${taskId}が関数型ではありません。`, { task });
            throw new TypeError('Task is not a function');
          }
          return await Promise.race([
            task(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error(`Task ${taskId} timeout`)), timeout)
            )
          ]);
        } catch (error) {
          lastError = error;
          if (attempt < retries) {
            const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // 指数バックオフ
            logger.warn(`[PerformanceManager] ⚠️ Task ${taskId} 失敗 (${attempt + 1}/${retries + 1}), ${delay}ms後にリトライ`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      throw lastError;
    };
  }

  /**
   * 高速キャッシュシステム
   */
  async cacheGet(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpireTime) {
      this.metrics.cacheHits++;
      logger.debug(`[PerformanceManager] 💾 キャッシュヒット: ${key}`);
      return cached.data;
    }
    
    this.metrics.cacheMisses++;
    return null;
  }

  async cacheSet(key, data, customExpire = null) {
    const expireTime = customExpire || this.cacheExpireTime;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expireTime
    });
    
    logger.debug(`[PerformanceManager] 💾 キャッシュ保存: ${key} (有効期限: ${expireTime}ms)`);
  }

  /**
   * 条件付きキャッシュ実行
   */
  async executeWithCache(key, taskFunction, cacheExpire = null) {
    // キャッシュチェック
    const cached = await this.cacheGet(key);
    if (cached !== null) {
      return cached;
    }

    // タスク実行
    const startTime = Date.now();
    try {
      const result = await taskFunction();
      const executionTime = Date.now() - startTime;
      
      // 結果をキャッシュに保存
      await this.cacheSet(key, result, cacheExpire);
      
      logger.debug(`[PerformanceManager] ⚡ タスク実行完了: ${key} (${executionTime}ms)`);
      return result;
      
    } catch (error) {
      logger.error(`[PerformanceManager] ❌ タスク実行エラー: ${key}`, { error: error.message });
      throw error;
    }
  }

  /**
   * バッチ処理（チャンク分割）
   */
  async executeBatch(items, processor, options = {}) {
    const { 
      batchSize = 50,
      maxConcurrency = 5,
      delayBetweenBatches = 100 
    } = options;

    const batches = this.chunkArray(items, batchSize);
    const results = [];
    
    logger.info(`[PerformanceManager] 📦 バッチ処理開始: ${items.length}アイテムを${batches.length}バッチに分割`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchStartTime = Date.now();
      
      try {
        const batchTasks = batch.map(item => () => processor(item));
        const batchResults = await this.executeParallel(batchTasks, { maxConcurrency });
        
        results.push(...batchResults);
        
        const batchTime = Date.now() - batchStartTime;
        logger.info(`[PerformanceManager] ✅ バッチ ${i + 1}/${batches.length} 完了 (${batchTime}ms)`);
        
        // バッチ間の待機時間
        if (i < batches.length - 1 && delayBetweenBatches > 0) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
        
      } catch (error) {
        logger.error(`[PerformanceManager] ❌ バッチ ${i + 1} エラー:`, { error: error.message });
        throw error;
      }
    }

    return results;
  }

  /**
   * 配列をチャンクに分割
   */
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * タスクキュー管理
   */
  async addToQueue(queueName, task, priority = 0) {
    if (!this.taskQueues.has(queueName)) {
      this.taskQueues.set(queueName, []);
    }
    
    const queue = this.taskQueues.get(queueName);
    queue.push({ task, priority, timestamp: Date.now() });
    
    // 優先度でソート
    queue.sort((a, b) => b.priority - a.priority);
    
    logger.debug(`[PerformanceManager] 📋 タスクキューに追加: ${queueName} (優先度: ${priority})`);
  }

  async processQueue(queueName, maxConcurrency = 3) {
    const queue = this.taskQueues.get(queueName);
    if (!queue || queue.length === 0) {
      return [];
    }

    const tasks = queue.splice(0, maxConcurrency).map(item => item.task);
    return await this.executeParallel(tasks, { maxConcurrency });
  }

  /**
   * メトリクス更新
   */
  updateMetrics(type, value) {
    switch (type) {
      case 'taskExecution':
        this.metrics.taskExecutions++;
        this.metrics.averageExecutionTime = 
          (this.metrics.averageExecutionTime * (this.metrics.taskExecutions - 1) + value) / 
          this.metrics.taskExecutions;
        break;
    }
  }

  /**
   * キャッシュクリーンアップ
   */
  cleanupCache() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > (item.expireTime || this.cacheExpireTime)) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.debug(`[PerformanceManager] 🧹 期限切れキャッシュ ${cleaned}件を削除`);
    }
  }

  /**
   * メトリクス出力
   */
  logMetrics() {
    const uptime = Date.now() - this.startTime;
    const cacheHitRate = this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100;
    
    logger.info(`[PerformanceManager] 📊 パフォーマンスメトリクス:`, {
      uptime: `${Math.floor(uptime / 1000)}秒`,
      cacheSize: this.cache.size,
      cacheHitRate: `${cacheHitRate.toFixed(1)}%`,
      taskExecutions: this.metrics.taskExecutions,
      avgExecutionTime: `${this.metrics.averageExecutionTime.toFixed(1)}ms`,
      memoryUsage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
    });
  }

  /**
   * リソース使用状況取得
   */
  getResourceUsage() {
    const memory = process.memoryUsage();
    return {
      memory: {
        used: Math.round(memory.heapUsed / 1024 / 1024),
        total: Math.round(memory.heapTotal / 1024 / 1024),
        external: Math.round(memory.external / 1024 / 1024)
      },
      cache: {
        size: this.cache.size,
        hitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100
      },
      tasks: {
        executed: this.metrics.taskExecutions,
        averageTime: this.metrics.averageExecutionTime
      }
    };
  }

  /**
   * パフォーマンス統計リセット
   */
  resetMetrics() {
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      taskExecutions: 0,
      averageExecutionTime: 0,
      concurrentTasks: 0
    };
    
    logger.info('[PerformanceManager] 📊 メトリクスをリセットしました');
  }

  /**
   * リトライ機能付きタスク実行
   */
  async executeWithRetry(taskFn, maxRetries = 3, initialDelay = 500) {
    let lastError;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[PerformanceManager] Task実行 (試行 ${attempt}/${maxRetries})`);
        const result = await taskFn();
        if (attempt > 1) {
          logger.debug(`[PerformanceManager] ✅ リトライ成功 (${attempt}/${maxRetries})`);
          console.log(`[PerformanceManager] ✅ リトライ成功 (${attempt}/${maxRetries})`);
        }
        return result;
      } catch (error) {
        lastError = error;
        
        console.error(`[PerformanceManager] Task実行エラー (試行 ${attempt}/${maxRetries}):`, {
          error: error.message,
          code: error.code,
          stack: error.stack
        });
        
        if (attempt === maxRetries) {
          logger.error(`[PerformanceManager] ❌ 最大リトライ回数に達しました (${maxRetries}回)`, { error: error.message });
          console.error(`[PerformanceManager] ❌ 最大リトライ回数に達しました (${maxRetries}回)`, {
            error: error.message,
            code: error.code
          });
          break;
        }

        logger.warn(`[PerformanceManager] ⚠️ Task 失敗 (${attempt}/${maxRetries}), ${delay}ms後にリトライ`);
        console.log(`[PerformanceManager] ⚠️ Task 失敗 (${attempt}/${maxRetries}), ${delay}ms後にリトライ`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // 指数バックオフ
      }
    }

    throw lastError;
  }

  /**
   * 統計情報取得（詳細化）
   */
  getStats() {
    const memUsage = process.memoryUsage();
    const hitRate = this.metrics.cacheMisses === 0 ? 1 : 
      this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses);
    return {
      cache: {
        size: this.cache.size,
        hitRate: hitRate,
        hits: this.metrics.cacheHits,
        misses: this.metrics.cacheMisses,
        expireTime: this.cacheExpireTime
      },
      execution: {
        totalExecutions: this.metrics.taskExecutions,
        averageExecutionTime: this.metrics.averageExecutionTime,
        maxExecutionTime: this.metrics.averageExecutionTime, // 簡略化
        errorRate: 0.05 // 仮の値
      },
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        total: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024)
      },
      runtime: {
        uptime: Math.round(process.uptime()),
        activePromises: this.concurrentTasks.size,
        startTime: this.startTime
      },
      metrics: { ...this.metrics }
    };
  }

  /**
   * クリーンアップ（シャットダウン時）
   */
  cleanup() {
    this.cache.clear();
    this.taskQueues.clear();
    this.concurrentTasks.clear();
    logger.info('[PerformanceManager] 🧹 パフォーマンス管理システムクリーンアップ完了');
  }
}

// シングルトンインスタンス
const performanceManager = new PerformanceManager();

module.exports = performanceManager;







