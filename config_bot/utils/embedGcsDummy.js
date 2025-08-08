// config_bot/utils/embedGcsDummy.js
// GCS連携API（ダミー・テスト用）

const logger = require('../../common/logger');

class EmbedGcsDummy {
  constructor() {
    this.bucketName = process.env.GCS_BUCKET_NAME;
    this.storage = {}; // ダミー
  }

  async saveEmbed(guildId, embedData) {
    logger.info('ダミー: saveEmbed', { guildId, embedData });
    return { success: true, path: 'dummy/path' };
  }

  async listEmbeds(guildId) {
    logger.info('ダミー: listEmbeds', { guildId });
    return { success: true, embeds: [] };
  }

  async getEmbed(guildId, embedPath) {
    logger.info('ダミー: getEmbed', { guildId, embedPath });
    return { success: true, content: {}, metadata: {}, history: [] };
  }

  async updateEmbed(guildId, embedPath, newContent) {
    logger.info('ダミー: updateEmbed', { guildId, embedPath, newContent });
    return { success: true };
  }

  async clearCache(guildId) {
    logger.info('ダミー: clearCache', { guildId });
    return { success: true };
  }
}

module.exports = new EmbedGcsDummy();
