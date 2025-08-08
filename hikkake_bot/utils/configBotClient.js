// hikkake_bot/utils/configBotClient.js

const { getConfig, getGuildTextChannels: getTextChannels } = require('../../config_bot/utils/configStateManager');

async function getConfigBotStores(guildId) {
  const config = await getConfig(guildId);
  return config.stores || [];
}

async function getGuildTextChannels(guildId) {
    return await getTextChannels(guildId);
}

module.exports = { getConfigBotStores, getGuildTextChannels };
