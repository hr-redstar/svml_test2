// keihi_bot/commands/keihi-config.js - 詳細設定コマンド

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  RoleSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  ActionRowBuilder,
  ChannelType,
  EmbedBuilder,
  MessageFlags
} = require('discord.js');

const { updateState, readState } = require('../utils/keihiStateManager');
const { CONFIG_ROLE_SELECT, CONFIG_VISIBLE_SELECT, CONFIG_CHANNEL_SELECT } = require('../constants/customIds');
const MESSAGES = require('../constants/messages');
const logger = require('../../common/logger');
const configLogger = require('../../common/utils/configLogger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('経費申請設定')
    .setDescription('経費申請システムの詳細設定を行います')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('role')
        .setDescription('承認ロールと閲覧ロールを設定します')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('channel')
        .setDescription('申請通知を送信するチャンネルを設定します')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('show')
        .setDescription('現在の設定内容を表示します')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    try {
      // ログ出力
      const logEmbed = new EmbedBuilder()
        .setColor(0x808080)
        .setTitle('コマンド実行ログ')
        .setDescription(`**コマンド:** \`/${interaction.commandName} ${subcommand}\``)
        .addFields({ name: '実行者', value: `${interaction.user.tag} (${interaction.user.id})` })
        .setTimestamp();
      
      await configLogger.logConfigChange(interaction, logEmbed);

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      if (subcommand === 'role') {
        await handleRoleConfig(interaction);
      } else if (subcommand === 'channel') {
        await handleChannelConfig(interaction);
      } else if (subcommand === 'show') {
        await handleShowConfig(interaction);
      }
    } catch (error) {
      logger.error('経費申請設定コマンドエラー:', error);
      await interaction.editReply({ content: MESSAGES.GENERAL.ERROR });
    }
  }
};

async function handleRoleConfig(interaction) {
  const currentState = await readState(interaction.guildId);
  
  const approverMenu = new RoleSelectMenuBuilder()
    .setCustomId(CONFIG_ROLE_SELECT)
    .setPlaceholder('✅ 承認ロールを選択（複数可）')
    .setMinValues(0)
    .setMaxValues(10)
    .setDefaultRoles(currentState.approverRoles);

  const visibleMenu = new RoleSelectMenuBuilder()
    .setCustomId(CONFIG_VISIBLE_SELECT)
    .setPlaceholder('👁 履歴閲覧ロールを選択（複数可）')
    .setMinValues(0)
    .setMaxValues(10)
    .setDefaultRoles(currentState.visibleRoles);

  await interaction.editReply({
    content: '**ロール設定**\n\n経費申請を承認できるロールと、履歴を閲覧できるロールを設定してください。',
    components: [
      new ActionRowBuilder().addComponents(approverMenu),
      new ActionRowBuilder().addComponents(visibleMenu)
    ]
  });
}

async function handleChannelConfig(interaction) {
  const currentState = await readState(interaction.guildId);
  
  const logChannelMenu = new ChannelSelectMenuBuilder()
    .setCustomId(CONFIG_CHANNEL_SELECT)
    .setPlaceholder('📜 申請通知チャンネルを選択')
    .addChannelTypes(ChannelType.GuildText)
    .setMinValues(0)
    .setMaxValues(1)
    .setDefaultChannels(currentState.logChannelId ? [currentState.logChannelId] : []);

  await interaction.editReply({
    content: '**チャンネル設定**\n\n経費申請が提出された際に通知を送信するチャンネルを設定してください。',
    components: [new ActionRowBuilder().addComponents(logChannelMenu)]
  });
}

async function handleShowConfig(interaction) {
  const state = await readState(interaction.guildId);
  
  const approverRoles = state.approverRoles.map(id => `<@&${id}>`).join('\n') || '未設定';
  const visibleRoles = state.visibleRoles.map(id => `<@&${id}>`).join('\n') || '未設定';
  const logChannel = state.logChannelId ? `<#${state.logChannelId}>` : '未設定';
  const categories = state.settings.categories.join(', ') || '未設定';

  const embed = new EmbedBuilder()
    .setTitle('⚙️ 経費申請システム設定')
    .setDescription('現在の設定内容を表示します')
    .addFields(
      { name: '✅ 承認ロール', value: approverRoles, inline: false },
      { name: '👁 閲覧ロール', value: visibleRoles, inline: false },
      { name: '📜 申請通知チャンネル', value: logChannel, inline: false },
      { name: '💰 経費カテゴリ', value: categories, inline: false },
      { name: '💵 上限金額', value: `¥${state.settings.maxAmount.toLocaleString()}`, inline: true },
      { name: '✅ 承認必須', value: state.settings.requireApproval ? 'はい' : 'いいえ', inline: true },
      { name: '📊 自動CSV', value: state.settings.autoCSV ? 'はい' : 'いいえ', inline: true }
    )
    .setColor(0x3498db)
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
