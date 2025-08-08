// hikkake_bot/handlers/reactionSettingHandler.js

const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { addReaction } = require('../utils/hikkakeReactionManager');
const logger = require('@common/logger');

const BUTTON_PREFIX = 'set_react_';
const MODAL_PREFIX = 'modal_react_';

module.exports = {
  /**
   * このハンドラが処理するインタラクションかどうかを判定し、処理を実行します。
   * @param {import('discord.js').Interaction} interaction
   * @returns {Promise<boolean>} このハンドラで処理された場合は true
   */
  async execute(interaction) {
    if (interaction.isButton() && interaction.customId.startsWith(BUTTON_PREFIX)) {
      await this.handleSettingButton(interaction);
      return true;
    }
    if (interaction.isModalSubmit() && interaction.customId.startsWith(MODAL_PREFIX)) {
      await this.handleSettingModal(interaction);
      return true;
    }
    return false;
  },

  /** 「反応文設定」ボタンの処理 */
  async handleSettingButton(interaction) {
    const parts = interaction.customId.replace(BUTTON_PREFIX, '').split('_'); //例: 'quest_num'
    const type = parts[0]; // 'quest', 'tosu', 'horse'
    const key = parts[1]; // 'num', 'count'

    const keyLabel = key === 'num' ? '人数' : '本数';

    const modal = new ModalBuilder()
      .setCustomId(`${MODAL_PREFIX}${type}_${key}`)
      .setTitle(`【${type.toUpperCase()}】${keyLabel}別反応文の登録`);

    const valueInput = new TextInputBuilder()
      .setCustomId('value')
      .setLabel(`${keyLabel} (例: 1, 2, 3...)`)
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const messageInput = new TextInputBuilder()
      .setCustomId('message')
      .setLabel('反応文 (改行で複数登録可)')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(valueInput),
      new ActionRowBuilder().addComponents(messageInput)
    );

    await interaction.showModal(modal);
  },

  /** 反応文設定モーダルの送信処理 */
  async handleSettingModal(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const parts = interaction.customId.replace(MODAL_PREFIX, '').split('_');
    const type = parts[0];
    const key = parts[1];
    const value = interaction.fields.getTextInputValue('value');
    const messages = interaction.fields.getTextInputValue('message').split('\n').filter(Boolean);

    if (messages.length === 0) {
      return interaction.editReply({ content: '⚠️ 反応文が入力されていません。' });
    }

    try {
      await addReaction(interaction.guildId, type, key, value, messages);
      await interaction.editReply({ content: `✅ **${value}** の場合に **${messages.length}件** の反応文を登録しました。` });
    } catch (error) {
      logger.error('反応文の登録中にエラーが発生しました。', { error, guildId: interaction.guildId });
      await interaction.editReply({ content: '❌ 登録中にエラーが発生しました。' });
    }
  },
};