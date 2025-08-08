// hikkake_bot/components/panels/hikkakePanels.js - ひっかけ関連パネルコンポーネント

const { createHikkakeOrderPanelEmbed, createHikkakeStatsEmbed, createErrorEmbed, createSuccessEmbed } = require('../embeds/hikkakeEmbeds');
const {
  createHikkakeOrderButton,
  createOrderConfirmationButtons,
  createOrderManagementButtons,
  createSettingsButtons
} = require('../buttons/hikkakeButtons');

/**
 * ひっかけ注文パネル
 */
function createHikkakeOrderPanel() {
  return {
    embeds: [createHikkakeOrderPanelEmbed()],
    components: [createHikkakeOrderButton()]
  };
}

/**
 * 注文確認パネル
 * @param {object} orderData 
 */
function createOrderConfirmationPanel(orderData) {
  const components = [];
  
  // 承認待ちまたは進行中の場合のみボタンを表示
  if (['pending', 'active'].includes(orderData.status)) {
    components.push(createOrderConfirmationButtons(orderData.id));
  }

  return {
    embeds: [createOrderConfirmationEmbed(orderData)],
    components: components
  };
}

/**
 * 管理パネル
 */
function createManagementPanel() {
  return {
    content: '🍾 **ひっかけ注文管理システム**\n\n管理機能を選択してください。',
    components: [createOrderManagementButtons()]
  };
}

/**
 * 設定パネル
 */
function createSettingsPanel() {
  return {
    content: '⚙️ **ひっかけシステム設定**\n\n設定を変更できます。',
    components: [createSettingsButtons()]
  };
}

/**
 * 統計パネル
 * @param {object} stats 
 * @param {string} period 
 */
function createStatsPanel(stats, period) {
  return {
    embeds: [createHikkakeStatsEmbed(stats, period)],
    components: [createOrderManagementButtons()]
  };
}

/**
 * 注文一覧パネル
 * @param {Array} orders 
 * @param {string} status 
 * @param {number} page 
 * @param {number} totalPages 
 */
function createOrderListPanel(orders, status, page = 1, totalPages = 1) {
  const components = [];
  
  // ページネーションボタンを追加
  if (totalPages > 1) {
    components.push(createPaginationButtons(page, totalPages, status));
  }
  
  // 管理ボタンを追加
  components.push(createOrderManagementButtons());

  return {
    embeds: [createOrderListEmbed(orders, status, page, totalPages)],
    components: components
  };
}

/**
 * ドリンクタイプ選択パネル
 * @param {import('discord.js').ActionRowBuilder} drinkTypeSelect 
 */
function createDrinkTypeSelectPanel(drinkTypeSelect) {
  return {
    content: '🥂 ドリンクタイプを選択してください。',
    components: [drinkTypeSelect]
  };
}

/**
 * 期間選択パネル
 * @param {import('discord.js').ActionRowBuilder} periodSelect 
 */
function createPeriodSelectPanel(periodSelect) {
  return {
    content: '📅 統計を表示する期間を選択してください。',
    components: [periodSelect]
  };
}

/**
 * 検索結果パネル
 * @param {Array} results 
 * @param {string} searchType 
 */
function createSearchResultPanel(results, searchType) {
  const searchTypeText = {
    'date': '日付',
    'user': 'ユーザー',
    'drink': 'ドリンク'
  };

  return {
    content: `🔍 **${searchTypeText[searchType]}検索結果**\n\n${results.length}件の注文が見つかりました。`,
    components: results.length > 0 ? [createOrderManagementButtons()] : []
  };
}

/**
 * 確認パネル
 * @param {string} message 
 * @param {Array} components 
 */
function createConfirmationPanel(message, components = []) {
  return {
    content: message,
    components: components
  };
}

/**
 * 完了パネル
 * @param {string} message 
 * @param {import('discord.js').EmbedBuilder} embed 
 */
function createCompletionPanel(message, embed = null) {
  const panel = {
    content: message,
    components: []
  };

  if (embed) {
    panel.embeds = [embed];
  }

  return panel;
}

/**
 * エラーパネル
 * @param {string} errorMessage 
 */
function createErrorPanel(errorMessage) {
  return {
    embeds: [createErrorEmbed(errorMessage)],
    components: []
  };
}

/**
 * 成功パネル
 * @param {string} successMessage 
 */
function createSuccessPanel(successMessage) {
  return {
    embeds: [createSuccessEmbed(successMessage)],
    components: []
  };
}

/**
 * ひっかけ設定パネル構築（config_bot用）
 * @param {string} guildId - ギルドID
 * @param {object} hikkakeSettings - ひっかけ設定データ
 */
async function buildHikkakeSetupPanel(guildId, hikkakeSettings = {}) {
  const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
  const { readJsonFromGCS } = require('../../../common/gcs/gcsUtils');
  
  try {
    // 設定データの読み込み（なければデフォルト）
    const settings = hikkakeSettings.stores || {};
    const storeNames = Object.keys(settings);
    
    // 埋め込みメッセージの作成
    const embed = new EmbedBuilder()
      .setTitle('ひっかけ設定パネル')
      .setDescription('各店舗のひっかけパネルの設置状況を確認・管理できます。')
      .setColor('#0099ff')
      .setTimestamp();

    // 店舗ごとの設置状況を表示
    if (storeNames.length > 0) {
      let storeStatus = '';
      for (const storeName of storeNames) {
        const storeSettings = settings[storeName];
        const isSetup = storeSettings && storeSettings.channelId;
        const statusIcon = isSetup ? '✅' : '❌';
        const statusText = isSetup ? `設置済み (<#${storeSettings.channelId}>)` : '未設置';
        storeStatus += `${statusIcon} **${storeName}**: ${statusText}\n`;
      }
      embed.addFields({ name: '📊 設置状況', value: storeStatus, inline: false });
    } else {
      embed.addFields({ name: '📊 設置状況', value: '店舗が設定されていません。', inline: false });
    }

    // 操作ボタンの作成
    const actionRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('hikkake_panel_button')
          .setLabel('🛠️ パネル設置・管理')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('hikkake_refresh_status')
          .setLabel('🔄 状況更新')
          .setStyle(ButtonStyle.Secondary)
      );

    return {
      embeds: [embed],
      components: [actionRow]
    };
  } catch (error) {
    console.error('ひっかけ設定パネル構築エラー:', error);
    
    // エラー時のフォールバック
    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ エラー')
      .setDescription('ひっかけ設定パネルの構築中にエラーが発生しました。')
      .setColor('#ff0000')
      .setTimestamp();
    
    return {
      embeds: [errorEmbed],
      components: []
    };
  }
}

module.exports = {
  createHikkakeOrderPanel,
  createOrderConfirmationPanel,
  createManagementPanel,
  createSettingsPanel,
  createStatsPanel,
  createOrderListPanel,
  createDrinkTypeSelectPanel,
  createPeriodSelectPanel,
  createSearchResultPanel,
  createConfirmationPanel,
  createCompletionPanel,
  createErrorPanel,
  createSuccessPanel,
  buildHikkakeSetupPanel
};
