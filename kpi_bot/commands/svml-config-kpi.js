// kpi_bot/commands/svml-config-kpi.js - KPI管理コマンド

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const logger = require('../../common/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('svml設定kpi')
    .setDescription('KPI管理システムの設定・パネル設置を行います')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    try {
      logger.info(`[svml設定KPI] KPI設定コマンド実行開始 - User: ${interaction.user.tag}, Guild: ${interaction.guildId}`);
      
      await interaction.deferReply({ flags: 0 }); // 全員に見える
      
      // KPI設定パネルを構築
      const embed = new EmbedBuilder()
        .setTitle('📊 KPI管理システム設定')
        .setDescription('**KPI管理システムの各種設定とパネル設置**\n\n' +
          '🎯 **KPI設置** - 店舗別KPI管理パネル設置\n' +
          '📝 **KPIログチャンネル選択** - KPI進捗ログの表示設定\n\n' +
          '**KPI管理パネルに含まれる機能**\n' +
          '• KPI登録（目標値設定）\n' +
          '• KPI申請（日次実績申請）\n' +
          '• KPIログチャンネル選択\n\n' +
          '**データ保存先**\n' +
          '• KPI目標: `ギルドID/KPI/店舗名/targets.json`\n' +
          '• KPI実績: `ギルドID/KPI/店舗名/年月_実績.csv`\n' +
          '• KPI設定: `ギルドID/KPI/config.json`')
        .setColor(0x1e90ff)
        .addFields(
          {
            name: '🎯 KPI設置',
            value: '店舗選択→チャンネル選択→KPI管理パネル設置',
            inline: true
          },
          {
            name: '📝 KPIログチャンネル',
            value: 'KPI進捗状況をリアルタイムで表示するチャンネル設定',
            inline: true
          }
        )
        .setFooter({ text: 'KPI管理システム - 店舗の目標達成をサポート' })
        .setTimestamp();

      const buttonRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('kpi_panel_setup_button')
            .setLabel('KPI設置')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎯'),
          new ButtonBuilder()
            .setCustomId('kpi_log_channel_setup_button')
            .setLabel('KPIログチャンネル選択')
            .setStyle(ButtonStyle.Success)
            .setEmoji('📝')
        );

      await interaction.editReply({
        embeds: [embed],
        components: [buttonRow]
      });

      logger.info(`[svml設定KPI] KPI設定パネル送信完了 - Guild: ${interaction.guildId}`);

    } catch (error) {
      logger.error(`[svml設定KPI] エラー発生:`, error);
      
      const errorMessage = interaction.deferred || interaction.replied 
        ? { content: '❌ KPI設定の処理中にエラーが発生しました。', ephemeral: true }
        : { content: '❌ KPI設定の処理中にエラーが発生しました。', ephemeral: true };
        
      if (interaction.deferred) {
        await interaction.editReply(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  }
};
