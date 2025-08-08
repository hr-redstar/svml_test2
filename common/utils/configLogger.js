const { EmbedBuilder } = require('discord.js');
const logger = require('../logger');
const path = require('path');

// 絶対パスでconfig_botのconfigStateManagerを参照
let readConfigState;
try {
  const configStateManagerPath = path.join(__dirname, '../../config_bot/utils/configStateManager');
  ({ readState: readConfigState } = require(configStateManagerPath));
} catch (error) {
  logger.error('[configLogger] config_botのconfigStateManager読み込みエラー:', { 
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  });
  // フォールバック: 空の設定を返す
  readConfigState = async () => ({ 
    logChannelId: null, 
    commandLogChannelId: null, 
    globalCommandLogChannelId: null 
  });
}

/**
 * ログタイプに基づいて適切なログスレッドを取得します。
 * @param {import('discord.js').Interaction} interaction
 * @param {string} logType - 'config', 'command', 'global' のいずれか
 * @returns {Promise<import('discord.js').ThreadChannel|null>}
 */
async function getActiveLogThread(interaction, logType = 'config') {
  const guildId = interaction.guildId;
  const guildName = interaction.guild?.name || 'Unknown Guild';
  
  try {
    logger.debug(`[configLogger] ギルド ${guildName} (${guildId}) の${logType}ログスレッド取得開始`);
    
    // GCSからギルド固有のログ設定を取得
    const config = await readConfigState(guildId);
    const { logChannelId, logThreadIds } = config;
    
    logger.debug(`[configLogger] ギルド ${guildName} (${guildId}) の設定取得完了:`, { 
      logChannelId,
      logThreadIds
    });
    
    if (!logChannelId || !logThreadIds) {
      logger.warn(`[configLogger] ギルド ${guildName} (${guildId}) のログチャンネルが未設定です。`);
      return null;
    }
    
    // 新しいスレッド名のマッピング
    const threadMapping = {
      'config': '設定ログ',
      'command': 'コマンドログ',
      'global': 'グローバルログ'
    };
    
    const threadName = threadMapping[logType];
    const logThreadId = logThreadIds[threadName];

    if (!logThreadId) {
      logger.warn(`[configLogger] ギルド ${guildName} (${guildId}) の${logType}ログスレッドが未設定です。ログ記録をスキップします。`);
      return null;
    }

    logger.debug(`[configLogger] ギルド ${guildName} (${guildId}) の${logType}ログスレッドID: ${logThreadId}`);

    // スレッドを直接取得
    const logThread = await interaction.guild.channels.fetch(logThreadId).catch((error) => {
      logger.error(`[configLogger] ギルド ${guildName} (${guildId}) のスレッド取得エラー:`, { 
        error: error instanceof Error ? error.message : String(error),
        guildId: guildId,
        logThreadId: logThreadId
      });
      return null;
    });
    
    if (!logThread || !logThread.isThread() || logThread.archived) {
      logger.error(`[configLogger] ギルド ${guildName} (${guildId}) の${logType}ログスレッドが見つからないかアーカイブされています: ${logThreadId}`);
      return null;
    }

    logger.debug(`[configLogger] ギルド ${guildName} (${guildId}) の${logType}ログスレッド取得成功`);
    return logThread;
  } catch (error) {
    logger.error(`[configLogger] ギルド ${guildName} (${guildId}) のログスレッド取得中にエラーが発生:`, { 
      error: error instanceof Error ? error.message : String(error),
      guildId: guildId,
      logType: logType
    });
    return null;
  }
}

/**
 * 設定変更のログを専用スレッドに記録します。
 * @param {import('discord.js').Interaction} interaction - ログのトリガーとなったインタラクション
 * @param {EmbedBuilder} embed - 記録するEmbedオブジェクト
 */
async function logConfigChange(interaction, embed) {
  try {
    const thread = await getActiveLogThread(interaction, 'config');
    if (thread) {
      await thread.send({ embeds: [embed] });
      logger.info('設定変更ログを記録しました。');
    }
  } catch (error) {
    logger.error('設定ログの記録中にエラーが発生しました。', { error });
  }
}

/**
 * コマンド実行のログを専用スレッドに記録します。
 * @param {import('discord.js').Interaction} interaction - ログのトリガーとなったインタラクション
 * @param {EmbedBuilder} embed - 記録するEmbedオブジェクト
 */
async function logCommandExecution(interaction, embed) {
  try {
    const thread = await getActiveLogThread(interaction, 'command');
    if (thread) {
      await thread.send({ embeds: [embed] });
      logger.info('コマンド実行ログを記録しました。');
    }
  } catch (error) {
    logger.error('コマンドログの記録中にエラーが発生しました。', { error });
  }
}

/**
 * グローバルコマンドのログを専用スレッドに記録します。
 * @param {import('discord.js').Interaction} interaction - ログのトリガーとなったインタラクション
 * @param {EmbedBuilder} embed - 記録するEmbedオブジェクト
 */
async function logGlobalCommand(interaction, embed) {
  try {
    const thread = await getActiveLogThread(interaction, 'global');
    if (thread) {
      await thread.send({ embeds: [embed] });
      logger.info('グローバルコマンドログを記録しました。');
    }
  } catch (error) {
    logger.error('グローバルログの記録中にエラーが発生しました。', { error });
  }
}

module.exports = { 
  logConfigChange, 
  logCommandExecution, 
  logGlobalCommand, 
  getActiveLogThread 
};