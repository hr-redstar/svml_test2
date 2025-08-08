// common/keihi_bot/componentNameMapper.js

const COMPONENT_NAME_MAPPING = {
  // === keihi_bot ボタン ===
  'apply': '経費申請',
  'approve_button': '経費承認',
  'cancel_button': '経費キャンセル',
  'keihi_setup_button': '経費設定',
  
  // === keihi_bot セレクトメニュー ===
  'keihi_category_select': '経費カテゴリ選択',
  'keihi_approver_select': '承認者選択',
  
  // === keihi_bot モーダル ===
  'expense_apply_modal': '経費申請入力',
  'setup_create_forum_modal': 'フォーラム作成入力',
};

function getAdvancedDisplayName(customId) {
  // keihi_bot に特化した動的IDのパターンマッチングがあればここに追加
  return null; // マッチしない場合はnullを返す
}

module.exports = {
  COMPONENT_NAME_MAPPING,
  getAdvancedDisplayName
};
