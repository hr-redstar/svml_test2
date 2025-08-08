// hikkake_bot/utils/hikkakeArrivalSelect.js
const { readState, writeState } = require('./hikkakeStateManager');
const { updatePanels } = require('./panelStateManager');
const { logToThread } = require('./threadLogger');
const { createSelectMenuRow, createNumericOptions } = require('./discordUtils');

module.exports = {
  customId: /^hikkake_arrival_step(1|2)_(quest|tosu|horse)/,
  async execute(interaction) {
    const match = interaction.customId.match(this.customId);
    const step = parseInt(match[1], 10);
    const type = match[2];

    // Acknowledge the interaction immediately to prevent timeout
    await interaction.deferUpdate();

    if (step === 1) {
      // Step 1: プラの人数を受け取り、カマの人数選択メニューを表示
      const puraArrivalCount = interaction.values[0];
      const newCustomId = `hikkake_arrival_step2_${type}_${puraArrivalCount}`;
      const row = createSelectMenuRow(newCustomId, '追加カマの人数を選択 (0-24)', createNumericOptions(25, '人', 0));
      await interaction.editReply({
        content: `【${type.toUpperCase()}】ふらっと来た: 担当したプラの人数は ${puraArrivalCount}人です。次に担当したカマの人数を選択してください。`,
        components: [row],
      });
    } else if (step === 2) {
      const castPura = parseInt(interaction.customId.split('_')[4], 10);
      const castKama = parseInt(interaction.values[0], 10);

      if (isNaN(castPura) || isNaN(castKama)) {
        return interaction.editReply({ content: 'エラー: 人数の解析に失敗しました。', components: [] });
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

      // 受注一覧にログとして追加
      const newLogEntry = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: 'casual_arrival',
        people: castPura + castKama,
        bottles: 0,
        castPura: castPura,
        castKama: castKama,
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
          logType: 'ふらっと来た',
          details: { type, castPura, castKama },
          channelName: interaction.channel.name,
        });
        if (logMessage) {
            newLogEntry.logUrl = logMessage.url;
        }
      } catch (e) {
        console.warn('[hikkakeArrivalSelect] ログ出力失敗', e);
      }

      state.orders[type].push(newLogEntry);

      await writeState(guildId, state);
      await updateAllHikkakePanels(interaction.client, guildId, state);

      await interaction.editReply({
        content: `✅ 【${type.toUpperCase()}】の「ふらっと来た」 (プラ: ${castPura}人, カマ: ${castKama}人) を記録しました。`,
        components: [],
      });
    }
  }
};
