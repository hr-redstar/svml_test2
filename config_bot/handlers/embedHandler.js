// config_bot/handlers/embedHandler.js

const logger = require('../../common/logger');
const {
  NEW_BUTTON_ID, EDIT_BUTTON_ID,
  SET_TITLE_ID, SET_DESCRIPTION_ID, SET_URL_ID, SET_COLOR_ID,
  SET_FOOTER_ID, SET_IMAGE_ID, SET_THUMBNAIL_ID,
  ADD_FIELD_ID, EDIT_FIELD_ID, REMOVE_FIELD_ID,
  SEND_ID, SAVE_ID, DISCARD_ID,
  TITLE_MODAL_ID, DESCRIPTION_MODAL_ID, URL_MODAL_ID, COLOR_MODAL_ID,
  FOOTER_MODAL_ID, IMAGE_MODAL_ID, THUMBNAIL_MODAL_ID, ADD_FIELD_MODAL_ID,
  SEND_CHANNEL_SELECT_ID
} = require('../utils/embed_utils/embedConstants');

const coreConfigModals = require('../components/modals/coreConfigModals');
const embedActions = require('./embedActions');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');

// フィールド編集モーダルのID（仮）
const EDIT_FIELD_MODAL_ID = 'edit_field_modal';

module.exports = {
  async execute(interaction) {
    try {
      if (interaction.isButton()) {
        return this.handleButton(interaction);
      }
      if (interaction.isModalSubmit()) {
        return this.handleModal(interaction);
      }
      if (interaction.isChannelSelectMenu()) {
        if (interaction.customId === SEND_CHANNEL_SELECT_ID) {
          return embedActions.handleSendChannelSelect(interaction);
        }
      }
      if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'embed_select_edit') {
          await embedActions.handleEmbedSelect(interaction);
          return true;
        }
        // フィールド編集選択
        if (interaction.customId === 'edit_field_select') {
          // TODO: 実際のフィールド情報を取得して編集モーダルを表示
          // 仮実装: 選択したフィールド名を編集モーダルに渡す
          const selected = interaction.values[0];
          const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
          const modal = new ModalBuilder()
            .setCustomId(EDIT_FIELD_MODAL_ID)
            .setTitle(`フィールド編集: ${selected}`);
          modal.addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId('field_name')
                .setLabel('フィールド名')
                .setStyle(TextInputStyle.Short)
                .setValue(selected)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId('field_value')
                .setLabel('フィールド内容')
                .setStyle(TextInputStyle.Paragraph)
                .setValue('（ここに現在の内容を取得して表示）')
            )
          );
          await interaction.showModal(modal);
          return true;
        }
        // フィールド削除選択
        if (interaction.customId === 'remove_field_select') {
          // TODO: 実際のフィールド情報を取得して削除確認ダイアログを表示
          // 仮実装: 削除確認ボタン付きダイアログを表示
          const selected = interaction.values[0];
          await interaction.reply({
            content: `フィールド「${selected}」を本当に削除しますか？`,
            components: [
              {
                type: 1, // ActionRow
                components: [
                  {
                    type: 2, // Button
                    custom_id: `confirm_remove_field_${selected}`,
                    label: '削除する',
                    style: 4 // Danger
                  },
                  {
                    type: 2, // Button
                    custom_id: 'cancel_remove_field',
                    label: 'キャンセル',
                    style: 2 // Secondary
                  }
                ]
              }
            ],
            flags: MessageFlags.Ephemeral
          });
          return true;
        }
      }
      return false;
    } catch (error) {
      logger.error('embedHandlerでエラーが発生しました', {
        error: error.stack,
        interactionType: interaction.type,
        customId: interaction.customId
      });
      try {
        const reply = {
          content: 'エラーが発生しました。もう一度お試しください。',
          flags: MessageFlags.Ephemeral
        };
        if (interaction.deferred) {
          await interaction.editReply(reply);
        } else {
          await interaction.reply(reply);
        }
      } catch (replyError) {
        logger.error('エラー応答の送信に失敗しました:', replyError);
      }
      return true;
    }
  },

  async handleButton(interaction) {
    const { customId } = interaction;
    
    // モーダルを表示するボタンかどうかをチェック
    const modalButtons = [SET_TITLE_ID, SET_DESCRIPTION_ID, SET_URL_ID, SET_COLOR_ID, SET_FOOTER_ID, SET_IMAGE_ID, SET_THUMBNAIL_ID, ADD_FIELD_ID];
    const showsModal = modalButtons.includes(customId);
    
    // モーダル表示以外のボタンの場合のみdeferUpdate
    if (!showsModal) {
      try {
        await interaction.deferUpdate();
      } catch (error) {
        logger.warn('ボタンインタラクションのdefer中にエラー:', {
          error: error instanceof Error ? error.message : String(error),
          buttonId: interaction.customId
        });
        return true; // エラーでも処理継続
      }
    }
    
    switch (customId) {
      case NEW_BUTTON_ID:
        await this.showBuilderInterface(interaction);
        return true;
      case EDIT_BUTTON_ID:
        await embedActions.handleEditButton(interaction);
        return true;
      case SET_TITLE_ID:
        await interaction.deferUpdate();
        await embedBuilderModals.showTitleModal(interaction);
        return true;
      case SET_DESCRIPTION_ID:
        await interaction.deferUpdate();
        await embedBuilderModals.showDescriptionModal(interaction);
        return true;
      case SET_URL_ID:
        await interaction.deferUpdate();
        await embedBuilderModals.showUrlModal(interaction);
        return true;
      case SET_COLOR_ID:
        await interaction.deferUpdate();
        await embedBuilderModals.showColorModal(interaction);
        return true;
      case SET_FOOTER_ID:
        await interaction.deferUpdate();
        await embedBuilderModals.showFooterModal(interaction);
        return true;
      case SET_IMAGE_ID:
        await interaction.deferUpdate();
        await embedBuilderModals.showImageModal(interaction);
        return true;
      case SET_THUMBNAIL_ID:
        await interaction.deferUpdate();
        await embedBuilderModals.showThumbnailModal(interaction);
        return true;
      case ADD_FIELD_ID:
        await interaction.deferUpdate();
        await embedBuilderModals.showAddFieldModal(interaction);
        return true;
      case SEND_ID:
        await embedActions.handleSend(interaction);
        return true;
      case DISCARD_ID:
        await embedActions.handleDiscard(interaction);
        return true;
      case SAVE_ID:
        await embedActions.handleSave(interaction);
        return true;
      // 未実装のボタンに対する応答（今後実装予定）
      case EDIT_FIELD_ID:
        // TODO: フィールド編集機能
        // ここでフィールド選択UI→編集モーダル表示の流れを実装予定
        // 仮実装: フィールド選択メニューを表示（今はダミー）
        await interaction.reply({
          content: '編集したいフィールドを選択してください（ダミーUI）',
          components: [
            {
              type: 1, // ActionRow
              components: [
                {
                  type: 3, // StringSelectMenu
                  custom_id: 'edit_field_select',
                  placeholder: 'フィールドを選択',
                  options: [
                    { label: 'フィールド1', value: 'field_1' },
                    { label: 'フィールド2', value: 'field_2' }
                  ]
                }
              ]
            }
          ],
          flags: MessageFlags.Ephemeral,
        });
        return true;
      case REMOVE_FIELD_ID:
        // TODO: フィールド削除機能
        // ここでフィールド選択UI→削除確認ダイアログ表示の流れを実装予定
        // 仮実装: フィールド選択メニューを表示（今はダミー）
        await interaction.reply({
          content: '削除したいフィールドを選択してください（ダミーUI）',
          components: [
            {
              type: 1, // ActionRow
              components: [
                {
                  type: 3, // StringSelectMenu
                  custom_id: 'remove_field_select',
                  placeholder: 'フィールドを選択',
                  options: [
                    { label: 'フィールド1', value: 'field_1' },
                    { label: 'フィールド2', value: 'field_2' }
                  ]
                }
              ]
            }
          ],
          flags: MessageFlags.Ephemeral,
        });
        return true;
      default:
        return false;
    }
  },

  async handleModal(interaction) {
    const { customId } = interaction;
    switch (customId) {
      case TITLE_MODAL_ID:
        await embedBuilderModals.handleTitleModalSubmit(interaction);
        return true;
      case DESCRIPTION_MODAL_ID:
        await embedBuilderModals.handleDescriptionModalSubmit(interaction);
        return true;
      case URL_MODAL_ID:
        await embedBuilderModals.handleUrlModalSubmit(interaction);
        return true;
      case COLOR_MODAL_ID:
        await embedBuilderModals.handleColorModalSubmit(interaction);
        return true;
      case FOOTER_MODAL_ID:
        await embedBuilderModals.handleFooterModalSubmit(interaction);
        return true;
      case IMAGE_MODAL_ID:
        await embedBuilderModals.handleImageModalSubmit(interaction);
        return true;
      case THUMBNAIL_MODAL_ID:
        await embedBuilderModals.handleThumbnailModalSubmit(interaction);
        return true;
      case ADD_FIELD_MODAL_ID:
        await embedBuilderModals.handleAddFieldModalSubmit(interaction);
        return true;
      case EDIT_FIELD_MODAL_ID:
        // TODO: フィールド編集モーダルの内容を保存する処理を実装
        // 仮実装: 入力値を表示し、Embedデータ更新関数を呼び出し
        const name = interaction.fields.getTextInputValue('field_name');
        const value = interaction.fields.getTextInputValue('field_value');
        updateEmbedField(interaction, name, value);
        await interaction.reply({
          content: `フィールド「${name}」を更新しました（仮）\n内容: ${value}`,
          flags: MessageFlags.Ephemeral
        });
        return true;
      default:
        return false;
    }
  },

  /**
   * EmbedビルダーのUIを表示または更新します。
   * @param {import('discord.js').ButtonInteraction} interaction
   */
  async showBuilderInterface(interaction) {
    const previewEmbed = new EmbedBuilder()
      .setTitle('Embedプレビュー')
      .setDescription('上のボタンから各項目を設定してください.\n\n*ここにプレビューが表示されます*')
      .setColor(0x4E5058); // Discord Gray

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(SET_TITLE_ID).setLabel('タイトル').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(SET_DESCRIPTION_ID).setLabel('本文').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(SET_URL_ID).setLabel('URL').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(SET_COLOR_ID).setLabel('色').setStyle(ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(SET_FOOTER_ID).setLabel('フッター').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(SET_IMAGE_ID).setLabel('画像').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(SET_THUMBNAIL_ID).setLabel('サムネイル').setStyle(ButtonStyle.Secondary)
    );

    const row3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(ADD_FIELD_ID).setLabel('フィールド追加').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(EDIT_FIELD_ID).setLabel('フィールド編集').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(REMOVE_FIELD_ID).setLabel('フィールド削除').setStyle(ButtonStyle.Primary)
    );

    const row4 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(SEND_ID).setLabel('送信').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(SAVE_ID).setLabel('保存して終了').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(DISCARD_ID).setLabel('破棄').setStyle(ButtonStyle.Danger)
    );

    await interaction.editReply({
      embeds: [previewEmbed],
      components: [row1, row2, row3, row4],
    });
  },
};

// 仮: フィールド編集内容をEmbedデータに保存する関数（本来はstateやGCS連携が必要）
function updateEmbedField(interaction, fieldName, fieldValue) {
  // TODO: 実際はstateやGCSからEmbedデータを取得・更新する
  // ここでは仮でログ出力のみ
  logger.info(`フィールド更新: ${fieldName} → ${fieldValue}`);
}

// 仮: フィールド削除処理（本来はstateやGCS連携が必要）
function removeEmbedField(interaction, fieldName) {
  // TODO: 実際はstateやGCSからEmbedデータを取得・更新する
  // ここでは仮でログ出力のみ
  logger.info(`フィールド削除: ${fieldName}`);
}