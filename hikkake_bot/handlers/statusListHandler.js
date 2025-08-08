// hikkake_bot/handlers/statusListHandler.js

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { DateTime } = require('luxon');
const { readJsonFromGCS } = require('../../common/gcs/gcsUtils');
const { readState: readStoresState } = require('../../common/utils/storesStateManager');
const logger = require('../../common/logger').createModuleLogger('statusListHandler');

const SETTINGS_FILE_PATH = (guildId) => `${guildId}/hikkake/config.json`;

module.exports = {
  /**
   * このハンドラが処理するインタラクションかどうかを判定し、処理を実行します。
   * @param {import('discord.js').Interaction} interaction
   * @returns {Promise<boolean>} このハンドラで処理された場合は true
   */
  async execute(interaction) {
    // 店内状況一覧表示ボタン
    if (interaction.isButton() && interaction.customId === 'hikkake_status_list_button') {
      return await this.handleStatusList(interaction);
    }
    
    // 状況更新ボタン
    if (interaction.isButton() && interaction.customId === 'hikkake_status_refresh') {
      return await this.handleStatusRefresh(interaction);
    }

    return false;
  },

  /**
   * 店内状況一覧を表示
   */
  async handleStatusList(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const statusData = await this.buildStatusListEmbed(interaction.guildId);
      await interaction.editReply(statusData);
    } catch (error) {
      logger.error('店内状況一覧の表示中にエラーが発生しました。', { error, guildId: interaction.guildId });
      await interaction.editReply({
        content: '❌ 店内状況一覧の表示中にエラーが発生しました。'
      });
    }
    return true;
  },

  /**
   * 状況更新ボタンの処理
   */
  async handleStatusRefresh(interaction) {
    await interaction.deferUpdate();

    try {
      const statusData = await this.buildStatusListEmbed(interaction.guildId);
      await interaction.editReply(statusData);
    } catch (error) {
      logger.error('店内状況更新中にエラーが発生しました。', { error, guildId: interaction.guildId });
      await interaction.followUp({ 
        content: '❌ 状況更新中にエラーが発生しました。', 
        ephemeral: true 
      });
    }
    return true;
  },

  /**
   * 店内状況一覧のEmbedを構築
   */
  async buildStatusListEmbed(guildId) {
    // 全店舗一覧を取得
    const storesState = await readStoresState(guildId);
    const allStores = storesState.storeNames || [];
    
    if (allStores.length === 0) {
      throw new Error('店舗が登録されていません');
    }

    // ひっかけ設定を取得
    let hikkakeSettings = {};
    try {
      hikkakeSettings = await readJsonFromGCS(SETTINGS_FILE_PATH(guildId));
    } catch (error) {
      logger.debug('ひっかけ設定ファイルが見つかりません:', error.message);
    }

    const today = DateTime.now().setZone('Asia/Tokyo').toFormat('yyyy/MM/dd');
    
    // 店内状況のフィールドを動的生成
    let statusFields = [];
    
    for (const storeName of allStores) {
      let fieldValue = '👥 スタッフ数\n**プラ: 0** **カマ: 0**';
      let fieldName = `${storeName}　未設置`;
      
      // 設置済みチャンネルがある場合はリンクを表示
      if (hikkakeSettings.stores && hikkakeSettings.stores[storeName]) {
        const storeSettings = hikkakeSettings.stores[storeName];
        if (storeSettings.channelId) {
          fieldName = `📍 <#${storeSettings.channelId}>　${storeName}`;
        }
      }
      
      statusFields.push({
        name: fieldName,
        value: fieldValue,
        inline: false
      });
    }
    
    // 店内状況Embed（全店舗対応版）
    const statusEmbed = new EmbedBuilder()
      .setTitle(`🏪 全店舗 店内状況一覧`)
      .setDescription(`**${today}** の全店舗状況\n\n` +
        '**📋 現在の状況**\n' +
        '各店舗の現在のスタッフ数や進行中のクエストを確認できます。\n\n' +
        '**🔄 リアルタイム更新**\n' +
        'ひっかけパネルでのやり取りがリアルタイムに反映されます。')
      .setColor(0x3498DB)
      .addFields(statusFields)
      .setTimestamp()
      .setFooter({ text: '店内状況は自動で更新されます' });

    // 更新ボタン
    const refreshButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('hikkake_status_refresh')
        .setLabel('状況更新')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🔄')
    );

    return {
      embeds: [statusEmbed],
      components: [refreshButton]
    };
  }
};
