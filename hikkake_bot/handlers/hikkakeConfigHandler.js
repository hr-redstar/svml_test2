// hikkake_bot/handlers/hikkakeConfigHandler.js

const {
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const logger = require('../../common/logger');
const {
  getConfigBotStores,
  getGuildTextChannels,
} = require('../utils/configBotClient');

/**
 * ひっかけパネル設置時の店舗・チャンネル選択用メニューを表示
 * @param {import('discord.js').Interaction} interaction 
 */
async function handleHikkakeSetup(interaction) {
  const stores = await getConfigBotStores(interaction.guildId);
  if (!stores || stores.length === 0) {
    await interaction.reply({ content: '⚠️ 登録された店舗がありません。config_botで店舗登録してください。', ephemeral: true });
    return;
  }

  const channels = await getGuildTextChannels(interaction.guildId);
  if (!channels || channels.length === 0) {
    await interaction.reply({ content: '⚠️ サーバーにテキストチャンネルがありません。', ephemeral: true });
    return;
  }

  const storeOptions = stores.map((store) => ({
    label: store,
    value: store,
  }));
  const channelOptions = channels.map((channel) => ({
    label: channel.name,
    value: channel.id,
  }));

  const storeSelect = new StringSelectMenuBuilder()
    .setCustomId('hikkake_setup_store_select')
    .setPlaceholder('店舗を選択')
    .addOptions(storeOptions);

  const channelSelect = new StringSelectMenuBuilder()
    .setCustomId('hikkake_setup_channel_select')
    .setPlaceholder('チャンネルを選択')
    .addOptions(channelOptions);

  const row1 = new ActionRowBuilder().addComponents(storeSelect);
  const row2 = new ActionRowBuilder().addComponents(channelSelect);

  await interaction.reply({ 
    content: 'ひっかけパネルを設置する店舗とチャンネルを選択してください。',
    components: [row1, row2],
    ephemeral: true 
  });
}

/**
 * ひっかけ応答文設定用の店舗選択メニューを表示
 * @param {import('discord.js').Interaction} interaction 
 */
async function handleResponseConfig(interaction) {
  const stores = await getConfigBotStores(interaction.guildId);
  if (!stores || stores.length === 0) {
    await interaction.reply({ content: '⚠️ 登録された店舗がありません。config_botで店舗登録してください。', ephemeral: true });
    return;
  }

  const storeOptions = stores.map((store) => ({
    label: store,
    value: store,
  }));

  const storeSelect = new StringSelectMenuBuilder()
    .setCustomId('hikkake_response_store_select')
    .setPlaceholder('店舗を選択')
    .addOptions(storeOptions);

  const row = new ActionRowBuilder().addComponents(storeSelect);
  await interaction.reply({ 
    content: '応答文を設定する店舗を選択してください。',
    components: [row],
    ephemeral: true 
  });
}

/**
 * ひっかけ設置削除用の店舗選択メニューを表示
 * @param {import('discord.js').Interaction} interaction 
 */
async function handleHikkakeDelete(interaction) {
  const stores = await getConfigBotStores(interaction.guildId);
  if (!stores || stores.length === 0) {
    await interaction.reply({ content: '⚠️ 登録された店舗がありません。config_botで店舗登録してください。', ephemeral: true });
    return;
  }

  const storeOptions = stores.map((store) => ({
    label: store,
    value: store,
  }));

  const storeSelect = new StringSelectMenuBuilder()
    .setCustomId('hikkake_delete_store_select')
    .setPlaceholder('店舗を選択')
    .addOptions(storeOptions);

  const row = new ActionRowBuilder().addComponents(storeSelect);
  await interaction.reply({ 
    content: 'ひっかけ設置を削除する店舗を選択してください。',
    components: [row],
    ephemeral: true 
  });
}

module.exports = {
  handleHikkakeSetup,
  handleResponseConfig,
  handleHikkakeDelete,
};
