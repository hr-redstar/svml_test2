// uriage_bot/handlers/uriage_handler.js - 売上報告ハンドラー

const logger = require('../../common/logger');

module.exports = {
  async execute(interaction) {
    logger.info(`[uriageHandler] 売上報告処理: ${interaction.customId}`);
    
    try {
      // 基本的なレスポンス
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '💰 売上報告機能は現在開発中です。',
          ephemeral: true
        });
      }
      
      return true;
      
    } catch (error) {
      logger.error('[uriageHandler] エラー:', error);
      
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: '❌ 売上報告処理でエラーが発生しました。',
            ephemeral: true
          });
        }
      } catch (replyError) {
        logger.error('[uriageHandler] レスポンスエラー:', replyError);
      }
      
      return true;
    }
  }
};
