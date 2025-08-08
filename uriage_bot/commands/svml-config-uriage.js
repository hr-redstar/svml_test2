// uriage_bot/commands/svml-config-uriage.js - 売上bot専用設定コマンド

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const logger = require('../../common/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('svml設定売上')
    .setDescription('売上報告システムの設定・パネル設置を行います')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    try {
      logger.info(`[svml設定売上] 売上設定コマンド実行開始 - User: ${interaction.user.tag}, Guild: ${interaction.guildId}`);
      
      await interaction.deferReply({ flags: 0 }); // 全員に見える
      
      // 売上bot設定パネルを構築
      const embed = new EmbedBuilder()
        .setTitle('💰 売上報告システム設定')
        .setDescription('**売上報告システムの各種設定とパネル設置**\n\n' +
          '📊 売上報告フォーム設置\n' +
          '⚙️ 売上設定パネル設置\n' +
          '📄 売上CSV出力パネル設置\n\n' +
          '各ボタンをクリックして必要なパネルを設置してください。')
        .setColor(0x00ff7f)
        .addFields(
          {
            name: '📊 売上報告フォーム',
            value: 'スタッフが売上を報告するためのフォーム',
            inline: true
          },
          {
            name: '⚙️ 売上設定パネル',
            value: '売上報告の各種設定を行うパネル',
            inline: true
          },
          {
            name: '📄 CSV出力パネル',
            value: '売上データをCSV形式で出力するパネル',
            inline: true
          }
        )
        .setFooter({ text: 'パネル設置後、各パネルで詳細設定を行ってください' })
        .setTimestamp();

      const buttonRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('uriage_form_setup_button')
            .setLabel('売上報告フォーム設置')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📊'),
          new ButtonBuilder()
            .setCustomId('uriage_config_setup_button')
            .setLabel('売上設定パネル設置')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('⚙️'),
          new ButtonBuilder()
            .setCustomId('uriage_csv_setup_button')
            .setLabel('CSV出力パネル設置')
            .setStyle(ButtonStyle.Success)
            .setEmoji('📄')
        );

      await interaction.editReply({
        embeds: [embed],
        components: [buttonRow]
      });
      
      logger.info(`[svml設定売上] 売上設定コマンド実行完了 - Guild: ${interaction.guildId}`);
      
    } catch (error) {
      logger.error(`[svml設定売上] 売上設定コマンド実行エラー - Guild: ${interaction.guildId}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        user: interaction.user.tag,
        guildId: interaction.guildId
      });
      
      try {
        const errorMessage = '❌ 売上設定パネルの表示に失敗しました。';
        
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
        logger.error(`[svml設定売上] エラー応答送信失敗:`, {
          error: replyError instanceof Error ? replyError.message : String(replyError),
          guildId: interaction.guildId
        });
      }
    }
  }
};
