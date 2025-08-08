// syuttaikin_bot/components/index.js - 出退勤システムコンポーネント統合エクスポート

const syuttaikinButtons = require('./buttons/syuttaikinButtons');
const syuttaikinSelects = require('./selects/syuttaikinSelects');
const userSelects = require('./selects/userSelects');
const attendanceModals = require('./modals/attendanceModals');
const userAttendanceModals = require('./modals/userAttendanceModals');
const syuttaikinEmbeds = require('./embeds/syuttaikinEmbeds');

module.exports = {
  // ボタンコンポーネント
  buttons: syuttaikinButtons,
  
  // セレクトメニューコンポーネント
  selects: syuttaikinSelects,
  
  // ユーザー選択コンポーネント
  userSelects: userSelects,
  
  // モーダルコンポーネント
  modals: attendanceModals,
  
  // ユーザー選択モーダルコンポーネント
  userModals: userAttendanceModals,
  
  // Embedコンポーネント
  embeds: syuttaikinEmbeds
};
