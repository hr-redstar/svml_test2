const { Events } = require('discord.js');
const logger = require('../common/logger');
const performanceManager = require('../common/performance/performanceManager');

module.exports = {
  name: Events.MessageCreate,
  /**
   * メッセージが作成されたときに、登録されたすべてのメッセージハンドラを並列実行します。
   * @param {import('discord.js').Message} message
   */
  async execute(message) {
    // Bot自身のメッセージやDMは無視
    if (message.author.bot || !message.guild) return;

    // 登録されているすべてのメッセージハンドラを並列で実行（パフォーマンス最適化）
    const handlerTasks = message.client.messageHandlers.map(handler => ({
      name: handler.constructor.name,
      execute: () => handler.execute(message)
    }));

    const results = await performanceManager.executeParallel(handlerTasks, 5); // 最大5並列
    
    // エラーログ記録
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        logger.error(`MessageCreateハンドラの実行中にエラーが発生しました。`, { 
          handler: handlerTasks[index].name, 
          error: result.reason instanceof Error ? result.reason.message : String(result.reason)
        });
      }
    });
  },
};