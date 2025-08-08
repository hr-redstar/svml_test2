// keihi_bot/handlers/keihiConfigHandler.js - 経費bot設定専用ハンドラー

const { 
  EmbedBuilder, 
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const logger = require('../../common/logger');

// コンポーネント
const { 
  createKeihiConfigButtons, 
  createKeihiConfigButtons2, 
  createKeihiCsvButtons, 
  createKeihiCsvButtons2, 
  createKeihiHelpButtons, 
  createKeihiHelpButtons2, 
  createKeihiHistoryButtons, 
  createKeihiHistoryButtons2 
} = require('../components/buttons/keihiButtons');
const { 
  createKeihiConfigEmbed, 
  createKeihiCsvEmbed, 
  createKeihiHelpEmbed, 
  createKeihiHistoryEmbed 
} = require('../components/embeds/keihiEmbeds');

logger.info('[keihiConfigHandler] 経費bot設定ハンドラー読み込み開始');

/**
 * 経費bot設定のインタラクション処理
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
  logger.info(`[keihiConfigHandler] インタラクション処理開始: ${customId}`);
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
    logger.error(`[keihiConfigHandler] インタラクション処理エラー: ${customId}`, error);
    try {
      if (!interaction.replied && !interaction.deferred && interaction.isRepliable && interaction.isRepliable()) {
        await interaction.reply({
          content: '処理中にエラーが発生しました。再試行してください。',
          flags: MessageFlags.Ephemeral
        });
      }
    } catch (replyError) {
      logger.error('[keihiConfigHandler] エラー応答送信失敗:', replyError);
    }
    return true;
  }
}

/**
 * ボタンインタラクション処理
 */
async function handleButton(interaction) {
  const { customId } = interaction;
  
  // 経費申請設定パネル設置ボタン
  if (customId === 'keihi_config_setup_button') {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    
    try {
      // 経費申請設定パネルのEmbed
      const configEmbed = createKeihiConfigEmbed();
      const configButtons = createKeihiConfigButtons();
      const configButtons2 = createKeihiConfigButtons2();

      await interaction.channel.send({
        embeds: [configEmbed],
        components: [configButtons, configButtons2]
      });

      await interaction.editReply({
        content: '✅ 経費申請設定パネルを設置しました。'
      });
      return true;

    } catch (error) {
      logger.error('経費申請設定パネル設置エラー:', error);
      await interaction.editReply({
        content: '❌ 経費申請設定パネルの設置に失敗しました。'
      });
      return true;
    }
  }
  
  // 経費CSV出力パネル設置ボタン
  if (customId === 'keihi_csv_setup_button') {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    
    try {
      // 経費CSV出力パネルのEmbed
      const csvEmbed = createKeihiCsvEmbed();
      const csvButtons = createKeihiCsvButtons();
      const csvButtons2 = createKeihiCsvButtons2();

      await interaction.channel.send({
        embeds: [csvEmbed],
        components: [csvButtons, csvButtons2]
      });

      await interaction.editReply({
        content: '✅ 経費CSV出力パネルを設置しました。'
      });
      return true;

    } catch (error) {
      logger.error('経費CSV出力パネル設置エラー:', error);
      await interaction.editReply({
        content: '❌ 経費CSV出力パネルの設置に失敗しました。'
      });
      return true;
    }
  }
  
  // 経費申請ヘルプパネル設置ボタン
  if (customId === 'keihi_help_setup_button') {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    
    try {
      // 経費申請ヘルプパネルのEmbed
      const helpEmbed = new EmbedBuilder()
        .setTitle('❓ 経費申請ヘルプパネル')
        .setDescription('**経費申請システムの使い方とヘルプ**\n\n' +
          '📖 申請方法の詳細ガイド\n' +
          '💡 よくある質問（FAQ）\n' +
          '📞 サポート連絡先\n' +
          '📋 申請フォーム記入例')
        .setColor(0x3498db)
        .addFields(
          { name: '📖 申請ガイド', value: 'ステップバイステップの申請方法', inline: true },
          { name: '💡 FAQ', value: 'よくある質問と回答', inline: true },
          { name: '📞 サポート', value: '困った時の連絡先', inline: true },
          { name: '📋 記入例', value: '申請フォームの記入例', inline: true }
        )
        .setTimestamp();

      const helpButtons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('keihi_help_guide_button')
            .setLabel('申請ガイド')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📖'),
          new ButtonBuilder()
            .setCustomId('keihi_help_faq_button')
            .setLabel('よくある質問')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('💡'),
          new ButtonBuilder()
            .setCustomId('keihi_help_contact_button')
            .setLabel('サポート連絡先')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📞')
        );

      const helpButtons2 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('keihi_help_example_button')
            .setLabel('記入例')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📋'),
          new ButtonBuilder()
            .setCustomId('keihi_help_rules_button')
            .setLabel('申請ルール')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📝')
        );

      await interaction.channel.send({
        embeds: [helpEmbed],
        components: [helpButtons, helpButtons2]
      });

      await interaction.editReply({
        content: '✅ 経費申請ヘルプパネルを設置しました。'
      });
      return true;

    } catch (error) {
      logger.error('経費申請ヘルプパネル設置エラー:', error);
      await interaction.editReply({
        content: '❌ 経費申請ヘルプパネルの設置に失敗しました。'
      });
      return true;
    }
  }
  
  // 経費申請履歴パネル設置ボタン
  if (customId === 'keihi_history_setup_button') {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    
    try {
      // 経費申請履歴パネルのEmbed
      const historyEmbed = new EmbedBuilder()
        .setTitle('📋 経費申請履歴パネル')
        .setDescription('**過去の経費申請履歴と状況確認**\n\n' +
          '📋 個人の申請履歴確認\n' +
          '📊 店舗別申請統計\n' +
          '⏳ 承認待ち申請一覧\n' +
          '✅ 承認済み申請一覧')
        .setColor(0x9932cc)
        .addFields(
          { name: '📋 個人履歴', value: '自分の申請履歴確認', inline: true },
          { name: '📊 店舗統計', value: '店舗ごとの申請状況', inline: true },
          { name: '⏳ 承認待ち', value: '未承認申請の一覧', inline: true },
          { name: '✅ 承認済み', value: '承認完了申請の履歴', inline: true }
        )
        .setTimestamp();

      const historyButtons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('keihi_history_personal_button')
            .setLabel('個人履歴確認')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📋'),
          new ButtonBuilder()
            .setCustomId('keihi_history_store_button')
            .setLabel('店舗別統計')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📊'),
          new ButtonBuilder()
            .setCustomId('keihi_history_pending_button')
            .setLabel('承認待ち一覧')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('⏳')
        );

      const historyButtons2 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('keihi_history_approved_button')
            .setLabel('承認済み一覧')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅'),
          new ButtonBuilder()
            .setCustomId('keihi_history_search_button')
            .setLabel('詳細検索')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔍')
        );

      await interaction.channel.send({
        embeds: [historyEmbed],
        components: [historyButtons, historyButtons2]
      });

      await interaction.editReply({
        content: '✅ 経費申請履歴パネルを設置しました。'
      });
      return true;

    } catch (error) {
      logger.error('経費申請履歴パネル設置エラー:', error);
      await interaction.editReply({
        content: '❌ 経費申請履歴パネルの設置に失敗しました。'
      });
      return true;
    }
  }
  
  return false;
}

module.exports = {
  execute
};

logger.info('[keihiConfigHandler] module.exports 設定完了');
