// hikkake_bot/constants.js

/**
 * このファイルは、hikkake_bot全体で使用されるcustomIdや設定値を一元管理します。
 * IDの重複やタイポを防ぎ、変更を容易にすることを目的とします。
 */
module.exports = Object.freeze({
  // --- Admin Command & Panels ---
  ADMIN_COMMAND: 'hikkake_admin',
  REACTION_SETTING_SUBCOMMAND: 'reaction_setting',
  REACTION_LIST_SUBCOMMAND: 'reaction_list',

  // --- Admin Panel Components ---
  REFRESH_PANEL_BUTTON: 'hikkake_panel_refresh',
  DELETE_REACTION_BUTTON: 'hikkake_reaction_delete',
  DELETE_REACTION_SELECT: 'hikkake_reaction_delete_select',

  // --- Reaction Setting Components (Prefixes) ---
  SET_REACT_PREFIX: 'set_react_',
  MODAL_REACT_PREFIX: 'modal_react_',

  // --- Main Hikkake Feature ---
  HIKKAKE_SETUP_COMMAND: 'hikkake_setup',

  // --- Main Panel Buttons (Prefixes) ---
  ENTER_BUTTON_PREFIX: 'enter_',
  LEAVE_BUTTON_PREFIX: 'leave_',
  ORDER_BUTTON_PREFIX: 'order_',

  // --- Order Action Buttons (Prefixes) ---
  COMPLETE_ORDER_BUTTON_PREFIX: 'complete_order_',
  CANCEL_ORDER_BUTTON_PREFIX: 'cancel_order_',
  DELETE_ORDER_BUTTON_PREFIX: 'delete_order_',

  // --- Modals & Selects ---
  ORDER_MODAL_PREFIX: 'order_modal_',
  CONFIRM_SELECT: 'hikkake_confirm_select',
});