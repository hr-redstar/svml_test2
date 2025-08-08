const logger = require('../../common/logger');

/**
 * 全店舗の状況を取得する
 * @returns {Array} 全店舗の状況データ
 */
async function getAllStoresStatus() {
  try {
    // GCSから店舗データを取得
    const { readStoreState } = require('../../common/stateManager');
    const storeData = await readStoreState();
    
    const allStores = [];
    
    if (storeData && storeData.stores) {
      for (const [storeName, storeInfo] of Object.entries(storeData.stores)) {
        // ひっかけパネルの設置状況を確認
        const hikkakePanelInfo = storeInfo.hikkake_panel || {};
        
        allStores.push({
          name: storeName,
          channelId: hikkakePanelInfo.channelId || 'unknown',
          plaCount: hikkakePanelInfo.staffCount?.pla || 0,
          kamaCount: hikkakePanelInfo.staffCount?.kama || 0,
          isInstalled: !!hikkakePanelInfo.channelId,
          lastUpdated: hikkakePanelInfo.lastUpdated || null,
          storeName: storeName,
          plakamaCount: (hikkakePanelInfo.staffCount?.pla || 0) + (hikkakePanelInfo.staffCount?.kama || 0),
          setupDate: hikkakePanelInfo.setupDate || null
        });
      }
    }
    
    // 設置済みの店舗を優先してソート
    allStores.sort((a, b) => {
      if (a.isInstalled && !b.isInstalled) return -1;
      if (!a.isInstalled && b.isInstalled) return 1;
      return a.name.localeCompare(b.name);
    });
    
    return allStores;
    
  } catch (error) {
    logger.error('[storeDataManager] 全店舗状況取得エラー:', error);
    return [];
  }
}

/**
 * 特定の店舗データを取得する
 * @param {string} storeName 店舗名
 * @returns {object|null} 店舗データ
 */
async function getStoreData(storeName) {
  try {
    const { readStoreState } = require('../../common/stateManager');
    const storeData = await readStoreState();
    
    if (storeData && storeData.stores && storeData.stores[storeName]) {
      const storeInfo = storeData.stores[storeName];
      const hikkakePanelInfo = storeInfo.hikkake_panel || {};
      
      return {
        name: storeName,
        channelId: hikkakePanelInfo.channelId || null,
        plaCount: hikkakePanelInfo.staffCount?.pla || 0,
        kamaCount: hikkakePanelInfo.staffCount?.kama || 0,
        isInstalled: !!hikkakePanelInfo.channelId,
        lastUpdated: hikkakePanelInfo.lastUpdated || null,
        storeName: storeName,
        plakamaCount: (hikkakePanelInfo.staffCount?.pla || 0) + (hikkakePanelInfo.staffCount?.kama || 0),
        setupDate: hikkakePanelInfo.setupDate || null,
        panelInfo: hikkakePanelInfo
      };
    }
    
    return null;
    
  } catch (error) {
    logger.error('[storeDataManager] 店舗データ取得エラー:', error);
    return null;
  }
}

module.exports = {
  getAllStoresStatus,
  getStoreData
};
