#!/bin/bash

# ==============================================================================
# Unified Setup & Update Script for svml_zimu_bot
# svml_zimu_bot 統合セットアップ＆更新スクリプト
# ==============================================================================
# このスクリプトは、開発環境と本番環境（PM2）の両方で、
# 初期セットアップと更新を処理します。
#
# 使い方:
#   開発環境の初期セットアップ:  ./setup.sh
#   本番環境の初期セットアップ:  ./setup.sh --prod
#   開発環境の更新:             ./setup.sh update
#   本番環境の更新:             ./setup.sh update --prod
# ==============================================================================

set -e # Exit immediately if a command exits with a non-zero status.

# --- Configuration ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

GIT_REPO_SSH="git@github.com:star-discord/svml_zimu_bot.git"
PROJECT_DIR="$HOME/svml_zimu_bot"
NODE_VERSION="20"

# --- Argument Parsing ---
IS_UPDATE=false
IS_PROD=false
for arg in "$@"; do
  case $arg in
    update)
      IS_UPDATE=true
      shift
      ;;
    --prod)
      IS_PROD=true
      shift
      ;;
  esac
done

# --- Helper Functions ---
handle_error() {
    local exit_code=$?
    echo -e "${RED}❌ エラーが発生しました (終了コード: $exit_code, 行番号: $1)。処理を中止します。${NC}"
    exit $exit_code
}
trap 'handle_error $LINENO' ERR

print_header() {
    echo -e "${GREEN}--- SVML Zimu Bot セットアップスクリプト ---${NC}"
    if [ "$IS_UPDATE" = true ]; then
        echo -e "${YELLOW}モード: 環境の更新${NC}"
    else
        echo -e "${YELLOW}モード: 新規環境の初期セットアップ${NC}"
    fi
    if [ "$IS_PROD" = true ]; then
        echo -e "${YELLOW}ターゲット: 本番環境 (PM2)${NC}"
    else
        echo -e "${YELLOW}ターゲット: 開発環境${NC}"
    fi
}

# --- Main Logic ---
print_header

# --- 1. System Setup ---
echo -e "\n${YELLOW}1. システムのセットアップ中...${NC}"
echo "📦 パッケージリストを更新し、基本ツールをインストールします..."
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y git curl dos2unix vim

echo "🕒 タイムゾーンを Asia/Tokyo に設定します..."
sudo timedatectl set-timezone Asia/Tokyo

if ! command -v node &> /dev/null || [[ $(node -v) != "v${NODE_VERSION}"* ]]; then
    echo "📦 Node.js v${NODE_VERSION} をインストールします..."
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js v${NODE_VERSION} は既にインストールされています。"
fi
echo "🔧 Node.js と npm のバージョン確認:"
node -v
npm -v

if [ "$IS_PROD" = true ]; then
    if ! command -v pm2 &> /dev/null; then
        echo "📦 PM2 をグローバルにインストールします..."
        sudo npm install -g pm2
    else
        echo "✅ PM2 は既にインストールされています。"
    fi
fi

# --- 2. Project Setup ---
echo -e "\n${YELLOW}2. プロジェクトのセットアップ中...${NC}"
if [ "$IS_UPDATE" = true ]; then
    if [ ! -d "$PROJECT_DIR" ]; then
        echo -e "${RED}エラー: 更新対象のディレクトリ '$PROJECT_DIR' が見つかりません。${NC}"
        exit 1
    fi
    cd "$PROJECT_DIR"
    echo "📂 リポジトリを最新の状態に更新します (git pull)..."
    git pull
else
    # Initial Setup
    if [ -d "$PROJECT_DIR" ]; then
        echo -e "${RED}エラー: ディレクトリ '$PROJECT_DIR' は既に存在します。${NC}"
        echo "更新する場合は './setup.sh update' を使用してください。"
        exit 1
    fi
    echo "📂 GitHubからリポジトリをクローンします: ${PROJECT_DIR}"
    git clone "$GIT_REPO_SSH" "$PROJECT_DIR"
    cd "$PROJECT_DIR"

    echo "📝 .env ファイルをセットアップします..."
    if [ -f .env.sample ]; then
        cp .env.sample .env
        echo -e "${GREEN}✅ '.env.sample' から '.env' を作成しました。${NC}"
        echo -e "${YELLOW}*** 重要: .env ファイルを編集してください ***${NC}"
        echo "Botのトークンや各種IDを設定する必要があります。"
        read -p "編集のために 'vim .env' を開きます。編集後、保存して終了すると続行します..."
        vim .env
    else
        echo -e "${YELLOW}⚠️ '.env.sample' が見つかりません。空の '.env' を作成します。${NC}"
        touch .env
    fi
fi

# --- 3. Dependencies & Deployment ---
echo -e "\n${YELLOW}3. 依存関係のインストールとデプロイ...${NC}"
echo "📦 npm パッケージをインストールしています (数分かかる場合があります)..."
npm install --no-audit --no-fund

if [ "$IS_PROD" = true ]; then
    echo "📡 本番環境用のスラッシュコマンドをDiscordに登録しています..."
    npm run deploy
    echo "🚀 PM2でアプリケーションを起動・設定します..."
    pm2 start ecosystem.config.js --name svml_zimu_bot
    pm2 save
    sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
    echo -e "${GREEN}✅ PM2のセットアップが完了しました。${NC}"
else
    # Development Environment
    echo "📡 開発環境用のスラッシュコマンドをDiscordに登録しています..."
    npm run dev:deploy
fi

# --- 4. Final Instructions ---
echo -e "\n${GREEN}✅ セットアップが完了しました！${NC}"
echo "----------------------------------------"
if [ "$IS_PROD" = true ]; then
    echo "💡 BotはPM2によってバックグラウンドで実行されています。"
    echo "   ログの確認: pm2 logs svml_zimu_bot"
    echo "   プロセスの管理: pm2 status"
else
    echo "💡 次のステップ:"
    echo "   Botを起動するには、プロジェクトディレクトリで 'npm run dev' を実行してください。"
fi
echo "----------------------------------------"