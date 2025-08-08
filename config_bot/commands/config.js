// config_bot/commands/config.js - SVMLの基本設定コマンド（コア機能のみ）

const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  Locale,
} = require('discord.js');
const logger = require('../../common/logger');
const configLogger = require('../../common/utils/configLogger');
const { updateState: updateConfigState } = require('../utils/configStateManager');
const { buildCoreConfigPanel } = require('../handlers/coreConfigHandler');

/**
 * コマンド実行ログを記録する
 * @param {import('discord.js').CommandInteraction} interaction - Discord インタラクション
 */
async function logCommandExecution(interaction) {
  try {
    const logEmbed = new EmbedBuilder()
      .setColor(0x808080) // Gray
      .setTitle('コマンド実行ログ')
      .setDescription(`**コマンド:** /${interaction.commandName}`)
      .addFields(
        { name: '実行者', value: `${interaction.user.tag} (${interaction.user.id})` },
        { name: 'ギルド', value: `${interaction.guild?.name ?? '不明'} (${interaction.guild?.id ?? '不明'})` }
      )
      .setTimestamp();

    await configLogger.logConfigChange(interaction, logEmbed);
    logger.info(`[CONFIG-CMD] ユーザー ${interaction.user.tag} (${interaction.user.id}) が /${interaction.commandName} を実行`);
  } catch (logError) {
    logger.error('[CONFIG-CMD-ERROR] ログ記録に失敗:', logError);
  }
}

/**
 * パネルメッセージIDを設定状態に保存する
 * @param {string} guildId - ギルドID
 * @param {import('discord.js').Message} message - 送信されたメッセージ
 */
async function savePanelMessageInfo(guildId, message) {
  try {
    await updateConfigState(guildId, state => {
      state.configPanelMessageId = message.id;
      state.configPanelChannelId = message.channelId;
      return state;
    });
    logger.debug(`[CONFIG-PANEL] パネル情報保存完了: ${guildId} - ${message.id}`);
  } catch (error) {
    logger.error('[CONFIG-PANEL-ERROR] パネル情報保存失敗:', error);
  }
}

/**
 * エラーレスポンスを送信する
 * @param {import('discord.js').CommandInteraction} interaction - Discord インタラクション
 * @param {Error} error - 発生したエラー
 */
async function sendErrorResponse(interaction, error) {
  logger.error('[CONFIG-ERROR] svml設定コマンドエラー:', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    guildId: interaction.guild?.id,
    guildName: interaction.guild?.name,
    userId: interaction.user.id,
    options: interaction.options?.data ?? [],
  });

  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({
        content: 'コマンドの実行中にエラーが発生しました。管理者にお問い合わせください。',
      });
    } else {
      await interaction.reply({
        content: 'コマンドの実行中にエラーが発生しました。管理者にお問い合わせください。',
        ephemeral: true,
      });
    }
  } catch (editError) {
    logger.error('[CONFIG-ERROR] エラーレスポンス送信失敗:', editError);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('svml設定')
    .setDescription('SVMLの基本設定（店舗名・役職・ログチャンネル）を行います')
    .setDescriptionLocalization(Locale.Japanese, 'SVMLの基本設定（店舗名・役職・ログチャンネル）を行います')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      // 応答準備（管理者のみに表示）
      await interaction.deferReply({ ephemeral: true });

      // コマンド実行ログ
      await logCommandExecution(interaction);

      // パネル構築
      let panelContent;
      try {
        panelContent = await buildCoreConfigPanel(interaction.guildId);
      } catch (panelError) {
        return await sendErrorResponse(interaction, panelError);
      }

      // パネル送信
      const panelMessage = await interaction.editReply(panelContent);

      // パネル情報保存
      await savePanelMessageInfo(interaction.guildId, panelMessage);

      logger.info(`[CONFIG-SUCCESS] パネル設置完了: ${interaction.guildId}`);

    } catch (error) {
      await sendErrorResponse(interaction, error);
    }
  }
};