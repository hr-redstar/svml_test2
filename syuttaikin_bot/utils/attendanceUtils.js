const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { gcsHelper } = require('../../common/gcs');
const { createFullCastAttendancePanel, createFullStaffAttendancePanel } = require('../components/embeds/syuttaikinEmbeds');

module.exports = {
  // キャスト出退勤パネル作成
  createCastAttendancePanel(storeName) {
    return createFullCastAttendancePanel(storeName);
  },

  // 黒服出退勤パネル作成
  createStaffAttendancePanel(storeName) {
    return createFullStaffAttendancePanel(storeName);
  },

  // 出退勤データをCSVに保存
  async saveAttendanceData(guildId, type, storeName, attendanceData) {
    try {
      const now = new Date();
      const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
      const csvPath = `${guildId}/出退勤/${type}/${yearMonth}_出退勤.csv`;

      // 既存のCSVデータを取得
      let csvContent = '';
      try {
        // csvContent = await gcsHelper.readFromGcs(csvPath);
      } catch (error) {
        // 新規ファイルの場合、ヘッダーを追加
        csvContent = '日付,店舗,種別,時間,名前\n';
      }

      // 新しいデータを追加
      const dateStr = now.toLocaleDateString('ja-JP');
      attendanceData.forEach(data => {
        csvContent += `${dateStr},${storeName},${data.type},${data.time},${data.name}\n`;
      });

      // GCSに保存
      // await gcsHelper.saveToGcs(csvPath, csvContent);

      return true;
    } catch (error) {
      console.error('出退勤データ保存エラー:', error);
      return false;
    }
  },

  // 出退勤パネルの更新
  async updateAttendancePanel(interaction, storeName, type, attendanceData) {
    try {
      const { createCastAttendanceEmbed, createStaffAttendanceEmbed } = require('../components/embeds/syuttaikinEmbeds');
      
      let embed;
      if (type === 'キャスト') {
        embed = createCastAttendanceEmbed(storeName, attendanceData);
      } else {
        embed = createStaffAttendanceEmbed(storeName, attendanceData);
      }

      return embed;

    } catch (error) {
      console.error('パネル更新エラー:', error);
      return null;
    }
  }
};
