// handlers/tempConfigHandler.js - 一時的なconfig handlerのテスト

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
} = require('discord.js');

const { readState: readStoresState, updateState: updateStoresState } = require('../common/utils/storesStateManager');
const logger = require('../common/logger');

// ボタンIDの定義
const STORE_CONFIG_BUTTON_ID = 'config_store_button';
const ROLE_CONFIG_BUTTON_ID = 'config_role_button';
const LEVEL_CONFIG_BUTTON_ID = 'config_level_button';
const STAMP_CONFIG_BUTTON_ID = 'config_stamp_button';
const KEIHI_SETTI_BUTTON_ID = 'config_keihi_setti_button';
const URIAGE_SETTI_BUTTON_ID = 'config_uriage_setti_button';
const SETUP_LOG_CHANNEL_BUTTON_ID = 'config_setup_log_channel_button';

module.exports = {
  async execute(interaction) {
    const { customId } = interaction;
    
    logger.info(`[tempConfigHandler] Processing interaction: ${customId}`);
    
    // config_store_buttonの処理
    if (customId === STORE_CONFIG_BUTTON_ID) {
      logger.info('[tempConfigHandler] config_store_button detected');
      try {
        const storesState = await readStoresState(interaction.guildId);
        const storeNames = storesState.storeNames || [];
        
        const modal = new ModalBuilder()
          .setCustomId('config_add_store_modal')
          .setTitle('店舗名の追加・修正・削除');
          
        const input = new TextInputBuilder()
          .setCustomId('store_names_input')
          .setLabel('店舗名（改行区切りで複数可／削除したい店舗は消してください）')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('star\nマンマミーア')
          .setRequired(false)
          .setValue(storeNames.join('\n'));
          
        modal.addComponents(new ActionRowBuilder().addComponents(input));
        
        await interaction.showModal(modal);
        logger.info('[tempConfigHandler] config_store_button modal shown successfully');
        return true;
      } catch (error) {
        logger.error('config_store_buttonでエラー:', error);
        
        // インタラクションがまだ応答されていない場合のみエラーメッセージを送信
        try {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              content: 'エラーが発生しました。再試行してください。',
              flags: MessageFlags.Ephemeral
            });
          }
        } catch (replyError) {
          logger.error('エラー応答の送信に失敗:', replyError);
        }
        return true;
      }
    }
    
    // config_add_store_modalの処理（モーダル送信時）
    if (customId === 'config_add_store_modal') {
      logger.info('[tempConfigHandler] config_add_store_modal detected');
      try {
        const inputValue = interaction.fields.getTextInputValue('store_names_input');
        const newStoreNames = inputValue
          .split('\n')
          .map(name => name.trim())
          .filter(name => name.length > 0);
        
        // storesStateManagerを使用して状態を更新（関数形式）
        await updateStoresState(interaction.guildId, (currentState) => ({
          ...currentState,
          storeNames: newStoreNames
        }));
        
        const embed = new EmbedBuilder()
          .setTitle('✅ 店舗設定更新完了（一時処理）')
          .setDescription(`店舗名を更新しました：\n${newStoreNames.map(name => `• ${name}`).join('\n')}\n\n⚠️ これは一時的なハンドラーによる処理です。\n本来のconfig_botモジュールが正常に読み込まれるまでの暫定対応となります。`)
          .setColor(0x00ff00)
          .setTimestamp();
        
        // インタラクションがまだ応答されていない場合のみ応答
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
          logger.info(`[tempConfigHandler] config_add_store_modal processed successfully. Updated stores: ${newStoreNames.join(', ')}`);
        } else {
          logger.warn('[tempConfigHandler] Interaction already replied/deferred, skipping response');
        }
        return true;
      } catch (error) {
        logger.error('config_add_store_modalでエラー:', error);
        
        if (!interaction.replied && !interaction.deferred) {
          try {
            await interaction.reply({
              content: 'エラーが発生しました。再試行してください。',
              flags: MessageFlags.Ephemeral
            });
          } catch (replyError) {
            logger.error('エラー応答の送信に失敗:', replyError);
          }
        }
        return true;
      }
    }
    
    // config_role_buttonの処理
    if (customId === ROLE_CONFIG_BUTTON_ID) {
      logger.info('[tempConfigHandler] config_role_button detected');
      await interaction.reply({
        content: '🔧 ロール設定機能は一時的に無効化されています。\n⚠️ config_botモジュールが正常に読み込まれるまでお待ちください。',
        flags: MessageFlags.Ephemeral
      });
      return true;
    }
    
    // config_level_buttonの処理
    if (customId === LEVEL_CONFIG_BUTTON_ID) {
      logger.info('[tempConfigHandler] config_level_button detected');
      await interaction.reply({
        content: '🔧 レベル設定機能は一時的に無効化されています。\n⚠️ config_botモジュールが正常に読み込まれるまでお待ちください。',
        flags: MessageFlags.Ephemeral
      });
      return true;
    }
    
    // config_stamp_buttonの処理
    if (customId === STAMP_CONFIG_BUTTON_ID) {
      logger.info('[tempConfigHandler] config_stamp_button detected');
      await interaction.reply({
        content: '🔧 スタンプ設定機能は一時的に無効化されています。\n⚠️ config_botモジュールが正常に読み込まれるまでお待ちください。',
        flags: MessageFlags.Ephemeral
      });
      return true;
    }
    
    // config_keihi_setti_buttonの処理
    if (customId === KEIHI_SETTI_BUTTON_ID) {
      logger.info('[tempConfigHandler] config_keihi_setti_button detected');
      await interaction.reply({
        content: '🔧 経費設定機能は一時的に無効化されています。\n⚠️ config_botモジュールが正常に読み込まれるまでお待ちください。',
        flags: MessageFlags.Ephemeral
      });
      return true;
    }
    
    // config_uriage_setti_buttonの処理
    if (customId === URIAGE_SETTI_BUTTON_ID) {
      logger.info('[tempConfigHandler] config_uriage_setti_button detected');
      await interaction.reply({
        content: '🔧 売上設定機能は一時的に無効化されています。\n⚠️ config_botモジュールが正常に読み込まれるまでお待ちください。',
        flags: MessageFlags.Ephemeral
      });
      return true;
    }
    
    // config_setup_log_channel_buttonの処理
    if (customId === SETUP_LOG_CHANNEL_BUTTON_ID) {
      logger.info('[tempConfigHandler] config_setup_log_channel_button detected');
      await interaction.reply({
        content: '🔧 ログチャンネル設定機能は一時的に無効化されています。\n⚠️ config_botモジュールが正常に読み込まれるまでお待ちください。',
        flags: MessageFlags.Ephemeral
      });
      return true;
    }
    
    return false;
  }
};
