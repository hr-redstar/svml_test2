const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { DateTime } = require('luxon');
const { logger } = require('@common/logger');

// サービスデータを管理するマップ（メモリベースで簡素化）
const activeServices = new Map();
const serviceLogs = [];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('service')
        .setDescription('接客ログBot操作')
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('新規接客を開始')
                .addIntegerOption(option =>
                    option.setName('人数')
                        .setDescription('お客様の人数')
                        .setRequired(true)
                        .addChoices(
                            { name: '1名', value: 1 },
                            { name: '2名', value: 2 },
                            { name: '3名', value: 3 },
                            { name: '4名', value: 4 },
                            { name: '5名以上', value: 5 }
                        ))
                .addStringOption(option =>
                    option.setName('サービス')
                        .setDescription('サービス種類')
                        .setRequired(true)
                        .addChoices(
                            { name: '飲み放題', value: '飲み放題' },
                            { name: 'セット', value: 'セット' },
                            { name: '延長', value: '延長' },
                            { name: 'ハーフ', value: 'ハーフ' },
                            { name: 'その他', value: 'その他' }
                        ))
                .addIntegerOption(option =>
                    option.setName('金額')
                        .setDescription('予想金額（円）')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('時間')
                        .setDescription('予定時間（分）')
                        .setRequired(true)
                        .addChoices(
                            { name: '30分', value: 30 },
                            { name: '60分', value: 60 },
                            { name: '90分', value: 90 },
                            { name: '120分', value: 120 },
                            { name: '150分', value: 150 },
                            { name: '180分', value: 180 }
                        ))
                .addStringOption(option =>
                    option.setName('卓')
                        .setDescription('卓番号')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('備考')
                        .setDescription('特記事項やメモ')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('現在のアクティブな接客一覧を表示'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('end')
                .setDescription('接客を終了')
                .addStringOption(option =>
                    option.setName('service_id')
                        .setDescription('サービスID')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('実際金額')
                        .setDescription('実際の金額（円）')
                        .setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'start':
                await this.handleServiceStart(interaction);
                break;
            case 'list':
                await this.handleServiceList(interaction);
                break;
            case 'end':
                await this.handleServiceEnd(interaction);
                break;
        }
    },

    async handleServiceStart(interaction) {
        try {
            const customerCount = interaction.options.getInteger('人数');
            const service = interaction.options.getString('サービス');
            const estimatedAmount = interaction.options.getInteger('金額');
            const duration = interaction.options.getInteger('時間');
            const tableNumber = interaction.options.getString('卓') || 'なし';
            const remarks = interaction.options.getString('備考') || '';

            // バリデーション
            if (!customerCount || !service || !estimatedAmount || !duration) {
                await interaction.reply({
                    content: '❌ 必須項目が不足しています。',
                    ephemeral: true
                });
                return;
            }

            const serviceId = Date.now().toString();
            const startTime = DateTime.now().setZone('Asia/Tokyo');
            const endTime = startTime.plus({ minutes: duration });

            const serviceLog = {
                id: serviceId,
                customerCount,
                service,
                estimatedAmount,
                duration,
                tableNumber,
                remarks,
                startTime: startTime.toISO(),
                endTime: endTime.toISO(),
                status: 'active',
                reminderSent: false,
                discordUserId: interaction.user.id,
                channelId: interaction.channelId
            };

            serviceLogs.push(serviceLog);
            activeServices.set(serviceId, serviceLog);
            
            // stateManagerに保存
            stateManager.setState('customer_services', activeServices);
            stateManager.setState('customer_logs', serviceLogs);

            const embed = new EmbedBuilder()
                .setColor(0x00AE86)
                .setTitle('🎯 接客開始')
                .addFields(
                    { name: '👥 人数', value: `${customerCount}名`, inline: true },
                    { name: '🍸 サービス', value: service, inline: true },
                    { name: '🏠 卓', value: tableNumber, inline: true },
                    { name: '💰 予想金額', value: `${estimatedAmount}円`, inline: true },
                    { name: '⏰ 予定時間', value: `${duration}分`, inline: true },
                    { name: '🕐 開始時刻', value: startTime.toFormat('HH:mm'), inline: true },
                    { name: '🕐 終了予定', value: endTime.toFormat('HH:mm'), inline: true }
                )
                .setTimestamp()
                .setFooter({ text: `Service ID: ${serviceId}` });

            if (remarks) {
                embed.addFields({ name: '📝 備考', value: remarks, inline: false });
            }

            await interaction.reply({ embeds: [embed] });

            logger.info(`Discord経由で接客開始: ${service} - ${customerCount}名 - ${duration}分`);
        } catch (error) {
            logger.error('Discord service start error:', error);
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({
                        content: '❌ 接客開始処理でエラーが発生しました。',
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: '❌ 接客開始処理でエラーが発生しました。',
                        ephemeral: true
                    });
                }
            } catch (replyError) {
                logger.error('Failed to send error message:', replyError);
            }
        }
    },

    async handleServiceList(interaction) {
        try {
            const activeServicesList = Array.from(activeServices.values());

            if (activeServicesList.length === 0) {
                await interaction.reply({
                    content: '📋 現在アクティブな接客はありません。',
                    ephemeral: true
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('📋 現在の接客状況')
                .setDescription(`アクティブな接客: ${activeServicesList.length}件`);

            activeServicesList.forEach((service, index) => {
                const endTime = DateTime.fromISO(service.endTime);
                const now = DateTime.now().setZone('Asia/Tokyo');
                const remainingMinutes = Math.ceil(endTime.diff(now, 'minutes').minutes);
                
                let status = remainingMinutes > 0 ? `残り${remainingMinutes}分` : `超過${Math.abs(remainingMinutes)}分`;
                let statusEmoji = remainingMinutes > 10 ? '🟢' : remainingMinutes > 0 ? '🟡' : '🔴';
                
                embed.addFields({
                    name: `${statusEmoji} ${index + 1}. ${service.service} - ${service.customerCount}名 (${service.tableNumber}卓)`,
                    value: `💰 ${service.estimatedAmount}円 | ⏰ ${status} | 🕐 ${DateTime.fromISO(service.startTime).toFormat('HH:mm')}〜${DateTime.fromISO(service.endTime).toFormat('HH:mm')}\n📝 ID: ${service.id}`,
                    inline: false
                });
            });

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            logger.error('Discord service list error:', error);
            await interaction.reply({
                content: '❌ 接客一覧取得でエラーが発生しました。',
                ephemeral: true
            });
        }
    },

    async handleServiceEnd(interaction) {
        try {
            const serviceId = interaction.options.getString('service_id');
            const actualAmount = interaction.options.getInteger('実際金額');

            const service = activeServices.get(serviceId);
            if (!service) {
                await interaction.reply({
                    content: '❌ 指定されたサービスが見つかりません。サービスIDを確認してください。',
                    ephemeral: true
                });
                return;
            }

            service.actualAmount = actualAmount;
            service.status = 'completed';
            service.endedAt = DateTime.now().setZone('Asia/Tokyo').toISO();

            activeServices.delete(serviceId);
            
            // stateManagerに保存
            stateManager.setState('customer_services', activeServices);
            stateManager.setState('customer_logs', serviceLogs);

            const duration = DateTime.fromISO(service.endedAt).diff(DateTime.fromISO(service.startTime), 'minutes').minutes;
            const diff = actualAmount - service.estimatedAmount;

            const embed = new EmbedBuilder()
                .setColor(0x28A745)
                .setTitle('✅ 接客終了')
                .addFields(
                    { name: '🍸 サービス', value: service.service, inline: true },
                    { name: '👥 人数', value: `${service.customerCount}名`, inline: true },
                    { name: '🏠 卓', value: service.tableNumber, inline: true },
                    { name: '⏱️ 実際時間', value: `${Math.round(duration)}分`, inline: true },
                    { name: '💰 実際金額', value: `${actualAmount}円`, inline: true },
                    { name: '💵 差額', value: `${diff >= 0 ? '+' : ''}${diff}円`, inline: true }
                )
                .setTimestamp();

            if (service.remarks) {
                embed.addFields({ name: '📝 備考', value: service.remarks, inline: false });
            }

            await interaction.reply({ embeds: [embed] });

            logger.info(`Discord経由で接客終了: ${service.service} - 実際金額: ${actualAmount}円`);
        } catch (error) {
            logger.error('Discord service end error:', error);
            await interaction.reply({
                content: '❌ 接客終了処理でエラーが発生しました。',
                ephemeral: true
            });
        }
    },

    // 外部から使用する関数
    getActiveServices() {
        return activeServices;
    },

    getServiceLogs() {
        return serviceLogs;
    }
};
