// common/level_bot/componentNameMapper.js

const COMPONENT_NAME_MAPPING = {
  // === level_bot ボタン ===
  'level_basic_settings': 'レベル基本設定',
  'level_stamps_management': 'スタンプ管理',
  'level_rewards_management': '報酬管理',
  'level_statistics_view': '統計表示',
  'level_ranking_view': 'ランキング表示',
  'level_export_data': 'データエクスポート',
  'level_reset_data': 'データリセット',
  'level_back_to_main': 'メイン画面に戻る',
  
  // === level_bot セレクトメニュー ===
  'level_disabled_roles_select': 'レベル無効ロール選択',
  'level_notification_channel_select': '通知チャンネル選択',
  'level_target_channels_select': '対象チャンネル選択',
  'level_ranking_type_select': 'ランキング種別選択',
  'level_export_type_select': 'エクスポート種別選択',
  'level_reset_type_select': 'リセット種別選択',
  
  // === level_bot モーダル ===
  'level_basic_settings_modal': 'レベル基本設定入力',
  'level_add_stamp_modal': 'スタンプ追加入力',
  'level_edit_stamp_modal': 'スタンプ編集入力',
  'level_add_reward_modal': '報酬追加入力',
  'level_edit_reward_modal': '報酬編集入力',
  'level_custom_message_modal': 'カスタムメッセージ入力',
  'level_reset_confirmation_modal': 'リセット確認入力',
  'level_export_settings_modal': 'エクスポート設定入力',
};

function getAdvancedDisplayName(customId) {
  // level_bot の動的ID
  if (customId.match(/^level_.*_(add|edit|remove|view)_/)) {
    const parts = customId.split('_');
    const action = parts[2];
    const actionNames = { add: '追加', edit: '編集', remove: '削除', view: '表示' };
    return `レベル設定 ${actionNames[action]}`;
  }
  return null; // マッチしない場合はnullを返す
}

module.exports = {
  COMPONENT_NAME_MAPPING,
  getAdvancedDisplayName
};
