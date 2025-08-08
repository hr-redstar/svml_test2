// hikkake_bot/components/embeds/hikkakeEmbeds.js - ひっかけ関連埋め込みコンポーネント

const { EmbedBuilder, Colors } = require('discord.js');

/**
 * ひっかけ注文パネル埋め込み
 */
function createHikkakeOrderPanelEmbed() {
  return new EmbedBuilder()
    .setTitle('🍾 ひっかけ注文システム')
    .setDescription('ひっかけ注文を行うには、下のボタンを押してください。')
    .setColor(Colors.Gold)
    .addFields(
      { name: '📋 注文方法', value: '「ひっかけ注文」ボタンを押してフォームに入力', inline: false },
      { name: '⏱️ 処理時間', value: '注文後、スタッフが確認・準備を行います', inline: false },
      { name: '💡 注意事項', value: '正確なドリンク名・数量・価格を入力してください', inline: false }
    )
    .setThumbnail('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop')
    .setFooter({ text: 'SVML ひっかけ注文システム' })
    .setTimestamp();
}

/**
 * 注文確認埋め込み
 * @param {object} orderData 
 */
function createOrderConfirmationEmbed(orderData) {
  const totalPrice = orderData.quantity * orderData.price;
  
  return new EmbedBuilder()
    .setTitle('🍾 ひっかけ注文確認')
    .setColor(Colors.Blue)
    .setDescription(`注文者：<@${orderData.userId}>`)
    .addFields(
      { name: '🥂 ドリンク名', value: orderData.drinkName, inline: true },
      { name: '🔢 数量', value: `${orderData.quantity}本`, inline: true },
      { name: '💰 単価', value: `¥${orderData.price.toLocaleString()}`, inline: true },
      { name: '💵 合計金額', value: `¥${totalPrice.toLocaleString()}`, inline: true },
      { name: '📅 注文日時', value: new Date(orderData.createdAt).toLocaleString('ja-JP'), inline: true },
      { name: '📋 状態', value: getStatusText(orderData.status), inline: true }
    )
    .setFooter({ text: `注文ID: ${orderData.id}` })
    .setTimestamp();

  if (orderData.remarks) {
    return orderData.addFields({ name: '📝 備考', value: orderData.remarks, inline: false });
  }

  return orderData;
}

/**
 * 注文完了埋め込み
 * @param {object} orderData 
 */
function createOrderCompletedEmbed(orderData) {
  const embed = createOrderConfirmationEmbed(orderData);
  embed.setTitle('✅ ひっかけ注文完了')
    .setColor(Colors.Green)
    .addFields({ name: '🎉 状態', value: '完了しました！', inline: false });

  return embed;
}

/**
 * 注文キャンセル埋め込み
 * @param {object} orderData 
 * @param {string} reason 
 */
function createOrderCancelledEmbed(orderData, reason = '') {
  const embed = createOrderConfirmationEmbed(orderData);
  embed.setTitle('❌ ひっかけ注文キャンセル')
    .setColor(Colors.Red);

  if (reason) {
    embed.addFields({ name: '📝 キャンセル理由', value: reason, inline: false });
  }

  return embed;
}

/**
 * 注文一覧埋め込み
 * @param {Array} orders 
 * @param {string} status 
 * @param {number} page 
 * @param {number} totalPages 
 */
function createOrderListEmbed(orders, status, page = 1, totalPages = 1) {
  const statusText = {
    'active': '🔄 進行中',
    'completed': '✅ 完了',
    'cancelled': '❌ キャンセル',
    'all': '📋 全注文'
  };

  const embed = new EmbedBuilder()
    .setTitle(`${statusText[status]} ひっかけ注文一覧`)
    .setColor(Colors.DarkBlue)
    .setDescription(orders.length > 0 ? 
      `${orders.length}件の注文が見つかりました（ページ ${page}/${totalPages}）` : 
      '該当する注文はありません'
    );

  if (orders.length > 0) {
    const fields = orders.map((order, index) => {
      const totalPrice = order.quantity * order.price;
      return {
        name: `${(page - 1) * 10 + index + 1}. ${order.drinkName}`,
        value: `💰 ¥${totalPrice.toLocaleString()} | 🔢 ${order.quantity}本 | <@${order.userId}>\n📅 ${new Date(order.createdAt).toLocaleDateString('ja-JP')}`,
        inline: false
      };
    });

    embed.addFields(fields);
  }

  return embed;
}

/**
 * ひっかけ統計埋め込み
 * @param {object} stats 
 * @param {string} period 
 */
function createHikkakeStatsEmbed(stats, period) {
  return new EmbedBuilder()
    .setTitle(`📊 ひっかけ統計 - ${period}`)
    .setColor(Colors.Purple)
    .addFields(
      { name: '📝 総注文数', value: `${stats.totalOrders}件`, inline: true },
      { name: '✅ 完了注文', value: `${stats.completedOrders}件`, inline: true },
      { name: '🔄 進行中注文', value: `${stats.activeOrders}件`, inline: true },
      { name: '💰 総売上', value: `¥${stats.totalRevenue.toLocaleString()}`, inline: true },
      { name: '🥂 人気ドリンク', value: stats.popularDrink || 'データなし', inline: true },
      { name: '📈 完了率', value: `${stats.completionRate}%`, inline: true }
    )
    .setThumbnail('https://images.unsplash.com/photo-1551024506-0bccd828d307?w=100&h=100&fit=crop')
    .setFooter({ text: `${period}の統計 | SVMLひっかけシステム` })
    .setTimestamp();
}

/**
 * 月次レポート埋め込み
 * @param {object} monthlyData 
 * @param {string} month 
 */
function createMonthlyReportEmbed(monthlyData, month) {
  return new EmbedBuilder()
    .setTitle(`📈 ${month} ひっかけ月次レポート`)
    .setColor(Colors.Blurple)
    .addFields(
      { name: '📅 営業日数', value: `${monthlyData.businessDays}日`, inline: true },
      { name: '📝 総注文数', value: `${monthlyData.totalOrders}件`, inline: true },
      { name: '💰 総売上', value: `¥${monthlyData.totalRevenue.toLocaleString()}`, inline: true },
      { name: '📊 日平均注文数', value: `${monthlyData.avgOrdersPerDay}件`, inline: true },
      { name: '💵 日平均売上', value: `¥${monthlyData.avgRevenuePerDay.toLocaleString()}`, inline: true },
      { name: '🏆 最高売上日', value: monthlyData.bestDay, inline: true }
    )
    .setFooter({ text: `${month}のレポート | SVMLひっかけシステム` })
    .setTimestamp();
}

/**
 * エラー埋め込み
 * @param {string} message 
 */
function createErrorEmbed(message) {
  return new EmbedBuilder()
    .setTitle('❌ エラー')
    .setDescription(message)
    .setColor(Colors.Red)
    .setTimestamp();
}

/**
 * 成功埋め込み
 * @param {string} message 
 */
function createSuccessEmbed(message) {
  return new EmbedBuilder()
    .setTitle('✅ 成功')
    .setDescription(message)
    .setColor(Colors.Green)
    .setTimestamp();
}

/**
 * 通知埋め込み
 * @param {string} title 
 * @param {string} message 
 * @param {string} type 
 */
function createNotificationEmbed(title, message, type = 'info') {
  const colors = {
    'info': Colors.Blue,
    'warning': Colors.Yellow,
    'error': Colors.Red,
    'success': Colors.Green
  };

  const emojis = {
    'info': 'ℹ️',
    'warning': '⚠️',
    'error': '❌',
    'success': '✅'
  };

  return new EmbedBuilder()
    .setTitle(`${emojis[type]} ${title}`)
    .setDescription(message)
    .setColor(colors[type])
    .setTimestamp();
}

/**
 * 状態テキストを取得
 * @param {string} status 
 */
function getStatusText(status) {
  const statusMap = {
    'pending': '⏳ 承認待ち',
    'active': '🔄 進行中',
    'completed': '✅ 完了',
    'cancelled': '❌ キャンセル'
  };
  return statusMap[status] || status;
}

module.exports = {
  createHikkakeOrderPanelEmbed,
  createOrderConfirmationEmbed,
  createOrderCompletedEmbed,
  createOrderCancelledEmbed,
  createOrderListEmbed,
  createHikkakeStatsEmbed,
  createMonthlyReportEmbed,
  createErrorEmbed,
  createSuccessEmbed,
  createNotificationEmbed
};
