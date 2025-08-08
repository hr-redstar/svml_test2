// 統合ひっかけモーダルコンポーネント - 全てのモーダル要素を統一管理
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  // === スタッフ設定モーダル ===

  /**
   * プラスタッフ設定モーダル
   * @param {string} storeName 店舗名
   * @param {string} type タイプ
   * @returns {ModalBuilder}
   */
  createStaffModal(storeName, type) {
    const modal = new ModalBuilder()
      .setCustomId('hikkake_staff_modal')
      .setTitle(`${storeName} - ${type.toUpperCase()} プラスタッフ設定`);

    const staffInput = new TextInputBuilder()
      .setCustomId('staff_count')
      .setLabel('プラスタッフ数を入力してください')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('例: 3')
      .setRequired(true)
      .setMaxLength(2);

    const firstActionRow = new ActionRowBuilder().addComponents(staffInput);
    modal.addComponents(firstActionRow);

    return modal;
  },

  /**
   * カマスタッフ設定モーダル
   * @param {string} storeName 店舗名
   * @param {string} type タイプ
   * @returns {ModalBuilder}
   */
  createKamaModal(storeName, type) {
    const modal = new ModalBuilder()
      .setCustomId('hikkake_kama_modal')
      .setTitle(`${storeName} - ${type.toUpperCase()} カマスタッフ設定`);

    const kamaInput = new TextInputBuilder()
      .setCustomId('kama_count')
      .setLabel('カマスタッフ数を入力してください')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('例: 2')
      .setRequired(true)
      .setMaxLength(2);

    const firstActionRow = new ActionRowBuilder().addComponents(kamaInput);
    modal.addComponents(firstActionRow);

    return modal;
  },

  // === ひっかけ操作モーダル ===

  /**
   * ひっかけ予定追加モーダル
   * @returns {ModalBuilder}
   */
  createPlanModal() {
    const modal = new ModalBuilder()
      .setCustomId('hikkake_plan_modal')
      .setTitle('ひっかけ予定追加');

    const planInput = new TextInputBuilder()
      .setCustomId('plan_content')
      .setLabel('ひっかけ予定の内容を入力してください')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('例: 〇時〇分頃 〇〇様 〇人 同伴予定')
      .setRequired(true)
      .setMaxLength(500);

    const firstActionRow = new ActionRowBuilder().addComponents(planInput);
    modal.addComponents(firstActionRow);

    return modal;
  },

  /**
   * ふらっと来た客記録モーダル
   * @returns {ModalBuilder}
   */
  createWalkinModal() {
    const modal = new ModalBuilder()
      .setCustomId('hikkake_walkin_modal')
      .setTitle('ふらっと来た客記録');

    const walkinInput = new TextInputBuilder()
      .setCustomId('walkin_info')
      .setLabel('来店客の情報を入力してください')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('例: 〇人組、〇〇様、特徴など')
      .setRequired(true)
      .setMaxLength(300);

    const firstActionRow = new ActionRowBuilder().addComponents(walkinInput);
    modal.addComponents(firstActionRow);

    return modal;
  },

  // === 同伴処理モーダル ===

  /**
   * 同伴情報入力モーダル
   * @param {string} storeName 店舗名
   * @param {string} type タイプ
   * @param {string} castUserId キャストユーザーID
   * @returns {ModalBuilder}
   */
  createDouhanModal(storeName, type, castUserId) {
    const modal = new ModalBuilder()
      .setCustomId(`hikkake_douhan_submit_${storeName}_${type}_${castUserId}`)
      .setTitle(`${storeName} - 同伴情報入力`);

    const guestCountInput = new TextInputBuilder()
      .setCustomId('guest_count')
      .setLabel('お客様人数')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('例: 2')
      .setRequired(true)
      .setMaxLength(2);

    const puraCountInput = new TextInputBuilder()
      .setCustomId('pura_count')
      .setLabel('プラスタッフ数')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('例: 1')
      .setRequired(true)
      .setMaxLength(2);

    const kamaCountInput = new TextInputBuilder()
      .setCustomId('kama_count')
      .setLabel('カマスタッフ数')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('例: 1')
      .setRequired(true)
      .setMaxLength(2);

    const bottleCountInput = new TextInputBuilder()
      .setCustomId('bottle_count')
      .setLabel('本数')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('例: 2')
      .setRequired(true)
      .setMaxLength(3);

    const durationInput = new TextInputBuilder()
      .setCustomId('duration')
      .setLabel('同伴時間（分）')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('例: 60')
      .setRequired(true)
      .setMaxLength(3);

    modal.addComponents(
      new ActionRowBuilder().addComponents(guestCountInput),
      new ActionRowBuilder().addComponents(puraCountInput),
      new ActionRowBuilder().addComponents(kamaCountInput),
      new ActionRowBuilder().addComponents(bottleCountInput),
      new ActionRowBuilder().addComponents(durationInput)
    );

    return modal;
  },

  /**
   * 同伴時間追加モーダル
   * @param {string} storeName 店舗名
   * @param {string} type タイプ
   * @param {string} castUserId キャストユーザーID
   * @returns {ModalBuilder}
   */
  createDouhanTimeModal(storeName, type, castUserId) {
    const modal = new ModalBuilder()
      .setCustomId(`hikkake_douhan_time_${storeName}_${type}_${castUserId}`)
      .setTitle('同伴時間設定');

    const arrivalTimeInput = new TextInputBuilder()
      .setCustomId('arrival_time')
      .setLabel('来店予定時間')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('例: 20:00')
      .setRequired(true)
      .setMaxLength(10);

    const firstActionRow = new ActionRowBuilder().addComponents(arrivalTimeInput);
    modal.addComponents(firstActionRow);

    return modal;
  },

  // === リアクション設定モーダル ===

  /**
   * リアクション設定モーダル
   * @param {string} storeType 店舗タイプ（quest/tosu/horse）
   * @param {string} reactionType リアクションタイプ（num/count）
   * @param {string} targetValue 対象値
   * @returns {ModalBuilder}
   */
  createReactionModal(storeType, reactionType, targetValue) {
    const typeNames = {
      quest: 'クエスト依頼',
      tosu: '凸スナ',
      horse: 'トロイの木馬'
    };
    const unitNames = {
      num: '人',
      count: '本'
    };

    const modal = new ModalBuilder()
      .setCustomId(`hikkake_reaction_modal_${storeType}_${reactionType}_${targetValue}`)
      .setTitle(`${typeNames[storeType]} ${targetValue}${unitNames[reactionType]} リアクション設定`);

    const reactionInput = new TextInputBuilder()
      .setCustomId('reaction_messages')
      .setLabel('リアクション文を入力（改行で複数設定可能）')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('例:\nおめでとうございます！\n素晴らしい結果ですね\nお疲れ様でした')
      .setRequired(true)
      .setMaxLength(1000);

    const firstActionRow = new ActionRowBuilder().addComponents(reactionInput);
    modal.addComponents(firstActionRow);

    return modal;
  },

  /**
   * リアクション追加モーダル（汎用）
   * @param {string} storeType 店舗タイプ
   * @param {string} reactionType リアクションタイプ
   * @returns {ModalBuilder}
   */
  createReactionSubmitModal(storeType, reactionType) {
    const typeNames = {
      quest: 'クエスト依頼',
      tosu: '凸スナ',
      horse: 'トロイの木馬'
    };
    const unitNames = {
      num: '人',
      count: '本'
    };

    const modal = new ModalBuilder()
      .setCustomId(`hikkake_reaction_submit_${storeType}_${reactionType}`)
      .setTitle(`${typeNames[storeType]} リアクション追加`);

    const targetInput = new TextInputBuilder()
      .setCustomId('target_value')
      .setLabel(`対象${unitNames[reactionType]}数`)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('例: 5')
      .setRequired(true)
      .setMaxLength(3);

    const reactionInput = new TextInputBuilder()
      .setCustomId('reaction_messages')
      .setLabel('リアクション文（改行で複数設定可能）')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('例:\nおめでとうございます！\n素晴らしい結果ですね')
      .setRequired(true)
      .setMaxLength(1000);

    modal.addComponents(
      new ActionRowBuilder().addComponents(targetInput),
      new ActionRowBuilder().addComponents(reactionInput)
    );

    return modal;
  },

  // === カスタム設定モーダル ===

  /**
   * カスタム時間設定モーダル
   * @param {string} panelId パネルID
   * @returns {ModalBuilder}
   */
  createCustomTimeModal(panelId) {
    const modal = new ModalBuilder()
      .setCustomId(`hikkake_custom_time_${panelId}`)
      .setTitle('カスタム時間設定');

    const timeInput = new TextInputBuilder()
      .setCustomId('custom_time')
      .setLabel('時間を分で入力してください')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('例: 120')
      .setRequired(true)
      .setMaxLength(3);

    const firstActionRow = new ActionRowBuilder().addComponents(timeInput);
    modal.addComponents(firstActionRow);

    return modal;
  },

  /**
   * カスタム人数設定モーダル
   * @param {string} panelId パネルID
   * @returns {ModalBuilder}
   */
  createCustomPeopleModal(panelId) {
    const modal = new ModalBuilder()
      .setCustomId(`hikkake_custom_people_${panelId}`)
      .setTitle('カスタム人数設定');

    const peopleInput = new TextInputBuilder()
      .setCustomId('custom_people')
      .setLabel('人数を入力してください')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('例: 5')
      .setRequired(true)
      .setMaxLength(2);

    const firstActionRow = new ActionRowBuilder().addComponents(peopleInput);
    modal.addComponents(firstActionRow);

    return modal;
  },

  /**
   * カスタム本数設定モーダル
   * @param {string} panelId パネルID
   * @returns {ModalBuilder}
   */
  createCustomBottleModal(panelId) {
    const modal = new ModalBuilder()
      .setCustomId(`hikkake_custom_bottle_${panelId}`)
      .setTitle('カスタム本数設定');

    const bottleInput = new TextInputBuilder()
      .setCustomId('custom_bottle')
      .setLabel('本数を入力してください')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('例: 10')
      .setRequired(true)
      .setMaxLength(3);

    const firstActionRow = new ActionRowBuilder().addComponents(bottleInput);
    modal.addComponents(firstActionRow);

    return modal;
  }
};
