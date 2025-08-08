// kpi_bot/components/embeds/kpiEmbeds.js - KPIシステムEmbedコンポーネント

const { EmbedBuilder } = require('discord.js');

/**
 * KPI管理パネルのメインEmbedを作成
 */
function createKpiManagementEmbed(storeName, logChannelId = null, targetData = null) {
  const embed = new EmbedBuilder()
    .setTitle(`📊 ${storeName} - KPI管理パネル`)
    .setDescription('**KPI目標値と実績管理**\n\n' +
      '📋 **KPI登録** - 期間・目標値を設定\n' +
      '📊 **KPI申請** - 日次実績を申請\n' +
      '📝 **KPIログチャンネル選択** - 進捗ログ表示設定')
    .setColor(0x1e90ff)
    .setTimestamp();

  // KPIログチャンネル情報を追加
  if (logChannelId) {
    embed.addFields({
      name: '📝 KPIログチャンネル',
      value: `<#${logChannelId}>`,
      inline: true
    });
  } else {
    embed.addFields({
      name: '📝 KPIログチャンネル',
      value: '未設定',
      inline: true
    });
  }

  // 現在の目標値情報を追加
  if (targetData && targetData.period) {
    embed.addFields(
      {
        name: '📅 設定期間',
        value: `${targetData.period.start} ～ ${targetData.period.end}`,
        inline: true
      },
      {
        name: '🎯 目標値設定状況',
        value: targetData.visitors ? '設定済み' : '未設定',
        inline: true
      }
    );
  }

  embed.setFooter({ text: 'KPI管理システム - 目標達成をサポート' });

  return embed;
}

/**
 * KPI目標設定パネルのEmbedを作成
 */
function createKpiTargetEmbed(storeName, targetData = {}) {
  const embed = new EmbedBuilder()
    .setTitle(`🎯 ${storeName} - KPI目標設定`)
    .setDescription('**期間中のKPI目標値を設定してください**\n\n' +
      '各項目のボタンをクリックして目標値を入力します。')
    .setColor(0x00ff00);

  // 設定済みの値を表示
  embed.addFields(
    {
      name: '� 開始～終了日',
      value: targetData.period ? `${targetData.period.start} ～ ${targetData.period.end}` : '未設定',
      inline: true
    },
    {
      name: '👥 来客数',
      value: targetData.visitors ? `${targetData.visitors}人` : '未設定',
      inline: true
    },
    {
      name: '🎯 指名本数',
      value: targetData.nominations ? `${targetData.nominations}本` : '未設定',
      inline: true
    },
    {
      name: '💰 指名売上',
      value: targetData.nominationSales ? `${targetData.nominationSales.toLocaleString()}円` : '未設定',
      inline: true
    },
    {
      name: '💵 フリー売上',
      value: targetData.freeSales ? `${targetData.freeSales.toLocaleString()}円` : '未設定',
      inline: true
    },
    {
      name: '💎 純売上',
      value: targetData.totalSales ? `${targetData.totalSales.toLocaleString()}円` : '未設定',
      inline: true
    }
  );

  embed.setFooter({ text: 'KPI目標設定 - 各ボタンをクリックして設定してください' });

  return embed;
}

/**
 * KPI申請パネルのEmbedを作成
 */
function createKpiReportEmbed(storeName, reportData = {}) {
  const today = new Date().toLocaleDateString('ja-JP');
  
  const embed = new EmbedBuilder()
    .setTitle(`📊 ${storeName} - KPI申請`)
    .setDescription('**日次KPI実績を申請してください**\n\n' +
      '各項目のボタンをクリックして実績値を入力します。')
    .setColor(0xff6b6b);

  // 申請データを表示
  embed.addFields(
    {
      name: '📅 登録する日付',
      value: reportData.date || today,
      inline: true
    },
    {
      name: '👥 来客数',
      value: reportData.visitors ? `${reportData.visitors}人` : '未入力',
      inline: true
    },
    {
      name: '🎯 指名本数',
      value: reportData.nominations ? `${reportData.nominations}本` : '未入力',
      inline: true
    },
    {
      name: '💰 指名売上',
      value: reportData.nominationSales ? `${reportData.nominationSales.toLocaleString()}円` : '未入力',
      inline: true
    },
    {
      name: '💵 フリー売上',
      value: reportData.freeSales ? `${reportData.freeSales.toLocaleString()}円` : '未入力',
      inline: true
    },
    {
      name: '� 純売上',
      value: reportData.totalSales ? `${reportData.totalSales.toLocaleString()}円` : '未入力',
      inline: true
    }
  );

  embed.setFooter({ text: 'KPI申請 - 各ボタンをクリックして実績を入力してください' });

  return embed;
}

/**
 * KPIログ表示用のEmbedを作成
 */
function createKpiLogEmbed(storeName, progressData) {
  const { date, period, progress, targets, actuals } = progressData;
  
  const embed = new EmbedBuilder()
    .setTitle(`📊 ${storeName} - KPI進捗状況`)
    .setDescription(`**日付：${date}**\n` +
      `**期間進捗：${progress.days}日間 / ${progress.totalDays}日間（${progress.percentage}%）**`)
    .setColor(0x00ff00);

  // 各KPI項目の進捗を表示
  const fields = [];

  if (targets.visitors && actuals.visitors !== undefined) {
    const percentage = ((actuals.visitors / targets.visitors) * 100).toFixed(1);
    const status = percentage >= 100 ? '✅' : '❌';
    fields.push({
      name: '👥 来客数',
      value: `${actuals.visitors}/${targets.visitors}人(${percentage}%)${status}`,
      inline: true
    });
  }

  if (targets.nominations && actuals.nominations !== undefined) {
    const percentage = ((actuals.nominations / targets.nominations) * 100).toFixed(1);
    const status = percentage >= 100 ? '✅' : '❌';
    fields.push({
      name: '🎯 指名本数',
      value: `${actuals.nominations}/${targets.nominations}本(${percentage}%)${status}`,
      inline: true
    });
  }

  if (targets.nominationSales && actuals.nominationSales !== undefined) {
    const percentage = ((actuals.nominationSales / targets.nominationSales) * 100).toFixed(1);
    const status = percentage >= 100 ? '✅' : '❌';
    fields.push({
      name: '� 指名売上',
      value: `${actuals.nominationSales.toLocaleString()}円 / ${targets.nominationSales.toLocaleString()}円(${percentage}%)${status}`,
      inline: false
    });
  }

  if (targets.freeSales && actuals.freeSales !== undefined) {
    const percentage = ((actuals.freeSales / targets.freeSales) * 100).toFixed(1);
    const status = percentage >= 100 ? '✅' : '❌';
    fields.push({
      name: '💵 フリー売上',
      value: `${actuals.freeSales.toLocaleString()}円 / ${targets.freeSales.toLocaleString()}円(${percentage}%)${status}`,
      inline: false
    });
  }

  if (targets.totalSales && actuals.totalSales !== undefined) {
    const percentage = ((actuals.totalSales / targets.totalSales) * 100).toFixed(1);
    const status = percentage >= 100 ? '✅' : '❌';
    fields.push({
      name: '💎 総売上',
      value: `${actuals.totalSales.toLocaleString()}円 / ${targets.totalSales.toLocaleString()}円(${percentage}%)${status}`,
      inline: false
    });
  }

  embed.addFields(fields);
  embed.setTimestamp();
  embed.setFooter({ text: 'KPI進捗状況 - リアルタイム更新' });

  return embed;
}

// 旧関数（互換性維持）
function createKpiApplicationEmbed(title, description, storeName = null) {
  return createKpiManagementEmbed(storeName);
}

function createStoreSelectionEmbed() {
  return new EmbedBuilder()
    .setTitle('🏢 店舗選択')
    .setDescription('KPI申請設置を行う店舗を選択してください')
    .setColor(0x2ecc71)
    .setTimestamp();
}

function createChannelSelectionEmbed(storeName) {
  return new EmbedBuilder()
    .setTitle('� チャンネル選択')
    .setDescription(`**${storeName}** のKPI申請パネルを設置するチャンネルを選択してください`)
    .setColor(0xe74c3c)
    .setTimestamp();
}

function createKpiSetupCompleteEmbed(storeName, channelName) {
  return new EmbedBuilder()
    .setTitle('✅ KPI申請パネル設置完了')
    .setDescription(`**${storeName}** のKPI申請パネルが設置されました`)
    .setColor(0x27ae60)
    .addFields([
      { name: '🏢 店舗', value: storeName, inline: true },
      { name: '📝 設置チャンネル', value: `#${channelName}`, inline: true }
    ])
    .setTimestamp();
}

module.exports = {
  createKpiManagementEmbed,
  createKpiTargetEmbed,
  createKpiReportEmbed,
  createKpiLogEmbed,
  // 旧関数（互換性維持）
  createKpiApplicationEmbed,
  createStoreSelectionEmbed,
  createChannelSelectionEmbed,
  createKpiSetupCompleteEmbed
};
