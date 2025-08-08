// uriage_bot/components/buttons/uriageButtons.js

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * 売上報告フォーム用のボタン行を作成
 */
function createUriageFormButtons() {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('uriage_report_button')
        .setLabel('売上報告')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📊'),
      new ButtonBuilder()
        .setCustomId('uriage_correction_button')
        .setLabel('報告修正')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('✏️'),
      new ButtonBuilder()
        .setCustomId('uriage_status_button')
        .setLabel('報告状況確認')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📋')
    );
}

/**
 * 売上設定パネル用のボタン行1を作成
 */
function createUriageConfigButtons() {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('uriage_template_config_button')
        .setLabel('テンプレート設定')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📊'),
      new ButtonBuilder()
        .setCustomId('uriage_deadline_config_button')
        .setLabel('締切時間設定')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('⏰'),
      new ButtonBuilder()
        .setCustomId('uriage_store_config_button')
        .setLabel('店舗別設定')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🏪')
    );
}

/**
 * 売上設定パネル用のボタン行2を作成
 */
function createUriageConfigButtons2() {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('uriage_notification_config_button')
        .setLabel('通知設定')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📧'),
      new ButtonBuilder()
        .setCustomId('uriage_reset_config_button')
        .setLabel('設定リセット')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔄')
    );
}

/**
 * 売上CSV出力パネル用のボタン行1を作成
 */
function createUriageCsvButtons() {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('uriage_csv_daily_button')
        .setLabel('日次CSV出力')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📅'),
      new ButtonBuilder()
        .setCustomId('uriage_csv_weekly_button')
        .setLabel('週次CSV出力')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📆'),
      new ButtonBuilder()
        .setCustomId('uriage_csv_monthly_button')
        .setLabel('月次CSV出力')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📊')
    );
}

/**
 * 売上CSV出力パネル用のボタン行2を作成
 */
function createUriageCsvButtons2() {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('uriage_csv_custom_button')
        .setLabel('期間カスタム出力')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🔧'),
      new ButtonBuilder()
        .setCustomId('uriage_csv_auto_config_button')
        .setLabel('自動出力設定')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('⚙️')
    );
}

module.exports = {
  createUriageFormButtons,
  createUriageConfigButtons,
  createUriageConfigButtons2,
  createUriageCsvButtons,
  createUriageCsvButtons2
};
