// hikkake_bot/utils/hikkake_modal_handler.js
const { MessageFlags } = require('discord.js');
const { readState, writeState, getActiveStaffAllocation } = require('@root/hikkake_bot/utils/hikkakeStateManager');
const { updateAllHikkakePanels, updatePanelsByType } = require('@root/hikkake_bot/utils/panelStateManager');
const { logToThread } = require('@root/hikkake_bot/utils/loggingHelper');
const { readReactions, writeReactions } = require('@root/hikkake_bot/utils/hikkakeReactionManager');
const { logHikkakeEvent } = require('@root/hikkake_bot/utils/hikkakeCsvLogger');

module.exports = {
    async execute(interaction) {
        if (!interaction.isModalSubmit()) return false;

        const { customId } = interaction;

        // --- Reaction Setup Modal ---
        const reactionModalMatch = customId.match(/^hikkake_reaction_modal_(quest|tosu|horse)_(num|count)_(\d+)$/);
        if (reactionModalMatch) {
            return await this.handleReactionModal(interaction, reactionModalMatch[1], reactionModalMatch[2], reactionModalMatch[3]);
        }

        // --- Douhan Submission ---
        const douhanMatch = customId.match(/^hikkake_douhan_submit_(.+)_(quest|tosu|horse)_(\d+)$/);
        if (douhanMatch) {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const [, storeName, type, castUserId] = douhanMatch;
            const panelKey = `${storeName}_${type}`;

            // --- Input Parsing and Validation ---
            const inputs = {
                guestCount: parseInt(interaction.fields.getTextInputValue('guest_count'), 10),
                castPura: parseInt(interaction.fields.getTextInputValue('pura_count'), 10),
                castKama: parseInt(interaction.fields.getTextInputValue('kama_count'), 10),
                bottles: parseInt(interaction.fields.getTextInputValue('bottle_count'), 10),
                duration: parseInt(interaction.fields.getTextInputValue('duration'), 10),
            };

            for (const [key, value] of Object.entries(inputs)) {
                if (isNaN(value) || value < 0) {
                    return interaction.editReply({ content: `❌ 入力値「${key}」が無効です。0以上の半角数字で入力してください。` });
                }
            }
            const arrivalTime = interaction.fields.getTextInputValue('arrival_time');

            const guildId = interaction.guildId;
            const state = await readState(guildId);

            const { allocatedPura, allocatedKama } = getActiveStaffAllocation(state, panelKey);
            const availablePura = (state.staff?.[panelKey]?.pura || 0) - allocatedPura;
            const availableKama = (state.staff?.[panelKey]?.kama || 0) - allocatedKama;

            if (inputs.castPura > availablePura || inputs.castKama > availableKama) {
                return interaction.editReply({ content: `❌ スタッフが不足しています。\n現在利用可能 - プラ: ${availablePura}人, カマ: ${availableKama}人` });
            }

            // --- Data Construction ---
            const newLog = {
                id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                type: 'douhan',
                people: inputs.guestCount,
                bottles: inputs.bottles,
                castPura: inputs.castPura,
                castKama: inputs.castKama,
                castUserId: castUserId,
                duration: inputs.duration,
                arrivalTime: arrivalTime,
                joinTimestamp: new Date().toISOString(),
                leaveTimestamp: null,
                user: { id: interaction.user.id, username: interaction.user.username },
                logUrl: null,
            };

            // --- State and Log Updates ---
            const logMessage = await logToThread(guildId, interaction.client, { user: interaction.user, logType: '同伴', details: { storeName, type, ...newLog }, channelName: interaction.channel.name });
            if (logMessage) newLog.logUrl = logMessage.url;

            state.orders = state.orders || {};
            state.orders[panelKey] = state.orders[panelKey] || [];
            state.orders[panelKey].push(newLog);
            await writeState(guildId, state);

            await logHikkakeEvent(guildId, {
                type: 'douhan',
                user: interaction.user,
                details: { store: `${storeName}_${type}`, ...inputs, castUserId, arrivalTime }
            });

            // 多店舗対応：同じタイプの全ての店舗パネルを更新
            await updatePanelsByType(interaction.client, guildId, type, state);
            await interaction.editReply({ content: '✅ 同伴情報を記録しました。' });
            return true;
        }

        // --- Reaction Submission ---
        const reactionMatch = customId.match(/^hikkake_reaction_submit_(quest|tosu|horse)_(num|count)$/);
        if (reactionMatch) {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const [, type, key] = reactionMatch;
            const targetValueRaw = interaction.fields.getTextInputValue('target_value');
            const newMessagesRaw = interaction.fields.getTextInputValue('reaction_messages');
            const newMessages = newMessagesRaw.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            const parsedValue = parseInt(targetValueRaw, 10);

            if (isNaN(parsedValue) || parsedValue < 0) return interaction.editReply({ content: `エラー: 「${targetValueRaw}」は無効な値です。0以上の半角数字を入力してください。` });
            if (newMessages.length === 0) return interaction.editReply({ content: '追加する反応文が入力されていません。' });

            const valueKey = String(parsedValue);
            const guildId = interaction.guildId;
            const reactions = await readReactions(guildId);

            if (!reactions[type]) reactions[type] = {};
            if (!reactions[type][key]) reactions[type][key] = {};
            if (!reactions[type][key][valueKey]) reactions[type][key][valueKey] = [];

            const existingMessages = new Set(reactions[type][key][valueKey]);
            newMessages.forEach(msg => existingMessages.add(msg));
            reactions[type][key][valueKey] = Array.from(existingMessages);

            await writeReactions(guildId, reactions);
            await interaction.editReply({ content: `✅ 設定を保存しました。\n**対象:** ${type.toUpperCase()} / ${key === 'num' ? '人数' : '本数'} / ${parsedValue}\n**追加された反応文:**\n- ${newMessages.join('\n- ')}` });
            return true;
        }
        return false;
    },

    /**
     * 反応設定モーダルの処理
     */
    async handleReactionModal(interaction, storeType, reactionType, targetValue) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        
        try {
            const guildId = interaction.guildId;
            const reactionText = interaction.fields.getTextInputValue('reaction_text');
            
            if (!reactionText || reactionText.trim().length === 0) {
                return interaction.editReply({ 
                    content: '❌ 反応文が入力されていません。' 
                });
            }
            
            // 反応文を行ごとに分割
            const reactionMessages = reactionText.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);
                
            if (reactionMessages.length === 0) {
                return interaction.editReply({ 
                    content: '❌ 有効な反応文が見つかりませんでした。' 
                });
            }
            
            // 反応データを保存
            const reactions = await readReactions(guildId);
            
            // データ構造を初期化
            if (!reactions[storeType]) reactions[storeType] = {};
            if (!reactions[storeType][reactionType]) reactions[storeType][reactionType] = {};
            if (!reactions[storeType][reactionType][targetValue]) reactions[storeType][reactionType][targetValue] = [];
            
            // 既存の反応文と重複を避けて追加
            const existingMessages = new Set(reactions[storeType][reactionType][targetValue]);
            const newMessages = [];
            
            reactionMessages.forEach(msg => {
                if (!existingMessages.has(msg)) {
                    existingMessages.add(msg);
                    newMessages.push(msg);
                }
            });
            
            reactions[storeType][reactionType][targetValue] = Array.from(existingMessages);
            
            await writeReactions(guildId, reactions);
            
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
            
            let resultMessage = `✅ **反応文設定完了**\n\n`;
            resultMessage += `🏪 **店舗**: ${storeNames[storeType]}\n`;
            resultMessage += `📊 **項目**: ${typeNames[reactionType]}\n`;
            resultMessage += `🔢 **対象**: ${targetValue}${unit}\n\n`;
            
            if (newMessages.length > 0) {
                resultMessage += `📝 **追加された反応文** (${newMessages.length}件):\n`;
                resultMessage += newMessages.map(msg => `• ${msg}`).join('\n');
            } else {
                resultMessage += `ℹ️ すべての反応文は既に登録済みでした。`;
            }
            
            resultMessage += `\n\n💾 **合計登録数**: ${reactions[storeType][reactionType][targetValue].length}件`;
            
            await interaction.editReply({ content: resultMessage });
            
            logger.info(`反応文設定完了: ${storeType}_${reactionType}_${targetValue}`, {
                guildId: guildId,
                executor: interaction.user.tag,
                newMessagesCount: newMessages.length,
                totalCount: reactions[storeType][reactionType][targetValue].length
            });
            
        } catch (error) {
            logger.error('反応設定モーダル処理中にエラーが発生しました。', { 
                error: error instanceof Error ? error.message : String(error),
                guildId: interaction.guildId,
                storeType: storeType,
                reactionType: reactionType,
                targetValue: targetValue
            });
            
            await interaction.editReply({ 
                content: '❌ 反応文の保存中にエラーが発生しました。' 
            });
        }
    }
};