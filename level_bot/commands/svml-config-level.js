// level_bot/commands/svml-config-level.js - レベルbot専用設定コマンド

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const logger = require('../../common/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('svml設定レベル')
    .setDescription('レベルシステムの設定・管理を行います')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    try {
      logger.info(`[svml設定レベル] レベル設定コマンド実行開始 - User: ${interaction.user.tag}, Guild: ${interaction.guildId}`);
      
      await interaction.deferReply({ flags: 0 }); // 全員に見える
      
      // レベルbot設定パネルを構築
      const embed = new EmbedBuilder()
        .setTitle('📊 レベルシステム設定')
        .setDescription('**レベルシステムの各種設定と管理**\n\n' +
          '⚙️ レベル設定（経験値・レベルアップ条件）\n' +
          '🏆 ランキングパネル設置\n' +
          '📊 統計情報パネル設置\n' +
          '🎯 経験値リセット・調整\n\n' +
          '各ボタンをクリックして必要な設定や管理を行ってください。')
        .setColor(0xffd700)
        .addFields(
          {
            name: '⚙️ レベル設定',
            value: '経験値獲得量やレベルアップ条件の設定',
            inline: true
          },
          {
            name: '🏆 ランキング',
            value: 'レベルランキングパネルの設置',
            inline: true
          },
          {
            name: '📊 統計情報',
            value: 'サーバー全体のレベル統計表示',
            inline: true
          },
          {
            name: '🎯 経験値管理',
            value: 'ユーザーの経験値リセット・調整',
            inline: true
          }
        )
        .setFooter({ text: 'レベルシステムの詳細設定を行ってください' })
        .setTimestamp();

      const buttonRow1 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('level_config_setup_button')
            .setLabel('レベル設定')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('⚙️'),
          new ButtonBuilder()
            .setCustomId('level_ranking_setup_button')
            .setLabel('ランキングパネル設置')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🏆')
        );

      const buttonRow2 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('level_stats_setup_button')
            .setLabel('統計パネル設置')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📊'),
          new ButtonBuilder()
            .setCustomId('level_manage_setup_button')
            .setLabel('経験値管理')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🎯')
        );

      await interaction.editReply({
        embeds: [embed],
        components: [buttonRow1, buttonRow2]
      });
      
      logger.info(`[svml設定レベル] レベル設定コマンド実行完了 - Guild: ${interaction.guildId}`);
      
    } catch (error) {
      logger.error(`[svml設定レベル] レベル設定コマンド実行エラー - Guild: ${interaction.guildId}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        user: interaction.user.tag,
        guildId: interaction.guildId
      });
      
      try {
        const errorMessage = '❌ レベル設定パネルの表示に失敗しました。';
        
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
        logger.error(`[svml設定レベル] エラー応答送信失敗:`, {
          error: replyError instanceof Error ? replyError.message : String(replyError),
          guildId: interaction.guildId
        });
      }
    }
  }
};
