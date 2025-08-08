// config_bot/components/embeds/coreConfigEmbeds.js

const { EmbedBuilder } = require('discord.js');

/**
 * コア設定パネルのメインEmbedを作成
 */
function createCoreConfigEmbed(storeNames = [], roleNames = [], logChannelId = null, logThreadIds = {}) {
  // デフォルト値を設定
  const defaultStores = storeNames.length > 0 ? storeNames : ['redstar', 'レッドスター', 'test'];
  const defaultRoles = roleNames.length > 0 ? roleNames : ['社長', '社員', '契約', 'アルバイト', '見習い'];
  
  // ログチャンネルスレッド一覧の表示を動的に生成
  let logChannelText = '';
  if (logChannelId && logThreadIds) {
    // 設定されている場合は実際のスレッドIDを表示
    const settingsThreadId = logThreadIds['設定ログ'];
    const commandsThreadId = logThreadIds['コマンドログ'];
    const systemThreadId = logThreadIds['グローバルログ'];
    
    logChannelText = `ログチャンネル: <#${logChannelId}>\n\n` +
      `📋 設定ログ: ${settingsThreadId ? `<#${settingsThreadId}>` : '未設定'}\n` +
      `⚡ コマンドログ: ${commandsThreadId ? `<#${commandsThreadId}>` : '未設定'}\n` +
      `🌍 グローバルログ: ${systemThreadId ? `<#${systemThreadId}>` : '未設定'}`;
  } else {
    // 未設定の場合は固定メッセージ
    logChannelText = 'ログチャンネル: 未設定\n\n' +
      '📋 設定ログ: 未設定\n' +
      '⚡ コマンドログ: 未設定\n' +
      '🌍 グローバルログ: 未設定';
  }
  
  return new EmbedBuilder()
    .setTitle('⚙️ SVML設定')
    .setColor(0x0099ff)
    .addFields(
      {
        name: 'ログチャンネルスレッド一覧',
        value: logChannelText,
        inline: false
      },
      {
        name: '� 登録済み店舗一覧　コピーできるように',
        value: `\`\`\`\n${defaultStores.join('\n')}\n\`\`\``,
        inline: false
      },
      {
        name: '� 登録済み役職一覧　コピーできるように',
        value: `\`\`\`\n${defaultRoles.join('\n')}\n\`\`\``,
        inline: false
      }
    )
    .setTimestamp();
}

/**
 * ログチャンネル設定用のEmbedを作成
 */
function createLogChannelConfigEmbed() {
  return new EmbedBuilder()
    .setTitle('📝 ログチャンネル設定')
    .setDescription('設定変更やコマンド実行のログを記録するチャンネルを選択してください。\n\n' +
      '選択されたチャンネルに以下のスレッドが自動作成されます：\n' +
      '• 設定変更ログ\n' +
      '• コマンド実行ログ\n' +
      '• システムログ')
    .setColor(0x9932cc);
}

/**
 * Embedビルダー用のEmbedを作成
 */
function createEmbedBuilderEmbed() {
  return new EmbedBuilder()
    .setTitle('📝 Embedビルダー')
    .setDescription('埋め込みメッセージを新規作成するか、既存のものを編集するか選択してください。')
    .setColor(0x3498db);
}

module.exports = {
  createCoreConfigEmbed,
  createLogChannelConfigEmbed,
  createEmbedBuilderEmbed
};
