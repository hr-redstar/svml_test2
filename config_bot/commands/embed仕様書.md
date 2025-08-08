# SVML Embedメッセージ システム仕様書

**最終更新**: 2025年8月6日  
**バージョン**: 2.0  

## 概要
Discord Embedメッセージの作成・編集・管理を行うシステム。全てのEmbed機能（タイトル、説明文、フィールド、画像、フッターなど）に対応。

---

## 🎛️ メインコマンド

### `/svmlメッセージ`
- **権限**: 管理者のみ
- **表示**: 管理者のみに見える（ephemeral）
- **機能**: Embedの作成・編集パネルを表示

---

## 📊 メインパネル構成

### Embedビルダーパネル
**タイトル**: `📝 Embedビルダー`  
**説明**: 新規作成または既存のEmbed編集の選択

#### アクションボタン
1. **新規作成** (`embed_builder_new`)
2. **編集** (`embed_builder_edit`)

---

## 🎨 Embed要素設定機能

### 基本要素
1. **タイトル** - Embedのタイトル設定
2. **タイトルURL** - タイトルをクリック可能なリンクに
3. **説明文** - Embedの本文説明
4. **色設定** - Embedの左側ライン色

### 画像・メディア要素
5. **画像URL** - Embedメイン画像の設定
6. **サムネイル画像** - 右上小画像の設定
7. **作成者アイコン** - 作成者アイコン画像URL
8. **作成者名** - 作成者名の表示
9. **作成者URL** - 作成者名をクリック可能なリンクに

### フッター要素
10. **フッターテキスト** - Embed下部のフッター文字
11. **フッターアイコン** - フッター横の小アイコン画像URL
12. **タイムスタンプ** - 現在時刻または指定時刻の表示

### フィールド要素
13. **フィールド追加** - name/value/inlineのフィールド追加
14. **フィールド編集** - 既存フィールドの編集
15. **フィールド削除** - 不要フィールドの削除

---

## 🔧 Embed編集フロー

### 新規作成フロー
1. `/svmlメッセージ` 実行
2. **新規作成** ボタンクリック
3. Embed編集パネル表示
4. 各要素ボタンで設定
5. **プレビュー** で確認
6. **送信チャンネル選択**
7. **送信実行**

### 編集フロー
1. `/svmlメッセージ` 実行
2. **編集** ボタンクリック
3. **チャンネル選択** → チャンネル一覧表示
4. **メッセージ選択** → タイトル+メッセージID一覧
5. 選択されたEmbedの編集パネル表示
6. 各要素編集
7. **更新実行**

---

## 🏗️ 技術仕様

### ボタンID命名規則
```javascript
// メイン操作
embed_builder_new          // 新規作成
embed_builder_edit         // 編集

// 要素設定
embed_set_title            // タイトル設定
embed_set_title_url        // タイトルURL設定
embed_set_description      // 説明文設定
embed_set_color            // 色設定
embed_set_image            // 画像URL設定
embed_set_thumbnail        // サムネイル設定
embed_set_author_icon      // 作成者アイコン設定
embed_set_author_name      // 作成者名設定
embed_set_author_url       // 作成者URL設定
embed_set_footer_text      // フッターテキスト設定
embed_set_footer_icon      // フッターアイコン設定
embed_set_timestamp        // タイムスタンプ設定

// フィールド操作
embed_add_field            // フィールド追加
embed_edit_field           // フィールド編集
embed_delete_field         // フィールド削除

// 実行操作
embed_preview              // プレビュー表示
embed_send                 // 送信実行
embed_update               // 更新実行
embed_cancel               // キャンセル
```

### データ管理
```javascript
// セッション管理
global.embedBuilderSessions = new Map();

// データ構造
{
  userId: 'user_id',
  guildId: 'guild_id',
  embedData: {
    title: 'タイトル',
    titleUrl: 'https://example.com',
    description: '説明文',
    color: 0x3498db,
    image: 'https://example.com/image.png',
    thumbnail: 'https://example.com/thumb.png',
    author: {
      name: '作成者名',
      iconURL: 'https://example.com/icon.png',
      url: 'https://example.com'
    },
    footer: {
      text: 'フッターテキスト',
      iconURL: 'https://example.com/footer_icon.png'
    },
    timestamp: true,
    fields: [
      {
        name: 'フィールド名',
        value: 'フィールド値',
        inline: false
      }
    ]
  },
  targetChannelId: 'channel_id',
  targetMessageId: 'message_id' // 編集時のみ
}
```

---

## 📝 モーダル仕様

### タイトル設定モーダル
```javascript
{
  title: 'Embedタイトル設定',
  components: [
    {
      type: 'TextInput',
      customId: 'embed_title_input',
      label: 'タイトル',
      style: 'Short',
      maxLength: 256,
      required: false
    },
    {
      type: 'TextInput', 
      customId: 'embed_title_url_input',
      label: 'タイトルURL（任意）',
      style: 'Short',
      placeholder: 'https://example.com',
      required: false
    }
  ]
}
```

### 説明文設定モーダル
```javascript
{
  title: 'Embed説明文設定',
  components: [
    {
      type: 'TextInput',
      customId: 'embed_description_input',
      label: '説明文',
      style: 'Paragraph',
      maxLength: 4000,
      required: false
    }
  ]
}
```

### 画像設定モーダル
```javascript
{
  title: 'Embed画像設定',
  components: [
    {
      type: 'TextInput',
      customId: 'embed_image_input',
      label: 'メイン画像URL（任意）',
      style: 'Short',
      placeholder: 'https://example.com/image.png',
      required: false
    },
    {
      type: 'TextInput',
      customId: 'embed_thumbnail_input', 
      label: 'サムネイル画像URL（任意）',
      style: 'Short',
      placeholder: 'https://example.com/thumbnail.png',
      required: false
    }
  ]
}
```

### 作成者設定モーダル
```javascript
{
  title: 'Embed作成者設定',
  components: [
    {
      type: 'TextInput',
      customId: 'embed_author_name_input',
      label: '作成者名',
      style: 'Short',
      maxLength: 256,
      required: false
    },
    {
      type: 'TextInput',
      customId: 'embed_author_icon_input',
      label: '作成者アイコンURL（任意）',
      style: 'Short',
      placeholder: 'https://example.com/icon.png',
      required: false
    },
    {
      type: 'TextInput',
      customId: 'embed_author_url_input',
      label: '作成者URL（任意）',
      style: 'Short',
      placeholder: 'https://example.com',
      required: false
    }
  ]
}
```

### フッター設定モーダル
```javascript
{
  title: 'Embedフッター設定',
  components: [
    {
      type: 'TextInput',
      customId: 'embed_footer_text_input',
      label: 'フッターテキスト',
      style: 'Short',
      maxLength: 2048,
      required: false
    },
    {
      type: 'TextInput',
      customId: 'embed_footer_icon_input',
      label: 'フッターアイコンURL（任意）',
      style: 'Short', 
      placeholder: 'https://example.com/footer_icon.png',
      required: false
    }
  ]
}
```

### フィールド追加モーダル
```javascript
{
  title: 'Embedフィールド追加',
  components: [
    {
      type: 'TextInput',
      customId: 'embed_field_name_input',
      label: 'フィールド名',
      style: 'Short',
      maxLength: 256,
      required: true
    },
    {
      type: 'TextInput',
      customId: 'embed_field_value_input',
      label: 'フィールド値',
      style: 'Paragraph',
      maxLength: 1024,
      required: true
    },
    {
      type: 'TextInput',
      customId: 'embed_field_inline_input',
      label: 'インライン表示（true/false）',
      style: 'Short',
      value: 'false',
      required: true
    }
  ]
}
```

---

## 🎨 UI/UX設計

### ボタンレイアウト
```
[基本設定]
[📝 タイトル] [🔗 タイトルURL] [📄 説明文] [🎨 色設定]

[画像・メディア]
[🖼️ 画像] [🖼️ サムネイル] [👤 作成者] 

[フッター・時刻]
[📄 フッター] [⏰ タイムスタンプ]

[フィールド管理]
[➕ フィールド追加] [✏️ フィールド編集] [🗑️ フィールド削除]

[実行操作]
[👁️ プレビュー] [📤 送信] [🔄 更新] [❌ キャンセル]
```

### プレビューEmbed仕様
- 実際の送信プレビューを表示
- 文字数制限チェック
- 画像URL有効性チェック
- フィールド数制限チェック（最大25個）

---

## 🔧 エラーハンドリング

### バリデーション
1. **文字数制限**
   - タイトル: 256文字
   - 説明文: 4000文字
   - フィールド名: 256文字
   - フィールド値: 1024文字
   - フッター: 2048文字

2. **URL検証**
   - 画像URL形式チェック
   - http/https プロトコル必須

3. **フィールド制限**
   - 最大25個まで
   - 空のname/valueは無効

### セッション管理
- 30分間のタイムアウト
- ユーザーごとの独立セッション
- 予期しない終了時のクリーンアップ

---

## 📋 実装チェックリスト

### 基本機能
- [ ] メインパネル表示
- [ ] 新規作成フロー
- [ ] 編集フロー（チャンネル→メッセージ選択）

### Embed要素設定
- [ ] タイトル・タイトルURL設定
- [ ] 説明文設定
- [ ] 色設定（カラーピッカー対応）
- [ ] メイン画像・サムネイル設定
- [ ] 作成者情報設定（名前・アイコン・URL）
- [ ] フッター設定（テキスト・アイコン）
- [ ] タイムスタンプ設定
- [ ] フィールド管理（追加・編集・削除）

### 実行機能
- [ ] プレビュー表示
- [ ] チャンネル選択
- [ ] 送信実行
- [ ] 更新実行

### データ管理
- [ ] セッション管理
- [ ] Embedデータ保存
- [ ] 編集対象メッセージ管理

---

## 🔄 バージョン履歴

### v2.0 (2025-08-06)
- 画像・アイコン・フッター機能追加
- 作成者情報設定機能
- タイムスタンプ機能
- フィールド管理機能拡張
- 詳細仕様書作成

### v1.0 (2025-08-05)
- 基本的なEmbed作成・編集機能
- タイトル・説明文設定
- チャンネル選択機能