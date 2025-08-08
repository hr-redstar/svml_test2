const { ActionRowBuilder, UserSelectMenuBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

// セレクトメニューID定数
const USER_INFO_SELECT_ID = 'core_user_info_select';
const STORE_SELECT_ID = 'user_info_store_select';
const ROLE_SELECT_ID = 'user_info_role_select';
const BIRTH_YEAR_SELECT_ID = 'user_info_birth_year_select';
const BIRTH_YEAR_SELECT_ID_OLD = 'user_info_birth_year_select_old'; // 1985-1961用

/**
 * ユーザー情報登録用のユーザー選択メニューを作成
 */
function createUserSelectMenu() {
  return new ActionRowBuilder()
    .addComponents(
      new UserSelectMenuBuilder()
        .setCustomId(USER_INFO_SELECT_ID)
        .setPlaceholder('情報を登録するユーザーを選択...')
        .setMinValues(1)
        .setMaxValues(1)
    );
}

/**
 * 店舗選択メニューを作成
 * @param {string[]} storeNames - 店舗名の配列
 * @param {string} [currentStore] - 現在選択されている店舗名
 * @param {string} userId - 対象ユーザーID
 */
function createStoreSelectMenu(storeNames, currentStore = null, userId) {
  const options = storeNames.map(name =>
    new StringSelectMenuOptionBuilder()
      .setLabel(name)
      .setValue(name)
      .setDefault(name === currentStore)
  );

  return new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`${STORE_SELECT_ID}_${userId}`) // ユーザーIDを付加
        .setPlaceholder('所属店舗を選択...')
        .addOptions(options.length > 0 ? options : [
          new StringSelectMenuOptionBuilder()
            .setLabel('店舗が登録されていません')
            .setValue('no_stores')
            .setDisabled(true)
        ])
        .setDisabled(options.length === 0)
    );
}

/**
 * 役職選択メニューを作成
 * @param {string[]} roleNames - 役職名の配列
 * @param {string} [currentRole] - 現在選択されている役職名
 * @param {string} userId - 対象ユーザーID
 */
function createRoleSelectMenu(roleNames, currentRole = null, userId) {
  const options = roleNames.map(name =>
    new StringSelectMenuOptionBuilder()
      .setLabel(name)
      .setValue(name)
      .setDefault(name === currentRole)
  );

  return new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`${ROLE_SELECT_ID}_${userId}`) // ユーザーIDを付加
        .setPlaceholder('役職を選択...')
        .addOptions(options.length > 0 ? options : [
          new StringSelectMenuOptionBuilder()
            .setLabel('役職が登録されていません')
            .setValue('no_roles')
            .setDisabled(true)
        ])
        .setDisabled(options.length === 0)
    );
}

/**
 * 誕生年選択メニューを作成
 * @param {number} startYear - 開始年
 * @param {number} endYear - 終了年
 * @param {string} customId - カスタムID (ユーザーIDを含む)
 * @param {number} [currentYear] - 現在選択されている年
 */
function createBirthYearSelectMenu(startYear, endYear, customId, currentYear = null) {
  const options = [];
  for (let year = startYear; year >= endYear; year--) {
    options.push(
      new StringSelectMenuOptionBuilder()
        .setLabel(String(year))
        .setValue(String(year))
        .setDefault(year === currentYear)
    );
  }

  return new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(customId) // customIdは呼び出し元でユーザーIDを付加済み
        .setPlaceholder('誕生年を選択...')
        .addOptions(options)
    );
}

module.exports = {
  createUserSelectMenu,
  createStoreSelectMenu,
  createRoleSelectMenu,
  createBirthYearSelectMenu,
  USER_INFO_SELECT_ID,
  STORE_SELECT_ID,
  ROLE_SELECT_ID,
  BIRTH_YEAR_SELECT_ID,
  BIRTH_YEAR_SELECT_ID_OLD
};
