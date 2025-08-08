// events/deploy-commands.js - Discord slash commands deployment script

const { REST, Routes } = require('discord.js');
const logger = require('../common/logger'); // 相対パスに修正
const path = require('node:path');
const fs = require('node:fs');

// 環境変数を読み込み
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// --- 引数解析 ---
const isClear = process.argv.includes('--clear');
const isGlobalOnly = process.argv.includes('--global');
const isGuildOnly = process.argv.includes('--guild');
const isDryRun = process.argv.includes('--dry-run');
const isVerbose = process.argv.includes('--verbose');

// --- 環境変数取得 ---
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const NODE_ENV = process.env.NODE_ENV || 'development';

// --- 環境変数チェック ---
function validateEnvironment() {
  const requiredVars = {
    DISCORD_TOKEN: DISCORD_TOKEN,
    CLIENT_ID: CLIENT_ID
  };

  if (!isGlobalOnly && !isClear) { // グローバルデプロイでなく、クリアでもない場合はGUILD_ID必須
    requiredVars.GUILD_ID = GUILD_ID;
  }

  const missingVars = Object.entries(requiredVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    logger.error('[deploy-commands] ❌ 必須環境変数が未設定です:');
    missingVars.forEach(varName => {
      logger.error(`[deploy-commands]   ${varName}: NOT_SET`);
    });
    process.exit(1);
  }
  logger.info('[deploy-commands] ✅ 環境変数チェック完了');
}

validateEnvironment();

// --- コマンド検出・収集処理 (devcmd.jsから流用) ---
const commands = [];
const commandNames = new Map();
const loadErrors = [];

function discoverCommands(isDryRun) { // isDryRunを引数として受け取る
  const featureDirs = fs.readdirSync(path.join(__dirname, '..'), { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && dirent.name.endsWith('_bot'))
    .map(dirent => dirent.name);

  logger.info(`[deploy-commands] 🔍 ${featureDirs.length}個の機能ディレクトリを検出: ${featureDirs.join(', ')}`);

  for (const feature of featureDirs) {
    const featureIndexPath = path.join(__dirname, '..', feature, 'index.js');
    
    if (!fs.existsSync(featureIndexPath)) {
      logger.warn(`[deploy-commands] ⚠️ ${feature}/index.js が見つかりません`);
      continue;
    }

    try {
      // キャッシュをクリアして最新の状態で読み込み
      delete require.cache[require.resolve(featureIndexPath)];
      const featureModule = require(featureIndexPath);
      

      // Map型にも対応
      let featureCommands = [];
      if (Array.isArray(featureModule.commands)) {
        featureCommands = featureModule.commands;
      } else if (featureModule.commands instanceof Map) {
        featureCommands = Array.from(featureModule.commands.values());
      } else {
        logger.warn(`[deploy-commands] ⚠️ ${feature} にcommands配列/Mapがありません`);
        continue;
      }

      logger.info(`[deploy-commands] 📦 ${feature}: ${featureCommands.length}個のコマンドを発見`);

      for (const command of featureCommands) {
        if (!command || typeof command !== 'object') {
          logger.warn(`[deploy-commands] ⚠️ ${feature} の無効なコマンドをスキップ`);
          continue;
        }

        if (!('data' in command) || !('execute' in command)) {
          logger.warn(`[deploy-commands] ⚠️ ${feature} のコマンドに data または execute がありません`);
          continue;
        }

        const name = command.data.name;
        if (commandNames.has(name)) {
          const conflictFeature = commandNames.get(name);
          logger.error(`[deploy-commands] ❌ 重複エラー: "${name}" は ${conflictFeature} と ${feature} で競合しています`);
          loadErrors.push(`コマンド名重複: /${name} (${conflictFeature} vs ${feature})`);
          continue;
        }

        commandNames.set(name, feature);
        commands.push(command.data.toJSON());

        if (isVerbose) {
          logger.debug(`[deploy-commands] ✅ コマンド追加: /${name} (${feature})`);
        }
      }
      
    } catch (error) {
      const errorMsg = `${feature} の読み込みエラー: ${error.message}`;
      logger.error(`[deploy-commands] ❌ ${errorMsg}`, { error: error.stack });
      loadErrors.push(errorMsg);
    }
  }

  logger.info(`[deploy-commands] 📊 総コマンド数: ${commands.length}個`);
  
  if (loadErrors.length > 0) {
    logger.warn(`[deploy-commands] ⚠️ ${loadErrors.length}個のエラーが発生しました:`);
    loadErrors.forEach(error => logger.warn(`[deploy-commands]   - ${error}`));
    process.exit(1);
  }

  if (isDryRun) {
    logger.info('[deploy-commands] 🔍 ドライラン: 検出されたコマンド一覧:');
    commands.forEach((cmd, index) => {
      logger.info(`[deploy-commands]   ${index + 1}. /${cmd.name}: ${cmd.description}`);
    });
    logger.info('[deploy-commands] 💡 ドライランモード: 実際の登録は行いません');
    process.exit(0);
  }

  return commands;
}

// --- Discord REST API 設定 ---
const rest = new REST({ 
  version: '10',
  timeout: 30000, // 30秒タイムアウト
  retries: 3 // 3回リトライ
}).setToken(DISCORD_TOKEN);

// --- デプロイメント実行 ---
async function deployCommands() {
  discoverCommands(isDryRun); // isDryRunを引数として渡す

  try {
    const body = isClear ? [] : commands;
    
    if (commands.length === 0 && !isClear) {
      logger.error('[deploy-commands] ❌ 登録するコマンドが見つかりません');
      process.exit(1);
    }

    // グローバルコマンド登録
    if (!isGuildOnly) {
      const globalRoute = Routes.applicationCommands(CLIENT_ID);
      
      if (isClear) {
        logger.info(`[deploy-commands] 🧹 グローバルコマンドをクリア中...`);
      } else {
        logger.info(`[deploy-commands] 🚀 ${body.length}個のコマンドをグローバルに登録中...`);
      }

      const globalData = await rest.put(globalRoute, { body });
      
      logger.info(`[deploy-commands] ✅ ${globalData.length}個のコマンドをグローバルに登録完了`);
      
      // API レート制限対策の待機時間
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // ギルド（開発サーバー）コマンド登録
    if (!isGlobalOnly && GUILD_ID) {
      const guildRoute = Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID);
      
      if (isClear) {
        logger.info(`[deploy-commands] 🧹 開発サーバーコマンドをクリア中...`);
      } else {
        logger.info(`[deploy-commands] 🚀 ${body.length}個のコマンドを開発サーバーに登録中... (Guild: ${GUILD_ID})`);
      }

      const guildData = await rest.put(guildRoute, { body });
      
      logger.info(`[deploy-commands] ✅ ${guildData.length}個のコマンドを開発サーバーに登録完了`);
    }

    // 成功ログ
    logger.info('[deploy-commands] 🎉 全ての登録処理が完了しました');
    process.exit(0);
    
  } catch (error) {
    await handleDeploymentError(error);
  }
}

// --- エラーハンドリング ---
async function handleDeploymentError(error) {
  const errorInfo = {
    message: error.message,
    name: error.name,
    code: error.code,
    status: error.status,
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  };

  logger.error('[deploy-commands] ❌ コマンド登録時にエラーが発生しました', errorInfo);
  
  // Discord API特有のエラー詳細
  if (error.code) {
    const errorMessages = {
      50001: 'Missing Access (アクセス権限不足)',
      50013: 'Missing Permissions (権限不足)',
      50035: 'Invalid Form Body (不正なコマンド形式)',
      429: 'Rate Limited (レート制限)',
      10062: 'Unknown Interaction (不明なインタラクション)',
      40060: 'Interaction has already been acknowledged (インタラクション重複)'
    };
    
    const errorMsg = errorMessages[error.code] || `不明なエラー (Code: ${error.code})`;
    logger.error(`[deploy-commands] Discord API Error: ${errorMsg}`);
    
    if (error.code === 429) {
      logger.error('[deploy-commands] 💡 レート制限エラー: しばらく待ってから再実行してください');
    }
  }

  // タイムアウトエラーの詳細
  if (error.message.includes('タイムアウト')) {
    logger.error('[deploy-commands] ⏰ Discord APIがタイムアウトしました');
    logger.error('[deploy-commands] 💡 ネットワーク接続またはDiscord API側の問題の可能性があります');
  }
  
  process.exit(1);
}

// --- 実行開始 ---
if (require.main === module) {
  deployCommands();
}

module.exports = { deployCommands };