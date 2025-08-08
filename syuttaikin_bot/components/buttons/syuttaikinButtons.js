// syuttaikin_bot/components/buttons/syuttaikinButtons.js - 出退勤システムボタンコンポーネント

const { EmbedBuilder } = require('discord.js');
const { createCastAttendanceModal, createStaffAttendanceModal } = require('../modals/attendanceModals');
const { createCastManualModal, createStaffManualModal } = require('../modals/userAttendanceModals');
const { createFullCastUserSelectPanel, createFullStaffUserSelectPanel } = require('../selects/userSelects');

module.exports = {
  // キャスト出退勤登録ボタン（ユーザー選択版）
  async handleCastAttendanceButton(interaction, storeName) {
    try {
      const userSelectPanel = createFullCastUserSelectPanel(storeName);
      await interaction.reply({
        ...userSelectPanel,
        ephemeral: true
      });
    } catch (error) {
      console.error('キャスト出退勤ボタンエラー:', error);
      await interaction.reply({
        content: '❌ エラーが発生しました。',
        ephemeral: true
      });
    }
  },

  // 黒服出退勤登録ボタン（ユーザー選択版）
  async handleStaffAttendanceButton(interaction, storeName) {
    try {
      const userSelectPanel = createFullStaffUserSelectPanel(storeName);
      await interaction.reply({
        ...userSelectPanel,
        ephemeral: true
      });
    } catch (error) {
      console.error('黒服出退勤ボタンエラー:', error);
      await interaction.reply({
        content: '❌ エラーが発生しました。',
        ephemeral: true
      });
    }
  },

  // キャスト手動出退勤登録ボタン
  async handleCastManualButton(interaction, storeName) {
    try {
      const modal = createCastManualModal(storeName);
      await interaction.showModal(modal);
    } catch (error) {
      console.error('キャスト手動登録ボタンエラー:', error);
      await interaction.reply({
        content: '❌ エラーが発生しました。',
        ephemeral: true
      });
    }
  },

  // 黒服手動出退勤登録ボタン
  async handleStaffManualButton(interaction, storeName) {
    try {
      const modal = createStaffManualModal(storeName);
      await interaction.showModal(modal);
    } catch (error) {
      console.error('黒服手動登録ボタンエラー:', error);
      await interaction.reply({
        content: '❌ エラーが発生しました。',
        ephemeral: true
      });
    }
  },

  // 動的ボタンハンドラー（パターンマッチング用）
  async handleDynamicButton(interaction) {
    const customId = interaction.customId;
    
    // キャスト出退勤登録ボタン
    if (customId.startsWith('cast_attendance_register_')) {
      const storeName = customId.replace('cast_attendance_register_', '');
      await this.handleCastAttendanceButton(interaction, storeName);
      return;
    }
    
    // 黒服出退勤登録ボタン
    if (customId.startsWith('staff_attendance_register_')) {
      const storeName = customId.replace('staff_attendance_register_', '');
      await this.handleStaffAttendanceButton(interaction, storeName);
      return;
    }

    // キャスト手動登録ボタン
    if (customId.startsWith('cast_manual_register_')) {
      const storeName = customId.replace('cast_manual_register_', '');
      await this.handleCastManualButton(interaction, storeName);
      return;
    }

    // 黒服手動登録ボタン
    if (customId.startsWith('staff_manual_register_')) {
      const storeName = customId.replace('staff_manual_register_', '');
      await this.handleStaffManualButton(interaction, storeName);
      return;
    }
  }
};
