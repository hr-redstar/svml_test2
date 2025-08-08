// common/uriage_bot/componentNameMapper.js

const COMPONENT_NAME_MAPPING = {
  // === uriage_bot ボタン ===
  'uriage_show_sales_report_modal': '売上報告',
  'uriage_setup_panel': '売上設定',
  'sales_report_modal_button': '売上報告ボタン',
  'csv_export_monthly': '月別CSV出力',
  'csv_export_daily': '日別CSV出力',
  'csv_export_quarterly': '四半期CSV出力',
  
  // === uriage_bot セレクトメニュー ===
  'uriage_store_select': '店舗選択',
  'uriage_role_select': '役職選択',
  'csv_select_year': '年選択',
  'csv_select_year_daily': '日別年選択',
  'csv_select_year_quarterly': '四半期年選択',
  'csv_select_month': '月選択',
  'csv_select_month_final': '最終月選択',
  'csv_select_month_daily': '日別月選択',
  'csv_select_quarter_final': '最終四半期選択',
  'select_edit_report': '編集レポート選択',
  
  // === uriage_bot モーダル ===
  'sales_report_modal': '売上報告入力',
  'sales_date': '売上日付',
  'total_sales': '総売上',
  'cash_sales': '現金売上',
  'card_sales': 'カード売上',
  'expenses': '経費',
  'report_date': '報告日付',
  'report_total': '総売上報告',
  'report_cash': '現金報告',
  'report_card': 'カード報告',
  'report_expense': '経費報告',
};

function getAdvancedDisplayName(customId) {
  // uriage_bot の動的ID
  if (customId.match(/^csv_select_(year|month|quarter)/)) {
    const parts = customId.split('_');
    const type = parts[2];
    const typeNames = { year: '年', month: '月', quarter: '四半期' };
    return `CSV ${typeNames[type]}選択`;
  }
  
  if (customId.match(/^uriage_(approve|edit)_(.+)$/)) {
    const parts = customId.split('_');
    const action = parts[1];
    const actionNames = { approve: '承認', edit: '編集' };
    return `売上${actionNames[action]}`;
  }
  
  if (customId.match(/^sales_report_edit_modal_(.+)$/)) {
    return '売上報告編集入力';
  }
  
  if (customId.match(/^edit_sales_report_modal_(.+)$/)) {
    return '売上編集モーダル';
  }
  return null; // マッチしない場合はnullを返す
}

module.exports = {
  COMPONENT_NAME_MAPPING,
  getAdvancedDisplayName
};
