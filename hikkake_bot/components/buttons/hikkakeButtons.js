// 統合ひっかけボタンコンポーネント - 全てのボタン要素を統一管理
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  // === 基本操作ボタン ===
  
  /**
   * ひっかけ参加ボタン
   * @param {string} storeName 店舗名
   * @param {string} type タイプ（quest/tosu/horse）
   * @returns {ActionRowBuilder}
   */
  createJoinButton(storeName, type) {
    return new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`hikkake_join_${storeName}_${type}`)
          .setLabel('🍾 参加する')
          .setStyle(ButtonStyle.Primary)
      );
  },

  /**
   * ひっかけキャンセルボタン
   * @param {string} storeName 店舗名
   * @param {string} type タイプ
   * @param {string} userId ユーザーID
   * @returns {ActionRowBuilder}
   */
  createCancelButton(storeName, type, userId) {
    return new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`hikkake_cancel_${storeName}_${type}_${userId}`)
          .setLabel('❌ キャンセル')
          .setStyle(ButtonStyle.Danger)
      );
  },

  /**
   * スタッフ設定ボタン群
   * @param {string} storeName 店舗名
   * @param {string} type タイプ
   * @returns {ActionRowBuilder}
   */
  createStaffButtons(storeName, type) {
    return new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`hikkake_staff_${storeName}_${type}`)
          .setLabel('👥 プラスタッフ')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`hikkake_kama_${storeName}_${type}`)
          .setLabel('🎪 カマスタッフ')
          .setStyle(ButtonStyle.Secondary)
      );
  },

  // === パネル管理ボタン ===

  /**
   * パネル操作ボタン群
   * @param {string} panelId パネルID
   * @returns {ActionRowBuilder}
   */
  createPanelActionButtons(panelId) {
    return new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`hikkake_reset_${panelId}`)
          .setLabel('🔄 リセット')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`panel_delete_${panelId}`)
          .setLabel('🗑️ 削除')
          .setStyle(ButtonStyle.Danger)
      );
  },

  /**
   * 設定ボタン群
   * @returns {ActionRowBuilder}
   */
  createSettingsButtons() {
    return new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('hikkake_settings')
          .setLabel('⚙️ 設定')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('hikkake_status_list')
          .setLabel('📊 状況一覧')
          .setStyle(ButtonStyle.Primary)
      );
  },

  // === 時間・人数・本数設定ボタン ===

  /**
   * 時間設定ボタン群
   * @param {string} panelId パネルID
   * @returns {ActionRowBuilder}
   */
  createTimeButtons(panelId) {
    return new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`hikkake_time_30_${panelId}`)
          .setLabel('30分')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`hikkake_time_60_${panelId}`)
          .setLabel('60分')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`hikkake_time_90_${panelId}`)
          .setLabel('90分')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`hikkake_time_custom_${panelId}`)
          .setLabel('⏰ カスタム')
          .setStyle(ButtonStyle.Primary)
      );
  },

  /**
   * 人数設定ボタン群
   * @param {string} panelId パネルID
   * @returns {ActionRowBuilder}
   */
  createPeopleButtons(panelId) {
    return new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`hikkake_people_1_${panelId}`)
          .setLabel('1人')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`hikkake_people_2_${panelId}`)
          .setLabel('2人')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`hikkake_people_3_${panelId}`)
          .setLabel('3人')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`hikkake_people_custom_${panelId}`)
          .setLabel('👥 カスタム')
          .setStyle(ButtonStyle.Primary)
      );
  },

  /**
   * 本数設定ボタン群
   * @param {string} panelId パネルID
   * @returns {ActionRowBuilder}
   */
  createBottleButtons(panelId) {
    return new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`hikkake_bottle_1_${panelId}`)
          .setLabel('1本')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`hikkake_bottle_2_${panelId}`)
          .setLabel('2本')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`hikkake_bottle_5_${panelId}`)
          .setLabel('5本')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`hikkake_bottle_custom_${panelId}`)
          .setLabel('🍾 カスタム')
          .setStyle(ButtonStyle.Primary)
      );
  },

  // === 特殊操作ボタン ===

  /**
   * ひっかけ予定追加ボタン
   * @returns {ActionRowBuilder}
   */
  createPlanButton() {
    return new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('hikkake_add_plan')
          .setLabel('📋 ひっかけ予定追加')
          .setStyle(ButtonStyle.Primary)
      );
  },

  /**
   * ふらっと来た客ボタン
   * @returns {ActionRowBuilder}
   */
  createWalkinButton() {
    return new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('hikkake_walkin')
          .setLabel('✨ ふらっと来た客')
          .setStyle(ButtonStyle.Success)
      );
  },

  /**
   * 同伴ボタン
   * @param {string} storeName 店舗名
   * @param {string} type タイプ
   * @param {string} castUserId キャストユーザーID
   * @returns {ActionRowBuilder}
   */
  createDouhanButton(storeName, type, castUserId) {
    return new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`hikkake_douhan_${storeName}_${type}_${castUserId}`)
          .setLabel('👫 同伴')
          .setStyle(ButtonStyle.Primary)
      );
  },

  /**
   * リアクション設定ボタン群
   * @param {string} storeType 店舗タイプ
   * @returns {ActionRowBuilder}
   */
  createReactionButtons(storeType) {
    return new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`hikkake_reaction_num_${storeType}`)
          .setLabel('👥 人数リアクション')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`hikkake_reaction_count_${storeType}`)
          .setLabel('🍾 本数リアクション')
          .setStyle(ButtonStyle.Secondary)
      );
  },

  // === ページネーション・ナビゲーション ===

  /**
   * ページネーションボタン
   * @param {number} page 現在のページ
   * @param {number} totalPages 総ページ数
   * @param {string} baseCustomId ベースカスタムID
   * @returns {ActionRowBuilder}
   */
  createPaginationButtons(page, totalPages, baseCustomId) {
    const buttons = [];
    
    if (page > 1) {
      buttons.push(
        new ButtonBuilder()
          .setCustomId(`${baseCustomId}_prev_${page - 1}`)
          .setLabel('◀️ 前')
          .setStyle(ButtonStyle.Secondary)
      );
    }
    
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`${baseCustomId}_page_${page}`)
        .setLabel(`${page}/${totalPages}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );
    
    if (page < totalPages) {
      buttons.push(
        new ButtonBuilder()
          .setCustomId(`${baseCustomId}_next_${page + 1}`)
          .setLabel('▶️ 次')
          .setStyle(ButtonStyle.Secondary)
      );
    }
    
    return new ActionRowBuilder().addComponents(buttons);
  },

  /**
   * 戻るボタン
   * @param {string} returnTo 戻り先のカスタムID
   * @returns {ActionRowBuilder}
   */
  createBackButton(returnTo) {
    return new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`hikkake_back_${returnTo}`)
          .setLabel('🔙 戻る')
          .setStyle(ButtonStyle.Secondary)
      );
  },

  /**
   * 確認ダイアログボタン群
   * @param {string} confirmId 確認用ID
   * @returns {ActionRowBuilder}
   */
  createConfirmButtons(confirmId) {
    return new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`hikkake_confirm_yes_${confirmId}`)
          .setLabel('✅ はい')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`hikkake_confirm_no_${confirmId}`)
          .setLabel('❌ いいえ')
          .setStyle(ButtonStyle.Danger)
      );
  }
};
