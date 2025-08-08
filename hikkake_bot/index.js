// hikkake_bot/index.js
const fs = require('fs');
const path = require('path');
const logger = require('../common/logger');

logger.info(`[hikkake_bot] 🔧 Hikkake Bot モジュール初期化開始...`);

const moduleStats = {
  commands: 0,
  componentHandlers: 0,
  errors: 0,
  loadTime: Date.now()
};

// === Commands の自動読み込み ===
logger.info(`📝 Commands ディレクトリをスキャン中...`);
const commandsDir = path.join(__dirname, 'commands');

if (!fs.existsSync(commandsDir)) {
  logger.error(`❌ Commands ディレクトリが見つかりません: ${commandsDir}`);
  throw new Error('Hikkake bot commands directory not found');
}

const commandFiles = fs.readdirSync(commandsDir).filter(file => {
  const isJsFile = file.endsWith('.js');
  if (!isJsFile) {
    logger.debug(`⏭️ 非JSファイルをスキップ: ${file}`);
  }
  return isJsFile;
});



const commands = new Map();
for (const file of commandFiles) {
  const filePath = path.join(commandsDir, file);
  
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
    
    commands.set(command.data.name, command);
    moduleStats.commands++;
    
    logger.info(`✅ コマンド登録成功: /${commandInfo.name}
  📋 name: ${commandInfo.name}
  📋 description: ${commandInfo.description}
  📋 options: ${commandInfo.options}
  📋 file: ${commandInfo.file}`);
    
  } catch (error) {
    moduleStats.errors++;
    logger.error(`💥 コマンドファイル ${file} の読み込みエラー:`);
    logger.error(`🔍 エラー詳細: ${error.message}`);
    if (error.stack) {
      logger.debug(`📚 スタックトレース:
${error.stack}`);
    }
  }
}

logger.info(`📝 Commands 読み込み完了: ${commands.size}個のコマンドが利用可能`);

// === Component Handlers の読み込み ===
logger.info(`🎛️ Component Handlers 読み込み開始...`);

const componentHandlers = [];

// handlers フォルダから読み込み
const handlersPath = path.join(__dirname, 'handlers');
if (fs.existsSync(handlersPath)) {
  // hikkakeHandler.js のみを明示的に読み込む
  const filePath = path.join(handlersPath, 'hikkakeHandler.js');
  try {
    logger.debug(`🔄 ハンドラー読み込み中: hikkakeHandler.js`);
    delete require.cache[require.resolve(filePath)];
    const handler = require(filePath);
    
    if (handler && typeof handler.execute === 'function') {
      handler.name = 'hikkakeHandler';
      handler.filePath = `./handlers/hikkakeHandler.js`;
      handler.moduleName = 'hikkake_bot';
      handler.handlerName = 'hikkakeHandler';
      
      componentHandlers.push(handler);
      moduleStats.componentHandlers++;
      
      logger.info(`✅ ハンドラー登録成功: hikkakeHandler
  📋 name: hikkakeHandler
  📋 path: ./handlers/hikkakeHandler.js
  📋 customId: dynamic
  📋 type: component
  📋 required: true`);
    } else {
      logger.warn(`⚠️ hikkakeHandler.js: execute 関数が不足または無効なハンドラーオブジェクト`);
      moduleStats.errors++;
    }
  } catch (error) {
    moduleStats.errors++;
    logger.error(`💥 ハンドラー hikkakeHandler.js の読み込みエラー: ${error.message}`);
  }
}

// utils フォルダからも読み込み
const utilsPath = path.join(__dirname, 'utils');
if (fs.existsSync(utilsPath)) {
  const utilsFiles = fs.readdirSync(utilsPath).filter(file => file.endsWith('.js') && file.includes('handler'));
  for (const file of utilsFiles) {
    const filePath = path.join(utilsPath, file);
    try {
      // キャッシュクリア
      delete require.cache[require.resolve(filePath)];
      const handler = require(filePath);
      
      // ハンドラーオブジェクトが適切な形式かチェック
      if (handler && typeof handler.execute === 'function') {
        handler.name = handler.name || file.replace('.js', '');
        handler.filePath = `./utils/${file}`;
        handler.moduleName = 'hikkake_bot';
        handler.handlerName = file.replace('.js', '');
        
        componentHandlers.push(handler);
        moduleStats.componentHandlers++;
        
        logger.info(`✅ Utils ハンドラー登録成功: ${handler.name}`);
      }
    } catch (error) {
      moduleStats.errors++;
      logger.warn(`⚠️ Hikkake utils handler loading failed: ${file}`, { 
        error: error instanceof Error ? error.message : String(error),
        file: file
      });
    }
  }
}

// === 最終統計とエクスポート ===
const loadTime = Date.now() - moduleStats.loadTime;

if (moduleStats.errors > 0) {
  logger.warn(`⚠️ ${moduleStats.errors}個のエラーが発生しました`);
}

logger.info(`✅ Hikkake Bot モジュール初期化完了`);

// init関数追加: clientにコマンド・ハンドラー登録
function init(client) {
  if (client && client.commands && commands) {
    for (const [name, command] of commands) {
      client.commands.set(name, command);
    }
    logger.info(`[hikkake_bot] client.commands へコマンド登録完了: ${commands.size}件`);
  }
  if (client && client.componentHandlers && Array.isArray(componentHandlers)) {
    for (const handler of componentHandlers) {
      if (handler && typeof handler.execute === 'function') {
        client.componentHandlers.push(handler);
      }
    }
    logger.info(`[hikkake_bot] client.componentHandlers へハンドラー登録完了: ${componentHandlers.length}件`);
  }
  // コマンド・ハンドラー登録直後のデバッグログ追加
  logger.debug(`[hikkake_bot] 登録後 client.commands.size: ${client.commands?.size}`);
  logger.debug(`[hikkake_bot] 登録後 client.componentHandlers.length: ${client.componentHandlers?.length}`);
}

// 最終的なエクスポート（config_botと同じ形式）
const exportData = {
  commands: commands,
  componentHandlers: componentHandlers.filter(handler => handler && typeof handler.execute === 'function'),
  metadata: {
    moduleName: 'hikkake_bot',
    version: '1.0.0',
    loadTime: loadTime,
    stats: moduleStats
  },
  init,
};

module.exports = exportData;