// keihi_bot/constants/messages.js

const MESSAGES = {
  GENERAL: {
    ERROR: '❌ 処理中にエラーが発生しました。しばらく時間をおいて再度お試しください。',
    SUCCESS: '✅ 処理が完了しました。',
    LOADING: '⏳ 処理中です...',
    CANCEL: '❌ 処理をキャンセルしました。'
  },
  
  APPLICATION: {
    SUBMIT_SUCCESS: '✅ 経費申請を受け付けました！承認をお待ちください。',
    SUBMIT_ERROR: '❌ 申請の送信に失敗しました。',
    MODAL_TITLE: '💰 経費申請フォーム',
    INVALID_AMOUNT: '❌ 金額は数値で入力してください。',
    INVALID_DATE: '❌ 日付はYYYY-MM-DD形式で入力してください。',
    AMOUNT_TOO_HIGH: '❌ 申請金額が上限を超えています。',
    DUPLICATE_APPLICATION: '⚠️ 同じ内容の申請が既に存在します。'
  },
  
  APPROVAL: {
    APPROVED: '✅ 経費申請を承認しました。',
    REJECTED: '❌ 経費申請を却下しました。',
    EDIT_REQUESTED: '📝 修正を依頼しました。',
    PERMISSION_DENIED: '❌ 承認権限がありません。',
    ALREADY_PROCESSED: '⚠️ この申請は既に処理済みです。'
  },
  
  CSV: {
    EXPORT_SUCCESS: '✅ CSVファイルを生成しました。',
    EXPORT_ERROR: '❌ CSV生成に失敗しました。',
    NO_DATA: '📝 指定期間にデータがありません。',
    GENERATING: '📊 CSVファイルを生成中...'
  },
  
  CONFIG: {
    ROLE_SET: '✅ 承認ロールを設定しました。',
    CHANNEL_SET: '✅ 通知チャンネルを設定しました。',
    SETTINGS_UPDATED: '✅ 設定を更新しました。',
    INVALID_SETTING: '❌ 設定値が無効です。'
  }
};

module.exports = MESSAGES;
