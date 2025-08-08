const { EmbedBuilder, MessageFlags } = require('discord.js');
const { readState: readConfigState, updateState: updateConfigState } = require('../utils/configStateManager');
const { logConfigChange } = require('../../common/utils/configLogger');
const logger = require('../../common/logger');
const stateCache = require('../../common/cache/stateCache');
const panelUpdateService = require('../services/panelUpdateService');
const { createLogChannelSelect, LOG_CHANNEL_SELECT_ID } = require('../components/selects/coreConfigSelects');
const { createLogChannelConfigEmbed } = require('../components/embeds/coreConfigEmbeds');
const { LOG_CHANNEL_BUTTON_ID } = require('../components/buttons/coreConfigButtons');

async function execute(interaction) {
  const { customId } = interaction;

  if (interaction.isButton()) {
    if (customId === LOG_CHANNEL_BUTTON_ID || customId === 'core_log_channel_button') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      
      try {
        logger.info(`[logChannelConfigHandler] ログチャンネル・スレッド設定開始: ${interaction.guildId}`);
        
        const embed = createLogChannelConfigEmbed();
        const row = createLogChannelSelect();

        await interaction.editReply({
          embeds: [embed],
          components: [row]
        });
        
        return true;
      } catch (error) {
        logger.error(`[logChannelConfigHandler] ログチャンネル設定エラー:`, error);
        
        await interaction.editReply({
          content: '❌ ログチャンネル設定でエラーが発生しました。再試行してください。',
          embeds: [],
          components: []
        });
        
        return true;
      }
    }
  }

  if (interaction.isChannelSelectMenu()) {
    if (customId === LOG_CHANNEL_SELECT_ID || customId === 'core_log_channel_select') {
      logger.info(`[logChannelConfigHandler] ログチャンネル選択処理開始: ${interaction.values[0]}`);
      await interaction.deferUpdate();
      
      const selectedChannelId = interaction.values[0];
      const selectedChannel = interaction.guild.channels.cache.get(selectedChannelId);
      
      if (!selectedChannel) {
        logger.error(`[logChannelConfigHandler] 選択されたチャンネルが見つかりません: ${selectedChannelId}`);
        await interaction.editReply({
          content: '❌ 選択されたチャンネルが見つかりません。',
          embeds: [],
          components: []
        });
        return true;
      }
      
      logger.info(`[logChannelConfigHandler] スレッド作成開始: ${selectedChannel.name} (${selectedChannelId})`);
      
      const threadConfig = [
        { name: 'コマンドログ', emoji: '⚡' },
        { name: '設定ログ', emoji: '📋' },
        { name: 'グローバルログ', emoji: '🌍' }
      ];
      const createdThreads = [];
      
      for (const { name, emoji } of threadConfig) {
        try {
          logger.info(`[logChannelConfigHandler] ${name}スレッド作成中...`);
          const thread = await selectedChannel.threads.create({
            name: `${emoji} ${name}`,
            autoArchiveDuration: 10080, // 7日間
            reason: `SVML設定: ${name}スレッド`
          });
          createdThreads.push({ name, thread });
          logger.info(`[logChannelConfigHandler] ${name}スレッド作成成功: ${thread.name} (${thread.id})`);
        } catch (threadError) {
          logger.error(`[logChannelConfigHandler] ${name}スレッド作成エラー:`, threadError);
        }
      }
      
      logger.info(`[logChannelConfigHandler] スレッド作成完了: ${createdThreads.length}個作成`);
      
      try {
        logger.info(`[logChannelConfigHandler] 設定保存開始: ${interaction.guildId}`);
        console.log(`[logChannelConfigHandler] 設定保存開始: ${interaction.guildId}`);
        
        const updatedConfigState = await updateConfigState(interaction.guildId, state =>{
          const oldChannelId = state.logChannelId;
          const oldThreadIds = { ...state.logThreadIds };
          
          state.logChannelId = selectedChannelId;
          state.logThreadIds = {};
          createdThreads.forEach(({ name, thread }) =>{
            state.logThreadIds[name] = thread.id;
          });
          
          logger.info(`[logChannelConfigHandler] 設定変更詳細`, {
            guildId: interaction.guildId,
            oldChannelId,
            newChannelId: selectedChannelId,
            oldThreadIds,
            newThreadIds: state.logThreadIds
          });
          
          console.log(`[logChannelConfigHandler] 設定変更詳細:`, {
            guildId: interaction.guildId,
            oldChannelId,
            newChannelId: selectedChannelId,
            oldThreadIds,
            newThreadIds: state.logThreadIds
          });
          
          return state;
        });
        
        logger.info(`[logChannelConfigHandler] ログチャンネル設定保存完了: ${selectedChannelId}`);
        console.log(`[logChannelConfigHandler] ログチャンネル設定保存完了: ${selectedChannelId}`);
        
      } catch (saveError) {
        logger.error(`[logChannelConfigHandler] 設定保存エラー:`, saveError);
        console.error(`[logChannelConfigHandler] 設定保存エラー:`, saveError);
        throw saveError; 
      }
      stateCache.invalidate(`config:state:${interaction.guildId}`);
      
      const threadList = createdThreads
        .map(({ name, thread }) => `• ${name}: <#${thread.id}>`)
        .join('\n');
      
      try {
        const embed = new EmbedBuilder()
          .setTitle('📝 ログチャンネル設定完了')
          .setColor(0x00FF00)
          .addFields(
            { name: '設定チャンネル', value: `<#${selectedChannelId}>`, inline: false },
            { name: '作成されたスレッド', value: threadList, inline: false },
            { name: '設定者', value: `<@${interaction.user.id}>`, inline: false }
          )
          .setTimestamp();
        
        await logConfigChange(interaction, embed);
      } catch (logError) {
        logger.error('ログチャンネル設定ログ記録エラー:', logError);
      }
      
      await panelUpdateService.queuePanelUpdate(
        interaction.guildId,
        'log-channel',
        { 
          channelId: selectedChannelId, 
          channelName: selectedChannel.name,
          threads: createdThreads.map(({ name, thread }) => ({ name, id: thread.id }))
        },
        interaction
      );

      const successEmbed = new EmbedBuilder()
        .setTitle('✅ ログチャンネル設定完了')
        .setDescription(`選択されたチャンネル: <#${selectedChannelId}>\n\n作成されたスレッド:\n${threadList}\n\n今後のコマンド実行ログがこれらのスレッドに記録されます。`)
        .setColor(0x00FF00)
        .setTimestamp();

      await interaction.editReply({
        content: null,
        embeds: [successEmbed],
        components: []
      });
      
      try {
        const { updateMainPanelImmediately } = require('./coreConfigHandler'); // 循環参照を避けるため遅延ロード
        const panelUpdated = await updateMainPanelImmediately(interaction.guildId, interaction, { configState: updatedConfigState });
        logger.info(`[logChannelConfigHandler] ログチャンネル設定パネル即座更新: ${panelUpdated ? '成功' : '失敗'}`);
      } catch (updateError) {
        logger.error('即座のパネル更新エラー:', updateError);
      }
      
      return true;
    }
  }

  return false;
}

module.exports = {
  execute
};