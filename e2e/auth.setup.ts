import { test as setup, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const authDirectory = path.join(__dirname, ".auth");

const authFile = path.join(authDirectory, "admin.json");

const adminSessionFile = path.join(authDirectory, "admin-session.json");

setup("ログインして認証状態を保存する", async ({ page }) => {
  await mkdir(authDirectory, {
    recursive: true,
  });

  await page.goto("/admin/login");

  await page.getByLabel("アカウント名").fill("Yamada");

  await page.getByLabel("パスワード").fill("passYamada");

  await page
    .getByRole("button", {
      name: "ログイン",
      exact: true,
    })
    .click();

  await page.waitForURL("/admin");

  await expect(
    page.getByRole("heading", {
      name: "メニュー",
    }),
  ).toBeVisible();

  /*
   * CookieとlocalStorageを保存する。
   */
  await page.context().storageState({
    path: authFile,
  });

  /*
   * storageStateではsessionStorageが保存されないため、
   * 別ファイルへ保存する。
   */
  const sessionStorageState = await page.evaluate(() =>
    Object.fromEntries(Object.entries(window.sessionStorage)),
  );

  await writeFile(
    adminSessionFile,
    JSON.stringify(sessionStorageState, null, 2),
    "utf-8",
  );
});
