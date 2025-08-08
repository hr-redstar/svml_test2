const { EmbedBuilder, MessageFlags } = require('discord.js');
const { readState: readRoleState, updateState: updateRoleState } = require('../../common/utils/roleStateManager');
const { logConfigChange } = require('../../common/utils/configLogger');
const logger = require('../../common/logger');
const stateCache = require('../../common/cache/stateCache');
const panelUpdateService = require('../services/panelUpdateService');
const { createRoleConfigModal, ROLE_MODAL_ID } = require('../components/modals/coreConfigModals');
const { ROLE_CONFIG_BUTTON_ID } = require('../components/buttons/coreConfigButtons');
const { readState: readStoresState } = require('../../common/utils/storesStateManager'); // 追加
const { readState: readConfigState } = require('../utils/configStateManager'); // 追加

async function execute(interaction) {
  const { customId } = interaction;

  if (interaction.isButton()) {
    if (customId === ROLE_CONFIG_BUTTON_ID || customId === 'core_role_config_button') {
      const roleState = await readRoleState(interaction.guildId);
      const roleNames = roleState.roleNames || [];
      
      const modal = createRoleConfigModal(roleNames);
      await interaction.showModal(modal);
      return true;
    }
  }

  if (interaction.isModalSubmit()) {
    if (customId === ROLE_MODAL_ID || customId === 'core_role_modal') {
      logger.info(`[roleConfigHandler] 役職設定モーダル処理開始: ${interaction.guildId}`);
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      
      const input = interaction.fields.getTextInputValue('role_names_input');
      const names = input.split('\n').map(s => s.trim()).filter(Boolean);
      logger.info(`[roleConfigHandler] 入力された役職名: ${names.length}件 - ${names.join(', ')}`);
      
      const roleState = await readRoleState(interaction.guildId);
      const before = roleState.roleNames || [];
      const added = names.filter(n => !before.includes(n));
      const removed = before.filter(n => !names.includes(n));
      
      logger.info(`[roleConfigHandler] 役職名変更詳細 - 追加:${added.length}件, 削除:${removed.length}件`);
      
      const updatedRoleState = await updateRoleState(interaction.guildId, (state) => {
        state.roleNames = names;
        return state;
      });
      
      stateCache.invalidate(`role:state:${interaction.guildId}`);
      logger.info(`[roleConfigHandler] 役職名状態更新&キャッシュクリア完了`);
      
      try {
        const embed = new EmbedBuilder()
          .setTitle('👥 役職名設定が更新されました')
          .setColor(0x9932CC)
          .addFields(
            { name: '実行者', value: `${interaction.user.tag} (${interaction.user.id})`, inline: false },
            { name: '追加された役職名', value: added.length ? added.join('\n') : 'なし', inline: false },
            { name: '削除された役職名', value: removed.length ? removed.join('\n') : 'なし', inline: false },
            { name: '現在の全役職名', value: names.length ? names.join('\n') : 'なし', inline: false }
          )
          .setTimestamp();
        
        await logConfigChange(interaction, embed);
      } catch (logError) {
        logger.error('役職設定ログ記録エラー:', logError);
      }
      
      let panelUpdated = false;
      try {
        const { updateMainPanelImmediately } = require('./coreConfigHandler'); // 循環参照を避けるため遅延ロード
        logger.info(`[roleConfigHandler] 役職名設定パネル即座更新を開始`);
        // 修正: storesState と configState も渡す
        const currentConfigState = await readConfigState(interaction.guildId); // 最新のconfigStateを取得
        const currentStoresState = await readStoresState(interaction.guildId); // 最新のstoresStateを取得
        panelUpdated = await updateMainPanelImmediately(interaction.guildId, interaction, { 
          roleState: updatedRoleState,
          storesState: currentStoresState, // 追加
          configState: currentConfigState // 追加
        });
        logger.info(`[roleConfigHandler] 役職名設定パネル即座更新: ${panelUpdated ? '✅成功' : '❌失敗'}`);
      } catch (updateError) {
        logger.error('[roleConfigHandler] 即座のパネル更新エラー:', updateError);
      }
      
      if (!panelUpdated) {
        await panelUpdateService.queuePanelUpdate(
          interaction.guildId,
          'role',
          { added, removed, current: names },
          interaction
        );
        logger.info('[roleConfigHandler] パネル更新をキューに追加（フォールバック）');
      }

      try {
        await interaction.editReply({
          content: '✅ 役職設定を更新しました。',
          flags: MessageFlags.Ephemeral
        });
        
        setTimeout(async () => {
          try {
            await interaction.deleteReply();
          } catch (deleteError) {
            logger.debug('[roleConfigHandler] deleteReply エラー（無視）:', deleteError.message);
          }
        }, 1000);
      } catch (replyError) {
        logger.error('[roleConfigHandler] editReply エラー:', replyError);
      }
      
      return true;
    }
  }

  return false;
}

module.exports = {
  execute
};