// Discord関連のユーティリティ関数
const { StringSelectMenuBuilder, ActionRowBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const logger = require('../../common/logger');

/**
 * ギルドをキャッシュ優先で取得し、なければAPIからフェッチ
 * @param {import('discord.js').Client} client
 * @param {string} guildId
 * @returns {Promise<import('discord.js').Guild|null>}
 */
async function getGuild(client, guildId) {
  if (!client || !client.isReady()) return null;

  try {
    // キャッシュにあれば即返す
    const cachedGuild = client.guilds.cache.get(guildId);
    if (cachedGuild) return cachedGuild;

    // キャッシュになければAPIから取得
    const fetchedGuild = await client.guilds.fetch(guildId);
    return fetchedGuild ?? null;
  } catch (error) {
    logger.warn(`[getGuild] ギルドの取得に失敗しました (${guildId}): ${error.message}`);
    return null;
  }
}

/**
 * セレクトメニューを含むActionRowを生成する
 * @param {string} customId
 * @param {string} placeholder
 * @param {import('discord.js').StringSelectMenuOptionBuilder[]} options
 * @returns {ActionRowBuilder<StringSelectMenuBuilder>}
 */
function createSelectMenuRow(customId, placeholder, options) {
  const selectMenu = new StringSelectMenuBuilder().setCustomId(customId).setPlaceholder(placeholder).addOptions(options);
  return new ActionRowBuilder().addComponents(selectMenu);
}

/**
 * 数値の選択肢を生成する
 * @param {number} count
 * @param {string} unit
 * @param {number} start
 * @returns {StringSelectMenuOptionBuilder[]}
 */
function createNumericOptions(count, unit, start = 1) {
    // Discordのセレクトメニューは最大25個の選択肢しか持てないため、上限を設定
    const safeCount = Math.min(count, 25);
    return Array.from({ length: safeCount }, (_, i) => {
        const value = i + start;
        return new StringSelectMenuOptionBuilder().setLabel(`${value}${unit}`).setValue(String(value));
    });
}

/**
 * 特定のロールを持つ非Bot メンバーを検索する
 * @param {import('discord.js').Guild} guild 検索するギルド
 * @param {string} roleName 検索するロール名
 * @returns {Promise<Array<{label: string, value: string}>>} セレクトメニュー用のオブジェクト配列
 */
async function findMembersWithRole(guild, roleName) {
    if (!guild) return [];
    // ロール名で検索（大文字小文字を区別しない）
    const role = guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
    if (!role) {
        logger.warn(`[findMembersWithRole] ロールが見つかりません: "${roleName}" in guild "${guild.name}"`);
        return [];
    }
    // 全メンバーを取得してキャッシュを更新
    await guild.members.fetch();
    return role.members
        .filter(member => !member.user.bot)
        .map(member => ({
            label: member.displayName,
            value: member.id,
        }));
}

/**
 * メッセージを安全に取得する（削除されている可能性を考慮）
 * @param {import('discord.js').Client} client
 * @param {string} channelId
 * @param {string} messageId
 * @returns {Promise<import('discord.js').Message|null>}
 */
async function fetchMessageSafely(client, channelId, messageId) {
  if (!channelId || !messageId) return null;
  try {
    const channel = await client.channels.fetch(channelId);
    if (channel?.isTextBased()) {
      return await channel.messages.fetch(messageId);
    }
  } catch (error) {
    // 一般的なエラー: Unknown Channel (10003), Unknown Message (10008). これらは削除時の想定エラー
    if (error.code !== 10003 && error.code !== 10008) {
      logger.error(`[fetchMessageSafely] メッセージ取得エラー (Channel: ${channelId}, Message: ${messageId}):`, { error: error.message });
    }
  }
  return null;
}

module.exports = { 
  getGuild, 
  createSelectMenuRow, 
  createNumericOptions, 
  findMembersWithRole,
  fetchMessageSafely
};
