// hikkake_bot/handlers/panelActionHandler.js

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getReactions } = require('../utils/hikkakeReactionManager');
const logger = require('@common/logger');

const REFRESH_BUTTON_ID = 'hikkake_panel_refresh';

/**
 * 引っかけ機能の管理パネル(EmbedとComponent)を生成します。
 * この関数は `/hikkake_reaction_admin` コマンドからも利用されることを想定しています。
 * @param {string} guildId
 * @returns {Promise<{embeds: import('discord.js').EmbedBuilder[], components: import('discord.js').ActionRowBuilder[]}>}
 */
async function buildAdminPanel(guildId) {
    // getReactionsは、{ quest: { num: { '1': ['msg1', 'msg2'] } }, tosu: ... } のような形式のオブジェクトを返すと仮定
    const reactions = await getReactions(guildId).catch(() => ({}));

    const embed = new EmbedBuilder()
        .setTitle('引っかけ反応 設定パネル')
        .setDescription('ここで各種反応文の設定や削除を行います。\n各設定ボタンから、特定の条件でBotが反応する文章を登録できます。')
        .setColor(0x5865F2); // Discord Blurple

    // Embedに表示するために、登録済みの反応を整形するヘルパー関数
    const formatReactions = (type, key) => {
        const reactionMap = reactions?.[type]?.[key];
        if (!reactionMap || Object.keys(reactionMap).length === 0) {
            return '未設定';
        }
        // キー（人数や本数）でソートして表示
        return Object.keys(reactionMap)
            .sort((a, b) => Number(a) - Number(b))
            .map(value => `**${value}**: ${reactionMap[value].length}件`)
            .join('\n') || '未設定';
    };

    embed.addFields(
        { name: '① クエスト人数別', value: formatReactions('quest', 'num'), inline: true },
        { name: '② 討伐本数別', value: formatReactions('tosu', 'count'), inline: true },
        { name: '③ 馬主', value: formatReactions('horse', 'owner'), inline: true }
    );

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('set_react_quest_num').setLabel('①設定').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('set_react_tosu_count').setLabel('②設定').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('set_react_horse_owner').setLabel('③設定').setStyle(ButtonStyle.Primary)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('hikkake_reaction_delete').setLabel('反応文の削除').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(REFRESH_BUTTON_ID).setLabel('パネル情報更新').setStyle(ButtonStyle.Secondary).setEmoji('🔄')
    );

    return { embeds: [embed], components: [row1, row2], ephemeral: true };
}


module.exports = {
  /**
   * このハンドラが処理するインタラクションかどうかを判定し、処理を実行します。
   * @param {import('discord.js').Interaction} interaction
   * @returns {Promise<boolean>} このハンドラで処理された場合は true
   */
  async execute(interaction) {
    // このハンドラはパネル更新ボタン(`hikkake_panel_refresh`)のみを処理
    if (!interaction.isButton() || interaction.customId !== REFRESH_BUTTON_ID) {
      return false;
    }

    await interaction.deferUpdate();

    try {
      const panelContent = await buildAdminPanel(interaction.guildId);
      await interaction.editReply(panelContent);
    } catch (error) {
      logger.error('引っかけ反応パネルの更新中にエラーが発生しました。', { error, guildId: interaction.guildId });
      // deferUpdate後のエラーなので、followUpでユーザーに通知する
      await interaction.followUp({ content: '❌ パネルの更新中にエラーが発生しました。', ephemeral: true });
    }

    return true;
  },
  // hikkakeReactionAdmin.js コマンドから利用できるようにエクスポート
  buildAdminPanel,
};
