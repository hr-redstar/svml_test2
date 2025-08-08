// embed.js - Embedメッセージビルダーコマンド

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  Locale,
  EmbedBuilder
} = require('discord.js');
const logger = require('../../common/logger');
const embedGcsHelper = require('../utils/embedGcsHelper');
const performanceManager = require('../../common/performance/performanceManager');

// コンポーネント
const { createEmbedBuilderButtons } = require('../components/buttons/embedButtons');
const { createEmbedBuilderEmbed } = require('../components/embeds/coreConfigEmbeds');

// コマンド使用状況の追跡用マップ
const usageTracker = new Map();

// 使用状況を追跡するヘルパー関数
async function trackUsage(guildId, userId) {
  const key = `${guildId}_${userId}`;
  const now = Date.now();
  const usage = usageTracker.get(key) || { count: 0, lastUsed: 0 };

  // 1時間以上経過していれば使用回数をリセット
  if (now - usage.lastUsed > 60 * 60 * 1000) {
    usage.count = 0;
  }

  usage.count++;
  usage.lastUsed = now;
  usageTracker.set(key, usage);

  // 定期的にクリーンアップ
  if (usageTracker.size > 1000) {
    const oneHourAgo = now - 60 * 60 * 1000;
    for (const [k, v] of usageTracker.entries()) {
      if (v.lastUsed < oneHourAgo) {
        usageTracker.delete(k);
      }
    }
  }

  return usage.count;
}

// 使用制限をチェックするヘルパー関数
async function checkUsageLimit(interaction) {
  const usage = await trackUsage(interaction.guildId, interaction.user.id);
  const hourlyLimit = 30; // 1時間あたりの制限回数

  if (usage > hourlyLimit) {
    await interaction.reply({
      content: `⚠️ 使用制限に達しました。1時間後にもう一度お試しください。\n現在の使用回数: ${usage}/${hourlyLimit}`,
      flags: MessageFlags.Ephemeral
    });
    return false;
  }
  return true;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('svmlメッセージ')
    .setDescription('埋め込みメッセージを作成・編集するためのパネルを呼び出します。')
    .setNameLocalization(Locale.Japanese, 'svmlメッセージ')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      // 使用制限をチェック
      if (!await checkUsageLimit(interaction)) {
        return;
      }


      // 初期表示は'mode=create'でEmbedとボタンを生成
      const mode = 'create';
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const embed = createEmbedBuilderEmbed(mode);
      const row = createEmbedBuilderButtons(mode);

      await interaction.editReply({
        embeds: [embed],
        components: [row],
      });

      logger.info('Embedビルダーパネルを表示しました', {
        guildId: interaction.guildId,
        userId: interaction.user.id,
        mode
      });

    } catch (error) {
      logger.error('「svml_botメッセージ」コマンドの処理中にエラーが発生しました。', {
        error: error.stack || error.message || error,
        guildId: interaction.guild?.id,
        userId: interaction.user.id,
      });
      
      // エラー応答の処理
      try {
        const errorMessage = {
          content: '⚠️ エラーが発生しました。もう一度お試しください。',
          flags: MessageFlags.Ephemeral,
        };

        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply(errorMessage);
        } else {
          await interaction.editReply(errorMessage);
        }
      } catch (replyError) {
        logger.error('エラー応答の送信に失敗しました:', {
          error: replyError.stack,
          originalError: error
        });
      }
    }
  },
};