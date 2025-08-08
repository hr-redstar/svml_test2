// syuttaikin_bot/commands/svml-config-syuttaikin.js - 出退勤bot専用設定コマンド

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const logger = require('../../common/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('svml設定出退勤')
    .setDescription('出退勤システムの設定・パネル設置を行います')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    try {
      logger.info(`[svml設定出退勤] 出退勤設定コマンド実行開始 - User: ${interaction.user.tag}, Guild: ${interaction.guildId}`);
      
      await interaction.deferReply({ flags: 0 }); // 全員に見える
      
      // 出退勤bot設定パネルを構築
      const embed = new EmbedBuilder()
        .setTitle('⏰ 出退勤システム設定')
        .setDescription('**出退勤システムの設定管理**\n\n' +
          '� **パネル設置機能**\n' +
          '• キャスト出退勤パネル設置\n' +
          '• 黒服出退勤パネル設置\n\n' +
          '⚙️ **ロール設定機能**\n' +
          '• キャストロール選択\n' +
          '• 黒服ロール選択\n\n' +
          '� **データ保存先**\n' +
          '• キャスト: `ギルドID/出退勤/キャスト/年月_出退勤.csv`\n' +
          '• 黒服: `ギルドID/出退勤/黒服/年月_出退勤.csv`')
        .setColor(0x00ff00)
        .setFooter({ text: '設定項目を選択してください' })
        .setTimestamp();

      const buttonRow1 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('syuttaikin_panel_cast')
            .setLabel('キャスト出退勤パネル設置')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('�'),
          new ButtonBuilder()
            .setCustomId('syuttaikin_role_cast')
            .setLabel('キャストロール選択')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🎭')
        );

      const buttonRow2 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('syuttaikin_panel_staff')
            .setLabel('黒服出退勤パネル設置')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🤵'),
          new ButtonBuilder()
            .setCustomId('syuttaikin_role_staff')
            .setLabel('黒服ロール選択')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('�')
        );

      await interaction.editReply({
        embeds: [embed],
        components: [buttonRow1, buttonRow2]
      });
      
      logger.info(`[svml設定出退勤] 出退勤設定コマンド実行完了 - Guild: ${interaction.guildId}`);
      
    } catch (error) {
      logger.error(`[svml設定出退勤] 出退勤設定コマンド実行エラー - Guild: ${interaction.guildId}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        user: interaction.user.tag,
        guildId: interaction.guildId
      });
      
      try {
        const errorMessage = '❌ 出退勤設定パネルの表示に失敗しました。';
        
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: errorMessage,
            flags: MessageFlags.Ephemeral
          });
        } else {
          await interaction.editReply({
            content: errorMessage
          });
        }
      } catch (replyError) {
        logger.error(`[svml設定出退勤] エラー応答送信失敗:`, {
          error: replyError instanceof Error ? replyError.message : String(replyError),
          guildId: interaction.guildId
        });
      }
    }
  }
};
