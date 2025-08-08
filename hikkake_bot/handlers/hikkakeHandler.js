// hikkake_bot/handlers/hikkake_handler.js

const logger = require('../../common/logger');
const { MessageFlags } = require('discord.js');
const buttonHandler = require('../utils/hikkake_button_handler');
const modalHandler = require('../utils/hikkake_modal_handler');
const selectHandler = require('../utils/hikkake_select_handler');
// パネルの表示を更新するためのマネージャーを読み込みます。
// このファイルと関数が存在することを前提としています。
const { updatePanels } = require('../utils/panelStateManager');

module.exports = {
  /**
   * hikkake_bot関連のインタラクションを適切なハンドラに振り分けます。
   * @param {import('discord.js').Interaction} interaction
   * @returns {Promise<boolean>} 処理した場合はtrue
   */
  async execute(interaction) {
    // このハンドラは 'hikkake_' または 'cancel_order_' で始まるcustomIdを持つインタラクションのみを処理します。
    if (!interaction.customId || !(interaction.customId.startsWith('hikkake_') || interaction.customId.startsWith('cancel_order_'))) {
      return false;
    }

    try {
      let wasHandled = false;
      if (interaction.isButton()) {
        wasHandled = await buttonHandler.execute(interaction);
      }
      if (interaction.isModalSubmit()) {
        wasHandled = await modalHandler.execute(interaction);
      }
      if (interaction.isAnySelectMenu()) {
        wasHandled = await selectHandler.execute(interaction);
      }

      // モーダル送信など、データが変更される可能性のある操作が正常に処理された後、
      // 表示パネルを更新する処理を呼び出します。
      if (wasHandled && (interaction.isModalSubmit() || interaction.isAnySelectMenu())) {
        // ユーザーへの応答は各ハンドラで既に行われているため、ここでは待機せずに更新処理を実行します。
        updatePanels(interaction.client, interaction.guildId).catch(err => {
            logger.error(`[HikkakeHandler] パネルの自動更新に失敗しました。`, { error: err, guildId: interaction.guildId });
        });
      }
      return wasHandled;
    } catch (error) {
        logger.error(`[HikkakeHandler] インタラクション処理中にエラーが発生しました (ID: ${interaction.customId})`, { error });
        // ユーザーにエラーを通知
        if (interaction.isRepliable()) {
            const errorMessage = { content: '処理中にエラーが発生しました。管理者に連絡してください。', flags: MessageFlags.Ephemeral };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage).catch(() => {});
            } else {
                await interaction.reply(errorMessage).catch(() => {});
            }
        }
        return true; // エラーはこちらで処理済み
    }
  }
};