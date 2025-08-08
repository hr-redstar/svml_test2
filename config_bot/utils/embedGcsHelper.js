// config_bot/utils/embedGcsHelper.js

/**
 * GCS連携APIの本番/ダミー切り替えラッパー
 */
const embedGcsApi = process.env.GCS_USE_REAL === 'true'
  ? require('./embedGcsApi')
  : require('./embedGcsDummy');

class EmbedGcsHelper {
  constructor() {
    this.api = embedGcsApi;
    this.bucketName = this.api.bucketName;
    this.storage = this.api.storage;
  }

  // APIラッパー
  async saveEmbed(guildId, embedData) {
    return await this.api.saveEmbed(guildId, embedData);
  }
  async listEmbeds(guildId) {
    return await this.api.listEmbeds(guildId);
  }
  async getEmbed(guildId, embedPath) {
    return await this.api.getEmbed(guildId, embedPath);
  }
  async updateEmbed(guildId, embedPath, newContent) {
    return await this.api.updateEmbed(guildId, embedPath, newContent);
  }
  async clearCache(guildId) {
    return await this.api.clearCache(guildId);
  }
}

module.exports = new EmbedGcsHelper();