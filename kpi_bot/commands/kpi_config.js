// kpi_bot/commands/kpi_config.js - KPI設定コマンド（旧版・互換性用）

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const logger = require('@common/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kpi設定')
    .setDescription('KPI管理システムの設定パネルを表示します（旧版）'),

  async execute(interaction) {
    logger.info(`[kpi_config] KPI設定パネル表示開始 - ユーザー: ${interaction.user.tag} (${interaction.user.id})`);

    try {
      await interaction.deferReply({ ephemeral: true });

      // 新しいコマンドへの案内
      const redirectEmbed = new EmbedBuilder()
        .setTitle('📊 KPI管理システム')
        .setDescription(
          '**このコマンドは新しいコマンドに移行されました**\n\n' +
          '新しいコマンド: `/svml設定kpi`\n\n' +
          '**新機能**\n' +
          '🎯 KPI設置 - 店舗別KPI管理パネル設置\n' +
          '� KPIログチャンネル選択 - 進捗ログ表示設定\n' +
          '📋 KPI登録 - 目標値設定\n' +
          '📊 KPI申請 - 日次実績申請\n\n' +
          '今後は `/svml設定kpi` をご利用ください。'
        )
        .setColor(0xffa500)
        .setTimestamp()
        .setFooter({ text: 'KPI管理システム - 新バージョンをご利用ください' });

      // 新コマンド実行ボタン
      const buttonRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('kpi_redirect_new_command')
            .setLabel('新しいKPI設定を開く')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('�')
        );

      await interaction.editReply({
        embeds: [redirectEmbed],
        components: [buttonRow]
      });

      logger.info(`[kpi_config] KPI設定パネル（旧版）表示完了 - ユーザー: ${interaction.user.tag}`);

    } catch (error) {
      logger.error('[kpi_config] KPI設定パネル表示エラー:', error);
      
      if (interaction.deferred) {
        await interaction.editReply({
          content: '❌ KPI設定パネルの表示に失敗しました。新しいコマンド `/svml設定kpi` をお試しください。'
        });
      } else {
        await interaction.reply({
          content: '❌ KPI設定パネルの表示に失敗しました。新しいコマンド `/svml設定kpi` をお試しください。',
          ephemeral: true
        });
      }
    }
  },
};
