const { EmbedBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { readUserInfoState, updateUserInfoState } = require('../utils/userInfoStateManager');
const { logConfigChange } = require('../../common/utils/configLogger');
const logger = require('../../common/logger');
const { readState: readStoresState } = require('../../common/utils/storesStateManager');
const { readState: readRoleState } = require('../../common/utils/roleStateManager');
const { createUserSelectMenu, createStoreSelectMenu, createRoleSelectMenu, createBirthYearSelectMenu, USER_INFO_SELECT_ID, STORE_SELECT_ID, ROLE_SELECT_ID, BIRTH_YEAR_SELECT_ID, BIRTH_YEAR_SELECT_ID_OLD } = require('../components/selects/userInfoSelects');
const { USER_INFO_CONFIG_BUTTON_ID } = require('../components/buttons/coreConfigButtons');

async function execute(interaction) {
  const { customId } = interaction;

  if (interaction.isButton()) {
    // ユーザー情報登録ボタン
    if (customId === USER_INFO_CONFIG_BUTTON_ID || customId === 'core_user_info_config_button') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      
      // ユーザー選択メニューを表示
      const userSelectRow = createUserSelectMenu();
      
      const embed = new EmbedBuilder()
        .setTitle('👤 ユーザー情報登録')
        .setDescription('情報を登録するユーザーを選択してください。\n\n選択後、店舗名・役職・その他の詳細情報を設定できます。')
        .setColor(0x00FF00);

      await interaction.editReply({
        embeds: [embed],
        components: [userSelectRow]
      });
      
      return true;
    }

    // 1985年以前の誕生年選択ボタン
    if (customId.startsWith('user_info_birth_year_old_button_')) {
      await interaction.deferUpdate();
      const parts = customId.split('_');
      const selectedUserId = parts[parts.length - 1];

      const selectedUser = await interaction.client.users.fetch(selectedUserId).catch(() => null);
      if (!selectedUser) {
        await interaction.editReply({ content: '❌ ユーザーが見つかりません。' });
        return true;
      }

      // 既存のユーザー情報を取得
      const existingUserInfo = await readUserInfoState(interaction.guildId, selectedUserId);
      const currentBirthYear = existingUserInfo.birthYear;

      // 誕生年選択メニューを表示 (1985-1961)
      const birthYearSelectRow = createBirthYearSelectMenu(1985, 1961, `user_info_birth_year_select_old_${selectedUserId}`, currentBirthYear);

      const embed = new EmbedBuilder()
        .setTitle(`👤 ${selectedUser.username} の情報登録`)
        .setDescription(`所属店舗: **${existingUserInfo.storeName || 'なし'}**\n役職: **${existingUserInfo.role || 'なし'}**\n誕生年を選択してください。`);

      await interaction.editReply({
        embeds: [embed],
        components: [birthYearSelectRow],
      });

      return true;
    }
  }

  if (interaction.isUserSelectMenu()) {
    // ユーザー情報登録用ユーザー選択
    if (customId === USER_INFO_SELECT_ID || customId === 'core_user_info_select') {
      const selectedUserId = interaction.values[0];
      const selectedUser = await interaction.client.users.fetch(selectedUserId).catch(() => null);

      if (!selectedUser) {
        await interaction.reply({
          content: '❌ 選択されたユーザーが見つかりません。',
          flags: MessageFlags.Ephemeral
        });
        return true;
      }

      await interaction.deferUpdate(); // 応答を遅延させる

      // 既存のユーザー情報を取得 (店舗選択メニューの初期値として利用)
      const existingUserInfo = await readUserInfoState(interaction.guildId, selectedUserId);
      const currentStore = existingUserInfo.storeName;

      // 店舗選択メニューを表示
      const storesState = await readStoresState(interaction.guildId);
      const storeNames = storesState.storeNames || [];

      const storeSelectRow = createStoreSelectMenu(storeNames, currentStore, selectedUserId);

      const embed = new EmbedBuilder()
        .setTitle(`👤 ${selectedUser.username} の情報登録`)
        .setDescription('所属店舗を選択してください。');

      await interaction.editReply({
        embeds: [embed],
        components: [storeSelectRow],
      });

      return true;
    }
  }

  if (interaction.isStringSelectMenu()) {
    // 店舗選択メニュー
    if (customId.startsWith(STORE_SELECT_ID)) {
      await interaction.deferUpdate();
      const parts = customId.split('_');
      const selectedUserId = parts[parts.length - 1];
      const selectedValue = interaction.values[0];

      const selectedUser = await interaction.client.users.fetch(selectedUserId).catch(() => null);
      if (!selectedUser) {
        await interaction.editReply({ content: '❌ ユーザーが見つかりません。' });
        return true;
      }

      // 既存のユーザー情報を取得 (役職選択メニューの初期値として利用)
      const existingUserInfo = await readUserInfoState(interaction.guildId, selectedUserId);
      const currentRole = existingUserInfo.role;

      // 役職選択メニューを表示
      const roleState = await readRoleState(interaction.guildId);
      const roleNames = roleState.roleNames || [];

      const roleSelectRow = createRoleSelectMenu(roleNames, currentRole, selectedUserId);

      const embed = new EmbedBuilder()
        .setTitle(`👤 ${selectedUser.username} の情報登録`)
        .setDescription(`所属店舗: **${selectedValue}**\n役職を選択してください。`);

      await interaction.editReply({
        embeds: [embed],
        components: [roleSelectRow],
      });

      // 選択された店舗情報を一時的に保存
      await updateUserInfoState(interaction.guildId, selectedUserId, (state) => {
        state.storeName = selectedValue;
        return state;
      });

      return true;
    }

    // 役職選択メニュー
    if (customId.startsWith(ROLE_SELECT_ID)) {
      await interaction.deferUpdate();
      const parts = customId.split('_');
      const selectedUserId = parts[parts.length - 1];
      const selectedValue = interaction.values[0];

      const selectedUser = await interaction.client.users.fetch(selectedUserId).catch(() => null);
      if (!selectedUser) {
        await interaction.editReply({ content: '❌ ユーザーが見つかりません。' });
        return true;
      }

      // 既存のユーザー情報を取得 (誕生年選択メニューの初期値として利用)
      const existingUserInfo = await readUserInfoState(interaction.guildId, selectedUserId);
      const currentBirthYear = existingUserInfo.birthYear;

      // 誕生年選択メニューを表示 (2010-1986)
      const birthYearSelectRow = createBirthYearSelectMenu(2010, 1986, `${BIRTH_YEAR_SELECT_ID}_${selectedUserId}`, currentBirthYear);

      // 1985-1961のボタン
      const oldBirthYearButton = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`user_info_birth_year_old_button_${selectedUserId}`)
            .setLabel('1985年以前の誕生年を選択')
            .setStyle(ButtonStyle.Secondary)
        );

      const embed = new EmbedBuilder()
        .setTitle(`👤 ${selectedUser.username} の情報登録`)
        .setDescription(`所属店舗: **${existingUserInfo.storeName || 'なし'}**\n役職: **${selectedValue}**\n誕生年を選択してください。`);

      await interaction.editReply({
        embeds: [embed],
        components: [birthYearSelectRow, oldBirthYearButton],
      });

      // 選択された役職情報を一時的に保存
      await updateUserInfoState(interaction.guildId, selectedUserId, (state) => {
        state.role = selectedValue;
        return state;
      });

      return true;
    }

    // 誕生年選択メニュー (2010-1986 または 1985-1961)
    if (customId.startsWith(BIRTH_YEAR_SELECT_ID)) {
      await interaction.deferUpdate();
      const parts = customId.split('_');
      const selectedUserId = parts[parts.length - 1];
      const selectedValue = interaction.values[0];

      const selectedUser = await interaction.client.users.fetch(selectedUserId).catch(() => null);
      if (!selectedUser) {
        await interaction.editReply({ content: '❌ ユーザーが見つかりません。' });
        return true;
      }

      // 既存のユーザー情報を取得
      const existingUserInfo = await readUserInfoState(interaction.guildId, selectedUserId);

      // 全ての情報が揃ったので保存
      await updateUserInfoState(interaction.guildId, selectedUserId, (state) => {
        state.birthYear = parseInt(selectedValue);
        state.nickname = existingUserInfo.nickname; // 既存のニックネームと備考を保持
        state.notes = existingUserInfo.notes;
        return state;
      });

      // ログ記録
      try {
        const embed = new EmbedBuilder()
          .setTitle('👤 ユーザー情報登録完了')
          .setColor(0x00FF00)
          .addFields(
            { name: '対象ユーザー', value: `${selectedUser.tag} (${selectedUser.id})`, inline: false },
            { name: '登録者', value: `${interaction.user.tag} (${interaction.user.id})`, inline: false },
            { name: '所属店舗', value: existingUserInfo.storeName || 'なし', inline: true },
            { name: '役職', value: existingUserInfo.role || 'なし', inline: true },
            { name: '誕生年', value: selectedValue, inline: true },
            { name: 'ニックネーム', value: existingUserInfo.nickname || 'なし', inline: true },
            { name: '備考', value: existingUserInfo.notes || 'なし', inline: false }
          )
          .setTimestamp();

        await logConfigChange(interaction, embed);
      } catch (logError) {
        logger.error('ユーザー情報ログ記録エラー:', logError);
      }

      await interaction.editReply({
        content: `✅ ${selectedUser.tag} のユーザー情報を登録しました。\n\n**所属店舗:** ${existingUserInfo.storeName || 'なし'}\n**役職:** ${existingUserInfo.role || 'なし'}\n**誕生年:** ${selectedValue}`,
        embeds: [],
        components: []
      });

      return true;
    }
  }

  return false;
}

module.exports = {
  execute
};