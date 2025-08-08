// scripts/deploy-global-commands.js - グローバルコマンド登録スクリプト

require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const clientId = process.env.CLIENT_ID;
const token = process.env.DISCORD_TOKEN;

if (!clientId || !token) {
  console.error('❌ .env の CLIENT_ID または DISCORD_TOKEN が未設定です');
  process.exit(1);
}

const botModules = [
  'config_bot',
  'keihi_bot',
  'hikkake_bot',
  'kpi_bot',
  'syuttaikin_bot',
  'level_bot',
  'uriage_bot'
];

async function main() {
  console.log('🚀 グローバルコマンド登録開始...');
  const commands = [];

  for (const moduleName of botModules) {
    const modulePath = path.join(__dirname, '..', moduleName);
    if (!fs.existsSync(modulePath)) {
      console.log(`⏭️ ${moduleName} ディレクトリが見つかりません - スキップ`);
      continue;
    }
    try {
      delete require.cache[require.resolve(modulePath)];
      const botModule = require(modulePath);
      let moduleCommands = [];
      if (botModule.commands instanceof Map) {
        moduleCommands = Array.from(botModule.commands.values())
          .filter(cmd => cmd && cmd.data && typeof cmd.data.toJSON === 'function')
          .map(cmd => cmd.data.toJSON());
      } else if (Array.isArray(botModule.commands)) {
        moduleCommands = botModule.commands
          .filter(cmd => cmd && cmd.data && typeof cmd.data.toJSON === 'function')
          .map(cmd => cmd.data.toJSON());
      }
      commands.push(...moduleCommands);
      moduleCommands.forEach(cmd => {
        console.log(`  /${cmd.name} - ${cmd.description}`);
      });
    } catch (error) {
      console.error(`❌ ${moduleName} の読み込みエラー:`, error);
    }
  }

  console.log(`\n📊 合計 ${commands.length}個のコマンドを登録します\n`);

  const rest = new REST().setToken(token);
  try {
    const data = await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands }
    );
    console.log(`✅ グローバルコマンド登録完了: ${data.length}個のコマンドを登録しました`);
    data.forEach((cmd, i) => {
      console.log(`${i + 1}. /${cmd.name} - ${cmd.description}`);
    });
    console.log('\n🎉 すべてのDiscordサーバーで利用可能になりました！');
    console.log('⏰ 反映まで最大1時間かかる場合があります');
  } catch (error) {
    console.error('❌ グローバルコマンド登録エラー:', error);
    process.exit(1);
  }
}

main();
