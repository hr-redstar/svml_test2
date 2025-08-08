// hikkake_bot/utils/hikkakeDohanSelect.js
const { readState, writeState } = require('./hikkakeStateManager');
const { updatePanels } = require('./panelStateManager');
const { logToThread } = require('./threadLogger');
const { createSelectMenuRow, createNumericOptions } = require('./discordUtils');
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  customId: /^hikkake_douhan_step(1_user|2_guests|3_duration)_(quest|tosu|horse)/,
  async execute(interaction) {
    const match = interaction.customId.match(this.customId);
    const step = match[1];
    const type = match[2];

    if (step === '1_user') {
      await interaction.deferUpdate();
      // Step 1: User selected, now ask for guest count
      const selectedUserId = interaction.values[0];
      const newCustomId = `hikkake_douhan_step2_guests_${type}_${selectedUserId}`;
      const row = createSelectMenuRow(newCustomId, '客数を選択 (0-24)', createNumericOptions(25, '人', 0));
      await interaction.editReply({
        content: `キャスト <@${selectedUserId}> を選択しました。次にお客様の人数を選択してください。`,
        components: [row],
      });
    } else if (step === '2_guests') {
      await interaction.deferUpdate();
      // Step 2: Guest count selected, now ask for duration
      const parts = interaction.customId.split('_');
      const selectedUserId = parts[5];
      const guestCount = interaction.values[0];
      const newCustomId = `hikkake_douhan_step3_duration_${type}_${selectedUserId}_${guestCount}`;
      
      const durationOptions = Array.from({ length: 8 }, (_, i) => { // 30 mins to 4 hours
        const minutes = 30 * (i + 1);
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        let label = '';
        if (hours > 0) label += `${hours}時間`;
        if (mins > 0) label += `${mins}分`;
        return { label, value: String(minutes) };
      });

      const row = createSelectMenuRow(newCustomId, '同伴時間を選択', durationOptions);
      await interaction.editReply({
        content: `客数: ${guestCount}人。次に同伴時間を選択してください。`,
        components: [row],
      });
    } else if (step === '3_duration') {
      // Step 3: Duration selected, now show modal for arrival time
      const parts = interaction.customId.split('_');
      const selectedUserId = parts[5];
      const guestCount = parts[6];
      const duration = interaction.values[0];

      const modal = new ModalBuilder()
        .setCustomId(`hikkake_douhan_submit_${type}_${selectedUserId}_${guestCount}_${duration}`)
        .setTitle('来店予定時間の入力');

      const arrivalTimeInput = new TextInputBuilder()
        .setCustomId('arrival_time')
        .setLabel('来店予定時間')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('例: 21:30 or 2130')
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(arrivalTimeInput));
      await interaction.showModal(modal);
    }
  },
};
