// 統合ひっかけbotコンポーネント - 全てのUI要素を統一管理

// ボタンコンポーネント
const buttons = require('./buttons/hikkakeButtons');

// モーダルコンポーネント  
const modals = require('./modals/hikkakeModals');

// セレクトメニューコンポーネント
const selects = require('./selects/hikkakeSelects');

// エンベッドコンポーネント
const embeds = require('./embeds/hikkakeEmbeds');

// パネルコンポーネント
const panels = require('./panels/hikkakePanels');

module.exports = {
  // 直接アクセス
  buttons,
  modals,
  selects,
  embeds,
  panels,

  // 便利メソッド（後方互換性）
  createJoinButton: buttons.createJoinButton,
  createCancelButton: buttons.createCancelButton,
  createStaffButtons: buttons.createStaffButtons,
  createStaffModal: modals.createStaffModal,
  createKamaModal: modals.createKamaModal,
  createStoreSelect: selects.createStoreSelect,
  createTypeSelect: selects.createTypeSelect,

  // 統合アクセス用ヘルパー
  getAllComponents() {
    return {
      buttons,
      modals,
      selects,
      embeds,
      panels
    };
  },

  // コンポーネントタイプ確認
  getComponentTypes() {
    return ['buttons', 'modals', 'selects', 'embeds', 'panels'];
  }
};
