const fs = require('fs');
const path = require('path');
const logger = require('../common/logger');

const commands = new Map();
const commandsDir = path.join(__dirname, 'commands');
if (fs.existsSync(commandsDir)) {
	const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		try {
			const command = require(path.join(commandsDir, file));
			if (command.data && command.execute) {
				commands.set(command.data.name, command);
				logger.info(`✅ コマンド登録成功: /${command.data.name}`);
			}
		} catch (error) {
			logger.error(`❌ コマンド読み込みエラー [${file}]:`, error);
		}
	}
}

function init(client) {
	if (client && client.commands && commands) {
		for (const [name, command] of commands) {
			client.commands.set(name, command);
		}
		logger.info(`[uriage_bot] client.commands へコマンド登録完了: ${commands.size}件`);
	}
	if (client && client.componentHandlers && Array.isArray(componentHandlers)) {
		for (const handler of componentHandlers) {
			if (handler && typeof handler.execute === 'function') {
				client.componentHandlers.push(handler);
			}
		}
		logger.info(`[uriage_bot] client.componentHandlers へハンドラー登録完了: ${componentHandlers.length}件`);
	}

	// コマンド・ハンドラー登録直後のデバッグログ追加
	logger.debug(`[uriage_bot] 登録後 client.commands.size: ${client.commands?.size}`);
	logger.debug(`[uriage_bot] 登録後 client.componentHandlers.length: ${client.componentHandlers?.length}`);
}

module.exports = {
	name: 'uriage_bot',
	commands,
	init,
};
