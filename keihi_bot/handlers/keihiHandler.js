// keihi_bot/handlers/keihiHandler.js - 経費申請ハンドラー（高度版）

const {
  EmbedBuilder,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  PermissionFlagsBits
} = require('discord.js');
const logger = require('../../common/logger');
const { updateState, readState } = require('../utils/keihiStateManager');
const { saveExpenseToCsv, createConsolidatedCsv, updateExpenseStatus, getAvailableDates, getAvailableMonths, getAvailableQuarters } = require('../utils/csvManager');
const {
  SHINSEI_BUTTON_ID_PREFIX,
  SHINSEI_MODAL_ID,
  DATE_INPUT_ID,
  ITEM_INPUT_ID,
  AMOUNT_INPUT_ID,
  PURPOSE_INPUT_ID,
  DESCRIPTION_INPUT_ID,
  APPROVE_BUTTON_PREFIX,
  REJECT_BUTTON_PREFIX,
  EDIT_BUTTON_PREFIX,
  CSV_DAILY_BUTTON,
  CSV_MONTHLY_BUTTON,
  CSV_QUARTERLY_BUTTON,
  CSV_DATE_SELECT,
  CSV_MONTH_SELECT,
  CSV_QUARTER_SELECT,
  CONFIG_ROLE_SELECT,
  CONFIG_VISIBLE_SELECT,
  CONFIG_CHANNEL_SELECT,
  CONFIRM_PREFIX,
  CANCEL_PREFIX
} = require('../constants/customIds');
const MESSAGES = require('../constants/messages');

module.exports = {
  async execute(interaction) {
    const { customId } = interaction;
    logger.info(`[keihiHandler] 処理開始: ${customId}`);
    
    try {
      // === 経費申請メイン機能 ===
      if (customId.startsWith(SHINSEI_BUTTON_ID_PREFIX)) {
        return await handleExpenseApplication(interaction);
      }

      // === モーダル送信処理 ===
      if (interaction.isModalSubmit() && customId === SHINSEI_MODAL_ID) {
        return await handleModalSubmit(interaction);
      }

      // === 承認・拒否・修正処理 ===
      if (customId.startsWith(APPROVE_BUTTON_PREFIX) || 
          customId.startsWith(REJECT_BUTTON_PREFIX) || 
          customId.startsWith(EDIT_BUTTON_PREFIX)) {
        return await handleApprovalActions(interaction);
      }

      // === 確認・キャンセル処理 ===
      if (customId.startsWith(CONFIRM_PREFIX) || customId.startsWith(CANCEL_PREFIX)) {
        return await handleConfirmCancel(interaction);
      }

      // === CSV関連処理 ===
      if ([CSV_DAILY_BUTTON, CSV_MONTHLY_BUTTON, CSV_QUARTERLY_BUTTON].includes(customId)) {
        return await handleCsvButtons(interaction);
      }

      // === CSV選択メニュー ===
      if ([CSV_DATE_SELECT, CSV_MONTH_SELECT, CSV_QUARTER_SELECT].includes(customId)) {
        return await handleCsvSelect(interaction);
      }

      // === 設定関連処理 ===
      if ([CONFIG_ROLE_SELECT, CONFIG_VISIBLE_SELECT, CONFIG_CHANNEL_SELECT].includes(customId)) {
        return await handleConfigSelect(interaction);
      }

      // === 経費申請設定関連 ===
      if (customId.startsWith('keihi_category_') || 
          customId.startsWith('keihi_form_') || 
          customId.startsWith('keihi_approval_') ||
          customId.startsWith('keihi_notification_') ||
          customId.startsWith('keihi_reset_')) {
        return await handleConfigSettings(interaction);
      }

      // === ヘルプ関連 ===
      if (customId.startsWith('keihi_help_')) {
        return await handleHelp(interaction);
      }

      // === 履歴関連 ===
      if (customId.startsWith('keihi_history_')) {
        return await handleHistory(interaction);
      }

      // 基本的なレスポンス（未実装機能）
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '💰 この機能は現在開発中です。',
          flags: MessageFlags.Ephemeral
        });
      }
      
      return true;
      
    } catch (error) {
      logger.error('[keihiHandler] エラー:', error);
      
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: MESSAGES.GENERAL.ERROR,
            flags: MessageFlags.Ephemeral
          });
        }
      } catch (replyError) {
        logger.error('[keihiHandler] レスポンスエラー:', replyError);
      }
      
      return true;
    }
  }
};

/**
 * 経費申請メイン機能処理
 */
async function handleExpenseApplication(interaction) {
  const modal = new ModalBuilder()
    .setCustomId(SHINSEI_MODAL_ID)
    .setTitle('💰 経費申請フォーム');

  // 共通の入力フィールド
  const dateInput = new TextInputBuilder()
    .setCustomId(DATE_INPUT_ID)
    .setLabel('申請日（YYYY-MM-DD）')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('2025-08-06')
    .setRequired(true)
    .setValue(new Date().toLocaleDateString('sv-SE')); // ISO形式

  const categoryInput = new TextInputBuilder()
    .setCustomId(ITEM_INPUT_ID)
    .setLabel('経費カテゴリ')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('交通費')
    .setRequired(true);

  const amountInput = new TextInputBuilder()
    .setCustomId(AMOUNT_INPUT_ID)
    .setLabel('金額（円）')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('1000')
    .setRequired(true);

  const purposeInput = new TextInputBuilder()
    .setCustomId(PURPOSE_INPUT_ID)
    .setLabel('用途・内容')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('取引先との打ち合わせのための交通費')
    .setRequired(true);

  const notesInput = new TextInputBuilder()
    .setCustomId(DESCRIPTION_INPUT_ID)
    .setLabel('備考・添付書類について')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('レシート添付あり、緊急申請')
    .setRequired(false);

  // 各行に入力フィールドを追加
  modal.addComponents(
    new ActionRowBuilder().addComponents(dateInput),
    new ActionRowBuilder().addComponents(categoryInput),
    new ActionRowBuilder().addComponents(amountInput),
    new ActionRowBuilder().addComponents(purposeInput),
    new ActionRowBuilder().addComponents(notesInput)
  );

  await interaction.showModal(modal);
  return true;
}

/**
 * モーダル送信処理
 */
async function handleModalSubmit(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  
  try {
    // モーダルからデータを取得
    const expenseDate = interaction.fields.getTextInputValue(DATE_INPUT_ID);
    const category = interaction.fields.getTextInputValue(ITEM_INPUT_ID);
    const amount = interaction.fields.getTextInputValue(AMOUNT_INPUT_ID);
    const purpose = interaction.fields.getTextInputValue(PURPOSE_INPUT_ID);
    const notes = interaction.fields.getTextInputValue(DESCRIPTION_INPUT_ID) || 'なし';
    
    // データ検証
    const validation = validateExpenseData({ expenseDate, category, amount, purpose });
    if (!validation.valid) {
      await interaction.editReply({ content: validation.error });
      return true;
    }

    // 申請ID生成
    const applicationId = `EXP${Date.now().toString().slice(-8)}`;
    
    // 申請データ構築
    const expenseData = {
      applicationId,
      userId: interaction.user.id,
      userName: interaction.user.displayName,
      date: expenseDate,
      category,
      amount: parseInt(amount),
      purpose,
      notes,
      status: '申請中',
      submittedAt: new Date().toISOString()
    };

    // CSV保存
    try {
      await saveExpenseToCsv(interaction.guildId, expenseData);
      logger.info(`[申請受付] CSV保存完了: ${applicationId}`);
    } catch (csvError) {
      logger.error('[申請受付] CSV保存エラー:', csvError);
    }

    // 状態保存
    await updateState(interaction.guildId, state => {
      state.expenses.push(expenseData);
      return state;
    });

    // 申請通知をログチャンネルに送信
    await sendApplicationNotification(interaction, expenseData);

    // 確認画面のEmbed
    const confirmEmbed = new EmbedBuilder()
      .setTitle('✅ 経費申請受付完了')
      .setDescription(`申請ID: \`${applicationId}\``)
      .setColor(0x00ff00)
      .addFields(
        { name: '📅 申請日', value: expenseDate, inline: true },
        { name: '🏷️ カテゴリ', value: category, inline: true },
        { name: '💰 金額', value: `¥${parseInt(amount).toLocaleString()}`, inline: true },
        { name: '📝 用途', value: purpose, inline: false },
        { name: '📋 備考', value: notes, inline: false },
        { name: '👤 申請者', value: interaction.user.displayName, inline: true },
        { name: '⏱️ 申請日時', value: new Date().toLocaleString('ja-JP'), inline: true },
        { name: '📊 状態', value: '承認待ち', inline: true }
      )
      .setTimestamp();

    await interaction.editReply({
      content: MESSAGES.APPLICATION.SUBMIT_SUCCESS,
      embeds: [confirmEmbed]
    });
    
    logger.info(`[申請受付] 新規申請完了 - ID: ${applicationId}, User: ${interaction.user.tag}, Amount: ¥${amount}`);
    
  } catch (error) {
    logger.error('[申請受付] モーダル処理エラー:', error);
    await interaction.editReply({ content: MESSAGES.APPLICATION.SUBMIT_ERROR });
  }
  
  return true;
}

/**
 * 承認・拒否・修正処理
 */
async function handleApprovalActions(interaction) {
  // 権限チェック
  const state = await readState(interaction.guildId);
  const hasPermission = state.approverRoles.some(roleId => 
    interaction.member.roles.cache.has(roleId)
  ) || interaction.member.permissions.has(PermissionFlagsBits.Administrator);

  if (!hasPermission) {
    await interaction.reply({
      content: MESSAGES.APPROVAL.PERMISSION_DENIED,
      flags: MessageFlags.Ephemeral
    });
    return true;
  }

  const applicationId = interaction.customId.split('_')[2];
  const action = interaction.customId.startsWith(APPROVE_BUTTON_PREFIX) ? 'approved' : 
                 interaction.customId.startsWith(REJECT_BUTTON_PREFIX) ? 'rejected' : 'edit_requested';

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    // 状態更新
    await updateState(interaction.guildId, state => {
      const expense = state.expenses.find(e => e.applicationId === applicationId);
      if (expense) {
        expense.status = action === 'approved' ? '承認済み' : action === 'rejected' ? '却下' : '修正依頼';
        expense.processedAt = new Date().toISOString();
        expense.processedBy = interaction.user.displayName;
      }
      return state;
    });

    // CSV更新
    try {
      await updateExpenseStatus(interaction.guildId, applicationId, 
        action === 'approved' ? '承認済み' : action === 'rejected' ? '却下' : '修正依頼',
        interaction.user.displayName
      );
    } catch (csvError) {
      logger.error('[承認処理] CSV更新エラー:', csvError);
    }

    const statusMessage = action === 'approved' ? MESSAGES.APPROVAL.APPROVED :
                         action === 'rejected' ? MESSAGES.APPROVAL.REJECTED :
                         MESSAGES.APPROVAL.EDIT_REQUESTED;

    await interaction.editReply({ content: statusMessage });
    
    logger.info(`[承認処理] ${action} - 申請ID: ${applicationId}, 処理者: ${interaction.user.tag}`);

  } catch (error) {
    logger.error('[承認処理] エラー:', error);
    await interaction.editReply({ content: MESSAGES.GENERAL.ERROR });
  }

  return true;
}

/**
 * CSV出力ボタン処理
 */
async function handleCsvButtons(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    let availableOptions = [];
    let selectCustomId = '';
    let placeholder = '';

    if (interaction.customId === CSV_DAILY_BUTTON) {
      availableOptions = await getAvailableDates(interaction.guildId);
      selectCustomId = CSV_DATE_SELECT;
      placeholder = '📅 出力する日付を選択してください';
    } else if (interaction.customId === CSV_MONTHLY_BUTTON) {
      availableOptions = await getAvailableMonths(interaction.guildId);
      selectCustomId = CSV_MONTH_SELECT;
      placeholder = '📆 出力する月を選択してください';
    } else if (interaction.customId === CSV_QUARTERLY_BUTTON) {
      availableOptions = await getAvailableQuarters(interaction.guildId);
      selectCustomId = CSV_QUARTER_SELECT;
      placeholder = '📊 出力する四半期を選択してください';
    }

    if (availableOptions.length === 0) {
      await interaction.editReply({ content: MESSAGES.CSV.NO_DATA });
      return true;
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(selectCustomId)
      .setPlaceholder(placeholder)
      .setMinValues(1)
      .setMaxValues(Math.min(availableOptions.length, 25))
      .addOptions(availableOptions.slice(0, 25).map(option => ({
        label: option,
        value: option,
        emoji: interaction.customId === CSV_DAILY_BUTTON ? '📅' : 
               interaction.customId === CSV_MONTHLY_BUTTON ? '📆' : '📊'
      })));

    await interaction.editReply({
      content: `利用可能な期間が見つかりました（${availableOptions.length}件）`,
      components: [new ActionRowBuilder().addComponents(selectMenu)]
    });

  } catch (error) {
    logger.error('[CSV出力] 期間選択エラー:', error);
    await interaction.editReply({ content: MESSAGES.CSV.EXPORT_ERROR });
  }

  return true;
}

/**
 * CSV選択メニュー処理
 */
async function handleCsvSelect(interaction) {
  await interaction.deferUpdate();

  try {
    const selectedValues = interaction.values;
    const period = interaction.customId === CSV_DATE_SELECT ? 'daily' :
                   interaction.customId === CSV_MONTH_SELECT ? 'monthly' : 'quarterly';

    // CSV生成処理
    const result = await createConsolidatedCsv(interaction.guildId, period, selectedValues);

    const embed = new EmbedBuilder()
      .setTitle('✅ CSV出力完了')
      .setDescription(`選択された期間のCSVファイルを生成しました`)
      .addFields(
        { name: '📁 ファイル名', value: result.fileName, inline: false },
        { name: '📊 レコード数', value: `${result.recordCount}件`, inline: true },
        { name: '📅 対象期間', value: selectedValues.join(', '), inline: false }
      )
      .setColor(0x00aa00)
      .setTimestamp();

    await interaction.editReply({
      content: MESSAGES.CSV.EXPORT_SUCCESS,
      embeds: [embed],
      components: []
    });

    logger.info(`[CSV出力] 完了 - Period: ${period}, Records: ${result.recordCount}, File: ${result.fileName}`);

  } catch (error) {
    logger.error('[CSV出力] 生成エラー:', error);
    await interaction.editReply({
      content: MESSAGES.CSV.EXPORT_ERROR,
      components: []
    });
  }

  return true;
}

/**
 * 設定選択メニュー処理
 */
async function handleConfigSelect(interaction) {
  await interaction.deferUpdate();

  try {
    if (interaction.customId === CONFIG_ROLE_SELECT) {
      await updateState(interaction.guildId, state => {
        state.approverRoles = interaction.values;
        return state;
      });
      await interaction.editReply({
        content: '✅ 承認ロールを設定しました。',
        components: []
      });
    } else if (interaction.customId === CONFIG_VISIBLE_SELECT) {
      await updateState(interaction.guildId, state => {
        state.visibleRoles = interaction.values;
        return state;
      });
      await interaction.editReply({
        content: '✅ 閲覧ロールを設定しました。',
        components: []
      });
    } else if (interaction.customId === CONFIG_CHANNEL_SELECT) {
      await updateState(interaction.guildId, state => {
        state.logChannelId = interaction.values[0] || null;
        return state;
      });
      await interaction.editReply({
        content: '✅ 通知チャンネルを設定しました。',
        components: []
      });
    }

  } catch (error) {
    logger.error('[設定処理] エラー:', error);
    await interaction.editReply({
      content: MESSAGES.GENERAL.ERROR,
      components: []
    });
  }

  return true;
}

/**
 * 申請通知をログチャンネルに送信
 */
async function sendApplicationNotification(interaction, expenseData) {
  try {
    const state = await readState(interaction.guildId);
    if (!state.logChannelId) return;

    const logChannel = interaction.guild.channels.cache.get(state.logChannelId);
    if (!logChannel) return;

    const logEmbed = new EmbedBuilder()
      .setTitle('📝 新規経費申請')
      .setDescription(`申請ID: \`${expenseData.applicationId}\``)
      .addFields(
        { name: '👤 申請者', value: `<@${expenseData.userId}>`, inline: true },
        { name: '📅 申請日', value: expenseData.date, inline: true },
        { name: '🏷️ カテゴリ', value: expenseData.category, inline: true },
        { name: '💰 金額', value: `¥${expenseData.amount.toLocaleString()}`, inline: true },
        { name: '📝 用途', value: expenseData.purpose, inline: false },
        { name: '📋 備考', value: expenseData.notes, inline: false }
      )
      .setColor(0xffa500)
      .setTimestamp();

    const actionButtons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`${APPROVE_BUTTON_PREFIX}${expenseData.applicationId}`)
          .setLabel('承認')
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅'),
        new ButtonBuilder()
          .setCustomId(`${REJECT_BUTTON_PREFIX}${expenseData.applicationId}`)
          .setLabel('却下')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('❌'),
        new ButtonBuilder()
          .setCustomId(`${EDIT_BUTTON_PREFIX}${expenseData.applicationId}`)
          .setLabel('修正依頼')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('📝')
      );

    await logChannel.send({
      embeds: [logEmbed],
      components: [actionButtons]
    });

  } catch (error) {
    logger.error('[通知送信] エラー:', error);
  }
}

/**
 * 申請データ検証
 */
function validateExpenseData({ expenseDate, category, amount, purpose }) {
  // 日付検証
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) {
    return { valid: false, error: MESSAGES.APPLICATION.INVALID_DATE };
  }

  // 金額検証
  if (!/^\d+$/.test(amount)) {
    return { valid: false, error: MESSAGES.APPLICATION.INVALID_AMOUNT };
  }

  const amountNum = parseInt(amount);
  if (amountNum <= 0) {
    return { valid: false, error: '❌ 金額は0より大きい値を入力してください。' };
  }

  if (amountNum > 1000000) {
    return { valid: false, error: MESSAGES.APPLICATION.AMOUNT_TOO_HIGH };
  }

  // 必須項目検証
  if (!category.trim() || !purpose.trim()) {
    return { valid: false, error: '❌ カテゴリと用途は必須項目です。' };
  }

  return { valid: true };
}

// 既存の関数を簡略化
async function handleConfirmCancel(interaction) {
  const applicationId = interaction.customId.split('_')[2];
  const isConfirm = interaction.customId.startsWith(CONFIRM_PREFIX);
  
  await interaction.deferUpdate();
  
  if (isConfirm) {
    await interaction.editReply({
      content: '✅ 申請が確定されました。承認をお待ちください。',
      components: []
    });
  } else {
    await interaction.editReply({
      content: '❌ 申請をキャンセルしました。',
      components: []
    });
  }
  
  return true;
}

// === 既存機能の簡略版（後方互換性） ===

/**
 * 経費申請設定処理（簡略版）
 */
async function handleConfigSettings(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  await interaction.editReply({
    content: '⚙️ 詳細設定は `/経費申請設定` コマンドをご利用ください。'
  });
  return true;
}

/**
 * CSV出力処理（簡略版）
 */
async function handleCsvExport(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  await interaction.editReply({
    content: '� CSV出力は `/経費csv` コマンドをご利用ください。'
  });
  return true;
}

/**
 * ヘルプ処理
 */
async function handleHelp(interaction) {
  const { customId } = interaction;
  
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  
  if (customId === 'keihi_help_guide_button') {
    const embed = new EmbedBuilder()
      .setTitle('📖 経費申請ガイド')
      .setDescription('**経費申請の手順**')
      .setColor(0x3498db)
      .addFields(
        { name: 'ステップ1', value: '経費申請ボタンをクリック', inline: false },
        { name: 'ステップ2', value: 'フォームに必要事項を入力', inline: false },
        { name: 'ステップ3', value: 'レシート等の添付（必要に応じて）', inline: false },
        { name: 'ステップ4', value: '申請を送信', inline: false },
        { name: 'ステップ5', value: '承認完了まで待機', inline: false }
      );

    await interaction.editReply({ embeds: [embed] });
    
  } else if (customId === 'keihi_help_faq_button') {
    const embed = new EmbedBuilder()
      .setTitle('💡 よくある質問')
      .setDescription('**経費申請について**')
      .setColor(0xffa500)
      .addFields(
        { name: 'Q: 申請可能な経費は？', value: 'A: 交通費、会議費、消耗品費、接待費等が対象です', inline: false },
        { name: 'Q: 承認にかかる時間は？', value: 'A: 通常2-3営業日以内に承認されます', inline: false },
        { name: 'Q: レシートは必須？', value: 'A: 1,000円以上の申請では添付が必要です', inline: false }
      );

    await interaction.editReply({ embeds: [embed] });
    
  } else {
    await interaction.editReply({
      content: '❓ このヘルプ項目は準備中です。'
    });
  }
  
  return true;
}

/**
 * 履歴処理
 */
async function handleHistory(interaction) {
  const { customId } = interaction;
  
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  
  if (customId === 'keihi_history_personal_button') {
    try {
      const state = await readState(interaction.guildId);
      const userExpenses = state.expenses.filter(e => e.userId === interaction.user.id);
      
      const embed = new EmbedBuilder()
        .setTitle('📋 個人申請履歴')
        .setDescription(`**${interaction.user.displayName}さんの申請履歴**`)
        .setColor(0x9932cc)
        .addFields(
          { name: '総申請数', value: `${userExpenses.length}件`, inline: true },
          { name: '承認済み', value: `${userExpenses.filter(e => e.status === '承認済み').length}件`, inline: true },
          { name: '申請中', value: `${userExpenses.filter(e => e.status === '申請中').length}件`, inline: true }
        );

      if (userExpenses.length > 0) {
        const latestExpense = userExpenses[userExpenses.length - 1];
        embed.addFields({
          name: '最新申請',
          value: `${latestExpense.date} - ${latestExpense.category} ¥${latestExpense.amount.toLocaleString()}`,
          inline: false
        });
      }

      await interaction.editReply({ embeds: [embed] });
      
    } catch (error) {
      logger.error('[履歴確認] エラー:', error);
      await interaction.editReply({ content: MESSAGES.GENERAL.ERROR });
    }
    
  } else {
    await interaction.editReply({
      content: '📋 この履歴機能は現在開発中です。'
    });
  }
  
  return true;
}
