// uriage_bot/components/embeds/uriageEmbeds.js

const { EmbedBuilder } = require('discord.js');

/**
 * 売上報告フォーム用のEmbedを作成
 */
function createUriageFormEmbed() {
  return new EmbedBuilder()
    .setTitle('📊 売上報告フォーム')
    .setDescription('**日次売上報告**\n\n' +
      'スタッフの皆さん、お疲れ様です！\n' +
      '本日の売上を報告してください。\n\n' +
      '📝 売上報告ボタンを押して詳細を入力してください。')
    .setColor(0x00ff7f)
    .addFields(
      { name: '📅 報告対象', value: '本日の売上', inline: true },
      { name: '💰 報告内容', value: '店舗別売上金額', inline: true },
      { name: '⏰ 報告締切', value: '営業終了後30分以内', inline: true }
    )
    .setFooter({ text: '正確な金額の入力をお願いします' })
    .setTimestamp();
}

/**
 * 売上設定パネル用のEmbedを作成
 */
function createUriageConfigEmbed() {
  return new EmbedBuilder()
    .setTitle('⚙️ 売上設定パネル')
    .setDescription('**売上報告システムの各種設定**\n\n' +
      '📊 報告テンプレート設定\n' +
      '⏰ 報告締切時間設定\n' +
      '🏪 店舗別設定管理\n' +
      '📧 通知設定管理')
    .setColor(0x9932cc)
    .addFields(
      { name: '📊 テンプレート', value: '報告フォームのカスタマイズ', inline: true },
      { name: '⏰ 締切設定', value: '報告の締切時間設定', inline: true },
      { name: '🏪 店舗設定', value: '店舗別の詳細設定', inline: true },
      { name: '📧 通知設定', value: 'アラート・リマインダー設定', inline: true }
    )
    .setTimestamp();
}

/**
 * 売上CSV出力パネル用のEmbedを作成
 */
function createUriageCsvEmbed() {
  return new EmbedBuilder()
    .setTitle('📄 売上CSV出力パネル')
    .setDescription('**売上データのCSV出力機能**\n\n' +
      '📅 期間指定でのデータ出力\n' +
      '🏪 店舗別データ出力\n' +
      '📊 統計情報付きレポート\n' +
      '📧 定期自動出力設定')
    .setColor(0x00aa00)
    .addFields(
      { name: '📅 期間指定', value: '日次・週次・月次での出力', inline: true },
      { name: '🏪 店舗別', value: '店舗ごとの詳細レポート', inline: true },
      { name: '📊 統計情報', value: '売上推移・分析データ', inline: true },
      { name: '📧 自動出力', value: '定期的な自動レポート配信', inline: true }
    )
    .setTimestamp();
}

module.exports = {
  createUriageFormEmbed,
  createUriageConfigEmbed,
  createUriageCsvEmbed
};
