const StateManager = require('../../common/stateManager');

const STATE_FILE_PATH = (guildId) => `${guildId}/config/config.json`;

const defaultState = {
  logChannelId: null,
  logThreadIds: {},
  configPanelMessageId: null,  // SVML設定パネルのメッセージID（自動更新用）
  configPanelChannelId: null,  // SVML設定パネルのチャンネルID（自動更新用）
  logThreads: [
    // { threadId: '123...', messageCount: 0, createdAt: 'ISO_STRING' }
  ],
};

const manager = new StateManager(STATE_FILE_PATH, defaultState, 'config');

module.exports = {
  readState: (guildId) => {
    console.log(`[configStateManager] State読み取り開始: ${guildId}`);
    return manager.readState(guildId);
  },
  updateState: async (guildId, updateFn) => {
    console.log(`[configStateManager] State更新開始: ${guildId}`);
    try {
      const result = await manager.updateState(guildId, updateFn);
      console.log(`[configStateManager] State更新完了: ${guildId}`, { success: true });
      return result;
    } catch (error) {
      console.error(`[configStateManager] State更新エラー: ${guildId}`, {
        error: error.message,
        stack: error.stack,
        guildId
      });
      throw error;
    }
  },
  defaultState,
};
