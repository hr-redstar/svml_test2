// common/componentNameMapper.js - コンポーネントID→表示名マッピング

const configBotMapper = require('./handlers/config_bot/componentNameMapper');
const levelBotMapper = require('./handlers/level_bot/componentNameMapper');
const hikkakeBotMapper = require('./handlers/hikkake_bot/componentNameMapper');
const uriageBotMapper = require('./handlers/uriage_bot/componentNameMapper');
const syuttaikinBotMapper = require('./handlers/syuttaikin_bot/componentNameMapper');
const keihiBotMapper = require('./handlers/keihi_bot/componentNameMapper');
const kpiBotMapper = require('./handlers/kpi_bot/componentNameMapper');

/**
 * 全てのボットのCOMPONENT_NAME_MAPPINGを統合
 */
const COMPONENT_NAME_MAPPING = {
  ...configBotMapper.COMPONENT_NAME_MAPPING,
  ...levelBotMapper.COMPONENT_NAME_MAPPING,
  ...hikkakeBotMapper.COMPONENT_NAME_MAPPING,
  ...uriageBotMapper.COMPONENT_NAME_MAPPING,
  ...syuttaikinBotMapper.COMPONENT_NAME_MAPPING,
  ...keihiBotMapper.COMPONENT_NAME_MAPPING,
  ...kpiBotMapper.COMPONENT_NAME_MAPPING,
  // userInfo関連はconfig_botに含めるか、独立させるか検討
  // 現状はconfig_botに含めておく
  'admin_user_info_button': 'ユーザー情報管理',
  'user_info_user_select': 'ユーザー情報選択',
  'user_info_view_all': '全ユーザー情報表示',
  'userinfo_user_select': 'ユーザー選択',
  'userinfo_store_select': '店舗選択',
  'userinfo_role_select': '役職選択',
  'userinfo_year_select_recent': '最近の年選択',
  'userinfo_year_select_older': '過去の年選択',
  'userinfo_year_older': 'より古い年',
  'userinfo_year_back': '年選択に戻る',
  'userinfo_month_select': '月選択',
  'userinfo_day_select_first': '前半日付選択',
  'userinfo_day_select_second': '後半日付選択'
};

/**
 * コンポーネントIDを表示名に変換
 * @param {string} customId - コンポーネントのcustomId
 * @returns {string} 表示名（見つからない場合はcustomIdをそのまま返す）
 */
function getComponentDisplayName(customId) {
  // 動的IDのパターンマッチング
  if (customId.includes('_')) {
    // プレフィックスベースの検索
    const baseId = customId.split('_').slice(0, 3).join('_');
    if (COMPONENT_NAME_MAPPING[baseId]) {
      return COMPONENT_NAME_MAPPING[baseId];
    }
    
    // より短いパターンでの検索
    const shortId = customId.split('_').slice(0, 2).join('_');
    if (COMPONENT_NAME_MAPPING[shortId]) {
      return COMPONENT_NAME_MAPPING[shortId];
    }
  }
  
  // 完全一致検索
  return COMPONENT_NAME_MAPPING[customId] || customId;
}

/**
 * 動的に生成されるコンポーネントIDのパターンマッチング
 * 各ボットのgetAdvancedDisplayNameを順番に試す
 * @param {string} customId - コンポーネントのcustomId
 * @returns {string} 表示名
 */
function getAdvancedDisplayName(customId) {
  let displayName = null;

  displayName = hikkakeBotMapper.getAdvancedDisplayName(customId);
  if (displayName) return displayName;

  displayName = levelBotMapper.getAdvancedDisplayName(customId);
  if (displayName) return displayName;

  displayName = uriageBotMapper.getAdvancedDisplayName(customId);
  if (displayName) return displayName;

  displayName = syuttaikinBotMapper.getAdvancedDisplayName(customId);
  if (displayName) return displayName;

  displayName = keihiBotMapper.getAdvancedDisplayName(customId);
  if (displayName) return displayName;

  displayName = kpiBotMapper.getAdvancedDisplayName(customId);
  if (displayName) return displayName;

  displayName = configBotMapper.getAdvancedDisplayName(customId);
  if (displayName) return displayName;

  // どのボットにもマッチしない場合は、従来のgetComponentDisplayNameを使用
  return getComponentDisplayName(customId);
}

module.exports = {
  getComponentDisplayName,
  getAdvancedDisplayName,
  COMPONENT_NAME_MAPPING
};