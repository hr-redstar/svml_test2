// hikkake_bot/handlers/panelDeleteHandler.js

const { 
  EmbedBuilder, 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  MessageFlags 
} = require('discord.js');
const { readState, writeState } = require('../utils/hikkakeStateManager');
const logger = require('@common/logger');

module.exports = {
  /**
   * パネル削除ボタンの処理を実行します
   * @param {import('discord.js').Interaction} interaction 
   * @returns {Promise<boolean>} このハンドラで処理された場合は true
   */
  async execute(interaction) {
    // 削除ボタンの処理
    if (interaction.isButton() && interaction.customId === 'hikkake_delete_button') {
      await this.handleDeleteButton(interaction);
      return true;
    }
    
    // 削除対象選択の処理
    if (interaction.isStringSelectMenu() && interaction.customId === 'hikkake_panel_delete_select') {
      await this.handleDeleteSelect(interaction);
      return true;
    }
    
    // 削除確認の処理
    if (interaction.isButton() && interaction.customId.startsWith('hikkake_confirm_delete_')) {
      await this.handleConfirmDelete(interaction);
      return true;
    }
    
    // キャンセルボタンの処理
    if (interaction.isButton() && interaction.customId === 'hikkake_cancel_delete') {
      await this.handleCancelDelete(interaction);
      return true;
    }
    
    return false;
  },

  /**
   * 削除ボタンが押されたときの処理
   */
  async handleDeleteButton(interaction) {
    await interaction.deferReply({ ephemeral: true });
    
    try {
      const guildId = interaction.guildId;
      const state = await readState(guildId);
      
      // 設置されているパネルの確認
      if (!state.panels || Object.keys(state.panels).length === 0) {
        const embed = new EmbedBuilder()
          .setTitle('🗑️ パネル削除')
          .setDescription('❌ 削除できるパネルがありません。\n\n設置されているパネルが見つかりませんでした。')
          .setColor(0xFF0000)
          .setTimestamp();
        
        return interaction.editReply({ embeds: [embed] });
      }
      
      // 削除可能なパネルの選択肢を作成
      const options = [];
      for (const [storeName, storeData] of Object.entries(state.panels)) {
        for (const [type, panelData] of Object.entries(storeData)) {
          if (panelData.channelId && panelData.messageId) {
            const typeNames = { 
              quest: 'クエスト依頼', 
              tosu: '凸スナ', 
              horse: 'トロイの木馬' 
            };
            const typeName = typeNames[type] || type;
            
            options.push({
              label: `${storeName} - ${typeName}`,
              description: `チャンネル: #${panelData.channelName || 'unknown'}`,
              value: `${storeName}_${type}`,
            });
          }
        }
      }
      
      if (options.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle('🗑️ パネル削除')
          .setDescription('❌ 削除できるパネルがありません。\n\n設置済みのパネルが見つかりませんでした。')
          .setColor(0xFF0000)
          .setTimestamp();
        
        return interaction.editReply({ embeds: [embed] });
      }
      
      // 削除選択メニューを作成
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('hikkake_panel_delete_select')
        .setPlaceholder('削除するパネルを選択してください...')
        .addOptions(options.slice(0, 25)); // Discord の制限で最大25個
      
      const row = new ActionRowBuilder().addComponents(selectMenu);
      
      const embed = new EmbedBuilder()
        .setTitle('🗑️ ひっかけパネル削除')
        .setDescription('削除するパネルを選択してください。\n\n⚠️ **注意**: パネルを削除すると以下が失われます:\n' +
          '• パネルメッセージ（復元不可）\n' +
          '• 関連するオーダー情報\n' +
          '• スタッフ設定（店舗別）\n\n' +
          '削除は慎重に行ってください。')
        .setColor(0xFF6B35)
        .setTimestamp();
      
      await interaction.editReply({ embeds: [embed], components: [row] });
      
    } catch (error) {
      logger.error('パネル削除メニューの作成中にエラーが発生しました。', { 
        error: error instanceof Error ? error.message : String(error),
        guildId: interaction.guildId 
      });
      
      await interaction.editReply({ 
        content: '❌ パネル削除メニューの作成中にエラーが発生しました。' 
      });
    }
  },

  /**
   * 削除対象が選択されたときの処理
   */
  async handleDeleteSelect(interaction) {
    await interaction.deferUpdate();
    
    try {
      const selectedValue = interaction.values[0]; // "storeName_type"
      const [storeName, type] = selectedValue.split('_');
      
      if (!storeName || !type) {
        return interaction.editReply({ 
          content: '❌ 無効な選択です。', 
          components: [], 
          embeds: [] 
        });
      }
      
      const guildId = interaction.guildId;
      const state = await readState(guildId);
      const panelData = state.panels?.[storeName]?.[type];
      
      if (!panelData) {
        return interaction.editReply({ 
          content: '❌ 選択されたパネルが見つかりません。既に削除されている可能性があります。', 
          components: [], 
          embeds: [] 
        });
      }
      
      const typeNames = { 
        quest: 'クエスト依頼', 
        tosu: '凸スナ', 
        horse: 'トロイの木馬' 
      };
      const typeName = typeNames[type] || type;
      
      // 削除確認メッセージを作成
      const embed = new EmbedBuilder()
        .setTitle('🗑️ パネル削除の確認')
        .setDescription(`以下のパネルを削除しますか？\n\n` +
          `🏪 **店舗**: ${storeName}\n` +
          `📋 **種類**: ${typeName}\n` +
          `📍 **チャンネル**: <#${panelData.channelId}>\n\n` +
          `⚠️ **警告**: この操作は取り消せません！\n` +
          `• パネルメッセージが削除されます\n` +
          `• 関連するオーダー情報が失われます\n` +
          `• 店舗設定は保持されます`)
        .setColor(0xFF0000)
        .setTimestamp();
      
      const confirmRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`hikkake_confirm_delete_${selectedValue}`)
            .setLabel('🗑️ 削除実行')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('hikkake_cancel_delete')
            .setLabel('❌ キャンセル')
            .setStyle(ButtonStyle.Secondary)
        );
      
      await interaction.editReply({ 
        embeds: [embed], 
        components: [confirmRow] 
      });
      
    } catch (error) {
      logger.error('パネル削除確認の作成中にエラーが発生しました。', { 
        error: error instanceof Error ? error.message : String(error),
        guildId: interaction.guildId 
      });
      
      await interaction.editReply({ 
        content: '❌ 削除確認の作成中にエラーが発生しました。', 
        components: [], 
        embeds: [] 
      });
    }
  },

  /**
   * 削除確認ボタンが押されたときの処理
   */
  async handleConfirmDelete(interaction) {
    await interaction.deferUpdate();
    
    try {
      const selectedValue = interaction.customId.replace('hikkake_confirm_delete_', '');
      const [storeName, type] = selectedValue.split('_');
      
      if (!storeName || !type) {
        return interaction.editReply({ 
          content: '❌ 無効な削除対象です。', 
          components: [], 
          embeds: [] 
        });
      }
      
      const guildId = interaction.guildId;
      const state = await readState(guildId);
      const panelData = state.panels?.[storeName]?.[type];
      
      if (!panelData) {
        return interaction.editReply({ 
          content: '❌ 削除対象のパネルが見つかりません。', 
          components: [], 
          embeds: [] 
        });
      }
      
      // パネルメッセージの削除を試行
      let messageDeleteResult = '削除済み';
      try {
        const channel = await interaction.guild.channels.fetch(panelData.channelId);
        if (channel) {
          const message = await channel.messages.fetch(panelData.messageId);
          if (message) {
            await message.delete();
            messageDeleteResult = '✅ 削除成功';
          }
        }
      } catch (deleteError) {
        logger.warn('パネルメッセージの削除に失敗しました（設定は削除されます）', { 
          error: deleteError instanceof Error ? deleteError.message : String(deleteError),
          channelId: panelData.channelId,
          messageId: panelData.messageId 
        });
        messageDeleteResult = '⚠️ メッセージ削除失敗（設定は削除）';
      }
      
      // 状態からパネル情報を削除
      delete state.panels[storeName][type];
      
      // 店舗にパネルが残っていない場合、店舗ごと削除
      if (Object.keys(state.panels[storeName]).length === 0) {
        delete state.panels[storeName];
      }
      
      // 関連オーダーも削除
      const panelKey = `${storeName}_${type}`;
      if (state.orders && state.orders[panelKey]) {
        delete state.orders[panelKey];
      }
      
      await writeState(guildId, state);
      
      const typeNames = { 
        quest: 'クエスト依頼', 
        tosu: '凸スナ', 
        horse: 'トロイの木馬' 
      };
      const typeName = typeNames[type] || type;
      
      // 削除完了メッセージ
      const embed = new EmbedBuilder()
        .setTitle('✅ パネル削除完了')
        .setDescription(`パネルの削除が完了しました。\n\n` +
          `🏪 **店舗**: ${storeName}\n` +
          `📋 **種類**: ${typeName}\n` +
          `📱 **メッセージ**: ${messageDeleteResult}\n` +
          `💾 **設定データ**: ✅ 削除完了\n` +
          `📦 **オーダー情報**: ✅ 削除完了`)
        .setColor(0x00FF00)
        .setTimestamp();
      
      await interaction.editReply({ 
        embeds: [embed], 
        components: [] 
      });
      
      logger.info(`パネル削除完了: ${storeName}_${type}`, { 
        guildId: guildId,
        executor: interaction.user.tag,
        messageDeleteResult: messageDeleteResult
      });
      
    } catch (error) {
      logger.error('パネル削除の実行中にエラーが発生しました。', { 
        error: error instanceof Error ? error.message : String(error),
        guildId: interaction.guildId 
      });
      
      await interaction.editReply({ 
        content: '❌ パネル削除の実行中にエラーが発生しました。', 
        components: [], 
        embeds: [] 
      });
    }
  },

  /**
   * キャンセルボタンが押されたときの処理
   */
  async handleCancelDelete(interaction) {
    await interaction.deferUpdate();
    
    const embed = new EmbedBuilder()
      .setTitle('❌ パネル削除をキャンセル')
      .setDescription('パネルの削除がキャンセルされました。\nパネルは保持されます。')
      .setColor(0x808080)
      .setTimestamp();
    
    await interaction.editReply({ 
      embeds: [embed], 
      components: [] 
    });
  }
};
