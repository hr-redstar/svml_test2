// syuttaikin_bot/components/selects/userSelects.js - ユーザー選択セレクトメニュー

const { EmbedBuilder, ActionRowBuilder, UserSelectMenuBuilder } = require('discord.js');
const { createCastUserAttendanceModal, createStaffUserAttendanceModal } = require('../modals/userAttendanceModals');

module.exports = {
  // キャスト出退勤用ユーザー選択Embed
  createCastUserSelectEmbed(storeName) {
    return new EmbedBuilder()
      .setTitle(`👥 ${storeName} - キャスト出退勤登録`)
      .setDescription('出退勤を登録するユーザーを選択してください\n\n' +
        '📋 複数のユーザーを選択可能です\n' +
        '⏰ 次の画面で時間と詳細情報を入力します')
      .setColor(0x00ff00)
      .setFooter({ text: 'ユーザーを選択後、確定ボタンを押してください' });
  },

  // 黒服出退勤用ユーザー選択Embed
  createStaffUserSelectEmbed(storeName) {
    return new EmbedBuilder()
      .setTitle(`🤵 ${storeName} - 黒服出退勤登録`)
      .setDescription('出退勤を登録するユーザーを選択してください\n\n' +
        '📋 複数のユーザーを選択可能です\n' +
        '⏰ 次の画面で時間と詳細情報を入力します')
      .setColor(0x000000)
      .setFooter({ text: 'ユーザーを選択後、確定ボタンを押してください' });
  },

  // キャスト用ユーザー選択メニュー
  createCastUserSelectMenu(storeName) {
    return new ActionRowBuilder()
      .addComponents(
        new UserSelectMenuBuilder()
          .setCustomId(`cast_user_select_${storeName}`)
          .setPlaceholder('キャストユーザーを選択してください')
          .setMinValues(1)
          .setMaxValues(10) // 最大10人選択可能
      );
  },

  // 黒服用ユーザー選択メニュー
  createStaffUserSelectMenu(storeName) {
    return new ActionRowBuilder()
      .addComponents(
        new UserSelectMenuBuilder()
          .setCustomId(`staff_user_select_${storeName}`)
          .setPlaceholder('黒服ユーザーを選択してください')
          .setMinValues(1)
          .setMaxValues(10) // 最大10人選択可能
      );
  },

  // 完全なキャストユーザー選択パネル
  createFullCastUserSelectPanel(storeName) {
    const embed = this.createCastUserSelectEmbed(storeName);
    const selectMenu = this.createCastUserSelectMenu(storeName);
    
    return {
      embeds: [embed],
      components: [selectMenu]
    };
  },

  // 完全な黒服ユーザー選択パネル
  createFullStaffUserSelectPanel(storeName) {
    const embed = this.createStaffUserSelectEmbed(storeName);
    const selectMenu = this.createStaffUserSelectMenu(storeName);
    
    return {
      embeds: [embed],
      components: [selectMenu]
    };
  },

  // キャストユーザー選択処理
  async handleCastUserSelect(interaction, storeName) {
    try {
      const selectedUsers = interaction.values.map(userId => interaction.client.users.cache.get(userId)).filter(Boolean);
      
      if (selectedUsers.length === 0) {
        await interaction.update({
          content: '❌ ユーザーが見つかりませんでした。',
          embeds: [],
          components: []
        });
        return;
      }

      const modal = createCastUserAttendanceModal(storeName, selectedUsers);
      await interaction.showModal(modal);

    } catch (error) {
      console.error('キャストユーザー選択エラー:', error);
      await interaction.update({
        content: '❌ エラーが発生しました。',
        embeds: [],
        components: []
      });
    }
  },

  // 黒服ユーザー選択処理
  async handleStaffUserSelect(interaction, storeName) {
    try {
      const selectedUsers = interaction.values.map(userId => interaction.client.users.cache.get(userId)).filter(Boolean);
      
      if (selectedUsers.length === 0) {
        await interaction.update({
          content: '❌ ユーザーが見つかりませんでした。',
          embeds: [],
          components: []
        });
        return;
      }

      const modal = createStaffUserAttendanceModal(storeName, selectedUsers);
      await interaction.showModal(modal);

    } catch (error) {
      console.error('黒服ユーザー選択エラー:', error);
      await interaction.update({
        content: '❌ エラーが発生しました。',
        embeds: [],
        components: []
      });
    }
  },

  // 動的ユーザー選択ハンドラー
  async handleDynamicUserSelect(interaction) {
    const customId = interaction.customId;
    
    // キャストユーザー選択
    if (customId.startsWith('cast_user_select_')) {
      const storeName = customId.replace('cast_user_select_', '');
      await this.handleCastUserSelect(interaction, storeName);
      return;
    }
    
    // 黒服ユーザー選択
    if (customId.startsWith('staff_user_select_')) {
      const storeName = customId.replace('staff_user_select_', '');
      await this.handleStaffUserSelect(interaction, storeName);
      return;
    }
  }
};
