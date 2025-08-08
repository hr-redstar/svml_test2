// keihi_bot/commands/svml-config-keihi.js - 経費bot専用設定コマンド

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const logger = require('../../common/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('svml設定経費')
    .setDescription('経費申請システムの設定・パネル設置を行います')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    try {
      logger.info(`[svml設定経費] 経費設定コマンド実行開始 - User: ${interaction.user.tag}, Guild: ${interaction.guildId}`);
      
      await interaction.deferReply({ flags: 0 }); // 全員に見える
      
      // 経費bot設定パネルを構築
      const embed = new EmbedBuilder()
        .setTitle('💰 経費申請システム設定')
        .setDescription('**経費申請システムの各種設定とパネル設置**\n\n' +
          '⚙️ 経費申請設定パネル設置\n' +
          '📄 経費CSV出力パネル設置\n' +
          '❓ 経費申請ヘルプパネル設置\n' +
          '📋 経費申請履歴パネル設置\n\n' +
          '各ボタンをクリックして必要なパネルを設置してください。')
        .setColor(0xff6b6b)
        .addFields(
          {
            name: '⚙️ 経費申請設定',
            value: '経費申請の各種設定を行うパネル',
            inline: true
          },
          {
            name: '📄 CSV出力パネル',
            value: '経費申請データをCSV形式で出力',
            inline: true
          },
          {
            name: '❓ ヘルプパネル',
            value: '経費申請の使い方とヘルプ',
            inline: true
          },
          {
            name: '📋 履歴パネル',
            value: '過去の経費申請履歴を表示',
            inline: true
          }
        )
        .setFooter({ text: 'パネル設置後、各パネルで詳細設定を行ってください' })
        .setTimestamp();

      const buttonRow1 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('keihi_config_setup_button')
            .setLabel('経費申請設定パネル設置')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('⚙️'),
          new ButtonBuilder()
            .setCustomId('keihi_csv_setup_button')
            .setLabel('CSV出力パネル設置')
            .setStyle(ButtonStyle.Success)
            .setEmoji('📄')
        );

      const buttonRow2 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('keihi_help_setup_button')
            .setLabel('ヘルプパネル設置')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('❓'),
          new ButtonBuilder()
            .setCustomId('keihi_history_setup_button')
            .setLabel('履歴パネル設置')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📋')
        );

      await interaction.editReply({
        embeds: [embed],
        components: [buttonRow1, buttonRow2]
      });
      
      logger.info(`[svml設定経費] 経費設定コマンド実行完了 - Guild: ${interaction.guildId}`);
      
    } catch (error) {
      logger.error(`[svml設定経費] 経費設定コマンド実行エラー - Guild: ${interaction.guildId}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        user: interaction.user.tag,
        guildId: interaction.guildId
      });
      
      try {
        const errorMessage = '❌ 経費設定パネルの表示に失敗しました。';
        
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
        logger.error(`[svml設定経費] エラー応答送信失敗:`, {
          error: replyError instanceof Error ? replyError.message : String(replyError),
          guildId: interaction.guildId
        });
      }
    }
  }
};
