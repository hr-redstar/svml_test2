const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChannelType } = require('discord.js');
const { gcsHelper } = require('../../common/gcs');
const { stateManager } = require('../../common/stateManager');
const { createCastAttendancePanel, createStaffAttendancePanel } = require('../../utils/attendanceUtils');

module.exports = {
  // キャスト出退勤パネル用店舗選択
  async syuttaikin_cast_store_select(interaction) {
    try {
      const storeName = interaction.values[0];
      
      // テキストチャンネル一覧を取得
      const channels = interaction.guild.channels.cache
        .filter(channel => channel.type === ChannelType.GuildText)
        .sort((a, b) => a.position - b.position)
        .first(25); // Discord制限

      if (channels.length === 0) {
        await interaction.update({
          content: '❌ テキストチャンネルが見つかりません。',
          embeds: [],
          components: []
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(`👥 ${storeName} - キャスト出退勤パネル設置`)
        .setDescription(`**${storeName}** のキャスト出退勤パネルを設置するチャンネルを選択してください`)
        .setColor(0x00ff00);

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`syuttaikin_cast_channel_select_${storeName}`)
        .setPlaceholder('チャンネルを選択してください')
        .addOptions(
          channels.map(channel => ({
            label: `#${channel.name}`,
            value: channel.id,
            description: channel.topic || 'トピックなし'
          }))
        );

      const row = new ActionRowBuilder().addComponents(selectMenu);

      await interaction.update({
        embeds: [embed],
        components: [row]
      });

    } catch (error) {
      console.error('キャスト店舗選択エラー:', error);
      await interaction.update({
        content: '❌ エラーが発生しました。',
        embeds: [],
        components: []
      });
    }
  },

  // 黒服出退勤パネル用店舗選択
  async syuttaikin_staff_store_select(interaction) {
    try {
      const storeName = interaction.values[0];
      
      // テキストチャンネル一覧を取得
      const channels = interaction.guild.channels.cache
        .filter(channel => channel.type === ChannelType.GuildText)
        .sort((a, b) => a.position - b.position)
        .first(25); // Discord制限

      if (channels.length === 0) {
        await interaction.update({
          content: '❌ テキストチャンネルが見つかりません。',
          embeds: [],
          components: []
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(`🤵 ${storeName} - 黒服出退勤パネル設置`)
        .setDescription(`**${storeName}** の黒服出退勤パネルを設置するチャンネルを選択してください`)
        .setColor(0x000000);

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`syuttaikin_staff_channel_select_${storeName}`)
        .setPlaceholder('チャンネルを選択してください')
        .addOptions(
          channels.map(channel => ({
            label: `#${channel.name}`,
            value: channel.id,
            description: channel.topic || 'トピックなし'
          }))
        );

      const row = new ActionRowBuilder().addComponents(selectMenu);

      await interaction.update({
        embeds: [embed],
        components: [row]
      });

    } catch (error) {
      console.error('黒服店舗選択エラー:', error);
      await interaction.update({
        content: '❌ エラーが発生しました。',
        embeds: [],
        components: []
      });
    }
  },

  // キャスト出退勤パネル設置完了
  async handleCastChannelSelect(interaction, storeName) {
    try {
      const guildId = interaction.guild.id;
      const channelId = interaction.values[0];
      const channel = interaction.guild.channels.cache.get(channelId);

      if (!channel) {
        await interaction.update({
          content: '❌ チャンネルが見つかりません。',
          embeds: [],
          components: []
        });
        return;
      }

      // GCSに設定を保存
      const configPath = `${guildId}/出退勤/config.json`;
      let config = {};
      
      try {
        const existingConfig = await gcsHelper.readFromGcs(configPath);
        config = JSON.parse(existingConfig);
      } catch (error) {
        // 新規作成
      }

      if (!config.castPanels) config.castPanels = {};
      config.castPanels[storeName] = {
        channelId: channelId,
        channelName: channel.name
      };

      await gcsHelper.saveToGcs(configPath, JSON.stringify(config, null, 2));

      // キャスト出退勤パネルを作成
      const panelData = createCastAttendancePanel(storeName);
      const message = await channel.send(panelData);

      // メッセージIDも保存
      config.castPanels[storeName].messageId = message.id;
      await gcsHelper.saveToGcs(configPath, JSON.stringify(config, null, 2));

      const successEmbed = new EmbedBuilder()
        .setTitle('✅ キャスト出退勤パネル設置完了')
        .setDescription(`**${storeName}** のキャスト出退勤パネルを ${channel} に設置しました`)
        .setColor(0x00ff00);

      await interaction.update({
        embeds: [successEmbed],
        components: []
      });

    } catch (error) {
      console.error('キャストパネル設置エラー:', error);
      await interaction.update({
        content: '❌ パネル設置中にエラーが発生しました。',
        embeds: [],
        components: []
      });
    }
  },

  // 黒服出退勤パネル設置完了
  async handleStaffChannelSelect(interaction, storeName) {
    try {
      const guildId = interaction.guild.id;
      const channelId = interaction.values[0];
      const channel = interaction.guild.channels.cache.get(channelId);

      if (!channel) {
        await interaction.update({
          content: '❌ チャンネルが見つかりません。',
          embeds: [],
          components: []
        });
        return;
      }

      // GCSに設定を保存
      const configPath = `${guildId}/出退勤/config.json`;
      let config = {};
      
      try {
        const existingConfig = await gcsHelper.readFromGcs(configPath);
        config = JSON.parse(existingConfig);
      } catch (error) {
        // 新規作成
      }

      if (!config.staffPanels) config.staffPanels = {};
      config.staffPanels[storeName] = {
        channelId: channelId,
        channelName: channel.name
      };

      await gcsHelper.saveToGcs(configPath, JSON.stringify(config, null, 2));

      // 黒服出退勤パネルを作成
      const panelData = createStaffAttendancePanel(storeName);
      const message = await channel.send(panelData);

      // メッセージIDも保存
      config.staffPanels[storeName].messageId = message.id;
      await gcsHelper.saveToGcs(configPath, JSON.stringify(config, null, 2));

      const successEmbed = new EmbedBuilder()
        .setTitle('✅ 黒服出退勤パネル設置完了')
        .setDescription(`**${storeName}** の黒服出退勤パネルを ${channel} に設置しました`)
        .setColor(0x00ff00);

      await interaction.update({
        embeds: [successEmbed],
        components: []
      });

    } catch (error) {
      console.error('黒服パネル設置エラー:', error);
      await interaction.update({
        content: '❌ パネル設置中にエラーが発生しました。',
        embeds: [],
        components: []
      });
    }
  },

  // キャストロール選択完了
  async syuttaikin_cast_role_select(interaction) {
    try {
      const guildId = interaction.guild.id;
      const roleId = interaction.values[0];
      const role = interaction.guild.roles.cache.get(roleId);

      if (!role) {
        await interaction.update({
          content: '❌ ロールが見つかりません。',
          embeds: [],
          components: []
        });
        return;
      }

      // GCSに設定を保存
      const configPath = `${guildId}/出退勤/config.json`;
      let config = {};
      
      try {
        const existingConfig = await gcsHelper.readFromGcs(configPath);
        config = JSON.parse(existingConfig);
      } catch (error) {
        // 新規作成
      }

      config.castRole = {
        id: roleId,
        name: role.name
      };

      await gcsHelper.saveToGcs(configPath, JSON.stringify(config, null, 2));

      const embed = new EmbedBuilder()
        .setTitle('✅ キャストロール設定完了')
        .setDescription(`キャストロールを **${role.name}** に設定しました`)
        .setColor(0x00ff00)
        .addFields({
          name: '設定内容',
          value: `ロール: ${role}\nメンバー数: ${role.members.size}人`,
          inline: false
        });

      await interaction.update({
        embeds: [embed],
        components: []
      });

    } catch (error) {
      console.error('キャストロール設定エラー:', error);
      await interaction.update({
        content: '❌ ロール設定中にエラーが発生しました。',
        embeds: [],
        components: []
      });
    }
  },

  // 黒服ロール選択完了
  async syuttaikin_staff_role_select(interaction) {
    try {
      const guildId = interaction.guild.id;
      const roleId = interaction.values[0];
      const role = interaction.guild.roles.cache.get(roleId);

      if (!role) {
        await interaction.update({
          content: '❌ ロールが見つかりません。',
          embeds: [],
          components: []
        });
        return;
      }

      // GCSに設定を保存
      const configPath = `${guildId}/出退勤/config.json`;
      let config = {};
      
      try {
        const existingConfig = await gcsHelper.readFromGcs(configPath);
        config = JSON.parse(existingConfig);
      } catch (error) {
        // 新規作成
      }

      config.staffRole = {
        id: roleId,
        name: role.name
      };

      await gcsHelper.saveToGcs(configPath, JSON.stringify(config, null, 2));

      const embed = new EmbedBuilder()
        .setTitle('✅ 黒服ロール設定完了')
        .setDescription(`黒服ロールを **${role.name}** に設定しました`)
        .setColor(0x00ff00)
        .addFields({
          name: '設定内容',
          value: `ロール: ${role}\nメンバー数: ${role.members.size}人`,
          inline: false
        });

      await interaction.update({
        embeds: [embed],
        components: []
      });

    } catch (error) {
      console.error('黒服ロール設定エラー:', error);
      await interaction.update({
        content: '❌ ロール設定中にエラーが発生しました。',
        embeds: [],
        components: []
      });
    }
  },

  // 動的セレクトメニューハンドラー（チャンネル選択用）
  async handleDynamicSelect(interaction) {
    const customId = interaction.customId;
    
    // キャストチャンネル選択
    if (customId.startsWith('syuttaikin_cast_channel_select_')) {
      const storeName = customId.replace('syuttaikin_cast_channel_select_', '');
      await this.handleCastChannelSelect(interaction, storeName);
      return;
    }
    
    // 黒服チャンネル選択
    if (customId.startsWith('syuttaikin_staff_channel_select_')) {
      const storeName = customId.replace('syuttaikin_staff_channel_select_', '');
      await this.handleStaffChannelSelect(interaction, storeName);
      return;
    }
  }
};
