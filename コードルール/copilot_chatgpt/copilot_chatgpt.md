# ChatGPT (Copilot) 連携機能ドキュメント

このドキュメントでは、本Botに搭載されているChatGPT (OpenAI API) 連携機能に関する技術的な仕様や設定方法について解説します。

## 1. 概要

本機能は、OpenAI APIを利用してChatGPTとの対話機能を提供します。
ギルド（サーバー）ごとにAPIキーや利用するモデル、パラメータを個別に設定でき、安全かつ柔軟な運用が可能です。

## 2. 主な機能

- **チャット応答生成**: ユーザーからのプロンプトに対して、設定されたモデルを用いて応答を生成します。
- **API利用状況確認**: 当月のOpenAI API利用料金を取得し、コストを把握できます（管理者キーが必要）。

## 3. 設定管理

ChatGPT関連の設定は、各ギルドのデータファイル (`data/{guildId}/{guildId}.json`) 内に `chatgpt` オブジェクトとして保存されます。設定の読み書きは `utils/configManager.js` が一元管理しています。

### 設定項目

```json
{
  "chatgpt": {
    "apiKey": "sk-...",
    "model": "gpt-3.5-turbo",
    "maxTokens": 150,
    "temperature": 0.7
  }
}
```

- `apiKey`: ギルドで使用するOpenAI APIキー。
- `model`: 使用するモデルID (例: `gpt-4`, `gpt-3.5-turbo`)。
- `maxTokens`: 生成される応答の最大トークン数。
- `temperature`: 出力の多様性を制御するパラメータ (0.0 〜 2.0)。

### 関連モジュール

- **`utils/configManager.js`**: `getChatGPTConfig`, `updateChatGPTConfig` メソッドを提供し、設定の読み書きを安全に行います。
- **`utils/fileHelper.js`**: 物理的なJSONファイルの読み書きを担当します。

## 4. インタラクション処理 (UI)

ユーザーはDiscordのボタンやモーダルを通じてChatGPTの設定を行います。これらのインタラクションは、主に `unifiedInteractionHandler.js` によって処理されます。

- **カテゴリ**: `star_chat_gpt_setti`, `star_chat_gpt_config`
- **customId**: `idManager.js` によって `star_chat_gpt_{action}` や `chatgpt_config_modal` といった命名規則で管理されます。
- **ハンドラ**: 対応する処理は `utils/star_chat_gpt_setti/` や `utils/star_chat_gpt_config/` ディレクトリ内の各ファイルに記述されています（例: `buttons/`, `modals/`）。

## 5. API連携

OpenAI APIとの通信は `utils/openai.js` が担当します。

### `getChatCompletion(prompt, guildId, options)`

- **役割**: ChatGPTからの応答を取得する主要な関数。
- **処理フロー**:
    1. `configManager` を通じてギルドのChatGPT設定（APIキー、モデル等）を取得。
    2. APIキーが未設定の場合はエラーを返す。
    3. `openai` パッケージを使ってAPIリクエストを構築。
    4. `safeOpenAICall` ラッパーを介してAPIを呼び出し、エラーハンドリングを行う。

### `safeOpenAICall(apiCall, fallbackResponse)`

- **役割**: API呼び出しをラップし、一般的なエラー（APIキー無効、利用上限超過など）を捕捉して、ユーザーフレンドリーなメッセージを返します。

### `getOpenAIUsage(apiKey)` (`utils/openaiUsage.js`)

- **役割**: OpenAIの課金APIを叩き、当月の利用額を取得します。
- **注意**: この機能は組織の管理者権限を持つAPIキーでないと動作しない場合があります。

## 6. 環境変数

本機能を利用するには、Botの実行環境で以下の環境変数を設定することが推奨されます。

- **`OPENAI_API_KEY`**: `.env` ファイルや `ecosystem.config.js` で設定します。これはフォールバックやグローバルな設定として利用される可能性があります。
- `startupDiagnostics.js` は起動時にこの変数の存在をチェックし、未設定の場合は警告を出力します。

## 7. 関連ファイル一覧

- `utils/openai.js`: API呼び出しのコアロジック。
- `utils/openaiUsage.js`: API使用量取得機能。
- `utils/configManager.js`: 設定の永続化と管理。
- `utils/unifiedInteractionHandler.js`: インタラクションのルーティング。
- `utils/buttonsHandler.js`: (旧) ボタン処理。
- `utils/idManager.js`: `customId`の生成と解析。
- `utils/interactionHandler.js`: `chatgpt_` プレフィックスを持つインタラクションを予防的デファーの対象とする。
- `ecosystem.config.js`: 本番環境での環境変数設定。
- `utils/startupDiagnostics.js`: 起動時の環境チェック。
- `utils/star_chat_gpt_setti/`: ChatGPT設定UIのハンドラ群。
- `utils/star_chat_gpt_config/`: ChatGPT設定UIのハンドラ群。

## 8. 開発ガイドラインと設計思想

このセクションでは、本プロジェクトにおけるChatGPT関連機能の開発で遵守すべきコーディング規約や設計パターンについて解説します。

### 8.1. エラーハンドリングのベストプラクティス

安定した機能を提供するため、エラーハンドリングは一貫した方法で行われます。

#### 基本的なエラー処理フロー

時間のかかる処理や失敗する可能性のある処理は、必ず `try...catch` ブロックで囲みます。エラー発生時は `utils/errorHelper.js` の `logAndReplyError` を呼び出すのが標準的な作法です。

```javascript
// 例: ボタンハンドラ内でのエラー処理
const { logAndReplyError } = require('../../errorHelper');

async function handle(interaction) {
  try {
    // ... API呼び出しなどのメイン処理 ...
  } catch (error) {
    await logAndReplyError(
      interaction,
      error, // エラーオブジェクトをそのまま渡す（スタックトレースがログに残る）
      '❌ 処理中に予期せぬエラーが発生しました。' // ユーザー向けの簡潔なメッセージ
    );
  }
}
```

`logAndReplyError` は以下の責務を担います。
1.  **コンソールへのエラー出力**: 開発時の即時確認。
2.  **ログファイルへの追記**: サーバーでの永続的なエラー記録。
3.  **ユーザーへの安全な応答**: `safeReply` を使用し、二重応答エラー（`Interaction has already been replied to.`）を自動的に回避します。

#### API関連エラーの処理

OpenAI API呼び出しは `utils/openai.js` の `safeOpenAICall` でラップされています。これにより、以下のような典型的なAPIエラーは自動的に捕捉され、ユーザーフレンドリーなメッセージに変換されます。

- `invalid_api_key`: 「無効なAPIキーが設定されています。」
- `insufficient_quota`: 「APIの利用制限に達しました。」

新しいAPI呼び出しを実装する場合も、このラッパー関数を利用することが推奨されます。

#### インタラクション応答の原則とタイムアウト対策

Discordのインタラクションは、ユーザーのアクションから3秒以内に何らかの応答を返す必要があります。この「3秒ルール」と、応答の重複による `InteractionAlreadyReplied` エラーを避けるため、以下のパターンを遵守してください。

1.  **時間のかかる処理を行う場合（ファイルI/O、API呼び出しなど）**
    -   処理の最初に `await interaction.deferReply()` または `await safeDefer(interaction)` を呼び出します。
    -   これにより応答が「遅延」状態になり、3秒のタイムアウトを回避できます。
    -   処理完了後、`interaction.editReply()` を使って最終的な応答を返します。

2.  **モーダルを表示する場合（最重要）**
    -   `interaction.showModal()` は「即時応答」です。**`deferReply` とは絶対に併用できません。**
    -   モーダル表示前に `deferReply` を呼び出すと、`InteractionAlreadyReplied` エラーが **必ず** 発生します。
    -   モーダルを表示するハンドラでは、権限チェックなどの軽量な処理のみを行い、直接 `interaction.showModal()` を呼び出してください。

    **悪い例（エラー発生）:**
    ```javascript
    await interaction.deferReply();
    // ...その他の処理...
    await interaction.showModal(modal); // Error: InteractionAlreadyReplied
    ```

    **良い例:**
    ```javascript
    const { MessageFlagsBitField } = require('discord.js');

    const isAdmin = await checkAdmin(interaction);
    if (!isAdmin) {
      // deferしていないので、初回応答は.reply()
      // ephemeral: true の代わりに flags を使用
      return interaction.reply({ content: '権限がありません。', flags: MessageFlagsBitField.Flags.Ephemeral });
    }
    await interaction.showModal(modal); // 即時応答としてモーダルを表示
    ```

3.  **モーダル送信後の処理 (`ModalSubmitInteraction`)**
    -   ユーザーがモーダルを送信すると、新しいインタラクションが発生します。
    -   このハンドラ内では、ファイル書き込みなどの時間のかかる処理を行う可能性があるため、こちらは逆に `deferReply()` を実行することが推奨されます。

### 8.2. コーディング規約と設計パターン

コードの可読性と保守性を高めるため、以下の設計パターンに従ってください。

1.  **責務の分離 (SoC)**
    - **API通信**: `utils/openai.js`
    - **設定管理**: `utils/configManager.js`
    - **UI処理**: `utils/unifiedInteractionHandler.js` と `utils/star_chat_gpt_.../` 配下のハンドラ
    - **ID管理**: `utils/idManager.js`
    - 新しい機能を追加する際は、既存のモジュールの責務を尊重し、適切な場所にコードを配置してください。

2.  **設定へのアクセス**
    - ギルドごとのChatGPT設定の読み書きは、必ず `configManager` を経由します。直接JSONファイルを操作しないでください。
    - **取得**: `configManager.getChatGPTConfig(guildId)`
    - **更新**: `configManager.updateChatGPTConfig(guildId, newConfig)`

3.  **UIコンポーネントの追加**
    - ボタンやモーダルなどのUIを追加する場合、`utils/idManager.js` を使って `customId` を生成します。
    - 対応する処理は `utils/star_chat_gpt_.../` ディレクトリ内に、インタラクション種別ごと（`buttons`, `modals`）にファイルを分けて実装します。
    - `unifiedInteractionHandler.js` が `customId` のプレフィックスや命名規則に基づいて、自動的に適切なハンドラを呼び出します。