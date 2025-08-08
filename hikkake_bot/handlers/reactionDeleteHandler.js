// hikkake_bot/handlers/reactionDeleteHandler.js
const { StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const { readReactions, writeReactions } = require('../utils/hikkakeReactionManager');
const logger = require('@common/logger');
const { DELETE_REACTION_BUTTON, DELETE_REACTION_SELECT } = require('../constants');
const { buildAdminPanel } = require('./panelActionHandler');

module.exports = {
  async execute(interaction) {
    if (interaction.isButton() && interaction.customId === DELETE_REACTION_BUTTON) {
      await this.handleDeleteButton(interaction);
      return true;
    }
    if (interaction.isStringSelectMenu() && interaction.customId === DELETE_REACTION_SELECT) {
      await this.handleDeleteSelect(interaction);
      return true;
    }
    return false;
  },

  async handleDeleteButton(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const guildId = interaction.guildId;

    try {
      const reactions = await readReactions(guildId);
      const options = [];

      for (const type in reactions) {
        for (const key in reactions[type]) {
          for (const value in reactions[type][key]) {
            reactions[type][key][value].forEach((message, index) => {
              if (options.length < 25) {
                const label = `[${type}/${key}/${value}] ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`;
                options.push({
                  label: label.substring(0, 100),
                  value: `${type}:${key}:${value}:${index}`.substring(0, 100),
                });
              }
            });
          }
        }
      }

      if (options.length === 0) {
        return interaction.editReply({ content: '削除できる反応文がありません。' });
      }

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(DELETE_REACTION_SELECT)
        .setPlaceholder('削除したい反応文を選択してください...')
        .addOptions(options);

      const row = new ActionRowBuilder().addComponents(selectMenu);
      const embed = new EmbedBuilder()
        .setTitle('🗑️ 反応文の削除')
        .setDescription('削除したい反応文を下のメニューから選択してください。')
        .setColor('Orange');

      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error) {
      logger.error('反応文削除メニューの作成中にエラーが発生しました。', { error, guildId });
      await interaction.editReply({ content: '❌ メニューの作成中にエラーが発生しました。' });
    }
  },

  async handleDeleteSelect(interaction) {
    await interaction.deferUpdate();
    const guildId = interaction.guildId;
    const selectedValue = interaction.values[0]; // "type:key:value:index"
    const [type, key, value, indexStr] = selectedValue.split(':');
    const index = parseInt(indexStr, 10);

    if (!type || !key || !value || isNaN(index)) {
      logger.warn(`[ReactionDelete] 無効な選択値: ${selectedValue}`);
      return interaction.followUp({ content: '❌ 無効な選択です。', ephemeral: true });
    }

    try {
      const reactions = await readReactions(guildId);
      const targetArray = reactions?.[type]?.[key]?.[value];

      if (!targetArray || index >= targetArray.length) {
        return interaction.editReply({ content: 'エラー: 削除対象の反応文が見つかりませんでした。既に削除されている可能性があります。', components: [], embeds: [] });
      }

      const deletedMessage = targetArray.splice(index, 1)[0];

      // If the array is empty, clean up the object keys
      if (targetArray.length === 0) {
        delete reactions[type][key][value];
        if (Object.keys(reactions[type][key]).length === 0) {
          delete reactions[type][key];
        }
      }

      await writeReactions(guildId, reactions);

      // Update the admin panel to reflect the change
      const panelContent = await buildAdminPanel(guildId);
      await interaction.editReply({
        content: `✅ 反応文「${deletedMessage}」を削除しました。`,
        ...panelContent,
      });
    } catch (error) {
      logger.error('反応文の削除中にエラーが発生しました。', { error, guildId, selectedValue });
      await interaction.editReply({ content: '❌ 削除中にエラーが発生しました。', components: [], embeds: [] });
    }
  },
};