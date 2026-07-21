import {
    expect,
    test,
    type Page,
} from "@playwright/test";

/*
 * 認証状態を保存している場合に使用します。
 *
 * playwright.config.tsのproject側でstorageStateを指定済みなら、
 * この行は不要です。
 */
test.use({
    storageState: "e2e/.auth/admin.json",
});

/**
 * 担当者アカウント登録画面を開く
 */
const openAccountRegisterPage = async (
    page: Page
): Promise<void> => {
    await page.goto("/admin/account/register");

    await expect(
        page.getByRole("heading", {
            name: "担当者アカウント登録",
        })
    ).toBeVisible();
};

/**
 * 入力フォームの取得
 */
const getFormElements = (page: Page) => {
    return {
        employeeSelect: page.getByLabel(
            "社員名"
        ),
        accountNameInput: page.getByLabel(
            "アカウント名"
        ),
        passwordInput: page.getByLabel(
            "パスワード"
        ),
        completeButton: page.getByRole(
            "button",
            {
                name: "確認",
            }
        ),
        cancelLink: page.getByRole(
            "link",
            {
                name: "キャンセル",
            }
        ),
    };
};

test.describe(
    "担当者アカウント登録（入力）",
    () => {
        test(
            "画面の初期表示が正しい",
            async ({ page }) => {
                await openAccountRegisterPage(
                    page
                );

                const {
                    employeeSelect,
                    accountNameInput,
                    passwordInput,
                    completeButton,
                    cancelLink,
                } = getFormElements(page);

                await expect(
                    employeeSelect
                ).toBeVisible();

                await expect(
                    accountNameInput
                ).toBeVisible();

                await expect(
                    passwordInput
                ).toBeVisible();

                await expect(
                    completeButton
                ).toBeVisible();

                await expect(
                    cancelLink
                ).toBeVisible();

                await expect(
                    accountNameInput
                ).toHaveValue("");

                await expect(
                    passwordInput
                ).toHaveValue("");

                await expect(
                    passwordInput
                ).toHaveAttribute(
                    "type",
                    "password"
                );
            }
        );

        test(
            "未登録社員が一覧に表示される",
            async ({ page }) => {
                await openAccountRegisterPage(page);

                const employeeSelect =
                    page.getByLabel("社員名");

                await expect(employeeSelect)
                    .toBeVisible();

                await expect(
                    employeeSelect.getByRole("option", {
                        name: "佐藤 花子",
                    })
                ).toBeVisible();
            }
        );

        test(
            "未入力で完了ボタンを押すと必須エラーが表示される",
            async ({ page }) => {
                await openAccountRegisterPage(
                    page
                );

                const {
                    completeButton,
                } = getFormElements(page);

                await completeButton.click();

                await expect(
                    page.getByText(
                        "社員名を選択してください",
                        {
                            exact: true,
                        }
                    )
                ).toBeVisible();

                await expect(
                    page.getByText(
                        "アカウント名を入力してください",
                        {
                            exact: true,
                        }
                    )
                ).toBeVisible();

                await expect(
                    page.getByText(
                        "パスワードを入力してください",
                        {
                            exact: true,
                        }
                    )
                ).toBeVisible();
            }
        );

        test(
            "アカウント名が5文字未満の場合は文字数エラーが表示される",
            async ({ page }) => {
                await openAccountRegisterPage(
                    page
                );

                const {
                    accountNameInput,
                    completeButton,
                } = getFormElements(page);

                await accountNameInput.fill(
                    "abcd"
                );

                await completeButton.click();

                await expect(
                    page.getByText(
                        "アカウント名は5〜20文字で入力してください",
                        {
                            exact: true,
                        }
                    )
                ).toBeVisible();
            }
        );

        test(
            "アカウント名が20文字を超える場合は文字数エラーが表示される",
            async ({ page }) => {
                await openAccountRegisterPage(
                    page
                );

                const {
                    accountNameInput,
                    completeButton,
                } = getFormElements(page);

                await accountNameInput.fill(
                    "a".repeat(21)
                );

                await completeButton.click();

                await expect(
                    page.getByText(
                        "アカウント名は5〜20文字で入力してください",
                        {
                            exact: true,
                        }
                    )
                ).toBeVisible();
            }
        );

        test(
            "アカウント名に半角英数字以外を入力すると文字種エラーが表示される",
            async ({ page }) => {
                await openAccountRegisterPage(
                    page
                );

                const {
                    accountNameInput,
                    completeButton,
                } = getFormElements(page);

                await accountNameInput.fill(
                    "山田太郎"
                );

                await completeButton.click();

                await expect(
                    page.getByText(
                        "アカウント名は半角英数字で入力してください",
                        {
                            exact: true,
                        }
                    )
                ).toBeVisible();
            }
        );

        test(
            "パスワードが5文字未満の場合は文字数エラーが表示される",
            async ({ page }) => {
                await openAccountRegisterPage(
                    page
                );

                const {
                    passwordInput,
                    completeButton,
                } = getFormElements(page);

                await passwordInput.fill(
                    "abc1"
                );

                await completeButton.click();

                await expect(
                    page.getByText(
                        "パスワードは5〜20文字で入力してください",
                        {
                            exact: true,
                        }
                    )
                ).toBeVisible();
            }
        );

        test(
            "パスワードが20文字を超える場合は文字数エラーが表示される",
            async ({ page }) => {
                await openAccountRegisterPage(
                    page
                );

                const {
                    passwordInput,
                    completeButton,
                } = getFormElements(page);

                await passwordInput.fill(
                    "a".repeat(21)
                );

                await completeButton.click();

                await expect(
                    page.getByText(
                        "パスワードは5〜20文字で入力してください",
                        {
                            exact: true,
                        }
                    )
                ).toBeVisible();
            }
        );

        test(
            "パスワードに半角英数字以外を入力すると文字種エラーが表示される",
            async ({ page }) => {
                await openAccountRegisterPage(
                    page
                );

                const {
                    passwordInput,
                    completeButton,
                } = getFormElements(page);

                await passwordInput.fill(
                    "パスワード123"
                );

                await completeButton.click();

                await expect(
                    page.getByText(
                        "パスワードは半角英数字で入力してください",
                        {
                            exact: true,
                        }
                    )
                ).toBeVisible();
            }
        );

        test(
            "使用済みのアカウント名を入力すると重複エラーが表示される",
            async ({ page }) => {
                /*
                 * 実際の重複確認APIに合わせて
                 * URLとレスポンス形式を変更してください。
                 */
                await page.route(
                    "**/proxy-api/account/check**",
                    async (route) => {
                        await route.fulfill({
                            status: 409,
                            contentType:
                                "application/json",
                            body: JSON.stringify({
                                message:
                                    "このアカウント名は既に使用されています",
                            }),
                        });
                    }
                );

                await openAccountRegisterPage(
                    page
                );

                const {
                    employeeSelect,
                    accountNameInput,
                    passwordInput,
                    completeButton,
                } = getFormElements(page);

                await employeeSelect.selectOption({
                    index: 1,
                });

                await accountNameInput.fill(
                    "Yamada"
                );

                await passwordInput.fill(
                    "passYamada"
                );

                await completeButton.click();

                await expect(
                    page.getByText(
                        "このアカウント名は既に使用されています",
                        {
                            exact: true,
                        }
                    )
                ).toBeVisible();
            }
        );

        test(
            "正常な値を入力すると確認画面へ遷移する",
            async ({ page }) => {
                await openAccountRegisterPage(
                    page
                );

                const {
                    employeeSelect,
                    accountNameInput,
                    passwordInput,
                    completeButton,
                } = getFormElements(page);

                /*
                 * selectのvalueが社員UUIDの場合は、
                 * 実際のUUIDを指定するのがより確実です。
                 */
                await employeeSelect.selectOption({
                    index: 1,
                });

                await accountNameInput.fill(
                    "Suzuki01"
                );

                await passwordInput.fill(
                    "passSuzuki01"
                );

                await completeButton.click();

                /*
                 * BP004の実際のURLに合わせて
                 * 修正してください。
                 */
                await page.waitForURL(
                    "**/admin/account/confirm"
                );

                await expect(
                    page.getByRole("heading", {
                        name: "アカウント登録(確認)",
                    })
                ).toBeVisible();

                await expect(
                    page.getByText(
                        "Suzuki01",
                        {
                            exact: true,
                        }
                    )
                ).toBeVisible();
            }
        );

        test(
            "キャンセルを押すと管理画面へ遷移する",
            async ({ page }) => {
                await openAccountRegisterPage(
                    page
                );

                const {
                    cancelLink,
                } = getFormElements(page);

                await cancelLink.click();

                await page.waitForURL(
                    "**/admin"
                );

                await expect(
                    page
                ).toHaveURL(
                    /\/admin\/?$/
                );
            }
        );

        test(
            "社員情報の取得に失敗した場合はエラーメッセージが表示される",
            async ({ page }) => {
                await page.route(
                    "**/proxy-api/account/employees**",
                    async (route) => {
                        await route.fulfill({
                            status: 500,
                            contentType:
                                "application/json",
                            body: JSON.stringify({
                                message:
                                    "社員情報の取得に失敗しました",
                            }),
                        });
                    }
                );

                await page.goto(
                    "/admin/account/register"
                );

                await expect(
                    page.getByText(
                        "社員情報の取得に失敗しました",
                        {
                            exact: true,
                        }
                    )
                ).toBeVisible();
            }
        );
    }
);