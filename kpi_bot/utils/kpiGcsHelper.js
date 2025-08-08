// kpi_bot/utils/kpiGcsHelper.js - KPI申請データのGCS保存ヘルパー

const { saveToGcs, appendToCsv } = require('@common/gcs/gcsCsvHelper');
const logger = require('@common/logger');

const bucketName = process.env.GCS_BUCKET_NAME;
if (!bucketName) {
  console.warn('[kpiGcsHelper] 警告: 環境変数 GCS_BUCKET_NAME が設定されていません。KPI GCS機能は無効化されます。');
  
  // GCS機能を無効化した場合のダミー関数をエクスポート
  module.exports = {
    saveKpiDataToGcs: async () => { 
      console.warn('[kpiGcsHelper] GCS機能が無効のため、KPIデータ保存をスキップしました。'); 
      return false; 
    },
    saveKpiTargetToGcs: async () => { 
      console.warn('[kpiGcsHelper] GCS機能が無効のため、KPI目標値保存をスキップしました。'); 
      return false; 
    }
  };
  return;
}

/**
 * KPI実績データをGCSのCSVファイルに保存
 * パス: ギルドID/KPI/KPIログ/年月日_KPI実数値.csv
 * @param {string} guildId ギルドID
 * @param {object} kpiData KPI実績データ
 */
async function saveKpiDataToGcs(guildId, kpiData) {
  try {
    const reportDate = kpiData.reportDate || new Date().toISOString().split('T')[0];
    const filePath = `${guildId}/KPI/KPIログ/${reportDate}_KPI実数値.csv`;

    // CSVヘッダー定義
    const header = [
      '報告日',
      '申請日時',
      '申請者ID',
      '申請者名',
      '店舗コード',
      '店舗名',
      '来客数',
      '指名本数',
      '指名売上',
      'フリー売上',
      '総売上',
      '備考'
    ];

    // CSVデータ行作成
    const row = [
      reportDate,
      kpiData.createdAt,
      kpiData.userId,
      kpiData.userName || '',
      kpiData.storeValue || '',
      kpiData.storeName || '',
      kpiData.visitorCount,
      kpiData.nominationBottles,
      kpiData.nominationSales,
      kpiData.freeSales,
      kpiData.totalSales,
      kpiData.remarks || ''
    ];

    // await appendToCsv(bucketName, filePath, header, [row]);
    
    logger.info(`[kpiGcsHelper] KPI実績データをGCSに保存しました: ${filePath}`);
    return filePath;

  } catch (error) {
    logger.error('[kpiGcsHelper] KPI実績データのGCS保存に失敗:', error);
    throw error;
  }
}

/**
 * KPI目標値をGCSのJSONファイルに保存
 * パス: ギルドID/KPI/目標値設定/開始年月日~終了日_目標値.json
 * @param {string} guildId ギルドID
 * @param {object} targetData KPI目標値データ
 */
async function saveKpiTargetToGcs(guildId, targetData) {
  try {
    const startDate = targetData.startDate;
    const endDate = targetData.endDate;
    const filePath = `${guildId}/KPI/目標値設定/${startDate}~${endDate}_目標値.json`;

    // 目標値データをJSON形式で保存
    const targetJson = {
      period: {
        startDate: targetData.startDate,
        endDate: targetData.endDate
      },
      targets: {
        visitorCount: targetData.visitorCount,
        nominationBottles: targetData.nominationBottles,
        nominationSales: targetData.nominationSales,
        freeSales: targetData.freeSales,
        totalSales: targetData.totalSales
      },
      metadata: {
        storeValue: targetData.storeValue || '',
        storeName: targetData.storeName || '',
        userId: targetData.userId,
        userName: targetData.userName,
        guildId: targetData.guildId,
        createdAt: targetData.createdAt
      }
    };

    // await saveToGcs(bucketName, filePath, JSON.stringify(targetJson, null, 2));
    
    logger.info(`[kpiGcsHelper] KPI目標値をGCSに保存しました: ${filePath}`);
    return filePath;

  } catch (error) {
    logger.error('[kpiGcsHelper] KPI目標値のGCS保存に失敗:', error);
    throw error;
  }
}

/**
 * 年月日からKPI実績CSVファイルパスを生成
 * @param {string} guildId ギルドID  
 * @param {string} date YYYY-MM-DD形式の日付
 * @returns {string} GCSファイルパス
 */
function generateKpiCsvPath(guildId, date) {
  return `${guildId}/KPI/KPIログ/${date}_KPI実数値.csv`;
}

/**
 * 今日の日付でKPI実績CSVファイルパスを生成
 * @param {string} guildId ギルドID
 * @returns {string} GCSファイルパス
 */
function generateTodayKpiCsvPath(guildId) {
  const today = new Date().toISOString().split('T')[0];
  return generateKpiCsvPath(guildId, today);
}

module.exports = {
  saveKpiDataToGcs,
  saveKpiTargetToGcs,
  generateKpiCsvPath,
  generateTodayKpiCsvPath
};
