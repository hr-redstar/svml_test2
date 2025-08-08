// events/utils/taskScheduler.js - 定期タスク管理ユーティリティ
const logger = require('../../common/logger').createModuleLogger('task-scheduler');

// Bot 機能モジュールのユーティリティ関数
const { startLogCleanupInterval } = require('../../hikkake_bot/utils/panelStateManager.js');
// const { scheduleDailyPanelTask } = require('@root/syuttaikin_bot/tasks/dailyPanelTask'); // 🚫 無効化済み

/**
 * 定期タスクの初期化と開始
 * @param {import('discord.js').Client} client Discordクライアント
 * @returns {Promise<Object>} タスク初期化結果
 */
async function initializeScheduledTasks(client) {
  logger.info('⏰ 定期タスク初期化開始...');
  const taskResults = [];
  
  try {
    // ひっかけBot: ログクリーンアップタスク
    logger.debug('🧹 ログクリーンアップタスク開始中...');
    await startLogCleanupInterval(client);
    taskResults.push({ task: 'logCleanup', status: 'started', module: 'hikkake_bot' });
    logger.info('✅ ログクリーンアップタスク開始完了');
    
  } catch (error) {
    logger.error('❌ ログクリーンアップタスク開始失敗', { エラー: error.message });
    taskResults.push({ task: 'logCleanup', status: 'failed', error: error.message });
  }
  
  // 🚫 出退勤Bot無効化のため日次パネルタスクをスキップ
  logger.debug('📅 日次パネルタスク: syuttaikin_bot無効化のためスキップ');
  taskResults.push({ task: 'dailyPanel', status: 'skipped', module: 'syuttaikin_bot.disabled' });
  
  /*
  try {
    // 出退勤Bot: 日次パネルタスク
    logger.debug('📅 日次パネルタスク開始中...');
    await scheduleDailyPanelTask(client);
    taskResults.push({ task: 'dailyPanel', status: 'started', module: 'syuttaikin_bot' });
    logger.info('✅ 日次パネルタスク開始完了');
    
  } catch (error) {
    logger.error('❌ 日次パネルタスク開始失敗', { エラー: error.message });
    taskResults.push({ task: 'dailyPanel', status: 'failed', error: error.message });
  }
  */
  
  const successfulTasks = taskResults.filter(t => t.status === 'started').length;
  const failedTasks = taskResults.filter(t => t.status === 'failed').length;
  const skippedTasks = taskResults.filter(t => t.status === 'skipped').length;
  
  logger.info(`⏰ 定期タスク初期化完了: ${successfulTasks}個成功, ${failedTasks}個失敗, ${skippedTasks}個スキップ`);
  
  return { taskResults, successfulTasks, failedTasks, skippedTasks };
}

/**
 * メモリ使用量をログ出力
 */
function logMemoryUsage() {
  const usage = process.memoryUsage();
  const formatMB = (bytes) => Math.round(bytes / 1024 / 1024 * 100) / 100;
  
  logger.info(`💾 メモリ使用量: RSS=${formatMB(usage.rss)}MB, Heap=${formatMB(usage.heapUsed)}/${formatMB(usage.heapTotal)}MB`);
  
  // メモリ使用量が高い場合は警告
  const heapUsedMB = formatMB(usage.heapUsed);
  if (heapUsedMB > 800) { // 800MB以上で警告
    logger.warn(`⚠️ 高メモリ使用量検出: ${heapUsedMB}MB`);
  }
  
  return {
    rss: formatMB(usage.rss),
    heapUsed: formatMB(usage.heapUsed),
    heapTotal: formatMB(usage.heapTotal),
    external: formatMB(usage.external)
  };
}

module.exports = {
  initializeScheduledTasks,
  logMemoryUsage
};