require('module-alias/register');
require('dotenv').config();
const http = require('http');

// ===== Cloud Run 対応: 最優先HTTPサーバー起動 =====
const HealthCheckServer = require('./healthcheck.js');
const defaultPort = 8080;
const maxPortAttempts = 10;

// 使用可能なポートを探す関数
function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    function tryPort(port) {
      if (port >= startPort + maxPortAttempts) {
        reject(new Error('使用可能なポートが見つかりませんでした'));
        return;
      }

      const server = http.createServer();
      server.once('error', (err) => {
        server.close();
        if (err.code === 'EADDRINUSE') {
          console.warn(`ポート ${port} は使用中です。次のポートを試行します...`);
          tryPort(port + 1);
        } else {
          reject(err);
        }
      });

      server.once('listening', () => {
        server.close();
        resolve(port);
      });

      server.listen(port);
    }

    tryPort(startPort);
  });
}

// 使用可能なポートを見つけて設定
let port = defaultPort;

console.log('🚀 SVML Bot starting...');
console.log('📦 NODE_ENV:', process.env.NODE_ENV);
console.log('🌐 PORT:', port, '(自動選択)');
console.log('🔑 DISCORD_TOKEN:', process.env.DISCORD_TOKEN ? 'SET' : 'NOT_SET');
console.log('💾 GCS_BUCKET_NAME:', process.env.GCS_BUCKET_NAME || 'NOT_SET');

// 即座にHTTPサーバーを起動（Discord処理より優先）
const server = http.createServer(async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`📡 ${timestamp} - HTTP Request: ${req.method} ${req.url}`);
  
  res.writeHead(200, { 
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache'
  });
  
  // GCSテスト用エンドポイント
  if (req.url === '/test-gcs') {
    try {
      const gcsUtils = require('./common/gcs/gcsUtils');
      const testData = { test: true, timestamp, from: 'http-endpoint' };
      const testPath = `test/http-test-${Date.now()}.json`;
      
      console.log(`[HTTP] GCSテスト開始: ${testPath}`);
      await gcsUtils.saveJsonToGCS(testPath, testData);
      
      res.end(JSON.stringify({
        status: 'GCS test success',
        testPath,
        testData,
        timestamp
      }, null, 2));
      
      console.log(`[HTTP] GCSテスト成功: ${testPath}`);
      return;
    } catch (gcsError) {
      console.error(`[HTTP] GCSテスト失敗:`, gcsError);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'GCS test failed',
        error: gcsError.message,
        code: gcsError.code,
        timestamp
      }, null, 2));
      return;
    }
  }
  
  // 設定状態確認エンドポイント（デバッグ用）
  if (req.url.startsWith('/config/')) {
    try {
      const guildId = req.url.split('/')[2];
      if (!guildId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Guild ID required: /config/{guildId}' }));
        return;
      }
      
      const configStateManager = require('./config_bot/utils/configStateManager');
      console.log(`[HTTP] 設定状態読み込み: ${guildId}`);
      
      const state = await configStateManager.readState(guildId);
      console.log(`[HTTP] 設定状態取得完了:`, { guildId, state });
      
      res.end(JSON.stringify({
        status: 'config read success',
        guildId,
        state,
        timestamp
      }, null, 2));
      
      return;
    } catch (configError) {
      console.error(`[HTTP] 設定状態読み込みエラー:`, configError);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'config read failed',
        error: configError.message,
        code: configError.code,
        timestamp
      }, null, 2));
      return;
    }
  }
  
  const response = {
    status: 'healthy',
    timestamp: timestamp,
    service: 'SVML Discord Bot',
    version: '1.0.0',
    port: port,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      BUILD_TIME: process.env.BUILD_TIME,
      COMMIT_SHA: process.env.COMMIT_SHA,
      DISCORD_TOKEN_SET: !!process.env.DISCORD_TOKEN,
      GCS_BUCKET_NAME_SET: !!process.env.GCS_BUCKET_NAME,
      IS_CLOUD_RUN: !!process.env.K_SERVICE,
      HAS_CREDENTIALS: !!process.env.GOOGLE_APPLICATION_CREDENTIALS
    },
    discord_status: 'initializing',
    endpoints: [
      '/ - Health check',
      '/test-gcs - GCS write test',
      '/config/{guildId} - Read config state'
    ]
  };
  
  res.end(JSON.stringify(response, null, 2));
  console.log(`✅ ${timestamp} - HTTP Response sent successfully`);
});

// HTTPサーバー起動（最重要）
findAvailablePort(process.env.PORT || defaultPort)
  .then(availablePort => {
    port = availablePort;
    console.log(`🌐 使用可能なポート ${port} が見つかりました`);
    
    server.listen(port, '0.0.0.0', () => {
      console.log(`🌐 ✅ HTTP Server started successfully on http://0.0.0.0:${port}`);
      console.log(`📋 Health check: http://0.0.0.0:${port}/health`);
      console.log(`⏰ Server start time: ${new Date().toISOString()}`);
      
      // HTTPサーバー起動後にDiscord初期化を開始
      (async () => {
        try {
          console.log('🔍 Discord Bot初期化関数呼び出し直前');
          await initializeDiscordBot();
          console.log('🔍 Discord Bot初期化関数完了');
        } catch (error) {
          console.error('❌ Discord初期化でエラーが発生しましたが、HTTPサーバーを継続します:', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
          });
        }
      })();
    });
  })
  .catch(error => {
    console.error('❌ 使用可能なポートが見つかりませんでした:', error.message);
    process.exit(1);
  });

// HTTPサーバーエラーハンドリング
server.on('error', (err) => {
  console.error('❌ HTTP Server Error - サーバーを継続します:', {
    error: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });
  // process.exit(1) を削除 - Cloud Runでコンテナ終了を防ぐ
});

// Discord初期化を関数化
async function initializeDiscordBot() {
  console.log('🤖 Starting Discord bot initialization...');
  
  const { Client, GatewayIntentBits, Collection } = require('discord.js');
  const fs = require('fs');
  const path = require('path');
  const logger = require('./common/logger');
  const handlerRegistry = require('./common/handlers/handlerRegistry');
  const performanceManager = require('./common/performance/performanceManager');

  // Discord クライアント初期化
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildVoiceStates
    ]
  });

// コレクション初期化
client.commands = new Collection();
client.componentHandlers = [];
client.messageHandlers = [];

// 超高速ハンドラーレジストリ初期化
logger.info('� 超高速ハンドラーレジストリ初期化中...');
handlerRegistry.initialize()
  .then(() => {
    logger.info('✅ 超高速ハンドラーレジストリ初期化完了');
  })
  .catch(error => {
    logger.error('❌ 超高速ハンドラーレジストリ初期化エラー:', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  });

// 起動メッセージ
// 環境変数チェック
if (!process.env.DISCORD_TOKEN) {
  logger.error('❌ DISCORD_TOKENが設定されていません');
  logger.info('⚠️ HTTPサーバーは起動していますが、Discord接続はできません');
  // process.exit(1); を削除して、HTTPサーバーは継続動作
} else {
  // Discord ログイン（TOKENが設定されている場合のみ）
  logger.info('🔍 client.login()実行直前 - Discord接続開始');
  client.login(process.env.DISCORD_TOKEN)
    .then(() => {
      logger.info('✅ Discord接続完了');
    })
    .catch(error => {
      logger.error('❌ Discord接続エラー:', error);
      // Cloud Runではプロセスを停止せず、HTTPサーバーは継続
    });
}

// === 超高速並列機能モジュール読み込み ===
const featureDirs = [
  { name: 'config_bot', priority: 1, required: true },
  { name: 'hikkake_bot', priority: 2, required: false },
  { name: 'keihi_bot', priority: 2, required: false },
  { name: 'syuttaikin_bot', priority: 2, required: false },
  { name: 'uriage_bot', priority: 2, required: false },
  { name: 'kpi_bot', priority: 2, required: false },
  { name: 'level_bot', priority: 2, required: false }
];

let totalCommands = 0;
let totalHandlers = 0;

// 機能モジュールのキャッシュ
const moduleCache = new Map();

/**
 * 単一モジュールの並列読み込み処理（最適化版）
 */
async function loadFeatureModuleOptimized(feature) {
  const { name: featureName, required, priority } = feature;
  const featureIndexPath = path.join(__dirname, featureName, 'index.js');
  
  // キャッシュをチェック
  const cachedModule = moduleCache.get(featureName);
  if (cachedModule) {
    logger.info(`📦 ${featureName}: キャッシュからモジュールを読み込みました`);
    return cachedModule;
  }

  if (!fs.existsSync(featureIndexPath)) {
    const error = `モジュールファイルが見つかりません: ${featureIndexPath}`;
    if (required) {
      throw new Error(`必須モジュール ${featureName} の読み込みに失敗: ${error}`);
    }
    logger.warn(`⚠️ ${featureName}: ${error}`);
    return { feature: featureName, error, required, priority };
  }

  try {
    // 開発環境のみキャッシュクリア
    if (process.env.NODE_ENV !== 'production') {
      delete require.cache[require.resolve(featureIndexPath)];
    }
    
    const startTime = Date.now();
    logger.info(`📦 ${featureName} (優先度:${priority}) モジュール読み込み開始...`);
    
    // キャッシュ付きモジュール読み込み
    const cacheKey = `module_${featureName}`;
    let featureModule = await performanceManager.cacheGet(cacheKey);
    
    if (!featureModule) {
      featureModule = require(featureIndexPath);

      // モジュールの検証
      if (!featureModule) {
        throw new Error('モジュールが正しく読み込めません');
      }

      // コマンドの検証（Map型/Array型両対応）
      if (featureModule.commands) {
        if (featureModule.commands instanceof Map) {
          for (const [name, command] of featureModule.commands) {
            if (!command || !command.data || !command.execute) {
              throw new Error(`無効なコマンド定義: ${name}`);
            }
          }
        } else if (Array.isArray(featureModule.commands)) {
          for (const command of featureModule.commands) {
            if (!command || !command.data || !command.execute) {
              throw new Error('無効なコマンド定義（配列型）');
            }
          }
        }
      }

      // ハンドラーの検証（Array型のみ）
      if (featureModule.componentHandlers && Array.isArray(featureModule.componentHandlers)) {
        for (const handler of featureModule.componentHandlers) {
          if (!handler || typeof handler.execute !== 'function') {
            throw new Error('無効なコンポーネントハンドラー');
          }
        }
      }

      await performanceManager.cacheSet(cacheKey, featureModule, 60 * 60 * 1000); // 1時間キャッシュ
    }
    
    const loadTime = Date.now() - startTime;
    
    // メモリ使用量を計測
    const memoryUsage = process.memoryUsage();
    const moduleSize = JSON.stringify(featureModule).length;
    
    const result = { 
      feature: featureName,
      module: featureModule,
      loadTime,
      required,
      priority,
      stats: {
        memoryDelta: {
          heapUsed: memoryUsage.heapUsed,
          moduleSize
        },
        timestamp: new Date().toISOString()
      }
    };

    // モジュールキャッシュに保存
    moduleCache.set(featureName, result);
    
    logger.info(`✅ ${featureName} モジュール読み込み完了 (${loadTime}ms, サイズ: ${moduleSize / 1024}KB)`);
    return result;
    
  } catch (error) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      feature: featureName,
      required,
      priority
    };

    if (required) {
      logger.error(`❌ 必須モジュール ${featureName} の読み込みに失敗:`, errorInfo);
      throw error;
    }

    logger.error(`❌ ${featureName} モジュール読み込みエラー:`, errorInfo);
    return { feature: featureName, error: error.message, required, priority };
  }
}

// 超高速並列モジュール読み込み実行
(async () => {
  logger.info('🚀 機能モジュール超高速並列読み込み開始...');
  const moduleLoadStart = Date.now();

  try {
    // 優先度ごとにモジュールをグループ化
    const priorityGroups = new Map();
    for (const feature of featureDirs) {
      const group = priorityGroups.get(feature.priority) || [];
      group.push(feature);
      priorityGroups.set(feature.priority, group);
    }

    // 優先度順に並列読み込みを実行
    const successfulModules = [];
    const failedModules = [];
    const loadStats = {
      totalTime: 0,
      totalMemory: 0,
      moduleStats: new Map()
    };

    // 優先度の低い順にソート
    const priorities = Array.from(priorityGroups.keys()).sort((a, b) => a - b);

    for (const priority of priorities) {
      const features = priorityGroups.get(priority);
      logger.info(`📦 優先度 ${priority} のモジュールを読み込み中... (${features.length}個)`);

      // 並列読み込みタスクを作成
      const loadTasks = features.map(feature => () => loadFeatureModuleOptimized(feature));
      
      // 超高速並列実行
      const loadResults = await performanceManager.executeParallel(loadTasks, {
        maxConcurrency: 4, // 同時実行数を制限
        timeout: 30000,    // 30秒タイムアウト
        retries: 2         // 2回リトライ
      });

      // 読み込み結果の処理
      for (const result of loadResults) {
        if (result.status === 'fulfilled' && result.value && !result.value.error) {
        const feature = result.value.feature;
        const { module: featureModule, loadTime, stats } = result.value;
        successfulModules.push(feature);

        // 統計情報を記録（null安全化）
        loadStats.totalTime += loadTime;
        if (stats && stats.memoryDelta && typeof stats.memoryDelta.moduleSize === 'number') {
          loadStats.totalMemory += stats.memoryDelta.moduleSize;
        } else {
          loadStats.totalMemory += 0;
        }
        loadStats.moduleStats.set(feature, {
          loadTime,
          memoryUsage: (stats && stats.memoryDelta) ? stats.memoryDelta : {},
          timestamp: stats ? stats.timestamp : null
        });

        try {
          // コマンド・ハンドラー登録はinit関数で一括処理
          if (featureModule && typeof featureModule.init === 'function') {
            const beforeCommands = client.commands.size;
            const beforeHandlers = client.componentHandlers.length;
            await featureModule.init(client);
            logger.info(`[${feature}] init(client) 実行完了`);
            // 登録直後の状態をデバッグ出力
            logger.debug(`[${feature}] 登録後 client.commands.size: ${client.commands?.size}`);
            logger.debug(`[${feature}] 登録後 client.componentHandlers.length: ${client.componentHandlers?.length}`);
            // 差分を加算
            totalCommands += client.commands.size - beforeCommands;
            totalHandlers += client.componentHandlers.length - beforeHandlers;
          }
          // syuttaikin_botのload(client)呼び出し
          if (feature === 'syuttaikin_bot' && featureModule && typeof featureModule.load === 'function') {
            await featureModule.load(client);
            logger.info('✅ syuttaikin_bot.load(client) 実行完了');
          }
        } catch (registerError) {
          logger.error(`❌ ${feature} モジュール登録エラー:`, {
            error: registerError.message,
            stack: registerError.stack,
            feature
          });
          failedModules.push(feature);
        }

        } else {
          // result.value が undefined の場合も考慮
          const feature = result.value?.feature || result.reason?.feature || 'unknown';
          const errorMsg = result.value?.error || result.reason?.message || 'unknown error';
          const required = result.value?.required || false;

          if (required) {
            throw new Error(`必須モジュール ${feature} の読み込みに失敗: ${errorMsg}`);
          }

          logger.warn(`⚠️ モジュール読み込み失敗: ${feature} - ${errorMsg}`);
          failedModules.push(feature);
        }
      }
    }

  // コマンド・ハンドラー登録状況のデバッグログ
  logger.debug(`[DEBUG] コマンド登録数: ${client.commands?.size ?? 'undefined'}`);
  logger.debug(`[DEBUG] ハンドラー登録数: ${client.componentHandlers?.length ?? 'undefined'}`);

    const totalLoadTime = Date.now() - moduleLoadStart;
    logger.info(`🎉 超高速並列読み込み完了 (${totalLoadTime}ms)`);
    logger.info(`✅ 成功: ${successfulModules.length}/${featureDirs.length} モジュール`);
    
    if (failedModules.length > 0) {
      logger.warn(`⚠️ 失敗: ${failedModules.join(', ')}`);
    }

    // 詳細な統計情報を出力
    logger.info('📊 モジュール読み込み統計:', {
      totalLoadTime,
      totalModules: successfulModules.length + failedModules.length,
      successfulModules,
      failedModules,
      totalCommands,
      totalHandlers,
      performance: {
        averageLoadTime: loadStats.totalTime / successfulModules.length,
        totalMemoryUsage: loadStats.totalMemory / 1024 / 1024 + 'MB',
        moduleStats: Object.fromEntries(loadStats.moduleStats)
      }
    });

    // パフォーマンス統計出力
    const resourceUsage = performanceManager.getResourceUsage();
    logger.info('📊 リソース使用状況:', resourceUsage);

  } catch (error) {
    logger.error('❌ 並列モジュール読み込みでエラーが発生:', {
      error: error.message,
      stack: error.stack
    });
  }

  logger.info(`📦 ${totalCommands}コマンド, ${totalHandlers}ハンドラ読み込み完了`);
  
  logger.info('🔍 すべてのモジュール読み込み完了 - Discord初期化開始前');
})();

// イベントハンドラ読み込み
logger.info('🔍 イベントハンドラ読み込み開始');
const eventsPath = path.join(__dirname, 'events');
logger.info(`📁 eventsディレクトリ: ${eventsPath}`);
if (fs.existsSync(eventsPath)) {
  // devcmd.js は除外（コマンドデプロイ専用スクリプトのため）
  const eventFiles = fs.readdirSync(eventsPath)
    .filter(file => file.endsWith('.js'))
    .filter(file => !file.includes('devcmd') && !file.includes('deploy-commands')); // デプロイ系ファイルを除外
  
  logger.info(`📡 検出されたイベントファイル: ${eventFiles.join(', ')}`);
  
  for (const file of eventFiles) {
    try {
      logger.info(`🔍 イベントファイル読み込み中: ${file}`);
      const filePath = path.join(eventsPath, file);
      delete require.cache[require.resolve(filePath)];
      const event = require(filePath);
      
      // イベントオブジェクトの妥当性チェック
      if (!event || !event.name || !event.execute) {
        logger.warn(`⚠️ 無効なイベントファイル: ${file} (name または execute プロパティが不足)`);
        continue;
      }
      
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
      } else {
        client.on(event.name, (...args) => event.execute(...args));
      }
      logger.info(`✅ イベントファイル読み込み成功: ${file}`);
    } catch (error) {
      logger.error(`イベント${file}エラー: ${error.message}`);
    }
  }
  logger.info(`📡 ${eventFiles.length}イベント読み込み完了`);
} else {
  logger.error(`❌ eventsディレクトリが見つかりません: ${eventsPath}`);
}

// 終了処理
process.on('SIGINT', () => {
  logger.info('🛑 Bot終了中...');
  server.close(() => {
    logger.info('🌐 HTTPサーバー停止完了');
    if (typeof client !== 'undefined') {
      client.destroy();
    }
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  logger.info('🛑 Bot終了中 (SIGTERM)...');
  server.close(() => {
    logger.info('🌐 HTTPサーバー停止完了');
    if (typeof client !== 'undefined') {
      client.destroy();
    }
    process.exit(0);
  });
});

process.on('uncaughtException', (error) => {
  logger.error('💥 未処理例外が発生しましたが、プロセスを継続します:', {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  // process.exit(1) を削除 - Cloud Runでコンテナ終了を防ぐ
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('💥 Promise拒否が発生しましたが、プロセスを継続します:', {
    reason: reason,
    promise: promise,
    timestamp: new Date().toISOString()
  });
  // プロセス継続
});

} // initializeDiscordBot関数の終了