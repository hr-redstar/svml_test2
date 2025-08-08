// keihi_bot/components/embeds/keihiEmbeds.js

const { EmbedBuilder } = require('discord.js');

/**
 * 経費申請設定パネル用のEmbedを作成
 */
function createKeihiConfigEmbed() {
  return new EmbedBuilder()
    .setTitle('⚙️ 経費申請設定パネル')
    .setDescription('**経費申請システムの各種設定**\n\n' +
      '💰 経費カテゴリ設定\n' +
      '📋 申請フォーム設定\n' +
      '✅ 承認フロー設定\n' +
      '📧 通知設定管理')
    .setColor(0xff6b6b)
    .addFields(
      { name: '💰 カテゴリ', value: '経費の種類・分類設定', inline: true },
      { name: '📋 フォーム', value: '申請フォームのカスタマイズ', inline: true },
      { name: '✅ 承認フロー', value: '承認者・承認手順の設定', inline: true },
      { name: '📧 通知設定', value: '申請・承認時の通知設定', inline: true }
    )
    .setTimestamp();
}

/**
 * 経費CSV出力パネル用のEmbedを作成
 */
function createKeihiCsvEmbed() {
  return new EmbedBuilder()
    .setTitle('📄 経費CSV出力パネル')
    .setDescription('**経費申請データのCSV出力機能**\n\n' +
      '📅 期間指定でのデータ出力\n' +
      '🏪 店舗別経費データ出力\n' +
      '💰 カテゴリ別集計レポート\n' +
      '📊 承認状況別データ出力')
    .setColor(0x00aa00)
    .addFields(
      { name: '📅 期間指定', value: '日次・週次・月次での出力', inline: true },
      { name: '🏪 店舗別', value: '店舗ごとの経費レポート', inline: true },
      { name: '💰 カテゴリ別', value: '経費種別ごとの集計', inline: true },
      { name: '📊 承認状況', value: '承認済み・未承認別データ', inline: true }
    )
    .setTimestamp();
}

/**
 * 経費申請ヘルプパネル用のEmbedを作成
 */
function createKeihiHelpEmbed() {
  return new EmbedBuilder()
    .setTitle('❓ 経費申請ヘルプパネル')
    .setDescription('**経費申請システムの使い方とヘルプ**\n\n' +
      '📖 申請方法の詳細ガイド\n' +
      '💡 よくある質問（FAQ）\n' +
      '📞 サポート連絡先\n' +
      '📋 申請フォーム記入例')
    .setColor(0x3498db)
    .addFields(
      { name: '📖 申請ガイド', value: 'ステップバイステップの申請方法', inline: true },
      { name: '💡 FAQ', value: 'よくある質問と回答', inline: true },
      { name: '📞 サポート', value: '困った時の連絡先', inline: true },
      { name: '📋 記入例', value: '申請フォームの記入例', inline: true }
    )
    .setTimestamp();
}

/**
 * 経費申請履歴パネル用のEmbedを作成
 */
function createKeihiHistoryEmbed() {
  return new EmbedBuilder()
    .setTitle('📋 経費申請履歴パネル')
    .setDescription('**過去の経費申請履歴と状況確認**\n\n' +
      '📋 個人の申請履歴確認\n' +
      '📊 店舗別申請統計\n' +
      '⏳ 承認待ち申請一覧\n' +
      '✅ 承認済み申請一覧')
    .setColor(0x9932cc)
    .addFields(
      { name: '📋 個人履歴', value: '自分の申請履歴確認', inline: true },
      { name: '📊 店舗統計', value: '店舗ごとの申請状況', inline: true },
      { name: '⏳ 承認待ち', value: '未承認申請の一覧', inline: true },
      { name: '✅ 承認済み', value: '承認完了申請の履歴', inline: true }
    )
    .setTimestamp();
}

module.exports = {
  createKeihiConfigEmbed,
  createKeihiCsvEmbed,
  createKeihiHelpEmbed,
  createKeihiHistoryEmbed
};
