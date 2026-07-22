import {
    test,
    expect,
    type Page,
} from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * UC018 担当者ログアウト E2Eテスト
 *
 * playwright.config.tsのchromiumプロジェクトで、
 * e2e/.auth/admin.jsonがstorageStateとして
 * 読み込まれることを前提とする。
 *
 * このファイルでは未ログイン状態への上書きは行わない。
 */

const ADMIN_MENU_PATH = "/admin";
const ADMIN_LOGIN_PATH = "/admin/login";
const PRODUCT_PATH = "/admin/product";
const ORDER_SEARCH_PATH =
    "/admin/order/search";

const LOGOUT_API_PATTERN =
    /\/proxy-api\/auth\/logout(?:\?.*)?$/;

const PROTECTED_API_PATH =
    "/proxy-api/account/form";

const ADMIN_SESSION_FILE = path.join(
    __dirname,
    ".auth",
    "admin-session.json",
);

const PRIMARY_ADMIN = {
    accountName: "Yamada",
    password: "passYamada",
};

const SECONDARY_ADMIN = {
    accountName:
        process.env
            .E2E_SECONDARY_ADMIN_ACCOUNT_NAME,
    password:
        process.env
            .E2E_SECONDARY_ADMIN_PASSWORD,
};

/**
 * 通常状態のログアウトボタンを取得する。
 */
const getLogoutButton = (
    page: Page,
) =>
    page.getByRole("button", {
        name: "ログアウト",
        exact: true,
    });

/**
 * ログアウト処理中のボタンを取得する。
 */
const getLoadingLogoutButton = (
    page: Page,
) =>
    page.getByRole("button", {
        name: "ログアウト中...",
        exact: true,
    });

/**
 * 管理者情報の表示を取得する。
 */
const getAdminInformation = (
    page: Page,
) =>
    page.getByText(
        /ようこそ、.+さん/,
    );

/**
 * ログアウトAPIのレスポンスか判定する。
 */
const isLogoutResponse = (
    response: {
        url(): string;
        request(): {
            method(): string;
        };
    },
) =>
    response.request().method() ===
    "POST" &&
    LOGOUT_API_PATTERN.test(
        response.url(),
    );

/**
 * auth.setup.tsが保存したsessionStorageを復元する。
 *
 * storageStateではsessionStorageが保存されないため、
 * /adminを一度開いた後に設定して再読み込みする。
 */
const restoreAdminSessionStorage =
    async (page: Page) => {
        await page.goto(
            ADMIN_MENU_PATH,
        );

        const json = await readFile(
            ADMIN_SESSION_FILE,
            "utf-8",
        );

        const sessionState =
            JSON.parse(json) as Record<
                string,
                string
            >;

        await page.evaluate(
            (state) => {
                for (
                    const [
                        key,
                        value,
                    ] of Object.entries(
                        state,
                    )
                ) {
                    window.sessionStorage.setItem(
                        key,
                        value,
                    );
                }
            },
            sessionState,
        );

        /*
         * sessionStorageを読み込んでいるReactコンポーネントを
         * 再描画するために再読み込みする。
         */
        await page.reload();

        await expect(
            getLogoutButton(page),
        ).toBeVisible();
    };

/**
 * ログイン画面が表示されていることを確認する。
 */
const expectLoginPage = async (
    page: Page,
) => {
    await expect(page).toHaveURL(
        /\/admin\/login/,
        {
            timeout: 10_000,
        },
    );

    await expect(
        page.getByLabel(
            "アカウント名",
        ),
    ).toBeVisible();

    await expect(
        page.getByLabel(
            "パスワード",
        ),
    ).toBeVisible();

    await expect(
        page.getByRole("button", {
            name: "ログイン",
            exact: true,
        }),
    ).toBeVisible();
};

/**
 * 正常にログアウトする。
 */
const logoutNormally = async (
    page: Page,
) => {
    const responsePromise =
        page.waitForResponse(
            isLogoutResponse,
        );

    await getLogoutButton(
        page,
    ).click();

    const response =
        await responsePromise;

    expect(
        response.request().method(),
    ).toBe("POST");

    expect(response.status()).toBe(
        200,
    );

    const body: unknown =
        await response.json();

    expect(body).toEqual(
        expect.objectContaining({
            success: true,
            data:
                expect.objectContaining({
                    loggedOut: true,
                }),
        }),
    );
};

/**
 * ログイン画面からログインする。
 */
const login = async (
    page: Page,
    accountName: string,
    password: string,
) => {
    await page.goto(
        ADMIN_LOGIN_PATH,
    );

    await page
        .getByLabel(
            "アカウント名",
        )
        .fill(accountName);

    await page
        .getByLabel(
            "パスワード",
        )
        .fill(password);

    await page
        .getByRole("button", {
            name: "ログイン",
            exact: true,
        })
        .click();

    await expect(page).toHaveURL(
        /\/admin\/?$/,
    );

    await expect(
        getLogoutButton(page),
    ).toBeVisible();
};

/**
 * ログアウト処理専用のエラー表示を取得する。
 *
 * Next.jsのroute announcerもrole="alert"を持つため、
 * getByRole("alert")だけでは2要素に一致する。
 */
const getLogoutError = (
    page: Page,
) =>
    page.locator(
        "#admin-logout-error",
    );

/**
 * 管理者情報が格納されているsessionStorageを探す。
 */
const findAdminSessionEntry = (
    entries: [string, string][],
) =>
    entries.find(
        ([, value]) =>
            value.includes(
                "accountName",
            ) &&
            value.includes(
                "employeeName",
            ),
    );

test.describe(
    "UC018 担当者ログアウト",
    () => {
        /*
         * auth.setup.tsでCookieは復元済み。
         * sessionStorageだけを追加で復元する。
         */
        test.beforeEach(
            async ({ page }) => {
                await restoreAdminSessionStorage(
                    page,
                );
            },
        );

        test(
            "ログイン済みの場合、ログアウトボタンが表示される",
            async ({ page }) => {
                await expect(
                    getLogoutButton(page),
                ).toBeVisible();

                await expect(
                    getLogoutButton(page),
                ).toBeEnabled();
            },
        );

        test(
            "ログアウトボタンを押すと正常にログアウトできる",
            async ({ page }) => {
                await logoutNormally(
                    page,
                );
            },
        );

        test(
            "ログアウト後にログイン画面へ遷移する",
            async ({ page }) => {
                await logoutNormally(page);

                await expectLoginPage(page);
            },
        );

        test(
            "ログアウト後に管理者情報が画面上から消える",
            async ({ page }) => {
                await expect(
                    getAdminInformation(
                        page,
                    ),
                ).toBeVisible();

                await logoutNormally(
                    page,
                );

                await expect(
                    getAdminInformation(
                        page,
                    ),
                ).toBeHidden();
            },
        );

        test(
            "ログアウト後に管理画面へ直接アクセスするとログイン画面へ遷移する",
            async ({ page }) => {
                await logoutNormally(
                    page,
                );

                await page.goto(
                    PRODUCT_PATH,
                );

                await expectLoginPage(
                    page,
                );
            },
        );

        test(
            "ログアウト後に別の管理画面URLへ直接アクセスしてもログイン画面へ遷移する",
            async ({ page }) => {
                await logoutNormally(
                    page,
                );

                await page.goto(
                    ORDER_SEARCH_PATH,
                );

                await expectLoginPage(
                    page,
                );
            },
        );

        test(
            "ログアウト後に管理画面URLを再読み込みしてもログイン画面へ遷移する",
            async ({ page }) => {
                await page.goto(
                    PRODUCT_PATH,
                );

                await expect(
                    getLogoutButton(page),
                ).toBeVisible();

                await logoutNormally(page);

                /*
                 * ログアウト前に表示していた
                 * 認証必須画面へ再アクセスする。
                 */
                await page.goto(
                    PRODUCT_PATH,
                    {
                        waitUntil:
                            "domcontentloaded",
                    },
                );

                await expectLoginPage(page);

                /*
                 * ログイン画面へ転送された状態で
                 * 再読み込みしても管理画面へ戻らない。
                 */
                await page.reload({
                    waitUntil:
                        "domcontentloaded",
                });

                await expectLoginPage(page);
            },
        );

        test(
            "ログアウト後に再ログインできる",
            async ({ page }) => {
                await logoutNormally(
                    page,
                );

                await login(
                    page,
                    PRIMARY_ADMIN.accountName,
                    PRIMARY_ADMIN.password,
                );

                await expect(
                    page.getByRole(
                        "heading",
                        {
                            name:
                                "メニュー",
                        },
                    ),
                ).toBeVisible();

                await expect(
                    getLogoutButton(page),
                ).toBeVisible();
            },
        );

        test(
            "ログアウト後に管理者情報がsessionStorageから削除される",
            async ({ page }) => {
                const entriesBefore =
                    await page.evaluate(
                        () =>
                            Object.entries(
                                window
                                    .sessionStorage,
                            ),
                    );

                const adminEntry =
                    findAdminSessionEntry(
                        entriesBefore,
                    );

                expect(
                    adminEntry,
                    [
                        "管理者情報が",
                        "sessionStorageに",
                        "見つかりません。",
                        "adminSessionStorage.tsを",
                        "確認してください。",
                    ].join(" "),
                ).toBeDefined();

                const adminStorageKey =
                    adminEntry![0];

                await logoutNormally(
                    page,
                );

                const valueAfter =
                    await page.evaluate(
                        (key) =>
                            window
                                .sessionStorage
                                .getItem(
                                    key,
                                ),
                        adminStorageKey,
                    );

                expect(
                    valueAfter,
                ).toBeNull();
            },
        );

        test(
            "セッション切れの状態で管理画面へアクセスするとログイン画面へ遷移する",
            async ({
                page,
                context,
            }) => {
                /*
                 * 認証Cookieを削除して
                 * セッション切れを再現する。
                 */
                await context.clearCookies();

                await page.goto(
                    PRODUCT_PATH,
                );

                await expectLoginPage(
                    page,
                );
            },
        );

        test(
            "ログアウトAPIが500を返した場合、適切なエラーを表示する",
            async ({ page }) => {
                await page.route(
                    LOGOUT_API_PATTERN,
                    async (route) => {
                        await route.fulfill({
                            status: 500,
                            contentType:
                                "application/json",
                            body:
                                JSON.stringify(
                                    {
                                        success:
                                            false,
                                        data: null,
                                    },
                                ),
                        });
                    },
                );

                await getLogoutButton(
                    page,
                ).click();

                await expect(
                    getLogoutError(page),
                ).toHaveText(
                    "ログアウトできませんでした。しばらく経ってから再度お試しください。",
                );

                /*
                 * finallyでisLoadingがfalseへ戻るため、
                 * 再試行できる。
                 */
                await expect(
                    getLogoutButton(page),
                ).toBeEnabled();
            },
        );

        test(
            "ログアウトAPIが500を返した場合、ログイン済み状態を維持する",
            async ({ page }) => {
                await page.route(
                    LOGOUT_API_PATTERN,
                    async (route) => {
                        await route.fulfill({
                            status: 500,
                            contentType:
                                "application/json",
                            body:
                                JSON.stringify(
                                    {
                                        success:
                                            false,
                                        data: null,
                                    },
                                ),
                        });
                    },
                );

                await getLogoutButton(
                    page,
                ).click();

                await expect(
                    getLogoutError(page),
                ).toBeVisible();

                /*
                 * 401以外ではclearLoggedInAdmin()を実行しない。
                 */
                await expect(page).toHaveURL(
                    /\/admin\/?$/,
                );

                await expect(
                    getAdminInformation(
                        page,
                    ),
                ).toBeVisible();

                await expect(
                    getLogoutButton(page),
                ).toBeVisible();

                await expect(
                    getLogoutButton(page),
                ).toBeEnabled();
            },
        );

        test(
            "ログアウトAPIが401を返した場合、管理者情報を削除してログイン画面へ遷移する",
            async ({
                page,
                context,
            }) => {
                await page.route(
                    LOGOUT_API_PATTERN,
                    async (route) => {
                        /*
                         * 401はサーバー上の認証セッションが
                         * 既に無効である状態を表す。
                         *
                         * APIをモックすると実際のCookieは
                         * 削除されないため、テスト側で再現する。
                         */
                        await context.clearCookies();

                        await route.fulfill({
                            status: 401,
                            contentType:
                                "application/json",
                            body: JSON.stringify({
                                success: false,
                                data: null,
                            }),
                        });
                    },
                );

                await getLogoutButton(
                    page,
                ).click();

                await expectLoginPage(page);

                /*
                 * 401時はエラーを表示せず、
                 * ログイン画面へ遷移する実装。
                 */
                await expect(
                    getLogoutError(page),
                ).toHaveCount(0);
            },
        );

        test(
            "ログアウトAPIへの接続に失敗した場合、通信エラーを表示する",
            async ({ page }) => {
                await page.route(
                    LOGOUT_API_PATTERN,
                    async (route) => {
                        await route.abort(
                            "connectionfailed",
                        );
                    },
                );

                await getLogoutButton(
                    page,
                ).click();

                await expect(
                    getLogoutError(page),
                ).toHaveText(
                    "サーバーに接続できませんでした。しばらく経ってから再度お試しください。",
                );

                await expect(page).toHaveURL(
                    /\/admin\/?$/,
                );

                await expect(
                    getLogoutButton(page),
                ).toBeEnabled();
            },
        );
    },
);