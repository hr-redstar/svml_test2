// common/gcs/gcsUtils.js
const { Storage } = require('@google-cloud/storage');
const logger = require('../logger');
const path = require('path'); // pathモジュールを追加

const bucketName = process.env.GCS_BUCKET_NAME;
if (!bucketName) {
  logger.warn('[gcsUtils] 警告: 環境変数 GCS_BUCKET_NAME が設定されていません。GCS機能は無効化されます。');
  
  // GCS機能を無効化した場合のダミー関数をエクスポート
  module.exports = {
    exists: async () => false,
    upload: async () => { throw new Error('GCS機能が無効です'); },
    download: async () => { throw new Error('GCS機能が無効です'); },
    delete: async () => { throw new Error('GCS機能が無効です'); },
    list: async () => []
  };
  return;
}

let storageOptions = {};

// GOOGLE_APPLICATION_CREDENTIALS が設定されている場合
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const keyFilename = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  storageOptions.keyFilename = keyFilename;
  logger.info(`[gcsUtils] GOOGLE_APPLICATION_CREDENTIALS から認証情報をロードしました: ${keyFilename}`);
} 
// GCP_SA_KEY が設定されている場合 (GitHub Actionsなど)
else if (process.env.GCP_SA_KEY) {
  try {
    const saKeyJson = Buffer.from(process.env.GCP_SA_KEY, 'base64').toString('utf8');
    storageOptions.credentials = JSON.parse(saKeyJson);
    logger.info('[gcsUtils] GCP_SA_KEY から認証情報をロードしました。');
  } catch (e) {
    logger.error('[gcsUtils] GCP_SA_KEYのデコードまたはパースに失敗しました:', e);
    // エラーが発生しても、Storage()がデフォルトの認証情報を見つけようとするように、credentialsは設定しない
  }
} else {
  logger.warn('[gcsUtils] 警告: GCS認証情報 (GOOGLE_APPLICATION_CREDENTIALS または GCP_SA_KEY) が設定されていません。デフォルトの認証情報を使用します。');
}


const storage = new Storage(storageOptions);
const bucket = storage.bucket(bucketName);

/**
 * 指定したファイルがGCSに存在するか確認する
 * @param {string} filePath 
 * @returns {Promise<boolean>}
 */
async function exists(filePath) {
  try {
    const file = bucket.file(filePath);
    const [exists] = await file.exists();
    return exists;
  } catch (error) {
    logger.error(`[gcsUtils.exists] ファイル存在チェックエラー: ${filePath}`, error);
    throw error;
  }
}

/**
 * GCSにJSONデータを保存する
 * @param {string} filePath GCS上のファイルパス
 * @param {object} data JSONオブジェクト
 * @returns {Promise<boolean>} 成功したらtrue
 * @throws エラー時に例外スロー
 */
async function saveJsonToGCS(filePath, data) {
  try {
    logger.debug(`[gcsUtils.saveJsonToGCS] 保存開始 - Cloud Run詳細:`, {
      filePath,
      bucket: bucketName,
      dataSize: JSON.stringify(data).length,
      nodeEnv: process.env.NODE_ENV,
      hasCredentials: !!(process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GCP_SA_KEY),
      isCloudRun: !!process.env.K_SERVICE,
      projectId: process.env.GOOGLE_CLOUD_PROJECT || 'unknown'
    });
    
    logger.debug(`[gcsUtils.saveJsonToGCS] 📝 保存開始: ${filePath}`, {
      bucket: bucketName,
      dataType: typeof data,
      dataKeys: data ? Object.keys(data) : null,
      contentLength: JSON.stringify(data).length
    });
    
    // バケット接続テスト
    try {
      await bucket.getMetadata();
      logger.debug(`[gcsUtils] バケットアクセス成功: ${bucketName}`);
    } catch (bucketError) {
      logger.error(`[gcsUtils] バケットアクセス失敗:`, {
        bucket: bucketName,
        error: bucketError.message,
        code: bucketError.code
      });
      throw bucketError; // 再スロー
    }
    
    const file = bucket.file(filePath);
    const content = JSON.stringify(data, null, 2);
    
    logger.debug(`[gcsUtils] ファイル保存実行: ${filePath}`);
    await file.save(content, {
      contentType: 'application/json',
      resumable: false,
    });
    
    logger.info(`[gcsUtils] 保存成功: ${filePath}`, {
      size: content.length,
      timestamp: new Date().toISOString()
    });
    
    logger.info(`[gcsUtils.saveJsonToGCS] 💾 ${filePath} にJSONを保存しました。`);
    return true;
  } catch (error) {
    logger.error(`[gcsUtils] 保存エラー詳細:`, {
      filePath,
      bucket: bucketName,
      error: error.message,
      code: error.code,
      status: error.status,
      stack: error.stack,
      details: error.details,
      errors: error.errors
    });
    
    logger.error(`[gcsUtils.saveJsonToGCS] ❌ 保存エラー: ${filePath}`, {
      error: error.message,
      code: error.code,
      status: error.status,
      bucket: bucketName,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * GCSからJSONファイルを読み込む
 * @param {string} filePath GCSのファイルパス
 * @param {any} [defaultValue=null] ファイルが存在しない場合に返すデフォルト値
 * @returns {Promise<object|any>} JSONオブジェクト。存在しなければ`defaultValue`
 * @throws エラー時に例外スロー（404はnull返し）
 */
async function readJsonFromGCS(filePath, defaultValue = null) {
  try {
    const file = bucket.file(filePath);
    const [existsFlag] = await file.exists();
    if (!existsFlag) return defaultValue;

    const [content] = await file.download();
    return JSON.parse(content.toString('utf8'));
  } catch (error) {
    if (error.code === 404) {
      return defaultValue;
    }
    logger.error(`[gcsUtils.readJsonFromGCS] ❌ 読み込みエラー: ${filePath}`, error);
    throw error;
  }
}

/**
 * GCSでprefixにマッチするファイル一覧を取得
 * @param {string} prefix ファイルパスのプレフィックス
 * @returns {Promise<Array>} ファイルオブジェクト配列
 * @throws 例外スロー
 */
async function listFilesInGCS(prefix) {
  try {
    const [files] = await bucket.getFiles({ prefix });
    return files;
  } catch (error) {
    logger.error(`[gcsUtils.listFilesInGCS] ❌ ファイル一覧取得エラー: ${prefix}`, error);
    throw error;
  }
}

/**
 * GCS上の指定ファイルを削除
 * @param {string} filePath 削除対象ファイルパス
 * @returns {Promise<boolean>} 削除成功でtrue
 * @throws 例外スロー（404は無視）
 */
async function deleteGCSFile(filePath) {
  try {
    await bucket.file(filePath).delete();
    logger.info(`[gcsUtils.deleteGCSFile] 🗑️ ${filePath} を削除しました。`);
    return true;
  } catch (error) {
    if (error.code === 404) {
      // ファイルなしは削除成功とみなす
      return true;
    }
    logger.error(`[gcsUtils.deleteGCSFile] ❌ 削除エラー: ${filePath}`, error);
    throw error;
  }
}

module.exports = {
  exists,
  saveJsonToGCS,
  readJsonFromGCS,
  listFilesInGCS,
  deleteGCSFile,
};
