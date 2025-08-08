// handlerRegistry.js の一時修正用パッチ
// 「No matching handler found」エラーを修正するための最小限の変更

const originalDirectRoutes = new Map([
  // 既存のマッピング
  ['svml設定', 'config'],
  ['svmlメッセージ', 'embed'],
  ['level', 'level'],
  ['svml設定level', 'levelConfig'],
  ['kpi', 'kpi'],
  ['svml設定KPI', 'kpi'],
  ['経費申請', 'keihi'],
  ['売上', 'uriage'],
  ['uriage_panel', 'uriage'],
  ['出退勤', 'syuttaikin'],
  ['config_button', 'config'],
  ['embed_button', 'embed'],
  ['keihi_submit', 'keihi'],
  ['uriage_submit', 'uriage'],
  ['syuttaikin_button', 'syuttaikin'],
  ['level_up', 'level'],
  ['kpi_report', 'kpi'],
  ['hikkake_config_button', 'hikkake'],
  
  // 追加：core系のカスタムID（エラー修正）
  ['core_log_channel_button', 'config'],
  ['core_store_config_button', 'config'],
  ['core_role_config_button', 'config'],
  ['core_store_modal', 'config'],
  ['core_role_modal', 'config'],
  ['core_log_channel_select', 'config'],
  ['core_user_info_select', 'config'],
  ['core_user_info_modal', 'config'],
  ['core_user_info_config_button', 'config']
]);

// これを handlerRegistry.js の directRoutes に適用する
module.exports = { originalDirectRoutes };
