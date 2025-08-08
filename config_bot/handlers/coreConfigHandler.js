// config_bot/handlers/coreConfigHandler.js - 基本設定のみ（コア機能専用）

const {
  EmbedBuilder,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

// 状態管理とユーティリティ
const { readState: readStoresState, updateState: updateStoresState } = require('../../common/utils/storesStateManager');
const { readState: readRoleState, updateState: updateRoleState } = require('../../common/utils/roleStateManager');
const { readState: readConfigState, updateState: updateConfigState } = require('../utils/configStateManager');
const { readUserInfoState, updateUserInfoState } = require('../utils/userInfoStateManager');
const { logConfigChange } = require('../../common/utils/configLogger');
const logger = require('../../common/logger');
const stateCache = require('../../common/cache/stateCache');

// パネル更新サービス
const panelUpdateService = require('../services/panelUpdateService');

// コンポーネント
const { createCoreConfigButtons, STORE_CONFIG_BUTTON_ID, ROLE_CONFIG_BUTTON_ID, LOG_CHANNEL_BUTTON_ID, USER_INFO_CONFIG_BUTTON_ID } = require('../components/buttons/coreConfigButtons');
const { createStoreConfigModal, createRoleConfigModal, STORE_MODAL_ID, ROLE_MODAL_ID } = require('../components/modals/coreConfigModals');

const { createLogChannelSelect, LOG_CHANNEL_SELECT_ID } = require('../components/selects/coreConfigSelects');
const { USER_INFO_SELECT_ID } = require('../components/selects/userInfoSelects');
const { createCoreConfigEmbed, createLogChannelConfigEmbed } = require('../components/embeds/coreConfigEmbeds');

// 関連ハンドラーをインポート
const storeConfigHandler = require('./storeConfigHandler');
const roleConfigHandler = require('./roleConfigHandler');
const logChannelConfigHandler = require('./logChannelConfigHandler');
const userInfoHandler = require('./userInfoHandler');

logger.info('[coreConfigHandler] コア設定ハンドラー読み込み開始');

/**
 * メインパネルを即座に更新する
 * @param {string} guildId - ギルドID
 * @param {Object} interaction - Discordインタラクション
 */
async function updateMainPanelImmediately(guildId, interaction, newState = null) {
  try {
    logger.info(`[coreConfigHandler] 即座のパネル更新開始: ${guildId}`);
    
    // 設定状態から更新対象パネルを取得
    const configState = await readConfigState(guildId);
    const panelMessageId = configState.configPanelMessageId;
    const panelChannelId = configState.configPanelChannelId;

    if (!panelMessageId || !panelChannelId) {
      logger.debug(`[coreConfigHandler] 更新対象パネルなし: ${guildId}`);
      return false;
    }

    // チャンネルとメッセージを取得
    const channel = await interaction.client.channels.fetch(panelChannelId).catch((error) => {
      logger.debug(`[coreConfigHandler] チャンネル取得エラー: ${error.message}`);
      return null;
    });
    if (!channel) {
      logger.debug(`[coreConfigHandler] パネルチャンネルが見つかりません: ${panelChannelId}`);
      return false;
    }

    const message = await channel.messages.fetch(panelMessageId).catch((error) => {
      logger.debug(`[coreConfigHandler] メッセージ取得エラー: ${error.message}`);
      return null;
    });
    if (!message) {
      logger.warn(`[coreConfigHandler] パネルメッセージが見つかりません: ${panelMessageId} - 状態をクリア`);
      
      // 無効なパネル情報をクリア
      await updateConfigState(guildId, (state) => {
        state.configPanelMessageId = null;
        state.configPanelChannelId = null;
        return state;
      });
      return false;
    }

    // 新しいパネル内容を構築（最新データで）
    const newPanelContent = await buildCoreConfigPanel(guildId, newState);
    
    // パネルを更新
    await message.edit({
      content: '⚙️ **SVML基本設定パネル**\n\n店舗名・役職・ログチャンネルの設定を行えます。',
      embeds: newPanelContent.embeds,
      components: newPanelContent.components
    });

    logger.info(`[coreConfigHandler] 即座のパネル更新完了: ${guildId}`);
    return true;

  } catch (error) {
    logger.error(`[coreConfigHandler] 即座のパネル更新エラー: ${guildId}`, error);
    return false;
  }
}

/**
 * コア設定パネルを構築
 */
async function buildCoreConfigPanel(guildId, latestState = null) {
  logger.info(`[coreConfigHandler] コア設定パネル構築開始 for guild: ${guildId}`);
  
  try {
    let storesState, roleState, configState;

    if (latestState) {
        logger.debug('[coreConfigHandler] 引数から最新の状態データを取得');
        storesState = latestState.storesState;
        roleState = latestState.roleState;
        configState = latestState.configState;
    } else {
        logger.debug('[coreConfigHandler] 状態データ取得開始');
        // 設定情報を並列取得 - 最新データを強制取得
        [storesState, roleState, configState] = await Promise.all([
            readStoresState(guildId),
            readRoleState(guildId),
            readConfigState(guildId)
        ]);
    }
    
    // 最新データを取得
    const storeNames = storesState.storeNames || [];
    const roleNames = roleState.roleNames || [];
    const logChannelId = configState.logChannelId;
    const logThreadIds = configState.logThreadIds || {};

    logger.info(`[coreConfigHandler] 設定状況 - 店舗数: ${storeNames.length}, 役職数: ${roleNames.length}, ログチャンネル: ${logChannelId ? 'あり' : 'なし'}`);

    logger.debug('[coreConfigHandler] Embed作成開始');
    // メインEmbed（ログスレッド情報を渡す）- 最新データでEmbed構築
    const embed = createCoreConfigEmbed(storeNames, roleNames, logChannelId, logThreadIds);
    logger.debug('[coreConfigHandler] Embed作成完了');

    logger.debug('[coreConfigHandler] ボタン作成開始');
    // ボタン群（複数行）
    const buttonRows = createCoreConfigButtons();
    logger.debug('[coreConfigHandler] ボタン作成完了');

    const panelData = {
      embeds: [embed],
      components: buttonRows
    };

    logger.info(`[coreConfigHandler] コア設定パネル構築完了 for guild: ${guildId}`);
    logger.debug('[coreConfigHandler] パネルデータ構造:', {
      embedsLength: panelData.embeds.length,
      componentsLength: panelData.components.length,
      embedTitle: panelData.embeds[0]?.toJSON?.()?.title,
      storesCount: storeNames.length,
      rolesCount: roleNames.length,
      hasLogChannel: !!logChannelId
    });
    
    return panelData;
    
  } catch (error) {
    logger.error(`[coreConfigHandler] コア設定パネル構築エラー for guild: ${guildId}`, error);
    logger.error(`[coreConfigHandler] エラーの詳細位置:`, error.stack);
    throw error;
  }
}

/**
 * インタラクション処理のメイン関数
 */
async function execute(interaction) {
  const { customId } = interaction;
  logger.info(`[coreConfigHandler] インタラクション処理開始: ${customId}`);
  
  try {
    // スラッシュコマンド処理
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'svml設定') {
        return await handleSvmlConfigCommand(interaction);
      }
    }
    
    // ボタン処理
    if (interaction.isButton()) {
      // 各ハンドラーに処理を委譲
      if (await storeConfigHandler.execute(interaction)) return true;
      if (await roleConfigHandler.execute(interaction)) return true;
      if (await logChannelConfigHandler.execute(interaction)) return true;
      if (await userInfoHandler.execute(interaction)) return true;
    }
    
    // モーダル処理
    if (interaction.isModalSubmit()) {
      // 各ハンドラーに処理を委譲
      if (await storeConfigHandler.execute(interaction)) return true;
      if (await roleConfigHandler.execute(interaction)) return true;
    }
    
    // チャンネル選択メニュー処理
    if (interaction.isChannelSelectMenu()) {
      // 各ハンドラーに処理を委譲
      if (await logChannelConfigHandler.execute(interaction)) return true;
    }
    
    // 文字列選択メニュー処理
    if (interaction.isStringSelectMenu()) {
      // 各ハンドラーに処理を委譲
      if (await userInfoHandler.execute(interaction)) return true;
    }
    
    // ユーザー選択メニュー処理
    if (interaction.isUserSelectMenu()) {
      // 各ハンドラーに処理を委譲
      if (await userInfoHandler.execute(interaction)) return true;
    }
    
    return false;
  } catch (error) {
    logger.error(`[coreConfigHandler] インタラクション処理エラー: ${customId}`, error);
    
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '処理中にエラーが発生しました。再試行してください。',
          flags: MessageFlags.Ephemeral
        });
      }
    } catch (replyError) {
      logger.error('[coreConfigHandler] エラー応答送信失敗:', replyError);
    }
    
    return true;
  }
}

/**
 * /svml設定 スラッシュコマンド処理
 */
async function handleSvmlConfigCommand(interaction) {
  logger.info(`[coreConfigHandler] /svml設定 コマンド開始 - Guild: ${interaction.guildId}`);
  await interaction.deferReply({ ephemeral: false }); // bot送信として表示
  
  try {
    logger.info('[coreConfigHandler] パネル構築開始');
    const panel = await buildCoreConfigPanel(interaction.guildId);
    logger.info('[coreConfigHandler] パネル構築完了', {
      embedsCount: panel.embeds?.length,
      componentsCount: panel.components?.length
    });
    
    const reply = await interaction.editReply({
      content: '⚙️ **SVML基本設定パネル**\n\n店舗名・役職・ログチャンネルの設定を行えます。',
      embeds: panel.embeds,  // embeds配列を正しく使用
      components: panel.components
    });
    
    // パネル情報保存
    await updateConfigState(interaction.guildId, (state) => {
      state.configPanelMessageId = reply.id;
      state.configPanelChannelId = interaction.channelId;
      return state;
    });
    
    logger.info('[coreConfigHandler] /svml設定 応答送信完了', {
      messageId: reply.id,
      channelId: interaction.channelId
    });
    return true;
  } catch (error) {
    logger.error('[coreConfigHandler] /svml設定 コマンド処理エラー:', error);
    logger.error('[coreConfigHandler] エラースタック:', error.stack);
    
    try {
      await interaction.editReply({
        content: `❌ 設定パネルの表示に失敗しました。\n\nエラー詳細: ${error.message}\n\n再試行してください。`,
        embeds: [],
        components: []
      });
    } catch (replyError) {
      logger.error('[coreConfigHandler] エラー応答送信も失敗:', replyError);
    }
    
    return true;
  }
}







module.exports = {
  buildCoreConfigPanel,
  execute,
  updateMainPanelImmediately
};

// パネル更新サービスを初期化（Discordクライアントが設定された後に）
const initPanelUpdateService = (client) => {
  panelUpdateService.init(client);
  logger.info('[coreConfigHandler] PanelUpdateService 初期化完了');
};

module.exports.initPanelUpdateService = initPanelUpdateService;
logger.info('[coreConfigHandler] module.exports 設定完了');