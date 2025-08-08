// 統合モーダルハンドラー - 全てのモーダルインタラクションを処理
const { MessageFlags } = require('discord.js');
const { readState, writeState, getActiveStaffAllocation } = require('../utils/hikkakeStateManager');
const { updateAllHikkakePanels, updatePanelsByType } = require('../utils/panelStateManager');
const { logToThread } = require('../utils/loggingHelper');
const { readReactions, writeReactions } = require('../utils/hikkakeReactionManager');
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
   * モーダルインタラクションを処理する
   * @param {import('discord.js').Interaction} interaction
   * @returns {Promise<boolean>} 処理された場合はtrue
   */
  async execute(interaction) {
    if (!interaction.isModalSubmit()) return false;

    const { customId } = interaction;

    try {
      // === 基本的なスタッフ設定モーダル ===
      if (customId === 'hikkake_staff_modal') {
        return await this.handleStaffModal(interaction);
      }
      if (customId === 'hikkake_kama_modal') {
        return await this.handleKamaModal(interaction);
      }

      // === ひっかけ予定モーダル ===
      if (customId === 'hikkake_plan_modal') {
        return await this.handlePlanModal(interaction);
      }

      // === ふらっと来た客モーダル ===
      if (customId === 'hikkake_walkin_modal') {
        return await this.handleWalkinModal(interaction);
      }

      // === リアクション設定モーダル ===
      const reactionModalMatch = customId.match(/^hikkake_reaction_modal_(quest|tosu|horse)_(num|count)_(\d+)$/);
      if (reactionModalMatch) {
        return await this.handleReactionModal(interaction, reactionModalMatch[1], reactionModalMatch[2], reactionModalMatch[3]);
      }

      // === 同伴提出モーダル ===
      const douhanMatch = customId.match(/^hikkake_douhan_submit_(.+)_(quest|tosu|horse)_(\d+)$/);
      if (douhanMatch) {
        return await this.handleDouhanSubmit(interaction, douhanMatch[1], douhanMatch[2], douhanMatch[3]);
      }

      // === 汎用リアクション提出モーダル ===
      const reactionSubmitMatch = customId.match(/^hikkake_reaction_submit_(quest|tosu|horse)_(num|count)$/);
      if (reactionSubmitMatch) {
        return await this.handleReactionSubmit(interaction, reactionSubmitMatch[1], reactionSubmitMatch[2]);
      }

      return false;

    } catch (error) {
      logger.error('モーダルハンドラーエラー:', { 
        error: error instanceof Error ? error.message : String(error),
        customId: customId,
        guildId: interaction.guildId
      });
      
      await this.sendErrorReply(interaction, '操作中にエラーが発生しました。');
      return false;
    }
  },

  // === 基本的なスタッフ設定 ===
  async handleStaffModal(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const staffCount = interaction.fields.getTextInputValue('staff_count');
      const count = parseInt(staffCount, 10);

      if (isNaN(count) || count < 0) {
        return await interaction.editReply({ content: '❌ 有効な数値を入力してください。' });
      }

      await this.updateBoardData(interaction, 'staff_update', `✅ プラスタッフ数を${count}人に設定しました。`);
      await interaction.editReply({ content: `✅ プラスタッフ数を${count}人に設定しました。` });
    } catch (error) {
      logger.error('スタッフ設定エラー:', error);
      await interaction.editReply({ content: '❌ スタッフ数の設定中にエラーが発生しました。' });
    }
    return true;
  },

  async handleKamaModal(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const kamaCount = interaction.fields.getTextInputValue('kama_count');
      const count = parseInt(kamaCount, 10);

      if (isNaN(count) || count < 0) {
        return await interaction.editReply({ content: '❌ 有効な数値を入力してください。' });
      }

      await this.updateBoardData(interaction, 'kama_update', `✅ カマスタッフ数を${count}人に設定しました。`);
      await interaction.editReply({ content: `✅ カマスタッフ数を${count}人に設定しました。` });
    } catch (error) {
      logger.error('カマスタッフ設定エラー:', error);
      await interaction.editReply({ content: '❌ カマスタッフ数の設定中にエラーが発生しました。' });
    }
    return true;
  },

  // === ひっかけ予定処理 ===
  async handlePlanModal(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const planContent = interaction.fields.getTextInputValue('plan_content');
      
      await this.updateBoardData(interaction, 'plan_add', `✅ ひっかけ予定を追加しました: ${planContent}`);
      await interaction.editReply({ content: '✅ ひっかけ予定を追加しました。' });
    } catch (error) {
      logger.error('ひっかけ予定追加エラー:', error);
      await interaction.editReply({ content: '❌ ひっかけ予定の追加中にエラーが発生しました。' });
    }
    return true;
  },

  // === ふらっと来た客処理 ===
  async handleWalkinModal(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const walkinInfo = interaction.fields.getTextInputValue('walkin_info');
      
      await this.updateBoardData(interaction, 'walkin', `✨ ふらっと来た客: ${walkinInfo}`);
      await interaction.editReply({ content: '✨ ふらっと来た客の情報を記録しました。' });
    } catch (error) {
      logger.error('ふらっと来た客処理エラー:', error);
      await interaction.editReply({ content: '❌ 来店客情報の記録中にエラーが発生しました。' });
    }
    return true;
  },

  // === リアクション設定処理 ===
  async handleReactionModal(interaction, storeType, reactionType, targetValue) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const reactionMessages = interaction.fields.getTextInputValue('reaction_messages');
      const messages = reactionMessages.split('\n').filter(msg => msg.trim().length > 0);

      if (messages.length === 0) {
        return await interaction.editReply({ content: '❌ 有効な反応文を入力してください。' });
      }

      const guildId = interaction.guildId;
      const reactions = await readReactions(guildId) || {};

      if (!reactions[storeType]) reactions[storeType] = {};
      if (!reactions[storeType][reactionType]) reactions[storeType][reactionType] = {};
      reactions[storeType][reactionType][targetValue] = messages;

      await writeReactions(guildId, reactions);

      const typeNames = {
        quest: 'クエスト依頼',
        tosu: '凸スナ',
        horse: 'トロイの木馬'
      };
      const unitNames = {
        num: '人',
        count: '本'
      };

      await interaction.editReply({ 
        content: `✅ ${typeNames[storeType]}の${targetValue}${unitNames[reactionType]}に対する反応文を${messages.length}件設定しました。` 
      });
    } catch (error) {
      logger.error('リアクション設定エラー:', error);
      await interaction.editReply({ content: '❌ リアクション設定中にエラーが発生しました。' });
    }
    return true;
  },

  // === 同伴処理 ===
  async handleDouhanSubmit(interaction, storeName, type, castUserId) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const inputs = {
        guestCount: parseInt(interaction.fields.getTextInputValue('guest_count'), 10),
        castPura: parseInt(interaction.fields.getTextInputValue('pura_count'), 10),
        castKama: parseInt(interaction.fields.getTextInputValue('kama_count'), 10),
        bottles: parseInt(interaction.fields.getTextInputValue('bottle_count'), 10),
        duration: parseInt(interaction.fields.getTextInputValue('duration'), 10),
      };

      for (const [key, value] of Object.entries(inputs)) {
        if (isNaN(value) || value < 0) {
          return await interaction.editReply({ content: `❌ 入力値「${key}」が無効です。0以上の半角数字で入力してください。` });
        }
      }

      const arrivalTime = interaction.fields.getTextInputValue('arrival_time');
      const guildId = interaction.guildId;
      const state = await readState(guildId);
      const panelKey = `${storeName}_${type}`;

      // スタッフ数の確認
      const { allocatedPura, allocatedKama } = getActiveStaffAllocation(state, panelKey);
      const availablePura = (state.staff?.[panelKey]?.pura || 0) - allocatedPura;
      const availableKama = (state.staff?.[panelKey]?.kama || 0) - allocatedKama;

      if (inputs.castPura > availablePura || inputs.castKama > availableKama) {
        return await interaction.editReply({
          content: `❌ スタッフが不足しています。\n` +
            `利用可能: プラ ${availablePura}人、カマ ${availableKama}人\n` +
            `要求: プラ ${inputs.castPura}人、カマ ${inputs.castKama}人`
        });
      }

      // 同伴記録を追加
      const douhanRecord = {
        id: `douhan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'douhan',
        user: interaction.user,
        joinTimestamp: new Date().toISOString(),
        people: inputs.guestCount,
        castUserId,
        castPura: inputs.castPura,
        castKama: inputs.castKama,
        bottles: inputs.bottles,
        duration: inputs.duration,
        arrivalTime
      };

      state.orders = state.orders || {};
      state.orders[panelKey] = state.orders[panelKey] || [];
      state.orders[panelKey].push(douhanRecord);

      await writeState(guildId, state);

      // ログ出力
      await logToThread(guildId, interaction.client, {
        user: interaction.user,
        logType: '同伴',
        details: { storeName, type, ...inputs, arrivalTime },
        channelName: interaction.channel.name
      });

      // パネル更新
      await updatePanelsByType(interaction.client, guildId, type, state);

      await interaction.editReply({ 
        content: `✅ 同伴記録を追加しました。\n` +
          `👥 お客様: ${inputs.guestCount}人\n` +
          `🍾 本数: ${inputs.bottles}本\n` +
          `⏰ 同伴時間: ${inputs.duration}分\n` +
          `📅 来店予定: ${arrivalTime}`
      });
    } catch (error) {
      logger.error('同伴処理エラー:', error);
      await interaction.editReply({ content: '❌ 同伴記録の処理中にエラーが発生しました。' });
    }
    return true;
  },

  // === リアクション提出処理 ===
  async handleReactionSubmit(interaction, storeType, reactionType) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const targetValue = interaction.fields.getTextInputValue('target_value');
      const reactionMessages = interaction.fields.getTextInputValue('reaction_messages');

      if (!targetValue || isNaN(parseInt(targetValue, 10))) {
        return await interaction.editReply({ content: '❌ 有効な数値を入力してください。' });
      }

      const messages = reactionMessages.split('\n').filter(msg => msg.trim().length > 0);

      if (messages.length === 0) {
        return await interaction.editReply({ content: '❌ 有効な反応文を入力してください。' });
      }

      const guildId = interaction.guildId;
      const reactions = await readReactions(guildId) || {};

      if (!reactions[storeType]) reactions[storeType] = {};
      if (!reactions[storeType][reactionType]) reactions[storeType][reactionType] = {};
      reactions[storeType][reactionType][targetValue] = messages;

      await writeReactions(guildId, reactions);

      const typeNames = {
        quest: 'クエスト依頼',
        tosu: '凸スナ',
        horse: 'トロイの木馬'
      };
      const unitNames = {
        num: '人',
        count: '本'
      };

      await interaction.editReply({ 
        content: `✅ ${typeNames[storeType]}の${targetValue}${unitNames[reactionType]}に対する反応文を${messages.length}件設定しました。` 
      });
    } catch (error) {
      logger.error('リアクション提出エラー:', error);
      await interaction.editReply({ content: '❌ リアクション設定中にエラーが発生しました。' });
    }
    return true;
  },

  // === 共通処理 ===
  async updateBoardData(interaction, action, message) {
    logger.info(`ボード更新: ${action} - ${message}`, {
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      userId: interaction.user.id
    });
  },

  async sendErrorReply(interaction, message) {
    const content = `❌ ${message}`;
    
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content, flags: MessageFlags.Ephemeral });
      } else {
        await interaction.editReply({ content });
      }
    } catch (replyError) {
      logger.error('エラー応答失敗:', { 
        error: replyError instanceof Error ? replyError.message : String(replyError)
      });
    }
  }
};
