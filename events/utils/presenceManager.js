// events/utils/presenceManager.js - Bot プレゼンス管理ユーティリティ
const { ActivityType } = require('discord.js');
const logger = require('../../common/logger').createModuleLogger('presence-manager');

/**
 * Botステータス・プレゼンス設定
 * @param {import('discord.js').Client} client Discordクライアント
 * @returns {Promise<Object>} プレゼンス設定結果
 */
async function setBotPresence(client) {
  try {
    const guildCount = client.guilds.cache.size;
    const userCount = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
    
    await client.user.setPresence({
      status: 'online',
      activities: [{
        name: `${guildCount}サーバー・${userCount}ユーザーを監視中`,
        type: ActivityType.Watching,
      }]
    });
    
    logger.info(`🎭 Botプレゼンス設定完了: ${guildCount}サーバー・${userCount}ユーザー`);
    
    return { guildCount, userCount };
  } catch (error) {
    logger.warn('⚠️ Botプレゼンス設定失敗', { エラー: error.message });
    return { guildCount: 0, userCount: 0 };
  }
}

/**
 * 詳細なBot情報とシステム状況をログ出力
 * @param {import('discord.js').Client} client Discordクライアント
 * @returns {Object} Bot情報オブジェクト
 */
function logBotInfo(client) {
  const guilds = client.guilds.cache;
  const totalUsers = guilds.reduce((acc, guild) => acc + guild.memberCount, 0);
  const commandCount = client.commands?.size || 0;
  const handlerCount = client.componentHandlers?.length || 0;

  logger.info('🎉 ════════════════════════════════════════════════════════════');
  logger.info(`🤖 SVML Discord Bot 起動完了!`);
  logger.info(`👤 アカウント: ${client.user.tag} (${client.user.id})`);
  logger.info(`🏢 接続サーバー: ${guilds.size}個`);
  logger.info(`👥 総ユーザー数: ${totalUsers.toLocaleString()}人`);
  logger.info(`📝 登録コマンド: ${commandCount}個`);
  logger.info(`🎛️ コンポーネントハンドラー: ${handlerCount}個`);
  logger.info(`🌍 環境: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`⏰ 起動時刻: ${new Date().toLocaleString()}`);

  // コマンド・ハンドラーの詳細デバッグ出力
  logger.debug(`[DEBUG] client.commands:`, client.commands ? Array.from(client.commands.keys()) : 'undefined');
  logger.debug(`[DEBUG] client.componentHandlers:`, client.componentHandlers ? client.componentHandlers.map(h => h?.name || h?.constructor?.name || 'unknown') : 'undefined');

  // Cloud Run環境の場合、追加情報を表示
  if (process.env.K_SERVICE) {
    logger.info(`☁️ Cloud Run Service: ${process.env.K_SERVICE}`);
    logger.info(`🏷️ Cloud Run Revision: ${process.env.K_REVISION || 'unknown'}`);
  }

  logger.info('🎉 ════════════════════════════════════════════════════════════');

  // 接続サーバー詳細（デバッグレベル）
  if (guilds.size > 0) {
    logger.debug('📋 接続サーバー詳細:');
    guilds.forEach(guild => {
      logger.debug(`  • ${guild.name} (${guild.id}) - ${guild.memberCount}人`);
    });
  }

  return {
    userTag: client.user.tag,
    userId: client.user.id,
    guildCount: guilds.size,
    totalUsers,
    commandCount,
    handlerCount,
    environment: process.env.NODE_ENV || 'development',
    cloudRun: {
      service: process.env.K_SERVICE || null,
      revision: process.env.K_REVISION || null
    }
  };
}

module.exports = {
  setBotPresence,
  logBotInfo
};