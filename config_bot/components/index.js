// config_bot/components/index.js

const fs = require('node:fs');
const path = require('node:path');
const logger = require('../../common/logger');

const componentHandlers = {};

const componentTypes = ['buttons', 'embeds', 'modals', 'panels', 'selects'];

for (const type of componentTypes) {
  const componentsPath = path.join(__dirname, type);
  if (!fs.existsSync(componentsPath)) {
    logger.debug(`[config_bot/components] ${type} ディレクトリが見つかりません: ${componentsPath}`);
    continue;
  }

  const componentFiles = fs.readdirSync(componentsPath).filter(file => file.endsWith('.js'));

  for (const file of componentFiles) {
    const filePath = path.join(componentsPath, file);
    try {
      const component = require(filePath);
      if (component.customId) {
        // customIdを持つコンポーネントを登録
        componentHandlers[component.customId] = component;
        logger.debug(`[config_bot/components] ${type} ハンドラーをロード: ${component.customId}`);
      } else if (component.name) {
        // nameを持つコンポーネントを登録（例: Embeds）
        componentHandlers[component.name] = component;
        logger.debug(`[config_bot/components] ${type} ハンドラーをロード: ${component.name}`);
      } else {
        logger.warn(`[config_bot/components] 無効なコンポーネントファイル (customIdまたはnameがありません): ${filePath}`);
      }
    } catch (error) {
      logger.error(`[config_bot/components] ${type} コンポーネントのロードエラー: ${filePath}`, error);
    }
  }
}

module.exports = componentHandlers;
