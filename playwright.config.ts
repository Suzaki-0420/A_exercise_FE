import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2Eテスト設定
 */
export default defineConfig({
  /*
   * E2Eテストを配置するフォルダ。
   */
  testDir: "./e2e",

  /*
   * Azure上の同じデータベースや認証環境を使用するため、
   * テストファイル内も含めて並列実行しない。
   */
  fullyParallel: false,

  /*
   * ローカル・CIともに1つずつ実行する。
   */
  workers: 1,

  /*
   * CIにtest.onlyが残っていた場合は失敗させる。
   */
  forbidOnly: !!process.env.CI,

  /*
   * 一時的な通信エラーを考慮し、
   * CIだけ2回まで再試行する。
   */
  retries: process.env.CI ? 2 : 0,

  /*
   * ローカルでは実行後にレポートを開き、
   * CIでは自動で開かない。
   */
  reporter: [
    [
      "html",
      {
        open: process.env.CI ? "never" : "always",
      },
    ],
  ],

  use: {
    /*
     * page.goto("/admin")のように、
     * パスだけでアクセスできる。
     */
    baseURL: "http://localhost:3000",

    /*
     * ローカルでは再試行しないため、
     * 失敗した最初の実行からトレースを残す。
     */
    trace: "retain-on-failure",

    /*
     * 失敗時の画面を保存する。
     */
    screenshot: "only-on-failure",
  },

  projects: [
    /*
     * 最初にログインし、
     * CookieとlocalStorageを保存する。
     */
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },

    /*
     * 実際のE2Eテスト。
     *
     * setupで保存された認証状態を
     * 各テストの新しいBrowserContextへ読み込む。
     */
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/admin.json",
      },
      dependencies: ["setup"],
    },
  ],

  /*
   * E2Eテスト実行前にNext.jsを起動する。
   */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
