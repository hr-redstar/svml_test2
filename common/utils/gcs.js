const { Storage } = require('@google-cloud/storage');
const logger = require('@common/logger');

const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME;
if (!bucketName) {
    logger.warn('⚠️ 警告: 環境変数 GCS_BUCKET_NAME が設定されていません。GCS機能は無効化されます。');
    
    // GCS機能を無効化した場合のダミー関数をエクスポート
    module.exports = {
        uploadToGcs: async () => { 
            logger.warn('[gcs] GCS機能が無効のため、アップロードをスキップしました。'); 
            return false; 
        },
        downloadFromGcs: async () => { 
            logger.warn('[gcs] GCS機能が無効のため、ダウンロードをスキップしました。'); 
            return null; 
        }
    };
    return;
}