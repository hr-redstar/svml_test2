// config_bot/components/modals/coreConfigModals.js

const { 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder 
} = require('discord.js');

// モーダルID定数
const STORE_MODAL_ID = 'core_store_modal';
const ROLE_MODAL_ID = 'core_role_modal';

/**
 * 店舗設定モーダルを作成
 */
function createStoreConfigModal(currentStoreNames = []) {
  const modal = new ModalBuilder()
    .setCustomId(STORE_MODAL_ID)
    .setTitle('🏪 店舗名設定');

  const storeInput = new TextInputBuilder()
    .setCustomId('store_names_input')
    .setLabel('店舗名（1行に1つずつ入力）')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('例：\n店舗A\n店舗B\n店舗C')
    .setValue(currentStoreNames.join('\n'))
    .setRequired(false)
    .setMaxLength(2000);

  const storeRow = new ActionRowBuilder().addComponents(storeInput);
  modal.addComponents(storeRow);

  return modal;
}

/**
 * 役職設定モーダルを作成
 */
function createRoleConfigModal(currentRoleNames = []) {
  const modal = new ModalBuilder()
    .setCustomId(ROLE_MODAL_ID)
    .setTitle('👥 役職設定');

  const roleInput = new TextInputBuilder()
    .setCustomId('role_names_input')
    .setLabel('役職名（1行に1つずつ入力）')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('例：\n店長\n副店長\nスタッフ')
    .setValue(currentRoleNames.join('\n'))
    .setRequired(false)
    .setMaxLength(2000);

  const roleRow = new ActionRowBuilder().addComponents(roleInput);
  modal.addComponents(roleRow);

  return modal;
}

module.exports = {
  createStoreConfigModal,
  createRoleConfigModal,
  STORE_MODAL_ID,
  ROLE_MODAL_ID
};
