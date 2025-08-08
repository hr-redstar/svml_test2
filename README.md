# 📘 SVML事務Bot 運用手順書

## ✅ 概要

このリポジトリは、複数の機能を持つDiscord Bot「SVML事務Bot」のソースコードです。
本番環境はGoogle Cloud Run上でコンテナとして稼働し、データはGoogle Cloud Storage (GCS) に永続化されます。

---

## 🚀 1. 開発環境のセットアップ (ローカル)

ローカルマシンで開発やテストを行うための手順です。

```bash
# 1. このリポジトリをクローン
git clone https://github.com/hr-redstar/svml_zimu_bot-main.git
cd svml_zimu_bot-main

# 2. .env ファイルを作成して編集
# .env.sample をコピーして、必要な情報を入力します。
cp .env.sample .env
nano .env # またはお好きなエディタで編集

# 3. 必要なパッケージをインストール
npm install

# 4. Discordにスラッシュコマンドを登録
npm run deploy

# 5. Botを開発モードで起動
npm run dev
```

---

## 📦 2. 本番環境へのデプロイ (Google Cloud Run)

コードの変更を本番環境に反映させるには、新しいコンテナイメージをビルドし、Cloud Runにデプロイします。

1.  **コードの変更をGitにプッシュします。**
    ```bash
    git add .
    git commit -m "機能追加や修正内容"
    git push origin main
    ```

2.  **Google Cloud Build を使用してデプロイします。**
    - GitHubリポジトリと連携したCloud Buildトリガーを設定しておくと、`main`ブランチへのプッシュを検知して自動でビルドとデプロイが実行されます。
    - 手動でデプロイする場合は、ローカル環境に`gcloud` CLIをインストールし、以下のコマンドを実行します。
    ```bash
    # gcloud builds submit --tag gcr.io/[PROJECT-ID]/[IMAGE-NAME]
    # gcloud run deploy [SERVICE-NAME] --image gcr.io/[PROJECT-ID]/[IMAGE-NAME] --region [REGION]
    ```

---

## 💾 3. データ管理

Botが扱うデータ（売上、経費、引っかけなど）は、すべて **Google Cloud Storage (GCS)** に保存されます。

- **バックアップ**: GCSの「オブジェクトのバージョニング」機能を有効にすることで、上書きや削除からデータを保護できます。
- **復元**: バージョニングが有効な場合、古いバージョンのオブジェクトを復元できます。
- **ログ**: Botの動作ログはCloud Runの「ログ」タブから確認できます。