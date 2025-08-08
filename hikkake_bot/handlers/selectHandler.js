// 統合セレクトメニューハンドラー - 全てのセレクトメニューインタラクションを処理
const { MessageFlags } = require('discord.js');
const { readState, writeState } = require('../utils/hikkakeStateManager');
const { updateAllHikkakePanels } = require('../utils/panelStateManager');
const { logToThread } = require('../utils/loggingHelper');
const logger = require('../../common/logger');

module.exports = {
  /**
   * セレクトメニューインタラクションを処理する
   * @param {import('discord.js').Interaction} interaction
   * @returns {Promise<boolean>} 処理された場合はtrue
   */
  async execute(interaction) {
    if (!interaction.isStringSelectMenu()) return false;

    const { customId, values } = interaction;

    try {
      // === 店舗選択 ===
      if (customId === 'hikkake_store_select') {
        return await this.handleStoreSelect(interaction, values);
      }

      // === タイプ選択 ===
      if (customId === 'hikkake_type_select') {
        return await this.handleTypeSelect(interaction, values);
      }

      // === キャスト選択 ===
      const castSelectMatch = customId.match(/^hikkake_cast_select_(.+)_(quest|tosu|horse)$/);
      if (castSelectMatch) {
        return await this.handleCastSelect(interaction, castSelectMatch[1], castSelectMatch[2], values);
      }

      // === 時間選択 ===
      const timeSelectMatch = customId.match(/^hikkake_time_select_(.+)$/);
      if (timeSelectMatch) {
        return await this.handleTimeSelect(interaction, timeSelectMatch[1], values);
      }

      // === 人数選択 ===
      const peopleSelectMatch = customId.match(/^hikkake_people_select_(.+)$/);
      if (peopleSelectMatch) {
        return await this.handlePeopleSelect(interaction, peopleSelectMatch[1], values);
      }

      // === 本数選択 ===
      const bottleSelectMatch = customId.match(/^hikkake_bottle_select_(.+)$/);
      if (bottleSelectMatch) {
        return await this.handleBottleSelect(interaction, bottleSelectMatch[1], values);
      }

      // === 設定カテゴリ選択 ===
      if (customId === 'hikkake_config_category') {
        return await this.handleConfigCategory(interaction, values);
      }

      // === リアクション設定選択 ===
      const reactionConfigMatch = customId.match(/^hikkake_reaction_config_(quest|tosu|horse)$/);
      if (reactionConfigMatch) {
        return await this.handleReactionConfig(interaction, reactionConfigMatch[1], values);
      }

      return false;

    } catch (error) {
      logger.error('セレクトメニューハンドラーエラー:', { 
        error: error instanceof Error ? error.message : String(error),
        customId: customId,
        guildId: interaction.guildId
      });
      
      await this.sendErrorReply(interaction, '操作中にエラーが発生しました。');
      return false;
    }
  },

  // === 店舗選択処理 ===
  async handleStoreSelect(interaction, values) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const selectedStore = values[0];
      logger.info(`店舗選択: ${selectedStore}`, {
        guildId: interaction.guildId,
        userId: interaction.user.id
      });

      await interaction.editReply({
        content: `✅ 店舗「${selectedStore}」を選択しました。`
      });
    } catch (error) {
      logger.error('店舗選択エラー:', error);
      await interaction.editReply({ content: '❌ 店舗選択中にエラーが発生しました。' });
    }
    return true;
  },

  // === タイプ選択処理 ===
  async handleTypeSelect(interaction, values) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const selectedType = values[0];
      const typeNames = {
        'quest': 'クエスト依頼',
        'tosu': '凸スナ',
        'horse': 'トロイの木馬'
      };

      logger.info(`タイプ選択: ${selectedType}`, {
        guildId: interaction.guildId,
        userId: interaction.user.id
      });

      await interaction.editReply({
        content: `✅ ${typeNames[selectedType] || selectedType}を選択しました。`
      });
    } catch (error) {
      logger.error('タイプ選択エラー:', error);
      await interaction.editReply({ content: '❌ タイプ選択中にエラーが発生しました。' });
    }
    return true;
  },

  // === キャスト選択処理 ===
  async handleCastSelect(interaction, storeName, type, values) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const selectedCastId = values[0];
      const guildId = interaction.guildId;
      
      // キャスト情報を取得して記録
      const castMember = await interaction.guild.members.fetch(selectedCastId);
      
      logger.info(`キャスト選択: ${castMember.displayName}`, {
        guildId: interaction.guildId,
        storeName,
        type,
        castId: selectedCastId
      });

      await interaction.editReply({
        content: `✅ キャスト「${castMember.displayName}」を選択しました。`
      });
    } catch (error) {
      logger.error('キャスト選択エラー:', error);
      await interaction.editReply({ content: '❌ キャスト選択中にエラーが発生しました。' });
    }
    return true;
  },

  // === 時間選択処理 ===
  async handleTimeSelect(interaction, panelId, values) {
    await interaction.deferUpdate();

    try {
      const selectedTime = parseInt(values[0], 10);
      const guildId = interaction.guildId;
      const state = await readState(guildId);

      // 時間設定の更新
      if (!state.timeSettings) state.timeSettings = {};
      state.timeSettings[panelId] = selectedTime;

      await writeState(guildId, state);

      logger.info(`時間設定更新: ${selectedTime}分`, {
        guildId,
        panelId,
        userId: interaction.user.id
      });

      // パネル更新
      await updateAllHikkakePanels(interaction.client, guildId, state);

    } catch (error) {
      logger.error('時間選択エラー:', error);
      // deferUpdateした場合は新たなレスポンスは送信しない
    }
    return true;
  },

  // === 人数選択処理 ===
  async handlePeopleSelect(interaction, panelId, values) {
    await interaction.deferUpdate();

    try {
      const selectedPeople = parseInt(values[0], 10);
      const guildId = interaction.guildId;
      const state = await readState(guildId);

      // 人数設定の更新
      if (!state.peopleSettings) state.peopleSettings = {};
      state.peopleSettings[panelId] = selectedPeople;

      await writeState(guildId, state);

      logger.info(`人数設定更新: ${selectedPeople}人`, {
        guildId,
        panelId,
        userId: interaction.user.id
      });

      // パネル更新
      await updateAllHikkakePanels(interaction.client, guildId, state);

    } catch (error) {
      logger.error('人数選択エラー:', error);
    }
    return true;
  },

  // === 本数選択処理 ===
  async handleBottleSelect(interaction, panelId, values) {
    await interaction.deferUpdate();

    try {
      const selectedBottles = parseInt(values[0], 10);
      const guildId = interaction.guildId;
      const state = await readState(guildId);

      // 本数設定の更新
      if (!state.bottleSettings) state.bottleSettings = {};
      state.bottleSettings[panelId] = selectedBottles;

      await writeState(guildId, state);

      logger.info(`本数設定更新: ${selectedBottles}本`, {
        guildId,
        panelId,
        userId: interaction.user.id
      });

      // パネル更新
      await updateAllHikkakePanels(interaction.client, guildId, state);

    } catch (error) {
      logger.error('本数選択エラー:', error);
    }
    return true;
  },

  // === 設定カテゴリ選択処理 ===
  async handleConfigCategory(interaction, values) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const selectedCategory = values[0];
      const categoryNames = {
        'staff': 'スタッフ設定',
        'reaction': 'リアクション設定',
        'time': '時間設定',
        'panel': 'パネル設定'
      };

      logger.info(`設定カテゴリ選択: ${selectedCategory}`, {
        guildId: interaction.guildId,
        userId: interaction.user.id
      });

      await interaction.editReply({
        content: `⚙️ ${categoryNames[selectedCategory] || selectedCategory}カテゴリを選択しました。`
      });
    } catch (error) {
      logger.error('設定カテゴリ選択エラー:', error);
      await interaction.editReply({ content: '❌ 設定カテゴリ選択中にエラーが発生しました。' });
    }
    return true;
  },

  // === リアクション設定選択処理 ===
  async handleReactionConfig(interaction, storeType, values) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const selectedOption = values[0];
      const typeNames = {
        'quest': 'クエスト依頼',
        'tosu': '凸スナ',
        'horse': 'トロイの木馬'
      };

      logger.info(`リアクション設定選択: ${storeType} - ${selectedOption}`, {
        guildId: interaction.guildId,
        userId: interaction.user.id
      });

      await interaction.editReply({
        content: `⚙️ ${typeNames[storeType]}の${selectedOption}設定を選択しました。`
      });
    } catch (error) {
      logger.error('リアクション設定選択エラー:', error);
      await interaction.editReply({ content: '❌ リアクション設定選択中にエラーが発生しました。' });
    }
    return true;
  },

  // === 共通処理 ===
  async sendErrorReply(interaction, message) {
    const content = `❌ ${message}`;
    
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content, flags: MessageFlags.Ephemeral });
      } else if (interaction.deferred && !interaction.replied) {
        await interaction.editReply({ content });
      }
    } catch (replyError) {
      logger.error('エラー応答失敗:', { 
        error: replyError instanceof Error ? replyError.message : String(replyError)
      });
    }
  }
};
