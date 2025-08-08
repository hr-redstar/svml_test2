// common/config_bot/componentNameMapper.js

const COMPONENT_NAME_MAPPING = {
  // === config_bot ボタン ===
  'config_store_button': '店舗名追加',
  'config_role_button': '役職追加',
  'config_setup_log_channel_button': 'ログチャンネル設定',
  'refresh_config_panel': 'パネル更新',
  
  // === config_bot セレクトメニュー ===
  'config_select_store': '店舗選択',
  'config_select_role': '役職選択',
  'config_select_channel': 'チャンネル選択',
  'config_select_user_for_registration': 'ユーザー登録選択',
  'config_log_channel_select': 'ログチャンネル選択',
  
  // === config_bot モーダル ===
  'config_store_modal': '店舗名入力',
  'config_role_modal': '役職名入力',
  'real_name': '本名入力',
  'profile_name': 'プロフィール名入力',
  'profile_role': 'プロフィール役職入力',
};

function getAdvancedDisplayName(customId) {
  // config_bot に特化した動的IDのパターンマッチングがあればここに追加
  return null; // マッチしない場合はnullを返す
}

module.exports = {
  COMPONENT_NAME_MAPPING,
  getAdvancedDisplayName
};
