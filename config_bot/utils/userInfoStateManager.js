// config_bot/utils/userInfoStateManager.js - ユーザー情報状態管理

const { readJsonFromGCS, saveJsonToGCS, listFilesInGCS, deleteGCSFile } = require('../../common/gcs/gcsUtils');
const logger = require('../../common/logger').createModuleLogger('user-info-state');

const USER_INFO_BASE_PATH = (guildId) => `${guildId}/config/user_info`;

/**
 * ユーザー情報の状態を読み取る
 * @param {string} guildId - ギルドID
 * @param {string} userId - ユーザーID
 * @returns {Object} ユーザー情報
 */
async function readUserInfoState(guildId, userId) {
  const filePath = `${USER_INFO_BASE_PATH(guildId)}/${userId}.json`;
  try {
    const data = await readJsonFromGCS(filePath);
    return data || {
      userId,
      guildId,
      storeName: '',
      role: '',
      nickname: '',
      notes: '',
      birthYear: null,
      registeredAt: null,
      updatedAt: null
    };
  } catch (error) {
    logger.error(`[readUserInfoState] ユーザー情報読み取りエラー: ${userId}`, error);
    throw error;
  }
}

/**
 * ユーザー情報の状態を更新する
 * @param {string} guildId - ギルドID
 * @param {string} userId - ユーザーID
 * @param {Function} updateFn - 更新関数
 * @returns {Object} 更新後の状態
 */
async function updateUserInfoState(guildId, userId, updateFn) {
  const filePath = `${USER_INFO_BASE_PATH(guildId)}/${userId}.json`;
  try {
    // 現在の状態を読み取り
    const currentState = await readUserInfoState(guildId, userId);
    
    // 更新関数を適用
    const newState = updateFn(currentState);
    newState.updatedAt = new Date().toISOString();
    
    if (!newState.registeredAt) {
      newState.registeredAt = newState.updatedAt;
    }
    
    // GCSに保存
    await saveJsonToGCS(filePath, newState);
    
    logger.info(`[updateUserInfoState] ユーザー情報更新完了: ${userId}`);
    return newState;
    
  } catch (error) {
    logger.error(`[updateUserInfoState] ユーザー情報更新エラー: ${userId}`, error);
    throw error;
  }
}

/**
 * ギルド内の全ユーザー情報を取得
 * @param {string} guildId - ギルドID
 * @returns {Array} ユーザー情報の配列
 */
async function getAllUserInfosInGuild(guildId) {
  const prefix = `${USER_INFO_BASE_PATH(guildId)}/`;
  try {
    const files = await listFilesInGCS(prefix);
    
    const userInfos = [];
    for (const file of files) {
      if (file.name.endsWith('.json')) {
        const userId = file.name.split('/').pop().replace('.json', '');
        const userInfo = await readUserInfoState(guildId, userId);
        userInfos.push(userInfo);
      }
    }
    
    return userInfos;
    
  } catch (error) {
    logger.error(`[getAllUserInfosInGuild] 全ユーザー情報取得エラー: ${guildId}`, error);
    return [];
  }
}

/**
 * ユーザー情報を削除
 * @param {string} guildId - ギルドID
 * @param {string} userId - ユーザーID
 */
async function deleteUserInfoState(guildId, userId) {
  const filePath = `${USER_INFO_BASE_PATH(guildId)}/${userId}.json`;
  try {
    await deleteGCSFile(filePath);
    logger.info(`[deleteUserInfoState] ユーザー情報削除完了: ${userId}`);
  } catch (error) {
    logger.error(`[deleteUserInfoState] ユーザー情報削除エラー: ${userId}`, error);
    throw error;
  }
}

module.exports = {
  readUserInfoState,
  updateUserInfoState,
  getAllUserInfosInGuild,
  deleteUserInfoState
};