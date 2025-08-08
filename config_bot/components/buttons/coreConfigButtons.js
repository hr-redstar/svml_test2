// config_bot/components/buttons/coreConfigButtons.js

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// ボタンID定数
const STORE_CONFIG_BUTTON_ID = 'core_store_config_button';
const ROLE_CONFIG_BUTTON_ID = 'core_role_config_button';
const LOG_CHANNEL_BUTTON_ID = 'core_log_channel_button';
const USER_INFO_CONFIG_BUTTON_ID = 'core_user_info_config_button';

/**
 * コア設定用のボタン行を作成
 */
function createCoreConfigButtons() {
  const row1 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(STORE_CONFIG_BUTTON_ID)
        .setLabel('店舗名設定')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🏪'),
      new ButtonBuilder()
        .setCustomId(ROLE_CONFIG_BUTTON_ID)
        .setLabel('役職設定')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('👥'),
      new ButtonBuilder()
        .setCustomId(LOG_CHANNEL_BUTTON_ID)
        .setLabel('ログチャンネル設定')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📝')
    );

  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(USER_INFO_CONFIG_BUTTON_ID)
        .setLabel('ユーザー情報登録')
        .setStyle(ButtonStyle.Success)
        .setEmoji('👤')
    );

  return [row1, row2];
}

module.exports = {
  createCoreConfigButtons,
  STORE_CONFIG_BUTTON_ID,
  ROLE_CONFIG_BUTTON_ID,
  LOG_CHANNEL_BUTTON_ID,
  USER_INFO_CONFIG_BUTTON_ID
};
