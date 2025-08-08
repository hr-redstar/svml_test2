const StateManager = require('../stateManager');

const STATE_FILE_PATH = (guildId) => `${guildId}/config/店舗名.json`;

const defaultState = {
  storeNames: [],
};

const manager = new StateManager(STATE_FILE_PATH, defaultState, 'stores');

module.exports = {
  readState: (guildId) => manager.readState(guildId),
  updateState: (guildId, updateFn) => manager.updateState(guildId, updateFn),
  defaultState,
};