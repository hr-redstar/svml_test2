// keihi_bot/commands/keihi-csv.js - CSV出力専用コマンド

const { 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  MessageFlags 
} = require('discord.js');
const { CSV_DAILY_BUTTON, CSV_MONTHLY_BUTTON, CSV_QUARTERLY_BUTTON } = require('../constants/customIds');
const logger = require('../../common/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('経費csv')
    .setDescription('経費申請データのCSV出力を行います')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      logger.info(`[経費CSV] コマンド実行 - User: ${interaction.user.tag}, Guild: ${interaction.guildId}`);
      
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      
      const embed = new EmbedBuilder()
        .setTitle('📊 経費申請CSV出力')
        .setDescription('**データ出力期間を選択してください**\n\n' +
          '📅 **日次**: 特定の日付のデータを出力\n' +
          '📆 **月次**: 月単位でのデータを統合出力\n' +
          '📊 **四半期**: 四半期単位でのデータを統合出力\n\n' +
          '選択後、利用可能な期間から出力したいデータを選択できます。')
        .setColor(0x00aa00)
        .addFields(
          {
            name: '📅 日次CSV',
            value: '• 指定日のすべての申請データ\n• 個別ファイル形式\n• 詳細データ確認に最適',
            inline: true
          },
          {
            name: '📆 月次CSV',
            value: '• 月単位での統合データ\n• 複数月選択可能\n• 月次レポート作成に最適',
            inline: true
          },
          {
            name: '📊 四半期CSV',
            value: '• 四半期単位での統合データ\n• 複数四半期選択可能\n• 期間分析に最適',
            inline: true
          }
        )
        .setFooter({ text: 'CSV出力には管理者権限が必要です' })
        .setTimestamp();

      const buttonRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(CSV_DAILY_BUTTON)
            .setLabel('日次CSV出力')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📅'),
          new ButtonBuilder()
            .setCustomId(CSV_MONTHLY_BUTTON)
            .setLabel('月次CSV出力')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📆'),
          new ButtonBuilder()
            .setCustomId(CSV_QUARTERLY_BUTTON)
            .setLabel('四半期CSV出力')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📊')
        );

      await interaction.editReply({
        embeds: [embed],
        components: [buttonRow]
      });
      
      logger.info(`[経費CSV] コマンド実行完了 - Guild: ${interaction.guildId}`);
      
    } catch (error) {
      logger.error(`[経費CSV] コマンド実行エラー:`, error);
      
      try {
        const errorMessage = '❌ CSV出力パネルの表示に失敗しました。';
        
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
        logger.error(`[経費CSV] エラー応答送信失敗:`, replyError);
      }
    }
  }
};
