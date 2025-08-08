const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  // キャスト出退勤登録モーダル
  createCastAttendanceModal(storeName) {
    const modal = new ModalBuilder()
      .setCustomId(`cast_attendance_modal_${storeName}`)
      .setTitle(`${storeName} - キャスト出退勤登録`);

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

    const typeInput = new TextInputBuilder()
      .setCustomId('attendance_type')
      .setLabel('種別（出勤 または 退勤）')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('出勤')
      .setRequired(true)
      .setMaxLength(10);

    const nameRow = new ActionRowBuilder().addComponents(nameInput);
    const timeRow = new ActionRowBuilder().addComponents(timeInput);
    const typeRow = new ActionRowBuilder().addComponents(typeInput);

    modal.addComponents(nameRow, timeRow, typeRow);

    return modal;
  },

  // 黒服出退勤登録モーダル
  createStaffAttendanceModal(storeName) {
    const modal = new ModalBuilder()
      .setCustomId(`staff_attendance_modal_${storeName}`)
      .setTitle(`${storeName} - 黒服出退勤登録`);

    const nameInput = new TextInputBuilder()
      .setCustomId('attendance_names')
      .setLabel('メンションユーザー（改行で複数入力可能）')
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

    const typeInput = new TextInputBuilder()
      .setCustomId('attendance_type')
      .setLabel('種別（出勤 または 退勤）')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('出勤')
      .setRequired(true)
      .setMaxLength(10);

    const nameRow = new ActionRowBuilder().addComponents(nameInput);
    const timeRow = new ActionRowBuilder().addComponents(timeInput);
    const typeRow = new ActionRowBuilder().addComponents(typeInput);

    modal.addComponents(nameRow, timeRow, typeRow);

    return modal;
  }
};
