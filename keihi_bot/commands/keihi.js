// keihi_bot/commands/keihi.js - 経費申請メインコマンド

const { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  MessageFlags 
} = require('discord.js');
const logger = require('../../common/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('経費申請')
    .setDescription('経費申請を行います'),

  async execute(interaction) {
    try {
      logger.info(`[経費申請] コマンド実行開始 - User: ${interaction.user.tag}, Guild: ${interaction.guildId}`);
      
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      
      const embed = new EmbedBuilder()
        .setTitle('💰 経費申請システム')
        .setDescription('**経費申請を開始します**\n\n' +
          '以下のボタンから申請したい経費の種類を選択してください。\n\n' +
          '📋 申請前の確認事項：\n' +
          '• レシート・領収書の準備\n' +
          '• 申請内容の確認\n' +
          '• 承認者への事前連絡（高額な場合）')
        .setColor(0xff6b6b)
        .addFields(
          {
            name: '💼 対象経費',
            value: '• 交通費\n• 会議費\n• 消耗品費\n• 接待費\n• その他業務関連費',
            inline: true
          },
          {
            name: '📋 必要情報',
            value: '• 申請日\n• 金額\n• 用途・内容\n• 添付書類',
            inline: true
          },
          {
            name: '⏱️ 承認期間',
            value: '• 通常：2-3営業日\n• 高額申請：3-5営業日\n• 緊急時：1営業日',
            inline: true
          }
        )
        .setFooter({ text: '申請後は承認完了まで編集できませんのでご注意ください' })
        .setTimestamp();

      const buttonRow1 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('keihi_apply_transport_button')
            .setLabel('交通費申請')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🚃'),
          new ButtonBuilder()
            .setCustomId('keihi_apply_meeting_button')
            .setLabel('会議費申請')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('☕'),
          new ButtonBuilder()
            .setCustomId('keihi_apply_supplies_button')
            .setLabel('消耗品費申請')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📦')
        );

      const buttonRow2 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('keihi_apply_entertainment_button')
            .setLabel('接待費申請')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🍽️'),
          new ButtonBuilder()
            .setCustomId('keihi_apply_other_button')
            .setLabel('その他申請')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📝'),
          new ButtonBuilder()
            .setCustomId('keihi_apply_check_status_button')
            .setLabel('申請状況確認')
            .setStyle(ButtonStyle.Success)
            .setEmoji('📊')
        );

      await interaction.editReply({
        embeds: [embed],
        components: [buttonRow1, buttonRow2]
      });
      
      logger.info(`[経費申請] コマンド実行完了 - Guild: ${interaction.guildId}`);
      
    } catch (error) {
      logger.error(`[経費申請] コマンド実行エラー - Guild: ${interaction.guildId}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        user: interaction.user.tag,
        guildId: interaction.guildId
      });
      
      try {
        const errorMessage = '❌ 経費申請システムの起動に失敗しました。';
        
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
        logger.error(`[経費申請] エラー応答送信失敗:`, {
          error: replyError instanceof Error ? replyError.message : String(replyError),
          guildId: interaction.guildId
        });
      }
    }
  }
};
