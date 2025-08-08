// common/gcs/gcsCsvHelper.js
const { Storage } = require('@google-cloud/storage');
const storage = new Storage();
const logger = require('@common/logger');
const { stringify } = require('csv-stringify/sync');

/**
 * Appends a row or rows to a CSV file in GCS. Creates the file with a header if it doesn't exist.
 * @param {string} bucketName The GCS bucket name.
 * @param {string} filePath The path to the file within the bucket.
 * @param {string[]} header The header row for the CSV.
 * @param {Array<Array<string|number|boolean>>} rows The row(s) to append.
 */
async function appendToCsv(bucketName, filePath, header, rows) {
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(filePath);

  try {
    let existingContent = '';
    const [exists] = await file.exists();

    if (exists) {
      const [buffer] = await file.download();
      existingContent = buffer.toString('utf-8');
    }

    let newContent;
    if (!existingContent) {
      // Create new file with header
      newContent = stringify([header, ...rows]);
    } else {
      // Append to existing file (without header)
      const appendContent = stringify(rows);
      newContent = existingContent.trimEnd() + '\n' + appendContent;
    }

    await file.save(newContent, { contentType: 'text/csv' });
    logger.info(`[gcsCsvHelper] ✅ ${filePath} にデータを追記しました。`);

  } catch (error) {
    logger.error(`[gcsCsvHelper] ❌ GCS上のCSVファイルへの書き込みに失敗しました: ${filePath}`, { error });
    throw error;
  }
}

/**
 * Saves content to a file in GCS
 * @param {string} bucketName The GCS bucket name.
 * @param {string} filePath The path to the file within the bucket.
 * @param {string} content The content to save.
 * @param {string} contentType The content type (default: 'application/json').
 */
async function saveToGcs(bucketName, filePath, content, contentType = 'application/json') {
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(filePath);

  try {
    await file.save(content, { contentType });
    logger.info(`[gcsCsvHelper] ✅ ${filePath} にファイルを保存しました。`);
  } catch (error) {
    logger.error(`[gcsCsvHelper] ❌ GCSへのファイル保存に失敗しました: ${filePath}`, { error });
    throw error;
  }
}

module.exports = { appendToCsv, saveToGcs };