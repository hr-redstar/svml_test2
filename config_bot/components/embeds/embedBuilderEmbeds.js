// config_bot/components/embeds/embedBuilderEmbeds.js

const { EmbedBuilder } = require('discord.js');

/**
 * Embedビルダーのメインパネルを作成
 */
function createEmbedBuilderEmbed(mode = 'create') {
  const embed = new EmbedBuilder()
    .setTitle('📝 Embedビルダー')
    .setColor(0x3498db);

  switch (mode) {
    case 'create':
      embed.setDescription('新しい埋め込みメッセージを作成します。\n\n' +
        '**使い方**\n' +
        '1. ボタンをクリックして各要素を設定\n' +
        '2. プレビューを確認\n' +
        '3. 送信または保存を選択\n\n' +
        '✨ ヒント: フィールドは複数追加できます！');
      break;

    case 'edit':
      embed.setDescription('既存の埋め込みメッセージを編集します。\n\n' +
        '**使い方**\n' +
        '1. 編集したいEmbedを選択\n' +
        '2. 変更したい要素のボタンをクリック\n' +
        '3. 変更を保存\n\n' +
        '✨ ヒント: プレビューで確認してから保存できます！');
      break;

    case 'list':
      embed.setDescription('保存済みの埋め込みメッセージ一覧です。\n\n' +
        '**使い方**\n' +
        '• 編集: Embedを選択して編集\n' +
        '• 送信: チャンネルを選択して送信\n' +
        '• 削除: 不要なEmbedを削除\n\n' +
        '✨ ヒント: IDをコピーして共有できます！');
      break;
  }

  return embed;
}

/**
 * Embedのプレビューを作成
 */
function createPreviewEmbed(content, metadata = null) {
  const embed = new EmbedBuilder(content);
  
  if (metadata) {
    embed.setFooter({
      text: `最終更新: ${new Date(metadata.updatedAt).toLocaleString('ja-JP')} | バージョン: ${metadata.version}`
    });
  }

  return embed;
}

/**
 * Embedの一覧ページを作成
 */
function createEmbedListPage(embeds, currentPage, totalPages) {
  return new EmbedBuilder()
    .setTitle(`📋 保存済みEmbeds (ページ ${currentPage + 1}/${totalPages})`)
    .setColor(0x0099ff)
    .setDescription(embeds.map((embed, index) => {
      const number = currentPage * 5 + index + 1;
      return `${number}. **${embed.title || '無題のEmbed'}**\n` +
             `└ ID: \`${embed.path}\`\n` +
             `└ 作成: ${new Date(embed.createdAt).toLocaleString('ja-JP')}\n` +
             `└ 更新: ${new Date(embed.updatedAt).toLocaleString('ja-JP')}\n` +
             `└ プレビュー: ${embed.preview.description || '(内容なし)'}\n`;
    }).join('\n'));
}

/**
 * エラーEmbedを作成
 */
function createErrorEmbed(error, suggestion = null) {
  const embed = new EmbedBuilder()
    .setTitle('⚠️ エラーが発生しました')
    .setColor(0xff0000)
    .setDescription(error.toString());

  if (suggestion) {
    embed.addFields({
      name: '💡 解決方法',
      value: suggestion
    });
  }

  return embed;
}

/**
 * 履歴Embedを作成
 */
function createHistoryEmbed(history) {
  const embed = new EmbedBuilder()
    .setTitle('📅 変更履歴')
    .setColor(0x9b59b6)
    .setDescription(history.map(entry => {
      const date = new Date(entry.timestamp).toLocaleString('ja-JP');
      const changes = entry.changes?.map(change => 
        `• ${change.field}: ${change.old || '(なし)'} → ${change.new || '(なし)'}`
      ).join('\n') || 'No changes';

      return `**${date}** (${entry.version})\n` +
             `アクション: ${entry.action}\n` +
             (entry.previousVersion ? `前バージョン: ${entry.previousVersion}\n` : '') +
             '```\n' + changes + '\n```';
    }).join('\n\n'));

  return embed;
}

module.exports = {
  createEmbedBuilderEmbed,
  createPreviewEmbed,
  createEmbedListPage,
  createErrorEmbed,
  createHistoryEmbed
};
