// config_bot/index.js - SVML Configuration Bot Module

const fs = require('node:fs');
const path = require('node:path');
const logger = require('../common/logger');

logger.info('[config_bot] 🔧 Config Bot モジュール初期化開始...');

const moduleStats = {
  commands: 0,
  componentHandlers: 0,
  errors: 0,
  loadTime: Date.now()
};

// === Commands の自動読み込み ===
logger.info('📝 Commands ディレクトリをスキャン中...');
const commandsDir = path.join(__dirname, 'commands');

if (!fs.existsSync(commandsDir)) {
  logger.error(`❌ Commands ディレクトリが見つかりません: ${commandsDir}`);
  throw new Error('Config bot commands directory not found');
}

// サブディレクトリも含めて.jsファイルを再帰的に取得
function getAllJsFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllJsFiles(filePath));
    } else if (file.endsWith('.js')) {
      results.push(filePath);
    }
  }
  return results;
}

const commandFiles = getAllJsFiles(commandsDir);

logger.info(`📁 ${commandFiles.length}個のコマンドファイルを発見: ${commandFiles.map(f => path.basename(f)).join(', ')}`);

const commands = new Map();
for (const filePath of commandFiles) {
  const commandName = path.basename(filePath, '.js');
  try {
    logger.debug(`🔄 コマンド読み込み中: ${filePath}`);
    delete require.cache[require.resolve(filePath)];
    const command = require(filePath);
    if (!command) {
      logger.warn(`⚠️ ${filePath}: コマンドオブジェクトがnullまたは未定義`);
      moduleStats.errors++;
      continue;
    }
    if (!command.data) {
      logger.warn(`⚠️ ${filePath}: 'data' プロパティが不足`);
      moduleStats.errors++;
      continue;
    }
    if (typeof command.execute !== 'function') {
      logger.warn(`⚠️ ${filePath}: 'execute' 関数が不足`);
      moduleStats.errors++;
      continue;
    }
    const commandInfo = {
      name: command.data.name,
      description: command.data.description,
      options: command.data.options?.length || 0,
      file: filePath
    };
    commands.set(command.data.name, command);
    moduleStats.commands++;
    logger.info(`✅ コマンド登録成功: /${commandInfo.name}`, commandInfo);
  } catch (error) {
    moduleStats.errors++;
    logger.error(`💥 コマンドファイル ${filePath} の読み込みエラー:`);
    logger.error(`🔍 エラー詳細: ${error.message}`);
    if (error.stack) {
      logger.debug(`📚 スタックトレース:\n${error.stack}`);
    }
  }
}

logger.info(`📝 Commands 読み込み完了: ${commands.size}個のコマンドが利用可能`);

// === Component Handlers の読み込み ===
logger.info('🎛️ Component Handlers 読み込み開始...');

const handlers = [];
const handlerConfigs = [
  { name: 'embedHandler', path: './handlers/embedHandler.js', required: true },
  { name: 'configHandler', path: './handlers/coreConfigHandler.js', required: true },
  { name: 'userInfoHandler', path: './handlers/userInfoHandler.js', required: true },
];

for (const config of handlerConfigs) {
  const handlerPath = path.resolve(__dirname, config.path);
  
  try {
    logger.debug(`🔄 ハンドラー読み込み中: ${config.name}`);
    
    // ファイル存在チェック
    if (!fs.existsSync(handlerPath)) {
      if (config.required) {
        logger.error(`❌ 必須ハンドラーが見つかりません: ${handlerPath}`);
        moduleStats.errors++;
        continue;
      } else {
        logger.warn(`⚠️ オプションハンドラーが見つかりません: ${handlerPath}`);
        continue;
      }
    }
    
    // キャッシュクリア
    delete require.cache[require.resolve(handlerPath)];
    const handler = require(handlerPath);
    
    // ハンドラーバリデーション
    if (!handler) {
      logger.error(`❌ ${config.name}: ハンドラーオブジェクトが取得できません`);
      moduleStats.errors++;
      continue;
    }
    
    if (typeof handler.execute !== 'function') {
      logger.error(`❌ ${config.name}: execute関数が定義されていません`);
      moduleStats.errors++;
      continue;
    }
    
    // デバッグ用にfilePath設定
    handler.filePath = config.path;
    handler.moduleName = 'config_bot';
    handler.handlerName = config.name;
    
    // ハンドラー詳細情報
    const handlerInfo = {
      name: config.name,
      path: config.path,
      customId: handler.customId || 'dynamic',
      type: handler.type || 'component',
      required: config.required
    };
    
    handlers.push(handler);
    moduleStats.componentHandlers++;
    
    logger.info(`✅ ハンドラー登録成功: ${config.name}`, handlerInfo);
    
  } catch (error) {
    moduleStats.errors++;
    logger.error(`💥 ハンドラー ${config.name} の読み込みエラー:`);
    logger.error(`📍 ファイルパス: ${handlerPath}`);
    logger.error(`🔍 エラー詳細: ${error.message}`);
    if (error.stack) {
      logger.debug(`📚 スタックトレース:\n${error.stack}`);
    }
    
    if (config.required) {
      logger.error(`❌ 必須ハンドラーの読み込みに失敗しました: ${config.name}`);
    }
  }
}

// === 最終統計とバリデーション ===
const loadTime = Date.now() - moduleStats.loadTime;

if (moduleStats.errors > 0) {
  logger.warn(`⚠️ ${moduleStats.errors}個のエラーが発生しました - 一部機能が利用できない可能性があります`);
}

// 必須ハンドラーの存在確認
const requiredHandlerCount = handlerConfigs.filter(c => c.required).length;
const loadedRequiredHandlers = handlers.filter(h => handlerConfigs.find(c => c.name === h.handlerName && c.required)).length;

if (loadedRequiredHandlers < requiredHandlerCount) {
  logger.error(`❌ 必須ハンドラーが不足しています (${loadedRequiredHandlers}/${requiredHandlerCount})`);
  logger.error('💡 Config Bot の一部機能が正常に動作しない可能性があります');
  // 管理者向け通知（例: Discord管理者チャンネルにエラー通知）
  try {
    const adminChannelId = process.env.ADMIN_CHANNEL_ID;
    if (adminChannelId && typeof global.discordClient !== 'undefined') {
      global.discordClient.channels.fetch(adminChannelId)
        .then(channel => {
          if (channel) {
            channel.send(`❌ Config Bot 必須ハンドラー不足: ${loadedRequiredHandlers}/${requiredHandlerCount}\n一部機能が利用できません。管理者は設定・ファイルを確認してください。`);
          }
        })
        .catch(err => logger.error('管理者チャンネル通知失敗:', err));
    }
  } catch (notifyError) {
    logger.error('管理者通知処理でエラー:', notifyError);
  }
}

// 最終的なエクスポート
const exportData = {
  commands: commands,
  componentHandlers: handlers.filter(handler => handler && typeof handler.execute === 'function'),
  metadata: {
    moduleName: 'config_bot',
    version: '2.0.0',
    loadTime: loadTime,
    stats: moduleStats,
    requiredHandlers: handlerConfigs.filter(c => c.required).map(c => c.name),
    loadedHandlers: handlers.map(h => h.handlerName),
  },
  // 初期化関数
  init: (client) => {
    logger.info('[config_bot] パネル更新サービス初期化開始...');
    // コマンド登録
    if (client && client.commands && commands) {
      for (const [name, command] of commands) {
        client.commands.set(name, command);
      }
      logger.info(`[config_bot] client.commands へコマンド登録完了: ${commands.size}件`);
    }
    // ハンドラー登録
    if (client && client.componentHandlers && Array.isArray(handlers)) {
      for (const handler of handlers) {
        if (handler && typeof handler.execute === 'function') {
          client.componentHandlers.push(handler);
        }
      }
      logger.info(`[config_bot] client.componentHandlers へハンドラー登録完了: ${handlers.length}件`);
    }
    // パネル更新サービスの初期化
    try {
      const { initPanelUpdateService } = require('./handlers/coreConfigHandler');
      if (typeof initPanelUpdateService === 'function') {
        initPanelUpdateService(client);
        logger.info('✅ パネル更新サービス初期化完了');
      }
    } catch (error) {
      logger.error('❌ パネル更新サービス初期化エラー:', error);
    }
  }
};

logger.info(`✅ Config Bot モジュール初期化完了`);

module.exports = exportData;
