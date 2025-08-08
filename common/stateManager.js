// common/stateManager.js
const { readJsonFromGCS, saveJsonToGCS } = require('./gcs/gcsUtils');
const logger = require('./logger');
const deepmerge = require('deepmerge');
const stateCache = require('./cache/stateCache');
const performanceManager = require('./performance/performanceManager');

/**
 * 高性能状態管理クラス（キャッシュ機能付き）
 * GCSからの読み書き、デフォルト値とのマージ、エラーハンドリング、キャッシュを共通化
 */
class StateManager {
  /**
   * @param {function(string): string} filePathTemplate ギルドIDを引数に取り、GCSのファイルパスを返す関数
   * @param {object} defaultState 機能ごとのデフォルト状態オブジェクト
   * @param {string} featureName ログ出力用の機能名
   * @param {number} cacheTTL キャッシュTTL（ミリ秒）
   */
  constructor(filePathTemplate, defaultState, featureName, cacheTTL = 5 * 60 * 1000) {
    if (!filePathTemplate || typeof filePathTemplate !== 'function') {
      throw new Error('filePathTemplate (function) is required.');
    }
    if (!defaultState || typeof defaultState !== 'object') {
      throw new Error('defaultState (object) is required.');
    }
    if (!featureName || typeof featureName !== 'string') {
      throw new Error('featureName (string) is required for logging.');
    }

    this.filePathTemplate = filePathTemplate;
    this.defaultState = defaultState;
    this.loggerPrefix = `[${featureName}StateManager]`;
    this.featureName = featureName;
    this.cacheTTL = cacheTTL;
    
    // 機能別のキャッシュキープレフィックス
    this.cacheKeyPrefix = `${featureName}:state:`;
  }

  /**
   * キャッシュキー生成
   */
  getCacheKey(guildId) {
    return `${this.cacheKeyPrefix}${guildId}`;
  }

  /**
   * 状態読み込み（キャッシュ優先・パフォーマンス最適化）
   */
  async readState(guildId) {
    const cacheKey = this.getCacheKey(guildId);
    const cachedState = stateCache.get(cacheKey);
    if (cachedState) {
      logger.debug(`${this.loggerPrefix} キャッシュから状態取得: ${guildId}`);
      return cachedState;
    }

    // GCSを有効化
    const filePath = this.filePathTemplate(guildId);
    try {
      const state = await readJsonFromGCS(filePath);
      const mergedState = deepmerge(this.defaultState, state || {});
      stateCache.set(cacheKey, mergedState, this.cacheTTL);
      return mergedState;
    } catch (error) {
      logger.error(`${this.loggerPrefix} GCSからの状態読み込みエラー: ${guildId}`, error);
      const defaultStateClone = JSON.parse(JSON.stringify(this.defaultState));
      stateCache.set(cacheKey, defaultStateClone, this.cacheTTL);
      return defaultStateClone;
    }
  }

  /**
   * 状態書き込み（キャッシュ無効化・バッチ処理対応）
   */
  async writeState(guildId, state) {
    // GCSを有効化
    const filePath = this.filePathTemplate(guildId);
    try {
      await saveJsonToGCS(filePath, state);
      const cacheKey = this.getCacheKey(guildId);
      stateCache.set(cacheKey, state, this.cacheTTL);
    } catch (error) {
      logger.error(`${this.loggerPrefix} GCSへの状態書き込みエラー: ${guildId}`, error);
      throw error;
    }
  }

  /**
   * 状態更新（アトミック操作・並列処理安全）
   */
  async updateState(guildId, updateFn) {
    console.log(`[StateManager] updateState開始: ${this.loggerPrefix}/${guildId}`);
    
    return await performanceManager.executeWithRetry(
      async () => {
        console.log(`[StateManager] 現在状態読み込み: ${this.loggerPrefix}/${guildId}`);
        const currentState = await this.readState(guildId);
        
        console.log(`[StateManager] updateFn実行: ${this.loggerPrefix}/${guildId}`);
        const newState = updateFn(currentState);
        
        console.log(`[StateManager] 状態書き込み開始: ${this.loggerPrefix}/${guildId}`);
        await this.writeState(guildId, newState);
        
        console.log(`[StateManager] updateState完了: ${this.loggerPrefix}/${guildId}`);
        return newState;
      },
      3, // 最大3回リトライ
      500 // 500msから開始
    );
  }

  /**
   * 複数状態の一括読み込み（並列処理）
   */
  async readMultipleStates(guildIds) {
    const tasks = guildIds.map(guildId => ({
      name: `readState-${guildId}`,
      execute: () => this.readState(guildId)
    }));

    const results = await performanceManager.executeParallel(tasks, 5); // 最大5並列
    const states = {};
    
    results.forEach((result, index) => {
      const guildId = guildIds[index];
      states[guildId] = result.status === 'fulfilled' ? result.value : this.defaultState;
    });

    return states;
  }

  /**
   * 複数状態の一括書き込み（バッチ処理）
   */
  async writeMultipleStates(stateMap) {
    const entries = Object.entries(stateMap);
    const tasks = entries.map(([guildId, state]) => ({
      name: `writeState-${guildId}`,
      execute: () => this.writeState(guildId, state)
    }));

    return await performanceManager.executeParallel(tasks, 3); // 最大3並列（書き込み負荷考慮）
  }

  /**
   * キャッシュ統計取得
   */
  getCacheStats() {
    return {
      feature: this.featureName,
      ...stateCache.getStats()
    };
  }

  /**
   * 機能固有のキャッシュクリア
   */
  clearCache(guildId = null) {
    if (guildId) {
      const cacheKey = this.getCacheKey(guildId);
      stateCache.invalidate(cacheKey);
      logger.info(`${this.loggerPrefix} ギルド ${guildId} のキャッシュをクリアしました`);
    } else {
      // 機能全体のキャッシュクリア
      stateCache.invalidatePattern(`^${this.cacheKeyPrefix}`);
      logger.info(`${this.loggerPrefix} 機能全体のキャッシュをクリアしました`);
    }
  }
}

module.exports = StateManager;