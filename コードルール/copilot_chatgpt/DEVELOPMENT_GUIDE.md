# STAR管理Bot 総合開発ドキュメント

このドキュメントは、STAR管理Botの開発と保守に関する技術情報を集約したナレッジベースです。
新しい開発者は、まずこのドキュメント全体に目を通してください。

---

## 目次

1.  **[アーキテクチャと設計思想](#1-アーキテクチャと設計思想)**
    -   [中核となる設計原則](#11-中核となる設計原則)
    -   [ディレクトリとファイルの構造](#12-ディレクトリとファイルの構造)
    -   [インタラクション処理の仕組み](#13-インタラクション処理の仕組み)
    -   [その他の設計パターン](#14-その他の設計パターン)
2.  **[開発者ガイド](#2-開発者ガイド)**
    -   [インタラクション応答の基本原則](#21-インタラクション応答の基本原則)
    -   [スラッシュコマンドの作成](#22-スラッシュコマンドの作成)
    -   [コンポーネントハンドラの作成](#23-コンポーネントハンドラの作成)
    -   [エラーハンドリング](#24-エラーハンドリング)
3.  **[機能別仕様書](#3-機能別仕様書)**
    -   [ChatGPT連携機能](#31-chatgpt連携機能)
4.  **[変更履歴](#4-変更履歴)**

---

## 1. アーキテクチャと設計思想

### 1.1. 中核となる設計原則

-   **関心の分離 (SoC)**: 各モジュールは単一の責任を持ちます。
    -   `utils/openai.js`: OpenAI APIとの通信
    -   `utils/configManager.js`: 設定の永続化と管理
    -   `utils/unifiedInteractionHandler.js`: 全インタラクションのルーティング
    -   `utils/idManager.js`: `customId`の生成と解析
-   **DRY (Don't Repeat Yourself)**: `errorHelper.js`や`embedHelper.js`などの共通ヘルパーに処理を集約し、コードの重複を排除します。

### 1.2. ディレクトリとファイルの構造

```
star_kanri_bot/
├── commands/                # スラッシュコマンド定義 (各コマンド1ファイル)
├── events/                  # Discordクライアントのイベントハンドラ (ready, interactionCreateなど)
├── utils/                   # Botのコアロジックとユーティリティ
│   ├── <feature_name>/      # 機能ごとのディレクトリ (例: totusuna_setti, star_config)
│   │   ├── buttons/         # ボタンハンドラを格納するディレクトリ
│   │   ├── modals/          # モーダルハンドラを格納
│   │   └── selects/         # セレクトメニューハンドラを格納
│   ├── permissions/         # 権限チェック関連
│   ├── handlerLoader.js     # ディレクトリからハンドラを動的に読み込む汎用ローダー
│   └── unifiedInteractionHandler.js # 全てのインタラクションを捌く中心的なハブ
└── data/                    # ギルドごとの設定ファイル(JSON)やログ(CSV)を保存
```

-   **機能単位の分割**: `utils`ディレクトリ配下は、`totusuna_setti`や`kpi_setti`のように機能単位でディレクトリを分割します。
-   **役割ごとの分割**: 各機能ディレクトリ内は、`buttons`, `modals`, `selects`のようにインタラクションの種類ごとにサブディレクトリを設けます。

### 1.3. インタラクション処理の仕組み

本Botのインタラクション処理は、`unifiedInteractionHandler`を中心とした堅牢なアーキテクチャに基づいています。

1.  **`index.js` (エントリポイント)**: 全ての`interactionCreate`イベントを受信します。
    -   スラッシュコマンド (`isChatInputCommand`) の場合、`commands`コレクションから対応するコマンドを実行します。
    -   それ以外（ボタン、モーダル、セレクトメニュー）の場合、すべての処理を`unifiedInteractionHandler`に委譲します。

2.  **`utils/unifiedInteractionHandler.js` (中央ハブ)**
    -   **`getCategoryFromCustomId`**: 受け取ったインタラクションの`customId`を解析し、それがどの機能カテゴリ（`totusuna_setti`, `star_config`等）に属するかを特定します。`prefixMapping`と`customIdMapping`を用いて、柔軟かつ正確なルーティングを実現します。
    -   **`resolveHandler`**: 特定したカテゴリとインタラクション種別（`buttons`, `modals`, `selects`）に基づいて、`handlerLoader.js`が生成した検索関数(`find`)を呼び出し、適切なハンドラファイルを見つけ出します。

3.  **`utils/handlerLoader.js` (動的ローダー)**
    -   指定されたディレクトリ（例: `./utils/totusuna_setti/buttons`）内のすべての`.js`ファイルを読み込みます。
    -   各ファイルからエクスポートされた`customId`をキーとしてハンドラをマップし、高速にハンドラを検索できる関数 (`find`) を生成・返却します。

この設計により、新しいボタンを追加する場合、開発者は対応するディレクトリにハンドラファイルを作成するだけでよく、ルーティングロジックを意識する必要がありません。

### 1.4. その他の設計パターン

-   **軽量コマンドパターン**: UI表示のみなど高速に完了する処理は、`deferReply()`を使わず`reply()`で即時応答します。
-   **複数ステップ処理**: ボタン→モーダル→チャンネル選択のような複数ステップにまたがる処理では、`utils/tempStore.js`を使用してステップ間のデータを安全に受け渡します。
-   **設定ファイル保護**: `ConfigManager.js`に簡易的なロック機構を導入し、設定ファイルへの同時書き込みによるデータ破損を防ぎます。

---

## 2. 開発者ガイド

### 2.1. インタラクション応答の基本原則

Discord APIのエラーを防ぐため、以下のルールを**必ず遵守**してください。

1.  **応答は1回だけ**: 1つのインタラクションに対し、`reply()`, `deferReply()`, `showModal()`などの応答メソッドは**1度しか呼び出せません**。
2.  **3秒ルールと`deferReply`**: 処理に3秒以上かかる可能性がある場合（API呼び出し、ファイルI/Oなど）、必ず処理の冒頭で`await interaction.deferReply()`を呼び出します。処理完了後は`interaction.editReply()`で応答を更新します。
3.  **`showModal()`は応答**: `interaction.showModal()`はそれ自体が応答です。**`deferReply()`や`reply()`とは絶対に併用できません。**
4.  **`ephemeral`の代替**: `ephemeral: true`は非推奨です。代わりに`flags: MessageFlags.Ephemeral` (`1 << 6`)を使用します。

### 2.2. スラッシュコマンドの作成

`commands`ディレクトリにファイルを作成します。`data`は`SlashCommandBuilder`のインスタンスである必要があります。

```javascript
// commands/my_command.js
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('コマンド名')
    .setDescription('コマンドの説明'),
  async execute(interaction) {
    await interaction.reply({ content: 'メッセージ', flags: MessageFlags.Ephemeral });
  }
};
```

### 2.3. コンポーネントハンドラの作成

`utils/<feature_name>/<component_type>/`ディレクトリにファイルを作成します。ファイルは`customId`と`handle`関数をエクスポートします。

**ボタンハンドラ:**
```javascript
// utils/totusuna_setti/buttons/install.js
module.exports = {
  customId: 'totusuna_install_button',
  async handle(interaction) {
    // ボタンが押された時の処理
    await interaction.reply({ content: '設置ボタンが押されました', flags: MessageFlags.Ephemeral });
  }
};
```

**モーダルハンドラ:**
```javascript
// utils/totusuna_setti/modals/install.js
module.exports = {
  customId: 'totusuna_install_modal',
  async handle(interaction) {
    // モーダルが送信された時の処理
    const inputValue = interaction.fields.getTextInputValue('textInputId');
    await interaction.reply({ content: `入力値: ${inputValue}`, flags: MessageFlags.Ephemeral });
  }
};
```

**セレクトメニューハンドラ:**
```javascript
// utils/star_config/selects/admin_role_select.js
module.exports = {
  customId: 'admin_role_select',
  async handle(interaction) {
    // 項目が選択された時の処理
    const selectedValues = interaction.values;
    await interaction.reply({ content: `選択: ${selectedValues.join(', ')}`, flags: MessageFlags.Ephemeral });
  }
};
```

### 2.4. エラーハンドリング

失敗する可能性のある処理は必ず`try...catch`で囲み、`logAndReplyError`ヘルパーを使用します。これにより、エラーログの記録とユーザーへの安全な応答が統一されます。

```javascript
const { logAndReplyError } = require('../../errorHelper');

async function handle(interaction) {
  try {
    // ... メイン処理 ...
  } catch (error) {
    await logAndReplyError(
      interaction,
      error, // エラーオブジェクトをそのまま渡す
      '❌ 処理中に予期せぬエラーが発生しました。' // ユーザー向けの簡潔なメッセージ
    );
  }
}
```

---

## 3. 機能別仕様書

### 3.1. ChatGPT連携機能

-   **概要**: OpenAI APIを利用してChatGPTとの対話機能を提供します。
-   **設定管理**: `utils/configManager.js`がギルドごとの設定（APIキー、モデル等）を`data/{guildId}/{guildId}.json`に保存します。
-   **API連携**: `utils/openai.js`がAPI通信を担当します。`safeOpenAICall`ラッパーでAPIキー無効や利用上限超過などのエラーを捕捉し、ユーザーフレンドリーなメッセージを返します。
-   **UI処理**: `utils/star_chat_gpt_setti/`と`utils/star_chat_gpt_config/`配下のハンドラが設定用のUIを提供します。

---

## 4. 変更履歴

-   **2025-07-16: インタラクション処理の全面改修**
    -   **`handleButton is not defined`エラーの解決**: `index.js`の処理を`unifiedInteractionHandler`に一本化。
    -   **ハンドラ解決ロジックの修正**: `unifiedInteractionHandler`が誤った関数を呼び出していた不具合を修正。
    -   **`customId`ルーティングの堅牢化**: Prefixの長い順にマッチングするロジックを導入し、ID解決の精度を向上。
-   **2025-07-14: Discord.js v14仕様への追従**
    -   `ephemeral: true`を非推奨の`flags: MessageFlags.Ephemeral`に全ファイルで統一。
    -   二重応答エラーを避けるため、インタラクション応答の原則をドキュメント化。
-   **`ファイル構造_命名.md`の作成と適用**: プロジェクト全体のファイル構造、命名規則を明文化し、既存機能もそれに合わせてリファクタリング。


*(このドキュメントは、copilot_chatgptディレクトリ内の複数のマークダウンファイルを統合・再編したものです。)*