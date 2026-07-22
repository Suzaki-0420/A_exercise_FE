import {
    expect,
    test,
    type Locator,
    type Page,
} from "@playwright/test";

/**
 * UC014 商品カテゴリ登録のE2Eテスト
 */
test.use({
    storageState: "e2e/.auth/admin.json",
});

/**
 * 商品カテゴリ登録画面を開く
 */
const openCategoryRegisterPage = async (
    page: Page
): Promise<Locator> => {
    await page.goto(
        "/admin/category/register"
    );

    await expect(
        page.getByRole("heading", {
            name: "商品カテゴリー登録（入力）",
            exact: true,
        })
    ).toBeVisible();

    const categoryNameInput =
        page.getByLabel(
            "カテゴリー名",
            { exact: true }
        );

    await expect(
        categoryNameInput
    ).toBeVisible();

    return categoryNameInput;
};

/**
 * 有効なカテゴリ名を入力して確認モーダルを開く
 */
const openConfirmDialog = async (
    page: Page,
    categoryName: string
): Promise<Locator> => {
    const categoryNameInput =
        await openCategoryRegisterPage(
            page
        );

    await categoryNameInput.fill(
        categoryName
    );

    await page.getByRole("button", {
        name: "確認",
        exact: true,
    }).click();

    const dialog = page.getByRole(
        "dialog"
    );

    await expect(dialog).toBeVisible();

    return dialog;
};

test.describe(
    "UC014 商品カテゴリ登録",
    () => {
        test(
            "入力項目と操作ボタンが表示される",
            async ({ page }) => {
                const categoryNameInput =
                    await openCategoryRegisterPage(
                        page
                    );

                await expect(
                    categoryNameInput
                ).toHaveValue("");

                await expect(
                    categoryNameInput
                ).toHaveAttribute(
                    "maxlength",
                    "30"
                );

                await expect(
                    page.getByText(
                        "0/30文字",
                        { exact: true }
                    )
                ).toBeVisible();

                await expect(
                    page.getByRole("button", {
                        name: "確認",
                        exact: true,
                    })
                ).toBeVisible();

                await expect(
                    page.getByRole("button", {
                        name: "キャンセル",
                        exact: true,
                    })
                ).toBeVisible();
            }
        );

        test(
            "未入力でフォーカスを外すと必須エラーが表示される",
            async ({ page }) => {
                const categoryNameInput =
                    await openCategoryRegisterPage(
                        page
                    );

                await categoryNameInput.fill(
                    "仮入力"
                );
                await categoryNameInput.clear();
                await categoryNameInput.blur();

                await expect(
                    page.getByText(
                        "カテゴリー名を入力してください。",
                        { exact: true }
                    )
                ).toBeVisible();

                await expect(
                    page.getByRole("button", {
                        name: "確認",
                        exact: true,
                    })
                ).toBeDisabled();
            }
        );

        test(
            "空白だけの場合は必須エラーが表示される",
            async ({ page }) => {
                const categoryNameInput =
                    await openCategoryRegisterPage(
                        page
                    );

                await categoryNameInput.fill(
                    "   "
                );
                await categoryNameInput.blur();

                await expect(
                    page.getByText(
                        "カテゴリー名を入力してください。",
                        { exact: true }
                    )
                ).toBeVisible();
            }
        );

        test(
            "使用できない記号を入力すると形式エラーが表示される",
            async ({ page }) => {
                const categoryNameInput =
                    await openCategoryRegisterPage(
                        page
                    );

                await categoryNameInput.fill(
                    "文房具@"
                );
                await categoryNameInput.blur();

                await expect(
                    page.getByText(
                        "カテゴリー名は日本語または全角・半角英数字で入力してください。",
                        { exact: true }
                    )
                ).toBeVisible();
            }
        );

        test(
            "上限の30文字でカテゴリを登録できる",
            async ({ page }) => {
                const categoryName =
                    `E2E${Date.now()
                        .toString()
                        .slice(-10)}${"A".repeat(17)}`;

                expect(categoryName).toHaveLength(
                    30
                );

                const dialog =
                    await openConfirmDialog(
                        page,
                        categoryName
                    );

                await expect(
                    dialog.getByText(
                        categoryName,
                        { exact: true }
                    )
                ).toBeVisible();

                const responsePromise =
                    page.waitForResponse(
                        (response) => {
                            const url = new URL(
                                response.url()
                            );

                            return (
                                url.pathname ===
                                    "/proxy-api/category/register" &&
                                response.request().method() ===
                                    "POST"
                            );
                        }
                    );

                await dialog.getByRole(
                    "button",
                    {
                        name: "登録する",
                        exact: true,
                    }
                ).click();

                const response =
                    await responsePromise;

                expect(response.status()).toBe(
                    201
                );

                await expect(
                    page.getByRole("status")
                ).toContainText(
                    "商品カテゴリーを登録しました。"
                );
            }
        );

        test(
            "31文字目は入力できない",
            async ({ page }) => {
                const categoryNameInput =
                    await openCategoryRegisterPage(
                        page
                    );

                await categoryNameInput.pressSequentially(
                    "A".repeat(31)
                );

                await expect(
                    categoryNameInput
                ).toHaveValue("A".repeat(30));

                await expect(
                    page.getByText(
                        "30/30文字",
                        { exact: true }
                    )
                ).toBeVisible();
            }
        );

        test(
            "登録済みカテゴリ名の場合は重複エラーが表示される",
            async ({ page }) => {
                const categoryNameInput =
                    await openCategoryRegisterPage(
                        page
                    );

                await categoryNameInput.fill(
                    "筆記具"
                );
                await categoryNameInput.blur();

                await expect(
                    page.getByText(
                        "このカテゴリ名は既に登録されています",
                        { exact: true }
                    )
                ).toBeVisible();

                await expect(
                    page.getByRole("dialog")
                ).toHaveCount(0);
            }
        );

        test(
            "確認画面では前後空白を除去し戻ると入力値を保持する",
            async ({ page }) => {
                const categoryName =
                    "E2E確認カテゴリ";

                const dialog =
                    await openConfirmDialog(
                        page,
                        `  ${categoryName}  `
                    );

                await expect(
                    dialog.getByText(
                        categoryName,
                        { exact: true }
                    )
                ).toBeVisible();

                await dialog.getByRole(
                    "button",
                    {
                        name: "戻る",
                        exact: true,
                    }
                ).click();

                await expect(
                    dialog
                ).toHaveCount(0);

                await expect(
                    page.getByLabel(
                        "カテゴリー名",
                        { exact: true }
                    )
                ).toHaveValue(categoryName);
            }
        );

        test(
            "キャンセルすると入力内容とエラーが初期化される",
            async ({ page }) => {
                const categoryNameInput =
                    await openCategoryRegisterPage(
                        page
                    );

                await categoryNameInput.fill(
                    "文房具@"
                );
                await categoryNameInput.blur();

                const validationError =
                    page.getByText(
                        "カテゴリー名は日本語または全角・半角英数字で入力してください。",
                        { exact: true }
                    );

                await expect(
                    validationError
                ).toBeVisible();

                await page.getByRole("button", {
                    name: "キャンセル",
                    exact: true,
                }).click();

                await expect(
                    categoryNameInput
                ).toHaveValue("");

                await expect(
                    validationError
                ).toHaveCount(0);
            }
        );

        test(
            "カテゴリを登録すると完了通知が表示され商品検索の選択肢へ反映される",
            async ({ page }) => {
                const categoryName =
                    `E2Eカテゴリ${Date.now()
                        .toString()
                        .slice(-8)}`;

                const dialog =
                    await openConfirmDialog(
                        page,
                        categoryName
                    );

                const responsePromise =
                    page.waitForResponse(
                        (response) => {
                            const url = new URL(
                                response.url()
                            );

                            return (
                                url.pathname ===
                                    "/proxy-api/category/register" &&
                                response.request().method() ===
                                    "POST"
                            );
                        }
                    );

                await dialog.getByRole(
                    "button",
                    {
                        name: "登録する",
                        exact: true,
                    }
                ).click();

                const response =
                    await responsePromise;

                expect(response.status()).toBe(
                    201
                );

                await expect(
                    page.getByRole("status")
                ).toContainText(
                    "商品カテゴリーを登録しました。"
                );

                await expect(
                    page.getByLabel(
                        "カテゴリー名",
                        { exact: true }
                    )
                ).toHaveValue("");

                /*
                 * 登録直後はカテゴリ一覧APIへの反映に時間差が
                 * 生じる場合があるため、一覧へ含まれるまで待つ。
                 */
                await expect.poll(
                    async () => {
                        const categoriesResponse =
                            await page.request.get(
                                "/proxy-api/product/categories"
                            );

                        if (
                            !categoriesResponse.ok()
                        ) {
                            return false;
                        }

                        const categories =
                            await categoriesResponse.json() as Array<{
                                name?: string;
                            }>;

                        return categories.some(
                            (category) =>
                                category.name ===
                                categoryName
                        );
                    },
                    {
                        timeout: 10_000,
                    }
                ).toBe(true);

                const categoriesResponsePromise =
                    page.waitForResponse(
                        (response) => {
                            const url = new URL(
                                response.url()
                            );

                            return (
                                url.pathname ===
                                    "/proxy-api/product/categories" &&
                                response.request().method() ===
                                    "GET"
                            );
                        }
                    );

                await page.goto(
                    "/admin/product"
                );

                const categoriesResponse =
                    await categoriesResponsePromise;

                expect(
                    categoriesResponse.ok()
                ).toBe(true);

                const displayedCategories =
                    await categoriesResponse.json() as Array<{
                        name?: string;
                    }>;

                expect(
                    displayedCategories.some(
                        (category) =>
                            category.name ===
                            categoryName
                    )
                ).toBe(true);

                const categorySelect =
                    page.getByRole(
                        "combobox"
                    );

                await expect(
                    categorySelect
                ).toBeEnabled();

                await categorySelect.click();

                await expect(
                    page.getByRole("option", {
                        name: categoryName,
                        exact: true,
                    })
                ).toBeVisible();
            }
        );
    }
);

test.describe(
    "UC014 商品カテゴリ登録（未認証）",
    () => {
        test.use({
            storageState: {
                cookies: [],
                origins: [],
            },
        });

        test(
            "未ログインで登録画面を開くとログイン画面へ遷移する",
            async ({ page }) => {
                await page.goto(
                    "/admin/category/register"
                );

                await expect(page).toHaveURL(
                    /\/admin\/login/
                );
            }
        );
    }
);
