// uriage_bot/handlers/uriageConfigHandler.js - 売上bot設定専用ハンドラー

const { 
  EmbedBuilder, 
  MessageFlags
} = require('discord.js');
const logger = require('../../common/logger');

// コンポーネント
const { 
  createUriageFormButtons, 
  createUriageConfigButtons, 
  createUriageConfigButtons2, 
  createUriageCsvButtons, 
  createUriageCsvButtons2 
} = require('../components/buttons/uriageButtons');
const { 
  createUriageFormEmbed, 
  createUriageConfigEmbed, 
  createUriageCsvEmbed 
} = require('../components/embeds/uriageEmbeds');

logger.info('[uriageConfigHandler] 売上bot設定ハンドラー読み込み開始');

/**
 * 売上bot設定のインタラクション処理
 */
async function execute(interaction) {
  // スラッシュコマンド対応追加
  if (interaction.isChatInputCommand && interaction.isChatInputCommand()) {
    await interaction.reply({
      content: 'このコマンドは現在未対応です。',
      flags: MessageFlags.Ephemeral
    });
    return true;
  }
  const { customId } = interaction;
  logger.info(`[uriageConfigHandler] インタラクション処理開始: ${customId}`);
  try {
    // ボタン処理
    if (interaction.isButton()) {
      return await handleButton(interaction);
    }
    // どの分岐にも該当しない場合も必ず応答
    if (interaction.isRepliable && interaction.isRepliable()) {
      await interaction.reply({
        content: '未対応の操作です。',
        flags: MessageFlags.Ephemeral
      });
    }
    return true;
  } catch (error) {
    logger.error(`[uriageConfigHandler] インタラクション処理エラー: ${customId}`, error);
    try {
      if (!interaction.replied && !interaction.deferred && interaction.isRepliable && interaction.isRepliable()) {
        await interaction.reply({
          content: '処理中にエラーが発生しました。再試行してください。',
          flags: MessageFlags.Ephemeral
        });
      }
    } catch (replyError) {
      logger.error('[uriageConfigHandler] エラー応答送信失敗:', replyError);
    }
    return true;
  }
}

/**
 * ボタンインタラクション処理
 */
async function handleButton(interaction) {
  const { customId } = interaction;
  
  // 売上報告フォーム設置ボタン
  if (customId === 'uriage_form_setup_button') {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    
    try {
      // 売上報告フォームのEmbed
      const formEmbed = createUriageFormEmbed();
      const formButtons = createUriageFormButtons();

      await interaction.channel.send({
        embeds: [formEmbed],
        components: [formButtons]
      });

      await interaction.editReply({
        content: '✅ 売上報告フォームを設置しました。'
      });
      return true;

    } catch (error) {
      logger.error('売上報告フォーム設置エラー:', error);
      await interaction.editReply({
        content: '❌ 売上報告フォームの設置に失敗しました。'
      });
      return true;
    }
  }
  
  // 売上設定パネル設置ボタン
  if (customId === 'uriage_config_setup_button') {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    
    try {
      // 売上設定パネルのEmbed
      const configEmbed = createUriageConfigEmbed();
      const configButtons = createUriageConfigButtons();
      const configButtons2 = createUriageConfigButtons2();

      await interaction.channel.send({
        embeds: [configEmbed],
        components: [configButtons, configButtons2]
      });

      await interaction.editReply({
        content: '✅ 売上設定パネルを設置しました。'
      });
      return true;

    } catch (error) {
      logger.error('売上設定パネル設置エラー:', error);
      await interaction.editReply({
        content: '❌ 売上設定パネルの設置に失敗しました。'
      });
      return true;
    }
  }
  
  // CSV出力パネル設置ボタン
  if (customId === 'uriage_csv_setup_button') {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    
    try {
      // CSV出力パネルのEmbed
      const csvEmbed = createUriageCsvEmbed();
      const csvButtons = createUriageCsvButtons();
      const csvButtons2 = createUriageCsvButtons2();

      await interaction.channel.send({
        embeds: [csvEmbed],
        components: [csvButtons, csvButtons2]
      });

      await interaction.editReply({
        content: '✅ 売上CSV出力パネルを設置しました。'
      });
      return true;

    } catch (error) {
      logger.error('売上CSV出力パネル設置エラー:', error);
      await interaction.editReply({
        content: '❌ 売上CSV出力パネルの設置に失敗しました。'
      });
      return true;
    }
  }
  
  return false;
}

module.exports = {
  execute
};

logger.info('[uriageConfigHandler] module.exports 設定完了');
