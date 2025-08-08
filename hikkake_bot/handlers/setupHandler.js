const { formatTime } = require('../utils/timeUtils');
const { 
  getHikkakeState, 
  saveHikkakePanelInfo, 
  updateStaffCountAndSync, 
  refreshAllHikkakePanels,
  updateAllHikkakePanels,
  updatePanelsByType,
  startLogCleanupInterval
} = require('../utils/panelStateManager');
const { 
  buildHikkakeStatusEmbed, 
  buildStoreStatusEmbed,
  buildDetailedStatusEmbed,
  buildOrdersListEmbed,
  getActiveStaffAllocation
} = require('../utils/embedBuilder');
const { getAllStoresStatus, getStoreData } = require('../utils/storeDataManager');
const { generateHikkakeBoardDirect: generateBoard, createActionButtons } = require('../utils/panelGenerator');
const { getGuild, createSelectMenuRow, createNumericOptions, findMembersWithRole, fetchMessageSafely } = require('../utils/discordHelper');
const { logToThread } = require('../utils/loggingHelper');
const logger = require('../../common/logger');

// generateHikkakeBoardDirect の実装
async function generateHikkakeBoardDirect(client, guildId, storeName, channelId, channelSpecific = false, currentStoreData = null) {
  return generateBoard(client, guildId, storeName, channelId, channelSpecific, currentStoreData);
}

module.exports = {
  generateHikkakeBoardDirect,
  getHikkakeState,
  saveHikkakePanelInfo,
  updateStaffCountAndSync,
  refreshAllHikkakePanels,
  updateAllHikkakePanels,
  updatePanelsByType,
  startLogCleanupInterval,
  getAllStoresStatus,
  getStoreData,
  buildHikkakeStatusEmbed,
  buildStoreStatusEmbed,
  buildDetailedStatusEmbed,
  buildOrdersListEmbed,
  getActiveStaffAllocation,
  formatTime,
  createActionButtons,
  getGuild,
  createSelectMenuRow,
  createNumericOptions,
  findMembersWithRole,
  fetchMessageSafely,
  logToThread
};