const { EmbedBuilder } = require('discord.js');
const { formatTime } = require('./timeUtils');
const logger = require('../../common/logger');
let DateTime;
try {
  DateTime = require('luxon').DateTime;
} catch (error) {
  logger.warn('⚠️ luxonライブラリが見つかりません。代替の時間処理を使用します。');
  DateTime = null;
}

/**
 * 店内状況パネル（Embed）を構築する（詳細版）
 * 多店舗対応：他の店舗の状況も表示します
 * @param {string} storeName 店舗名
 * @param {string} type 'quest', 'tosu', 'horse'
 * @param {object} state 現在の状態オブジェクト
 * @param {string} channelId パネルが設置されているチャンネルID
 * @returns {EmbedBuilder} 店内状況Embed
 */
function buildDetailedStatusEmbed(storeName, type, state, channelId = null) {
  const { staff, panelMessages } = state;

  const typeNameMap = {
    quest: '📜｜クエスト依頼',
    tosu: '🔭｜凸スナ',
    horse: '🐴｜トロイの木馬',
  };
  const typeName = typeNameMap[type] || type.toUpperCase();
  const panelKey = `${storeName}_${type}`;

  // チャンネルリンクを含むタイトル
  const channelLink = channelId ? `<#${channelId}>` : 'テキストチャンネル不明';
  let today = 'N/A';
  
  if (DateTime) {
    today = DateTime.now().setZone('Asia/Tokyo').toFormat('yyyy/MM/dd');
  } else {
    const date = new Date();
    today = date.toLocaleDateString('ja-JP');
  }
  
  const embed = new EmbedBuilder()
    .setTitle(`🏪 店内状況 - ${channelLink}`)
    .setDescription(`**${today}** の店内状況`)
    .setColor(0x3498DB)
    .setTimestamp()
    .setFooter({ text: '店内状況•今日' });

  // 全てのパネル（全店舗・全タイプ）を取得して表示
  const allPanels = Object.keys(panelMessages || {});
  
  if (allPanels.length === 0) {
    embed.addFields({ 
      name: '店舗なし', 
      value: 'まだひっかけパネルが設置されていません。\n`/ひっかけパネル設置` コマンドで設置してください。' 
    });
  } else {
    // タイプ別に整理して表示
    const typeGroups = {
      quest: [],
      tosu: [],
      horse: []
    };

    allPanels.forEach(panelKey => {
      const parts = panelKey.split('_');
      if (parts.length >= 2) {
        const panelType = parts[parts.length - 1];
        const panelStoreName = parts.slice(0, -1).join('_');
        
        if (typeGroups[panelType]) {
          typeGroups[panelType].push({
            storeName: panelStoreName,
            panelKey: panelKey,
            channelId: panelMessages[panelKey]?.channelId
          });
        }
      }
    });

    // 各タイプのパネルを表示
    Object.keys(typeGroups).forEach(panelType => {
      if (typeGroups[panelType].length > 0) {
        const typeName = typeNameMap[panelType];
        let typeContent = '';

        typeGroups[panelType].forEach(panel => {
          const { allocatedPura, allocatedKama } = getActiveStaffAllocation(state, panel.panelKey);
          const totalPura = staff?.[panel.panelKey]?.pura ?? 0;
          const totalKama = staff?.[panel.panelKey]?.kama ?? 0;
          const availablePura = totalPura - allocatedPura;
          const availableKama = totalKama - allocatedKama;

          // チャンネルリンクを表示
          const storeChannelLink = panel.channelId ? `<#${panel.channelId}>` : '設置チャンネル不明';
          
          // 現在のパネルは強調表示
          const isCurrentPanel = panel.panelKey === panelKey;
          const storeLabel = isCurrentPanel ? `**${panel.storeName}** (このパネル)` : panel.storeName;
          
          typeContent += `**${storeLabel}**\n`;
          typeContent += `📍 ${storeChannelLink}\n`;
          typeContent += `👥 プラ: **${availablePura}**/${totalPura} | カマ: **${availableKama}**/${totalKama}\n\n`;
        });

        embed.addFields({
          name: `${typeName}`,
          value: typeContent.trim(),
          inline: false
        });
      }
    });
  }

  return embed;
}

/**
 * ひっかけ一覧パネル（Embed）を構築する
 * @param {string} storeName 店舗名
 * @param {string} type 'quest', 'tosu', 'horse'
 * @param {object} state 現在の状態オブジェクト
 * @param {string} channelId パネルが設置されているチャンネルID
 * @returns {EmbedBuilder} ひっかけ一覧Embed
 */
function buildOrdersListEmbed(storeName, type, state, channelId = null) {
  const panelKey = `${storeName}_${type}`;
  const orders = state.orders?.[panelKey]?.filter(o => !o.leaveTimestamp) || [];

  const channelLink = channelId ? `<#${channelId}>` : 'テキストチャンネル不明';
  const embed = new EmbedBuilder()
    .setTitle(`${storeName} - ${channelLink}`)
    .setColor(0x9B59B6)
    .setTimestamp();

  if (orders.length === 0) {
    embed.setDescription('現在、受注はありません。');
  } else {
    // 文字数制限対策：最大5件まで表示
    const displayOrders = orders.slice(0, 5);
    const description = displayOrders.map(order => {
      let time = 'N/A';
      if (DateTime) {
        time = DateTime.fromISO(order.joinTimestamp).setZone('Asia/Tokyo').toFormat('HH:mm');
      } else {
        time = formatTime(order.joinTimestamp);
      }
      
      const user = order.user.username;
      const orderTypeLabel = {
        order: '予定',
        arrival: '来店',
        douhan: '同伴',
      }[order.type] || '不明';

      let details = '';
      if (order.type === 'douhan') {
        details = `${order.castUserId ? `<@${order.castUserId}>` : 'キャスト未定'}, ${order.people}人, ${order.duration}分`;
      } else {
        details = `${order.people}人, ${order.bottles}本, P${order.castPura}/K${order.castKama}`;
      }
      
      const statusEmoji = order.status === 'confirmed' ? '✅' : order.status === 'failed' ? '❌' : '⏳';
      const statusText = order.type === 'order' ? `${statusEmoji} ` : '';

      return `${statusText}[${time}] **${orderTypeLabel}** ${user}\n> ${details}`;
    }).join('\n\n');
    
    let finalDescription = description;
    if (orders.length > 5) {
      finalDescription += `\n\n... 他${orders.length - 5}件の受注`;
    }
    
    embed.setDescription(finalDescription);
  }

  return embed;
}

/**
 * スタッフ割り当て計算（旧版から移植）
 * @param {object} state 現在の状態オブジェクト
 * @param {string} panelKey パネルキー
 * @returns {object} { allocatedPura, allocatedKama }
 */
function getActiveStaffAllocation(state, panelKey) {
  if (!state.orders || !state.orders[panelKey]) {
    return { allocatedPura: 0, allocatedKama: 0 };
  }

  // アクティブな注文（まだ退店していない）からスタッフ割り当てを計算
  const activeOrders = state.orders[panelKey].filter(order => !order.leaveTimestamp);
  
  const allocatedPura = activeOrders.reduce((sum, order) => sum + (order.castPura || 0), 0);
  const allocatedKama = activeOrders.reduce((sum, order) => sum + (order.castKama || 0), 0);

  return { allocatedPura, allocatedKama };
}
async function buildHikkakeStatusEmbed(storeName, hikkakeState, targetChannel, channelSpecific = false) {
  const embed = new EmbedBuilder()
    .setTitle(`🎣 ひっかけ状況 - ${storeName}${channelSpecific ? '　設置したチャンネルのひっかけ状況のみ' : ''}`)
    .setDescription(channelSpecific ? '' : `📍 設置チャンネル: <#${targetChannel.id}>\n各カテゴリーの最新状況`)
    .setColor(0xFF6B6B)
    .setTimestamp();

  // 各カテゴリーの状況を集計
  const categories = [
    { key: 'quest', name: 'クエスト', emoji: '🗡️' },
    { key: 'tosu', name: '突撃', emoji: '⚔️' },
    { key: 'horse', name: 'トロイ', emoji: '🐴' }
  ];

  let allOrders = [];
  let allArrivals = [];

  for (const category of categories) {
    const orders = hikkakeState.orders[category.key] || [];
    const arrivals = hikkakeState.arrivals[category.key] || [];
    
    allOrders.push(...orders.map(o => ({ ...o, category: category.name, emoji: category.emoji })));
    allArrivals.push(...arrivals.map(a => ({ ...a, category: category.name, emoji: category.emoji })));
  }

  // ひっかけ予定の表示
  const pendingOrders = allOrders.filter(o => !o.status);
  let pendingText = '';
  if (pendingOrders.length > 0) {
    pendingText = pendingOrders.map(o => {
      const time = formatTime(o.joinTimestamp);
      return `${o.emoji} **[${time}]** ${o.people}人 - ${o.user.username}`;
    }).join('\n');
  } else {
    pendingText = '現在ひっかけ予定はありません';
  }

  // ひっかけ確定の表示
  const confirmedOrders = allOrders.filter(o => o.status === 'confirm');
  let confirmedText = '';
  if (confirmedOrders.length > 0) {
    confirmedText = confirmedOrders.map(o => {
      const time = formatTime(o.joinTimestamp);
      return `${o.emoji} **[${time}]** ${o.people}人 - ${o.user.username} ✅`;
    }).join('\n');
  } else {
    confirmedText = '現在ひっかけ確定はありません';
  }

  // ふらっと来たの表示
  let arrivalText = '';
  if (allArrivals.length > 0) {
    arrivalText = allArrivals.map(a => {
      const time = formatTime(a.joinTimestamp);
      return `${a.emoji} **[${time}]** ${a.people}人 - ${a.user.username}`;
    }).join('\n');
  } else {
    arrivalText = '現在ふらっと来た客はいません';
  }

  embed.addFields(
    { 
      name: '🐟 【ひっかけ予定】', 
      value: pendingText.length > 1024 ? pendingText.substring(0, 1021) + '...' : pendingText, 
      inline: false 
    },
    { 
      name: '🎣 【ひっかけ確定】', 
      value: confirmedText.length > 1024 ? confirmedText.substring(0, 1021) + '...' : confirmedText, 
      inline: false 
    },
    { 
      name: '🚶 【ふらっと来た】', 
      value: arrivalText.length > 1024 ? arrivalText.substring(0, 1021) + '...' : arrivalText, 
      inline: false 
    }
  );

  return embed;
}

/**
 * 店内状況Embedを構築する
 * @param {string} storeName 店舗名
 * @param {Array} allStoresData 全店舗データ
 * @param {object} currentStoreData 現在の店舗データ
 * @returns {EmbedBuilder} 店内状況Embed
 */
function buildStoreStatusEmbed(storeName, allStoresData, currentStoreData = null) {
  const sortedStores = [...allStoresData].sort((a, b) => {
    // currentStoreDataが指定されている場合は最初に表示
    if (currentStoreData) {
      if (a.storeName === currentStoreData.storeName) return -1;
      if (b.storeName === currentStoreData.storeName) return 1;
    }
    // その他は設置日時の降順（新しい順）
    return new Date(b.setupDate || '2024-01-01') - new Date(a.setupDate || '2024-01-01');
  });

  let storeList = '━━━━━━━━━━━━━━━━━━━━\n';
  
  for (const store of sortedStores) {
    storeList += `■ **${store.storeName}**\n`;
    storeList += `プラ: **${store.plakamaCount || 0}人**　カマ: **${store.plakamaCount || 0}人**\n`;
    storeList += '━━━━━━━━━━━━━━━━━━━━\n';
  }

  const embed = new EmbedBuilder()
    .setTitle('🏪 店内状況')
    .setDescription(storeList)
    .setColor(0x00AE86)
    .setTimestamp();

  return embed;
}

module.exports = {
  buildHikkakeStatusEmbed,
  buildStoreStatusEmbed,
  buildDetailedStatusEmbed,
  buildOrdersListEmbed,
  getActiveStaffAllocation
};
