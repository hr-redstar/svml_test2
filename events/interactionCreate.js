const logger = require('@common/logger');
const path = require('node:path');
const { Events, MessageFlags, EmbedBuilder } = require('discord.js');
const { logCommandExecution, logConfigChange } = require('@common/utils/configLogger');
const { getAdvancedDisplayName } = require('@root/common/componentNameMapper');
const handlerRegistry = require('@common/handlers/handlerRegistry');
const performanceManager = require('@common/performance/performanceManager');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    console.log(`🔥 [INTERACTION] InteractionCreate event triggered! Type: ${interaction.type}, CommandName: ${interaction.commandName || 'N/A'}`);
    logger.info(`🔥 [INTERACTION] InteractionCreate event triggered! Type: ${interaction.type}, CommandName: ${interaction.commandName || 'N/A'}`);
    
    const startTime = Date.now();
    const interactionId = `${interaction.id.slice(-8)}`; // 短縮ID
    
    // --- 詳細インタラクション情報のログ出力 ---
    try {
      const logDetails = {
        インタラクションID: interactionId,
        タイプ: interaction.type,
        実行者: `${interaction.user.tag} (${interaction.user.id})`,
        サーバー: interaction.inGuild() ? `${interaction.guild.name} (${interaction.guild.id})` : 'DM',
        チャンネル: interaction.channel
          ? `${'name' in interaction.channel ? interaction.channel.name : 'N/A'} (${interaction.channel.id})`
          : 'N/A',
      };

      if (interaction.isChatInputCommand()) {
        const commandName = interaction.commandName;
        const options = interaction.options.data
          .map(opt => `${opt.name}:${opt.value}`)
          .join(' ') || '(オプションなし)';
        
        logger.info(`🎯 [${interactionId}] スラッシュコマンド実行: /${commandName}`);
        logger.debug(`📋 [${interactionId}] コマンド詳細`, { ...logDetails, コマンド名: commandName, オプション: options });
        
      } else if (interaction.isButton()) {
        logger.info(`🔘 [${interactionId}] ボタンクリック: ${interaction.customId}`);
        logger.debug(`📋 [${interactionId}] ボタン詳細`, { ...logDetails, カスタムID: interaction.customId });
        
      } else if (interaction.isAnySelectMenu()) {
        const selectedValues = interaction.values?.join(', ') || '(値なし)';
        logger.info(`📜 [${interactionId}] セレクトメニュー操作: ${interaction.customId}`);
        logger.debug(`📋 [${interactionId}] セレクト詳細`, { ...logDetails, カスタムID: interaction.customId, 選択値: selectedValues });
        
      } else if (interaction.isModalSubmit()) {
        const fieldCount = interaction.fields?.fields?.size || 0;
        logger.info(`📝 [${interactionId}] モーダル送信: ${interaction.customId} (${fieldCount}フィールド)`);
        logger.debug(`📋 [${interactionId}] モーダル詳細`, { ...logDetails, カスタムID: interaction.customId, フィールド数: fieldCount });
        
      } else {
        logger.info(`❓ [${interactionId}] 未知のインタラクション: ${interaction.type}`);
        logger.debug(`📋 [${interactionId}] 未知詳細`, logDetails);
      }
    } catch (logError) {
      logger.warn(`⚠️ [${interactionId}] ログ出力エラー - 処理継続`, { 
        エラー: logError instanceof Error ? logError.message : String(logError),
        interactionId: interactionId
      });
    }

    // --- 統合ハンドラーによるインタラクション処理 ---
    logger.info(`🎯 [${interactionId}] 統合ハンドラーによる処理開始`);
    const processingStartTime = Date.now();

    try {
      // インタラクションタイプに応じたキャッシュ戦略
      let routingResult;
      const interactionKey = interaction.commandName || interaction.customId || 'unknown';
      
      // モーダル送信やコマンド処理はキャッシュしない（状態変更を伴うため）
      if (interaction.isModalSubmit() || interaction.isChatInputCommand()) {
        logger.debug(`🚫 [${interactionId}] キャッシュ無効化: ${interactionKey} (状態変更操作)`);
        routingResult = await handlerRegistry.routeInteractionHyperFast(interaction);
      } else {
        // ボタンやセレクトメニューは短時間キャッシュ（表示系処理）
        const cacheTime = interaction.isButton() || interaction.isAnySelectMenu() ? 60000 : 300000; // 1分 or 5分
        logger.debug(`[${interactionId}] Calling executeWithCache for ${interactionKey}`);
        routingResult = await performanceManager.executeWithCache(
          `interaction-route:${interactionKey}:${interaction.type}`,
          () => handlerRegistry.routeInteractionHyperFast(interaction),
          cacheTime
        );
        logger.debug(`[${interactionId}] executeWithCache returned for ${interactionKey}`);
        logger.debug(`⚡ [${interactionId}] キャッシュ適用: ${interactionKey} (${cacheTime/1000}秒)`);
      }
      
      const processingTime = Date.now() - processingStartTime;
      
      // ルーティング結果の検証
      if (!routingResult) {
        logger.error(`💥 [${interactionId}] 統合ハンドラー処理失敗: ルーティング結果がnull (${processingTime}ms)`);
        const errorMessage = 'ハンドラーのルーティングに失敗しました。';
        
        try {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              content: `❌ ${errorMessage}`,
              flags: MessageFlags.Ephemeral,
            });
          }
        } catch (replyError) {
          logger.error(`💥 [${interactionId}] エラー応答送信失敗:`, { 
            error: replyError instanceof Error ? replyError.message : String(replyError),
            interactionId: interactionId
          });
        }
        return;
      }
      
      if (routingResult.success) {
        logger.info(`✅ [${interactionId}] 統合ハンドラー処理完了: ${routingResult.handlerName} (${processingTime}ms)`);
        
        // 統合ハンドラー実行ログを記録
        try {
          const interactionType = interaction.isChatInputCommand() ? 'コマンド' :
                                 interaction.isButton() ? 'ボタン' :
                                 interaction.isAnySelectMenu() ? 'セレクトメニュー' :
                                 interaction.isModalSubmit() ? 'モーダル' : '不明';
          
          const interactionName = interaction.isChatInputCommand() ? `/${interaction.commandName}` :
                                 getAdvancedDisplayName(interaction.customId) || interaction.customId || '不明';
          
          const logEmbed = new EmbedBuilder()
            .setTitle('🎯 統合ハンドラー実行ログ')
            .setDescription(`${interactionType} **${interactionName}** が統合ハンドラーで処理されました`)
            .addFields(
              { name: '実行者', value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: true },
              { name: 'チャンネル', value: `<#${interaction.channel.id}>`, inline: true },
              { name: '実行時間', value: `${processingTime}ms`, inline: true },
              { name: 'ハンドラー', value: routingResult.handlerName, inline: true },
              { name: 'インタラクション種別', value: interactionType, inline: true },
              { name: 'ルート', value: routingResult.route || 'N/A', inline: true }
            )
            .setColor(0x00aa00)
            .setTimestamp();
          
          // コマンドの場合はオプションも記録
          if (interaction.isChatInputCommand() && interaction.options.data.length > 0) {
            const options = interaction.options.data
              .map(opt => `\`${opt.name}\`: ${opt.value}`)
              .join('\n');
            logEmbed.addFields({ name: 'オプション', value: options });
          }
          
          // セレクトメニューの場合は選択値も記録
          if (interaction.isAnySelectMenu() && interaction.values?.length > 0) {
            logEmbed.addFields({ 
              name: '選択値', 
              value: interaction.values.map(v => `\`${v}\``).join(', ') 
            });
          }
          
          // モーダルの場合はフィールド数を記録
          if (interaction.isModalSubmit()) {
            const fieldCount = interaction.fields?.fields?.size || 0;
            logEmbed.addFields({ 
              name: 'フィールド数', 
              value: `${fieldCount}個`,
              inline: true 
            });
          }
          
          await logCommandExecution(interaction, logEmbed);
        } catch (logError) {
          logger.warn(`[${interactionId}] 統合ハンドラーログ記録に失敗:`, { 
            error: logError instanceof Error ? logError.message : String(logError),
            interactionId: interactionId
          });
        }
        
      } else {
        logger.error(`💥 [${interactionId}] 統合ハンドラー処理失敗: ${routingResult.error} (${processingTime}ms)`);
        
        // エラーログを記録
        try {
          const interactionType = interaction.isChatInputCommand() ? 'コマンド' :
                                 interaction.isButton() ? 'ボタン' :
                                 interaction.isAnySelectMenu() ? 'セレクトメニュー' :
                                 interaction.isModalSubmit() ? 'モーダル' : '不明';
          
          const interactionName = interaction.isChatInputCommand() ? `/${interaction.commandName}` :
                                 interaction.customId || '不明';
          
          const errorLogEmbed = new EmbedBuilder()
            .setTitle('❌ 統合ハンドラー処理エラー')
            .setDescription(`${interactionType} **${interactionName}** の処理中にエラーが発生しました`)
            .addFields(
              { name: '実行者', value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: true },
              { name: 'チャンネル', value: `<#${interaction.channel.id}>`, inline: true },
              { name: '実行時間', value: `${processingTime}ms`, inline: true },
              { name: 'エラー内容', value: `\`\`\`${routingResult.error.slice(0, 1000)}\`\`\`` }
            )
            .setColor(0xff0000)
            .setTimestamp();
          
          await logCommandExecution(interaction, errorLogEmbed);
        } catch (logError) {
          logger.warn(`[${interactionId}] エラーログ記録に失敗:`, { 
            error: logError instanceof Error ? logError.message : String(logError),
            interactionId: interactionId
          });
        }

        // ユーザーへのエラー応答
        const errorReply = {
          content: `❌ 処理中にエラーが発生しました。\n\`\`\`${routingResult.error}\`\`\``,
          flags: MessageFlags.Ephemeral,
        };

        try {
          if (interaction.deferred) {
            await interaction.editReply(errorReply);
          } else if (interaction.replied) {
            await interaction.followUp(errorReply);
          } else {
            await interaction.reply(errorReply);
          }
        } catch (replyError) {
          logger.error(`💥 [${interactionId}] エラー応答送信失敗:`, { 
            error: replyError instanceof Error ? replyError.message : String(replyError),
            interactionId: interactionId
          });
        }
      }
      
    } catch (handlerError) {
      const processingTime = Date.now() - processingStartTime;
      logger.error(`💥 [${interactionId}] 統合ハンドラー例外エラー (${processingTime}ms):`, { 
        error: handlerError instanceof Error ? handlerError.message : String(handlerError),
        interactionId: interactionId,
        processingTime: processingTime
      });
      if (handlerError.stack) {
        logger.debug(`📚 スタックトレース:\n${handlerError.stack}`);
      }

      // 例外エラーの応答
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: `❌ システムエラーが発生しました。管理者にお問い合わせください。`,
            flags: MessageFlags.Ephemeral,
          });
        }
      } catch (replyError) {
        logger.error(`💥 [${interactionId}] 例外エラー応答送信失敗:`, { 
          error: replyError instanceof Error ? replyError.message : String(replyError),
          interactionId: interactionId
        });
      }
    }
    
    const totalTime = Date.now() - startTime;
    logger.debug(`⏱️ [${interactionId}] 総処理時間: ${totalTime}ms`);
    return; // 統合ハンドラー処理完了
  },
};
