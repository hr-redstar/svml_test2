// hikkake_bot/utils/hikkake_select_handler.js
const { readState, writeState, getActiveStaffAllocation } = require('@root/hikkake_bot/utils/hikkakeStateManager');
const { updatePanels } = require('@root/hikkake_bot/utils/panelStateManager');
const { ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { DateTime } = require('luxon');
const { createSelectMenuRow, createNumericOptions } = require('@root/hikkake_bot/utils/discordHelper');
const { logHikkakeEvent } = require('@root/hikkake_bot/utils/hikkakeCsvLogger');
const { logToThread } = require('@root/hikkake_bot/utils/loggingHelper');
const logger = require('@root/common/logger');

/**
 * Handles select menu interactions for the hikkake_bot.
 * @param {import('discord.js').AnySelectMenuInteraction} interaction
 * @returns {Promise<boolean>}
 */
async function execute(interaction) {
  if (!interaction.isAnySelectMenu()) return false;

  const { customId, guildId, client } = interaction;

  try {
    // --- Panel Setup Store Select ---
    if (customId === 'hikkake_setup_store_select') {
      await interaction.deferUpdate();
      const selectedValue = interaction.values[0];
      const selectedStoreName = selectedValue.replace('setup_store_', '');

      const { ChannelSelectMenuBuilder, ChannelType } = require('discord.js');
      const channelSelectMenu = new ChannelSelectMenuBuilder()
        .setCustomId(`hikkake_setup_channel_select_${selectedStoreName}`)
        .setPlaceholder('パネルを設置するチャンネルを選択してください')
        .addChannelTypes(ChannelType.GuildText);

      const channelSelectRow = new ActionRowBuilder().addComponents(channelSelectMenu);

      await interaction.editReply({
        content: `「${selectedStoreName}」のひっかけパネルを設置します。設置するテキストチャンネルを選択してください。`,
        components: [channelSelectRow]
      });
      return true;
    }

    // --- Panel Setup Channel Select ---
    const channelSelectMatch = customId.match(/^hikkake_setup_channel_select_(.+)$/);
    if (channelSelectMatch) {
      await interaction.deferUpdate();
      const selectedStoreName = channelSelectMatch[1];
      const selectedChannelId = interaction.values[0];
      const selectedChannel = interaction.guild.channels.cache.get(selectedChannelId);

      if (!selectedChannel || selectedChannel.type !== ChannelType.GuildText) {
        await interaction.editReply({
          content: '❌ 無効なチャンネルが選択されました。テキストチャンネルを選択してください。',
          components: []
        });
        return true;
      }

      const { createPanel } = require('@root/hikkake_bot/utils/panelStateManager');
      try {
        await createPanel(interaction.guildId, selectedStoreName, selectedChannel);
        await interaction.editReply({
          content: `✅ 「${selectedStoreName}」のひっかけパネルを <#${selectedChannelId}> に設置しました！`,
          components: []
        });
      } catch (error) {
        logger.error(`ひっかけパネル設置エラー: ${error.message}`, { error });
        await interaction.editReply({
          content: `❌ ひっかけパネルの設置に失敗しました。エラー: ${error.message}`,
          components: []
        });
      }
      return true;
    }

    // --- Panel Delete Select ---
    if (customId === 'hikkake_panel_delete_select') {
      return await handleDeleteSelect(interaction);
    }
    
    // --- Reaction Value Select ---
    const reactionValueMatch = customId.match(/^hikkake_reaction_value_(quest|tosu|horse)_(num|count)$/);
    if (reactionValueMatch) {
      return await handleReactionValueSelect(interaction, reactionValueMatch[1], reactionValueMatch[2]);
    }
    // --- プラ釜スタッフ数設定 (ステップ1: プラ人数選択) ---
    const plakamaStep1Match = customId.match(/^hikkake_plakama_step1_(.+)_(quest|tosu|horse)$/);
    if (plakamaStep1Match) {
      const [, storeName, type] = plakamaStep1Match;
      const puraCount = interaction.values[0];
      const row = createSelectMenuRow(`hikkake_plakama_step2_${storeName}_${type}_${puraCount}`, 'カマの人数を選択 (0-24)', createNumericOptions(25, '人', 0));
      await interaction.update({ content: `次にカマの人数を選択してください。`, components: [row] });
      return true;
    }

  // --- プラ釜スタッフ数設定 (ステップ2: カマ人数選択 & 保存) ---
  const plakamaStep2Match = customId.match(/^hikkake_plakama_step2_(.+)_(quest|tosu|horse)_(\d+)$/);
  if (plakamaStep2Match) {
    await interaction.deferUpdate();
    const [, storeName, type, puraCount] = plakamaStep2Match;
    const kamaCount = interaction.values[0];
    const state = await readState(guildId);
    const panelKey = `${storeName}_${type}`;

    state.staff = state.staff || {};
    state.staff[panelKey] = state.staff[panelKey] || {};
    state.staff[panelKey].pura = parseInt(puraCount, 10);
    state.staff[panelKey].kama = parseInt(kamaCount, 10);

    await writeState(guildId, state);
    await logHikkakeEvent(guildId, {
      type: 'plakama_set',
      user: interaction.user,
      details: { store: `${storeName}_${type}`, pura: parseInt(puraCount, 10), kama: parseInt(kamaCount, 10) }
    });
    
    // スレッドログ出力
    await logToThread(guildId, client, {
      user: interaction.user,
      logType: 'プラカマ設定',
      details: {
        storeName,
        type,
        pura: parseInt(puraCount, 10),
        kama: parseInt(kamaCount, 10)
      },
      channelName: interaction.channel.name
    });
    
    // 多店舗対応：同じタイプの全ての店舗パネルを更新
    await updatePanels(client, guildId, state);
    await interaction.editReply({ content: `✅ **${storeName}** のスタッフ数を **プラ: ${puraCount}人, カマ: ${kamaCount}人** に設定しました。`, components: [] });
    return true;
  }

  // --- 同伴フロー (ステップ1: お客様人数選択) ---
  const douhanGuestCountMatch = customId.match(/^hikkake_douhan_guest_count_(.+)_(quest|tosu|horse)$/);
  if (douhanGuestCountMatch) {
    const [, storeName, type] = douhanGuestCountMatch;
    const guestCount = interaction.values[0];
    const row = createSelectMenuRow(`hikkake_douhan_pura_count_${storeName}_${type}_${guestCount}`, '担当プラの人数を選択 (0-25)', createNumericOptions(25, '人', 0));
    await interaction.update({ content: '次に対応したプラの人数を選択してください。', components: [row] });
    return true;
  }

  // --- 同伴フロー (ステップ2: プラ人数選択) ---
  const douhanPuraCountMatch = customId.match(/^hikkake_douhan_pura_count_(.+)_(quest|tosu|horse)_(\d+)$/);
  if (douhanPuraCountMatch) {
    const [, storeName, type, guestCount] = douhanPuraCountMatch;
    const puraCount = interaction.values[0];
    const row = createSelectMenuRow(`hikkake_douhan_kama_count_${storeName}_${type}_${guestCount}_${puraCount}`, '担当カマの人数を選択 (0-24)', createNumericOptions(25, '人', 0));
    await interaction.update({ content: '次に対応したカマの人数を選択してください。', components: [row] });
    return true;
  }

  // --- 同伴フロー (ステップ3: カマ人数選択) ---
  const douhanKamaCountMatch = customId.match(/^hikkake_douhan_kama_count_(.+)_(quest|tosu|horse)_(\d+)_(\d+)$/);
  if (douhanKamaCountMatch) {
    const [, storeName, type, guestCount, puraCount] = douhanKamaCountMatch;
    const kamaCount = interaction.values[0];
    const row = createSelectMenuRow(`hikkake_douhan_bottle_count_${storeName}_${type}_${guestCount}_${puraCount}_${kamaCount}`, 'ボトル本数を選択 (0-24)', createNumericOptions(25, '本', 0));
    await interaction.update({ content: '最後にボトル本数を選択してください。', components: [row] });
    return true;
  }

  // --- 同伴フロー (ステップ4: ボトル本数選択 & 保存) ---
  const douhanBottleCountMatch = customId.match(/^hikkake_douhan_bottle_count_(.+)_(quest|tosu|horse)_(\d+)_(\d+)_(\d+)$/);
  if (douhanBottleCountMatch) {
    await interaction.deferUpdate();
    const [, storeName, type, guestCount, puraCount, kamaCount] = douhanBottleCountMatch;
    const bottleCount = interaction.values[0];
    const state = await readState(guildId);
    const panelKey = `${storeName}_${type}`;

    // 同伴ログの作成
    const newOrder = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      joinTimestamp: DateTime.now().setZone('Asia/Tokyo').toISO(),
      user: { id: interaction.user.id, username: interaction.user.username, globalName: interaction.user.globalName },
      type: 'douhan',
      people: parseInt(guestCount, 10),
      pura: parseInt(puraCount, 10),
      kama: parseInt(kamaCount, 10),
      bottles: parseInt(bottleCount, 10),
      storeName,
      panelType: type
    };

    // 状態に追加
    state.orders = state.orders || {};
    state.orders[panelKey] = state.orders[panelKey] || [];
    state.orders[panelKey].push(newOrder);

    await writeState(guildId, state);
    await logHikkakeEvent(guildId, {
      type: 'douhan_start',
      user: interaction.user,
      details: {
        store: `${storeName}_${type}`,
        guests: parseInt(guestCount, 10),
        pura: parseInt(puraCount, 10),
        kama: parseInt(kamaCount, 10),
        bottles: parseInt(bottleCount, 10)
      }
    });

    // スレッドログ出力
    await logToThread(guildId, client, {
      user: interaction.user,
      logType: '同伴開始',
      details: {
        storeName,
        type,
        guests: parseInt(guestCount, 10),
        pura: parseInt(puraCount, 10),
        kama: parseInt(kamaCount, 10),
        bottles: parseInt(bottleCount, 10)
      },
      channelName: interaction.channel.name
    });

    // 多店舗対応：同じタイプの全ての店舗パネルを更新
    await updatePanels(client, guildId, state);
    await interaction.editReply({ 
      content: `✅ **${storeName}** で同伴を開始しました！\n👥 お客様: ${guestCount}人\n👗 プラ: ${puraCount}人\n👔 カマ: ${kamaCount}人\n🍾 ボトル: ${bottleCount}本`, 
      components: [] 
    });
    return true;
  }

  // --- ひっかけ/ふらっと来店フロー (ステップ1: お客様人数選択) ---
  const guestCountMatch = customId.match(/^hikkake_(order|arrival)_guest_count_(.+)_(quest|tosu|horse)$/);
  if (guestCountMatch) {
    const [, command, storeName, type] = guestCountMatch;
    const guestCount = interaction.values[0];
    const row = createSelectMenuRow(`hikkake_${command}_pura_count_${storeName}_${type}_${guestCount}`, '担当プラの人数を選択 (0-25)', createNumericOptions(25, '人', 0));
    await interaction.update({ content: '次に対応したプラの人数を選択してください。', components: [row] });
    return true;
  }

  // --- ひっかけ/ふらっと来店フロー (ステップ2: プラ人数選択) ---
  const puraCountMatch = customId.match(/^hikkake_(order|arrival)_pura_count_(.+)_(quest|tosu|horse)_(\d+)$/);
  if (puraCountMatch) {
    const [, command, storeName, type, guestCount] = puraCountMatch;
    const puraCount = interaction.values[0];
    const row = createSelectMenuRow(`hikkake_${command}_kama_count_${storeName}_${type}_${guestCount}_${puraCount}`, '担当カマの人数を選択 (0-24)', createNumericOptions(25, '人', 0));
    await interaction.update({ content: '最後に対応したカマの人数を選択してください。', components: [row] });
    return true;
  }

  // --- ひっかけ/ふらっと来店フロー (ステップ3: カマ人数選択) ---
  const kamaCountMatch = customId.match(/^hikkake_(order|arrival)_kama_count_(.+)_(quest|tosu|horse)_(\d+)_(\d+)$/);
  if (kamaCountMatch) {
    const [, command, storeName, type, guestCount, puraCount] = kamaCountMatch;
    const kamaCount = interaction.values[0];
    const row = createSelectMenuRow(`hikkake_${command}_bottle_count_${storeName}_${type}_${guestCount}_${puraCount}_${kamaCount}`, 'ボトル本数を選択 (0-24)', createNumericOptions(25, '本', 0));
    await interaction.update({ content: '最後にボトル本数を選択してください。', components: [row] });
    return true;
  }

  // --- ひっかけ/ふらっと来店フロー (ステップ4: ボトル本数選択 & 保存) ---
  const bottleCountMatch = customId.match(/^hikkake_(order|arrival)_bottle_count_(.+)_(quest|tosu|horse)_(\d+)_(\d+)_(\d+)$/);
  if (bottleCountMatch) {
    await interaction.deferUpdate();
    const [, command, storeName, type, guestCount, puraCount, kamaCount] = bottleCountMatch;
    const bottleCount = interaction.values[0];
    const state = await readState(guildId);
    const panelKey = `${storeName}_${type}`;

    // Add staff availability check
    const { allocatedPura, allocatedKama } = getActiveStaffAllocation(state, panelKey);
    const availablePura = (state.staff?.[panelKey]?.pura || 0) - allocatedPura;
    const availableKama = (state.staff?.[panelKey]?.kama || 0) - allocatedKama;

    if (parseInt(puraCount, 10) > availablePura || parseInt(kamaCount, 10) > availableKama) {
        await interaction.editReply({ content: `❌ スタッフが不足しています。\n現在利用可能 - プラ: ${availablePura}人, カマ: ${availableKama}人`, components: [] });
        return true;
    }

    state.orders = state.orders || {};
    state.orders[panelKey] = state.orders[panelKey] || [];
    state.staff = state.staff || {};
    state.staff[interaction.user.id] = state.staff[interaction.user.id] || { name: interaction.member.displayName, orders: [] };

    const order = {
      id: `${panelKey}-${Date.now()}`,
      type: command, // 'order' or 'arrival'
      user: { id: interaction.user.id, username: interaction.user.username },
      people: parseInt(guestCount, 10),
      castPura: parseInt(puraCount, 10),
      castKama: parseInt(kamaCount, 10),
      bottles: parseInt(bottleCount, 10),
      joinTimestamp: DateTime.now().toISO(),
      leaveTimestamp: null,
    };

    state.orders[panelKey].push(order);
    state.staff[interaction.user.id].orders.push(order.id);

    await writeState(guildId, state);
    const summary = `お客様: ${guestCount}人, プラ: ${puraCount}人, カマ: ${kamaCount}人, ボトル: ${bottleCount}本`;
    await logHikkakeEvent(guildId, {
      type: command, // 'order' or 'arrival'
      user: interaction.user,
      details: {
        store: `${storeName}_${type}`,
        people: parseInt(guestCount, 10),
        castPura: parseInt(puraCount, 10),
        castKama: parseInt(kamaCount, 10),
        bottles: parseInt(bottleCount, 10),
      }
    });
    
    // スレッドログ出力
    const logTypeLabel = command === 'order' ? '受注' : 'ふらっと来た';
    await logToThread(guildId, client, {
      user: interaction.user,
      logType: logTypeLabel,
      details: {
        storeName,
        type,
        people: parseInt(guestCount, 10),
        castPura: parseInt(puraCount, 10),
        castKama: parseInt(kamaCount, 10),
        bottles: parseInt(bottleCount, 10)
      },
      channelName: interaction.channel.name
    });
    
    // 多店舗対応：同じタイプの全ての店舗パネルを更新
    await updatePanels(client, guildId, state);
    await interaction.editReply({ content: `✅ 記録しました: ${summary}`, components: [] });
    return true;
  }

  // --- 同伴 (キャスト選択) ---
  const douhanMatch = customId.match(/^hikkake_douhan_step1_user_(.+)_(quest|tosu|horse)$/);
  if (douhanMatch) {
    const [, storeName, type] = douhanMatch;
    const castUserId = interaction.values[0];

    const modal = new ModalBuilder()
      .setCustomId(`hikkake_douhan_submit_${storeName}_${type}_${castUserId}`) // Include storeName
      .setTitle('同伴情報の入力');

    const guestCountInput = new TextInputBuilder().setCustomId('guest_count').setLabel('お客様の人数').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('例: 2');
    const puraCountInput = new TextInputBuilder().setCustomId('pura_count').setLabel('担当プラの人数').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('例: 1');
    const kamaCountInput = new TextInputBuilder().setCustomId('kama_count').setLabel('担当カマの人数').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('例: 0');
    const bottleCountInput = new TextInputBuilder().setCustomId('bottle_count').setLabel('ボトル本数').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('例: 0');
    const durationInput = new TextInputBuilder().setCustomId('duration').setLabel('同伴時間（分）').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('例: 60');
    const arrivalTimeInput = new TextInputBuilder().setCustomId('arrival_time').setLabel('お店への到着予定時間').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('例: 21:00');

    modal.addComponents(
      new ActionRowBuilder().addComponents(guestCountInput),
      new ActionRowBuilder().addComponents(puraCountInput),
      new ActionRowBuilder().addComponents(kamaCountInput),
      new ActionRowBuilder().addComponents(bottleCountInput),
      new ActionRowBuilder().addComponents(durationInput),
      new ActionRowBuilder().addComponents(arrivalTimeInput)
    );

    await interaction.showModal(modal);
    return true;
  }

  // --- ログ解決 (確定/失敗) ---
  const resolveMatch = customId.match(/^hikkake_resolve_log_(confirm|fail)_(.+)_(quest|tosu|horse)$/);
  if (resolveMatch) {
    await interaction.deferUpdate();
    const [, status, storeName, type] = resolveMatch;
    const orderId = interaction.values[0];
    const state = await readState(guildId);
    const panelKey = `${storeName}_${type}`;

    const order = state.orders?.[panelKey]?.find(o => o.id === orderId);
    if (order) {
      order.status = status; // 'confirm' or 'fail'
      order.leaveTimestamp = DateTime.now().toISO(); // Resolve = complete
      await writeState(guildId, state);
      await logHikkakeEvent(guildId, {
        type: `log_${status}`, // log_confirm or log_fail
        user: interaction.user,
        details: { store: `${storeName}_${type}`, orderId: order.id, originalUser: order.user.username }
      });
      
      // スレッドログ出力
      const logTypeLabel = status === 'confirm' ? 'ひっかけ確定' : 'ひっかけ失敗';
      await logToThread(guildId, client, {
        user: interaction.user,
        logType: logTypeLabel,
        details: {
          storeName,
          type,
          resolvedLog: order
        },
        channelName: interaction.channel.name
      });
      
      // 多店舗対応：同じタイプの全ての店舗パネルを更新
      await updatePanelsByType(client, guildId, type, state);
      await interaction.editReply({ content: `✅ ログを「${status === 'confirm' ? '確定' : '失敗'}」に更新しました。`, components: [] });
    } else {
      await interaction.editReply({ content: '❌ 対象のログが見つかりませんでした。', components: [] });
    }
    return true;
  }

  // --- ログ完了 (退店) ---
  const retireMatch = customId.match(/^hikkake_retire_log_(.+)_(quest|tosu|horse)$/);
  if (retireMatch) {
    await interaction.deferUpdate();
    const [, storeName, type] = retireMatch;
    const orderId = interaction.values[0];
    const state = await readState(guildId);
    const panelKey = `${storeName}_${type}`;

    const order = state.orders?.[panelKey]?.find(o => o.id === orderId);
    if (order) {
      order.leaveTimestamp = DateTime.now().toISO();
      await writeState(guildId, state);
      await logHikkakeEvent(guildId, {
        type: 'log_leave',
        user: interaction.user,
        details: { store: `${storeName}_${type}`, orderId: order.id, originalUser: order.user.username }
      });
      
      // スレッドログ出力
      await logToThread(guildId, client, {
        user: interaction.user,
        logType: 'ログ退店',
        details: {
          storeName,
          type,
          retiredLog: order
        },
        channelName: interaction.channel.name
      });
      
      // 多店舗対応：同じタイプの全ての店舗パネルを更新
      await updatePanelsByType(client, guildId, type, state);
      await interaction.editReply({ content: '✅ ログを「退店済み」に更新しました。', components: [] });
    } else {
      await interaction.editReply({ content: '❌ 対象のログが見つかりませんでした。', components: [] });
    }
    return true;
  }

  return false; // No handler matched

  } catch (error) {
    logger.error('hikkake_select_handler エラー:', { 
      error: error instanceof Error ? error.message : String(error),
      customId: interaction.customId,
      guildId: interaction.guildId
    });
    
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ 操作中にエラーが発生しました。管理者にお問い合わせください。',
          ephemeral: true
        });
      } else {
        await interaction.editReply({
          content: '❌ 操作中にエラーが発生しました。管理者にお問い合わせください。',
          components: []
        });
      }
    } catch (replyError) {
      logger.error('エラー応答失敗:', { 
        error: replyError instanceof Error ? replyError.message : String(replyError)
      });
    }
    
    return false;
  }
}

/**
 * パネル削除選択の処理
 * @param {import('discord.js').StringSelectMenuInteraction} interaction 
 * @returns {Promise<boolean>}
 */
async function handleDeleteSelect(interaction) {
  await interaction.deferUpdate();
  
  try {
    const selectedValue = interaction.values[0]; // "storeName_type"
    const [storeName, type] = selectedValue.split('_');
    
    if (!storeName || !type) {
      await interaction.editReply({ 
        content: '❌ 無効な選択です。', 
        components: [], 
        embeds: [] 
      });
      return true;
    }
    
    const guildId = interaction.guildId;
    const state = await readState(guildId);
    const panelData = state.panels?.[storeName]?.[type];
    
    if (!panelData) {
      await interaction.editReply({ 
        content: '❌ 選択されたパネルが見つかりません。既に削除されている可能性があります。', 
        components: [], 
        embeds: [] 
      });
      return true;
    }
    
    const typeNames = { 
      quest: 'クエスト依頼', 
      tosu: '凸スナ', 
      horse: 'トロイの木馬' 
    };
    const typeName = typeNames[type] || type;
    
    // 削除確認メッセージを作成
    const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
    
    const embed = new EmbedBuilder()
      .setTitle('🗑️ パネル削除の確認')
      .setDescription(`以下のパネルを削除しますか？\n\n` +
        `🏪 **店舗**: ${storeName}\n` +
        `📋 **種類**: ${typeName}\n` +
        `📍 **チャンネル**: <#${panelData.channelId}>\n\n` +
        `⚠️ **警告**: この操作は取り消せません！\n` +
        `• パネルメッセージが削除されます\n` +
        `• 関連するオーダー情報が失われます\n` +
        `• 店舗設定は保持されます`)
      .setColor(0xFF0000)
      .setTimestamp();
    
    const confirmRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`hikkake_confirm_delete_${selectedValue}`)
          .setLabel('🗑️ 削除実行')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('hikkake_cancel_delete')
          .setLabel('❌ キャンセル')
          .setStyle(ButtonStyle.Secondary)
      );
    
    await interaction.editReply({ 
      embeds: [embed], 
      components: [confirmRow] 
    });
    
    return true;
    
  } catch (error) {
    logger.error('パネル削除確認の作成中にエラーが発生しました。', { 
      error: error instanceof Error ? error.message : String(error),
      guildId: interaction.guildId 
    });
    
    await interaction.editReply({ 
      content: '❌ 削除確認の作成中にエラーが発生しました。', 
      components: [], 
      embeds: [] 
    });
    
    return true;
  }
}

/**
 * 反応値選択の処理
 * @param {import('discord.js').StringSelectMenuInteraction} interaction 
 * @param {string} storeType 
 * @param {string} reactionType 
 * @returns {Promise<boolean>}
 */
async function handleReactionValueSelect(interaction, storeType, reactionType) {
  await interaction.deferUpdate();
  
  try {
    const selectedValue = interaction.values[0];
    const storeNames = { 
      quest: '🗡️ クエスト依頼', 
      tosu: '⚔️ 凸スナ', 
      horse: '🐎 トロイの木馬' 
    };
    
    const typeNames = {
      num: '人数',
      count: '本数'
    };
    
    const unit = reactionType === 'num' ? '人' : '本';
    
    // モーダルを作成
    const modal = new ModalBuilder()
      .setCustomId(`hikkake_reaction_modal_${storeType}_${reactionType}_${selectedValue}`)
      .setTitle(`${storeNames[storeType]} - ${selectedValue}${unit}の反応文設定`);

    const reactionInput = new TextInputBuilder()
      .setCustomId('reaction_text')
      .setLabel(`${selectedValue}${unit}の時の反応文`)
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('反応文を入力してください（複数行可）...')
      .setRequired(true)
      .setMaxLength(1000);

    const firstActionRow = new ActionRowBuilder().addComponents(reactionInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
    return true;
    
  } catch (error) {
    logger.error('反応値選択の処理中にエラーが発生しました。', { 
      error: error instanceof Error ? error.message : String(error),
      guildId: interaction.guildId 
    });
    
    await interaction.editReply({ 
      content: '❌ 反応設定の処理中にエラーが発生しました。', 
      components: [], 
      embeds: [] 
    });
    
    return true;
  }
}

module.exports = { execute };

module.exports = { execute };