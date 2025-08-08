// config_bot/handlers/embedActions.js

const {
  EmbedBuilder,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  StringSelectMenuBuilder,
  handleSave 
} = require('discord.js');
const embedGcsHelper = require('../utils/embedGcsHelper');
const logger = require('../../common/logger');
const { 
  SEND_CHANNEL_SELECT_ID,
  SAVE_ID,
  SET_TITLE_ID, SET_DESCRIPTION_ID, SET_URL_ID, SET_COLOR_ID,
  SET_FOOTER_ID, SET_IMAGE_ID, SET_THUMBNAIL_ID,
  ADD_FIELD_ID, EDIT_FIELD_ID, REMOVE_FIELD_ID,
  SEND_ID, DISCARD_ID
} = require('../utils/embed_utils/embedConstants');

/**
 * [送信]ボタンの処理。送信先のチャンネルを選択させます。
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function handleSend(interaction) {
  const selectMenu = new ChannelSelectMenuBuilder()
    .setCustomId(SEND_CHANNEL_SELECT_ID)
    .setPlaceholder('Embedを送信するチャンネルを選択してください')
    .addChannelTypes(ChannelType.GuildText, ChannelType.GuildForum);

  const row = new ActionRowBuilder().addComponents(selectMenu);

  // メッセージを更新してチャンネル選択メニューを表示します。
  // Embedプレビューはそのまま保持します。
  await interaction.editReply({
    content: '送信先のチャンネルを選択してください。',
    components: [row],
  });
}

/**
 * 送信先チャンネルが選択されたときの処理
 * @param {import('discord.js').ChannelSelectMenuInteraction} interaction
 */
async function handleSendChannelSelect(interaction) {
  await interaction.deferUpdate(); // チャンネル選択の処理を開始
  
  const channelId = interaction.values[0];
  const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);

  if (!channel || (!channel.isTextBased() && channel.type !== ChannelType.GuildForum)) {
    return interaction.editReply({
      content: '⚠️ 無効なチャンネルが選択されました。テキストチャンネルまたはフォーラムチャンネルを選択してください。',
      embeds: [],
      components: [],
    });
  }

  // チャンネル選択メニューがあったメッセージからEmbedデータを取得
  const previewEmbed = EmbedBuilder.from(interaction.message.embeds[0]);

  // 送信用にプレビュー用テキストを削除
  if (previewEmbed.data.title?.endsWith(' (プレビュー)')) {
    previewEmbed.setTitle(previewEmbed.data.title.replace(' (プレビュー)', ''));
  }
  if (previewEmbed.data.description?.includes('*ここにプレビューが表示されます*')) {
    previewEmbed.setDescription(null);
  }
  if (previewEmbed.data.title === 'Embedプレビュー' && !previewEmbed.data.description && !previewEmbed.data.fields?.length) {
    previewEmbed.setTitle(null);
  }

  // Embedが完全に空の場合はエラーになるため、最低限の内容を設定
  if (!previewEmbed.data.title && !previewEmbed.data.description && (!previewEmbed.data.fields || previewEmbed.data.fields.length === 0)) {
    previewEmbed.setDescription('埋め込みメッセージ');
  }

  try {
    if (channel.type === ChannelType.GuildForum) {
      // フォーラムチャンネルの場合、新しい投稿を作成
      await channel.threads.create({
        name: previewEmbed.data.title || '新しい投稿',
        message: { embeds: [previewEmbed] },
      });
    } else {
      // テキストチャンネルの場合、メッセージを送信
      await channel.send({ embeds: [previewEmbed] });
    }

    await interaction.editReply({
      content: `✅ Embedを <#${channel.id}> に送信しました。`,
      embeds: [],
      components: [],
    });
  } catch (error) {
    logger.error('Embedの送信中にエラーが発生しました。', { 
      error: error.message || error, 
      guildId: interaction.guildId,
      embedData: previewEmbed.data,
      channelId: channel.id 
    });
    
    let errorMessage = `❌ <#${channel.id}> へのEmbed送信中にエラーが発生しました。`;
    
    if (error.message?.includes('BASE_TYPE_REQUIRED')) {
      errorMessage += '\n💡 ヒント: Embedにはタイトル、説明、またはフィールドのいずれかが必要です。';
    } else if (error.message?.includes('MISSING_PERMISSIONS')) {
      errorMessage += '\n💡 ヒント: Botにチャンネルへの送信権限がありません。';
    } else {
      errorMessage += '\n💡 Botにチャンネルへの送信/投稿権限があるか確認してください。';
    }
    
    await interaction.editReply({
      content: errorMessage,
      embeds: [],
      components: [],
    });
  }
}

async function handleDiscard(interaction) {
  await interaction.editReply({
    content: '🗑️ Embedの作成を破棄しました。',
    embeds: [],
    components: [],
  });
}

/**
 * [編集]ボタンが押されたときの処理
 */
async function handleEditButton(interaction) {
  try {
    await interaction.deferUpdate();

    // GCSから保存済みのEmbed一覧を取得
    const result = await embedGcsHelper.listEmbeds(interaction.guildId);
    
    if (!result.success) {
      throw new Error(result.error);
    }

    if (result.embeds.length === 0) {
      await interaction.editReply({
        content: '📝 編集可能なEmbedが存在しません。先に新規作成してください。',
        embeds: [],
        components: []
      });
      return;
    }

    // 選択メニューの作成
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('embed_select_edit')
      .setPlaceholder('編集するEmbedを選択')
      .addOptions(
        result.embeds.map(embed => ({
          label: embed.title || '無題のEmbed',
          description: `作成: ${new Date(embed.createdAt).toLocaleString('ja-JP')}`,
          value: embed.path
        }))
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.editReply({
      content: '📝 編集するEmbedを選択してください：',
      embeds: [],
      components: [row]
    });

  } catch (error) {
    logger.error('Embed編集メニューの表示に失敗しました', {
      error: error.stack,
      userId: interaction.user.id,
      guildId: interaction.guildId
    });
    
    await interaction.editReply({
      content: '⚠️ Embedの読み込み中にエラーが発生しました。',
      embeds: [],
      components: []
    });
  }
}

/**
 * 編集するEmbedが選択されたときの処理
 */
async function handleEmbedSelect(interaction) {
  try {
    await interaction.deferUpdate();

    const embedPath = interaction.values[0];
    const result = await embedGcsHelper.getEmbed(interaction.guildId, embedPath);

    if (!result.success) {
      throw new Error(result.error);
    }

    const { content: embedData, metadata } = result;

    // プレビュー用にEmbedを作成
    const previewEmbed = new EmbedBuilder(embedData)
      .setTitle(`${embedData.title} (プレビュー)`)
      .setFooter({
        text: `最終更新: ${new Date(metadata.updatedAt).toLocaleString('ja-JP')}`
      });

    // 編集用インターフェースを表示
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
      new ButtonBuilder().setCustomId(REMOVE_FIELD_ID).setLabel('フィールド削除').setStyle(ButtonStyle.Danger)
    );

    const row4 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(SEND_ID).setLabel('送信').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`${SAVE_ID}_${embedPath}`).setLabel('保存').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(DISCARD_ID).setLabel('破棄').setStyle(ButtonStyle.Danger)
    );

    await interaction.editReply({
      content: '✏️ Embedを編集中...',
      embeds: [previewEmbed],
      components: [row1, row2, row3, row4]
    });

  } catch (error) {
    logger.error('Embedの読み込みに失敗しました', {
      error: error.stack,
      userId: interaction.user.id,
      guildId: interaction.guildId
    });
    
    await interaction.editReply({
      content: '⚠️ Embedの読み込み中にエラーが発生しました。',
      embeds: [],
      components: []
    });
  }
}

module.exports = {
  handleSend,
  handleSendChannelSelect,
  handleDiscard,
  handleEditButton,
  handleEmbedSelect,
  handleSave
};