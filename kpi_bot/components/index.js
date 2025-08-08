// kpi_bot/components/index.js - KPIコンポーネント統合エクスポート

// ボタンコンポーネント（config_botから参照）
const kpiButtons = require('../../config_bot/components/buttons/kpiButtons');

// セレクトメニューコンポーネント
const kpiSelects = require('./selects/kpiSelects');

// モーダルコンポーネント
const kpiModals = require('./modals/kpiModals');

// 埋め込みコンポーネント
const kpiEmbeds = require('./embeds/kpiEmbeds');

module.exports = {
  // ボタン関連
  ...kpiButtons,
  
  // セレクトメニュー関連
  ...kpiSelects,
  
  // モーダル関連
  ...kpiModals,
  
  // 埋め込み関連
  ...kpiEmbeds
};
