// ひっかけログ機能（スレッド出力）
const { EmbedBuilder } = require('discord.js');
const logger = require('../../common/logger');
const { readState, writeState } = require('./hikkakeStateManager');

let DateTime;
try {
  DateTime = require('luxon').DateTime;
} catch (error) {
  logger.warn('⚠️ luxonライブラリが見つかりません。代替の時間処理を使用します。');
  DateTime = null;
}

const LOG_THREAD_NAME_PREFIX = '店内状況ログ-';

/**
 * 操作ログをEmbed形式で生成する
 * @param {DateTime|Date} now 現在時刻
 * @param {object} logData ログデータ
 * @returns {EmbedBuilder}
 */
function createLogEmbed(now, logData) {
  const { user, logType, details, channelName } = logData;

  const embed = new EmbedBuilder()
    .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
    .setTimestamp(DateTime ? now.toJSDate() : now)
    .setColor(0x888888);

  const categoryMap = { quest: 'クエスト', tosu: '凸スナ', horse: 'トロイの木馬' };
  const categoryName = categoryMap[details.type] || '不明';

  switch (logType) {
    case 'プラカマ設定':
      embed.setTitle('⚙️ 基本スタッフ更新')
        .setDescription(`**${categoryName}** の基本スタッフ数が更新されました。`)
        .addFields(
          { name: 'プラ', value: `${details.pura}人`, inline: true },
          { name: 'カマ', value: `${details.kama}人`, inline: true }
        )
        .setColor(0x3498DB);
      break;
    case '受注': {
      const totalCast = (details.castPura || 0) + (details.castKama || 0);
      embed.setTitle('✅ ひっかけた')
        .setDescription(`**${categoryName}** でひっかけました。`)
        .addFields(
          { name: '人数', value: `${details.people}人` },
          { name: '本数', value: `${details.bottles}本` },
          { name: 'キャスト消費', value: `-${totalCast}人 プラ${details.castPura}　カマ${details.castKama}` }
        )
        .setColor(0x2ECC71);
      break;
    }
    case 'ふらっと来た': {
      const totalCast = (details.castPura || 0) + (details.castKama || 0);
      embed.setTitle('✨ ふらっと来た')
        .setDescription(`**${categoryName}** にお客様がふらっと来ました。`)
        .addFields(
          { name: 'キャスト消費', value: `-${totalCast}人 (プ${details.castPura}/カ${details.castKama})`, inline: false }
        )
        .setColor(0xF1C40F);
      break;
    }
    case '同伴': {
      const { castUserId, duration, arrivalTime, people } = details;
      embed.setTitle('🤝 同伴記録')
        .setDescription(`**${categoryName}** で同伴が記録されました。`)
        .addFields(
          { name: '担当キャスト', value: `<@${castUserId}>`, inline: true },
          { name: '客数', value: `${people}人`, inline: true },
          { name: '同伴時間', value: `${duration}分`, inline: true },
          { name: '来店予定時間', value: arrivalTime, inline: false }
        )
        .setColor(0x9B59B6); // Purple
      break;
    }
    case 'ログ退店': {
      const { retiredLog } = details;
      let retiredLogTimestamp = 'N/A';
      if (DateTime) {
        retiredLogTimestamp = DateTime.fromISO(retiredLog.joinTimestamp).setZone('Asia/Tokyo').toFormat('HH:mm');
      } else {
        const date = new Date(retiredLog.joinTimestamp);
        retiredLogTimestamp = date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
      }
      
      const retiredLogUser = retiredLog.user.username;
      const logLabel = { order: 'ひっかけ', douhan: '同伴', arrival: 'ふらっと来た' }[retiredLog.type] || '不明';

      embed.setTitle('👋 ログ完了（退店）')
        .setDescription(`**${categoryName}** のログが完了（退店）として処理されました。`)
        .addFields(
          { name: '対象ログ', value: `[${logLabel}] ${retiredLogTimestamp} by ${retiredLogUser}` },
          { name: '返却キャスト', value: `プラ: ${retiredLog.castPura || 0}人, カマ: ${retiredLog.castKama || 0}人` }
        )
        .setColor(0xE74C3C);
      break;
    }
    case 'ひっかけ確定': {
      const { resolvedLog } = details;
      embed.setTitle('✅ ひっかけ確定')
        .setDescription(`**${categoryName}** の「ひっかけ予定」が **確定** されました。`)
        .addFields(
          { name: '対象', value: `入力者 <@${resolvedLog.user.id}> の ${resolvedLog.people}人/${resolvedLog.bottles}本` }
        )
        .setColor(0x57F287); // Green
      break;
    }
    case 'ひっかけ失敗': {
      const { resolvedLog } = details;
      embed.setTitle('❌ ひっかけ失敗')
        .setDescription(`**${categoryName}** の「ひっかけ予定」が **失敗** として記録されました。`)
        .addFields(
          { name: '対象', value: `<@${resolvedLog.user.id}> の ${resolvedLog.people}人/${resolvedLog.bottles}本` }
        )
        .setColor(0xED4245); // Red
      break;
    }
    case '注文キャンセル': {
      const { people, user: originalUser } = details;
      let time = 'N/A';
      if (DateTime) {
        time = DateTime.fromISO(details.joinTimestamp).setZone('Asia/Tokyo').toFormat('HH:mm');
      } else {
        const date = new Date(details.joinTimestamp);
        time = date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
      }
      
      embed.setTitle('🗑️ 注文キャンセル')
        .setDescription(`**${categoryName}** の注文がキャンセルされました。`)
        .addFields(
          { name: '対象', value: `[${time}] ${people}人 (${originalUser.username})` },
          { name: '操作者', value: `<@${user.id}>` }
        )
        .setColor(0x99AAB5); // Gray
      break;
    }
    default:
      embed.setTitle('📝 不明な操作')
        .setDescription(`**${user.username}** が不明な操作「${logType}」を実行しました。`);
  }

  embed.setFooter({ text: `#${channelName}` });
  return embed;
}

/**
 * スレッドの取得または作成
 * @param {object} params パラメータオブジェクト
 * @returns {Promise<import('discord.js').ThreadChannel|null>}
 */
async function getOrCreateThread({ guildId, client, logKey, state, logChannel, type }) {
  const threadName = `${LOG_THREAD_NAME_PREFIX}${logKey}`;
  let thread = null;

  // 既存スレッドの再取得
  const existingThreadId = state.hikkakeLogThreads?.[type]?.[logKey];
  if (existingThreadId) {
    try {
      thread = await logChannel.threads.fetch(existingThreadId);
    } catch (e) {
      if (e.code !== 10003) { // Unknown Channel
        logger.warn(`[ログスレッド取得失敗] ${threadName}:`, e.message);
      }
    }
  }

  // 存在しなければ新規作成
  if (!thread) {
    thread = await logChannel.threads.create({
      name: threadName,
      autoArchiveDuration: 10080, // 7日
    });
    if (!state.hikkakeLogThreads) state.hikkakeLogThreads = {};
    if (!state.hikkakeLogThreads[type]) state.hikkakeLogThreads[type] = {};
    state.hikkakeLogThreads[type][logKey] = thread.id;
    await writeState(guildId, state);
  }

  return thread;
}

/**
 * メイン関数：ログをスレッドに送信
 * @param {string} guildId ギルドID
 * @param {import('discord.js').Client} client Discordクライアント
 * @param {object} logData ログデータ
 * @returns {Promise<import('discord.js').Message|null>}
 */
async function logToThread(guildId, client, logData) {
  try {
    const now = DateTime ? DateTime.now().setZone('Asia/Tokyo') : new Date();
    let logKey;
    
    if (DateTime) {
      logKey = now.toFormat('yyyy-MM-dd'); // 例: 2024-07-29
    } else {
      logKey = now.toISOString().split('T')[0]; // 例: 2024-07-29
    }
    
    const type = logData.details.type;

    if (!type) {
      logger.error('[logToThread] ログデータに "type" が含まれていません。', logData);
      return null;
    }

    const state = await readState(guildId);
    const logChannelId = state.panelMessages?.[type]?.channelId;
    if (!logChannelId) return null;

    const logChannel = await client.channels.fetch(logChannelId);
    if (!logChannel?.isTextBased()) return null;

    const thread = await getOrCreateThread({
      guildId,
      client,
      logKey,
      state,
      logChannel,
      type,
    });

    if (!thread) return null;

    const embed = createLogEmbed(now, logData);
    const sentMessage = await thread.send({ embeds: [embed] });
    return sentMessage;
  } catch (error) {
    logger.error(`[logToThread] ログ出力中にエラーが発生しました (guild: ${guildId})`, error);
    return null; // ログ出力の失敗はメインの処理を妨げない
  }
}

module.exports = { 
  logToThread, 
  createLogEmbed,
  getOrCreateThread 
};
