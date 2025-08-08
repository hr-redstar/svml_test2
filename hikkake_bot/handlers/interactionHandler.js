// 統合インタラクションハンドラー - 全てのインタラクションを統合処理
const buttonHandler = require('./buttonHandler');
const modalHandler = require('./modalHandler');
const selectHandler = require('./selectHandler');
const logger = require('../../common/logger');

module.exports = {
  /**
   * 全てのインタラクションを統合処理する
   * @param {import('discord.js').Interaction} interaction
   * @returns {Promise<void>}
   */
  async execute(interaction) {
    try {
      logger.debug('インタラクション受信:', {
        type: interaction.type,
        customId: interaction.customId || 'N/A',
        user: interaction.user.tag,
        guildId: interaction.guildId,
        channelId: interaction.channelId
      });

      // ボタンインタラクション
      if (interaction.isButton()) {
        const handled = await buttonHandler.execute(interaction);
        if (handled) {
          logger.debug('ボタンインタラクション処理完了:', {
            customId: interaction.customId,
            userId: interaction.user.id
          });
        }
        return;
      }

      // モーダルインタラクション
      if (interaction.isModalSubmit()) {
        const handled = await modalHandler.execute(interaction);
        if (handled) {
          logger.debug('モーダルインタラクション処理完了:', {
            customId: interaction.customId,
            userId: interaction.user.id
          });
        }
        return;
      }

      // セレクトメニューインタラクション
      if (interaction.isStringSelectMenu()) {
        const handled = await selectHandler.execute(interaction);
        if (handled) {
          logger.debug('セレクトメニューインタラクション処理完了:', {
            customId: interaction.customId,
            userId: interaction.user.id
          });
        }
        return;
      }

      // 処理されなかったインタラクション
      logger.warn('未処理のインタラクション:', {
        type: interaction.type,
        customId: interaction.customId || 'N/A',
        isButton: interaction.isButton(),
        isModal: interaction.isModalSubmit(),
        isSelect: interaction.isStringSelectMenu(),
        userId: interaction.user.id
      });

    } catch (error) {
      logger.error('インタラクション処理エラー:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        customId: interaction.customId,
        type: interaction.type,
        guildId: interaction.guildId,
        userId: interaction.user.id
      });

      // エラー時のフォールバック応答
      try {
        const errorMessage = '❌ 処理中にエラーが発生しました。しばらく時間をおいて再試行してください。';
        
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: errorMessage, ephemeral: true });
        } else if (interaction.deferred && !interaction.replied) {
          await interaction.editReply({ content: errorMessage });
        }
      } catch (replyError) {
        logger.error('エラー応答失敗:', {
          error: replyError instanceof Error ? replyError.message : String(replyError)
        });
      }
    }
  },

  /**
   * 指定されたインタラクションタイプが処理対象かチェック
   * @param {import('discord.js').Interaction} interaction
   * @returns {boolean}
   */
  canHandle(interaction) {
    return interaction.isButton() || 
           interaction.isModalSubmit() || 
           interaction.isStringSelectMenu();
  },

  /**
   * ハンドラーの統計情報を取得
   * @returns {object} 統計情報
   */
  getStats() {
    return {
      handlers: {
        button: 'buttonHandler.js',
        modal: 'modalHandler.js', 
        select: 'selectHandler.js'
      },
      lastUpdated: new Date().toISOString()
    };
  }
};
