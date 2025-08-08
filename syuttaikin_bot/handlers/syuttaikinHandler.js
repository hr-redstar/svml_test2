const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle } = require('discord.js');
const { gcsHelper } = require('../../common/gcs');
const { stateManager } = require('../../common/stateManager');
const { createCastAttendanceModal, createStaffAttendanceModal } = require('../components/modals/attendanceModals');
const { saveAttendanceData, updateAttendancePanel } = require('../utils/attendanceUtils');

module.exports = {
  // キャスト出退勤パネル設置
  async syuttaikin_panel_cast(interaction) {
    try {
      const guildId = interaction.guild.id;
      
      // 店舗一覧を取得
      const stores = await stateManager.getState(guildId, 'stores') || [];
      
      if (stores.length === 0) {
        await interaction.reply({
          content: '❌ 店舗が登録されていません。先に店舗を登録してください。',
          ephemeral: true
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('👥 キャスト出退勤パネル設置')
        .setDescription('キャスト出退勤パネルを設置する店舗を選択してください')
        .setColor(0x00ff00);

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('syuttaikin_cast_store_select')
        .setPlaceholder('店舗を選択してください')
        .addOptions(
          stores.map(store => ({
            label: store,
            value: store,
            description: `${store}のキャスト出退勤パネルを設置`
          }))
        );

      const row = new ActionRowBuilder().addComponents(selectMenu);

      await interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true
      });

    } catch (error) {
      console.error('キャスト出退勤パネル設置エラー:', error);
      await interaction.reply({
        content: '❌ エラーが発生しました。',
        ephemeral: true
      });
    }
  },

  // 黒服出退勤パネル設置
  async syuttaikin_panel_staff(interaction) {
    try {
      const guildId = interaction.guild.id;
      
      // 店舗一覧を取得
      const stores = await stateManager.getState(guildId, 'stores') || [];
      
      if (stores.length === 0) {
        await interaction.reply({
          content: '❌ 店舗が登録されていません。先に店舗を登録してください。',
          ephemeral: true
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('🤵 黒服出退勤パネル設置')
        .setDescription('黒服出退勤パネルを設置する店舗を選択してください')
        .setColor(0x000000);

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('syuttaikin_staff_store_select')
        .setPlaceholder('店舗を選択してください')
        .addOptions(
          stores.map(store => ({
            label: store,
            value: store,
            description: `${store}の黒服出退勤パネルを設置`
          }))
        );

      const row = new ActionRowBuilder().addComponents(selectMenu);

      await interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true
      });

    } catch (error) {
      console.error('黒服出退勤パネル設置エラー:', error);
      await interaction.reply({
        content: '❌ エラーが発生しました。',
        ephemeral: true
      });
    }
  },

  // キャストロール選択
  async syuttaikin_role_cast(interaction) {
    try {
      const guildId = interaction.guild.id;
      const roles = interaction.guild.roles.cache
        .filter(role => !role.managed && role.name !== '@everyone')
        .sort((a, b) => b.position - a.position)
        .first(25); // Discord制限

      if (roles.length === 0) {
        await interaction.reply({
          content: '❌ 選択可能なロールがありません。',
          ephemeral: true
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('🎭 キャストロール選択')
        .setDescription('キャストとして設定するロールを選択してください')
        .setColor(0xff69b4);

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('syuttaikin_cast_role_select')
        .setPlaceholder('キャストロールを選択してください')
        .addOptions(
          roles.map(role => ({
            label: role.name,
            value: role.id,
            description: `メンバー数: ${role.members.size}人`
          }))
        );

      const row = new ActionRowBuilder().addComponents(selectMenu);

      await interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true
      });

    } catch (error) {
      console.error('キャストロール選択エラー:', error);
      await interaction.reply({
        content: '❌ エラーが発生しました。',
        ephemeral: true
      });
    }
  },

  // 黒服ロール選択
  async syuttaikin_role_staff(interaction) {
    try {
      const guildId = interaction.guild.id;
      const roles = interaction.guild.roles.cache
        .filter(role => !role.managed && role.name !== '@everyone')
        .sort((a, b) => b.position - a.position)
        .first(25); // Discord制限

      if (roles.length === 0) {
        await interaction.reply({
          content: '❌ 選択可能なロールがありません。',
          ephemeral: true
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('👔 黒服ロール選択')
        .setDescription('黒服として設定するロールを選択してください')
        .setColor(0x36393f);

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('syuttaikin_staff_role_select')
        .setPlaceholder('黒服ロールを選択してください')
        .addOptions(
          roles.map(role => ({
            label: role.name,
            value: role.id,
            description: `メンバー数: ${role.members.size}人`
          }))
        );

      const row = new ActionRowBuilder().addComponents(selectMenu);

      await interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true
      });

    } catch (error) {
      console.error('黒服ロール選択エラー:', error);
      await interaction.reply({
        content: '❌ エラーが発生しました。',
        ephemeral: true
      });
    }
  },

  // キャスト出退勤登録ボタン
  async handleCastAttendanceRegister(interaction, storeName) {
    try {
      const modal = createCastAttendanceModal(storeName);
      await interaction.showModal(modal);
    } catch (error) {
      console.error('キャスト出退勤登録モーダル表示エラー:', error);
      await interaction.reply({
        content: '❌ エラーが発生しました。',
        ephemeral: true
      });
    }
  },

  // 黒服出退勤登録ボタン
  async handleStaffAttendanceRegister(interaction, storeName) {
    try {
      const modal = createStaffAttendanceModal(storeName);
      await interaction.showModal(modal);
    } catch (error) {
      console.error('黒服出退勤登録モーダル表示エラー:', error);
      await interaction.reply({
        content: '❌ エラーが発生しました。',
        ephemeral: true
      });
    }
  },

  // キャスト出退勤モーダル送信処理
  async handleCastAttendanceModal(interaction, storeName) {
    try {
      const names = interaction.fields.getTextInputValue('attendance_names').split('\n').filter(name => name.trim());
      const times = interaction.fields.getTextInputValue('attendance_times').split('\n').filter(time => time.trim());
      const type = interaction.fields.getTextInputValue('attendance_type').trim();

      if (!['出勤', '退勤'].includes(type)) {
        await interaction.reply({
          content: '❌ 種別は「出勤」または「退勤」を入力してください。',
          ephemeral: true
        });
        return;
      }

      // 出退勤データを作成
      const attendanceData = [];
      for (let i = 0; i < Math.max(names.length, times.length); i++) {
        attendanceData.push({
          name: names[i] || '名前未設定',
          time: times[i] || '時間未設定',
          type: type
        });
      }

      // GCSに保存
      const guildId = interaction.guild.id;
      const success = await saveAttendanceData(guildId, 'キャスト', storeName, attendanceData);

      if (!success) {
        await interaction.reply({
          content: '❌ データの保存に失敗しました。',
          ephemeral: true
        });
        return;
      }

      // パネルを更新
      const updatedEmbed = await updateAttendancePanel(interaction, storeName, 'キャスト', attendanceData);
      
      if (updatedEmbed) {
        await interaction.update({
          embeds: [updatedEmbed]
        });
      }

      await interaction.followUp({
        content: `✅ ${storeName}のキャスト${type}を登録しました。`,
        ephemeral: true
      });

    } catch (error) {
      console.error('キャスト出退勤モーダル処理エラー:', error);
      await interaction.reply({
        content: '❌ 登録処理中にエラーが発生しました。',
        ephemeral: true
      });
    }
  },

  // ユーザー選択後のキャスト出退勤モーダル送信処理
  async handleCastUserAttendanceModal(interaction, storeName, userIds) {
    try {
      const names = interaction.fields.getTextInputValue('attendance_names').split('\n').filter(name => name.trim());
      const times = interaction.fields.getTextInputValue('attendance_times').split('\n').filter(time => time.trim());
      const type = interaction.fields.getTextInputValue('attendance_type').trim();

      if (!['出勤', '退勤'].includes(type)) {
        await interaction.reply({
          content: '❌ 種別は「出勤」または「退勤」を入力してください。',
          ephemeral: true
        });
        return;
      }

      // ユーザー情報を取得
      const users = userIds.split(',').map(id => interaction.client.users.cache.get(id)).filter(Boolean);
      
      // 出退勤データを作成
      const attendanceData = [];
      for (let i = 0; i < Math.max(users.length, times.length); i++) {
        const user = users[i];
        const displayName = names[i] || (user ? (user.displayName || user.username) : '名前未設定');
        const time = times[i] || '時間未設定';
        
        attendanceData.push({
          name: displayName,
          time: time,
          type: type,
          userId: user ? user.id : null
        });
      }

      // GCSに保存
      const guildId = interaction.guild.id;
      const success = await saveAttendanceData(guildId, 'キャスト', storeName, attendanceData);

      if (!success) {
        await interaction.reply({
          content: '❌ データの保存に失敗しました。',
          ephemeral: true
        });
        return;
      }

      await interaction.reply({
        content: `✅ ${storeName}のキャスト${type}を登録しました。\n登録人数: ${attendanceData.length}人`,
        ephemeral: true
      });

    } catch (error) {
      console.error('キャストユーザー出退勤モーダル処理エラー:', error);
      await interaction.reply({
        content: '❌ 登録処理中にエラーが発生しました。',
        ephemeral: true
      });
    }
  },

  // ユーザー選択後の黒服出退勤モーダル送信処理
  async handleStaffUserAttendanceModal(interaction, storeName, userIds) {
    try {
      const mentions = interaction.fields.getTextInputValue('attendance_mentions').split('\n').filter(name => name.trim());
      const times = interaction.fields.getTextInputValue('attendance_times').split('\n').filter(time => time.trim());
      const type = interaction.fields.getTextInputValue('attendance_type').trim();

      if (!['出勤', '退勤'].includes(type)) {
        await interaction.reply({
          content: '❌ 種別は「出勤」または「退勤」を入力してください。',
          ephemeral: true
        });
        return;
      }

      // ユーザー情報を取得
      const users = userIds.split(',').map(id => interaction.client.users.cache.get(id)).filter(Boolean);
      
      // 出退勤データを作成
      const attendanceData = [];
      for (let i = 0; i < Math.max(users.length, times.length); i++) {
        const user = users[i];
        const mention = mentions[i] || (user ? `<@${user.id}>` : '名前未設定');
        const time = times[i] || '時間未設定';
        
        attendanceData.push({
          name: mention,
          time: time,
          type: type,
          userId: user ? user.id : null
        });
      }

      // GCSに保存
      const guildId = interaction.guild.id;
      const success = await saveAttendanceData(guildId, '黒服', storeName, attendanceData);

      if (!success) {
        await interaction.reply({
          content: '❌ データの保存に失敗しました。',
          ephemeral: true
        });
        return;
      }

      await interaction.reply({
        content: `✅ ${storeName}の黒服${type}を登録しました。\n登録人数: ${attendanceData.length}人`,
        ephemeral: true
      });

    } catch (error) {
      console.error('黒服ユーザー出退勤モーダル処理エラー:', error);
      await interaction.reply({
        content: '❌ 登録処理中にエラーが発生しました。',
        ephemeral: true
      });
    }
  },

  // 手動キャスト出退勤モーダル送信処理
  async handleCastManualModal(interaction, storeName) {
    try {
      const names = interaction.fields.getTextInputValue('attendance_names').split('\n').filter(name => name.trim());
      const times = interaction.fields.getTextInputValue('attendance_times').split('\n').filter(time => time.trim());
      const type = interaction.fields.getTextInputValue('attendance_type').trim();

      if (!['出勤', '退勤'].includes(type)) {
        await interaction.reply({
          content: '❌ 種別は「出勤」または「退勤」を入力してください。',
          ephemeral: true
        });
        return;
      }

      // 出退勤データを作成
      const attendanceData = [];
      for (let i = 0; i < Math.max(names.length, times.length); i++) {
        attendanceData.push({
          name: names[i] || '名前未設定',
          time: times[i] || '時間未設定',
          type: type
        });
      }

      // GCSに保存
      const guildId = interaction.guild.id;
      const success = await saveAttendanceData(guildId, 'キャスト', storeName, attendanceData);

      if (!success) {
        await interaction.reply({
          content: '❌ データの保存に失敗しました。',
          ephemeral: true
        });
        return;
      }

      await interaction.reply({
        content: `✅ ${storeName}のキャスト${type}を手動登録しました。\n登録人数: ${attendanceData.length}人`,
        ephemeral: true
      });

    } catch (error) {
      console.error('手動キャスト出退勤モーダル処理エラー:', error);
      await interaction.reply({
        content: '❌ 登録処理中にエラーが発生しました。',
        ephemeral: true
      });
    }
  },

  // 手動黒服出退勤モーダル送信処理
  async handleStaffManualModal(interaction, storeName) {
    try {
      const names = interaction.fields.getTextInputValue('attendance_names').split('\n').filter(name => name.trim());
      const times = interaction.fields.getTextInputValue('attendance_times').split('\n').filter(time => time.trim());
      const type = interaction.fields.getTextInputValue('attendance_type').trim();

      if (!['出勤', '退勤'].includes(type)) {
        await interaction.reply({
          content: '❌ 種別は「出勤」または「退勤」を入力してください。',
          ephemeral: true
        });
        return;
      }

      // 出退勤データを作成
      const attendanceData = [];
      for (let i = 0; i < Math.max(names.length, times.length); i++) {
        attendanceData.push({
          name: names[i] || '名前未設定',
          time: times[i] || '時間未設定',
          type: type
        });
      }

      // GCSに保存
      const guildId = interaction.guild.id;
      const success = await saveAttendanceData(guildId, '黒服', storeName, attendanceData);

      if (!success) {
        await interaction.reply({
          content: '❌ データの保存に失敗しました。',
          ephemeral: true
        });
        return;
      }

      await interaction.reply({
        content: `✅ ${storeName}の黒服${type}を手動登録しました。\n登録人数: ${attendanceData.length}人`,
        ephemeral: true
      });

    } catch (error) {
      console.error('手動黒服出退勤モーダル処理エラー:', error);
      await interaction.reply({
        content: '❌ 登録処理中にエラーが発生しました。',
        ephemeral: true
      });
    }
  },

  // === SVML設定からの出退勤設定ボタン処理 ===
  async execute(interaction) {
    const { customId } = interaction;
    
    if (customId === 'syuttaikin_config_button') {
      await interaction.deferReply({ ephemeral: true });
      
      try {
        const embed = new EmbedBuilder()
          .setTitle('⏰ 出退勤システム設定')
          .setDescription('**出退勤システムの管理機能**\n\n' +
            '👥 キャスト出退勤パネル設置\n' +
            '🕴️ 黒服出退勤パネル設置\n' +
            '📊 出退勤データ管理\n' +
            '📄 CSV出力機能')
          .setColor(0x00ff7f);

        const buttons = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('syuttaikin_panel_cast').setLabel('👥 キャスト設置').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('syuttaikin_panel_staff').setLabel('🕴️ 黒服設置').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('syuttaikin_data_manage').setLabel('📊 データ管理').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('syuttaikin_csv_export').setLabel('📄 CSV出力').setStyle(ButtonStyle.Success)
        );

        await interaction.editReply({
          embeds: [embed],
          components: [buttons]
        });
        
        return true;
        
      } catch (error) {
        console.error('出退勤設定パネル表示エラー:', error);
        await interaction.editReply({
          content: '❌ 出退勤設定パネルの表示に失敗しました。'
        });
        return true;
      }
    }
    
    return false;
  }
};
