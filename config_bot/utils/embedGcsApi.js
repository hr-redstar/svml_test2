// config_bot/utils/embedGcsApi.js
// GCS連携API（本番用）

const { Storage } = require('@google-cloud/storage');
const path = require('path');
const crypto = require('crypto');
const logger = require('../../common/logger');
const performanceManager = require('../../common/performance/performanceManager');

class EmbedGcsApi {
  constructor() {
    this.bucketName = process.env.GCS_BUCKET_NAME;
    this.storage = new Storage({
      keyFilename: path.join(process.cwd(), 'data', 'svml_key.json'),
      projectId: process.env.GOOGLE_CLOUD_PROJECT
    });
  }

  // ...本番用のsaveEmbed, listEmbeds, getEmbed, updateEmbed, clearCache実装...
  // ここでは省略（embedGcsHelper.jsから移植可能）
}

module.exports = new EmbedGcsApi();
