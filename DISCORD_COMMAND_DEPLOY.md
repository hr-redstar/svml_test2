# Discord コマンド自動デプロイ設定ガイド

## 概要

このガイドでは、GitHub ActionsとCloud Run環境でのDiscordスラッシュコマンドの自動デプロイ設定について説明します。

## 🚀 GitHub Actions設定

### 必要なSecrets

GitHub リポジトリの Settings > Secrets > Actions で以下を設定してください：

```
DISCORD_TOKEN       - Discord Bot Token
CLIENT_ID          - Discord Application Client ID  
GUILD_ID           - Discord Guild ID (開発サーバー)
GCP_SA_KEY         - Google Cloud Service Account Key
GCS_BUCKET_NAME    - Google Cloud Storage Bucket Name
```

### 自動デプロイのトリガー

1. **PR作成時**: ギルド（開発サーバー）にコマンドをデプロイ
2. **mainブランチプッシュ時**: グローバルにコマンドをデプロイ
3. **手動実行**: 指定したタイプ（global/guild/both）でデプロイ

## ☁️ Cloud Run設定

### 環境変数

Cloud Runサービスで以下の環境変数を設定：

```bash
# 必須設定
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_client_id
NODE_ENV=production

# コマンド自動デプロイ制御
AUTO_DEPLOY_COMMANDS=true    # Cloud Run起動時に自動デプロイ
GUILD_ID=your_guild_id       # 開発ギルドID（オプション）

# 無効化設定（必要に応じて）
SKIP_AUTO_DEPLOY=true        # 自動デプロイを完全に無効化
```

### デプロイ設定パターン

#### 1. 本番環境（推奨）
```bash
NODE_ENV=production
AUTO_DEPLOY_COMMANDS=true
# → Cloud Run起動時にグローバルコマンドを自動デプロイ
```

#### 2. 開発環境
```bash
NODE_ENV=development
AUTO_DEPLOY_COMMANDS=true
GUILD_ID=your_guild_id
# → Cloud Run起動時にギルドコマンドを自動デプロイ
```

#### 3. 手動デプロイのみ
```bash
SKIP_AUTO_DEPLOY=true
# → 自動デプロイを無効化（手動実行のみ）
```

## 🔄 デプロイフロー

### GitHub Actions経由

```
コード変更 → GitHub Push → Actions実行 → Discord コマンドデプロイ → Cloud Run デプロイ
```

### Cloud Run起動時

```
Cloud Run 起動 → Bot 初期化 → コマンド自動デプロイ （AUTO_DEPLOY_COMMANDS=true の場合）
```

## 📋 手動デプロイ

### ローカル環境

```bash
# 全体デプロイ（グローバル + ギルド）
FORCE_DEPLOY=true node events/devcmd.js

# グローバルのみ
FORCE_DEPLOY=true node events/devcmd.js --global

# ギルドのみ  
FORCE_DEPLOY=true node events/devcmd.js --guild

# ドライラン（確認のみ）
node events/devcmd.js --dry-run
```

### Cloud Run環境

```bash
# Cloud Run内で手動実行
FORCE_DEPLOY=true node events/devcmd.js --global
```

## 🛠 トラブルシューティング

### よくある問題と解決方法

#### 1. "必須環境変数が未設定"エラー
```bash
# 解決方法: 環境変数を確認・設定
echo $DISCORD_TOKEN
echo $CLIENT_ID
```

#### 2. "Cloud Run環境を検出 - コマンドデプロイをスキップ"
```bash
# 解決方法: 自動デプロイを有効化
export AUTO_DEPLOY_COMMANDS=true
# または強制実行
export FORCE_DEPLOY=true
```

#### 3. GitHub Actions でのデプロイ失敗
- GitHub Secrets の設定を確認
- ワークフロー権限を確認
- Discord APIの状態を確認

#### 4. タイムアウトエラー
- ネットワーク接続を確認
- Discord APIの状態を確認
- CI環境では10分のタイムアウトを使用

## 📊 ログの確認

### デプロイ成功時のログ例

```
[DevDeploy] ✅ 環境変数チェック完了
[DevDeploy] 📦 config_bot: 2個のコマンドを発見
[DevDeploy] 📊 総コマンド数: 13個
[DevDeploy] 🚀 13個のコマンドをグローバルに登録中...
[DevDeploy] ✅ 13個のコマンドをグローバルに登録完了
[DevDeploy] 🎉 全ての登録処理が完了しました
```

### Bot起動時のログ例

```
🚀 Discordコマンドの自動デプロイを開始...
✅ Discordコマンドデプロイ完了: 13個のコマンド
📋 現在登録中のコマンド数: 13個
```

## 🔒 セキュリティ

### 注意事項

1. **Discord Token** は絶対に公開しない
2. **GitHub Secrets** を適切に設定
3. **環境変数** の管理を厳重に行う
4. **本番環境** でのテストは慎重に実行

### ベストプラクティス

1. 開発環境ではギルドコマンドを使用
2. 本番環境ではグローバルコマンドを使用  
3. CI/CDパイプラインでの自動テスト
4. デプロイ前のドライランテスト

## 📞 サポート

問題が発生した場合：

1. ログを確認
2. 環境変数を確認
3. Discord APIの状態を確認
4. GitHub Actions/Cloud Runの状態を確認

詳細なトラブルシューティングについては、開発チームにお問い合わせください。
