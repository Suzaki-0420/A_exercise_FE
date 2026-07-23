import { test, expect } from "@playwright/test";

/**
 * BP002 ログイン画面のE2Eテスト
 *
 * @remarks
 * このファイルのテストは未ログインの状態から始める必要がある。
 * playwright.config.ts では、ログイン済みの認証状態（storageState）を
 * すべてのテストへ読み込ませているため、ここではそれを空で上書きして打ち消す。
 * test.use() はファイル単位（describe単位）で設定を差し替えるための仕組み。
 */

test.use({ storageState: { cookies: [], origins: [] } });

/**
 * test.describe() は関連するテストをまとめるためのもの。
 * 実行結果の出力が読みやすくなり、まとめて実行や除外ができる。
 */
test.describe("ログイン", () => {
  /**
   * 正常系。仕様どおりのアカウントでログインし、ダッシュボードへ遷移することを確認する。
   *
   * 引数の { page } は Playwright が用意する「フィクスチャ」で、
   * テストごとに新しいブラウザのタブが渡される。
   * テスト間で状態が共有されないため、実行順序に依存しないテストが書ける。
   */
  test("正しいアカウント名とパスワードでログインできる", async ({ page }) => {
    // baseURL を playwright.config.ts に設定しているため、パスだけで指定できる
    await page.goto("/admin/login");

    // getByLabel() は、ラベルの文字列から入力欄を探すロケーター。
    // CSSセレクタ（#accountName など）ではなく、利用者が画面上で
    // 見ている手がかりで要素を探すのが Playwright の推奨する書き方。
    // 実装の詳細（idやclass）を変えてもテストが壊れず、
    // かつ「ラベルと入力欄が正しく結び付いているか」の検証も兼ねる。
    await page.getByLabel("アカウント名").fill("Yamada");
    await page.getByLabel("パスワード").fill("passYamada");

    // getByRole() は要素の役割（ボタン、見出し、リンクなど）で探すロケーター。
    // 支援技術（スクリーンリーダー）から見た構造と一致するため、
    // アクセシビリティの検証も兼ねる。
    await page.getByRole("button", { name: "ログイン" }).click();

    // ログインに成功するとダッシュボードへ遷移する。
    // waitForURL() は遷移が完了するまで待つ。
    // 画面遷移は非同期に起きるため、待たずに次の検証へ進むと失敗する。
    await page.waitForURL("/admin");

    // expect(...).toBeVisible() は、要素が表示されるまで自動で待ってから検証する。
    // Playwright のこの仕組みを「自動待機（auto-waiting）」と呼ぶ。
    // sleep で固定時間待つ必要がなく、テストが安定する。
    await expect(page.getByRole("heading", { name: "メニュー" })).toBeVisible();

    // バックエンドが返した情報が画面まで届いていることの検証になる。
    await expect(
      page.getByText("利用する管理機能を選択してください。"),
    ).toBeVisible();
  });

  /**
   * 異常系。認証に失敗した場合の振る舞いを確認する。
   * バックエンドが 401 を返し、フロントエンドがエラーを表示することを通しで検証する。
   */
  test("誤ったパスワードではログインできない", async ({ page }) => {
    await page.goto("/admin/login");

    await page.getByLabel("アカウント名").fill("fullness");
    await page.getByLabel("パスワード").fill("wrongpassword");
    await page.getByRole("button", { name: "ログイン" }).click();

    // エラーメッセージが表示されることを確認する
    await expect(page.getByText("ログインできませんでした")).toBeVisible();
    await expect(
      page.getByText("アカウント名またはパスワードが正しくありません。"),
    ).toBeVisible();

    // ログイン画面に留まり、管理画面へ入れていないことを確認する。
    // 「エラーが出ること」だけでなく「入れないこと」まで確認するのが重要。
    await expect(page).toHaveURL("/admin/login");
  });

  /**
   * 異常系。入力チェック（zod による検証）が働くことを確認する。
   * 未入力のまま送信した場合、APIを呼ぶ前にフロントエンドで止まる。
   */
  test("未入力の場合は入力チェックのエラーが表示される", async ({ page }) => {
    await page.goto("/admin/login");

    // 何も入力せずに送信する
    await page.getByRole("button", { name: "ログイン" }).click();

    await expect(
      page.getByText("アカウント名を入力してください。", { exact: true }),
    ).toBeVisible();

    await expect(
      page.getByText("パスワードを入力してください。", { exact: true }),
    ).toBeVisible();
  });

  /**
   * 未ログインの利用者が管理画面へ直接アクセスできないことを確認する。
   * これは middleware.ts による保護の検証であり、
   * 画面を経由しない直接のURLアクセスを再現できる E2E テストならではの項目。
   */
  test("未ログインで管理画面へアクセスするとログイン画面へリダイレクトされる", async ({
    page,
  }) => {
    // ログインを経ずに、いきなり商品検索画面のURLを開く
    await page.goto("/admin/product");

    // ログイン画面へリダイレクトされることを確認する。
    // NextAuth はリダイレクト時にクエリパラメータ（callbackUrl）を付けるため、
    // 完全一致ではなく正規表現で判定する。
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
