// common/logger.js

const winston = require('winston');
const path = require('path');
const fs = require('fs');

const { combine, timestamp, printf, colorize, json, errors, align, splat } = winston.format;

// ログディレクトリの確実な作成
const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * 開発環境用のカラフルで詳細なコンソールフォーマット
 */
const devConsoleFormat = printf((info) => {
  const { level, message, timestamp, stack, module, feature, ...rest } = info;
  
  // タイムスタンプの色付け
  const coloredTimestamp = `\x1b[90m${timestamp}\x1b[0m`; // グレー
  
  // モジュール情報の表示
  const moduleInfo = module ? `\x1b[36m[${module}]\x1b[0m ` : '';
  const featureInfo = feature ? `\x1b[35m[${feature}]\x1b[0m ` : '';
  
  // メインメッセージ
  let msg = `${coloredTimestamp} ${level}: ${moduleInfo}${featureInfo}${stack || message}`;
  
  // 追加情報の詳細出力
  if (rest && Object.keys(rest).length > 0) {
    // Errorオブジェクトの特別処理
    if (rest.error && rest.error instanceof Error) {
      msg += `\n  \x1b[31m❌ エラー: ${rest.error.message}\x1b[0m`;
      if (rest.error.stack) {
        const stackLines = rest.error.stack.split('\n').slice(1);
        const formattedStack = stackLines.slice(0, 3).map(line => 
          `  \x1b[90m   ${line.trim()}\x1b[0m`
        ).join('\n');
        if (formattedStack) msg += `\n${formattedStack}`;
        if (stackLines.length > 3) {
          msg += `\n  \x1b[90m   ... あと${stackLines.length - 3}行\x1b[0m`;
        }
      }
    } else if (rest.error && typeof rest.error === 'object') {
      msg += `\n  \x1b[31m❌ エラーオブジェクト: ${JSON.stringify(rest.error, null, 2)}\x1b[0m`;
    }
    
    // その他のプロパティの出力（配列や文字列の適切な処理）
    Object.entries(rest).forEach(([key, value]) => {
      if (key !== 'error' && key !== 'service' && key !== 'version' && key !== 'environment' && key !== 'pid') {
        let formattedValue;
        
        // 値の型に応じた適切なフォーマット
        if (typeof value === 'string') {
          formattedValue = value;
        } else if (Array.isArray(value)) {
          formattedValue = `[${value.join(', ')}]`;
        } else if (typeof value === 'object' && value !== null) {
          // オブジェクトを一行で表示する場合は簡潔に
          if (Object.keys(value).length <= 3) {
            formattedValue = JSON.stringify(value);
          } else {
            formattedValue = JSON.stringify(value, null, 2).split('\n').map(line => `    ${line}`).join('\n');
          }
        } else {
          formattedValue = String(value);
        }
        
        msg += `\n  \x1b[33m📋 ${key}:\x1b[0m ${formattedValue}`;
      }
    });
  }
  
  return msg;
});

/**
 * 本番環境用のJSONフォーマット（構造化ログ）
 */
const prodJsonFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  errors({ stack: true }),
  splat(),
  json({
    replacer: (key, value) => {
      // Errorオブジェクトのプロパティを確実にシリアライズ
      if (value instanceof Error) {
        return {
          message: value.message,
          stack: value.stack,
          name: value.name,
          ...value
        };
      }
      return value;
    }
  })
);

/**
 * 開発環境用のフォーマット（エラー処理を安全に）
 */
const safeColorize = winston.format((info, opts) => {
  try {
    // カラー設定が利用可能かチェック
    if (colorize && typeof colorize === 'function') {
      const colorizer = colorize({ all: false, level: true });
      return colorizer.transform(info, opts);
    }
    // カラー設定が失敗した場合は無色で返す
    return info;
  } catch (error) {
    // カラー設定エラーを無視して無色で続行
    return info;
  }
});

const devFormat = combine(
  timestamp({ format: 'HH:mm:ss.SSS' }),
  align(),
  errors({ stack: true }),
  splat(),
  safeColorize(),
  devConsoleFormat
);

// ログレベルの設定（環境変数または開発環境でdebug）
const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// メインロガーの作成（エラーハンドリング強化）
const logger = winston.createLogger({
  level: logLevel,
  format: process.env.NODE_ENV === 'production' ? prodJsonFormat : devFormat,
  defaultMeta: {
    service: 'svml-discord-bot',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    pid: process.pid,
  },
  transports: [
    // コンソール出力（常に有効）
    new winston.transports.Console({
      handleExceptions: false, // 手動でハンドリング
      handleRejections: false, // 手動でハンドリング
    }),
  ],
  // 例外ハンドリングは無効化（手動で処理）
  exitOnError: false,
  rejectionHandlers: [
    new winston.transports.Console(),
  ],
});

// 本番環境の場合、ファイル出力を追加
if (process.env.NODE_ENV === 'production') {
  // エラーログファイル
  logger.add(new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    format: prodJsonFormat,
  }));
  
  // 全ログファイル
  logger.add(new winston.transports.File({
    filename: path.join(logDir, 'combined.log'),
    maxsize: 10485760, // 10MB
    maxFiles: 10,
    format: prodJsonFormat,
  }));
  
  // デバッグログファイル（開発用）
  logger.add(new winston.transports.File({
    filename: path.join(logDir, 'debug.log'),
    level: 'debug',
    maxsize: 20971520, // 20MB
    maxFiles: 3,
    format: prodJsonFormat,
  }));
}

// 起動時にロガー設定をログ出力
logger.info('🪵 ログシステム初期化完了', {
  logLevel: logLevel,
  environment: process.env.NODE_ENV || 'development',
  outputFormat: process.env.NODE_ENV === 'production' ? 'JSON構造化ログ' : 'カラーコンソール出力',
  fileLogging: process.env.NODE_ENV === 'production' ? '有効' : '無効',
  logDirectory: process.env.NODE_ENV === 'production' ? logDir : 'コンソールのみ',
});

// モジュール固有のロガーを作成するヘルパー関数
logger.createModuleLogger = function(moduleName, feature = null) {
  return {
    error: (message, meta = {}) => logger.error(message, { module: moduleName, feature, ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { module: moduleName, feature, ...meta }),
    info: (message, meta = {}) => logger.info(message, { module: moduleName, feature, ...meta }),
    debug: (message, meta = {}) => logger.debug(message, { module: moduleName, feature, ...meta }),
    verbose: (message, meta = {}) => logger.verbose(message, { module: moduleName, feature, ...meta }),
  };
};

// パフォーマンス測定ヘルパー
logger.time = function(label) {
  const start = Date.now();
  return {
    end: (message = '', meta = {}) => {
      const duration = Date.now() - start;
      logger.info(`⏱️ ${label}: ${message}`, { 処理時間: `${duration}ms`, ...meta });
      return duration;
    }
  };
};

// 統計情報収集
let logStats = {
  error: 0,
  warn: 0,
  info: 0,
  debug: 0,
  startTime: Date.now()
};

// ログ統計をカウント
const originalLog = logger.log;
logger.log = function(level, message, meta) {
  const levelName = (typeof level === 'object' && level.level) ? level.level : level;
  if (logStats[levelName]) {
    logStats[levelName]++;
  }
  return originalLog.call(this, level, message, meta);
};

// 統計情報を取得する関数
logger.getStats = function() {
  const uptime = Date.now() - logStats.startTime;
  const uptimeSeconds = Math.floor(uptime / 1000);
  const minutes = Math.floor(uptimeSeconds / 60);
  const seconds = uptimeSeconds % 60;
  
  return {
    エラー: logStats.error,
    警告: logStats.warn,
    情報: logStats.info,
    デバッグ: logStats.debug,
    稼働時間: minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`,
    稼働時間ms: uptime
  };
};

module.exports = logger;