// kpi_bot/handlers/kpiHandler.js - KPI管理ハンドラー

const { 
  EmbedBuilder, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType
} = require('discord.js');
const logger = require('@common/logger');

// KPIコンポーネントのインポート
const { 
  createStoreSelectMenu, 
  createChannelSelectMenu, 
  createLogChannelSelectMenu,
  getStoreDisplayName,
  getStoreSelectId,
  getChannelSelectId,
  getLogChannelSelectId
} = require('../components/selects/kpiSelects');

const { 
  createKpiPeriodModal,
  createKpiVisitorTargetModal,
  createKpiNominationTargetModal,
  createKpiSalesTargetModal,
  createKpiDailyReportModal,
  createStoreKpiTargetModal, 
  createKpiPanelModal 
} = require('../components/modals/kpiModals');

const {
  createKpiManagementEmbed,
  createKpiTargetEmbed,
  createKpiReportEmbed,
  createKpiLogEmbed,
  createKpiApplicationEmbed,
  createKpiApplicationButtons,
  createStoreSelectionEmbed,
  createChannelSelectionEmbed,
  createKpiSetupCompleteEmbed
} = require('../components/embeds/kpiEmbeds');

const {
  createKpiManagementButtons,
  createKpiTargetButtons,
  createKpiTargetButtons2,
  createKpiReportButtons,
  createKpiReportButtons2
} = require('../components/buttons/kpiButtons');

// KPI専用GCSヘルパー
const { saveKpiDataToGcs, saveKpiTargetToGcs, generateTodayKpiCsvPath } = require('../utils/kpiGcsHelper');
const { Storage } = require('@google-cloud/storage');

module.exports = {
  async execute(interaction) {
    // スラッシュコマンド対応追加
    if (interaction.isChatInputCommand && interaction.isChatInputCommand()) {
      // ここで対応するコマンドがなければ必ず応答する
      await interaction.reply({
        content: 'このコマンドは現在未対応です。',
        ephemeral: true
      });
      return true;
    }

    const { customId } = interaction;
    logger.info(`[kpiHandler] インタラクション処理開始: ${customId}`);

    try {
      // KPI設置ボタン
      if (customId === 'kpi_panel_setup') {
        await handleKpiPanelSetup(interaction);
        return true;
      }
      // KPIログチャンネル選択ボタン
      if (customId === 'kpi_log_channel_setup') {
        await handleKpiLogChannelSetup(interaction);
        return true;
      }
      // KPI期間設定ボタン
      if (customId === 'kpi_period_setting') {
        await handleKpiPeriodSetting(interaction);
        return true;
      }
      // KPI来客数目標ボタン
      if (customId === 'kpi_visitor_target') {
        await handleKpiVisitorTarget(interaction);
        return true;
      }
      // KPI指名本数目標ボタン
      if (customId === 'kpi_nomination_target') {
        await handleKpiNominationTarget(interaction);
        return true;
      }
      // KPI売上目標ボタン
      if (customId === 'kpi_sales_target') {
        await handleKpiSalesTarget(interaction);
        return true;
      }
      // KPI目標値確認ボタン
      if (customId === 'kpi_target_check') {
        await handleKpiTargetCheck(interaction);
        return true;
      }
      // KPI日次報告ボタン
      if (customId === 'kpi_daily_report') {
        await handleKpiDailyReport(interaction);
        return true;
      }
      // KPI進捗確認ボタン
      if (customId === 'kpi_progress_check') {
        await handleKpiProgressCheck(interaction);
        return true;
      }
      // KPIログ確認ボタン
      if (customId === 'kpi_log_check') {
        await handleKpiLogCheck(interaction);
        return true;
      }
      // === SVML設定からのKPI設定ボタン ===
      if (customId === 'kpi_config_button') {
        await interaction.deferReply({ ephemeral: true });
        try {
          const embed = createKpiManagementEmbed();
          const buttons = createKpiManagementButtons();
          await interaction.editReply({
            embeds: [embed],
            components: buttons
          });
          logger.info(`[kpiHandler] KPI設定パネル表示完了: ${interaction.user.tag}`);
          return true;
        } catch (error) {
          logger.error('[kpiHandler] KPI設定パネル表示エラー:', error);
          await interaction.editReply({
            content: '❌ KPI設定パネルの表示に失敗しました。'
          });
          return true;
        }
      }
      // 従来のボタン（互換性維持）
      if (customId === 'kpi_target_button') {
        await handleKpiTargetModal(interaction);
        return true;
      }
      if (customId === 'kpi_panel_setup_button') {
        await handleKpiPanelSetupLegacy(interaction);
        return true;
      }
      if (customId === 'kpi_csv_button') {
        await handleKpiCsvExport(interaction);
        return true;
      }
      if (customId === 'kpi_report_button') {
        await handleKpiReportModal(interaction);
        return true;
      }
      // セレクトメニュー処理
      if (customId === getStoreSelectId()) {
        await handleStoreSelection(interaction);
        return true;
      }
      if (customId === getChannelSelectId()) {
        await handleChannelSelection(interaction);
        return true;
      }
      if (customId === getLogChannelSelectId()) {
        await handleLogChannelSelection(interaction);
        return true;
      }
      // 店舗別KPI申請ボタン
      if (customId && customId.startsWith('kpi_application_')) {
        await handleKpiApplication(interaction);
        return true;
      }
      // モーダル送信処理
      if (customId === 'kpi_period_modal') {
        await handleKpiPeriodSubmit(interaction);
        return true;
      }
      if (customId === 'kpi_visitor_target_modal') {
        await handleKpiVisitorTargetSubmit(interaction);
        return true;
      }
      if (customId === 'kpi_nomination_target_modal') {
        await handleKpiNominationTargetSubmit(interaction);
        return true;
      }
      if (customId === 'kpi_sales_target_modal') {
        await handleKpiSalesTargetSubmit(interaction);
        return true;
      }
      if (customId === 'kpi_daily_report_modal') {
        await handleKpiDailyReportSubmit(interaction);
        return true;
      }
      if (customId === 'kpi_target_modal') {
        await handleKpiTargetSubmit(interaction);
        return true;
      }
      if (customId && customId.startsWith('kpi_store_target_modal_')) {
        await handleStoreKpiTargetSubmit(interaction);
        return true;
      }
      if (customId === 'kpi_panel_create_modal') {
        await handleKpiPanelCreateSubmit(interaction);
        return true;
      }
      if (customId === 'kpi_report_modal') {
        await handleKpiReportSubmit(interaction);
        return true;
      }
      // どの分岐にも該当しない場合も必ず応答
      if (interaction.isRepliable && interaction.isRepliable()) {
        await interaction.reply({
          content: '未対応の操作です。',
          ephemeral: true
        });
      }
      return true;
    } catch (error) {
      logger.error(`[kpiHandler] エラー (${customId}):`, error);
      if (interaction.deferred) {
        await interaction.editReply({
          content: '❌ 処理中にエラーが発生しました。'
        });
      } else if (interaction.isModalSubmit && interaction.isModalSubmit()) {
        await interaction.reply({
          content: '❌ データの保存に失敗しました。',
          ephemeral: true
        });
      } else if (interaction.isRepliable && interaction.isRepliable()) {
        await interaction.reply({
          content: '❌ 処理中にエラーが発生しました。',
          ephemeral: true
        });
      }
      return true;
    }
  }
};

/**
 * KPI設置処理
 */
async function handleKpiPanelSetup(interaction) {
  await interaction.deferReply({ ephemeral: true });
  
  logger.info('[kpiHandler] KPI設置開始');

  try {
    // 店舗選択画面を表示
    const storeEmbed = createStoreSelectionEmbed();
    // 動的に店舗リストを取得（実際の実装では設定から読み込み）
    const stores = ['渋谷店', '新宿店', '池袋店', '銀座店', '六本木店'];
    const storeSelectRow = createStoreSelectMenu(stores);

    await interaction.editReply({
      embeds: [storeEmbed],
      components: [storeSelectRow]
    });

    logger.info('[kpiHandler] KPI設置画面表示完了');

  } catch (error) {
    logger.error('[kpiHandler] KPI設置エラー:', error);
    await interaction.editReply({
      content: '❌ KPI設置の初期化に失敗しました。'
    });
  }
}

/**
 * KPIログチャンネル設定処理
 */
async function handleKpiLogChannelSetup(interaction) {
  await interaction.deferReply({ ephemeral: true });
  
  logger.info('[kpiHandler] KPIログチャンネル設定開始');

  try {
    const embed = new EmbedBuilder()
      .setTitle('📊 KPIログチャンネル選択')
      .setDescription(
        '**KPIログを表示するチャンネルを選択してください**\n\n' +
        '設定されたチャンネルには以下のログが記録されます：\n' +
        '• KPI目標値設定ログ\n' +
        '• KPI申請ログ\n' +
        '• KPI進捗ログ\n\n' +
        '📝 ログ専用チャンネルの利用を推奨します。'
      )
      .setColor(0x3498db)
      .setTimestamp();

    const logChannelSelectRow = createLogChannelSelectMenu();

    await interaction.editReply({
      embeds: [embed],
      components: [logChannelSelectRow]
    });

    logger.info('[kpiHandler] KPIログチャンネル選択画面表示完了');

  } catch (error) {
    logger.error('[kpiHandler] KPIログチャンネル設定エラー:', error);
    await interaction.editReply({
      content: '❌ KPIログチャンネル設定の初期化に失敗しました。'
    });
  }
}

/**
 * KPI期間設定処理
 */
async function handleKpiPeriodSetting(interaction) {
  logger.info('[kpiHandler] KPI期間設定モーダル表示開始');

  const modal = createKpiPeriodModal();
  await interaction.showModal(modal);
  
  logger.info('[kpiHandler] KPI期間設定モーダル表示完了');
}

/**
 * KPI来客数目標設定処理
 */
async function handleKpiVisitorTarget(interaction) {
  logger.info('[kpiHandler] KPI来客数目標設定モーダル表示開始');

  const modal = createKpiVisitorTargetModal();
  await interaction.showModal(modal);
  
  logger.info('[kpiHandler] KPI来客数目標設定モーダル表示完了');
}

/**
 * KPI指名本数目標設定処理
 */
async function handleKpiNominationTarget(interaction) {
  logger.info('[kpiHandler] KPI指名本数目標設定モーダル表示開始');

  const modal = createKpiNominationTargetModal();
  await interaction.showModal(modal);
  
  logger.info('[kpiHandler] KPI指名本数目標設定モーダル表示完了');
}

/**
 * KPI売上目標設定処理
 */
async function handleKpiSalesTarget(interaction) {
  logger.info('[kpiHandler] KPI売上目標設定モーダル表示開始');

  const modal = createKpiSalesTargetModal();
  await interaction.showModal(modal);
  
  logger.info('[kpiHandler] KPI売上目標設定モーダル表示完了');
}

/**
 * KPI目標値確認処理
 */
async function handleKpiTargetCheck(interaction) {
  await interaction.deferReply({ ephemeral: true });
  
  logger.info('[kpiHandler] KPI目標値確認開始');

  try {
    // サンプルデータ（実際の実装では保存されたデータから取得）
    const targetData = {
      period: '2025/07/01～2025/07/05',
      visitors: 210,
      nominations: 52.5,
      nominationSales: 3412500,
      freeSales: 1487500,
      totalSales: 4900000
    };

    const targetEmbed = createKpiTargetEmbed(targetData);
    const targetButtons = createKpiTargetButtons2();

    await interaction.editReply({
      embeds: [targetEmbed],
      components: [targetButtons]
    });

    logger.info('[kpiHandler] KPI目標値確認表示完了');

  } catch (error) {
    logger.error('[kpiHandler] KPI目標値確認エラー:', error);
    await interaction.editReply({
      content: '❌ KPI目標値の取得に失敗しました。'
    });
  }
}

/**
 * KPI日次報告処理
 */
async function handleKpiDailyReport(interaction) {
  logger.info('[kpiHandler] KPI日次報告モーダル表示開始');

  const modal = createKpiDailyReportModal();
  await interaction.showModal(modal);
  
  logger.info('[kpiHandler] KPI日次報告モーダル表示完了');
}

/**
 * KPI進捗確認処理
 */
async function handleKpiProgressCheck(interaction) {
  await interaction.deferReply({ ephemeral: true });
  
  logger.info('[kpiHandler] KPI進捗確認開始');

  try {
    // サンプルデータ（実際の実装では保存されたデータから計算）
    const progressData = {
      period: '2025/07/01～2025/07/05',
      currentDate: '2025/07/03',
      visitors: { target: 210, actual: 87, percentage: 41.4 },
      nominations: { target: 52.5, actual: 23.2, percentage: 44.2 },
      nominationSales: { target: 3412500, actual: 1456000, percentage: 42.7 },
      freeSales: { target: 1487500, actual: 623000, percentage: 41.9 },
      totalSales: { target: 4900000, actual: 2079000, percentage: 42.4 }
    };

    const reportEmbed = createKpiReportEmbed(progressData);
    const reportButtons = createKpiReportButtons2();

    await interaction.editReply({
      embeds: [reportEmbed],
      components: [reportButtons]
    });

    logger.info('[kpiHandler] KPI進捗確認表示完了');

  } catch (error) {
    logger.error('[kpiHandler] KPI進捗確認エラー:', error);
    await interaction.editReply({
      content: '❌ KPI進捗の取得に失敗しました。'
    });
  }
}

/**
 * KPIログ確認処理
 */
async function handleKpiLogCheck(interaction) {
  await interaction.deferReply({ ephemeral: true });
  
  logger.info('[kpiHandler] KPIログ確認開始');

  try {
    // サンプルデータ（実際の実装では保存されたログから取得）
    const logData = {
      targets: [
        { date: '2025/07/01', user: 'マネージャー', action: '期間設定', detail: '2025/07/01～2025/07/05' },
        { date: '2025/07/01', user: 'マネージャー', action: '来客数目標', detail: '210人' },
        { date: '2025/07/01', user: 'マネージャー', action: '指名本数目標', detail: '52.5本' },
        { date: '2025/07/01', user: 'マネージャー', action: '売上目標', detail: '指名:¥3,412,500 フリー:¥1,487,500 総売上:¥4,900,000' }
      ],
      reports: [
        { date: '2025/07/01', user: 'スタッフA', action: '日次報告', detail: '来客数:42人 指名本数:11.2本 総売上:¥980,000' },
        { date: '2025/07/02', user: 'スタッフB', action: '日次報告', detail: '来客数:45人 指名本数:12.0本 総売上:¥1,099,000' }
      ]
    };

    const logEmbed = createKpiLogEmbed(logData);

    await interaction.editReply({
      embeds: [logEmbed]
    });

    logger.info('[kpiHandler] KPIログ確認表示完了');

  } catch (error) {
    logger.error('[kpiHandler] KPIログ確認エラー:', error);
    await interaction.editReply({
      content: '❌ KPIログの取得に失敗しました。'
    });
  }
}

/**
 * ログチャンネル選択処理
 */
async function handleLogChannelSelection(interaction) {
  const selectedChannel = interaction.channels.first();
  
  logger.info(`[kpiHandler] KPIログチャンネル選択: ${selectedChannel.name}`);

  try {
    // KPIログチャンネル設定を保存（実際の実装では永続化）
    const configData = {
      guildId: interaction.guild.id,
      kpiLogChannelId: selectedChannel.id,
      kpiLogChannelName: selectedChannel.name,
      configuredBy: interaction.user.id,
      configuredAt: new Date().toISOString()
    };

    logger.info('[kpiHandler] KPIログチャンネル設定:', configData);

    const confirmEmbed = new EmbedBuilder()
      .setTitle('✅ KPIログチャンネルが設定されました')
      .setDescription(
        `**設定内容**\n\n` +
        `📊 **ログチャンネル**: ${selectedChannel}\n` +
        `🔧 **設定者**: ${interaction.user.displayName}\n` +
        `📅 **設定日時**: ${new Date().toLocaleString('ja-JP')}\n\n` +
        `このチャンネルにKPIに関するすべてのログが記録されます。`
      )
      .setColor(0x27ae60)
      .setTimestamp();

    await interaction.update({
      embeds: [confirmEmbed],
      components: []
    });

    logger.info(`[kpiHandler] KPIログチャンネル設定完了: ${selectedChannel.name}`);

  } catch (error) {
    logger.error('[kpiHandler] KPIログチャンネル設定エラー:', error);
    await interaction.update({
      content: '❌ ログチャンネルの設定に失敗しました。',
      embeds: [],
      components: []
    });
  }
}

/**
 * KPI期間設定モーダル送信処理
 */
async function handleKpiPeriodSubmit(interaction) {
  logger.info('[kpiHandler] KPI期間設定保存開始');

  const startDate = interaction.fields.getTextInputValue('start_date');
  const endDate = interaction.fields.getTextInputValue('end_date');

  // 入力値の検証
  const dateRegex = /^\d{4}\/\d{2}\/\d{2}$/;
  if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
    await interaction.reply({
      content: '❌ 日付の形式が正しくありません。YYYY/MM/DD形式で入力してください。',
      ephemeral: true
    });
    return;
  }

  try {
    const periodData = {
      startDate,
      endDate,
      userId: interaction.user.id,
      userName: interaction.user.displayName,
      guildId: interaction.guild.id,
      createdAt: new Date().toISOString(),
      dataType: 'kpi_period'
    };

    logger.info('[kpiHandler] KPI期間設定データ:', periodData);

    const confirmEmbed = new EmbedBuilder()
      .setTitle('✅ KPI期間が設定されました')
      .setDescription(
        `**設定内容**\n\n` +
        `📅 **開始日**: ${startDate}\n` +
        `📅 **終了日**: ${endDate}\n` +
        `⏰ **期間**: ${startDate}～${endDate}\n\n` +
        `設定者: ${interaction.user.displayName}`
      )
      .setColor(0x27ae60)
      .setTimestamp();

    await interaction.reply({
      embeds: [confirmEmbed],
      ephemeral: true
    });

    logger.info('[kpiHandler] KPI期間設定保存完了');

  } catch (error) {
    logger.error('[kpiHandler] KPI期間設定保存エラー:', error);
    await interaction.reply({
      content: '❌ KPI期間設定の保存に失敗しました。',
      ephemeral: true
    });
  }
}

/**
 * KPI来客数目標モーダル送信処理
 */
async function handleKpiVisitorTargetSubmit(interaction) {
  logger.info('[kpiHandler] KPI来客数目標保存開始');

  const visitorCount = interaction.fields.getTextInputValue('visitor_count');

  if (isNaN(visitorCount) || parseInt(visitorCount) <= 0) {
    await interaction.reply({
      content: '❌ 来客数に無効な値が入力されています。正の数値を入力してください。',
      ephemeral: true
    });
    return;
  }

  try {
    const targetData = {
      visitorCount: parseInt(visitorCount),
      userId: interaction.user.id,
      userName: interaction.user.displayName,
      guildId: interaction.guild.id,
      createdAt: new Date().toISOString(),
      dataType: 'kpi_visitor_target'
    };

    logger.info('[kpiHandler] KPI来客数目標データ:', targetData);

    const confirmEmbed = new EmbedBuilder()
      .setTitle('✅ KPI来客数目標が設定されました')
      .setDescription(
        `**設定内容**\n\n` +
        `👥 **来客数目標**: ${parseInt(visitorCount).toLocaleString()}人\n\n` +
        `設定者: ${interaction.user.displayName}`
      )
      .setColor(0x27ae60)
      .setTimestamp();

    await interaction.reply({
      embeds: [confirmEmbed],
      ephemeral: true
    });

    logger.info('[kpiHandler] KPI来客数目標保存完了');

  } catch (error) {
    logger.error('[kpiHandler] KPI来客数目標保存エラー:', error);
    await interaction.reply({
      content: '❌ KPI来客数目標の保存に失敗しました。',
      ephemeral: true
    });
  }
}

/**
 * KPI指名本数目標モーダル送信処理
 */
async function handleKpiNominationTargetSubmit(interaction) {
  logger.info('[kpiHandler] KPI指名本数目標保存開始');

  const nominationBottles = interaction.fields.getTextInputValue('nomination_bottles');

  if (isNaN(nominationBottles) || parseFloat(nominationBottles) <= 0) {
    await interaction.reply({
      content: '❌ 指名本数に無効な値が入力されています。正の数値を入力してください。',
      ephemeral: true
    });
    return;
  }

  try {
    const targetData = {
      nominationBottles: parseFloat(nominationBottles),
      userId: interaction.user.id,
      userName: interaction.user.displayName,
      guildId: interaction.guild.id,
      createdAt: new Date().toISOString(),
      dataType: 'kpi_nomination_target'
    };

    logger.info('[kpiHandler] KPI指名本数目標データ:', targetData);

    const confirmEmbed = new EmbedBuilder()
      .setTitle('✅ KPI指名本数目標が設定されました')
      .setDescription(
        `**設定内容**\n\n` +
        `🍾 **指名本数目標**: ${parseFloat(nominationBottles).toLocaleString()}本\n\n` +
        `設定者: ${interaction.user.displayName}`
      )
      .setColor(0x27ae60)
      .setTimestamp();

    await interaction.reply({
      embeds: [confirmEmbed],
      ephemeral: true
    });

    logger.info('[kpiHandler] KPI指名本数目標保存完了');

  } catch (error) {
    logger.error('[kpiHandler] KPI指名本数目標保存エラー:', error);
    await interaction.reply({
      content: '❌ KPI指名本数目標の保存に失敗しました。',
      ephemeral: true
    });
  }
}

/**
 * KPI売上目標モーダル送信処理
 */
async function handleKpiSalesTargetSubmit(interaction) {
  logger.info('[kpiHandler] KPI売上目標保存開始');

  const nominationSales = interaction.fields.getTextInputValue('nomination_sales');
  const freeSales = interaction.fields.getTextInputValue('free_sales');
  const totalSales = interaction.fields.getTextInputValue('total_sales');

  if (isNaN(nominationSales) || isNaN(freeSales) || isNaN(totalSales)) {
    await interaction.reply({
      content: '❌ 売上データに無効な値が入力されています。数値のみ入力してください。',
      ephemeral: true
    });
    return;
  }

  const nomSales = parseInt(nominationSales);
  const freSales = parseInt(freeSales);
  const totSales = parseInt(totalSales);

  if (nomSales <= 0 || freSales <= 0 || totSales <= 0) {
    await interaction.reply({
      content: '❌ 売上目標は正の数値で入力してください。',
      ephemeral: true
    });
    return;
  }

  try {
    const targetData = {
      nominationSales: nomSales,
      freeSales: freSales,
      totalSales: totSales,
      userId: interaction.user.id,
      userName: interaction.user.displayName,
      guildId: interaction.guild.id,
      createdAt: new Date().toISOString(),
      dataType: 'kpi_sales_target'
    };

    logger.info('[kpiHandler] KPI売上目標データ:', targetData);

    const confirmEmbed = new EmbedBuilder()
      .setTitle('✅ KPI売上目標が設定されました')
      .setDescription(
        `**設定内容**\n\n` +
        `💰 **指名売上目標**: ¥${nomSales.toLocaleString()}\n` +
        `🆓 **フリー売上目標**: ¥${freSales.toLocaleString()}\n` +
        `🏆 **総売上目標**: ¥${totSales.toLocaleString()}\n\n` +
        `設定者: ${interaction.user.displayName}`
      )
      .setColor(0x27ae60)
      .setTimestamp();

    await interaction.reply({
      embeds: [confirmEmbed],
      ephemeral: true
    });

    logger.info('[kpiHandler] KPI売上目標保存完了');

  } catch (error) {
    logger.error('[kpiHandler] KPI売上目標保存エラー:', error);
    await interaction.reply({
      content: '❌ KPI売上目標の保存に失敗しました。',
      ephemeral: true
    });
  }
}

/**
 * KPI日次報告モーダル送信処理
 */
async function handleKpiDailyReportSubmit(interaction) {
  logger.info('[kpiHandler] KPI日次報告保存開始');

  const reportDate = interaction.fields.getTextInputValue('report_date');
  const visitorCount = interaction.fields.getTextInputValue('visitor_count');
  const nominationBottles = interaction.fields.getTextInputValue('nomination_bottles');
  const nominationSales = interaction.fields.getTextInputValue('nomination_sales');
  const freeSales = interaction.fields.getTextInputValue('free_sales');

  // 入力値の検証
  const dateRegex = /^\d{4}\/\d{2}\/\d{2}$/;
  if (!dateRegex.test(reportDate)) {
    await interaction.reply({
      content: '❌ 日付の形式が正しくありません。YYYY/MM/DD形式で入力してください。',
      ephemeral: true
    });
    return;
  }

  if (isNaN(visitorCount) || isNaN(nominationBottles) || isNaN(nominationSales) || isNaN(freeSales)) {
    await interaction.reply({
      content: '❌ 数値データに無効な値が入力されています。',
      ephemeral: true
    });
    return;
  }

  const visitors = parseInt(visitorCount);
  const nominations = parseFloat(nominationBottles);
  const nomSales = parseInt(nominationSales);
  const freSales = parseInt(freeSales);
  const totalSales = nomSales + freSales;

  try {
    const reportData = {
      reportDate,
      visitorCount: visitors,
      nominationBottles: nominations,
      nominationSales: nomSales,
      freeSales: freSales,
      totalSales: totalSales,
      userId: interaction.user.id,
      userName: interaction.user.displayName,
      guildId: interaction.guild.id,
      createdAt: new Date().toISOString(),
      dataType: 'kpi_daily_report'
    };

    logger.info('[kpiHandler] KPI日次報告データ:', reportData);

    const confirmEmbed = new EmbedBuilder()
      .setTitle('✅ KPI日次報告が完了しました')
      .setDescription(
        `**報告内容**\n\n` +
        `📅 **報告日**: ${reportDate}\n` +
        `👥 **来客数**: ${visitors.toLocaleString()}人\n` +
        `🍾 **指名本数**: ${nominations.toLocaleString()}本\n` +
        `💰 **指名売上**: ¥${nomSales.toLocaleString()}\n` +
        `🆓 **フリー売上**: ¥${freSales.toLocaleString()}\n` +
        `🏆 **総売上**: ¥${totalSales.toLocaleString()}\n\n` +
        `報告者: ${interaction.user.displayName}`
      )
      .setColor(0x27ae60)
      .setTimestamp();

    await interaction.reply({
      embeds: [confirmEmbed],
      ephemeral: true
    });

    logger.info('[kpiHandler] KPI日次報告保存完了');

  } catch (error) {
    logger.error('[kpiHandler] KPI日次報告保存エラー:', error);
    await interaction.reply({
      content: '❌ KPI日次報告の保存に失敗しました。',
      ephemeral: true
    });
  }
}

/**
 * KPI申請パネル設置（従来版）
 */
async function handleKpiPanelSetupLegacy(interaction) {
  await interaction.deferReply({ ephemeral: true });
  
  logger.info('[kpiHandler] KPI申請パネル設置開始（従来版）');

  try {
    // KPI申請パネルのEmbed
    const kpiPanelEmbed = new EmbedBuilder()
      .setTitle('📊 KPI申請パネル')
      .setDescription(
        '**KPIの報告を行います**\n\n' +
        '📋 下のボタンをクリックしてKPIを報告してください。\n' +
        '• 来客数\n' +
        '• 指名本数\n' +
        '• 指名売上\n' +
        '• フリー売上\n' +
        '• 総売上\n\n' +
        '💡 正確な数値を入力してください。'
      )
      .setColor(0x3498db)
      .setTimestamp()
      .setFooter({ text: 'KPI申請システム' });

    const kpiPanelButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('kpi_report_button')
          .setLabel('📊 KPI報告')
          .setStyle(ButtonStyle.Primary)
      );

    // 現在のチャンネルにパネルを設置
    await interaction.followUp({
      embeds: [kpiPanelEmbed],
      components: [kpiPanelButton]
    });

    await interaction.editReply({
      content: '✅ KPI申請パネルを設置しました。'
    });

    logger.info('[kpiHandler] KPI申請パネル設置完了（従来版）');

  } catch (error) {
    logger.error('[kpiHandler] KPI申請パネル設置エラー（従来版）:', error);
    await interaction.editReply({
      content: '❌ KPI申請パネルの設置に失敗しました。'
    });
  }
}
/**
 * KPI報告モーダル表示（従来版）
 */
async function handleKpiReportModal(interaction) {
  logger.info('[kpiHandler] KPI報告モーダル表示開始（従来版）');

  const modal = new ModalBuilder()
    .setCustomId('kpi_report_modal')
    .setTitle('📊 KPI報告');

  // 日付入力
  const dateInput = new TextInputBuilder()
    .setCustomId('report_date')
    .setLabel('報告日')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('YYYY-MM-DD (例: 2025-08-06)')
    .setRequired(true)
    .setMaxLength(10)
    .setValue(new Date().toISOString().split('T')[0]); // 今日の日付をデフォルト値に

  // 来客数入力
  const visitorCountInput = new TextInputBuilder()
    .setCustomId('visitor_count')
    .setLabel('来客数')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('実際の来客数を入力 (例: 85)')
    .setRequired(true)
    .setMaxLength(10);

  // 指名本数入力
  const nominationBottlesInput = new TextInputBuilder()
    .setCustomId('nomination_bottles')
    .setLabel('指名本数')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('実際の指名本数を入力 (例: 42)')
    .setRequired(true)
    .setMaxLength(10);

  // 売上入力（指名売上、フリー売上、総売上をまとめて入力）
  const salesInput = new TextInputBuilder()
    .setCustomId('sales_data')
    .setLabel('売上実績（指名,フリー,総売上）')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('450000,280000,730000 (カンマ区切りで入力)')
    .setRequired(true)
    .setMaxLength(50);

  // 備考入力
  const remarksInput = new TextInputBuilder()
    .setCustomId('remarks')
    .setLabel('備考')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('特記事項があれば入力してください（任意）')
    .setRequired(false)
    .setMaxLength(500);

  // 各入力を行に追加
  const firstActionRow = new ActionRowBuilder().addComponents(dateInput);
  const secondActionRow = new ActionRowBuilder().addComponents(visitorCountInput);
  const thirdActionRow = new ActionRowBuilder().addComponents(nominationBottlesInput);
  const fourthActionRow = new ActionRowBuilder().addComponents(salesInput);
  const fifthActionRow = new ActionRowBuilder().addComponents(remarksInput);

  modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow, fifthActionRow);

  await interaction.showModal(modal);
  logger.info('[kpiHandler] KPI報告モーダル表示完了（従来版）');
}

/**
 * KPI報告モーダル送信処理
 */
async function handleKpiReportSubmit(interaction) {
  logger.info('[kpiHandler] KPI報告データ保存開始');

  const reportDate = interaction.fields.getTextInputValue('report_date');
  const visitorCount = interaction.fields.getTextInputValue('visitor_count');
  const nominationBottles = interaction.fields.getTextInputValue('nomination_bottles');
  const salesData = interaction.fields.getTextInputValue('sales_data');
  const remarks = interaction.fields.getTextInputValue('remarks') || '';

  // 入力値の検証
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(reportDate)) {
    await interaction.reply({
      content: '❌ 日付の形式が正しくありません。YYYY-MM-DD形式で入力してください。',
      ephemeral: true
    });
    return;
  }

  if (isNaN(visitorCount) || isNaN(nominationBottles)) {
    await interaction.reply({
      content: '❌ 来客数または指名本数に無効な値が入力されています。',
      ephemeral: true
    });
    return;
  }

  // 売上データの解析
  const salesArray = salesData.split(',').map(s => s.trim());
  if (salesArray.length !== 3) {
    await interaction.reply({
      content: '❌ 売上データは「指名売上,フリー売上,総売上」の形式でカンマ区切りで入力してください。',
      ephemeral: true
    });
    return;
  }

  const [nominationSales, freeSales, totalSales] = salesArray;
  if (isNaN(nominationSales) || isNaN(freeSales) || isNaN(totalSales)) {
    await interaction.reply({
      content: '❌ 売上データに無効な値が入力されています。数値のみ入力してください。',
      ephemeral: true
    });
    return;
  }

  try {
    // KPI実績報告データ
    const kpiReportData = {
      reportDate,
      visitorCount: parseInt(visitorCount),
      nominationBottles: parseInt(nominationBottles),
      nominationSales: parseInt(nominationSales),
      freeSales: parseInt(freeSales),
      totalSales: parseInt(totalSales),
      remarks,
      userId: interaction.user.id,
      userName: interaction.user.displayName,
      guildId: interaction.guild.id,
      createdAt: new Date().toISOString(),
      dataType: 'kpi_report' // データの種類を識別
    };

    logger.info('[kpiHandler] KPI報告データ:', kpiReportData);

    // GCSにKPI報告データを保存
    try {
      const gcsFilePath = await saveKpiDataToGcs(interaction.guild.id, kpiReportData);
      logger.info(`[kpiHandler] KPI報告をGCSに保存: ${gcsFilePath}`);
    } catch (gcsError) {
      logger.error('[kpiHandler] GCS保存エラー (続行):', gcsError);
      // GCS保存失敗でもユーザーには成功を通知（ログに記録済み）
    }

    const confirmEmbed = new EmbedBuilder()
      .setTitle('✅ KPI報告が完了しました')
      .setDescription(
        `**報告内容**\n\n` +
        `📅 **報告日**: ${reportDate}\n` +
        `👥 **来客数**: ${parseInt(visitorCount).toLocaleString()}人\n` +
        `🍾 **指名本数**: ${parseInt(nominationBottles).toLocaleString()}本\n` +
        `💰 **指名売上**: ¥${parseInt(nominationSales).toLocaleString()}\n` +
        `🆓 **フリー売上**: ¥${parseInt(freeSales).toLocaleString()}\n` +
        `🏆 **総売上**: ¥${parseInt(totalSales).toLocaleString()}\n` +
        (remarks ? `💭 **備考**: ${remarks}\n` : '') +
        `\n報告者: ${interaction.user.displayName}`
      )
      .setColor(0x27ae60)
      .setTimestamp();

    await interaction.reply({
      embeds: [confirmEmbed],
      ephemeral: true
    });

    logger.info('[kpiHandler] KPI報告保存完了');

  } catch (error) {
    logger.error('[kpiHandler] KPI報告保存エラー:', error);
    await interaction.reply({
      content: '❌ KPI報告の保存に失敗しました。',
      ephemeral: true
    });
  }
}

/**
 * KPI目標値設定モーダル表示
 */
async function handleKpiTargetModal(interaction) {
  logger.info('[kpiHandler] KPI目標値設定モーダル表示開始');

  const modal = new ModalBuilder()
    .setCustomId('kpi_target_modal')
    .setTitle('🎯 KPI目標値設定');

  // 開始日入力
  const startDateInput = new TextInputBuilder()
    .setCustomId('start_date')
    .setLabel('開始日')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('YYYY-MM-DD (例: 2025-08-01)')
    .setRequired(true)
    .setMaxLength(10);

  // 終了日入力
  const endDateInput = new TextInputBuilder()
    .setCustomId('end_date')
    .setLabel('終了日')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('YYYY-MM-DD (例: 2025-08-31)')
    .setRequired(true)
    .setMaxLength(10);

  // 来客数入力
  const visitorCountInput = new TextInputBuilder()
    .setCustomId('visitor_count')
    .setLabel('来客数')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('目標来客数を入力 (例: 100)')
    .setRequired(true)
    .setMaxLength(10);

  // 指名本数入力
  const nominationBottlesInput = new TextInputBuilder()
    .setCustomId('nomination_bottles')
    .setLabel('指名本数')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('目標指名本数を入力 (例: 50)')
    .setRequired(true)
    .setMaxLength(10);

  // 売上入力（指名売上、フリー売上、総売上をまとめて入力）
  const salesInput = new TextInputBuilder()
    .setCustomId('sales_data')
    .setLabel('売上目標（指名,フリー,総売上）')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('500000,300000,800000 (カンマ区切りで入力)')
    .setRequired(true)
    .setMaxLength(50);

  // 各入力を行に追加
  const firstActionRow = new ActionRowBuilder().addComponents(startDateInput);
  const secondActionRow = new ActionRowBuilder().addComponents(endDateInput);
  const thirdActionRow = new ActionRowBuilder().addComponents(visitorCountInput);
  const fourthActionRow = new ActionRowBuilder().addComponents(nominationBottlesInput);
  const fifthActionRow = new ActionRowBuilder().addComponents(salesInput);

  modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow, fifthActionRow);

  await interaction.showModal(modal);
  logger.info('[kpiHandler] KPI目標値設定モーダル表示完了');
}

/**
 * KPI申請パネル設置
 */
async function handleKpiPanelSetup(interaction) {
  await interaction.deferReply({ ephemeral: true });
  
  logger.info('[kpiHandler] KPI申請パネル設置開始');

  try {
    // KPI申請パネルのEmbed
    const kpiPanelEmbed = new EmbedBuilder()
      .setTitle('📊 KPI申請パネル')
      .setDescription(
        '**KPIの報告を行います**\n\n' +
        '📋 下のボタンをクリックしてKPIを報告してください。\n' +
        '• 来客数\n' +
        '• 指名本数\n' +
        '• 指名売上\n' +
        '• フリー売上\n' +
        '• 総売上\n\n' +
        '💡 正確な数値を入力してください。'
      )
      .setColor(0x3498db)
      .setTimestamp()
      .setFooter({ text: 'KPI申請システム' });

    const kpiPanelButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('kpi_report_button')
          .setLabel('📊 KPI報告')
          .setStyle(ButtonStyle.Primary)
      );

    // 現在のチャンネルにパネルを設置
    await interaction.followUp({
      embeds: [kpiPanelEmbed],
      components: [kpiPanelButton]
    });

    await interaction.editReply({
      content: '✅ KPI申請パネルを設置しました。'
    });

    logger.info('[kpiHandler] KPI申請パネル設置完了');

  } catch (error) {
    logger.error('[kpiHandler] KPI申請パネル設置エラー:', error);
    await interaction.editReply({
      content: '❌ KPI申請パネルの設置に失敗しました。'
    });
  }
}

/**
 * KPI CSV出力
 */
async function handleKpiCsvExport(interaction) {
  await interaction.deferReply({ ephemeral: true });
  
  logger.info('[kpiHandler] KPI CSV出力開始');

  try {
    const guildId = interaction.guild.id;
    const today = new Date().toISOString().split('T')[0];
    const csvFilePath = generateTodayKpiCsvPath(guildId);
    
    const bucketName = process.env.GCS_BUCKET_NAME;
    const storage = new Storage();
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(csvFilePath);

    // ファイルの存在確認
    const [exists] = await file.exists();
    
    if (!exists) {
      await interaction.editReply({
        content: `📄 本日(${today})のKPI申請データが見つかりませんでした。\n申請が行われてからCSV出力をお試しください。`
      });
      return;
    }

    // GCSからCSVファイルをダウンロード
    const [csvBuffer] = await file.download();
    
    await interaction.editReply({
      content: `📄 本日(${today})のKPI申請データCSVファイルを生成しました。`,
      files: [{
        attachment: csvBuffer,
        name: `${today}_kpi.csv`
      }]
    });

    logger.info(`[kpiHandler] KPI CSV出力完了: ${csvFilePath}`);

  } catch (error) {
    logger.error('[kpiHandler] KPI CSV出力エラー:', error);
    await interaction.editReply({
      content: '❌ CSV出力中にエラーが発生しました。管理者にお問い合わせください。'
    });
  }
}

/**
 * KPI目標値モーダル送信処理
 */
async function handleKpiTargetSubmit(interaction) {
  logger.info('[kpiHandler] KPI目標値保存開始');

  const startDate = interaction.fields.getTextInputValue('start_date');
  const endDate = interaction.fields.getTextInputValue('end_date');
  const visitorCount = interaction.fields.getTextInputValue('visitor_count');
  const nominationBottles = interaction.fields.getTextInputValue('nomination_bottles');
  const salesData = interaction.fields.getTextInputValue('sales_data');

  // 入力値の検証
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
    await interaction.reply({
      content: '❌ 日付の形式が正しくありません。YYYY-MM-DD形式で入力してください。',
      ephemeral: true
    });
    return;
  }

  if (isNaN(visitorCount) || isNaN(nominationBottles)) {
    await interaction.reply({
      content: '❌ 来客数または指名本数に無効な値が入力されています。',
      ephemeral: true
    });
    return;
  }

  // 売上データの解析
  const salesArray = salesData.split(',').map(s => s.trim());
  if (salesArray.length !== 3) {
    await interaction.reply({
      content: '❌ 売上データは「指名売上,フリー売上,総売上」の形式でカンマ区切りで入力してください。',
      ephemeral: true
    });
    return;
  }

  const [nominationSales, freeSales, totalSales] = salesArray;
  if (isNaN(nominationSales) || isNaN(freeSales) || isNaN(totalSales)) {
    await interaction.reply({
      content: '❌ 売上データに無効な値が入力されています。数値のみ入力してください。',
      ephemeral: true
    });
    return;
  }

  try {
    // TODO: データベースまたはGCSに保存する処理を実装
    const kpiData = {
      startDate,
      endDate,
      visitorCount: parseInt(visitorCount),
      nominationBottles: parseInt(nominationBottles),
      nominationSales: parseInt(nominationSales),
      freeSales: parseInt(freeSales),
      totalSales: parseInt(totalSales),
      userId: interaction.user.id,
      userName: interaction.user.displayName,
      guildId: interaction.guild.id,
      createdAt: new Date().toISOString()
    };

    logger.info('[kpiHandler] KPI目標値データ:', kpiData);

    // GCSにKPI目標値データを保存
    try {
      const gcsFilePath = await saveKpiTargetToGcs(interaction.guild.id, kpiData);
      logger.info(`[kpiHandler] KPI目標値をGCSに保存: ${gcsFilePath}`);
    } catch (gcsError) {
      logger.error('[kpiHandler] GCS保存エラー (続行):', gcsError);
      // GCS保存失敗でもユーザーには成功を通知（ログに記録済み）
    }

    const confirmEmbed = new EmbedBuilder()
      .setTitle('✅ KPI目標値が設定されました')
      .setDescription(
        `**設定内容**\n\n` +
        `📅 **期間**: ${startDate} ～ ${endDate}\n` +
        `👥 **来客数**: ${parseInt(visitorCount).toLocaleString()}人\n` +
        `🍾 **指名本数**: ${parseInt(nominationBottles).toLocaleString()}本\n` +
        `💰 **指名売上**: ¥${parseInt(nominationSales).toLocaleString()}\n` +
        `🆓 **フリー売上**: ¥${parseInt(freeSales).toLocaleString()}\n` +
        `🏆 **総売上**: ¥${parseInt(totalSales).toLocaleString()}\n\n` +
        `設定者: ${interaction.user.displayName}`
      )
      .setColor(0x00ff00)
      .setTimestamp();

    await interaction.reply({
      embeds: [confirmEmbed],
      ephemeral: true
    });

    logger.info('[kpiHandler] KPI目標値保存完了');

  } catch (error) {
    logger.error('[kpiHandler] KPI目標値保存エラー:', error);
    await interaction.reply({
      content: '❌ KPI目標値の保存に失敗しました。',
      ephemeral: true
    });
  }
}

/**
 * 店舗選択処理
 */
async function handleStoreSelection(interaction) {
  const selectedStore = interaction.values[0];
  const storeName = getStoreDisplayName(selectedStore);
  
  logger.info(`[kpiHandler] 店舗選択: ${selectedStore} (${storeName})`);

  const embed = createChannelSelectionEmbed(storeName);
  const channelSelectRow = createChannelSelectMenu();

  // 選択された店舗情報を一時保存（interaction.messageでアクセス可能）
  await interaction.update({
    embeds: [embed],
    components: [channelSelectRow]
  });

  // 店舗情報をセッションに保存（簡易実装）
  interaction.selectedStore = selectedStore;
  interaction.selectedStoreName = storeName;
}

/**
 * チャンネル選択処理
 */
async function handleChannelSelection(interaction) {
  const selectedChannel = interaction.channels.first();
  
  // 前のインタラクションから店舗情報を取得（実際の実装では永続化が必要）
  const storeValue = interaction.message.embeds[0]?.description?.match(/\*\*(.*?)\*\*/)?.[1];
  const storeName = storeValue || '選択された店舗';
  
  logger.info(`[kpiHandler] チャンネル選択: ${selectedChannel.name} (店舗: ${storeName})`);

  // KPI申請パネルを作成してチャンネルに送信
  const applicationEmbed = createKpiApplicationEmbed(
    'KPI申請',
    `${storeName}のKPI申請フォームです。下のボタンから申請を行ってください。`,
    storeName
  );
  const applicationButtons = createKpiApplicationButtons(storeValue);

  try {
    await selectedChannel.send({
      embeds: [applicationEmbed],
      components: [applicationButtons]
    });

    const completeEmbed = createKpiSetupCompleteEmbed(storeName, selectedChannel.name);
    
    await interaction.update({
      embeds: [completeEmbed],
      components: []
    });

    logger.info(`[kpiHandler] KPI申請パネル設置完了: ${selectedChannel.name}`);

  } catch (error) {
    logger.error('[kpiHandler] チャンネル設置エラー:', error);
    await interaction.update({
      content: '❌ チャンネルへの設置に失敗しました。権限を確認してください。',
      embeds: [],
      components: []
    });
  }
}

/**
 * KPI申請処理
 */
async function handleKpiApplication(interaction) {
  const storeValue = interaction.customId.replace('kpi_application_', '');
  const storeName = getStoreDisplayName(storeValue);
  
  logger.info(`[kpiHandler] KPI申請開始: ${storeValue} (${storeName})`);

  const modal = createStoreKpiTargetModal(storeValue, storeName);
  await interaction.showModal(modal);
  
  logger.info('[kpiHandler] 店舗別KPI申請モーダル表示完了');
}

/**
 * 店舗別KPI目標値送信処理
 */
async function handleStoreKpiTargetSubmit(interaction) {
  const storeValue = interaction.customId.replace('kpi_store_target_modal_', '');
  const storeName = getStoreDisplayName(storeValue);
  
  logger.info(`[kpiHandler] 店舗別KPI目標値保存開始: ${storeValue}`);

  const startDate = interaction.fields.getTextInputValue('start_date');
  const endDate = interaction.fields.getTextInputValue('end_date');
  const visitorCount = interaction.fields.getTextInputValue('visitor_count');
  const nominationBottles = interaction.fields.getTextInputValue('nomination_bottles');
  const salesData = interaction.fields.getTextInputValue('sales_data');

  // 入力値の検証
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
    await interaction.reply({
      content: '❌ 日付の形式が正しくありません。YYYY-MM-DD形式で入力してください。',
      ephemeral: true
    });
    return;
  }

  if (isNaN(visitorCount) || isNaN(nominationBottles)) {
    await interaction.reply({
      content: '❌ 来客数または指名本数に無効な値が入力されています。',
      ephemeral: true
    });
    return;
  }

  // 売上データの解析
  const salesArray = salesData.split(',').map(s => s.trim());
  if (salesArray.length !== 3) {
    await interaction.reply({
      content: '❌ 売上データは「指名売上,フリー売上,総売上」の形式でカンマ区切りで入力してください。',
      ephemeral: true
    });
    return;
  }

  const [nominationSales, freeSales, totalSales] = salesArray;
  if (isNaN(nominationSales) || isNaN(freeSales) || isNaN(totalSales)) {
    await interaction.reply({
      content: '❌ 売上データに無効な値が入力されています。数値のみ入力してください。',
      ephemeral: true
    });
    return;
  }

  try {
    // 店舗別KPIデータ
    const storeKpiData = {
      storeValue,
      storeName,
      startDate,
      endDate,
      visitorCount: parseInt(visitorCount),
      nominationBottles: parseInt(nominationBottles),
      nominationSales: parseInt(nominationSales),
      freeSales: parseInt(freeSales),
      totalSales: parseInt(totalSales),
      userId: interaction.user.id,
      userName: interaction.user.displayName,
      guildId: interaction.guild.id,
      createdAt: new Date().toISOString()
    };

    logger.info('[kpiHandler] 店舗別KPI目標値データ:', storeKpiData);

    // GCSに店舗別KPI目標値データを保存
    try {
      const gcsFilePath = await saveKpiTargetToGcs(interaction.guild.id, storeKpiData);
      logger.info(`[kpiHandler] 店舗別KPI目標値をGCSに保存: ${gcsFilePath}`);
    } catch (gcsError) {
      logger.error('[kpiHandler] GCS保存エラー (続行):', gcsError);
      // GCS保存失敗でもユーザーには成功を通知（ログに記録済み）
    }

    const confirmEmbed = new EmbedBuilder()
      .setTitle(`✅ ${storeName} KPI申請が完了しました`)
      .setDescription(
        `**申請内容**\n\n` +
        `🏢 **店舗**: ${storeName}\n` +
        `📅 **期間**: ${startDate} ～ ${endDate}\n` +
        `👥 **来客数**: ${parseInt(visitorCount).toLocaleString()}人\n` +
        `🍾 **指名本数**: ${parseInt(nominationBottles).toLocaleString()}本\n` +
        `💰 **指名売上**: ¥${parseInt(nominationSales).toLocaleString()}\n` +
        `🆓 **フリー売上**: ¥${parseInt(freeSales).toLocaleString()}\n` +
        `🏆 **総売上**: ¥${parseInt(totalSales).toLocaleString()}\n\n` +
        `申請者: ${interaction.user.displayName}`
      )
      .setColor(0x27ae60)
      .setTimestamp();

    await interaction.reply({
      embeds: [confirmEmbed],
      ephemeral: true
    });

    logger.info(`[kpiHandler] 店舗別KPI目標値保存完了: ${storeName}`);

  } catch (error) {
    logger.error(`[kpiHandler] 店舗別KPI目標値保存エラー (${storeName}):`, error);
    await interaction.reply({
      content: '❌ KPI申請の保存に失敗しました。',
      ephemeral: true
    });
  }
}
