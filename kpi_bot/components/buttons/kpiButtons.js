// kpi_bot/components/buttons/kpiButtons.js - KPIシステムボタンコンポーネント

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * KPI管理パネル用のボタン行を作成
 */
function createKpiManagementButtons(storeName) {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`kpi_target_register_${storeName}`)
        .setLabel('KPI登録')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📋'),
      new ButtonBuilder()
        .setCustomId(`kpi_report_apply_${storeName}`)
        .setLabel('KPI申請')
        .setStyle(ButtonStyle.Success)
        .setEmoji('📊'),
      new ButtonBuilder()
        .setCustomId(`kpi_log_channel_select_${storeName}`)
        .setLabel('KPIログチャンネル選択')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📝')
    );
}

/**
 * KPI目標設定用のボタン行を作成
 */
function createKpiTargetButtons() {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('kpi_target_period_button')
        .setLabel('開始終了日')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📅'),
      new ButtonBuilder()
        .setCustomId('kpi_target_visitors_button')
        .setLabel('来客数')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('👥'),
      new ButtonBuilder()
        .setCustomId('kpi_target_nominations_button')
        .setLabel('指名本数')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🎯')
    );
}

/**
 * KPI目標設定用のボタン行2を作成
 */
function createKpiTargetButtons2() {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('kpi_target_nomination_sales_button')
        .setLabel('指名売上')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('💰'),
      new ButtonBuilder()
        .setCustomId('kpi_target_free_sales_button')
        .setLabel('フリー売上')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('💵'),
      new ButtonBuilder()
        .setCustomId('kpi_target_total_sales_button')
        .setLabel('純売上')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('💎')
    );
}

/**
 * KPI申請用のボタン行を作成
 */
function createKpiReportButtons() {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('kpi_report_date_button')
        .setLabel('日付')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📅'),
      new ButtonBuilder()
        .setCustomId('kpi_report_visitors_button')
        .setLabel('来客数')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('👥'),
      new ButtonBuilder()
        .setCustomId('kpi_report_nominations_button')
        .setLabel('指名本数')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🎯')
    );
}

/**
 * KPI申請用のボタン行2を作成
 */
function createKpiReportButtons2() {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('kpi_report_nomination_sales_button')
        .setLabel('指名売上')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('💰'),
      new ButtonBuilder()
        .setCustomId('kpi_report_free_sales_button')
        .setLabel('フリー売上')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('💵'),
      new ButtonBuilder()
        .setCustomId('kpi_report_total_sales_button')
        .setLabel('純売上')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('💎')
    );
}

module.exports = {
  createKpiManagementButtons,
  createKpiTargetButtons,
  createKpiTargetButtons2,
  createKpiReportButtons,
  createKpiReportButtons2
};
