// 統合ひっかけセレクトメニューコンポーネント - 全てのセレクトメニュー要素を統一管理
const { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

module.exports = {
  // === 店舗・タイプ選択 ===

  /**
   * 店舗選択メニュー
   * @param {Array} storeList 店舗リスト
   * @returns {ActionRowBuilder}
   */
  createStoreSelect(storeList = []) {
    const options = storeList.map(store => 
      new StringSelectMenuOptionBuilder()
        .setLabel(store.name)
        .setValue(store.id)
        .setDescription(store.description || `${store.name}を選択`)
    );

    // デフォルト店舗
    if (options.length === 0) {
      options.push(
        new StringSelectMenuOptionBuilder()
          .setLabel('クエスト依頼')
          .setValue('quest')
          .setDescription('クエスト依頼店舗'),
        new StringSelectMenuOptionBuilder()
          .setLabel('凸スナ')
          .setValue('tosu')
          .setDescription('凸スナイパー店舗'),
        new StringSelectMenuOptionBuilder()
          .setLabel('トロイの木馬')
          .setValue('horse')
          .setDescription('トロイの木馬店舗')
      );
    }

    const select = new StringSelectMenuBuilder()
      .setCustomId('hikkake_store_select')
      .setPlaceholder('店舗を選択してください')
      .addOptions(options);

    return new ActionRowBuilder().addComponents(select);
  },

  /**
   * タイプ選択メニュー
   * @returns {ActionRowBuilder}
   */
  createTypeSelect() {
    const options = [
      new StringSelectMenuOptionBuilder()
        .setLabel('🎯 クエスト依頼')
        .setValue('quest')
        .setDescription('クエスト依頼タイプ'),
      new StringSelectMenuOptionBuilder()
        .setLabel('🔫 凸スナ')
        .setValue('tosu')
        .setDescription('凸スナイパータイプ'),
      new StringSelectMenuOptionBuilder()
        .setLabel('🐎 トロイの木馬')
        .setValue('horse')
        .setDescription('トロイの木馬タイプ')
    ];

    const select = new StringSelectMenuBuilder()
      .setCustomId('hikkake_type_select')
      .setPlaceholder('タイプを選択してください')
      .addOptions(options);

    return new ActionRowBuilder().addComponents(select);
  },

  // === キャスト選択 ===

  /**
   * キャスト選択メニュー
   * @param {string} storeName 店舗名
   * @param {string} type タイプ
   * @param {Array} castList キャストリスト
   * @returns {ActionRowBuilder}
   */
  createCastSelect(storeName, type, castList = []) {
    const options = castList.slice(0, 25).map(cast => // Discord制限: 最大25オプション
      new StringSelectMenuOptionBuilder()
        .setLabel(cast.displayName || cast.username)
        .setValue(cast.id)
        .setDescription(`${cast.displayName}を選択`)
    );

    if (options.length === 0) {
      options.push(
        new StringSelectMenuOptionBuilder()
          .setLabel('利用可能なキャストがいません')
          .setValue('no_cast')
          .setDescription('現在利用可能なキャストがいません')
      );
    }

    const select = new StringSelectMenuBuilder()
      .setCustomId(`hikkake_cast_select_${storeName}_${type}`)
      .setPlaceholder('キャストを選択してください')
      .addOptions(options);

    return new ActionRowBuilder().addComponents(select);
  },

  // === 時間選択 ===

  /**
   * 時間選択メニュー
   * @param {string} panelId パネルID
   * @returns {ActionRowBuilder}
   */
  createTimeSelect(panelId) {
    const options = [
      new StringSelectMenuOptionBuilder()
        .setLabel('⏰ 30分')
        .setValue('30')
        .setDescription('30分間'),
      new StringSelectMenuOptionBuilder()
        .setLabel('⏰ 45分')
        .setValue('45')
        .setDescription('45分間'),
      new StringSelectMenuOptionBuilder()
        .setLabel('⏰ 60分')
        .setValue('60')
        .setDescription('1時間'),
      new StringSelectMenuOptionBuilder()
        .setLabel('⏰ 90分')
        .setValue('90')
        .setDescription('1時間30分'),
      new StringSelectMenuOptionBuilder()
        .setLabel('⏰ 120分')
        .setValue('120')
        .setDescription('2時間')
    ];

    const select = new StringSelectMenuBuilder()
      .setCustomId(`hikkake_time_select_${panelId}`)
      .setPlaceholder('時間を選択してください')
      .addOptions(options);

    return new ActionRowBuilder().addComponents(select);
  },

  // === 人数選択 ===

  /**
   * 人数選択メニュー
   * @param {string} panelId パネルID
   * @returns {ActionRowBuilder}
   */
  createPeopleSelect(panelId) {
    const options = [];
    
    for (let i = 1; i <= 10; i++) {
      options.push(
        new StringSelectMenuOptionBuilder()
          .setLabel(`👥 ${i}人`)
          .setValue(i.toString())
          .setDescription(`${i}人で参加`)
      );
    }

    const select = new StringSelectMenuBuilder()
      .setCustomId(`hikkake_people_select_${panelId}`)
      .setPlaceholder('人数を選択してください')
      .addOptions(options);

    return new ActionRowBuilder().addComponents(select);
  },

  // === 本数選択 ===

  /**
   * 本数選択メニュー
   * @param {string} panelId パネルID
   * @returns {ActionRowBuilder}
   */
  createBottleSelect(panelId) {
    const options = [
      new StringSelectMenuOptionBuilder()
        .setLabel('🍾 1本')
        .setValue('1')
        .setDescription('1本'),
      new StringSelectMenuOptionBuilder()
        .setLabel('🍾 2本')
        .setValue('2')
        .setDescription('2本'),
      new StringSelectMenuOptionBuilder()
        .setLabel('🍾 3本')
        .setValue('3')
        .setDescription('3本'),
      new StringSelectMenuOptionBuilder()
        .setLabel('🍾 5本')
        .setValue('5')
        .setDescription('5本'),
      new StringSelectMenuOptionBuilder()
        .setLabel('🍾 10本')
        .setValue('10')
        .setDescription('10本')
    ];

    const select = new StringSelectMenuBuilder()
      .setCustomId(`hikkake_bottle_select_${panelId}`)
      .setPlaceholder('本数を選択してください')
      .addOptions(options);

    return new ActionRowBuilder().addComponents(select);
  },

  // === 設定関連選択 ===

  /**
   * 設定カテゴリ選択メニュー
   * @returns {ActionRowBuilder}
   */
  createConfigCategorySelect() {
    const options = [
      new StringSelectMenuOptionBuilder()
        .setLabel('👥 スタッフ設定')
        .setValue('staff')
        .setDescription('プラ・カマスタッフ数の設定'),
      new StringSelectMenuOptionBuilder()
        .setLabel('💬 リアクション設定')
        .setValue('reaction')
        .setDescription('自動リアクション文の設定'),
      new StringSelectMenuOptionBuilder()
        .setLabel('⏰ 時間設定')
        .setValue('time')
        .setDescription('デフォルト時間の設定'),
      new StringSelectMenuOptionBuilder()
        .setLabel('🎛️ パネル設定')
        .setValue('panel')
        .setDescription('パネル表示の設定')
    ];

    const select = new StringSelectMenuBuilder()
      .setCustomId('hikkake_config_category')
      .setPlaceholder('設定カテゴリを選択してください')
      .addOptions(options);

    return new ActionRowBuilder().addComponents(select);
  },

  /**
   * リアクション設定選択メニュー
   * @param {string} storeType 店舗タイプ
   * @returns {ActionRowBuilder}
   */
  createReactionConfigSelect(storeType) {
    const options = [
      new StringSelectMenuOptionBuilder()
        .setLabel('👥 人数別リアクション')
        .setValue('num_reactions')
        .setDescription('参加人数に応じたリアクション設定'),
      new StringSelectMenuOptionBuilder()
        .setLabel('🍾 本数別リアクション')
        .setValue('count_reactions')
        .setDescription('本数に応じたリアクション設定'),
      new StringSelectMenuOptionBuilder()
        .setLabel('📝 リアクション一覧')
        .setValue('view_reactions')
        .setDescription('現在のリアクション設定を確認'),
      new StringSelectMenuOptionBuilder()
        .setLabel('🗑️ リアクション削除')
        .setValue('delete_reactions')
        .setDescription('既存のリアクション設定を削除')
    ];

    const select = new StringSelectMenuBuilder()
      .setCustomId(`hikkake_reaction_config_${storeType}`)
      .setPlaceholder('リアクション設定を選択してください')
      .addOptions(options);

    return new ActionRowBuilder().addComponents(select);
  },

  // === 状況確認選択 ===

  /**
   * 状況確認選択メニュー
   * @returns {ActionRowBuilder}
   */
  createStatusSelect() {
    const options = [
      new StringSelectMenuOptionBuilder()
        .setLabel('📊 全店舗状況')
        .setValue('all_stores')
        .setDescription('全店舗の状況を表示'),
      new StringSelectMenuOptionBuilder()
        .setLabel('🎯 クエスト依頼状況')
        .setValue('quest_status')
        .setDescription('クエスト依頼の詳細状況'),
      new StringSelectMenuOptionBuilder()
        .setLabel('🔫 凸スナ状況')
        .setValue('tosu_status')
        .setDescription('凸スナの詳細状況'),
      new StringSelectMenuOptionBuilder()
        .setLabel('🐎 トロイの木馬状況')
        .setValue('horse_status')
        .setDescription('トロイの木馬の詳細状況')
    ];

    const select = new StringSelectMenuBuilder()
      .setCustomId('hikkake_status_select')
      .setPlaceholder('確認したい状況を選択してください')
      .addOptions(options);

    return new ActionRowBuilder().addComponents(select);
  },

  // === 期間選択 ===

  /**
   * 期間選択メニュー
   * @returns {ActionRowBuilder}
   */
  createPeriodSelect() {
    const options = [
      new StringSelectMenuOptionBuilder()
        .setLabel('📅 今日')
        .setValue('today')
        .setDescription('今日の記録'),
      new StringSelectMenuOptionBuilder()
        .setLabel('📅 昨日')
        .setValue('yesterday')
        .setDescription('昨日の記録'),
      new StringSelectMenuOptionBuilder()
        .setLabel('📅 今週')
        .setValue('this_week')
        .setDescription('今週の記録'),
      new StringSelectMenuOptionBuilder()
        .setLabel('📅 先週')
        .setValue('last_week')
        .setDescription('先週の記録'),
      new StringSelectMenuOptionBuilder()
        .setLabel('📅 今月')
        .setValue('this_month')
        .setDescription('今月の記録')
    ];

    const select = new StringSelectMenuBuilder()
      .setCustomId('hikkake_period_select')
      .setPlaceholder('期間を選択してください')
      .addOptions(options);

    return new ActionRowBuilder().addComponents(select);
  }
};
