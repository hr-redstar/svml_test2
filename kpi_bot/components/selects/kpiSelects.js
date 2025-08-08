// kpi_bot/components/selects/kpiSelects.js - KPIシステムセレクトメニューコンポーネント

const { ActionRowBuilder, StringSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType } = require('discord.js');

// KPIセレクトメニューID定数
const KPI_SELECT_IDS = {
  STORE_SELECT: 'kpi_store_select',
  CHANNEL_SELECT: 'kpi_channel_select',
  LOG_CHANNEL_SELECT: 'kpi_log_channel_select'
};

/**
 * 店舗選択セレクトメニューを作成
 */
function createStoreSelectMenu(stores) {
  const options = stores.map((store, index) => ({
    label: store,
    description: `${store}のKPI管理パネルを設置`,
    value: `store_${index}`,
    emoji: '🏢'
  }));

  return new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(KPI_SELECT_IDS.STORE_SELECT)
        .setPlaceholder('📍 店舗を選択してください')
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions(options)
    );
}

/**
 * チャンネル選択セレクトメニューを作成
 */
function createChannelSelectMenu() {
  return new ActionRowBuilder()
    .addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId(KPI_SELECT_IDS.CHANNEL_SELECT)
        .setPlaceholder('📝 KPI管理パネル設置チャンネルを選択してください')
        .setChannelTypes(ChannelType.GuildText)
        .setMinValues(1)
        .setMaxValues(1)
    );
}

/**
 * KPIログチャンネル選択セレクトメニューを作成
 */
function createLogChannelSelectMenu() {
  return new ActionRowBuilder()
    .addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId(KPI_SELECT_IDS.LOG_CHANNEL_SELECT)
        .setPlaceholder('📊 KPIログ表示チャンネルを選択してください')
        .setChannelTypes(ChannelType.GuildText)
        .setMinValues(1)
        .setMaxValues(1)
    );
}

/**
 * 動的店舗選択メニューを作成（店舗名付き）
 */
function createDynamicStoreSelectMenu(customId, stores, placeholder = '店舗を選択してください') {
  const options = stores.map((store, index) => ({
    label: store,
    description: `${store}の設定`,
    value: `${store}`,
    emoji: '🏢'
  }));

  return new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(customId)
        .setPlaceholder(placeholder)
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions(options)
    );
}

/**
 * 店舗名を表示用に変換（フォールバック）
 */
function getStoreDisplayName(storeValue) {
  // 数値インデックスの場合はそのまま返す
  if (storeValue.startsWith('store_')) {
    return storeValue.replace('store_', '');
  }
  
  // 既存の固定店舗名の場合
  const storeNames = {
    shibuya: '渋谷店',
    shinjuku: '新宿店',
    ikebukuro: '池袋店',
    ginza: '銀座店',
    roppongi: '六本木店'
  };
  return storeNames[storeValue] || storeValue;
}

// Getter関数
function getStoreSelectId() {
  return KPI_SELECT_IDS.STORE_SELECT;
}

function getChannelSelectId() {
  return KPI_SELECT_IDS.CHANNEL_SELECT;
}

function getLogChannelSelectId() {
  return KPI_SELECT_IDS.LOG_CHANNEL_SELECT;
}

module.exports = {
  KPI_SELECT_IDS,
  createStoreSelectMenu,
  createChannelSelectMenu,
  createLogChannelSelectMenu,
  createDynamicStoreSelectMenu,
  getStoreDisplayName,
  getStoreSelectId,
  getChannelSelectId,
  getLogChannelSelectId
};
