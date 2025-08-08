// keihi_bot/constants/customIds.js

// 申請関連
const SHINSEI_BUTTON_ID_PREFIX = 'keihi_application_';
const SHINSEI_MODAL_ID = 'keihi_application_modal';

// モーダル入力フィールド
const DATE_INPUT_ID = 'expense_date';
const ITEM_INPUT_ID = 'expense_category';
const AMOUNT_INPUT_ID = 'expense_amount';
const PURPOSE_INPUT_ID = 'expense_purpose';
const DESCRIPTION_INPUT_ID = 'expense_notes';

// 承認関連
const APPROVE_BUTTON_PREFIX = 'keihi_approve_';
const REJECT_BUTTON_PREFIX = 'keihi_reject_';
const EDIT_BUTTON_PREFIX = 'keihi_edit_';

// CSV関連
const CSV_DAILY_BUTTON = 'keihi_csv_daily_button';
const CSV_MONTHLY_BUTTON = 'keihi_csv_monthly_button';
const CSV_QUARTERLY_BUTTON = 'keihi_csv_quarterly_button';

const CSV_DATE_SELECT = 'keihi_csv_date_select';
const CSV_MONTH_SELECT = 'keihi_csv_month_select';
const CSV_QUARTER_SELECT = 'keihi_csv_quarter_select';

// 設定関連
const SETUP_PANEL_BUTTON = 'keihi_setup_panel_button';
const CONFIG_ROLE_SELECT = 'keihi_config_approver_roles';
const CONFIG_VISIBLE_SELECT = 'keihi_config_visible_roles';
const CONFIG_CHANNEL_SELECT = 'keihi_config_log_channel';

// カテゴリ設定
const CATEGORY_ADD_BUTTON = 'keihi_category_add_button';
const CATEGORY_EDIT_BUTTON = 'keihi_category_edit_button';
const CATEGORY_DELETE_BUTTON = 'keihi_category_delete_button';

// 確認・キャンセル
const CONFIRM_PREFIX = 'keihi_confirm_';
const CANCEL_PREFIX = 'keihi_cancel_';

module.exports = {
  SHINSEI_BUTTON_ID_PREFIX,
  SHINSEI_MODAL_ID,
  DATE_INPUT_ID,
  ITEM_INPUT_ID,
  AMOUNT_INPUT_ID,
  PURPOSE_INPUT_ID,
  DESCRIPTION_INPUT_ID,
  APPROVE_BUTTON_PREFIX,
  REJECT_BUTTON_PREFIX,
  EDIT_BUTTON_PREFIX,
  CSV_DAILY_BUTTON,
  CSV_MONTHLY_BUTTON,
  CSV_QUARTERLY_BUTTON,
  CSV_DATE_SELECT,
  CSV_MONTH_SELECT,
  CSV_QUARTER_SELECT,
  SETUP_PANEL_BUTTON,
  CONFIG_ROLE_SELECT,
  CONFIG_VISIBLE_SELECT,
  CONFIG_CHANNEL_SELECT,
  CATEGORY_ADD_BUTTON,
  CATEGORY_EDIT_BUTTON,
  CATEGORY_DELETE_BUTTON,
  CONFIRM_PREFIX,
  CANCEL_PREFIX
};
