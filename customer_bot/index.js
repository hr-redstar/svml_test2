// customer_bot/index.js - Customer Service Bot Module

const fs = require('node:fs');
const path = require('node:path');
const logger = require('../common/logger');

logger.info('[customer_bot] 🔧 Customer Bot モジュール初期化開始...');

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
  throw new Error('Customer bot commands directory not found');
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
      logger.warn(`⚠️ ${file}: コマンドにdataプロパティが存在しません`);
      moduleStats.errors++;
      continue;
    }

    if (!command.execute) {
      logger.warn(`⚠️ ${file}: コマンドにexecuteプロパティが存在しません`);
      moduleStats.errors++;
      continue;
    }

    // コマンド登録
    commands.push(command);
    moduleStats.commands++;
    
    logger.info(`✅ コマンド登録成功: /${command.data.name}`);
    logger.info(`  📋 name: ${command.data.name}`);
    logger.info(`  📋 description: ${command.data.description}`);
    logger.info(`  📋 options: ${command.data.options?.length || 0}`);
    logger.info(`  📋 file: ${file}`);
    
  } catch (error) {
    logger.error(`❌ ${file}: コマンド読み込み失敗 - ${error.message}`);
    logger.debug(`   スタックトレース: ${error.stack}`);
    moduleStats.errors++;
  }
}

logger.info(`📝 Commands 読み込み完了: ${commands.length}個のコマンドが利用可能`);

// === Component Handlers の自動読み込み ===
logger.info('🎛️ Component Handlers 読み込み開始...');

const componentHandlers = [];
const handlersDir = path.join(__dirname, 'handlers');

if (fs.existsSync(handlersDir)) {
  const handlerFiles = fs.readdirSync(handlersDir).filter(file => file.endsWith('.js'));
  
  for (const file of handlerFiles) {
    const filePath = path.join(handlersDir, file);
    const handlerName = path.basename(file, '.js');
    
    try {
      logger.debug(`🔄 ハンドラー読み込み中: ${handlerName}`);
      
      // キャッシュクリア
      delete require.cache[require.resolve(filePath)];
      const handler = require(filePath);
      
      // バリデーション
      if (!handler) {
        logger.warn(`⚠️ ${file}: ハンドラーオブジェクトがnullまたは未定義`);
        moduleStats.errors++;
        continue;
      }

      // ハンドラー登録
      componentHandlers.push(handler);
      moduleStats.componentHandlers++;
      
      logger.info(`✅ ハンドラー登録成功: ${handlerName}`);
      logger.info(`  📋 name: ${handlerName}`);
      logger.info(`  📋 path: ${filePath}`);
      logger.info(`  📋 customId: ${handler.customId || 'dynamic'}`);
      logger.info(`  📋 type: component`);
      logger.info(`  📋 required: true`);
      
    } catch (error) {
      logger.error(`❌ ${file}: ハンドラー読み込み失敗 - ${error.message}`);
      logger.debug(`   スタックトレース: ${error.stack}`);
      moduleStats.errors++;
    }
  }
} else {
  logger.debug('📁 Handlers ディレクトリが存在しません。スキップします。');
}

// === モジュール統計とエクスポート ===
moduleStats.loadTime = Date.now() - moduleStats.loadTime;

logger.info('✅ Customer Bot モジュール初期化完了');
logger.debug(`📊 統計情報:`);
logger.debug(`   📝 読み込み済みコマンド: ${moduleStats.commands}`);
logger.debug(`   🎛️ 読み込み済みハンドラー: ${moduleStats.componentHandlers}`);
logger.debug(`   ❌ エラー数: ${moduleStats.errors}`);
logger.debug(`   ⏱️ 読み込み時間: ${moduleStats.loadTime}ms`);

module.exports = {
  commands,
  componentHandlers,
  moduleStats,
  
  // 統計情報取得用
  getStats() {
    return {
      ...moduleStats,
      commandsAvailable: commands.length,
      handlersAvailable: componentHandlers.length
    };
  }
};
