// config_bot/components/selects/coreConfigSelects.js

const { 
  ActionRowBuilder, 
  ChannelSelectMenuBuilder, 
  ChannelType 
} = require('discord.js');

// セレクトメニューID定数
const LOG_CHANNEL_SELECT_ID = 'core_log_channel_select';

/**
 * ログチャンネル選択メニューを作成
 */
function createLogChannelSelect() {
  const channelSelect = new ChannelSelectMenuBuilder()
    .setCustomId(LOG_CHANNEL_SELECT_ID)
    .setPlaceholder('ログチャンネルを選択してください')
    .setChannelTypes(ChannelType.GuildText)
    .setMinValues(1)
    .setMaxValues(1);

  return new ActionRowBuilder().addComponents(channelSelect);
}

module.exports = {
  createLogChannelSelect,
  LOG_CHANNEL_SELECT_ID
};
