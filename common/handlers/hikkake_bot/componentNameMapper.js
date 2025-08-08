// common/hikkake_bot/componentNameMapper.js

const COMPONENT_NAME_MAPPING = {
  // === hikkake_bot ボタン ===
  'hikkake_plakama': 'プラカマ設定',
  'hikkake_order': 'ひっかけ報告',
  'hikkake_arrival': 'ふらっと来店',
  'hikkake_douhan': '同伴報告',
  'hikkake_status_check': '状況確認',
  'hikkake_panel_update': 'パネル更新',
  
  // === hikkake_bot セレクトメニュー ===
  'hikkake_plakama_step1': 'プラ人数選択',
  'hikkake_plakama_step2': 'カマ人数選択',
  'hikkake_order_guest_count': 'お客様人数選択（ひっかけ）',
  'hikkake_arrival_guest_count': 'お客様人数選択（ふらっと）',
  'hikkake_order_pura_count': '担当プラ人数選択（ひっかけ）',
  'hikkake_arrival_pura_count': '担当プラ人数選択（ふらっと）',
  
  // === hikkake_bot モーダル ===
  'hikkake_order_final_modal': 'ひっかけ詳細入力',
  'hikkake_arrival_final_modal': 'ふらっと詳細入力',
  'hikkake_douhan_modal': '同伴詳細入力',
  'hikkake_board_creation_modal': '掲示板作成入力',
};

function getAdvancedDisplayName(customId) {
  // hikkake_bot の店舗パネルボタン（基本機能）
  if (customId.match(/^hikkake_(.+)_(quest|tosu|horse)_(plakama|order|arrival|douhan)$/)) {
    const parts = customId.split('_');
    const storeName = parts[1];
    const storeType = parts[2];
    const action = parts[3];
    
    const storeNames = { quest: 'クエスト', tosu: 'トス', horse: 'ホース' };
    const actionNames = { 
      plakama: 'プラカマ設定', 
      order: 'ひっかけた', 
      arrival: 'ふらっと来た', 
      douhan: '同伴' 
    };
    
    return `${storeNames[storeType] || storeType} ${actionNames[action]}`;
  }
  
  // hikkake_bot の管理ボタン（確定・失敗・退店）
  if (customId.match(/^hikkake_(.+)_(quest|tosu|horse)_(confirm|fail|leave)$/)) {
    const parts = customId.split('_');
    const storeType = parts[2];
    const action = parts[3];
    
    const storeNames = { quest: 'クエスト', tosu: 'トス', horse: 'ホース' };
    const actionNames = { 
      confirm: 'ひっかけ確定', 
      fail: 'ひっかけ失敗', 
      leave: 'ログ完了(退店)' 
    };
    
    return `${storeNames[storeType] || storeType} ${actionNames[action]}`;
  }
  
  // hikkake_bot のステップ式セレクトメニュー
  if (customId.match(/^hikkake_plakama_step1_(.+)_(quest|tosu|horse)$/)) {
    const parts = customId.split('_');
    const storeType = parts[4];
    const storeNames = { quest: 'クエスト', tosu: 'トス', horse: 'ホース' };
    return `${storeNames[storeType] || storeType} プラ人数選択`;
  }
  
  if (customId.match(/^hikkake_plakama_step2_(.+)_(quest|tosu|horse)_(\d+)$/)) {
    const parts = customId.split('_');
    const storeType = parts[4];
    const storeNames = { quest: 'クエスト', tosu: 'トス', horse: 'ホース' };
    return `${storeNames[storeType] || storeType} カマ人数選択`;
  }
  
  if (customId.match(/^hikkake_(order|arrival)_guest_count_(.+)_(quest|tosu|horse)$/)) {
    const parts = customId.split('_');
    const action = parts[1];
    const storeType = parts[5];
    const storeNames = { quest: 'クエスト', tosu: 'トス', horse: 'ホース' };
    const actionNames = { order: 'ひっかけ', arrival: 'ふらっと' };
    return `${storeNames[storeType] || storeType} お客様人数選択（${actionNames[action]}）`;
  }
  
  if (customId.match(/^hikkake_(order|arrival)_pura_count_(.+)_(quest|tosu|horse)_(\d+)$/)) {
    const parts = customId.split('_');
    const action = parts[1];
    const storeType = parts[5];
    const storeNames = { quest: 'クエスト', tosu: 'トス', horse: 'ホース' };
    const actionNames = { order: 'ひっかけ', arrival: 'ふらっと' };
    return `${storeNames[storeType] || storeType} 担当プラ人数選択（${actionNames[action]}）`;
  }
  
  if (customId.match(/^hikkake_(order|arrival)_kama_count_(.+)_(quest|tosu|horse)_(\d+)_(\d+)$/)) {
    const parts = customId.split('_');
    const action = parts[1];
    const storeType = parts[5];
    const storeNames = { quest: 'クエスト', tosu: 'トス', horse: 'ホース' };
    const actionNames = { order: 'ひっかけ', arrival: 'ふらっと' };
    return `${storeNames[storeType] || storeType} 担当カマ人数選択（${actionNames[action]}）`;
  }
  
  if (customId.match(/^hikkake_(order|arrival)_bottle_count_(.+)_(quest|tosu|horse)_(\d+)_(\d+)_(\d+)$/)) {
    const parts = customId.split('_');
    const action = parts[1];
    const storeType = parts[5];
    const storeNames = { quest: 'クエスト', tosu: 'トス', horse: 'ホース' };
    const actionNames = { order: 'ひっかけ', arrival: 'ふらっと' };
    return `${storeNames[storeType] || storeType} ボトル本数選択（${actionNames[action]}）`;
  }
  
  // hikkake_bot の同伴関連
  if (customId.match(/^hikkake_douhan_step1_user_(.+)_(quest|tosu|horse)$/)) {
    const parts = customId.split('_');
    const storeType = parts[5];
    const storeNames = { quest: 'クエスト', tosu: 'トス', horse: 'ホース' };
    return `${storeNames[storeType] || storeType} 同伴キャスト選択`;
  }
  
  if (customId.match(/^hikkake_douhan_submit_(.+)_(quest|tosu|horse)_(\d+)$/)) {
    const parts = customId.split('_');
    const storeType = parts[3];
    const storeNames = { quest: 'クエスト', tosu: 'トス', horse: 'ホース' };
    return `${storeNames[storeType] || storeType} 同伴詳細入力`;
  }
  
  // hikkake_bot のログ操作
  if (customId.match(/^hikkake_resolve_log_(confirm|fail)_(.+)_(quest|tosu|horse)$/)) {
    const parts = customId.split('_');
    const action = parts[3];
    const storeType = parts[5];
    const storeNames = { quest: 'クエスト', tosu: 'トス', horse: 'ホース' };
    const actionNames = { confirm: '確定', fail: '失敗' };
    return `${storeNames[storeType] || storeType} ログ${actionNames[action]}選択`;
  }
  
  if (customId.match(/^hikkake_retire_log_(.+)_(quest|tosu|horse)$/)) {
    const parts = customId.split('_');
    const storeType = parts[4];
    const storeNames = { quest: 'クエスト', tosu: 'トス', horse: 'ホース' };
    return `${storeNames[storeType] || storeType} 退店ログ選択`;
  }
  
  // hikkake_bot のキャンセルボタン
  if (customId.match(/^cancel_order_(.+)_(quest|tosu|horse)_(.+)$/)) {
    const parts = customId.split('_');
    const storeType = parts[3];
    const storeNames = { quest: 'クエスト', tosu: 'トス', horse: 'ホース' };
    return `${storeNames[storeType] || storeType} オーダーキャンセル`;
  }
  
  // hikkake_bot のリアクション関連
  if (customId.match(/^hikkake_reaction_add_(num|count)$/)) {
    const parts = customId.split('_');
    const type = parts[3];
    const typeNames = { num: '番号', count: '人数' };
    return `リアクション${typeNames[type]}追加`;
  }
  
  if (customId.match(/^hikkake_reaction_submit_(quest|tosu|horse)_(num|count)$/)) {
    const parts = customId.split('_');
    const storeType = parts[3];
    const type = parts[4];
    const storeNames = { quest: 'クエスト', tosu: 'トス', horse: 'ホース' };
    const typeNames = { num: '番号', count: '人数' };
    return `${storeNames[storeType] || storeType} リアクション${typeNames[type]}入力`;
  }
  return null; // マッチしない場合はnullを返す
}

module.exports = {
  COMPONENT_NAME_MAPPING,
  getAdvancedDisplayName
};
