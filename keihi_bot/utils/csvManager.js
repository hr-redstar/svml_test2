// keihi_bot/utils/csvManager.js
const fs = require('fs').promises;
const path = require('path');
const logger = require('../../common/logger');

/**
 * 経費申請データをCSVに保存
 */
async function saveExpenseToCsv(guildId, expenseData) {
  try {
    const { userId, userName, amount, category, purpose, date, applicationId } = expenseData;
    
    // CSV行データを作成
    const csvRow = [
      date,
      userName,
      userId,
      category,
      amount,
      purpose,
      applicationId,
      '申請中',
      '',
      new Date().toISOString()
    ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
    
    // ファイル名生成
    const fileName = `${date}_${userId}_経費申請.csv`;
    const filePath = getExpenseFilePath(guildId, fileName);
    
    // ヘッダーの確認と追加
    const header = '"申請日","申請者名","申請者ID","カテゴリ","金額","用途","申請ID","ステータス","承認者","処理日時"';
    
    try {
      await fs.access(filePath);
      // ファイルが存在する場合は行のみ追加
      await fs.appendFile(filePath, '\n' + csvRow, 'utf8');
    } catch (error) {
      // ファイルが存在しない場合はヘッダー付きで作成
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, header + '\n' + csvRow, 'utf8');
    }
    
    logger.info(`[CSV] 経費申請データ保存完了: ${fileName}`);
    return filePath;
    
  } catch (error) {
    logger.error('[CSV] 経費申請データ保存エラー:', error);
    throw error;
  }
}

/**
 * 統合CSVを作成（月次・四半期）
 */
async function createConsolidatedCsv(guildId, period, selectedDates) {
  try {
    const consolidatedData = [];
    const header = '"申請日","申請者名","申請者ID","カテゴリ","金額","用途","申請ID","ステータス","承認者","処理日時"';
    
    // 各日付のCSVファイルを読み込み
    for (const date of selectedDates) {
      const dateFiles = await getExpenseFilesByDate(guildId, date);
      
      for (const file of dateFiles) {
        try {
          const content = await fs.readFile(file, 'utf8');
          const lines = content.split('\n').slice(1); // ヘッダーを除く
          consolidatedData.push(...lines.filter(line => line.trim()));
        } catch (readError) {
          logger.warn(`[CSV] ファイル読み込みエラー: ${file}`, readError.message);
        }
      }
    }
    
    // 統合ファイル名生成
    const fileName = generateConsolidatedFileName(period, selectedDates);
    const filePath = getConsolidatedFilePath(guildId, fileName);
    
    // 統合CSVファイル作成
    const consolidatedContent = header + '\n' + consolidatedData.join('\n');
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, consolidatedContent, 'utf8');
    
    logger.info(`[CSV] 統合CSV作成完了: ${fileName}`);
    return {
      filePath,
      fileName,
      recordCount: consolidatedData.length
    };
    
  } catch (error) {
    logger.error('[CSV] 統合CSV作成エラー:', error);
    throw error;
  }
}

/**
 * 承認処理時のCSV更新
 */
async function updateExpenseStatus(guildId, applicationId, status, approverName) {
  try {
    const expenseFiles = await getAllExpenseFiles(guildId);
    
    for (const file of expenseFiles) {
      const content = await fs.readFile(file, 'utf8');
      const lines = content.split('\n');
      
      let updated = false;
      const updatedLines = lines.map(line => {
        if (line.includes(`"${applicationId}"`)) {
          const fields = parseCSVLine(line);
          if (fields.length >= 10) {
            fields[7] = `"${status}"`;  // ステータス更新
            fields[8] = `"${approverName}"`;  // 承認者設定
            fields[9] = `"${new Date().toISOString()}"`;  // 処理日時更新
            updated = true;
            return fields.join(',');
          }
        }
        return line;
      });
      
      if (updated) {
        await fs.writeFile(file, updatedLines.join('\n'), 'utf8');
        logger.info(`[CSV] 申請ステータス更新完了: ${applicationId} -> ${status}`);
        return file;
      }
    }
    
    logger.warn(`[CSV] 申請ID不見当: ${applicationId}`);
    return null;
    
  } catch (error) {
    logger.error('[CSV] ステータス更新エラー:', error);
    throw error;
  }
}

/**
 * 利用可能な申請日取得
 */
async function getAvailableDates(guildId) {
  try {
    const expenseDir = getExpenseDir(guildId);
    const files = await fs.readdir(expenseDir).catch(() => []);
    
    const dates = files
      .filter(file => file.endsWith('_経費申請.csv'))
      .map(file => file.split('_')[0])
      .filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date))
      .sort()
      .reverse(); // 新しい順
    
    return [...new Set(dates)]; // 重複除去
    
  } catch (error) {
    logger.error('[CSV] 利用可能日付取得エラー:', error);
    return [];
  }
}

/**
 * 利用可能な年月取得
 */
async function getAvailableMonths(guildId) {
  try {
    const dates = await getAvailableDates(guildId);
    const months = dates
      .map(date => date.substring(0, 7)) // YYYY-MM
      .sort()
      .reverse();
    
    return [...new Set(months)];
    
  } catch (error) {
    logger.error('[CSV] 利用可能月取得エラー:', error);
    return [];
  }
}

/**
 * 利用可能な四半期取得
 */
async function getAvailableQuarters(guildId) {
  try {
    const months = await getAvailableMonths(guildId);
    const quarters = months.map(month => {
      const [year, monthNum] = month.split('-');
      const quarter = Math.ceil(parseInt(monthNum) / 3);
      return `${year}年${quarter}Q (${quarter === 1 ? '1-3月' : quarter === 2 ? '4-6月' : quarter === 3 ? '7-9月' : '10-12月'})`;
    }).sort().reverse();
    
    return [...new Set(quarters)];
    
  } catch (error) {
    logger.error('[CSV] 利用可能四半期取得エラー:', error);
    return [];
  }
}

// ===== ヘルパー関数 =====

function getExpenseDir(guildId) {
  return path.join(process.cwd(), 'data', guildId, 'keihi', 'applications');
}

function getConsolidatedDir(guildId) {
  return path.join(process.cwd(), 'data', guildId, 'keihi', 'generated');
}

function getExpenseFilePath(guildId, fileName) {
  return path.join(getExpenseDir(guildId), fileName);
}

function getConsolidatedFilePath(guildId, fileName) {
  return path.join(getConsolidatedDir(guildId), fileName);
}

async function getExpenseFilesByDate(guildId, date) {
  try {
    const expenseDir = getExpenseDir(guildId);
    const files = await fs.readdir(expenseDir).catch(() => []);
    
    return files
      .filter(file => file.startsWith(date) && file.endsWith('_経費申請.csv'))
      .map(file => path.join(expenseDir, file));
  } catch (error) {
    return [];
  }
}

async function getAllExpenseFiles(guildId) {
  try {
    const expenseDir = getExpenseDir(guildId);
    const files = await fs.readdir(expenseDir).catch(() => []);
    
    return files
      .filter(file => file.endsWith('_経費申請.csv'))
      .map(file => path.join(expenseDir, file));
  } catch (error) {
    return [];
  }
}

function generateConsolidatedFileName(period, selectedDates) {
  const timestamp = new Date().toISOString().slice(0, 16).replace(/[T:]/g, '_');
  
  if (period === 'monthly') {
    const months = [...new Set(selectedDates.map(d => d.substring(0, 7)))].sort();
    return `【確定】${months.join('_')}_経費申請_${timestamp}.csv`;
  } else if (period === 'quarterly') {
    const quarters = [...new Set(selectedDates.map(d => {
      const month = parseInt(d.substring(5, 7));
      const year = d.substring(0, 4);
      const q = Math.ceil(month / 3);
      return `${year}年${q}Q`;
    }))].sort();
    return `【確定】${quarters.join('_')}_経費申請_${timestamp}.csv`;
  } else {
    return `【確定】${selectedDates[0]}_${selectedDates[selectedDates.length - 1]}_経費申請_${timestamp}.csv`;
  }
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"' && (i === 0 || line[i - 1] === ',')) {
      inQuotes = true;
    } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i + 1] === ',')) {
      inQuotes = false;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

module.exports = {
  saveExpenseToCsv,
  createConsolidatedCsv,
  updateExpenseStatus,
  getAvailableDates,
  getAvailableMonths,
  getAvailableQuarters
};
