// syuttaikin_bot/components/modals/userAttendanceModals.js - ユーザー選択後のモーダル

const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  // キャスト出退勤登録モーダル（ユーザー選択後）
  createCastUserAttendanceModal(storeName, selectedUsers) {
    const userNames = selectedUsers.map(user => user.displayName || user.username).join('\n');
    
    const modal = new ModalBuilder()
      .setCustomId(`cast_user_attendance_modal_${storeName}_${selectedUsers.map(u => u.id).join(',')}`)
      .setTitle(`${storeName} - キャスト出退勤登録`);

    const typeInput = new TextInputBuilder()
      .setCustomId('attendance_type')
      .setLabel('種別（出勤 または 退勤）')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('出勤')
      .setRequired(true)
      .setMaxLength(10);

    const timeInput = new TextInputBuilder()
      .setCustomId('attendance_times')
      .setLabel('時間（改行で複数入力可能）')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('18:00～21:00\n19:00～22:00\n20:00～23:00')
      .setRequired(true)
      .setMaxLength(500);

    const nameInput = new TextInputBuilder()
      .setCustomId('attendance_names')
      .setLabel('表示名（改行で複数入力可能）※空欄の場合はユーザー名')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder(userNames)
      .setRequired(false)
      .setMaxLength(1000);

    const typeRow = new ActionRowBuilder().addComponents(typeInput);
    const timeRow = new ActionRowBuilder().addComponents(timeInput);
    const nameRow = new ActionRowBuilder().addComponents(nameInput);

    modal.addComponents(typeRow, timeRow, nameRow);

    return modal;
  },

  // 黒服出退勤登録モーダル（ユーザー選択後）
  createStaffUserAttendanceModal(storeName, selectedUsers) {
    const userMentions = selectedUsers.map(user => `<@${user.id}>`).join('\n');
    
    const modal = new ModalBuilder()
      .setCustomId(`staff_user_attendance_modal_${storeName}_${selectedUsers.map(u => u.id).join(',')}`)
      .setTitle(`${storeName} - 黒服出退勤登録`);

    const typeInput = new TextInputBuilder()
      .setCustomId('attendance_type')
      .setLabel('種別（出勤 または 退勤）')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('出勤')
      .setRequired(true)
      .setMaxLength(10);

    const timeInput = new TextInputBuilder()
      .setCustomId('attendance_times')
      .setLabel('時間（改行で複数入力可能）')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('18:00\n19:00\n20:00')
      .setRequired(true)
      .setMaxLength(500);

    const mentionInput = new TextInputBuilder()
      .setCustomId('attendance_mentions')
      .setLabel('メンション表示（改行で複数入力可能）※空欄の場合は自動')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder(userMentions)
      .setRequired(false)
      .setMaxLength(1000);

    const typeRow = new ActionRowBuilder().addComponents(typeInput);
    const timeRow = new ActionRowBuilder().addComponents(timeInput);
    const mentionRow = new ActionRowBuilder().addComponents(mentionInput);

    modal.addComponents(typeRow, timeRow, mentionRow);

    return modal;
  },

  // 手動キャスト出退勤登録モーダル
  createCastManualModal(storeName) {
    const modal = new ModalBuilder()
      .setCustomId(`cast_manual_modal_${storeName}`)
      .setTitle(`${storeName} - 手動キャスト出退勤登録`);

    const typeInput = new TextInputBuilder()
      .setCustomId('attendance_type')
      .setLabel('種別（出勤 または 退勤）')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('出勤')
      .setRequired(true)
      .setMaxLength(10);

    const nameInput = new TextInputBuilder()
      .setCustomId('attendance_names')
      .setLabel('名前（改行で複数入力可能）')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('田中太郎\n佐藤花子\n山田次郎')
      .setRequired(true)
      .setMaxLength(1000);

    const timeInput = new TextInputBuilder()
      .setCustomId('attendance_times')
      .setLabel('時間（改行で複数入力可能）')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('18:00～21:00\n19:00～22:00\n20:00～23:00')
      .setRequired(true)
      .setMaxLength(500);

    const typeRow = new ActionRowBuilder().addComponents(typeInput);
    const nameRow = new ActionRowBuilder().addComponents(nameInput);
    const timeRow = new ActionRowBuilder().addComponents(timeInput);

    modal.addComponents(typeRow, nameRow, timeRow);

    return modal;
  },

  // 手動黒服出退勤登録モーダル
  createStaffManualModal(storeName) {
    const modal = new ModalBuilder()
      .setCustomId(`staff_manual_modal_${storeName}`)
      .setTitle(`${storeName} - 手動黒服出退勤登録`);

    const typeInput = new TextInputBuilder()
      .setCustomId('attendance_type')
      .setLabel('種別（出勤 または 退勤）')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('出勤')
      .setRequired(true)
      .setMaxLength(10);

    const nameInput = new TextInputBuilder()
      .setCustomId('attendance_names')
      .setLabel('メンション名前（改行で複数入力可能）')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('@田中太郎\n@佐藤花子\n@山田次郎')
      .setRequired(true)
      .setMaxLength(1000);

    const timeInput = new TextInputBuilder()
      .setCustomId('attendance_times')
      .setLabel('時間（改行で複数入力可能）')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('18:00\n19:00\n20:00')
      .setRequired(true)
      .setMaxLength(500);

    const typeRow = new ActionRowBuilder().addComponents(typeInput);
    const nameRow = new ActionRowBuilder().addComponents(nameInput);
    const timeRow = new ActionRowBuilder().addComponents(timeInput);

    modal.addComponents(typeRow, nameRow, timeRow);

    return modal;
  }
};
