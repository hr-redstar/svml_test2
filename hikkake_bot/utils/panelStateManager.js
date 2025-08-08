// hikkake_bot/utils/panelStateManager.js

const logger = require('../../common/logger');
const { fetchMessageSafely } = require('./discordHelper');

// hikkakeStateManagerから関数をインポート
async function readState(guildId) {
  const { readState } = require('./hikkakeStateManager');
  return await readState(guildId);
}

async function writeState(guildId, state) {
  const { writeState } = require('./hikkakeStateManager');
  return await writeState(guildId, state);
}

let DateTime;
try {
  DateTime = require('luxon').DateTime;
} catch (error) {
  logger.warn('⚠️ luxonライブラリが見つかりません。代替の時間処理を使用します。');
  DateTime = null;
}

const LOG_CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute
const LOG_RETENTION_MINUTES = 10; // 10 minutes

/**
 * ひっかけ状態を取得する（既存システム互換）
 * @param {string} guildId ギルドID
 * @param {string} storeName 店舗名
 * @returns {object} ひっかけ状態
 */
async function getHikkakeState(guildId, storeName) {
  try {
    const { readState } = require('./hikkakeStateManager');
    const state = await readState(guildId);
    
    // 各カテゴリーの状態を取得
    const categories = ['quest', 'tosu', 'horse'];
    const result = {
      staff: {},
      orders: {},
      arrivals: {}
    };
    
    for (const category of categories) {
      const panelKey = `${storeName}_${category}`;
      
      // スタッフ情報
      result.staff[category] = state.staff?.[panelKey] || { pura: 0, kama: 0 };
      
      // 注文情報（未退店のもの）
      result.orders[category] = state.orders?.[panelKey]?.filter(o => !o.leaveTimestamp) || [];
      
      // 到着情報
      result.arrivals[category] = state.arrivals?.[panelKey] || [];
    }
    
    return result;
    
  } catch (error) {
    logger.error('[panelStateManager] ひっかけ状態取得エラー:', error);
    return {
      staff: { quest: { pura: 0, kama: 0 }, tosu: { pura: 0, kama: 0 }, horse: { pura: 0, kama: 0 } },
      orders: { quest: [], tosu: [], horse: [] },
      arrivals: { quest: [], tosu: [], horse: [] }
    };
  }
}

/**
 * ひっかけパネル情報をGCSに保存
 * @param {string} storeName 店舗名
 * @param {object} panelInfo パネル情報
 */
async function saveHikkakePanelInfo(storeName, panelInfo) {
  try {
    const { readStoreState, writeStoreState } = require('../../common/stateManager');
    
    // 現在の店舗データを読み込み
    const storeData = await readStoreState() || { stores: {} };
    
    // 店舗が存在しない場合は作成
    if (!storeData.stores[storeName]) {
      storeData.stores[storeName] = {};
    }
    
    // ひっかけパネル情報を保存
    storeData.stores[storeName].hikkake_panel = panelInfo;
    
    // GCSに書き込み
    await writeStoreState(storeData);
    
    logger.info(`[panelStateManager] ひっかけパネル情報保存完了`, {
      storeName,
      channelId: panelInfo.channelId,
      messageId: panelInfo.messageId
    });
    
  } catch (error) {
    logger.error('[panelStateManager] ひっかけパネル情報保存エラー:', error);
    throw error;
  }
}

/**
 * スタッフ数を更新して全パネルを同期
 * @param {string} storeName 店舗名
 * @param {object} staffCount スタッフ数 {pla: number, kama: number}
 */
async function updateStaffCountAndSync(storeName, staffCount) {
  try {
    const { readStoreState, writeStoreState } = require('../../common/stateManager');
    
    // 現在の店舗データを読み込み
    const storeData = await readStoreState() || { stores: {} };
    
    // 指定店舗のスタッフ数を更新
    if (storeData.stores[storeName] && storeData.stores[storeName].hikkake_panel) {
      storeData.stores[storeName].hikkake_panel.staffCount = staffCount;
      storeData.stores[storeName].hikkake_panel.lastUpdated = new Date().toISOString();
    }
    
    // GCSに保存
    await writeStoreState(storeData);
    
    // 全てのひっかけパネルを更新
    await refreshAllHikkakePanels();
    
    logger.info(`[panelStateManager] スタッフ数更新・全パネル同期完了`, {
      storeName,
      staffCount
    });
    
  } catch (error) {
    logger.error('[panelStateManager] スタッフ数更新・同期エラー:', error);
    throw error;
  }
}

/**
 * 全てのひっかけパネルを更新（高度版）
 * 多店舗対応：同じタイプの全ての店舗パネルを更新します
 * @param {import('discord.js').Client} client
 * @param {string} guildId
 * @param {object} [state] オプション: 使用する現在の状態。提供されない場合はGCSから読み込み
 */
async function updateAllHikkakePanels(client, guildId, state) {
  const currentState = state || await readState(guildId);
  if (!currentState) return;

  // 同じタイプごとにグループ化
  const panelsByType = {};
  
  // panelMessagesのキーは「storeName_storeType」形式
  for (const panelKey in currentState.panelMessages) {
    const panelInfo = currentState.panelMessages[panelKey];
    if (!panelInfo || !panelInfo.channelId || !panelInfo.storeName || !panelInfo.storeType) continue;

    if (!panelsByType[panelInfo.storeType]) {
      panelsByType[panelInfo.storeType] = [];
    }
    panelsByType[panelInfo.storeType].push({ panelKey, panelInfo });
  }

  // 各タイプの全ての店舗パネルを更新
  for (const storeType in panelsByType) {
    const panelsOfType = panelsByType[storeType];
    
    // 同じタイプの全ての店舗を並行して更新
    const updatePromises = panelsOfType.map(async ({ panelKey, panelInfo }) => {
      try {
        // ステータスパネルを更新
        const statusMessage = await fetchMessageSafely(client, panelInfo.channelId, panelInfo.statusMessageId);
        if (statusMessage) {
          const { buildDetailedStatusEmbed } = require('./embedBuilder');
          const statusContent = { embeds: [buildDetailedStatusEmbed(panelInfo.storeName, panelInfo.storeType, currentState, panelInfo.channelId)] };
          await statusMessage.edit(statusContent).catch(err => {
            logger.error(`[PanelManager] ステータスパネルの編集に失敗 (${panelKey}):`, { error: err.message, guildId });
          });
        }

        // 注文パネルを更新
        const ordersMessage = await fetchMessageSafely(client, panelInfo.channelId, panelInfo.ordersMessageId);
        if (ordersMessage) {
          const { buildOrdersListEmbed } = require('./embedBuilder');
          const ordersContent = { embeds: [buildOrdersListEmbed(panelInfo.storeName, panelInfo.storeType, currentState, panelInfo.channelId)] };
          await ordersMessage.edit(ordersContent).catch(err => {
            logger.error(`[PanelManager] 注文パネルの編集に失敗 (${panelKey}):`, { error: err.message, guildId });
          });
        }
      } catch (error) {
        logger.error(`[PanelManager] パネル更新中にエラー (${panelKey}):`, error);
      }
    });

    await Promise.all(updatePromises);
  }

  logger.info(`[PanelManager] 多店舗パネル更新完了 (Guild: ${guildId})`);
}

/**
 * 特定のタイプの全ての店舗パネルを更新
 * @param {import('discord.js').Client} client
 * @param {string} guildId
 * @param {string} storeType 'quest', 'tosu', 'horse'
 * @param {object} [state] オプション: 使用する現在の状態
 */
async function updatePanelsByType(client, guildId, storeType, state) {
  const currentState = state || await readState(guildId);
  if (!currentState) return;

  // 指定されたタイプの全ての店舗パネルを取得
  const panelsToUpdate = [];
  for (const panelKey in currentState.panelMessages) {
    const panelInfo = currentState.panelMessages[panelKey];
    if (panelInfo && panelInfo.storeType === storeType && panelInfo.channelId && panelInfo.storeName) {
      panelsToUpdate.push({ panelKey, panelInfo });
    }
  }

  // 並行して全ての同タイプ店舗パネルを更新
  const updatePromises = panelsToUpdate.map(async ({ panelKey, panelInfo }) => {
    try {
      const statusMessage = await fetchMessageSafely(client, panelInfo.channelId, panelInfo.statusMessageId);
      if (statusMessage) {
        const { buildDetailedStatusEmbed } = require('./embedBuilder');
        const statusContent = { embeds: [buildDetailedStatusEmbed(panelInfo.storeName, panelInfo.storeType, currentState, panelInfo.channelId)] };
        await statusMessage.edit(statusContent).catch(err => {
          logger.error(`[PanelManager] ステータスパネルの編集に失敗 (${panelKey}):`, { error: err.message, guildId });
        });
      }

      const ordersMessage = await fetchMessageSafely(client, panelInfo.channelId, panelInfo.ordersMessageId);
      if (ordersMessage) {
        const { buildOrdersListEmbed } = require('./embedBuilder');
        const ordersContent = { embeds: [buildOrdersListEmbed(panelInfo.storeName, panelInfo.storeType, currentState, panelInfo.channelId)] };
        await ordersMessage.edit(ordersContent).catch(err => {
          logger.error(`[PanelManager] 注文パネルの編集に失敗 (${panelKey}):`, { error: err.message, guildId });
        });
      }
    } catch (error) {
      logger.error(`[PanelManager] パネル更新中にエラー (${panelKey}):`, error);
    }
  });

  await Promise.all(updatePromises);
  logger.info(`[PanelManager] ${storeType}タイプの全店舗パネル更新完了 (Guild: ${guildId}, 店舗数: ${panelsToUpdate.length})`);
}

/**
 * 古いログのクリーンアップタスクを開始
 * @param {import('discord.js').Client} client
 */
function startLogCleanupInterval(client) {
  setInterval(async () => {
    for (const guild of client.guilds.cache.values()) {
      try {
        const { readState, writeState } = require('./hikkakeStateManager');
        const state = await readState(guild.id);
        if (!state?.orders) continue;

        let stateWasModified = false;
        const now = DateTime ? DateTime.now() : new Date();

        for (const panelKey of Object.keys(state.orders)) {
          const originalCount = state.orders[panelKey]?.length || 0;
          if (originalCount === 0) continue;

          state.orders[panelKey] = state.orders[panelKey].filter(order => {
            if (!order.leaveTimestamp) return true; // アクティブな注文は保持
            
            let diffMinutes;
            if (DateTime) {
              diffMinutes = now.diff(DateTime.fromISO(order.leaveTimestamp), 'minutes').minutes;
            } else {
              diffMinutes = (now - new Date(order.leaveTimestamp)) / (1000 * 60);
            }
            return diffMinutes < LOG_RETENTION_MINUTES;
          });

          if (state.orders[panelKey].length < originalCount) {
            stateWasModified = true;
          }
        }

        if (stateWasModified) {
          await writeState(guild.id, state);
          await updateAllHikkakePanels(client, guild.id, state);
          logger.info(`[PanelManager] 古いログをクリーンアップしました (Guild: ${guild.name})`);
        }
      } catch (error) {
        logger.error(`[PanelManager] ログのクリーンアップ中にエラーが発生しました (Guild: ${guild.id}):`, { error });
      }
    }
  }, LOG_CLEANUP_INTERVAL_MS);
}

/**
 * ひっかけパネルをチャンネルに設置し、その情報を状態に保存します。
 * @param {string} guildId - ギルドID
 * @param {string} storeName - 店舗名
 * @param {import('discord.js').TextChannel} channel - パネルを設置するチャンネル
 */
async function createPanel(guildId, storeName, channel) {
  const { buildDetailedStatusEmbed, buildOrdersListEmbed } = require('./embedBuilder');
  const { readState, writeState } = require('./hikkakeStateManager');

  const panelKey = `${storeName}_${channel.id}`; // パネルを一意に識別するキー

  try {
    // 既存の状態を読み込み
    const state = await readState(guildId);
    state.panelMessages = state.panelMessages || {};

    // ステータスパネルの送信
    const statusEmbed = buildDetailedStatusEmbed(storeName, 'quest', state, channel.id); // 仮のstoreType
    const statusMessage = await channel.send({ embeds: [statusEmbed] });

    // 注文リストパネルの送信
    const ordersEmbed = buildOrdersListEmbed(storeName, 'quest', state, channel.id); // 仮のstoreType
    const ordersMessage = await channel.send({ embeds: [ordersEmbed] });

    // パネル情報を状態に保存
    state.panelMessages[panelKey] = {
      channelId: channel.id,
      statusMessageId: statusMessage.id,
      ordersMessageId: ordersMessage.id,
      storeName: storeName,
      storeType: 'quest', // 初期設定としてquestを設定
      lastUpdated: new Date().toISOString(),
    };

    await writeState(guildId, state);
    logger.info(`[panelStateManager] パネル作成完了: ${panelKey}`);
  } catch (error) {
    logger.error(`[panelStateManager] パネル作成エラー (${panelKey}):`, error);
    throw error;
  }
}

/**
 * 全てのひっかけパネルを更新
 * @param {import('discord.js').Client} client
 * @param {string} guildId
 * @param {object} [state] オプション: 使用する現在の状態。提供されない場合はGCSから読み込み
 */
async function updatePanels(client, guildId, state) {
  const currentState = state || await readState(guildId);
  if (!currentState) return;

  const updatePromises = [];

  for (const panelKey in currentState.panelMessages) {
    const panelInfo = currentState.panelMessages[panelKey];
    if (!panelInfo || !panelInfo.channelId || !panelInfo.storeName || !panelInfo.storeType) continue;

    updatePromises.push((async () => {
      try {
        const { buildDetailedStatusEmbed, buildOrdersListEmbed } = require('./embedBuilder');

        // ステータスパネルを更新
        const statusMessage = await fetchMessageSafely(client, panelInfo.channelId, panelInfo.statusMessageId);
        if (statusMessage) {
          const statusContent = { embeds: [buildDetailedStatusEmbed(panelInfo.storeName, panelInfo.storeType, currentState, panelInfo.channelId)] };
          await statusMessage.edit(statusContent).catch(err => {
            logger.error(`[PanelManager] ステータスパネルの編集に失敗 (${panelKey}):`, { error: err.message, guildId });
          });
        }

        // 注文パネルを更新
        const ordersMessage = await fetchMessageSafely(client, panelInfo.channelId, panelInfo.ordersMessageId);
        if (ordersMessage) {
          const ordersContent = { embeds: [buildOrdersListEmbed(panelInfo.storeName, panelInfo.storeType, currentState, panelInfo.channelId)] };
          await ordersMessage.edit(ordersContent).catch(err => {
            logger.error(`[PanelManager] 注文パネルの編集に失敗 (${panelKey}):`, { error: err.message, guildId });
          });
        }
      } catch (error) {
        logger.error(`[PanelManager] パネル更新中にエラー (${panelKey}):`, error);
      }
    })());
  }

  await Promise.all(updatePromises);
  logger.info(`[PanelManager] 全パネル更新完了 (Guild: ${guildId})`);
}

module.exports = {
  getHikkakeState,
  saveHikkakePanelInfo,
  updateStaffCountAndSync,
  createPanel,
  updatePanels,
  startLogCleanupInterval
};
