const StateManager = require('../stateManager');

const STATE_FILE_PATH = (guildId) => `${guildId}/config/役職.json`;

const defaultState = {
  roleNames: [],
};

const manager = new StateManager(STATE_FILE_PATH, defaultState, 'role');

module.exports = {
  readState: (guildId) => manager.readState(guildId),
  updateState: (guildId, updateFn) => manager.updateState(guildId, updateFn),
  defaultState,
};
