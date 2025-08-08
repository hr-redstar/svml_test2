const { EmbedBuilder } = require('discord.js');
const { DateTime } = require('luxon');
const { logger } = require('@common/logger');

module.exports = {
    customId: 'reminder_extend',
    async execute(interaction) {
        try {
            const [action, serviceId, option] = interaction.customId.split('_');
            
            // service.jsからアクティブサービスを取得
            const serviceCommand = require('../commands/service');
            const activeServices = serviceCommand.getActiveServices();
            
            const service = activeServices.get(serviceId);
            if (!service) {
                await interaction.reply({ 
                    content: '❌ サービスが見つかりません。', 
                    ephemeral: true 
                });
                return;
            }

            let extensionTime;
            let embedColor;
            let title;

            switch (option) {
                case 'extend':
                    extensionTime = 60;
                    embedColor = 0xFFC107;
                    title = '⏰ 接客延長';
                    break;
                case 'half':
                    extensionTime = 30;
                    embedColor = 0xFFC107;
                    title = '⏰ ハーフ延長';
                    break;
                case 'end':
                    await this.handleServiceEnd(interaction, service, serviceId, activeServices);
                    return;
                default:
                    await interaction.reply({ 
                        content: '❌ 無効なオプションです。', 
                        ephemeral: true 
                    });
                    return;
            }

            // 延長処理
            const currentEndTime = DateTime.fromISO(service.endTime);
            const newEndTime = currentEndTime.plus({ minutes: extensionTime });
            service.endTime = newEndTime.toISO();
            service.duration += extensionTime;
            service.reminderSent = false;

            // stateManagerに保存
            stateManager.setState('customer_services', activeServices);

            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setTitle(title)
                .addFields(
                    { name: '🍸 サービス', value: service.service, inline: true },
                    { name: '👥 人数', value: `${service.customerCount}名`, inline: true },
                    { name: '🏠 卓', value: service.tableNumber, inline: true },
                    { name: '⏱️ 延長時間', value: `${extensionTime}分`, inline: true },
                    { name: '🕐 新終了予定', value: newEndTime.toFormat('HH:mm'), inline: true }
                )
                .setTimestamp()
                .setFooter({ text: `Service ID: ${serviceId}` });

            await interaction.update({ embeds: [embed], components: [] });

            logger.info(`Discord経由で接客延長: ${service.service} - ${extensionTime}分延長`);
        } catch (error) {
            logger.error('Extension button error:', error);
            await interaction.reply({
                content: '❌ 延長処理でエラーが発生しました。',
                ephemeral: true
            });
        }
    },

    async handleServiceEnd(interaction, service, serviceId, activeServices) {
        try {
            service.actualAmount = service.estimatedAmount; // デフォルトで予想金額を設定
            service.status = 'completed';
            service.endedAt = DateTime.now().setZone('Asia/Tokyo').toISO();

            activeServices.delete(serviceId);
            
            // stateManagerに保存
            stateManager.setState('customer_services', activeServices);

            const duration = DateTime.fromISO(service.endedAt).diff(DateTime.fromISO(service.startTime), 'minutes').minutes;

            const embed = new EmbedBuilder()
                .setColor(0xDC3545)
                .setTitle('✅ 接客終了')
                .addFields(
                    { name: '🍸 サービス', value: service.service, inline: true },
                    { name: '👥 人数', value: `${service.customerCount}名`, inline: true },
                    { name: '🏠 卓', value: service.tableNumber, inline: true },
                    { name: '⏱️ 実際時間', value: `${Math.round(duration)}分`, inline: true },
                    { name: '💰 金額', value: `${service.estimatedAmount}円`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: `Service ID: ${serviceId}` });

            if (service.remarks) {
                embed.addFields({ name: '📝 備考', value: service.remarks, inline: false });
            }

            await interaction.update({ embeds: [embed], components: [] });

            logger.info(`Discord経由で接客終了: ${service.service} - 金額: ${service.estimatedAmount}円`);
        } catch (error) {
            logger.error('Service end error:', error);
            throw error;
        }
    }
};
