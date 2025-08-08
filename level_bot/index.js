const fs = require('fs');
const path = require('path');
const logger = require('../common/logger');

const commands = new Map();
const componentHandlers = [];

function init(client) {
  // コマンド自動読み込み
  const commandsDir = path.join(__dirname, 'commands');
  if (fs.existsSync(commandsDir)) {
    const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
      try {
        const command = require(path.join(commandsDir, file));
        if (command.data && command.execute) {
          commands.set(command.data.name, command);
          client.commands.set(command.data.name, command);
          logger.info(`[level_bot] コマンド登録: ${command.data.name}`);
        }
      } catch (error) {
        logger.error(`[level_bot] コマンド読み込みエラー: ${file}`, error);
      }
    }
  }
  // componentHandlers自動読み込み
  const handlersDir = path.join(__dirname, 'handlers');
  if (fs.existsSync(handlersDir)) {
    const handlerFiles = fs.readdirSync(handlersDir).filter(file => file.endsWith('.js'));
    for (const file of handlerFiles) {
      try {
        const handler = require(path.join(handlersDir, file));
        if (handler && typeof handler.execute === 'function') {
          componentHandlers.push(handler);
          client.componentHandlers.push(handler);
          logger.info(`[level_bot] ハンドラー登録: ${file}`);
        }
      } catch (error) {
        logger.error(`[level_bot] ハンドラー読み込みエラー: ${file}`, error);
      }
    }
  }
  // コマンド・ハンドラー登録直後のデバッグログ追加
  logger.debug(`[level_bot] 登録後 client.commands.size: ${client.commands?.size}`);
  logger.debug(`[level_bot] 登録後 client.componentHandlers.length: ${client.componentHandlers?.length}`);
}

module.exports = {
  commands,
  componentHandlers,
  init,
};
