import {
    expect,
    test,
} from "@playwright/test";

/**
 * 管理メニュー画面
 *
 * 実際のURLに合わせて修正してください。
 */
const MENU_URL = "/admin";

/**
 * 遷移先URL
 *
 * 現在のルーティングに合わせて
 * 必要に応じて修正してください。
 */
const PRODUCT_URL = "/admin/product";
const PRODUCT_CATEGORY_URL =
    "/admin/category/register";
const ORDER_HISTORY_URL =
    "/admin/order/search";
const ACCOUNT_REGISTER_URL =
    "/admin/account/register";

test.describe(
    "管理メニュー画面",
    () => {
        test.beforeEach(
            async ({ page }) => {
                /*
                 * 認証が必要な場合は、
                 * ここより前にログイン処理を行います。
                 */
                await page.goto(
                    MENU_URL
                );
            }
        );

        test(
            "メニュー画面が正常に表示される",
            async ({ page }) => {
                await expect(
                    page
                ).toHaveURL(
                    new RegExp(
                        `${MENU_URL}$`
                    )
                );

                await expect(
                    page.getByRole(
                        "heading",
                        {
                            name: "メニュー",
                        }
                    )
                        .last()
                ).toBeVisible();



                await expect(
                    page.getByRole(
                        "link",
                        {
                            name:
                                "商品情報メンテナンス",
                        }
                    )
                        .last()
                ).toBeVisible();

                await expect(
                    page.getByRole(
                        "link",
                        {
                            name:
                                "商品カテゴリ登録",
                        }
                    )
                        .last()
                ).toBeVisible();

                await expect(
                    page.getByRole(
                        "link",
                        {
                            name:
                                "購入履歴",
                        }
                    )
                        .last()
                ).toBeVisible();

                await expect(
                    page.getByRole(
                        "link",
                        {
                            name:
                                "アカウント登録",
                        }
                    )
                        .last()
                ).toBeVisible();
            }
        );

        test(
            "商品情報メンテナンスを押すと商品検索画面へ遷移する",
            async ({ page }) => {
                await page
                    .getByRole(
                        "link",
                        {
                            name:
                                "商品情報メンテナンス",
                        }
                    )
                    .last()
                    .click();

                await expect(
                    page
                ).toHaveURL(
                    new RegExp(
                        `${PRODUCT_URL}$`
                    )
                );

                await expect(
                    page.getByRole(
                        "heading",
                        {
                            name:
                                "商品検索",
                        }
                    )
                ).toBeVisible();
            }
        );

        test(
            "商品カテゴリ登録を押すと商品カテゴリ登録画面へ遷移する",
            async ({ page }) => {
                await page
                    .getByRole(
                        "link",
                        {
                            name:
                                "商品カテゴリ登録",
                        }
                    )
                    .last()
                    .click();

                await expect(
                    page
                ).toHaveURL(
                    new RegExp(
                        `${PRODUCT_CATEGORY_URL}$`
                    )
                );
            }
        );

        test(
            "購入履歴を押すと購入履歴画面へ遷移する",
            async ({ page }) => {
                await page
                    .getByRole(
                        "link",
                        {
                            name:
                                "購入履歴",
                        }
                    )
                    .last()
                    .click();

                await expect(
                    page
                ).toHaveURL(
                    new RegExp(
                        `${ORDER_HISTORY_URL}$`
                    )
                );
            }
        );

        test(
            "アカウント登録を押すとアカウント登録画面へ遷移する",
            async ({ page }) => {
                await page
                    .getByRole(
                        "link",
                        {
                            name:
                                "アカウント登録",
                        }
                    )
                    .last()
                    .click();

                await expect(
                    page
                ).toHaveURL(
                    new RegExp(
                        `${ACCOUNT_REGISTER_URL}$`
                    )
                );
            }
        );
    }
);