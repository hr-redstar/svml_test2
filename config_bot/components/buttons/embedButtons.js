// config_bot/components/buttons/embedButtons.js

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// ボタンID定数
const NEW_BUTTON_ID = 'embed_builder_new';
const EDIT_BUTTON_ID = 'embed_builder_edit';
const LIST_BUTTON_ID = 'embed_builder_list';
const PREV_PAGE_ID = 'embed_page_prev';
const NEXT_PAGE_ID = 'embed_page_next';
const REFRESH_ID = 'embed_refresh';
const SELECT_ID = 'embed_select';

/**
 * Embedビルダー用のボタン行を作成（props化・汎用化）
 * @param {string} mode - 'create', 'edit', 'list', 'preview'のいずれか
 * @param {Object} props - ボタンの状態やラベル等をpropsで渡す
 * @returns {ActionRowBuilder} ボタンを含むActionRow
 */
function createEmbedBuilderButtons(mode = 'create', props = {}) {
  const buttons = [];
  switch (mode) {
    case 'create':
      buttons.push(
        new ButtonBuilder()
          .setCustomId(props.newId || NEW_BUTTON_ID)
          .setLabel(props.newLabel || '新規作成')
          .setStyle(props.newStyle || ButtonStyle.Primary)
          .setEmoji(props.newEmoji || '📝'),
        new ButtonBuilder()
          .setCustomId(props.editId || EDIT_BUTTON_ID)
          .setLabel(props.editLabel || '編集')
          .setStyle(props.editStyle || ButtonStyle.Secondary)
          .setEmoji(props.editEmoji || '✏️'),
        new ButtonBuilder()
          .setCustomId(props.listId || LIST_BUTTON_ID)
          .setLabel(props.listLabel || '一覧')
          .setStyle(props.listStyle || ButtonStyle.Secondary)
          .setEmoji(props.listEmoji || '📋')
      );
      break;
    case 'list':
      buttons.push(
        new ButtonBuilder()
          .setCustomId(props.prevId || PREV_PAGE_ID)
          .setLabel(props.prevLabel || '前のページ')
          .setStyle(props.prevStyle || ButtonStyle.Secondary)
          .setEmoji(props.prevEmoji || '⬅️')
          .setDisabled(props.hasPrevPage === false),
        new ButtonBuilder()
          .setCustomId(props.nextId || NEXT_PAGE_ID)
          .setLabel(props.nextLabel || '次のページ')
          .setStyle(props.nextStyle || ButtonStyle.Secondary)
          .setEmoji(props.nextEmoji || '➡️')
          .setDisabled(props.hasNextPage === false),
        new ButtonBuilder()
          .setCustomId(props.refreshId || REFRESH_ID)
          .setLabel(props.refreshLabel || '更新')
          .setStyle(props.refreshStyle || ButtonStyle.Secondary)
          .setEmoji(props.refreshEmoji || '🔄'),
        new ButtonBuilder()
          .setCustomId(props.selectId || SELECT_ID)
          .setLabel(props.selectLabel || '選択')
          .setStyle(props.selectStyle || ButtonStyle.Primary)
          .setEmoji(props.selectEmoji || '✅')
      );
      break;
    case 'preview':
      buttons.push(
        new ButtonBuilder()
          .setCustomId(props.editId || 'embed_preview_edit')
          .setLabel(props.editLabel || '編集')
          .setStyle(props.editStyle || ButtonStyle.Primary)
          .setEmoji(props.editEmoji || '✏️'),
        new ButtonBuilder()
          .setCustomId(props.sendId || 'embed_preview_send')
          .setLabel(props.sendLabel || '送信')
          .setStyle(props.sendStyle || ButtonStyle.Success)
          .setEmoji(props.sendEmoji || '📨'),
        new ButtonBuilder()
          .setCustomId(props.deleteId || 'embed_preview_delete')
          .setLabel(props.deleteLabel || '削除')
          .setStyle(props.deleteStyle || ButtonStyle.Danger)
          .setEmoji(props.deleteEmoji || '🗑️'),
        new ButtonBuilder()
          .setCustomId(props.backId || 'embed_preview_back')
          .setLabel(props.backLabel || '戻る')
          .setStyle(props.backStyle || ButtonStyle.Secondary)
          .setEmoji(props.backEmoji || '⬅️')
      );
      break;
    case 'edit':
      buttons.push(
        new ButtonBuilder()
          .setCustomId(props.saveId || 'embed_edit_save')
          .setLabel(props.saveLabel || '保存')
          .setStyle(props.saveStyle || ButtonStyle.Primary)
          .setEmoji(props.saveEmoji || '💾'),
        new ButtonBuilder()
          .setCustomId(props.previewId || 'embed_edit_preview')
          .setLabel(props.previewLabel || 'プレビュー')
          .setStyle(props.previewStyle || ButtonStyle.Secondary)
          .setEmoji(props.previewEmoji || '👁️'),
        new ButtonBuilder()
          .setCustomId(props.cancelId || 'embed_edit_cancel')
          .setLabel(props.cancelLabel || 'キャンセル')
          .setStyle(props.cancelStyle || ButtonStyle.Danger)
          .setEmoji(props.cancelEmoji || '❌')
      );
      break;
  }
  return new ActionRowBuilder().addComponents(buttons);
}

/**
 * ページネーションボタンを作成
 * @param {number} currentPage - 現在のページ番号
 * @param {number} totalPages - 総ページ数
 * @returns {ActionRowBuilder} ボタンを含むActionRow
 */
function createPaginationButtons(currentPage, totalPages) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(PREV_PAGE_ID)
      .setLabel('前のページ')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('⬅️')
      .setDisabled(currentPage <= 0),
    new ButtonBuilder()
      .setCustomId(NEXT_PAGE_ID)
      .setLabel('次のページ')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('➡️')
      .setDisabled(currentPage >= totalPages - 1),
    new ButtonBuilder()
      .setCustomId(REFRESH_ID)
      .setLabel('更新')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🔄')
  );
}

module.exports = {
  createEmbedBuilderButtons,
  createPaginationButtons,
  NEW_BUTTON_ID,
  EDIT_BUTTON_ID,
  LIST_BUTTON_ID,
  PREV_PAGE_ID,
  NEXT_PAGE_ID,
  REFRESH_ID,
  SELECT_ID,
  // ボタンIDの定数をグループ化
  PREVIEW_BUTTONS: {
    EDIT: 'embed_preview_edit',
    SEND: 'embed_preview_send',
    DELETE: 'embed_preview_delete',
    BACK: 'embed_preview_back'
  },
  EDIT_BUTTONS: {
    SAVE: 'embed_edit_save',
    PREVIEW: 'embed_edit_preview',
    CANCEL: 'embed_edit_cancel'
  }
};
