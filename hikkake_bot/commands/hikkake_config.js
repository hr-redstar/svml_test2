// hikkake_bot/commands/hikkake_config.js

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const logger = require('../../common/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('svml設定ひっかけ')
    .setDescription('ひっかけシステムの設定・管理パネルを表示します'),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const embed = new EmbedBuilder()
        .setTitle('ひっかけ設定パネル')
        .setDescription('以下のボタンから設定を選択してください。')
        .addFields({ name: '設置店舗', value: '未設定', inline: false });

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('hikkake_setup_button')
          .setLabel('ひっかけ設置')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('hikkake_response_config_button')
          .setLabel('応答文設定')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('hikkake_delete_button')
          .setLabel('ひっかけ設置削除')
          .setStyle(ButtonStyle.Danger)
      );

      await interaction.editReply({
        embeds: [embed],
        components: [buttons],
      });
    } catch (error) {
      logger.error('[hikkake_config] コマンド実行時エラー:', error);

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          content: '❌ エラーが発生しました。管理者にお問い合わせください。',
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: '❌ エラーが発生しました。管理者にお問い合わせください。',
          ephemeral: true
        });
      }
    }
  },
};
