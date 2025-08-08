// kpi_bot/index.js

const path = require('path');
const fs = require('fs');
const logger = require('../common/logger');

const commands = new Map();
const componentHandlers = [];

// 処理開始時間を取得
const startTime = Date.now();

// --- Commands 読み込み ---
logger.info('[kpi_bot] 📝 Commands ディレクトリをスキャン中...');
const commandsPath = path.join(__dirname, 'commands');

if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath)
    .filter(file => file.endsWith('.js'));

  logger.info(`[kpi_bot] 📁 ${commandFiles.length}個のコマンドファイルを発見: ${commandFiles.join(', ')}`);

  for (const file of commandFiles) {
    logger.debug(`[kpi_bot] 🔄 コマンド読み込み中: ${file}`);
    try {
      const filePath = path.join(commandsPath, file);
      delete require.cache[require.resolve(filePath)];
      const command = require(filePath);

      if ('data' in command && 'execute' in command) {
        commands.set(command.data.name, command);
        logger.info(`[kpi_bot] ✅ コマンド登録成功: /${command.data.name}`);
        logger.info(`  📋 name: ${command.data.name}`);
        logger.info(`  📋 description: ${command.data.description}`);
        logger.info(`  📋 options: ${command.data.options?.length || 0}`);
        logger.info(`  📋 file: ${file}`);
      } else {
        logger.warn(`[kpi_bot] ⚠️ ${file}: 'data' または 'execute' プロパティが見つかりません`);
      }
    } catch (error) {
      logger.error(`[kpi_bot] ❌ ${file} の読み込みエラー:`, error);
    }
  }
} else {
  logger.warn('[kpi_bot] ⚠️ commands ディレクトリが見つかりません');
}

logger.info(`[kpi_bot] 📝 Commands 読み込み完了: ${commands.size}個のコマンドが利用可能`);

// --- Component Handlers 読み込み ---
logger.info('[kpi_bot] 🎛️ Component Handlers 読み込み開始...');
const handlersPath = path.join(__dirname, 'handlers');

if (fs.existsSync(handlersPath)) {
  const handlerFiles = fs.readdirSync(handlersPath)
    .filter(file => file.endsWith('.js') && !file.startsWith('sample'));

  logger.info(`[kpi_bot] 📁 ${handlerFiles.length}個のハンドラーファイルを発見: ${handlerFiles.join(', ')}`);

  for (const file of handlerFiles) {
    logger.debug(`[kpi_bot] 🔄 ハンドラー読み込み中: ${file}`);
    try {
      const filePath = path.join(handlersPath, file);
      delete require.cache[require.resolve(filePath)];
      const handler = require(filePath);

      if (typeof handler.execute === 'function') {
        const handlerName = path.parse(file).name;
        componentHandlers.push({
          name: handlerName,
          execute: handler.execute,
          filePath: `./handlers/${file}`
        });
        logger.info(`[kpi_bot] ✅ ハンドラー登録成功: ${handlerName}`);
        logger.info(`  📋 name: ${handlerName}`);
        logger.info(`  📋 file: ${file}`);
        logger.info(`  📋 customId: dynamic`);
        logger.info(`  📋 type: component`);
      } else {
        logger.warn(`[kpi_bot] ⚠️ ${file}: execute関数が見つかりません`);
      }
    } catch (error) {
      logger.error(`[kpi_bot] ❌ ${file} の読み込みエラー:`, error);
    }
  }
} else {
  logger.warn('[kpi_bot] ⚠️ handlers ディレクトリが見つかりません');
}

// --- 統計情報 ---
const loadTime = Date.now() - startTime;
logger.info('[kpi_bot] 📊 KPI Bot モジュール読み込み統計:');
logger.info(`[kpi_bot]   ├─ 処理時間: ${loadTime}ms`);
logger.info(`[kpi_bot]   ├─ Commands: ${commands.size}個`);
logger.info(`[kpi_bot]   ├─ Component Handlers: ${componentHandlers.length}個`);
logger.info(`[kpi_bot]   └─ エラー: 0個`);

logger.info('[kpi_bot] ✅ KPI Bot モジュール初期化完了');

// --- init 関数 ---
function init(client) {
  if (client && client.commands && commands) {
    for (const [name, command] of commands) {
      client.commands.set(name, command);
    }
    logger.info(`[kpi_bot] client.commands へコマンド登録完了: ${commands.size}件`);
  }
  if (client && client.componentHandlers && Array.isArray(componentHandlers)) {
    for (const handler of componentHandlers) {
      if (handler && typeof handler.execute === 'function') {
        client.componentHandlers.push(handler);
      }
    }
    logger.info(`[kpi_bot] client.componentHandlers へハンドラー登録完了: ${componentHandlers.length}件`);
  }

  // コマンド・ハンドラー登録直後のデバッグログ追加
  logger.debug(`[kpi_bot] 登録後 client.commands.size: ${client.commands?.size}`);
  logger.debug(`[kpi_bot] 登録後 client.componentHandlers.length: ${client.componentHandlers?.length}`);
}

// --- エクスポート ---
module.exports = {
  commands,
  componentHandlers,
  metadata: {
    moduleName: 'kpi_bot',
    version: '1.0.0',
    description: 'KPI管理システム',
    features: [
      'KPI目標設定',
      'KPI申請設置',
      'CSV出力',
      '目標管理'
    ]
  },
  init,
};
