// keihi_bot/utils/keihiStateManager.js
const StateManager = require('../../common/stateManager');

const STATE_FILE_PATH = (guildId) => `${guildId}/keihi/state.json`;

const defaultState = {
  approverRoles: [],
  visibleRoles: [],
  logChannelId: null,
  expenses: [], // { id, userId, userName, amount, description, submittedAt, status, processedAt, processedBy, approvals: [{ userId, userName, approvedAt }] }
  settings: {
    categories: ['交通費', '会議費', '消耗品費', '接待費', 'その他'],
    maxAmount: 100000, // 上限金額
    requireApproval: true,
    autoCSV: true
  }
};

const manager = new StateManager(STATE_FILE_PATH, defaultState, 'keihi');

module.exports = {
  readState: (guildId) => manager.readState(guildId),
  writeState: (guildId, state) => manager.writeState(guildId, state),
  updateState: (guildId, updateFn) => manager.updateState(guildId, updateFn),
  defaultState,
};
