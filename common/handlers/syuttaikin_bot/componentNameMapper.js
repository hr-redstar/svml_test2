// common/syuttaikin_bot/componentNameMapper.js

const COMPONENT_NAME_MAPPING = {
  // === syuttaikin_bot ボタン ===
  'syuttaikin_cast_register': 'キャスト出退勤登録',
  'syuttaikin_staff_register': '内勤出退勤登録',
  'syuttaikin_clock-in_normal': '通常出勤',
  'syuttaikin_clock-out_normal': '通常退勤',
  'syuttaikin_clock-in_help': 'ヘルプ出勤',
  'syuttaikin_clock-out_help': 'ヘルプ退勤',
  'cast_role_quest': 'クエスト出勤',
  'cast_role_totsu': 'トツ出勤', 
  'cast_role_troy': 'トロイ出勤',
  'time_arrival_add': '出勤時間追加',
  'time_departure_add': '退勤時間追加',
  'time_arrival_delete': '出勤時間削除',
  'time_departure_delete': '退勤時間削除',
  'cast_settings_work_add': '出勤時間登録',
  'cast_settings_work_del': '出勤時間削除',
  'cast_settings_leave_add': '退勤時間登録',
  'cast_settings_leave_del': '退勤時間削除',
  'cast_settings_notify_channel': '通知ログ設定',
  
  // === syuttaikin_bot セレクトメニュー ===
  'syuttaikin_user_select': 'ユーザー選択',
  'syuttaikin_date_select': '日付選択',
  'syuttaikin_time_select': '時刻選択',
  'syuttaikin_type_select': '出退勤種別選択',
  
  // === syuttaikin_bot モーダル ===
  'work_date_modal_cast': 'キャスト日付入力',
  'work_date_modal_naiki': '内勤日付入力',
  'work_date_modal': '出勤日付入力',
  'time_register_modal': '時間登録入力',
  'cast_settings_work_add_modal': '出勤時間追加入力',
  'work_date_input': '出勤日付',
  'work_time_input': '出勤時間',
  'break_time_input': '休憩時間',
  'memo_input': 'メモ',
  'time_list_input': '時間一覧',
  'work_times': '勤務時間',
};

function getAdvancedDisplayName(customId) {
  // syuttaikin_bot の動的ID
  if (customId.match(/^work_date_modal_(cast|naiki)$/)) {
    const parts = customId.split('_');
    const type = parts[3];
    const typeNames = { cast: 'キャスト', naiki: '内勤' };
    return `${typeNames[type]}日付入力`;
  }
  
  if (customId.match(/^cast_arrival_(.+)$/) || customId.match(/^cast_departure_(.+)$/)) {
    const isArrival = customId.includes('arrival');
    return isArrival ? 'キャスト出勤' : 'キャスト退勤';
  }
  
  if (customId.match(/^user_select_(.+)$/)) {
    return 'ユーザー選択';
  }
  
  if (customId.match(/^date_select_(.+)$/)) {
    return '日付選択';
  }
  
  if (customId.match(/^time_delete_select_(.+)$/)) {
    return '時間削除選択';
  }
  
  if (customId.match(/^cast_shift_select_(.+)$/)) {
    return 'キャストシフト選択';
  }
  
  if (customId.match(/^cast_settings_(.+)$/)) {
    const parts = customId.split('_');
    const action = parts.slice(2).join('_');
    const actionNames = {
      'work_add': '出勤時間登録',
      'work_del': '出勤時間削除',
      'leave_add': '退勤時間登録',
      'leave_del': '退勤時間削除',
      'notify_channel': '通知ログ設定',
      'work_add_modal': '出勤時間追加入力'
    };
    return actionNames[action] || `キャスト設定 ${action}`;
  }
  return null; // マッチしない場合はnullを返す
}

module.exports = {
  COMPONENT_NAME_MAPPING,
  getAdvancedDisplayName
};
