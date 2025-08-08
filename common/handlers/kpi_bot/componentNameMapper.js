// common/kpi_bot/componentNameMapper.js

const COMPONENT_NAME_MAPPING = {
  // === kpi_bot ボタン ===
  'kpi_config_button': '📊 KPI設定',
};

function getAdvancedDisplayName(customId) {
  // kpi_bot に特化した動的IDのパターンマッチングがあればここに追加
  return null; // マッチしない場合はnullを返す
}

module.exports = {
  COMPONENT_NAME_MAPPING,
  getAdvancedDisplayName
};
