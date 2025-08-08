# GitHub Actions による Discord コマンド自動デプロイ

このドキュメントは、GitHub Actionsを使用してDiscordコマンドを自動的にデプロイする設定と使用方法について説明します。

## 🚀 概要

- **自動デプロイ**: コードプッシュ時にコマンドを自動登録
- **段階的デプロイ**: PR時は開発サーバー、main ブランチは本番グローバル
- **手動実行**: 必要に応じて手動でデプロイ実行
- **エラーハンドリング**: 詳細なエラーログとCI/CD対応

## 📋 必要な設定

### 1. GitHub Secrets の設定

リポジトリの Settings > Secrets and variables > Actions で以下を設定：

```
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_application_id
GUILD_ID=your_development_guild_id  # 開発サーバーID
```

### 2. ワークフロー設定ファイル

- ファイル: `.github/workflows/deploy-commands.yml`
- 自動的に以下のタイミングで実行：
  - `main`, `develop` ブランチへのプッシュ
  - `main` ブランチへのプルリクエスト
  - 手動実行（workflow_dispatch）

## 🔄 自動実行フロー

### PR作成時（開発環境）
1. **コマンド構文検証** - `--dry-run` でエラーチェック
2. **開発サーバーデプロイ** - テスト用ギルドに限定登録
3. **結果コメント** - PR に自動でデプロイ結果を投稿

### main ブランチマージ時（本番環境）
1. **コマンド構文検証** - 最終チェック実行
2. **グローバルデプロイ** - 全Discordサーバーに登録
3. **デプロイ完了通知** - ログで成功を確認

## 🎛️ 手動実行

GitHub の Actions タブから手動実行可能：

### 実行方法
1. GitHub リポジトリの **Actions** タブを開く
2. **Deploy Discord Commands** ワークフローを選択
3. **Run workflow** をクリック
4. 以下のオプションを選択：
   - **Deploy Target**: `global`, `guild`, `both`
   - **Environment**: `production`, `staging`, `development`

### オプション詳細
- `global`: グローバルコマンドのみ登録
- `guild`: 開発サーバーのみ登録
- `both`: グローバル + 開発サーバー両方登録

## 🔧 ローカル実行

### 基本コマンド
```bash
# ドライラン（構文チェックのみ）
node events/devcmd.js --dry-run

# グローバル登録
node events/devcmd.js --global

# 開発サーバー登録
node events/devcmd.js --guild

# 詳細ログ付き実行
node events/devcmd.js --verbose

# コマンドクリア
node events/devcmd.js --clear
```

### 環境変数設定
```bash
# .env ファイルで設定
DISCORD_TOKEN=your_token
CLIENT_ID=your_client_id
GUILD_ID=your_guild_id
NODE_ENV=development
```

## 🔍 トラブルシューティング

### よくあるエラー

#### 1. GitHub Secrets 未設定
```
❌ 必須環境変数が未設定です: DISCORD_TOKEN
```
**解決方法**: GitHub Secrets で環境変数を設定

#### 2. Discord API 権限エラー
```
Discord API Error: Missing Permissions (権限不足)
```
**解決方法**: Bot権限の確認・再設定

#### 3. レート制限エラー
```
Discord API Error: Rate Limited (レート制限)
```
**解決方法**: しばらく待ってから再実行

#### 4. コマンド構文エラー
```
❌ コマンド名重複: /example (bot1 vs bot2)
```
**解決方法**: コマンド名の重複を解消

### デバッグ用コマンド

```bash
# 詳細ログでデバッグ
node events/devcmd.js --dry-run --verbose

# CI環境シミュレーション
GITHUB_ACTIONS=true node events/devcmd.js --global

# タイムアウトテスト
node events/devcmd.js --global --verbose
```

## 📊 CI/CD 統合

### 機能
- **自動構文チェック** - コマンド登録前の検証
- **段階的デプロイ** - 開発→本番の安全なフロー
- **エラー処理** - CI環境での適切な終了処理
- **ログ出力** - デプロイ状況の詳細記録

### GitHub Actions 環境での特別処理
- タイムアウト時間の延長（10分）
- エラー時の適切な終了コード
- CI専用のログ出力
- ネットワーク問題への対応

## ⚙️ カスタマイズ

### タイムアウト設定変更
```javascript
// events/devcmd.js 内
const TIMEOUT_MS = isCIEnvironment ? 15 * 60 * 1000 : 5 * 60 * 1000;
```

### デプロイ対象の追加
```yaml
# .github/workflows/deploy-commands.yml 内
paths:
  - '*_bot/**'
  - 'events/devcmd.js'
  - 'new_feature/**'  # 追加
```

### 通知設定の追加
- Slack通知
- Discord Webhook
- メール通知

## 🔒 セキュリティ

### ベストプラクティス
1. **Secrets の適切な管理** - トークンをコードに含めない
2. **権限の最小化** - 必要最小限のBot権限
3. **ログの注意** - 機密情報をログに出力しない
4. **アクセス制御** - ワークフロー実行権限の管理

### 推奨設定
- Repository secrets の使用
- Environment protection rules の設定
- Branch protection の有効化
- Required reviews の設定

---

## 📝 まとめ

このGitHub Actions設定により、Discordコマンドのデプロイが自動化され、開発効率と信頼性が大幅に向上します。プルリクエストベースの安全なデプロイフローにより、本番環境でのエラーリスクを最小限に抑えることができます。
