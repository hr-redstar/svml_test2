// common/utils/keihiSetupStateManager.js
const StateManager = require('@common/stateManager');

const STATE_FILE_PATH = (guildId) => `${guildId}/keihi_setup/state.json`;

const defaultState = {
  installations: {} // { [channelId]: { channelName, storeName, installedAt, installedBy, messageId } }
};

const manager = new StateManager(STATE_FILE_PATH, defaultState, 'keihiSetup');

module.exports = {
  readState: (guildId) => manager.readState(guildId),
  writeState: (guildId, state) => manager.writeState(guildId, state),
  updateState: (guildId, updateFn) => manager.updateState(guildId, updateFn),
  defaultState,
};
