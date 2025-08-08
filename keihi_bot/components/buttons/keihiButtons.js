// keihi_bot/components/buttons/keihiButtons.js

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * 経費申請設定パネル用のボタン行1を作成
 */
function createKeihiConfigButtons() {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('keihi_category_config_button')
        .setLabel('カテゴリ設定')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('💰'),
      new ButtonBuilder()
        .setCustomId('keihi_form_config_button')
        .setLabel('フォーム設定')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📋'),
      new ButtonBuilder()
        .setCustomId('keihi_approval_config_button')
        .setLabel('承認フロー設定')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('✅')
    );
}

/**
 * 経費申請設定パネル用のボタン行2を作成
 */
function createKeihiConfigButtons2() {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('keihi_notification_config_button')
        .setLabel('通知設定')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📧'),
      new ButtonBuilder()
        .setCustomId('keihi_reset_config_button')
        .setLabel('設定リセット')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔄')
    );
}

/**
 * 経費CSV出力パネル用のボタン行1を作成
 */
function createKeihiCsvButtons() {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('keihi_csv_daily_button')
        .setLabel('日次CSV出力')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📅'),
      new ButtonBuilder()
        .setCustomId('keihi_csv_weekly_button')
        .setLabel('週次CSV出力')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📆'),
      new ButtonBuilder()
        .setCustomId('keihi_csv_monthly_button')
        .setLabel('月次CSV出力')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📊')
    );
}

/**
 * 経費CSV出力パネル用のボタン行2を作成
 */
function createKeihiCsvButtons2() {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('keihi_csv_category_button')
        .setLabel('カテゴリ別出力')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('💰'),
      new ButtonBuilder()
        .setCustomId('keihi_csv_approval_button')
        .setLabel('承認状況別出力')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('✅')
    );
}

/**
 * 経費ヘルプパネル用のボタン行1を作成
 */
function createKeihiHelpButtons() {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('keihi_help_guide_button')
        .setLabel('申請ガイド')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📖'),
      new ButtonBuilder()
        .setCustomId('keihi_help_faq_button')
        .setLabel('よくある質問')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('💡'),
      new ButtonBuilder()
        .setCustomId('keihi_help_contact_button')
        .setLabel('サポート連絡先')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📞')
    );
}

/**
 * 経費ヘルプパネル用のボタン行2を作成
 */
function createKeihiHelpButtons2() {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('keihi_help_example_button')
        .setLabel('記入例')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📋'),
      new ButtonBuilder()
        .setCustomId('keihi_help_rules_button')
        .setLabel('申請ルール')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📝')
    );
}

/**
 * 経費履歴パネル用のボタン行1を作成
 */
function createKeihiHistoryButtons() {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('keihi_history_personal_button')
        .setLabel('個人履歴確認')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📋'),
      new ButtonBuilder()
        .setCustomId('keihi_history_store_button')
        .setLabel('店舗別統計')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📊'),
      new ButtonBuilder()
        .setCustomId('keihi_history_pending_button')
        .setLabel('承認待ち一覧')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('⏳')
    );
}

/**
 * 経費履歴パネル用のボタン行2を作成
 */
function createKeihiHistoryButtons2() {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('keihi_history_approved_button')
        .setLabel('承認済み一覧')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅'),
      new ButtonBuilder()
        .setCustomId('keihi_history_search_button')
        .setLabel('詳細検索')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🔍')
    );
}

module.exports = {
  createKeihiConfigButtons,
  createKeihiConfigButtons2,
  createKeihiCsvButtons,
  createKeihiCsvButtons2,
  createKeihiHelpButtons,
  createKeihiHelpButtons2,
  createKeihiHistoryButtons,
  createKeihiHistoryButtons2
};
