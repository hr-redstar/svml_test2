// uriage_bot/components/index.js

// ボタンコンポーネント
const { 
  createUriageFormButtons, 
  createUriageConfigButtons, 
  createUriageConfigButtons2, 
  createUriageCsvButtons, 
  createUriageCsvButtons2 
} = require('./buttons/uriageButtons');

// Embedコンポーネント
const { 
  createUriageFormEmbed, 
  createUriageConfigEmbed, 
  createUriageCsvEmbed 
} = require('./embeds/uriageEmbeds');

module.exports = {
  // ボタン
  createUriageFormButtons,
  createUriageConfigButtons,
  createUriageConfigButtons2,
  createUriageCsvButtons,
  createUriageCsvButtons2,
  
  // Embed
  createUriageFormEmbed,
  createUriageConfigEmbed,
  createUriageCsvEmbed
};
