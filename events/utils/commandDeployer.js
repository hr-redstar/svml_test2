// events/utils/commandDeployer.js - Discord Command Deployment Utility
const { spawn } = require('child_process');
const path = require('path');
const logger = require('../../common/logger').createModuleLogger('command-deployer');

/**
 * Discord スラッシュコマンドを自動デプロイ
 * @param {import('discord.js').Client} client Discord クライアント
 * @returns {Promise<{deployed: boolean, reason: string, commands?: number}>}
 */
async function deployDiscordCommands(client) {
  return new Promise((resolve) => {
    try {
      // 環境変数チェック
      const requiredEnvVars = ['DISCORD_TOKEN', 'CLIENT_ID'];
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        logger.warn(`⚠️ 必須環境変数が未設定: ${missingVars.join(', ')}`);
        return resolve({ deployed: false, reason: 'MISSING_ENV_VARS' });
      }

      // Cloud Run環境でのデプロイ制御
      const isCloudRun = Boolean(process.env.PORT && !process.env.K_SERVICE);
      const isProduction = process.env.NODE_ENV === 'production';
      const forceAutorun = process.env.AUTO_DEPLOY_COMMANDS === 'true';
      const skipAutorun = process.env.SKIP_AUTO_DEPLOY === 'true';
      
      // スキップ条件をチェック
      if (skipAutorun) {
        logger.info('⏭️ 自動コマンドデプロイがスキップされました (SKIP_AUTO_DEPLOY=true)');
        return resolve({ deployed: false, reason: 'SKIP_AUTO_DEPLOY' });
      }
      
      // 自動実行条件
      const shouldAutoDeploy = forceAutorun || 
        (isProduction && isCloudRun) || 
        process.env.GITHUB_ACTIONS === 'true';
      
      if (!shouldAutoDeploy) {
        logger.debug('💡 自動コマンドデプロイ条件を満たしていません');
        logger.debug(`  - forceAutorun: ${forceAutorun}`);
        logger.debug(`  - isProduction: ${isProduction}`);
        logger.debug(`  - isCloudRun: ${isCloudRun}`);
        logger.debug(`  - isGitHubActions: ${process.env.GITHUB_ACTIONS === 'true'}`);
        return resolve({ deployed: false, reason: 'AUTO_DEPLOY_CONDITIONS_NOT_MET' });
      }

      logger.info('🚀 Discordコマンドの自動デプロイを開始...');
      
      // deploy-commands.js のパス
      const deployCommandsPath = path.join(__dirname, '..', 'deploy-commands.js');
      
      // 環境変数を設定
      const env = {
        ...process.env,
        FORCE_DEPLOY: 'true',
        NODE_ENV: process.env.NODE_ENV || 'production'
      };
      
      // デプロイタイプを決定
      const deployArgs = isProduction ? ['--global', '--verbose'] : ['--verbose'];
      
      // deploy-commands.js を実行
      const childProcess = spawn('node', [deployCommandsPath, ...deployArgs], {
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: path.join(__dirname, '..', '..')
      });

      let stdout = '';
      let stderr = '';
      let commandCount = 0;

      childProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        
        // コマンド数を抽出
        const commandMatch = output.match(/(\d+)個のコマンドを.*登録完了/);
        if (commandMatch) {
          commandCount = parseInt(commandMatch[1], 10);
        }
        
        // リアルタイムログ出力
        output.split('\n').filter(line => line.trim()).forEach(line => {
            if (line.includes('[deploy-commands]')) {
              logger.info(`📦 ${line.replace(/.*\[deploy-commands\]\s*/, '')}`);
            }
        });
      });

      childProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        logger.warn(`⚠️ ${data.toString().trim()}`);
      });

      childProcess.on('close', (code) => {
        if (code === 0) {
          logger.info(`✅ Discordコマンドデプロイ完了: ${commandCount || '不明'}個のコマンド`);
          
          // ボットのコマンド統計を更新
          if (client && client.application) {
            setTimeout(async () => {
              try {
                const commands = await client.application.commands.fetch();
                logger.info(`📋 現在登録中のコマンド数: ${commands.size}個`);
              } catch (error) {
                logger.debug('コマンド統計取得エラー:', error.message);
              }
            }, 2000);
          }
          
          resolve({ deployed: true, reason: 'SUCCESS', commands: commandCount });
        } else {
          logger.error(`❌ Discordコマンドデプロイ失敗 (exit code: ${code})`);
          if (stderr) {
            logger.error(`エラー出力: ${stderr}`);
          }
          resolve({ deployed: false, reason: 'DEPLOY_FAILED', exitCode: code });
        }
      });

      childProcess.on('error', (error) => {
        logger.error('❌ コマンドデプロイプロセス実行エラー:', error);
        resolve({ deployed: false, reason: 'PROCESS_ERROR', error: error.message });
      });

      // タイムアウト設定（5分）
      setTimeout(() => {
        logger.warn('⏰ コマンドデプロイがタイムアウトしました');
        childProcess.kill('SIGTERM');
        resolve({ deployed: false, reason: 'TIMEOUT' });
      }, 5 * 60 * 1000);

    } catch (error) {
      logger.error('❌ コマンドデプロイ初期化エラー:', error);
      resolve({ deployed: false, reason: 'INITIALIZATION_ERROR', error: error.message });
    }
  });
}

module.exports = {
  deployDiscordCommands
};