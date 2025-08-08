// 統合ボタンハンドラー - 全てのボタンインタラクションを処理
const { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  MessageFlags
} = require('discord.js');
const { readState, writeState } = require('../utils/hikkakeStateManager');
const { updateAllHikkakePanels, updatePanelsByType } = require('../utils/panelStateManager');
const { createSelectMenuRow, createNumericOptions, findMembersWithRole, fetchMessageSafely } = require('../utils/discordHelper');
const { logToThread } = require('../utils/loggingHelper');
const { logHikkakeEvent } = require('../utils/hikkakeCsvLogger');
const logger = require('../../common/logger');

let DateTime;
try {
  DateTime = require('luxon').DateTime;
} catch (error) {
  logger.warn('⚠️ luxonライブラリが見つかりません。代替の時間処理を使用します。');
  DateTime = null;
}

module.exports = {
  /**
   * ボタンインタラクションを処理する
   * @param {import('discord.js').Interaction} interaction
   * @returns {Promise<boolean>} 処理された場合はtrue
   */
  async execute(interaction) {
    if (!interaction.isButton()) return false;

    const { customId, client, guild } = interaction;
    const guildId = guild.id;

    try {
      // === 基本的なスタッフ管理ボタン ===
      if (customId === 'hikkake_staff_input') {
        return await this.handleStaffInput(interaction);
      }
      if (customId === 'hikkake_kama_input') {
        return await this.handleKamaInput(interaction);
      }

      // === ひっかけ管理ボタン ===
      if (customId === 'hikkake_add_plan') {
        return await this.handleAddPlan(interaction);
      }
      if (customId === 'hikkake_confirm') {
        return await this.handleConfirm(interaction);
      }
      if (customId === 'hikkake_fail') {
        return await this.handleFail(interaction);
      }

      // === 客管理ボタン ===
      if (customId === 'hikkake_walk_in') {
        return await this.handleWalkIn(interaction);
      }
      if (customId === 'hikkake_leave') {
        return await this.handleLeave(interaction);
      }

      // === リアクション設定ボタン ===
      const reactionStoreMatch = customId.match(/^hikkake_reaction_(quest|tosu|horse)$/);
      if (reactionStoreMatch) {
        return await this.handleReactionStoreSelect(interaction, reactionStoreMatch[1]);
      }
      
      const reactionTypeMatch = customId.match(/^hikkake_reaction_type_(quest|tosu|horse)_(num|count)$/);
      if (reactionTypeMatch) {
        return await this.handleReactionTypeSelect(interaction, reactionTypeMatch[1], reactionTypeMatch[2]);
      }

      // === パネル設置ボタン ===
      const setupStoreMatch = customId.match(/^hikkake_setup_(quest|tosu|horse)$/);
      if (setupStoreMatch) {
        return await this.handleStoreSetup(interaction, setupStoreMatch[1]);
      }

      if (customId === 'hikkake_panel_setup') {
        return await this.handlePanelSetupButton(interaction);
      }
      
      if (customId === 'hikkake_reaction_setup') {
        return await this.handleReactionSetupButton(interaction);
      }

      // === パネル管理ボタン ===
      const panelButtonMatch = customId.match(/^hikkake_(refresh|plakama|order|arrival|douhan)_(.+)$/);
      if (panelButtonMatch) {
        const [, action, storeName] = panelButtonMatch;
        return await this.handlePanelAction(interaction, action, storeName);
      }

      // === 注文管理ボタン ===
      const manageButtonMatch = customId.match(/^hikkake_(.+)_(quest|tosu|horse)_(confirm|fail|leave)$/);
      if (manageButtonMatch) {
        const [, storeName, type, action] = manageButtonMatch;
        return await this.handleOrderManagement(interaction, storeName, type, action);
      }

      // === 削除関連ボタン ===
      if (customId.startsWith('hikkake_confirm_delete_')) {
        return await this.handleConfirmDelete(interaction);
      }
      
      if (customId === 'hikkake_cancel_delete') {
        return await this.handleCancelDelete(interaction);
      }

      // === 注文キャンセルボタン ===
      const cancelButtonMatch = customId.match(/^cancel_order_(.+)_(quest|tosu|horse)_(.+)$/);
      if (cancelButtonMatch) {
        return await this.handleCancelOrder(interaction, cancelButtonMatch[1], cancelButtonMatch[2], cancelButtonMatch[3]);
      }

      // === リアクション管理ボタン ===
      const reactionAddMatch = customId.match(/^hikkake_reaction_add_(num|count)$/);
      if (reactionAddMatch) {
        return await this.handleReactionAdd(interaction, reactionAddMatch[1]);
      }

      if (customId === 'hikkake_reaction_remove') {
        return await this.handleReactionRemove(interaction);
      }

      // === 状態確認ボタン ===
      if (customId === 'hikkake_panel_status') {
        return await this.handlePanelStatus(interaction);
      }

      if (customId === 'hikkake_staff_count_test') {
        return await this.handleStaffCountTest(interaction);
      }

      return false;

    } catch (error) {
      logger.error('ボタンハンドラーエラー:', { 
        error: error instanceof Error ? error.message : String(error),
        customId: customId,
        guildId: guildId
      });
      
      await this.sendErrorReply(interaction, '操作中にエラーが発生しました。');
      return false;
    }
  },

  // === 基本的なスタッフ管理 ===
  async handleStaffInput(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('hikkake_staff_modal')
      .setTitle('プラスタッフ数入力');

    const staffInput = new TextInputBuilder()
      .setCustomId('staff_count')
      .setLabel('プラスタッフ数を入力してください')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('例: 5')
      .setRequired(true)
      .setMaxLength(2);

    modal.addComponents(new ActionRowBuilder().addComponents(staffInput));
    await interaction.showModal(modal);
    return true;
  },

  async handleKamaInput(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('hikkake_kama_modal')
      .setTitle('カマスタッフ数入力');

    const kamaInput = new TextInputBuilder()
      .setCustomId('kama_count')
      .setLabel('カマスタッフ数を入力してください')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('例: 3')
      .setRequired(true)
      .setMaxLength(2);

    modal.addComponents(new ActionRowBuilder().addComponents(kamaInput));
    await interaction.showModal(modal);
    return true;
  },

  // === パネルアクション処理 ===
  async handlePanelAction(interaction, action, storeName) {
    const { client } = interaction;
    const guildId = interaction.guildId;

    if (action === 'refresh') {
      await interaction.deferUpdate();
      await updateAllHikkakePanels(client, guildId);
      await interaction.followUp({ content: '✅ パネルを更新しました！', ephemeral: true });
    } else if (action === 'plakama') {
      const row = createSelectMenuRow(`hikkake_plakama_step1_${storeName}`, 'プラの人数を選択 (1-25)', createNumericOptions(25, '人'));
      await interaction.reply({ content: `【${storeName}】の基本スタッフ数を設定します。まずプラの人数を選択してください。`, components: [row], flags: MessageFlags.Ephemeral });
    } else if (action === 'order') {
      const row = createSelectMenuRow(`hikkake_order_guest_count_${storeName}`, 'お客様の人数を選択 (1-25)', createNumericOptions(25, '人'));
      await interaction.reply({ content: `【${storeName}】でひっかけました。まずお客様の人数を選択してください。`, components: [row], flags: MessageFlags.Ephemeral });
    } else if (action === 'arrival') {
      const row = createSelectMenuRow(`hikkake_arrival_guest_count_${storeName}`, 'お客様の人数を選択 (1-25)', createNumericOptions(25, '人'));
      await interaction.reply({ content: `【${storeName}】にお客様がふらっと来ました。まずお客様の人数を選択してください。`, components: [row], flags: MessageFlags.Ephemeral });
    } else if (action === 'douhan') {
      const row = createSelectMenuRow(`hikkake_douhan_guest_count_${storeName}`, 'お客様の人数を選択 (1-25)', createNumericOptions(25, '人'));
      await interaction.reply({ content: `【${storeName}】で同伴を設定します。まずお客様の人数を選択してください。`, components: [row], flags: MessageFlags.Ephemeral });
    }
    return true;
  },

  // === パネル設置処理 ===
  async handleStoreSetup(interaction, storeType) {
    const selectMenu = createSelectMenuRow(
      `hikkake_panel_select_${storeType}`, 
      'パネルを設置するチャンネルを選択してください', 
      []
    );
    
    await interaction.reply({ 
      content: `${storeType}のパネル設置を開始します。設置するチャンネルを選択してください。`,
      components: [selectMenu], 
      flags: MessageFlags.Ephemeral 
    });
    return true;
  },

  async handlePanelSetupButton(interaction) {
    await interaction.deferReply({ ephemeral: true });
    
    const embed = new EmbedBuilder()
      .setTitle('🏪 ひっかけパネル設置')
      .setDescription('**ひっかけパネルの設置・管理**\n\n' +
        '各店舗タイプごとにひっかけパネルを設置できます。\n' +
        'パネルを設置すると、リアルタイムでオーダー状況を管理できます。')
      .setColor(0x00AA55)
      .setTimestamp();

    const row1 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('hikkake_setup_quest')
          .setLabel('🗡️ クエスト依頼')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('hikkake_setup_tosu')
          .setLabel('⚔️ 凸スナ')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('hikkake_setup_horse')
          .setLabel('🐎 トロイの木馬')
          .setStyle(ButtonStyle.Primary)
      );

    const row2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('hikkake_panel_status')
          .setLabel('📋 設置状況確認')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.editReply({ embeds: [embed], components: [row1, row2] });
    return true;
  },

  // === エラーハンドリング ===
  async sendErrorReply(interaction, message) {
    const content = `❌ ${message}`;
    
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content, flags: MessageFlags.Ephemeral });
      } else {
        await interaction.editReply({ content, components: [] });
      }
    } catch (replyError) {
      logger.error('エラー応答失敗:', { 
        error: replyError instanceof Error ? replyError.message : String(replyError)
      });
    }
  },

  // === その他のハンドラーメソッドは省略（必要に応じて実装） ===
  async handleAddPlan(interaction) { /* 実装省略 */ return true; },
  async handleConfirm(interaction) { /* 実装省略 */ return true; },
  async handleFail(interaction) { /* 実装省略 */ return true; },
  async handleWalkIn(interaction) { /* 実装省略 */ return true; },
  async handleLeave(interaction) { /* 実装省略 */ return true; },
  async handleReactionStoreSelect(interaction, storeType) { /* 実装省略 */ return true; },
  async handleReactionTypeSelect(interaction, storeType, reactionType) { /* 実装省略 */ return true; },
  async handleOrderManagement(interaction, storeName, type, action) { /* 実装省略 */ return true; },
  async handleConfirmDelete(interaction) { /* 実装省略 */ return true; },
  async handleCancelDelete(interaction) { /* 実装省略 */ return true; },
  async handleCancelOrder(interaction, storeName, type, orderId) { /* 実装省略 */ return true; },
  async handleReactionAdd(interaction, reactionType) { /* 実装省略 */ return true; },
  async handleReactionRemove(interaction) { /* 実装省略 */ return true; },
  async handlePanelStatus(interaction) { /* 実装省略 */ return true; },
  async handleStaffCountTest(interaction) { /* 実装省略 */ return true; },
  async handleReactionSetupButton(interaction) { /* 実装省略 */ return true; }
};
