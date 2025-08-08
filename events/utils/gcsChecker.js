// events/utils/gcsChecker.js - Google Cloud Storage 接続確認ユーティリティ
const { Storage } = require('@google-cloud/storage');
const logger = require('../../common/logger').createModuleLogger('gcs-checker');
const path = require('path');

/**
 * Google Cloud Storageへの接続を確認・テストします
 * @returns {Promise<Object>} 接続結果オブジェクト
 */
async function checkGcsConnection() {
  const bucketName = process.env.GCS_BUCKET_NAME;
  if (!bucketName) {
    logger.warn('🟡 GCS_BUCKET_NAME未設定 - GCS機能は無効です');
    return { connected: false, reason: 'BUCKET_NAME_MISSING' };
  }

  const keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!keyFilename) {
    logger.error('❌ GOOGLE_APPLICATION_CREDENTIALS が設定されていません。');
    return { connected: false, reason: 'CREDENTIALS_MISSING' };
  }

  const absoluteKeyFilename = path.resolve(keyFilename);

  const startTime = Date.now();
  try {
    logger.info(`🔍 GCSバケット接続確認中: ${bucketName}`);
    
    const storage = new Storage({ keyFilename: absoluteKeyFilename });
    const bucket = storage.bucket(bucketName);
    
    // 接続テスト1: バケットの存在確認
    const [exists] = await bucket.exists();
    if (!exists) {
      logger.error(`❌ GCSバケット "${bucketName}" が見つかりません`);
      logger.error('💡 ヒント: .env の GCS_BUCKET_NAME が正しいか確認してください');
      return { connected: false, reason: 'BUCKET_NOT_FOUND' };
    }
    
    // 接続テスト2: バケットのメタデータ取得（権限確認）
    const [metadata] = await bucket.getMetadata();
    const connectionTime = Date.now() - startTime;
    
    logger.info(`✅ GCSバケット "${bucketName}" への接続確認完了 (${connectionTime}ms)`);
    logger.debug('📋 バケット情報', {
      バケット名: metadata.name,
      場所: metadata.location,
      ストレージクラス: metadata.storageClass,
      作成日: metadata.timeCreated,
    });
    
    // 接続テスト3: 読み取り権限テスト（オプション）
    try {
      const [files] = await bucket.getFiles({ maxResults: 1 });
      logger.debug(`📁 バケット内ファイル数（サンプル）: ${files.length}個以上`);
    } catch (listError) {
      logger.warn('⚠️ ファイル一覧取得に失敗 - 読み取り権限を確認してください');
      logger.debug('📚 リストエラー', { エラー: listError.message });
    }
    
    return { 
      connected: true, 
      bucketName, 
      location: metadata.location,
      connectionTime 
    };
    
  } catch (error) {
    const connectionTime = Date.now() - startTime;
    logger.error(`❌ GCSバケット "${bucketName}" への接続失敗 (${connectionTime}ms)`);
    logger.error(`🔍 エラー詳細:`, {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code, // GCSエラーの場合、codeプロパティがあることが多い
      errors: error.errors // 詳細なエラー情報が含まれる場合がある
    });
    
    // 環境別のヒント提供
    if (process.env.K_SERVICE) {
      logger.error('💡 Cloud Run環境のヒント:');
      logger.error('  • Cloud Runサービスアカウントに適切なGCS権限が付与されているか確認');
      logger.error('  • 権限例: roles/storage.admin または roles/storage.objectAdmin');
    } else {
      logger.error('💡 ローカル環境のヒント:');
      logger.error('  • GOOGLE_APPLICATION_CREDENTIALS が正しく設定されているか確認');
      logger.error('  • サービスアカウントキーに適切なGCS権限が付与されているか確認');
      logger.error(`  • 認証ファイル: ${absoluteKeyFilename || '未設定'}`);
    }
    
    return { 
      connected: false, 
      reason: 'CONNECTION_ERROR', 
      error: error,
      connectionTime 
    };
  }
}

module.exports = {
  checkGcsConnection
};
