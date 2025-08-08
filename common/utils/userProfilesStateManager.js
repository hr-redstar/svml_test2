const StateManager = require('@common/stateManager');

const STATE_FILE_PATH = (guildId) => `${guildId}/users/profiles.json`;

const defaultState = {
  // { [userId]: { realName: '...', store: '...' } }
};

const manager = new StateManager(STATE_FILE_PATH, defaultState, 'userProfiles');

module.exports = {
  readState: (guildId) => manager.readState(guildId),
  updateState: (guildId, updateFn) => manager.updateState(guildId, updateFn),
  defaultState,
};