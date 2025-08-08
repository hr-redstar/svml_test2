// hikkake_bot/utils/hikkakeCsvLogger.js
const { appendToCsv } = require('../../common/gcs/gcsCsvHelper');
const { DateTime } = require('luxon');

const BUCKET_NAME = process.env.GCS_BUCKET_NAME;
const CSV_HEADER = ['timestamp', 'event_type', 'user_id', 'user_name', 'store', 'details_json'];

function getLogFilePath(guildId) {
  const today = DateTime.now().setZone('Asia/Tokyo').toFormat('yyyy-MM-dd');
  return `${guildId}/hikkake/logs/ひっかけ_${today}.csv`;
}

/**
 * Logs a hikkake event to a daily CSV file.
 * @param {string} guildId
 * @param {{type: string, user: import('discord.js').User, details: object}} eventData
 */
async function logHikkakeEvent(guildId, eventData) {
  if (!BUCKET_NAME) return;

  const filePath = getLogFilePath(guildId);
  const timestamp = DateTime.now().toISO();

  const row = [
    timestamp,
    eventData.type,
    eventData.user.id,
    eventData.user.username,
    eventData.details.store || 'N/A',
    JSON.stringify(eventData.details),
  ];

  // await appendToCsv(BUCKET_NAME, filePath, CSV_HEADER, [row]);
}

module.exports = { logHikkakeEvent };