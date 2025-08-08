// config_bot/services/panelUpdateService.js - 設定パネル自動更新サービス

const { EmbedBuilder } = require('discord.js');
const logger = require('../../common/logger').createModuleLogger('panel-update-service');
const { readState: readConfigState } = require('../utils/configStateManager');
const performanceManager = require('../../common/performance/performanceManager');
const panelUpdateStateManager = require('./panelUpdateStateManager');

/**
 * パネル更新サービスクラス
 */
class PanelUpdateService {
  constructor() {
    // 状態管理はStateManagerに委譲
    this.state = panelUpdateStateManager;
    this.client = null;
    this.coreConfigHandler = null;
    logger.info('📊 パネル更新サービス初期化完了');
  }

  /**
   * サービス初期化（Discordクライアント設定）
   * @param {Client} client - Discordクライアント
   */
  init(client) {
    this.client = client;
    // 循環依存を避けるため遅延読み込み
    if (!this.coreConfigHandler) {
      this.coreConfigHandler = require('../handlers/coreConfigHandler');
    }
    logger.info('✅ パネル更新サービスにDiscordクライアント設定完了');
  }

  /**
   * 設定変更時のパネル更新をキューに追加
   * @param {string} guildId - ギルドID
   * @param {string} updateType - 更新タイプ (store, role, logChannel)
   * @param {Object} updateData - 更新データ
   * @param {Object} interaction - Discordインタラクション
   */
  async queuePanelUpdate(guildId, updateType, updateData, interaction) {
    try {
      logger.info(`🔄 パネル更新キューに追加: ${guildId} (${updateType})`);
      // StateManagerに追加
      this.state.addUpdate(guildId, {
        guildId,
        updateType,
        updateData,
        interaction,
        timestamp: Date.now()
      });
      this.scheduleBatchUpdate();
    } catch (error) {
      logger.error('❌ パネル更新キューエラー:', error);
    }
  }

  /**
   * バッチ更新のスケジューリング
   */
  scheduleBatchUpdate() {
    // 既存のタイムアウトをStateManagerでクリア
    this.state.clearBatchTimeout();
    // 新しいタイムアウトをStateManagerに設定
    const timeout = setTimeout(async () => {
      await this.processBatchUpdates();
    }, this.state.BATCH_DELAY || 2000);
    this.state.setBatchTimeout(timeout);
  }

  /**
   * バッチ更新の処理
   */
  async processBatchUpdates() {
    if (this.state.isProcessing || this.state.updateQueue.size === 0) {
      return;
    }
    this.state.setProcessing(true);
    const updates = Array.from(this.state.updateQueue.values());
    this.state.clearQueue();
    logger.info(`📊 バッチ更新開始: ${updates.length}件の更新`);
    try {
      // 並列でパネル更新を実行
      const updateTasks = updates.map(updateData => 
        () => this.updateSinglePanel(updateData)
      );

      const results = await performanceManager.executeParallel(updateTasks, {
        maxConcurrency: 5,
        timeout: 10000
      });

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      logger.info(`✅ バッチ更新完了: 成功${successful}件, 失敗${failed}件`);
      this.state.setLastBatchTime(Date.now());
    } catch (error) {
      logger.error('❌ バッチ更新エラー:', error);
    } finally {
      this.state.setProcessing(false);
    }
  }

  /**
   * 単一パネルの更新
   * @param {Object} updateData - 更新データ
   */
  async updateSinglePanel(updateData) {
    const { guildId, updateType, interaction } = updateData;
    
    try {
      logger.debug(`🔄 パネル更新開始: ${guildId} (${updateType})`);

      // 設定状態から更新対象パネルを取得
      const configState = await readConfigState(guildId);
      const panelMessageId = configState.configPanelMessageId;
      const panelChannelId = configState.configPanelChannelId;

      logger.debug(`📋 パネル情報確認: messageId=${panelMessageId}, channelId=${panelChannelId}`);

      if (!panelMessageId || !panelChannelId) {
        logger.debug(`⏭️ 更新対象パネルなし: ${guildId} - パネルが未設置またはIDが未保存`);
        return { updated: false, reason: 'NO_PANEL_FOUND' };
      }

      // Discordクライアントの取得
      const client = interaction?.client || this.client;
      if (!client) {
        logger.warn('⚠️ Discordクライアントが見つかりません');
        return { updated: false, reason: 'NO_CLIENT' };
      }

      // チャンネルとメッセージを取得
      const channel = await client.channels.fetch(panelChannelId).catch((error) => {
        logger.debug(`チャンネル取得エラー: ${error.message}`);
        return null;
      });
      if (!channel) {
        logger.debug(`⚠️ パネルチャンネルが見つかりません: ${panelChannelId}`);
        return { updated: false, reason: 'CHANNEL_NOT_FOUND' };
      }

      const message = await channel.messages.fetch(panelMessageId).catch((error) => {
        logger.debug(`メッセージ取得エラー: ${error.message}`);
        return null;
      });
      if (!message) {
        logger.warn(`⚠️ パネルメッセージが見つかりません: ${panelMessageId} - 状態をクリア`);
        
        // 無効なパネル情報をクリア
        const { updateState: updateConfigState } = require('../utils/configStateManager');
        await updateConfigState(guildId, (state) => {
          state.configPanelMessageId = null;
          state.configPanelChannelId = null;
          return state;
        });
        
        return { updated: false, reason: 'MESSAGE_NOT_FOUND' };
      }

      // 新しいパネル内容を構築（遅延読み込み）
      if (!this.coreConfigHandler) {
        this.coreConfigHandler = require('../handlers/coreConfigHandler');
      }
      const newPanelContent = await this.coreConfigHandler.buildCoreConfigPanel(guildId);
      
      // パネルを更新
      await message.edit({
        content: '⚙️ **SVML基本設定パネル**\n\n店舗名・役職・ログチャンネルの設定を行えます。',
        embeds: newPanelContent.embeds,
        components: newPanelContent.components
      });

      // 更新通知embed作成
      const updateEmbed = this.createUpdateNotificationEmbed(updateType, updateData);
      
      // 短時間表示後に自動削除される更新通知を送信
      if (channel.isTextBased()) {
        const notification = await channel.send({
          embeds: [updateEmbed]
        });

        // 5秒後に通知を削除
        setTimeout(async () => {
          try {
            await notification.delete();
          } catch (deleteError) {
            logger.debug('更新通知削除エラー（無視）:', deleteError.message);
          }
        }, 5000);
      }

      logger.info(`✅ パネル更新完了: ${guildId} (${updateType})`);
      return { updated: true, panelMessageId, panelChannelId };

    } catch (error) {
      logger.error(`❌ パネル更新エラー: ${guildId} (${updateType})`, error);
      return { updated: false, error: error.message };
    }
  }

  /**
   * 更新通知Embedの作成
   * @param {string} updateType - 更新タイプ
   * @param {Object} updateData - 更新データ
   * @returns {EmbedBuilder} 更新通知Embed
   */
  createUpdateNotificationEmbed(updateType, updateData) {
    const { interaction } = updateData;
    
    const typeInfo = {
      store: { icon: '🏪', name: '店舗名設定', color: 0x5865f2 },
      role: { icon: '👥', name: '役職設定', color: 0x9932CC },
      logChannel: { icon: '📝', name: 'ログチャンネル設定', color: 0x00FF00 }
    };

    const info = typeInfo[updateType] || { icon: '⚙️', name: '設定', color: 0x808080 };

    return new EmbedBuilder()
      .setColor(info.color)
      .setDescription(`${info.icon} **${info.name}が更新されました**\n更新者: ${interaction?.user?.tag || '不明'}`)
      .setTimestamp()
      .setFooter({ text: 'このメッセージは5秒後に自動削除されます' });
  }

  /**
   * サービス統計の取得
   */
  getStats() {
    return this.state.getState();
  }

  /**
   * 強制的にバッチ更新を実行
   */
  async forceBatchUpdate() {
    this.state.clearBatchTimeout();
    await this.processBatchUpdates();
  }

  /**
   * サービスのクリーンアップ
   */
  cleanup() {
    this.state.clearBatchTimeout();
    this.state.clearQueue();
    this.state.setProcessing(false);
    logger.info('🧹 パネル更新サービスクリーンアップ完了');
  }
}

// シングルトンインスタンス
const panelUpdateService = new PanelUpdateService();

module.exports = panelUpdateService;