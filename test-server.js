// 基本的なHTTPサーバーテスト用
const http = require('http');

const port = process.env.PORT || 8080;
const host = '0.0.0.0';

console.log('🚀 テストサーバー起動中...');
console.log('📦 NODE_ENV:', process.env.NODE_ENV);
console.log('🔑 DISCORD_TOKEN:', process.env.DISCORD_TOKEN ? '設定済み' : '未設定');
console.log('🌐 ポート:', port);
console.log('🌐 ホスト:', host);

const server = http.createServer((req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`📡 ${timestamp} - リクエスト受信: ${req.method} ${req.url} from ${req.connection.remoteAddress}`);
  
  try {
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    
    const response = {
      status: 'ok',
      message: 'テストサーバー正常動作',
      timestamp: timestamp,
      port: port,
      host: host,
      url: req.url,
      method: req.method,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      headers: req.headers,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        BUILD_TIME: process.env.BUILD_TIME,
        COMMIT_SHA: process.env.COMMIT_SHA,
        DISCORD_TOKEN_SET: !!process.env.DISCORD_TOKEN,
        PORT: process.env.PORT
      }
    };
    
    res.end(JSON.stringify(response, null, 2));
    console.log(`✅ ${timestamp} - レスポンス送信完了`);
  } catch (error) {
    console.error(`❌ ${timestamp} - レスポンスエラー:`, error);
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

// 明示的にポートとホストを指定してリッスン
server.listen(port, host, () => {
  console.log(`🌐 テストサーバー起動完了: http://${host}:${port}`);
  console.log(`📋 テストURL: http://${host}:${port}/`);
  console.log(`⏰ 起動時刻: ${new Date().toISOString()}`);
  
  // 5秒後にセルフヘルスチェック
  setTimeout(() => {
    console.log('🔍 セルフヘルスチェック実行中...');
    const req = http.request({
      hostname: 'localhost',
      port: port,
      path: '/health',
      method: 'GET'
    }, (res) => {
      console.log(`✅ セルフヘルスチェック成功: ${res.statusCode}`);
    });
    req.on('error', (error) => {
      console.error('❌ セルフヘルスチェック失敗:', error);
    });
    req.end();
  }, 5000);
});

server.on('error', (error) => {
  console.error('❌ サーバーエラー:', error);
  // GitHub Actions環境では安全に処理を継続
  if (process.env.GITHUB_ACTIONS) {
    console.error('[TestServer] GitHub Actions環境でのサーバーエラーを検出しました');
    return;
  } else {
    process.exit(1);
  }
});

// 終了処理
process.on('SIGINT', () => {
  console.log('🛑 テストサーバー終了中...');
  server.close(() => {
    console.log('🌐 テストサーバー停止完了');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('🛑 テストサーバー終了中 (SIGTERM)...');
  server.close(() => {
    console.log('🌐 テストサーバー停止完了');
    process.exit(0);
  });
});

console.log('✅ テストサーバー設定完了');
