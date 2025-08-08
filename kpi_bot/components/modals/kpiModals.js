// kpi_bot/components/modals/kpiModals.js - KPIシステムモーダルコンポーネント

const { 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder 
} = require('discord.js');

/**
 * KPI期間設定モーダルを作成
 */
function createKpiPeriodModal(storeName) {
  const modal = new ModalBuilder()
    .setCustomId(`kpi_period_modal_${storeName}`)
    .setTitle(`${storeName} - KPI期間設定`);

  const periodInput = new TextInputBuilder()
    .setCustomId('period_input')
    .setLabel('開始～終了日（例：2025/07/01～2025/07/05）')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('2025/07/01～2025/07/05')
    .setRequired(true)
    .setMaxLength(50);

  const periodRow = new ActionRowBuilder().addComponents(periodInput);
  modal.addComponents(periodRow);

  return modal;
}

/**
 * KPI来客数設定モーダルを作成
 */
function createKpiVisitorsModal(storeName) {
  const modal = new ModalBuilder()
    .setCustomId(`kpi_visitors_modal_${storeName}`)
    .setTitle(`${storeName} - 来客数目標設定`);

  const visitorsInput = new TextInputBuilder()
    .setCustomId('visitors_input')
    .setLabel('来客数目標（人数のみ入力）')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('210')
    .setRequired(true)
    .setMaxLength(10);

  const visitorsRow = new ActionRowBuilder().addComponents(visitorsInput);
  modal.addComponents(visitorsRow);

  return modal;
}

/**
 * KPI指名本数設定モーダルを作成
 */
function createKpiNominationsModal(storeName) {
  const modal = new ModalBuilder()
    .setCustomId(`kpi_nominations_modal_${storeName}`)
    .setTitle(`${storeName} - 指名本数目標設定`);

  const nominationsInput = new TextInputBuilder()
    .setCustomId('nominations_input')
    .setLabel('指名本数目標（本数のみ入力）')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('52.5')
    .setRequired(true)
    .setMaxLength(10);

  const nominationsRow = new ActionRowBuilder().addComponents(nominationsInput);
  modal.addComponents(nominationsRow);

  return modal;
}

/**
 * KPI指名売上設定モーダルを作成
 */
function createKpiNominationSalesModal(storeName) {
  const modal = new ModalBuilder()
    .setCustomId(`kpi_nomination_sales_modal_${storeName}`)
    .setTitle(`${storeName} - 指名売上目標設定`);

  const salesInput = new TextInputBuilder()
    .setCustomId('nomination_sales_input')
    .setLabel('指名売上目標（金額のみ入力）')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('3412500')
    .setRequired(true)
    .setMaxLength(15);

  const salesRow = new ActionRowBuilder().addComponents(salesInput);
  modal.addComponents(salesRow);

  return modal;
}

/**
 * KPIフリー売上設定モーダルを作成
 */
function createKpiFreeSalesModal(storeName) {
  const modal = new ModalBuilder()
    .setCustomId(`kpi_free_sales_modal_${storeName}`)
    .setTitle(`${storeName} - フリー売上目標設定`);

  const salesInput = new TextInputBuilder()
    .setCustomId('free_sales_input')
    .setLabel('フリー売上目標（金額のみ入力）')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('1487500')
    .setRequired(true)
    .setMaxLength(15);

  const salesRow = new ActionRowBuilder().addComponents(salesInput);
  modal.addComponents(salesRow);

  return modal;
}

/**
 * KPI純売上設定モーダルを作成
 */
function createKpiTotalSalesModal(storeName) {
  const modal = new ModalBuilder()
    .setCustomId(`kpi_total_sales_modal_${storeName}`)
    .setTitle(`${storeName} - 純売上目標設定`);

  const salesInput = new TextInputBuilder()
    .setCustomId('total_sales_input')
    .setLabel('純売上目標（金額のみ入力）')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('4900000')
    .setRequired(true)
    .setMaxLength(15);

  const salesRow = new ActionRowBuilder().addComponents(salesInput);
  modal.addComponents(salesRow);

  return modal;
}

/**
 * KPI申請日付設定モーダルを作成
 */
function createKpiReportDateModal(storeName) {
  const modal = new ModalBuilder()
    .setCustomId(`kpi_report_date_modal_${storeName}`)
    .setTitle(`${storeName} - 申請日付設定`);

  const dateInput = new TextInputBuilder()
    .setCustomId('report_date_input')
    .setLabel('申請する日付（例：2025/07/04）')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('2025/07/04')
    .setRequired(true)
    .setMaxLength(20);

  const dateRow = new ActionRowBuilder().addComponents(dateInput);
  modal.addComponents(dateRow);

  return modal;
}

/**
 * KPI申請来客数モーダルを作成
 */
function createKpiReportVisitorsModal(storeName) {
  const modal = new ModalBuilder()
    .setCustomId(`kpi_report_visitors_modal_${storeName}`)
    .setTitle(`${storeName} - 来客数申請`);

  const visitorsInput = new TextInputBuilder()
    .setCustomId('report_visitors_input')
    .setLabel('来客数実績（人数のみ入力）')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('89')
    .setRequired(true)
    .setMaxLength(10);

  const visitorsRow = new ActionRowBuilder().addComponents(visitorsInput);
  modal.addComponents(visitorsRow);

  return modal;
}

/**
 * KPI申請指名本数モーダルを作成
 */
function createKpiReportNominationsModal(storeName) {
  const modal = new ModalBuilder()
    .setCustomId(`kpi_report_nominations_modal_${storeName}`)
    .setTitle(`${storeName} - 指名本数申請`);

  const nominationsInput = new TextInputBuilder()
    .setCustomId('report_nominations_input')
    .setLabel('指名本数実績（本数のみ入力）')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('31')
    .setRequired(true)
    .setMaxLength(10);

  const nominationsRow = new ActionRowBuilder().addComponents(nominationsInput);
  modal.addComponents(nominationsRow);

  return modal;
}

/**
 * KPI申請指名売上モーダルを作成
 */
function createKpiReportNominationSalesModal(storeName) {
  const modal = new ModalBuilder()
    .setCustomId(`kpi_report_nomination_sales_modal_${storeName}`)
    .setTitle(`${storeName} - 指名売上申請`);

  const salesInput = new TextInputBuilder()
    .setCustomId('report_nomination_sales_input')
    .setLabel('指名売上実績（金額のみ入力）')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('1904100')
    .setRequired(true)
    .setMaxLength(15);

  const salesRow = new ActionRowBuilder().addComponents(salesInput);
  modal.addComponents(salesRow);

  return modal;
}

/**
 * KPI申請フリー売上モーダルを作成
 */
function createKpiReportFreeSalesModal(storeName) {
  const modal = new ModalBuilder()
    .setCustomId(`kpi_report_free_sales_modal_${storeName}`)
    .setTitle(`${storeName} - フリー売上申請`);

  const salesInput = new TextInputBuilder()
    .setCustomId('report_free_sales_input')
    .setLabel('フリー売上実績（金額のみ入力）')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('625200')
    .setRequired(true)
    .setMaxLength(15);

  const salesRow = new ActionRowBuilder().addComponents(salesInput);
  modal.addComponents(salesRow);

  return modal;
}

/**
 * KPI申請純売上モーダルを作成
 */
function createKpiReportTotalSalesModal(storeName) {
  const modal = new ModalBuilder()
    .setCustomId(`kpi_report_total_sales_modal_${storeName}`)
    .setTitle(`${storeName} - 純売上申請`);

  const salesInput = new TextInputBuilder()
    .setCustomId('report_total_sales_input')
    .setLabel('純売上実績（金額のみ入力）')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('2529300')
    .setRequired(true)
    .setMaxLength(15);

  const salesRow = new ActionRowBuilder().addComponents(salesInput);
  modal.addComponents(salesRow);

  return modal;
}

// 旧関数（互換性維持）
function createStoreKpiTargetModal(storeValue, storeName) {
  return createKpiPeriodModal(storeName);
}

function createKpiPanelModal() {
  const modal = new ModalBuilder()
    .setCustomId('kpi_panel_create_modal')
    .setTitle('📋 KPI申請パネル作成');

  const titleInput = new TextInputBuilder()
    .setCustomId('panel_title')
    .setLabel('パネルタイトル')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('例: 8月度 KPI申請')
    .setRequired(true)
    .setMaxLength(50);

  const titleRow = new ActionRowBuilder().addComponents(titleInput);
  modal.addComponents(titleRow);

  return modal;
}

module.exports = {
  // KPI目標設定モーダル
  createKpiPeriodModal,
  createKpiVisitorsModal,
  createKpiNominationsModal,
  createKpiNominationSalesModal,
  createKpiFreeSalesModal,
  createKpiTotalSalesModal,
  
  // KPI申請モーダル
  createKpiReportDateModal,
  createKpiReportVisitorsModal,
  createKpiReportNominationsModal,
  createKpiReportNominationSalesModal,
  createKpiReportFreeSalesModal,
  createKpiReportTotalSalesModal,
  
  // 旧関数（互換性維持）
  createStoreKpiTargetModal,
  createKpiPanelModal
};
