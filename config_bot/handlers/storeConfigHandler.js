const { EmbedBuilder, MessageFlags } = require('discord.js');
const { readState: readStoresState, updateState: updateStoresState } = require('../../common/utils/storesStateManager');
const { logConfigChange } = require('../../common/utils/configLogger');
const logger = require('../../common/logger');
const stateCache = require('../../common/cache/stateCache');
const panelUpdateService = require('../services/panelUpdateService');
const { createStoreConfigModal, STORE_MODAL_ID } = require('../components/modals/coreConfigModals');
const { STORE_CONFIG_BUTTON_ID } = require('../components/buttons/coreConfigButtons');
const { readState: readRoleState } = require('../../common/utils/roleStateManager'); // 追加
const { readState: readConfigState } = require('../utils/configStateManager'); // 追加

async function execute(interaction) {
  const { customId } = interaction;

  if (interaction.isButton()) {
    if (customId === STORE_CONFIG_BUTTON_ID || customId === 'core_store_config_button') {
      const storesState = await readStoresState(interaction.guildId);
      const storeNames = storesState.storeNames || [];
      
      const modal = createStoreConfigModal(storeNames);
      await interaction.showModal(modal);
      return true;
    }
  }

  if (interaction.isModalSubmit()) {
    if (customId === STORE_MODAL_ID || customId === 'core_store_modal') {
      logger.info(`[storeConfigHandler] 店舗設定モーダル処理開始: ${interaction.guildId}`);
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      
      const input = interaction.fields.getTextInputValue('store_names_input');
      const names = input.split('\n').map(s => s.trim()).filter(Boolean);
      logger.info(`[storeConfigHandler] 入力された店舗名: ${names.length}件 - ${names.join(', ')}`);
      
      const storesState = await readStoresState(interaction.guildId);
      const before = storesState.storeNames || [];
      const added = names.filter(n => !before.includes(n));
      const removed = before.filter(n => !names.includes(n));
      
      logger.info(`[storeConfigHandler] 店舗名変更詳細 - 追加:${added.length}件, 削除:${removed.length}件`);
      
      const updatedStoresState = await updateStoresState(interaction.guildId, (state) => {
        state.storeNames = names;
        return state;
      });
      
      stateCache.invalidate(`stores:state:${interaction.guildId}`);
      logger.info(`[storeConfigHandler] 店舗名状態更新&キャッシュクリア完了`);
      
      try {
        const embed = new EmbedBuilder()
          .setTitle('📝 店舗名設定が更新されました')
          .setColor(0x5865f2)
          .addFields(
            { name: '実行者', value: `${interaction.user.tag} (${interaction.user.id})`, inline: false },
            { name: '追加された店舗名', value: added.length ? added.join('\n') : 'なし', inline: false },
            { name: '削除された店舗名', value: removed.length ? removed.join('\n') : 'なし', inline: false },
            { name: '現在の全店舗名', value: names.length ? names.join('\n') : 'なし', inline: false }
          )
          .setTimestamp();
        
        await logConfigChange(interaction, embed);
      } catch (logError) {
        logger.error('店舗設定ログ記録エラー:', logError);
      }
      
      let panelUpdated = false;
      try {
        const { updateMainPanelImmediately } = require('./coreConfigHandler'); // 循環参照を避けるため遅延ロード
        logger.info(`[storeConfigHandler] 店舗設定パネル即座更新を開始`);
        // 修正: roleState と configState も渡す
        const currentConfigState = await readConfigState(interaction.guildId); // 最新のconfigStateを取得
        const currentRoleState = await readRoleState(interaction.guildId); // 最新のroleStateを取得
        panelUpdated = await updateMainPanelImmediately(interaction.guildId, interaction, { 
          storesState: updatedStoresState,
          roleState: currentRoleState, // 追加
          configState: currentConfigState // 追加
        });
        logger.info(`[storeConfigHandler] 店舗設定パネル即座更新: ${panelUpdated ? '✅成功' : '❌失敗'}`);
      } catch (updateError) {
        logger.error('[storeConfigHandler] 即座のパネル更新エラー:', updateError);
      }
      
      if (!panelUpdated) {
        await panelUpdateService.queuePanelUpdate(
          interaction.guildId,
          'store',
          { added, removed, current: names },
          interaction
        );
        logger.info('[storeConfigHandler] パネル更新をキューに追加（フォールバック）');
      }

      try {
        await interaction.editReply({
          content: '✅ 店舗設定を更新しました。',
          flags: MessageFlags.Ephemeral
        });
        
        setTimeout(async () => {
          try {
            await interaction.deleteReply();
          } catch (deleteError) {
            logger.debug('[storeConfigHandler] deleteReply エラー（無視）:', deleteError.message);
          }
        }, 1000);
      } catch (replyError) {
        logger.error('[storeConfigHandler] editReply エラー:', replyError);
      }
      
      return true;
    }
  }

  return false;
}

module.exports = {
  execute
};