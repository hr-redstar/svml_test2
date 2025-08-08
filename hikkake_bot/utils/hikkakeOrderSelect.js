// hikkake_bot/utils/hikkakeOrderSelect.js
const { readState, writeState } = require('./hikkakeStateManager');
const { updatePanels } = require('./panelStateManager');
const { logToThread } = require('./threadLogger');
const { createSelectMenuRow, createNumericOptions } = require('./discordUtils');
const { readReactions, getRandomReaction } = require('./hikkakeReactionManager');
const { DateTime } = require('luxon');

module.exports = {
  customId: /^hikkake_order_step(1_guest|2_bottle|3_pura|4_kama)_(quest|tosu|horse)/,
  async execute(interaction) {
    const match = interaction.customId.match(this.customId);
    const step = match[1];
    const type = match[2];

    // Acknowledge the interaction immediately to prevent timeout
    await interaction.deferUpdate();

    if (step === '1_guest') {
      // Step 1: 客の人数を受け取り、ボトルの本数選択メニューを表示
      const guestCount = interaction.values[0];
      const newCustomId = `hikkake_order_step2_bottle_${type}_${guestCount}`;
      const row = createSelectMenuRow(newCustomId, 'ボトルの本数を選択 (0-24)', createNumericOptions(25, '本', 0));
      await interaction.editReply({
        content: `【${type.toUpperCase()}】客数: ${guestCount}人。次にボトルの本数を選択してください。`,
        components: [row],
      });
    } else if (step === '2_bottle') {
      // Step 2: ボトルの本数を受け取り、プラの人数選択メニューを表示
      const parts = interaction.customId.split('_');
      const guestCount = parts[5];
      const bottleCount = interaction.values[0];
      const newCustomId = `hikkake_order_step3_pura_${type}_${guestCount}_${bottleCount}`;
      const row = createSelectMenuRow(newCustomId, '担当プラの人数を選択 (0-24)', createNumericOptions(25, '人', 0));
      await interaction.editReply({
        content: `客数: ${guestCount}人, 本数: ${bottleCount}本。次に担当したプラの人数を選択してください。`,
        components: [row],
      });
    } else if (step === '3_pura') {
      // Step 3: プラの人数を受け取り、カマの人数選択メニューを表示
      const parts = interaction.customId.split('_');
      const guestCount = parts[5];
      const bottleCount = parts[6];
      const castPura = interaction.values[0];
      const newCustomId = `hikkake_order_step4_kama_${type}_${guestCount}_${bottleCount}_${castPura}`;
      const row = createSelectMenuRow(newCustomId, '担当カマの人数を選択 (0-24)', createNumericOptions(25, '人', 0));
      await interaction.editReply({
        content: `客数: ${guestCount}人, 本数: ${bottleCount}本, 担当プラ: ${castPura}人。次に担当したカマの人数を選択してください。`,
        components: [row],
      });
    } else if (step === '4_kama') {
        // Step 4: カマの人数を受け取り、最終処理
        const parts = interaction.customId.split('_');
        const guestCount = parseInt(parts[5], 10);
        const bottles = parseInt(parts[6], 10);
        const castPura = parseInt(parts[7], 10);
        const castKama = parseInt(interaction.values[0], 10);

        if ([guestCount, bottles, castPura, castKama].some(isNaN)) {
            return interaction.editReply({ content: 'エラー: 数値の解析に失敗しました。', components: [] });
        }

        const guildId = interaction.guildId;
        const state = await readState(guildId);

        // 利用可能なスタッフ数を計算
        const allocatedPura = state.orders[type]
            .filter(order => !order.leaveTimestamp && (order.type === 'order' || order.type === 'douhan' || order.type === 'casual_arrival'))
            .reduce((sum, order) => sum + (order.castPura || 0), 0);
        const allocatedKama = state.orders[type]
            .filter(order => !order.leaveTimestamp && (order.type === 'order' || order.type === 'douhan' || order.type === 'casual_arrival'))
            .reduce((sum, order) => sum + (order.castKama || 0), 0);
        const availablePura = (state.staff[type].pura || 0) - allocatedPura;
        const availableKama = (state.staff[type].kama || 0) - allocatedKama;

        if (castPura > availablePura || castKama > availableKama) {
            return interaction.editReply({
                content: `❌ スタッフが不足しています。\n現在利用可能 - プラ: ${availablePura}人, カマ: ${availableKama}人`,
                components: [],
            });
        }

        const newOrder = {
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            type: 'order',
            status: 'pending', // 'pending', 'confirmed', 'failed'
            people: guestCount,
            bottles,
            castPura,
            castKama,
            timestamp: new Date().toISOString(),
            user: {
                id: interaction.user.id,
                username: interaction.user.username,
            },
            logUrl: null,
        };

        try {
            const logMessage = await logToThread(guildId, interaction.client, {
                user: interaction.user,
                logType: '受注',
                details: { type, people: guestCount, bottles, castPura, castKama },
                channelName: interaction.channel.name,
            });
            if (logMessage) {
                newOrder.logUrl = logMessage.url;
            }
        } catch (e) {
            console.warn('[hikkakeOrderSelect] ログ出力失敗', e);
        }

        state.orders[type].push(newOrder);

        await writeState(guildId, state);
        await updateAllHikkakePanels(interaction.client, guildId, state);

        // これまでの一時的な返信（エフェメラル）を削除
        await interaction.deleteReply();

        // 新しいフォーマットで公開メッセージを作成
        const timestamp = DateTime.fromISO(newOrder.timestamp).setZone('Asia/Tokyo').toFormat('HH:mm');
        const logLink = newOrder.logUrl ? `スレッドログのテキストリンク` : '';

        const firstLine = `✅ ひっかけました！入力者：<@${interaction.user.id}>`;
        const secondLine = `客数: ${newOrder.people}人　本数: ${newOrder.bottles}本　キャスト:プラ ${newOrder.castPura}人　カマ ${newOrder.castKama}人　入力時間：${timestamp}　${logLink}`;

        const publicMessage = `${firstLine}\n${secondLine.trim()}`;

        await interaction.channel.send({
            content: publicMessage,
        });
    }
  }
};
