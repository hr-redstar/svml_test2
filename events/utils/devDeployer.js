// events/utils/devDeployer.js - 開発環境コマンドデプロイユーティリティ
const path = require('path');
const { exec } = require('node:child_process');
const logger = require('../../common/logger').createModuleLogger('dev-deployer');

/**
 * 開発環境でのコマンド自動デプロイ
 * @returns {Promise<Object>} デプロイ結果
 */
async function deployDevCommands() {
  if (!process.env.GUILD_ID) {
    logger.debug('🚀 本番環境モード - コマンド自動デプロイをスキップ');
    return { deployed: false, reason: 'PRODUCTION_MODE' };
  }

  logger.info('🛠️ 開発環境を検出 - コマンド自動デプロイを開始...');
  const scriptPath = path.join(__dirname, '..', 'deploy-commands.js');
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    const deployProcess = exec(`node "${scriptPath}"`);
    
    let stdout = '';
    let stderr = '';
    
    deployProcess.stdout.on('data', (data) => {
      stdout += data;
      logger.debug(`📤 [DEV-DEPLOY] ${data.toString().trim()}`);
    });

    deployProcess.stderr.on('data', (data) => {
      stderr += data;
      logger.warn(`⚠️ [DEV-DEPLOY] ${data.toString().trim()}`);
    });

    deployProcess.on('close', (code) => {
      const deployTime = Date.now() - startTime;
      
      if (code === 0) {
        logger.info(`✅ コマンド自動デプロイ完了 (${deployTime}ms)`);
        resolve({ deployed: true, exitCode: code, deployTime });
      } else {
        logger.error(`❌ コマンド自動デプロイ失敗 (${deployTime}ms) - 終了コード: ${code}`);
        if (stderr) {
          logger.error('🔍 デプロイエラー', { エラー内容: stderr.trim() });
        }
        resolve({ deployed: false, exitCode: code, deployTime, error: stderr });
      }
    });

    deployProcess.on('error', (error) => {
      const deployTime = Date.now() - startTime;
      logger.error(`💥 デプロイプロセス起動失敗 (${deployTime}ms)`, { エラー: error.message });
      resolve({ deployed: false, deployTime, error: error.message });
    });
  });
}

module.exports = {
  deployDevCommands
};