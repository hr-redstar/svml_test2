# 既知のエラーと修正履歴: Interaction Handling

このドキュメントは、インタラクション（ボタン、モーダル、セレクトメニュー）処理に関する主要なエラーと、その修正履歴をまとめたものです。

---

## 1. `handleButton is not defined` in `index.js`

-   **ステータス**: ✅ 解決済み
-   **発生事象**: Botがボタン操作に反応できず、`ReferenceError: handleButton is not defined` でクラッシュする。
-   **根本原因**: `index.js` が古いアーキテクチャに依存しており、存在しない `handleButton` や `handleSelect` 関数を直接呼び出そうとしていたため。
-   **修正方針**:
    -   `index.js` の `interactionCreate` イベントリスナーから、ボタンやセレクトメニューの個別処理 (`if (interaction.isButton()) { ... }`) を削除。
    -   すべての非コマンドインタラクションを、`utils/unifiedInteractionHandler.js` に処理を委譲するように一本化。

    ```javascript
    // index.js (修正後)
    client.on('interactionCreate', async interaction => {
      // ...
      if (interaction.isChatInputCommand()) {
        // ... command handling
      } else {
        // すべてのボタン、モーダル、セレクトメニューを統合ハンドラに渡す
        await unifiedHandler.handleInteraction(interaction);
      }
      // ...
    });
    ```

---

## 2. All interactions fail (Handler Resolution Failure)

-   **ステータス**: ✅ 解決済み
-   **発生事象**: `unifiedInteractionHandler` 導入後、すべてのボタン、モーダル、セレクトメニューが「この操作は現在利用できません」と応答するか、無反応になる。
-   **根本原因**: `unifiedInteractionHandler.js` 内の `resolveHandler` 関数が、ハンドラを解決するために誤った関数を呼び出していた。
    -   本来、各カテゴリ（例: `totusuna_setti`）用に `handlerLoader.js` が生成した**検索関数** (`find`) を使うべき箇所で、無関係な `findHandler.js` (実際は `fileHelper.js`) をインポートして使おうとしていた。
-   **修正方針**: `resolveHandler` のロジックを修正し、正しい検索関数 (`find`) を呼び出すように変更。

    ```diff
    // utils/unifiedInteractionHandler.js (修正前)
    - const { findHandler } = require('./findHandler'); // 誤ったインポート
    // ...
    - return findHandler(customId, this.handlerCategories[interactionType][category]);

    // utils/unifiedInteractionHandler.js (修正後)
    // ...
    const find = this.handlerCategories[interactionType]?.[category];
    if (typeof find !== 'function') {
      return null;
    }
    return find(customId); // 正しい検索関数を実行
    ```

---

## 3. Inaccurate `customId` Routing and Resolution

-   **ステータス**: ✅ 解決済み
-   **発生事象**: 一部の `customId` が意図しないカテゴリのハンドラに解決されてしまう、または全く解決されない。
-   **根本原因**: `getCategoryFromCustomId` のロジックが不完全だった。
    1.  **曖昧なPrefix**: `totusuna_` のような短いPrefixが、より具体的な `totusuna_config:` よりも先に一致してしまう可能性があった。
    2.  **硬直的なマッピング**: Prefixを持たないレガシーな `customId` に対応できていなかった。
-   **修正方針**: `getCategoryFromCustomId` のロジックをより堅牢なものに改善。
    1.  **Prefixの厳格化**: `totusuna_setti:` のように、コロンで終わる明確なPrefixを使用するルールを導入。
    2.  **例外リストの導入**: Prefixルールに合わない `customId` を `customIdMapping` で個別にマッピング。
    3.  **マッチング順の最適化**: `prefixMapping` をチェックする際、常に**文字列長が長い順**にソートしてから `startsWith` で比較することで、より具体的なPrefixが必ず優先されるようにした。

    ```javascript
    // utils/unifiedInteractionHandler.js (改善後のマッピング例)
    this.prefixMapping = {
      // 長いものを先に定義
      'totusuna_setti:': 'totusuna_setti',
      'totusuna_config:': 'totusuna_config',
      // ...
    };

    this.customIdMapping = {
      // 例外的なIDを直接マッピング
      'totusuna_install_button': 'totusuna_setti',
      'admin_role_select': 'star_config',
      // ...
    };
    ```

---

## 最終的なアーキテクチャ

1.  **`index.js`**: すべてのインタラクションを受信。スラッシュコマンドは `commands` フォルダのハンドラへ、それ以外（ボタン、モーダル、セレクト）はすべて `unifiedInteractionHandler` へ渡す。
2.  **`unifiedInteractionHandler.js`**:
    -   `customId` を解析して、それがどの機能カテゴリ（`totusuna_setti`, `star_config` 等）に属するかを特定 (`getCategoryFromCustomId`)。
    -   特定したカテゴリとインタラクション種別（`buttons`, `modals`, `selects`）に基づいて、適切なハンドラファイルを見つけ出し、実行 (`resolveHandler`)。
3.  **`handlerLoader.js`**: 各機能カテゴリのディレクトリ（例: `/utils/totusuna_setti/buttons`）を読み込み、`customId` をキーとしてハンドラを高速に検索できる関数 (`find`) を生成する。

この構成により、保守性と拡張性が大幅に向上し、エラーの特定も容易になった。