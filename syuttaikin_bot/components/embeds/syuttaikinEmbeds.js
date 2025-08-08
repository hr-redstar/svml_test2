// syuttaikin_bot/components/embeds/syuttaikinEmbeds.js - 出退勤システムEmbed作成

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  // キャスト出退勤パネルEmbed
  createCastAttendanceEmbed(storeName, attendanceData = []) {
    const today = new Date();
    const dateStr = today.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });

    // 出勤・退勤データを整理
    const checkinData = attendanceData.filter(data => data.type === '出勤');
    const checkoutData = attendanceData.filter(data => data.type === '退勤');

    let checkinText = checkinData.length > 0 
      ? checkinData.map(data => `${data.time}　${data.name}`).join('\n')
      : '記録なし';
    
    let checkoutText = checkoutData.length > 0 
      ? checkoutData.map(data => `${data.time}　${data.name}`).join('\n')
      : '記録なし';

    return new EmbedBuilder()
      .setTitle(`👥 ${storeName} - キャスト出退勤`)
      .setDescription(`**${dateStr}**\n\n` +
        `🟢 **出勤**\n${checkinText}\n\n` +
        `🔴 **退勤**\n${checkoutText}`)
      .setColor(0x00ff00)
      .setFooter({ text: '出退勤登録ボタンを押して記録してください' })
      .setTimestamp();
  },

  // 黒服出退勤パネルEmbed
  createStaffAttendanceEmbed(storeName, attendanceData = []) {
    const today = new Date();
    const dateStr = today.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });

    // 出勤・退勤データを整理（黒服用はメンション形式）
    const checkinData = attendanceData.filter(data => data.type === '出勤');
    const checkoutData = attendanceData.filter(data => data.type === '退勤');

    let checkinText = checkinData.length > 0 
      ? checkinData.map(data => `${data.time} ${data.name}`).join('　')
      : '記録なし';
    
    let checkoutText = checkoutData.length > 0 
      ? checkoutData.map(data => `${data.time} ${data.name}`).join('　')
      : '記録なし';

    return new EmbedBuilder()
      .setTitle(`🤵 ${storeName} - 黒服出退勤`)
      .setDescription(`**${dateStr}**\n\n` +
        `🟢 **出勤**\n${checkinText}\n\n` +
        `🔴 **退勤**\n${checkoutText}`)
      .setColor(0x000000)
      .setFooter({ text: '黒服出退勤登録ボタンを押して記録してください' })
      .setTimestamp();
  },

  // 出退勤パネル用ボタン（キャスト用）
  createCastAttendanceButtons(storeName) {
    return new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`cast_attendance_register_${storeName}`)
          .setLabel('出退勤登録')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('📝'),
        new ButtonBuilder()
          .setCustomId(`cast_manual_register_${storeName}`)
          .setLabel('手動出退勤登録')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('✏️')
      );
  },

  // 出退勤パネル用ボタン（黒服用）
  createStaffAttendanceButtons(storeName) {
    return new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`staff_attendance_register_${storeName}`)
          .setLabel('黒服出退勤登録')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('📝'),
        new ButtonBuilder()
          .setCustomId(`staff_manual_register_${storeName}`)
          .setLabel('手動出退勤登録')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('✏️')
      );
  },

  // 完全な出退勤パネル作成（キャスト用）
  createFullCastAttendancePanel(storeName, attendanceData = []) {
    const embed = this.createCastAttendanceEmbed(storeName, attendanceData);
    const buttons = this.createCastAttendanceButtons(storeName);
    
    return {
      embeds: [embed],
      components: [buttons]
    };
  },

  // 完全な出退勤パネル作成（黒服用）
  createFullStaffAttendancePanel(storeName, attendanceData = []) {
    const embed = this.createStaffAttendanceEmbed(storeName, attendanceData);
    const buttons = this.createStaffAttendanceButtons(storeName);
    
    return {
      embeds: [embed],
      components: [buttons]
    };
  }
};
