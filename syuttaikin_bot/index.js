// syuttaikin_bot/index.js - 出退勤システムメインモジュール
const path = require('node:path');
const fs = require('node:fs');
const logger = require('../common/logger').createModuleLogger('syuttaikin_bot');

// コマンドの読み込み
const commands = new Map();
try {
  const commandsPath = path.join(__dirname, 'commands');
  if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
      try {
        const command = require(path.join(commandsPath, file));
        if (command.data && command.execute) {
          commands.set(command.data.name, command);
          logger.debug(`✅ [syuttaikin_bot] コマンド読み込み: ${command.data.name}`);
        }
      } catch (error) {
        logger.error(`❌ [syuttaikin_bot] コマンド読み込みエラー [${file}]:`, error);
      }
    }
  }
} catch (error) {
  logger.error('❌ [syuttaikin_bot] Commands ディレクトリ読み込みエラー:', error);
}

// 出退勤システムモジュール
module.exports = {
  name: 'syuttaikin_bot',
  commands, // commands配列をエクスポート
  
  async load(client) {
    logger.info('🕐 出退勤システム初期化開始');
    
    const results = {
      commands: 0,
      buttons: 0,
      selects: 0,
      modals: 0,
      errors: []
    };

    try {
      // コマンド読み込み
      const commandsPath = path.join(__dirname, 'commands');
      if (fs.existsSync(commandsPath)) {
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
          try {
            const command = require(path.join(commandsPath, file));
            if (command.data && command.execute) {
              client.commands.set(command.data.name, command);
              results.commands++;
              logger.debug(`✅ コマンド登録: ${command.data.name}`);
            }
          } catch (error) {
            logger.error(`❌ コマンド読み込みエラー [${file}]:`, error);
            results.errors.push(`Command ${file}: ${error.message}`);
          }
        }
      }

      // ハンドラー読み込み
      const handlersPath = path.join(__dirname, 'handlers');
      if (fs.existsSync(handlersPath)) {
        const handlerFiles = fs.readdirSync(handlersPath).filter(file => file.endsWith('.js'));
        
        for (const file of handlerFiles) {
          try {
            const handlers = require(path.join(handlersPath, file));
            
            for (const [key, handler] of Object.entries(handlers)) {
              if (typeof handler === 'function') {
                // ボタンハンドラーの登録
                if (key.includes('syuttaikin') || key.includes('cast_attendance') || key.includes('staff_attendance')) {
                  if (!client.buttonHandlers) client.buttonHandlers = new Map();
                  client.buttonHandlers.set(key, handler);
                  results.buttons++;
                  logger.debug(`✅ ボタンハンドラー登録: ${key}`);
                }
              }
            }
          } catch (error) {
            logger.error(`❌ ハンドラー読み込みエラー [${file}]:`, error);
            results.errors.push(`Handler ${file}: ${error.message}`);
          }
        }
      }

      // セレクトメニューハンドラー読み込み
      const selectsPath = path.join(__dirname, 'components', 'selects');
      if (fs.existsSync(selectsPath)) {
        const selectFiles = fs.readdirSync(selectsPath).filter(file => file.endsWith('.js'));
        
        for (const file of selectFiles) {
          try {
            const selects = require(path.join(selectsPath, file));
            
            for (const [key, handler] of Object.entries(selects)) {
              if (typeof handler === 'function') {
                if (!client.selectHandlers) client.selectHandlers = new Map();
                client.selectHandlers.set(key, handler);
                results.selects++;
                logger.debug(`✅ セレクトハンドラー登録: ${key}`);
              }
            }
          } catch (error) {
            logger.error(`❌ セレクト読み込みエラー [${file}]:`, error);
            results.errors.push(`Select ${file}: ${error.message}`);
          }
        }
      }

      logger.info(`✅ 出退勤システム初期化完了: コマンド${results.commands}個, ボタン${results.buttons}個, セレクト${results.selects}個`);
      
      if (results.errors.length > 0) {
        logger.warn(`⚠️ 初期化時エラー ${results.errors.length}件:`, results.errors);
      }

      return {
        success: true,
        moduleName: 'syuttaikin_bot',
        loaded: {
          commands: results.commands,
          buttons: results.buttons,
          selects: results.selects,
          modals: results.modals
        },
        errors: results.errors
      };

    } catch (error) {
      logger.error('💥 出退勤システム初期化中にエラー:', error);
      return {
        success: false,
        moduleName: 'syuttaikin_bot',
        error: error.message,
        errors: results.errors
      };
    }
  },

  init(client) {
    if (client && client.commands && commands) {
      for (const [name, command] of commands) {
        client.commands.set(name, command);
      }
      logger.info(`[syuttaikin_bot] client.commands へコマンド登録完了: ${commands.size}件`);
    }
    // buttonHandlers登録（既存のload(client)と同様の処理を必要に応じて追加）
    // componentHandlers登録（未実装の場合は空）
    if (client && client.componentHandlers && Array.isArray(componentHandlers)) {
      for (const handler of componentHandlers) {
        if (handler && typeof handler.execute === 'function') {
          client.componentHandlers.push(handler);
        }
      }
      logger.info(`[syuttaikin_bot] client.componentHandlers へハンドラー登録完了: ${componentHandlers.length}件`);
    }

    // コマンド・ハンドラー登録直後のデバッグログ追加
    logger.debug(`[syuttaikin_bot] 登録後 client.commands.size: ${client.commands?.size}`);
    logger.debug(`[syuttaikin_bot] 登録後 client.componentHandlers.length: ${client.componentHandlers?.length}`);
  }
};
