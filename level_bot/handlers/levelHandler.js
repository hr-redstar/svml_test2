// level_bot/handlers/levelHandler.js - レベルシステムハンドラー

const logger = require('../../common/logger');

module.exports = {
  async execute(interaction) {
    logger.info(`[levelHandler] レベルシステム処理: ${interaction.customId}`);
    
    try {
      // 基本的なレスポンス
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '📊 レベルシステム機能は現在開発中です。',
          ephemeral: true
        });
      }
      
      return true;
      
    } catch (error) {
      logger.error('[levelHandler] エラー:', error);
      
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: '❌ レベルシステム処理でエラーが発生しました。',
            ephemeral: true
          });
        }
      } catch (replyError) {
        logger.error('[levelHandler] レスポンスエラー:', replyError);
      }
      
      return true;
    }
  }
};
