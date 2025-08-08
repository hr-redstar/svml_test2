// keihi_bot/index.js - SVML Expense Management Bot Module

const fs = require('node:fs');
const path = require('node:path');
const logger = require('../common/logger');

logger.info('[keihi_bot] 💰 Expense Management Bot モジュール初期化開始...');

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
  throw new Error('Keihi bot commands directory not found');
}

const commandFiles = fs.readdirSync(commandsDir).filter(file => {
  const isJsFile = file.endsWith('.js');
  if (!isJsFile) {
    logger.debug(`⏭️ 非JSファイルをスキップ: ${file}`);
  }
  return isJsFile;
});

logger.info(`📁 ${commandFiles.length}個のコマンドファイルを発見: ${commandFiles.join(', ')}`);

const commands = [];
for (const file of commandFiles) {
  const filePath = path.join(commandsDir, file);
  const commandName = path.basename(file, '.js');
  
  try {
    logger.debug(`🔄 コマンド読み込み中: ${file}`);
    
    // キャッシュクリア（開発時の更新反映）
    delete require.cache[require.resolve(filePath)];
    const command = require(filePath);
    
    // バリデーション
    if (!command) {
      logger.warn(`⚠️ ${file}: コマンドオブジェクトがnullまたは未定義`);
      moduleStats.errors++;
      continue;
    }
    
    if (!command.data) {
      logger.warn(`⚠️ ${file}: 'data' プロパティが不足`);
      moduleStats.errors++;
      continue;
    }
    
    if (typeof command.execute !== 'function') {
      logger.warn(`⚠️ ${file}: 'execute' 関数が不足`);
      moduleStats.errors++;
      continue;
    }
    
    // コマンド情報の詳細ログ
    const commandInfo = {
      name: command.data.name,
      description: command.data.description,
      options: command.data.options?.length || 0,
      file: file
    };
    
    commands.push(command);
    moduleStats.commands++;
    
    logger.info(`✅ コマンド登録成功: /${commandInfo.name}`, commandInfo);
    
  } catch (error) {
    moduleStats.errors++;
    logger.error(`💥 コマンドファイル ${file} の読み込みエラー:`);
    logger.error(`🔍 エラー詳細: ${error.message}`);
    if (error.stack) {
      logger.debug(`📚 スタックトレース:\n${error.stack}`);
    }
  }
}

logger.info(`📝 Commands 読み込み完了: ${commands.length}個のコマンドが利用可能`);

// === Component Handlers の読み込み ===
logger.info('🎛️ Component Handlers 読み込み開始...');

const handlers = [];
const handlerConfigs = [
  { name: 'keihiHandler', path: './handlers/keihiHandler.js', required: true },
  { name: 'keihiConfigHandler', path: './handlers/keihiConfigHandler.js', required: false },
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
    handler.moduleName = 'keihi_bot';
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
  logger.error('💡 Keihi Bot の一部機能が正常に動作しない可能性があります');
}

// 最終的なエクスポート
const exportData = {
  commands: commands.filter(cmd => cmd && cmd.data && cmd.execute),
  componentHandlers: handlers.filter(handler => handler && typeof handler.execute === 'function'),
  metadata: {
    moduleName: 'keihi_bot',
    version: '1.0.0',
    loadTime: loadTime,
    stats: moduleStats,
    requiredHandlers: handlerConfigs.filter(c => c.required).map(c => c.name),
    loadedHandlers: handlers.map(h => h.handlerName),
  }
};

logger.info(`✅ Keihi Bot モジュール初期化完了 - ${loadTime}ms`);
logger.info(`📊 統計: ${exportData.commands.length}コマンド, ${exportData.componentHandlers.length}ハンドラー`);

function init(client) {
  if (client && client.commands && Array.isArray(commands)) {
    for (const command of commands) {
      if (command && command.data && command.execute) {
        client.commands.set(command.data.name, command);
      }
    }
    logger.info(`[keihi_bot] client.commands へコマンド登録完了: ${commands.length}件`);
  }
  if (client && client.componentHandlers && Array.isArray(handlers)) {
    for (const handler of handlers) {
      if (handler && typeof handler.execute === 'function') {
        client.componentHandlers.push(handler);
      }
    }
    logger.info(`[keihi_bot] client.componentHandlers へハンドラー登録完了: ${handlers.length}件`);
  }

  // コマンド・ハンドラー登録直後のデバッグログ追加
  logger.debug(`[keihi_bot] 登録後 client.commands.size: ${client.commands?.size}`);
  logger.debug(`[keihi_bot] 登録後 client.componentHandlers.length: ${client.componentHandlers?.length}`);
}

module.exports = {
  commands,
  handlers,
  init,
};
