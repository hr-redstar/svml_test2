// keihi_bot/components/index.js

// ボタンコンポーネント
const { 
  createKeihiConfigButtons, 
  createKeihiConfigButtons2, 
  createKeihiCsvButtons, 
  createKeihiCsvButtons2, 
  createKeihiHelpButtons, 
  createKeihiHelpButtons2, 
  createKeihiHistoryButtons, 
  createKeihiHistoryButtons2 
} = require('./buttons/keihiButtons');

// Embedコンポーネント
const { 
  createKeihiConfigEmbed, 
  createKeihiCsvEmbed, 
  createKeihiHelpEmbed, 
  createKeihiHistoryEmbed 
} = require('./embeds/keihiEmbeds');

module.exports = {
  // ボタン
  createKeihiConfigButtons,
  createKeihiConfigButtons2,
  createKeihiCsvButtons,
  createKeihiCsvButtons2,
  createKeihiHelpButtons,
  createKeihiHelpButtons2,
  createKeihiHistoryButtons,
  createKeihiHistoryButtons2,
  
  // Embed
  createKeihiConfigEmbed,
  createKeihiCsvEmbed,
  createKeihiHelpEmbed,
  createKeihiHistoryEmbed
};
