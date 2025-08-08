const StateManager = require('@common/stateManager');

const STATE_FILE_PATH = (guildId) => `${guildId}/hikkake/state.json`;

const defaultState = {
  panelMessages: {}, // { "storeName_storeType": { channelId, statusMessageId, ordersMessageId, storeName, storeType }, ... }
  orders: {}, // { "storeName_storeType": [], ... }
  reactions: {}, // { quest_num: [], quest_count: [], ... }
  staff: {}, // { "storeName_storeType": { pura: number, kama: number }, ... }
};

const manager = new StateManager(STATE_FILE_PATH, defaultState, 'hikkake');

/**
 * Calculate the currently allocated staff for a specific store panel
 * @param {object} state - Current state object
 * @param {string} panelKey - Panel key in format "storeName_storeType"
 * @returns {object} - { allocatedPura, allocatedKama }
 */
function getActiveStaffAllocation(state, panelKey) {
  if (!state.orders || !state.orders[panelKey]) {
    return { allocatedPura: 0, allocatedKama: 0 };
  }

  // Calculate staff allocation from active orders (not yet left)
  const activeOrders = state.orders[panelKey].filter(order => !order.leaveTimestamp);
  
  const allocatedPura = activeOrders.reduce((sum, order) => sum + (order.castPura || 0), 0);
  const allocatedKama = activeOrders.reduce((sum, order) => sum + (order.castKama || 0), 0);

  return { allocatedPura, allocatedKama };
}

module.exports = {
  readState: (guildId) => manager.readState(guildId),
  writeState: (guildId, state) => manager.writeState(guildId, state),
  updateState: (guildId, updateFn) => manager.updateState(guildId, updateFn),
  getActiveStaffAllocation,
};