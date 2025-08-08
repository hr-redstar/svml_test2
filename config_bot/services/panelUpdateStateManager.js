// config_bot/services/panelUpdateStateManager.js
// パネル更新サービス用の状態管理クラス

class PanelUpdateStateManager {
  constructor() {
    this.updateQueue = new Map(); // guildId -> updateData
    this.isProcessing = false;
    this.batchTimeout = null;
    this.lastBatchTime = null;
  }

  addUpdate(guildId, updateData) {
    this.updateQueue.set(guildId, updateData);
  }

  clearQueue() {
    this.updateQueue.clear();
  }

  setProcessing(flag) {
    this.isProcessing = flag;
  }

  setBatchTimeout(timeout) {
    this.batchTimeout = timeout;
  }

  clearBatchTimeout() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }

  setLastBatchTime(time) {
    this.lastBatchTime = time;
  }

  getState() {
    return {
      queueSize: this.updateQueue.size,
      isProcessing: this.isProcessing,
      lastBatchTime: this.lastBatchTime
    };
  }
}

const panelUpdateStateManager = new PanelUpdateStateManager();
module.exports = panelUpdateStateManager;
