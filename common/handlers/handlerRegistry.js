// common/handlers/handlerRegistry.js
const logger = require('../logger');
const configBotHandlerRegistry = require('./config_bot/handlerRegistry');
const hikkakeBotHandlerRegistry = require('./hikkake_bot/handlerRegistry');
// 他のBotのレジストリは必要に応じてアンコメント

class HandlerRegistry {
  constructor() {
    this.initialized = false;
    this.botRegistries = new Map(); // ボットごとのレジストリ管理
  }

  /**
   * 初期化
   */
  async initialize() {
    if (this.initialized) return;

    const startTime = Date.now();
    logger.info('[HandlerRegistry] 🚀 統合ハンドラーレジストリ初期化開始');

    try {
      // ボットレジストリ初期化＆登録
      await configBotHandlerRegistry.initialize();
      this.botRegistries.set('config_bot', configBotHandlerRegistry);

      // await keihiBotHandlerRegistry.initialize();
      // this.botRegistries.set('keihi_bot', keihiBotHandlerRegistry);

      // await uriageBotHandlerRegistry.initialize();
      // this.botRegistries.set('uriage_bot', uriageBotHandlerRegistry);

      // await syuttaikinBotHandlerRegistry.initialize();
      // this.botRegistries.set('syuttaikin_bot', syuttaikinBotHandlerRegistry);

      await hikkakeBotHandlerRegistry.initialize();
      this.botRegistries.set('hikkake_bot', hikkakeBotHandlerRegistry);

      // await levelBotHandlerRegistry.initialize();
      // this.botRegistries.set('level_bot', levelBotHandlerRegistry);

      // await kpiBotHandlerRegistry.initialize();
      // this.botRegistries.set('kpi_bot', kpiBotHandlerRegistry);

      this.initialized = true;
      logger.info(`[HandlerRegistry] ✅ 統合初期化完了 (${Date.now() - startTime}ms)`);
    } catch (error) {
      logger.error('[HandlerRegistry] ❌ 統合ハンドラー初期化エラー:', error);
      throw error;
    }
  }

  /**
   * インタラクションルーティング
   * 各ボットレジストリに処理委譲し、成功したら即返す
   * @param {import('discord.js').Interaction} interaction 
   * @returns {Promise<{success: boolean, error?: string, route?: any, handlerName?: string, routingTime: number}>}
   */
  async routeInteractionHyperFast(interaction) {
    const routeStart = Date.now();
    const customId = interaction.customId || interaction.commandName || '';

    for (const [botName, registry] of this.botRegistries) {
      try {
        const result = await registry.routeInteractionHyperFast(interaction);
        if (result?.success) {
          const elapsed = Date.now() - routeStart;
          logger.debug(`[HandlerRegistry] ルーティング成功: ${customId} → ${botName} (${elapsed}ms)`);
          return { ...result, routingTime: elapsed };
        }
      } catch (err) {
        logger.warn(`[HandlerRegistry] ルーティング中エラー (${botName}): ${err.message}`);
        // 続行して他botで試す
      }
    }

    const elapsed = Date.now() - routeStart;
    logger.warn(`[HandlerRegistry] ルーティング失敗: ${customId} (${elapsed}ms)`);
    return {
      success: false,
      error: 'No matching handler found in any bot registry',
      route: null,
      handlerName: null,
      routingTime: elapsed,
    };
  }

  /**
   * 統計取得
   * 各Botの統計を集計し返す
   */
  getStats() {
    const stats = {
      initialized: this.initialized,
      totalHandlersLoaded: 0,
      routingHits: 0,
      routingMisses: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalExecutions: 0,
      averageExecutionTime: 0,
      botSpecificStats: {},
    };

    for (const [botName, registry] of this.botRegistries) {
      const botStats = registry.getStats();

      stats.totalHandlersLoaded += botStats.handlersLoaded || 0;
      stats.routingHits += botStats.routingHits || 0;
      stats.routingMisses += botStats.routingMisses || 0;
      stats.cacheHits += botStats.cacheHits || 0;
      stats.cacheMisses += botStats.cacheMisses || 0;
      stats.totalExecutions += botStats.totalExecutions || 0;

      // 加重平均の計算（合計実行時間 = 実行回数 × 平均実行時間の和）
      const totalExec = stats.totalExecutions;
      if (totalExec > 0) {
        const prevTotalExec = totalExec - (botStats.totalExecutions || 0);
        const weightedAvg =
          ((stats.averageExecutionTime * prevTotalExec) + ((botStats.averageExecutionTime || 0) * (botStats.totalExecutions || 0))) /
          totalExec;
        stats.averageExecutionTime = weightedAvg;
      }

      stats.botSpecificStats[botName] = botStats;
    }

    return stats;
  }
}

const handlerRegistry = new HandlerRegistry();
module.exports = handlerRegistry;
