// hikkake_bot/utils/hikkake_button_handler.js
const { readState, writeState } = require('@root/hikkake_bot/utils/hikkakeStateManager');
const { updateAllHikkakePanels, updatePanelsByType } = require('@root/hikkake_bot/utils/panelStateManager');
const { createSelectMenuRow, createNumericOptions, findMembersWithRole } = require('@root/hikkake_bot/utils/discordHelper');
const { StringSelectMenuOptionBuilder, MessageFlags, ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle, EmbedBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { readReactions } = require('@root/hikkake_bot/utils/hikkakeReactionManager');
const { logToThread } = require('@root/hikkake_bot/utils/loggingHelper');
const { logHikkakeEvent } = require('@root/hikkake_bot/utils/hikkakeCsvLogger');
const { DateTime } = require('luxon');
const logger = require('@root/common/logger');

module.exports = {
    async execute(interaction) {
        if (!interaction.isButton()) return false;

        const { customId, client, guild } = interaction;
        const guildId = guild.id;

        try {
            // --- Reaction Setup Store Selection ---
            const reactionStoreMatch = customId.match(/^hikkake_reaction_(quest|tosu|horse)$/);
            if (reactionStoreMatch) {
                return await this.handleReactionStoreSelect(interaction, reactionStoreMatch[1]);
            }
            
            // --- Reaction Type Selection ---
            const reactionTypeMatch = customId.match(/^hikkake_reaction_type_(quest|tosu|horse)_(num|count)$/);
            if (reactionTypeMatch) {
                return await this.handleReactionTypeSelect(interaction, reactionTypeMatch[1], reactionTypeMatch[2]);
            }
            
            // --- Panel Setup Store Selection ---
            const setupStoreMatch = customId.match(/^hikkake_setup_(quest|tosu|horse)$/);
            if (setupStoreMatch) {
                // 既存のパネル設置処理に委譲
                const selectMenu = createSelectMenuRow(
                    `hikkake_panel_select_${setupStoreMatch[1]}`, 
                    'パネルを設置するチャンネルを選択してください', 
                    []
                );
                // チャンネル選択処理は既存のハンドラーに委譲
                await interaction.reply({ 
                    content: `${setupStoreMatch[1]}のパネル設置を開始します。設置するチャンネルを選択してください。`,
                    components: [selectMenu], 
                    flags: MessageFlags.Ephemeral 
                });
                return true;
            }
            
            // --- Panel Setup Button ---
            if (customId === 'hikkake_panel_setup') {
                return await this.handlePanelSetupButton(interaction);
            }
            
            // --- Reaction Setup Button ---
            if (customId === 'hikkake_reaction_setup') {
                return await this.handleReactionSetupButton(interaction);
            }
            
            // --- Delete Confirmation Buttons ---
            if (customId.startsWith('hikkake_confirm_delete_')) {
                return await this.handleConfirmDelete(interaction);
            }
            
            if (customId === 'hikkake_cancel_delete') {
                return await this.handleCancelDelete(interaction);
            }
            // --- Main Panel Buttons ---
            const panelButtonMatch = customId.match(/^hikkake_(refresh|plakama|order|arrival|douhan)_(.+)$/);
            if (panelButtonMatch) {
                const [, action, storeName] = panelButtonMatch;

                if (action === 'refresh') {
                    await interaction.deferUpdate();
                    await updateAllHikkakePanels(client, guildId);
                    await interaction.followUp({ content: '✅ パネルを更新しました！', ephemeral: true });
                } else if (action === 'plakama') {
                    const row = createSelectMenuRow(`hikkake_plakama_step1_${storeName}`, 'プラの人数を選択 (1-25)', createNumericOptions(25, '人'));
                    await interaction.reply({ content: `【${storeName}】の基本スタッフ数を設定します。まずプラの人数を選択してください。`, components: [row], flags: MessageFlags.Ephemeral });
                } else if (action === 'order') {
                    const row = createSelectMenuRow(`hikkake_order_guest_count_${storeName}`, 'お客様の人数を選択 (1-25)', createNumericOptions(25, '人'));
                    await interaction.reply({ content: `【${storeName}】でひっかけました。まずお客様の人数を選択してください。`, components: [row], flags: MessageFlags.Ephemeral });
                } else if (action === 'arrival') {
                    const row = createSelectMenuRow(`hikkake_arrival_guest_count_${storeName}`, 'お客様の人数を選択 (1-25)', createNumericOptions(25, '人'));
                    await interaction.reply({ content: `【${storeName}】にお客様がふらっと来ました。まずお客様の人数を選択してください。`, components: [row], flags: MessageFlags.Ephemeral });
                } else if (action === 'douhan') {
                    // キャストがまだDiscordに入っていない場合は、手動で同伴設定を行う
                    const row = createSelectMenuRow(`hikkake_douhan_guest_count_${storeName}`, 'お客様の人数を選択 (1-25)', createNumericOptions(25, '人'));
                    await interaction.reply({ content: `【${storeName}】で同伴を設定します。まずお客様の人数を選択してください。`, components: [row], flags: MessageFlags.Ephemeral });
                }
                return true;
            }

            // --- Order Management Buttons ---
            const manageButtonMatch = customId.match(/^hikkake_(.+)_(quest|tosu|horse)_(confirm|fail|leave)$/);
            if (manageButtonMatch) {
                const [, storeName, type, action] = manageButtonMatch;
                const state = await readState(guildId);
                const panelKey = `${storeName}_${type}`;
                
                // Ensure the orders property exists to prevent crashes
                state.orders = state.orders || {};
                state.orders[panelKey] = state.orders[panelKey] || [];

                // Get all active (not left) orders for the store
                let targetOrders = state.orders[panelKey]?.filter(o => !o.leaveTimestamp) || [];

                // For 'confirm' and 'fail', only target 'order' types that haven't been resolved
                if (action === 'confirm' || action === 'fail') {
                    targetOrders = targetOrders.filter(o => o.type === 'order' && !o.status);
                }

                if (targetOrders.length === 0) {
                    return interaction.reply({ content: '対象のログが見つかりません。', flags: MessageFlags.Ephemeral });
                }

                const options = targetOrders.map(order => {
                    const time = DateTime.fromISO(order.joinTimestamp).setZone('Asia/Tokyo').toFormat('HH:mm');
                    const label = `[${time}] ${order.people}人 (${order.user.username})`;
                    return new StringSelectMenuOptionBuilder().setLabel(label).setValue(order.id);
                }).slice(0, 25);

                const actionMap = {
                    confirm: { customId: `hikkake_resolve_log_confirm_${storeName}_${type}`, placeholder: '確定する「ひっかけ予定」を選択' },
                    fail: { customId: `hikkake_resolve_log_fail_${storeName}_${type}`, placeholder: '失敗した「ひっかけ予定」を選択' },
                    leave: { customId: `hikkake_retire_log_${storeName}_${type}`, placeholder: '完了（退店）したログを選択' },
                };
                const { customId: selectCustomId, placeholder } = actionMap[action];
                const row = createSelectMenuRow(selectCustomId, placeholder, options);
                await interaction.reply({ components: [row], flags: MessageFlags.Ephemeral });
                return true;
            }

            // --- Cancel Order Button ---
            const cancelButtonMatch = customId.match(/^cancel_order_(.+)_(quest|tosu|horse)_(.+)$/);
            if (cancelButtonMatch) {
                await interaction.deferUpdate();
                const [, storeName, type, orderId] = cancelButtonMatch;
                const state = await readState(guildId);
                const panelKey = `${storeName}_${type}`;
                const orderIndex = state.orders[panelKey]?.findIndex(o => o.id === orderId);
                const orderToCancel = state.orders[panelKey]?.[orderIndex];

                if (orderToCancel) {
                    await logToThread(guildId, client, {
                        user: interaction.user,
                        logType: '注文キャンセル',
                        details: { storeName, type, ...orderToCancel },
                        channelName: interaction.channel.name
                    });
                    await logHikkakeEvent(guildId, {
                        type: 'log_cancel',
                        user: interaction.user,
                        details: { store: `${storeName}_${type}`, orderId: orderId, originalUser: orderToCancel.user.username }
                    });
                    state.orders[panelKey].splice(orderIndex, 1);
                    await writeState(guildId, state);
                    // 多店舗対応：同じタイプの全ての店舗パネルを更新
                    await updatePanelsByType(client, guildId, type, state);
                }
                return true;
            }

            // --- Reaction Admin Buttons ---
            const reactionAddMatch = customId.match(/^hikkake_reaction_add_(num|count)$/);
            if (reactionAddMatch) {
                const [, key] = reactionAddMatch;
                const modal = new ModalBuilder()
                    .setCustomId(`hikkake_reaction_submit_quest_${key}`) // Default to quest, user can change if needed
                    .setTitle(`反応の追加 (${key === 'num' ? '人数' : '本数'})`);

                const targetValueInput = new TextInputBuilder()
                    .setCustomId('target_value')
                    .setLabel(`対象の${key === 'num' ? '人数' : '本数'} (半角数字)`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const messagesInput = new TextInputBuilder()
                    .setCustomId('reaction_messages')
                    .setLabel('反応文 (複数行で複数登録)')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(targetValueInput),
                    new ActionRowBuilder().addComponents(messagesInput)
                );
                await interaction.showModal(modal);
                return true;
            }

            if (customId === 'hikkake_reaction_remove') {
                const reactions = await readReactions(guildId);
                const options = [];
                for (const store of ['quest', 'tosu', 'horse']) {
                    for (const key of ['num', 'count']) {
                        const config = reactions[store]?.[key];
                        if (config) {
                            for (const value of Object.keys(config)) {
                                const label = `[${store.toUpperCase()}/${key === 'num' ? '人数' : '本数'}] ${value}`;
                                options.push(new StringSelectMenuOptionBuilder().setLabel(label).setValue(`${store}_${key}_${value}`));
                            }
                        }
                    }
                }

                if (options.length === 0) {
                    return interaction.reply({ content: '削除できる反応設定がありません。', flags: MessageFlags.Ephemeral });
                }

                const row = createSelectMenuRow('hikkake_reaction_remove_select', '削除する反応設定を選択', options.slice(0, 25));
                await interaction.reply({ content: '削除する反応設定を選択してください。', components: [row], flags: MessageFlags.Ephemeral });
                return true;
            }

            if (customId === 'hikkake_panel_status') {
                const state = await readState(guildId);
                let statusMessage = '📋 **ひっかけパネル設置状況**\n\n';
                
                if (!state.panels || Object.keys(state.panels).length === 0) {
                    statusMessage += '❌ 設置されているパネルはありません。\n\n`ひっかけパネル設置`ボタンから設置してください。';
                } else {
                    for (const [storeName, storeData] of Object.entries(state.panels)) {
                        statusMessage += `🏪 **${storeName}**\n`;
                        for (const [type, panelData] of Object.entries(storeData)) {
                            const typeNames = { quest: 'クエスト依頼', tosu: '凸スナ', horse: 'トロイの木馬' };
                            statusMessage += `　├ ${typeNames[type] || type}: `;
                            if (panelData.channelId && panelData.messageId) {
                                statusMessage += `✅ 設置済み (<#${panelData.channelId}>)\n`;
                            } else {
                                statusMessage += `❌ 未設置\n`;
                            }
                        }
                        statusMessage += '\n';
                    }
                }
                
                await interaction.reply({ content: statusMessage, flags: MessageFlags.Ephemeral });
                return true;
            }

            // --- Staff Count Test Button ---
            if (customId === 'hikkake_staff_count_test') {
                const state = await readState(guildId);
                const staffCount = Object.keys(state.staff || {}).length;
                
                await interaction.reply({
                    content: `🔢 **スタッフ人数テスト**\n\n現在登録されているスタッフ数: **${staffCount}人**\n\n実際のスタッフ情報を確認したい場合は、管理パネルから詳細を確認してください。`,
                    flags: MessageFlags.Ephemeral
                });
                return true;
            }

            return false;

        } catch (error) {
            logger.error('hikkake_button_handler エラー:', { 
                error: error instanceof Error ? error.message : String(error),
                customId: customId,
                guildId: guildId
            });
            
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '❌ 操作中にエラーが発生しました。管理者にお問い合わせください。',
                        flags: MessageFlags.Ephemeral
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
    },

    /**
     * パネル削除ボタンの処理
     */
    async handleDeleteButton(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        try {
            const guildId = interaction.guildId;
            const state = await readState(guildId);
            
            // 設置されているパネルの確認
            if (!state.panels || Object.keys(state.panels).length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle('🗑️ パネル削除')
                    .setDescription('❌ 削除できるパネルがありません。\n\n設置されているパネルが見つかりませんでした。')
                    .setColor(0xFF0000)
                    .setTimestamp();
                
                return interaction.editReply({ embeds: [embed] });
            }
            
            // 削除可能なパネルの選択肢を作成
            const options = [];
            for (const [storeName, storeData] of Object.entries(state.panels)) {
                for (const [type, panelData] of Object.entries(storeData)) {
                    if (panelData.channelId && panelData.messageId) {
                        const typeNames = { 
                            quest: 'クエスト依頼', 
                            tosu: '凸スナ', 
                            horse: 'トロイの木馬' 
                        };
                        const typeName = typeNames[type] || type;
                        
                        options.push({
                            label: `${storeName} - ${typeName}`,
                            description: `チャンネル: #${panelData.channelName || 'unknown'}`,
                            value: `${storeName}_${type}`,
                        });
                    }
                }
            }
            
            if (options.length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle('🗑️ パネル削除')
                    .setDescription('❌ 削除できるパネルがありません。\n\n設置済みのパネルが見つかりませんでした。')
                    .setColor(0xFF0000)
                    .setTimestamp();
                
                return interaction.editReply({ embeds: [embed] });
            }
            
            // 削除選択メニューを作成
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('hikkake_panel_delete_select')
                .setPlaceholder('削除するパネルを選択してください...')
                .addOptions(options.slice(0, 25)); // Discord の制限で最大25個
            
            const row = new ActionRowBuilder().addComponents(selectMenu);
            
            const embed = new EmbedBuilder()
                .setTitle('🗑️ ひっかけパネル削除')
                .setDescription('削除するパネルを選択してください。\n\n⚠️ **注意**: パネルを削除すると以下が失われます:\n' +
                    '• パネルメッセージ（復元不可）\n' +
                    '• 関連するオーダー情報\n' +
                    '• スタッフ設定（店舗別）\n\n' +
                    '削除は慎重に行ってください。')
                .setColor(0xFF6B35)
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed], components: [row] });
            
        } catch (error) {
            logger.error('パネル削除メニューの作成中にエラーが発生しました。', { 
                error: error instanceof Error ? error.message : String(error),
                guildId: interaction.guildId 
            });
            
            await interaction.editReply({ 
                content: '❌ パネル削除メニューの作成中にエラーが発生しました。' 
            });
        }
    },

    /**
     * 削除確認ボタンが押されたときの処理
     */
    async handleConfirmDelete(interaction) {
        await interaction.deferUpdate();
        
        try {
            const selectedValue = interaction.customId.replace('hikkake_confirm_delete_', '');
            const [storeName, type] = selectedValue.split('_');
            
            if (!storeName || !type) {
                return interaction.editReply({ 
                    content: '❌ 無効な削除対象です。', 
                    components: [], 
                    embeds: [] 
                });
            }
            
            const guildId = interaction.guildId;
            const state = await readState(guildId);
            const panelData = state.panels?.[storeName]?.[type];
            
            if (!panelData) {
                return interaction.editReply({ 
                    content: '❌ 削除対象のパネルが見つかりません。', 
                    components: [], 
                    embeds: [] 
                });
            }
            
            // パネルメッセージの削除を試行
            let messageDeleteResult = '削除済み';
            try {
                const channel = await interaction.guild.channels.fetch(panelData.channelId);
                if (channel) {
                    const message = await channel.messages.fetch(panelData.messageId);
                    if (message) {
                        await message.delete();
                        messageDeleteResult = '✅ 削除成功';
                    }
                }
            } catch (deleteError) {
                logger.warn('パネルメッセージの削除に失敗しました（設定は削除されます）', { 
                    error: deleteError instanceof Error ? deleteError.message : String(deleteError),
                    channelId: panelData.channelId,
                    messageId: panelData.messageId 
                });
                messageDeleteResult = '⚠️ メッセージ削除失敗（設定は削除）';
            }
            
            // 状態からパネル情報を削除
            delete state.panels[storeName][type];
            
            // 店舗にパネルが残っていない場合、店舗ごと削除
            if (Object.keys(state.panels[storeName]).length === 0) {
                delete state.panels[storeName];
            }
            
            // 関連オーダーも削除
            const panelKey = `${storeName}_${type}`;
            if (state.orders && state.orders[panelKey]) {
                delete state.orders[panelKey];
            }
            
            await writeState(guildId, state);
            
            const typeNames = { 
                quest: 'クエスト依頼', 
                tosu: '凸スナ', 
                horse: 'トロイの木馬' 
            };
            const typeName = typeNames[type] || type;
            
            // 削除完了メッセージ
            const embed = new EmbedBuilder()
                .setTitle('✅ パネル削除完了')
                .setDescription(`パネルの削除が完了しました。\n\n` +
                    `🏪 **店舗**: ${storeName}\n` +
                    `📋 **種類**: ${typeName}\n` +
                    `📱 **メッセージ**: ${messageDeleteResult}\n` +
                    `💾 **設定データ**: ✅ 削除完了\n` +
                    `📦 **オーダー情報**: ✅ 削除完了`)
                .setColor(0x00FF00)
                .setTimestamp();
            
            await interaction.editReply({ 
                embeds: [embed], 
                components: [] 
            });
            
            logger.info(`パネル削除完了: ${storeName}_${type}`, { 
                guildId: guildId,
                executor: interaction.user.tag,
                messageDeleteResult: messageDeleteResult
            });
            
        } catch (error) {
            logger.error('パネル削除の実行中にエラーが発生しました。', { 
                error: error instanceof Error ? error.message : String(error),
                guildId: interaction.guildId 
            });
            
            await interaction.editReply({ 
                content: '❌ パネル削除の実行中にエラーが発生しました。', 
                components: [], 
                embeds: [] 
            });
        }
    },

    /**
     * キャンセルボタンが押されたときの処理
     */
    async handleCancelDelete(interaction) {
        await interaction.deferUpdate();
        
        const embed = new EmbedBuilder()
            .setTitle('❌ パネル削除をキャンセル')
            .setDescription('パネルの削除がキャンセルされました。\nパネルは保持されます。')
            .setColor(0x808080)
            .setTimestamp();
        
        await interaction.editReply({ 
            embeds: [embed], 
            components: [] 
        });
    },

    /**
     * パネル設置ボタンの処理
     */
    async handlePanelSetupButton(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        try {
            // 既存のhikkakePanelコマンドと同じ処理
            const embed = new EmbedBuilder()
                .setTitle('🏪 ひっかけパネル設置')
                .setDescription('**ひっかけパネルの設置・管理**\n\n' +
                    '各店舗タイプごとにひっかけパネルを設置できます。\n' +
                    'パネルを設置すると、リアルタイムでオーダー状況を管理できます。\n\n' +
                    '**設置方法**\n' +
                    '1. 下のボタンから設置したい店舗タイプを選択\n' +
                    '2. 設置するチャンネルを選択\n' +
                    '3. パネルが自動で設置されます\n\n' +
                    '**パネル機能**\n' +
                    '• リアルタイム状況表示\n' +
                    '• オーダー管理（ひっかけ・到着・同伴）\n' +
                    '• スタッフ数設定\n' +
                    '• 統計データ収集')
                .setColor(0x00AA55)
                .setTimestamp();

            const row1 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('hikkake_setup_quest')
                        .setLabel('🗡️ クエスト依頼')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('hikkake_setup_tosu')
                        .setLabel('⚔️ 凸スナ')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('hikkake_setup_horse')
                        .setLabel('🐎 トロイの木馬')
                        .setStyle(ButtonStyle.Primary)
                );

            const row2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('hikkake_panel_status')
                        .setLabel('📋 設置状況確認')
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.editReply({ 
                embeds: [embed], 
                components: [row1, row2] 
            });
            
        } catch (error) {
            logger.error('パネル設置ボタンの処理中にエラーが発生しました。', { 
                error: error instanceof Error ? error.message : String(error),
                guildId: interaction.guildId 
            });
            
            await interaction.editReply({ 
                content: '❌ パネル設置メニューの作成中にエラーが発生しました。' 
            });
        }
    },

    /**
     * 反応設定ボタンの処理
     */
    async handleReactionSetupButton(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        try {
            const embed = new EmbedBuilder()
                .setTitle('💬 ひっかけ反応登録')
                .setDescription('**店舗ごとの反応文設定**\n\n' +
                    '各店舗タイプ・条件ごとに反応文を設定できます。\n' +
                    '設定した反応文は、該当する条件でBotが自動で反応します。\n\n' +
                    '**設定手順**\n' +
                    '1. 店舗タイプを選択\n' +
                    '2. 設定項目（人数/本数）を選択\n' +
                    '3. 対象の数値を選択\n' +
                    '4. 反応文を入力\n\n' +
                    '**設定可能項目**\n' +
                    '• 👥 人数別反応（0-24人）\n' +
                    '• 📊 本数別反応（0-24本）')
                .setColor(0x5865F2)
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('hikkake_reaction_quest')
                        .setLabel('🗡️ クエスト依頼')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('hikkake_reaction_tosu')
                        .setLabel('⚔️ 凸スナ')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('hikkake_reaction_horse')
                        .setLabel('🐎 トロイの木馬')
                        .setStyle(ButtonStyle.Primary)
                );

            await interaction.editReply({ 
                embeds: [embed], 
                components: [row] 
            });
            
        } catch (error) {
            logger.error('反応設定ボタンの処理中にエラーが発生しました。', { 
                error: error instanceof Error ? error.message : String(error),
                guildId: interaction.guildId 
            });
            
            await interaction.editReply({ 
                content: '❌ 反応設定メニューの作成中にエラーが発生しました。' 
            });
        }
    },

    /**
     * 反応設定の店舗選択処理
     */
    async handleReactionStoreSelect(interaction, storeType) {
        await interaction.deferUpdate();
        
        try {
            const storeNames = { 
                quest: '🗡️ クエスト依頼', 
                tosu: '⚔️ 凸スナ', 
                horse: '🐎 トロイの木馬' 
            };
            
            const embed = new EmbedBuilder()
                .setTitle(`💬 ${storeNames[storeType]} - 反応設定`)
                .setDescription(`**${storeNames[storeType]}の反応文設定**\n\n` +
                    '設定する項目を選択してください:\n\n' +
                    '👥 **人数別反応** - お客様の人数に応じた反応文\n' +
                    '📊 **本数別反応** - 注文本数に応じた反応文\n\n' +
                    '選択後、具体的な数値（0-24）を選択して反応文を設定できます。')
                .setColor(0x5865F2)
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`hikkake_reaction_type_${storeType}_num`)
                        .setLabel('👥 人数別反応')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`hikkake_reaction_type_${storeType}_count`)
                        .setLabel('📊 本数別反応')
                        .setStyle(ButtonStyle.Primary)
                );

            await interaction.editReply({ 
                embeds: [embed], 
                components: [row] 
            });
            
        } catch (error) {
            logger.error('反応設定店舗選択の処理中にエラーが発生しました。', { 
                error: error instanceof Error ? error.message : String(error),
                guildId: interaction.guildId 
            });
            
            await interaction.editReply({ 
                content: '❌ 反応設定の処理中にエラーが発生しました。', 
                components: [], 
                embeds: [] 
            });
        }
    },

    /**
     * 反応設定のタイプ選択処理
     */
    async handleReactionTypeSelect(interaction, storeType, reactionType) {
        await interaction.deferUpdate();
        
        try {
            const storeNames = { 
                quest: '🗡️ クエスト依頼', 
                tosu: '⚔️ 凸スナ', 
                horse: '🐎 トロイの木馬' 
            };
            
            const typeNames = {
                num: '👥 人数別反応',
                count: '📊 本数別反応'
            };
            
            // 数値選択用のメニューを作成
            const options = [];
            for (let i = 0; i <= 24; i++) {
                const unit = reactionType === 'num' ? '人' : '本';
                options.push({
                    label: `${i}${unit}`,
                    description: `${i}${unit}の場合の反応文を設定`,
                    value: i.toString()
                });
            }
            
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`hikkake_reaction_value_${storeType}_${reactionType}`)
                .setPlaceholder('設定する数値を選択してください...')
                .addOptions(options.slice(0, 25)); // Discord制限で最大25個
            
            const row = new ActionRowBuilder().addComponents(selectMenu);
            
            const embed = new EmbedBuilder()
                .setTitle(`${storeNames[storeType]} - ${typeNames[reactionType]}`)
                .setDescription(`**数値選択**\n\n` +
                    `${typeNames[reactionType]}の設定で、反応させたい数値を選択してください。\n\n` +
                    '選択後、その数値に対応する反応文を入力するモーダルが表示されます。')
                .setColor(0x5865F2)
                .setTimestamp();

            await interaction.editReply({ 
                embeds: [embed], 
                components: [row] 
            });
            
        } catch (error) {
            logger.error('反応設定タイプ選択の処理中にエラーが発生しました。', { 
                error: error instanceof Error ? error.message : String(error),
                guildId: interaction.guildId 
            });
            
            await interaction.editReply({ 
                content: '❌ 反応設定の処理中にエラーが発生しました。', 
                components: [], 
                embeds: [] 
            });
        }
    }
};