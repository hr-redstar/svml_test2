let DateTime;
try {
  DateTime = require('luxon').DateTime;
} catch (error) {
  console.warn('⚠️ luxonライブラリが見つかりません。代替の時間処理を使用します。');
  DateTime = null;
}

/**
 * 安全な時間フォーマット関数
 * @param {string} isoTimestamp 
 * @returns {string} フォーマットされた時間
 */
function formatTime(isoTimestamp) {
  try {
    if (DateTime) {
      return DateTime.fromISO(isoTimestamp).setZone('Asia/Tokyo').toFormat('HH:mm');
    } else {
      // luxonが利用できない場合の代替処理
      const date = new Date(isoTimestamp);
      return date.toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Asia/Tokyo'
      });
    }
  } catch (error) {
    console.warn('⚠️ 時間フォーマットエラー:', error);
    return 'N/A';
  }
}

module.exports = {
  formatTime
};
