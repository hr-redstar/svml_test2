// hikkake_bot/utils/hikkakeReactionManager.js
const { readJsonFromGCS, saveJsonToGCS } = require('@common/gcs/gcsUtils');
const logger = require('@common/logger');

const REACTIONS_PATH = (guildId) => `hikkake_bot/${guildId}/reactions.json`;

/**
 * Reads the custom reaction configurations for a guild.
 * @param {string} guildId The ID of the guild.
 * @returns {Promise<object>} The reactions configuration object.
 */
async function readReactions(guildId) {
  // Default structure: { quest: { num: {}, count: {} }, tosu: {...}, horse: {...} }
  const defaultReactions = {
    quest: { num: {}, count: {} },
    tosu: { num: {}, count: {} },
    horse: { num: {}, count: {} },
  };
  const reactions = await readJsonFromGCS(REACTIONS_PATH(guildId), defaultReactions);
  return { ...defaultReactions, ...reactions };
}

/**
 * Writes the custom reaction configurations for a guild.
 * @param {string} guildId The ID of the guild.
 * @param {object} reactions The reactions configuration object to save.
 * @returns {Promise<void>}
 */
async function writeReactions(guildId, reactions) {
  await saveJsonToGCS(REACTIONS_PATH(guildId), reactions);
}

module.exports = {
  readReactions,
  writeReactions,
};