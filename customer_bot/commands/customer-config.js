// customer_bot/commands/customer-config.js - 接客ログBot設定コマンド
const { SlashCommandBuilder, EmbedBuilder, Locale, MessageFlags } = require('discord.js');
const logger = require('@common/logger').createModuleLogger('customer-config');
const { logGlobalCommand } = require('@common/utils/configLogger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('svml設定接客')
    .setDescription('接客ログBot設定パネルを表示します')
    .setNameLocalization(Locale.Japanese, 'svml設定接客')
    .setDescriptionLocalization(Locale.Japanese, '接客ログBot設定パネルを表示します'),

  category: 'config',

  async execute(interaction) {
    try {
      // ログ記録（成功時）
      try {
        logger.info(`[LOG-SUCCESS] ユーザー ${interaction.user.tag} が /svml設定接客 を実行 - ログ記録完了`);
      } catch (logError) {
        logger.warn('[LOG-WARN] ログ記録に失敗しましたが、処理を継続します', { error: logError.message });
      }

      // 設定パネルEmbed作成
      const configEmbed = new EmbedBuilder()
        .setTitle('🍸 接客ログBot 設定パネル')
        .setDescription('接客ログBotの設定と機能')
        .setColor(0x00AE86)
        .addFields(
          { 
            name: '📋 利用可能なコマンド', 
            value: [
              '`/service start` - 接客開始',
              '`/service list` - 現在の接客一覧',
              '`/service end` - 接客終了'
            ].join('\n'),
            inline: false
          },
          {
            name: '⚙️ 機能設定',
            value: [
              '• 自動リマインダー機能: 開発中',
              '• 売上統計レポート: 開発中',
              '• データエクスポート: 開発中'
            ].join('\n'),
            inline: false
          },
          {
            name: '📊 統計情報',
            value: [
              '• 今日の接客数: 統計機能開発中',
              '• 平均接客時間: 統計機能開発中',
              '• 総売上: 統計機能開発中'
            ].join('\n'),
            inline: false
          },
          {
            name: '🔧 管理者設定',
            value: [
              '• 通知チャンネル設定: 未設定',
              '• 統計レポート設定: 未設定',
              '• アクセス権限管理: 開発中'
            ].join('\n'),
            inline: false
          }
        )
        .setFooter({ 
          text: '接客ログBot v1.0 | SVML管理システム',
          iconURL: interaction.client.user.displayAvatarURL()
        })
        .setTimestamp();

      // レスポンス送信
      await interaction.reply({ 
        embeds: [configEmbed],
        flags: MessageFlags.Ephemeral
      });

      // システムログに記録
      try {
        await logGlobalCommand(interaction, configEmbed);
      } catch (logError) {
        logger.warn('[LOG-WARN] システムログ記録に失敗', { error: logError.message });
      }

    } catch (error) {
      logger.error('「svml設定接客」コマンドの処理中にエラーが発生しました。', {
        error: error.message,
        userId: interaction.user.id,
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        stack: error.stack
      });

      const errorMessage = 'コマンドの実行中にエラーが発生しました。管理者にお問い合わせください。';
      
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: errorMessage, flags: MessageFlags.Ephemeral });
        } else {
          await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
        }
      } catch (replyError) {
        logger.error('エラーレスポンスの送信に失敗しました。', { error: replyError.message });
      }
    }
  },
};
