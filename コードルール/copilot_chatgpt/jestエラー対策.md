# Jestテスト: 同一モジュール内関数のSpy失敗と最終対策

## 1. 発生したエラー

`npm test` を実行した際、`utils/__tests__/errorHelper.test.js` で以下のテスト失敗が段階的に発生しました。

### 初期エラー: `logError` の呼び出しが検知されない

`logAndReplyError` をテストした際、内部で呼び出されるはずの `logError` が検知されませんでした。

**エラーログ:**
```
 FAIL  utils/__tests__/errorHelper.test.js
  ● logAndReplyError › logError と safeReplyToUser が適切に呼ばれること

    expect(jest.fn()).toHaveBeenCalledWith(...expected)
    Expected: "test_cmd [Guild:test_guild] [User:test_user]", "ログだけ", undefined
    Number of calls: 0
```

### 修正後のエラー: `safeReplyToUser` の呼び出しが検知されない

`logError` の呼び出し方を修正した後、今度は `safeReplyToUser` の呼び出しが検知されないという同様の問題が発生しました。

**エラーログ:**
```
 FAIL  utils/__tests__/errorHelper.test.js
  ● logAndReplyError › logError と safeReplyToUser が適切に呼ばれること

    expect(jest.fn()).toHaveBeenCalledWith(...expected)
    Expected: {"commandName": "test_cmd", ...}, "表示メッセージ", {}
    Number of calls: 0
```

## 2. エラーの根本原因

この問題は、Jestで**同一モジュール内の関数をspy（スパイ）する際によく発生する典型的な参照の問題**です。

`errorHelper.js` 内で、`logAndReplyError` 関数が同じファイルで定義されている `logError` や `safeReplyToUser` を直接呼び出していました。

```javascript
// utils/errorHelper.js (問題があった時のコード)
async function logAndReplyError(...) {
  // この呼び出しは、モジュール内部の直接のローカル関数参照を使っている
  await logError(...); 
  await safeReplyToUser(...);
}

module.exports = { logError, safeReplyToUser, logAndReplyError };
```

一方、テストファイル側では `jest.spyOn(errorHelper, 'logError')` のように、`require` でインポートした**モジュールオブジェクト (`errorHelper`)** のメソッドをスパイしていました。

**`logAndReplyError` が呼び出すローカル関数**と、**テストがスパイするモジュールオブジェクトのメソッド**は、JavaScriptの参照としては別物です。そのため、スパイは呼び出しを検知できず、「`Number of calls: 0`」という結果になっていました。

## 3. 最終的な解決策

この参照の不一致を解決するため、`errorHelper.js` 自身が自分自身の `exports` オブジェクトを経由して内部関数を呼び出すように構造を修正します。これにより、テスト側で監視しているオブジェクトと、実際に呼び出される関数が同じ参照を共有するようになります。

### 修正手順 (utils/errorHelper.js)

1.  **ファイルの先頭で `module.exports` への参照を保持します。**
    ```javascript
    // utils/errorHelper.js の先頭
    const errorHelper = module.exports;
    ```
2.  **内部関数の呼び出しを、保持した参照経由に変更します。**
    `logAndReplyError` 関数内の `logError` と `safeReplyToUser` の両方の呼び出しを修正します。
    ```diff
    // 修正前
    - await logError(...)
    - await safeReplyToUser(...)
    
    // 修正後
    + await errorHelper.logError(...)
    + await errorHelper.safeReplyToUser(...)
    ```

3.  **`module.exports` の再代入を避けます。**
    ファイルの末尾で `module.exports = { ... }` のように新しいオブジェクトを代入すると、ステップ1で保持した参照が無効になってしまいます。代わりに `Object.assign` を使い、既存の `exports` オブジェクトにプロパティを追加します。
    ```javascript
    // utils/errorHelper.js の末尾
    Object.assign(module.exports, { logError, safeReplyToUser, logAndReplyError });
    ```

### 修正後の `utils/errorHelper.js` 全文

```javascript
const { MessageFlagsBitField } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');

const errorHelper = module.exports;

async function logError(source, message, error) { /* ...実装... */ }

async function safeReplyToUser(interaction, content, options = {}) { /* ...実装... */ }

async function logAndReplyError(interaction, logMsg, userMsg, options = {}) {
  const source = interaction.customId || interaction.commandName || 'unknown_interaction';
  const guildId = interaction.guildId || 'DM';
  const userId = interaction.user?.id || 'unknown_user';
  const logMessage = logMsg instanceof Error ? logMsg.message : logMsg;
  const errorObject = logMsg instanceof Error ? logMsg : undefined;

  await errorHelper.logError(`${source} [Guild:${guildId}] [User:${userId}]`, logMessage, errorObject);
  await errorHelper.safeReplyToUser(interaction, userMsg, options);
}

Object.assign(module.exports, { logError, safeReplyToUser, logAndReplyError });
```

この修正により、テストコード (`utils/__tests__/errorHelper.test.js`) を変更することなく、テストが正常に成功するようになりました。