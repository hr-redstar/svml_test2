const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const logger = require('../../common/logger');
const { getHikkakeState } = require('./panelStateManager');
const { buildHikkakeStatusEmbed, buildStoreStatusEmbed } = require('./embedBuilder');
const { getAllStoresStatus } = require('./storeDataManager');

/**
 * ひっかけパネルを直接生成して設置する
 * @param {*} client Discord client
 * @param {string} guildId ギルドID
 * @param {string} storeName 店舗名
 * @param {string} channelId チャンネルID
 * @param {boolean} channelSpecific 設置チャンネル専用モード
 * @param {object} currentStoreData 現在の店舗データ
 * @returns {object} 送信されたメッセージ
 */
async function generateHikkakeBoardDirect(client, guildId, storeName, channelId, channelSpecific = false, currentStoreData = null) {
  try {
    logger.info(`✅ ひっかけボード生成開始: ${storeName} in ${channelId}${channelSpecific ? ' (チャンネル専用モード)' : ''}`);
    
    // ギルドを取得
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      throw new Error(`ギルドが見つかりません: ${guildId}`);
    }

    // チャンネルを取得
    const channel = guild.channels.cache.get(channelId);
    if (!channel) {
      throw new Error(`チャンネルが見つかりません: ${channelId}`);
    }

    // 店舗状況Embedを構築
    let embed, actionRow, statusEmbed;
    
    if (channelSpecific && currentStoreData) {
      // 設置チャンネル専用モード：個別店舗表示
      logger.info('📊 設置チャンネル専用モード：個別ひっかけ状況表示');
      
      // ひっかけ状況を取得
      const hikkakeState = await getHikkakeState(guildId, storeName);
      statusEmbed = await buildHikkakeStatusEmbed(storeName, hikkakeState, channel, true);
      
      // メッセージを送信（ひっかけ状況のみ）
      const sentMessage = await channel.send({
        embeds: [statusEmbed]
      });
      
      logger.info(`✅ 設置チャンネル専用ひっかけパネル送信完了: ${storeName}`);
      return sentMessage;
      
    } else {
      // 通常モード：全体状況表示
      const allStoresData = await getAllStoresStatus();
      embed = buildStoreStatusEmbed(storeName, allStoresData, currentStoreData);

      // アクションボタンを設定
      actionRow = createActionButtons(storeName);

      // メッセージを送信
      const sentMessage = await channel.send({
        embeds: [embed],
        components: [actionRow]
      });

      logger.info(`✅ ひっかけパネル送信完了: ${storeName}`);
      return sentMessage;
    }

  } catch (error) {
    logger.error('❌ ひっかけボード生成エラー:', error);
    throw error;
  }
}

/**
 * アクションボタンを作成する
 * @param {string} storeName 店舗名
 * @returns {ActionRowBuilder} アクションボタン行
 */
function createActionButtons(storeName) {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`hikkake_refresh_${storeName}`)
        .setLabel('\uD83D\uDD04 更新')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`hikkake_plakama_${storeName}`)
        .setLabel('\uD83D\uDC65 プラカマ')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`hikkake_douhan_${storeName}`)
        .setLabel('\uD83E\uDD1D 同伴')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`hikkake_arrival_${storeName}`)
        .setLabel('\uD83D\uDEB6 ふらっと来た')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`hikkake_order_${storeName}`)
        .setLabel('\uD83D\uDCDD ひっかけ予定')
        .setStyle(ButtonStyle.Danger)
    );
}

module.exports = {
  generateHikkakeBoardDirect,
  createActionButtons
};
