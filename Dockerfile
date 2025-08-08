# Stage 1: Use the official Node.js 20 image as a base.
# The 'slim' variant is smaller and contains the minimal packages needed to run Node.
FROM node:20-slim

# Set the working directory inside the container. All subsequent commands will run from here.
WORKDIR /app

# Set the NODE_ENV to 'production' by default.
# This ensures npm installs only production dependencies and can optimize some packages.
# This can be overridden at runtime if needed (e.g., for a development container).
ENV NODE_ENV=production

# Cloud Run用のポート設定（デフォルト8080、ヘルスチェック用）
ENV PORT=8080
EXPOSE 8080

# 日本時間に設定
ENV TZ=Asia/Tokyo
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Cloud Run環境では認証が自動的に設定されるため、GOOGLE_APPLICATION_CREDENTIALSは不要
# ローカル開発時のみdata/svml_key.jsonを使用

# ビルド時のメタデータを追加（キャッシュ無効化のため）
ARG BUILDTIME
ARG COMMIT_SHA
ENV BUILD_TIME=$BUILDTIME
ENV COMMIT_SHA=$COMMIT_SHA

# Copy package.json and package-lock.json first.
# This leverages Docker's layer caching. If these files haven't changed, Docker
# won't re-run 'npm install' on subsequent builds, speeding up the process.
COPY package*.json ./

# Install production dependencies with timeout and retry settings
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retry-mintimeout 10000 && \
    npm config set fetch-retry-maxtimeout 60000 && \
    npm ci --only=production --verbose

# Copy the rest of the application source code into the container.
# The .dockerignore file will prevent unnecessary files from being copied.
COPY . .

# ビルド情報をファイルに出力
RUN echo "Build: $BUILD_TIME, Commit: $COMMIT_SHA" > /app/build-info.txt

# The command to run when the container starts.
# This executes the bot's main entry point, index.js.
CMD ["node", "index.js"]