// common/handlers/level_bot/handlerRegistry.js
const logger = require('../../logger');
const performanceManager = require('../../performance/performanceManager');

class LevelBotHandlerRegistry {
  constructor() {
    this.handlers = new Map();
    this.lazyHandlers = new Map();
    this.routingCache = new Map();
    this.handlerInstances = new WeakMap();
    this.usageStats = new Map();
    this.directRoutes = new Map();
    this.precompiledPatterns = [];
    this.prefixRoutes = new Map();
    this.initialized = false;
    this.loadTimes = new Map();

    this.stats = {
      routingHits: 0,
      routingMisses: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalExecutions: 0,
      averageExecutionTime: 0
    };
  }

  async initialize() {
    if (this.initialized) return;

    const startTime = Date.now();
    logger.info('[LevelBotHandlerRegistry] 🚀 Level Bot ハンドラーレジストリ初期化開始');

    try {
      const handlerDefinitions = [
        { name: 'level', path: '../../../level_bot/handlers/levelHandler', priority: 1 },
        { name: 'levelConfig', path: '../../../level_bot/handlers/levelConfigHandler', priority: 3 },
      ];

      await performanceManager.executeParallel(
        handlerDefinitions.map(def => () => this.defineLazyHandler(def.name, def.path, def.priority)),
        { maxConcurrency: 8 }
      );

      await this.buildOptimizedRoutingTable();

      await this.preloadCriticalHandlers();

      const initTime = Date.now() - startTime;
      this.initialized = true;

      logger.info(`[LevelBotHandlerRegistry] ✅ 初期化完了: ${this.lazyHandlers.size}ハンドラー定義 (${initTime}ms)`);

    } catch (error) {
      logger.error('[LevelBotHandlerRegistry] ❌ ハンドラー初期化エラー:', error);
      throw error;
    }
  }

  defineLazyHandler(name, modulePath, priority = 5) {
    this.lazyHandlers.set(name, {
      modulePath,
      priority,
      loaded: false,
      loadTime: null,
      usageCount: 0,
      handler: null,
      lastUsed: Date.now(),
      preloaded: false
    });
  }

  async buildOptimizedRoutingTable() {
    const buildStart = Date.now();

    const directMatches = new Map([
      ['level', 'level'],
      ['svml設定level', 'levelConfig'],
      ['level_up', 'level'],
    ]);

    this.directRoutes = directMatches;

    const prefixRoutes = new Map([
      ['level_', 'level'],
      ['xp_', 'level'],
      ['rank_', 'level'],
    ]);

    this.prefixRoutes = prefixRoutes;

    this.precompiledPatterns = [
      { pattern: /^(level|レベル|xp|rank)_/i, handler: 'level', priority: 1 },
    ];

    const buildTime = Date.now() - buildStart;
    logger.info(`[LevelBotHandlerRegistry] ⚡ ルーティングテーブル構築完了 (${buildTime}ms)`);
  }

  async preloadCriticalHandlers() {
    const criticalHandlers = ['level'];

    logger.info(`[LevelBotHandlerRegistry] 🔄 重要ハンドラーのプリロード開始: ${criticalHandlers.join(', ')}`);

    const preloadTasks = criticalHandlers.map(name => async () => {
      try {
        if (this.lazyHandlers.has(name)) {
          await this.getHandler(name);
          const lazyInfo = this.lazyHandlers.get(name);
          if (lazyInfo) {
            lazyInfo.preloaded = true;
          }
        }
      } catch (error) {
        logger.warn(`[LevelBotHandlerRegistry] プリロード失敗: ${name} - ${error.message}`);
      }
    });

    await performanceManager.executeParallel(preloadTasks, { maxConcurrency: 4 });
  }

  async getHandler(name) {
    const lazyInfo = this.lazyHandlers.get(name);
    if (!lazyInfo) {
      throw new Error(`Handler not found: ${name}`);
    }

    if (lazyInfo.loaded && lazyInfo.handler) {
      this.stats.cacheHits++;
      return lazyInfo.handler;
    }

    try {
      const loadStart = Date.now();
      const handler = require(lazyInfo.modulePath);
      const loadTime = Date.now() - loadStart;

      lazyInfo.handler = handler;
      lazyInfo.loaded = true;
      lazyInfo.loadTime = loadTime;

      this.updateUsageStats(name, loadTime);
      this.stats.cacheMisses++;

      logger.debug(`[LevelBotHandlerRegistry] ⚡ レイジーロード: ${name} (${loadTime}ms)`);

      return handler;

    } catch (error) {
      logger.error(`[LevelBotHandlerRegistry] ❌ ${name} 読み込みエラー:`, error);
      throw error;
    }
  }

  async routeInteractionHyperFast(interaction) {
    const routeStart = Date.now();
    const customId = interaction.customId || interaction.commandName || '';

    try {
      const cacheKey = `route_${customId}`;
      const cachedRoute = this.routingCache.get(cacheKey);
      if (cachedRoute) {
        this.stats.routingHits++;
        return await this.executeHandler(cachedRoute, interaction);
      }

      const directHandler = this.directRoutes.get(customId);
      if (directHandler) {
        logger.debug(`[LevelBotHandlerRegistry] 直接マッチング: ${customId} -> ${directHandler}`);
        this.routingCache.set(cacheKey, directHandler);
        this.stats.routingHits++;
        return await this.executeHandler(directHandler, interaction);
      }

      for (const [prefix, handlerName] of this.prefixRoutes) {
        if (customId.startsWith(prefix)) {
          logger.debug(`[LevelBotHandlerRegistry] プレフィックスマッチング: ${customId} -> ${handlerName} (プレフィックス: ${prefix})`);
          this.routingCache.set(cacheKey, handlerName);
          this.stats.routingHits++;
          return await this.executeHandler(handlerName, interaction);
        }
      }

      for (const { pattern, handler: handlerName } of this.precompiledPatterns) {
        if (pattern.test(customId)) {
          logger.debug(`[LevelBotHandlerRegistry] 正規表現マッチング: ${customId} -> ${handlerName}`);
          this.routingCache.set(cacheKey, handlerName);
          this.stats.routingMisses++;
          return await this.executeHandler(handlerName, interaction);
        }
      }

      const fallbackHandler = this.determineFallbackHandler(interaction);
      if (fallbackHandler) {
        logger.debug(`[LevelBotHandlerRegistry] フォールバック: ${customId} -> ${fallbackHandler}`);
        this.routingCache.set(cacheKey, fallbackHandler);
        return await this.executeHandler(fallbackHandler, interaction);
      }

      logger.warn(`[LevelBotHandlerRegistry] ハンドラーが見つかりません: ${customId}`);
      this.stats.routingMisses++;
      return {
        success: false,
        error: 'No matching handler found',
        route: null,
        handlerName: null,
        routingTime: Date.now() - routeStart
      };

    } catch (error) {
      const routingTime = Date.now() - routeStart;
      logger.error('[LevelBotHandlerRegistry] ルーティングエラー:', error);
      this.stats.routingMisses++;

      return {
        success: false,
        error: error.message,
        route: null,
        handlerName: null,
        routingTime
      };
    }
  }

  async executeHandler(handlerName, interaction) {
    const executeStart = Date.now();

    try {
      const handler = await this.getHandler(handlerName);

      if (!handler || typeof handler.execute !== 'function') {
        const executionTime = Date.now() - executeStart;
        logger.error(`[LevelBotHandlerRegistry] 無効なハンドラー: ${handlerName}`);
        return {
          success: false,
          error: `Handler ${handlerName} not found or invalid`,
          route: handlerName,
          handlerName,
          executionTime
        };
      }

      const result = await handler.execute(interaction);
      const executionTime = Date.now() - executeStart;

      if (performanceManager.metrics) {
        performanceManager.metrics.taskExecutions++;
        if (performanceManager.metrics.averageExecutionTime === 0) {
          performanceManager.metrics.averageExecutionTime = executionTime;
        } else {
          performanceManager.metrics.averageExecutionTime = 
            (performanceManager.metrics.averageExecutionTime + executionTime) / 2;
        }
      }
      this.stats.totalExecutions++;

      logger.debug(`[LevelBotHandlerRegistry] ✅ ${handlerName} 実行完了 (${executionTime}ms)`);

      return {
        success: true,
        result,
        route: handlerName,
        handlerName,
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - executeStart;
      logger.error(`[LevelBotHandlerRegistry] ${handlerName} 実行エラー:`, error);

      return {
        success: false,
        error: error.message,
        route: null,
        handlerName: null,
        executionTime
      };
    }
  }

  determineFallbackHandler(interaction) {
    // Level Bot specific fallback logic if any, otherwise return null
    return null;
  }

  updateUsageStats(handlerName, executionTime) {
    const current = this.usageStats.get(handlerName) || { count: 0, totalTime: 0, avgTime: 0 };
    current.count++;
    current.totalTime += executionTime;
    current.avgTime = current.totalTime / current.count;
    this.usageStats.set(handlerName, current);
  }

  getStats() {
    return {
      initialized: this.initialized,
      handlersLoaded: this.lazyHandlers.size,
      ...this.stats,
      cacheSize: this.routingCache.size
    };
  }
}

const levelBotHandlerRegistry = new LevelBotHandlerRegistry();
module.exports = levelBotHandlerRegistry;
