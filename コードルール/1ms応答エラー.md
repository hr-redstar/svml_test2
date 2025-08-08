# Discordコマンド「アプリケーションが応答しませんでした」エラーと1ms応答の原因・対応策

## 現象
- Discordで `/svml設定` などのスラッシュコマンドを実行した際、
  - 「アプリケーションが応答しませんでした」と表示される
  - サーバーログ上は「1msで処理完了」など非常に短い応答時間が記録される
  - 設定パネル等のUIが一切表示されない

## 主な原因
- **コマンドハンドラー（configHandler.jsなど）がスラッシュコマンドの処理を何もせずreturn falseしている**
  - 例: `execute`関数がカスタムID（ボタン/モーダル）しか処理せず、`/svml設定`などのスラッシュコマンドを無視している
- 本来処理すべき `coreConfigHandler.js` の `execute` が呼ばれていない
- そのためDiscord側の応答タイムアウト（3秒）を超え、ユーザーに「応答しませんでした」と表示される

## 対応策
1. **スラッシュコマンドの処理は必ずreturn falseせず、正しいハンドラーに委譲すること**
   - 例: `configHandler.js` の `execute` 冒頭で
     ```js
     if (interaction.isChatInputCommand && interaction.isChatInputCommand() && interaction.commandName === 'svml設定') {
       return await coreConfigHandler.execute(interaction);
     }
     ```
2. **スラッシュコマンドの応答は必ず `deferReply` または `reply` で返すこと**
3. **コマンドハンドラーの分岐ロジックを見直し、return falseで何も返さないパスを作らないこと**
4. **デバッグ時は「[coreConfigHandler]」等のログが出ているか必ず確認すること**

---

### 参考: 修正例
- `configHandler.js` で `/svml設定` コマンドは `coreConfigHandler` に委譲する
- これにより、パネルが正しく表示されるようになる

---

**このルールを守ることで、Discordの「アプリケーションが応答しませんでした」エラーを防止できます。**
