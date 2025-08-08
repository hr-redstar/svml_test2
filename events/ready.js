// events/ready.js - Bot Ready Event Handler
const { Events, EmbedBuilder } = require('discord.js');
const logger = require('../common/logger').createModuleLogger('ready-event');
const { logGlobalCommand } = require('../common/utils/configLogger');
const performanceManager = require('../common/performance/performanceManager');

// イベントユーティリティモジュール
const { checkGcsConnection } = require('./utils/gcsChecker');
const { initializeScheduledTasks, logMemoryUsage } = require('./utils/taskScheduler');
const { setBotPresence, logBotInfo } = require('./utils/presenceManager');
const { deployDiscordCommands } = require('./utils/commandDeployer');
const { PerformanceTracker } = require('./utils/performanceTracker');

/**
 * システムログに起動ログを記録
 * @param {import('discord.js').Client} client Discordクライアント
 * @param {Object} botInfo Bot情報
 * @param {Object} systemMetrics システムメトリクス
 * @param {number} readyTime 起動時間
 * @param {Object} gcsResult GCS接続結果
 * @param {Object} taskInfo タスク情報
 */
async function logSystemStartup(client, botInfo, systemMetrics, readyTime, gcsResult, taskInfo) {
  try {
    logger.debug('logSystemStartup: gcsResult の内容:', gcsResult); // 既存のログ
    logger.debug('logSystemStartup: gcsResult.value.value の内容:', gcsResult?.value?.value); // 追加
    for (const guild of client.guilds.cache.values()) {
      const systemLogEmbed = new EmbedBuilder()
        .setTitle('🚀 SVML Bot 起動完了')
        .setDescription('SVML Discord Botが正常に起動しました')
        .addFields(
          { name: 'Botアカウント', value: `${client.user.tag}`, inline: true },
          { name: '起動時刻', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
          { name: '起動時間', value: `${readyTime}ms`, inline: true },
          { name: '接続サーバー数', value: `${botInfo.guildCount}個`, inline: true },
          { name: '総ユーザー数', value: `${botInfo.totalUsers.toLocaleString()}人`, inline: true },
          { name: '登録コマンド数', value: `${botInfo.commandCount}個`, inline: true },
          { name: 'GCS接続', value: gcsResult && gcsResult.status === 'fulfilled' && gcsResult.value && gcsResult.value.value !== null && gcsResult.value.value.connected === true ? '✅ 正常' : '❌ 失敗', inline: true },
          { name: '定期タスク', value: `${taskInfo && taskInfo.successfulTasks ? taskInfo.successfulTasks : 0}/${taskInfo && taskInfo.successfulTasks && taskInfo.failedTasks ? taskInfo.successfulTasks + taskInfo.failedTasks : 0} 成功`, inline: true },
          { name: '環境', value: process.env.NODE_ENV || 'development', inline: true },
          { name: 'メモリ使用量', value: `${systemMetrics.memory.heapUsed}MB / ${systemMetrics.memory.heapTotal}MB`, inline: true },
          { name: 'アップタイム', value: `${systemMetrics.uptime}秒`, inline: true }
        )
        .setColor(0x00ff00)
        .setTimestamp();
      
      // Cloud Run環境の場合、追加情報を含める
      if (process.env.K_SERVICE) {
        systemLogEmbed.addFields(
          { name: 'Cloud Run Service', value: process.env.K_SERVICE, inline: true },
          { name: 'Cloud Run Revision', value: process.env.K_REVISION || 'unknown', inline: true }
        );
      }
      
      // 疑似インタラクションを作成してログ記録
      const fakeInteraction = {
        guildId: guild.id,
        guild: guild,
        user: client.user,
        channel: { id: guild.systemChannelId || guild.channels.cache.first()?.id }
      };
      
      await logGlobalCommand(fakeInteraction, systemLogEmbed);
      break; // 1回だけ記録
    }
  } catch (logError) {
    logger.warn('システムログ記録に失敗', { エラー: logError.message });
  }
}

module.exports = {
  name: Events.ClientReady,
  once: true,
  /**
   * Botの準備が完了したときに一度だけ実行される処理
   * @param {import('discord.js').Client} client Discordクライアント
   */
  async execute(client) {
    const readyStartTime = Date.now();
    logger.info('🚀 Bot Ready イベント開始...');
    
    try {
      // 基本情報のログ出力
      const botInfo = logBotInfo(client);
      
      // Botプレゼンス設定
      const presenceInfo = await setBotPresence(client);
      
      // システムメトリクス取得
      const systemMetrics = PerformanceTracker.logSystemMetrics();
      
      // 並列実行可能な初期化タスク（パフォーマンス最適化）
      logger.info('🔄 初期化タスク並列実行開始...');
      const initializationTasks = [
        {
          name: 'GCS接続確認',
          execute: checkGcsConnection
        },
        {
          name: 'Discordコマンドデプロイ',
          execute: async () => await deployDiscordCommands(client)
        }
      ];
      
      const parallelResults = await performanceManager.executeParallel(initializationTasks, 2);
      const [gcsResult, deployResult] = parallelResults;
      
      // GCS接続結果処理
      if (gcsResult.status === 'fulfilled') {
        if (gcsResult.value && gcsResult.value.value !== null && gcsResult.value.value.connected) {
          logger.info('✅ GCS接続確認完了');
        } else {
          const reason = gcsResult.value?.reason || '不明';
          const errorDetail = gcsResult.value?.error || '詳細なし';
          logger.warn('⚠️ GCS接続確認失敗', { 
            理由: reason, 
            詳細: errorDetail,
            GCS結果: gcsResult.value 
          });
        }
      } else {
        logger.error('💥 GCS接続確認タスクで予期せぬエラー', { エラー: gcsResult.reason });
      }
      
      // デプロイ結果処理
      if (deployResult && deployResult.status === 'fulfilled') {
        if (deployResult.value && deployResult.value.deployed) {
          const commandCount = deployResult.value.commands || '不明';
          logger.info(`✅ Discordコマンド自動デプロイ完了: ${commandCount}個`);
        } else {
          const reason = deployResult.value ? deployResult.value.reason : '結果なし';
          logger.debug(`⏭️ Discordコマンドデプロイスキップ: ${reason}`);
        }
      } else {
        const error = deployResult ? deployResult.reason : '結果なし';
        logger.error('💥 Discordコマンドデプロイでエラー', { エラー: error });
      }
      
      // 定期タスクの初期化（キャッシュで高速化）
      const taskInfo = await performanceManager.executeWithCache(
        'scheduled-tasks-init',
        () => initializeScheduledTasks(client),
        60000 // 1分キャッシュ
      );
      
      // Config Bot の初期化（パネル更新サービス）
      try {
        logger.info('🔧 Config Bot 初期化開始...');
        const configBot = require('../config_bot');
        if (configBot && typeof configBot.init === 'function') {
          configBot.init(client);
          logger.info('✅ Config Bot 初期化完了');
        } else {
          logger.warn('⚠️ Config Bot 初期化関数が見つかりません');
        }
      } catch (configError) {
        logger.error('❌ Config Bot 初期化エラー:', configError);
      }
      
      // Ready完了サマリー
      const readyTime = Date.now() - readyStartTime;
      PerformanceTracker.trackEventExecution('Bot Ready Event', readyStartTime, {
        guildCount: botInfo.guildCount,
        userCount: botInfo.totalUsers,
        commandCount: botInfo.commandCount
      });
      
      logger.info('🎊 ────────────────────────────────────────────────────────');
      logger.info(`🎉 SVML Discord Bot 完全起動完了! (${readyTime}ms)`);
      logger.info(`📊 起動統計:`);
      logger.info(`  ├─ サーバー数: ${botInfo.guildCount}`);
      logger.info(`  ├─ ユーザー数: ${botInfo.totalUsers.toLocaleString()}`);
      logger.info(`  ├─ コマンド数: ${botInfo.commandCount}`);
      logger.info(`  ├─ ハンドラー数: ${botInfo.handlerCount}`);
      logger.info(`  ├─ GCS接続: ${gcsResult && gcsResult.status === 'fulfilled' && gcsResult.value && gcsResult.value.value !== null && gcsResult.value.value.connected === true ? '✅' : '❌'}`);
      logger.info(`  ├─ 定期タスク: ${taskInfo && taskInfo.successfulTasks ? taskInfo.successfulTasks : 0}/${taskInfo && taskInfo.successfulTasks && taskInfo.failedTasks ? taskInfo.successfulTasks + taskInfo.failedTasks : 0}`);
      logger.info(`  ├─ メモリ使用量: ${systemMetrics.memory.heapUsed}MB`);
      logger.info(`  └─ 起動時間: ${readyTime}ms`);
      logger.info('🎊 ────────────────────────────────────────────────────────');
      
      // システムログに起動ログを記録
      await logSystemStartup(client, botInfo, systemMetrics, readyTime, gcsResult, taskInfo || { successfulTasks: 0, failedTasks: 0 });
      
    } catch (error) {
      const readyTime = Date.now() - readyStartTime;
      logger.error(`💥 Bot Ready イベント処理中にエラー (${readyTime}ms)`);
      logger.error('🔍 エラー詳細', { エラー: error.message });
      if (error.stack) {
        logger.debug('📚 スタックトレース', { Stack: error.stack });
      }
    }
  },
};