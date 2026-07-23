import {
    expect,
    test,
    type Locator,
    type Page,
} from "@playwright/test";

test.use({
    storageState: "e2e/.auth/admin.json",
});

const PRODUCT_UUID =
    "10000000-0000-0000-0000-000000000001";
const CATEGORY_UUID =
    "e50d978b-b73d-4afb-8e85-ace9cf1e12a7";
const STOCK_UUID =
    "20000000-0000-0000-0000-000000000001";

const product = {
    productUuid: PRODUCT_UUID,
    name: "水性ボールペン黒",
    price: 120,
    imageUrl: null,
    productCategory: {
        categoryUuid: CATEGORY_UUID,
        name: "文房具",
    },
    productStock: {
        stockUuid: STOCK_UUID,
        quantity: 80,
    },
    deleteFlg: 0,
};

const categories = [
    product.productCategory,
    {
        categoryUuid:
            "e50d978b-b73d-4afb-8e85-ace9cf1e12a8",
        name: "事務用品",
    },
];

type ProductApiMockOptions = {
    duplicateName?: string;
    updateStatus?: number;
};

/**
 * UC012で使用する商品APIをモックする。
 *
 * 共有DBを更新せず、画面遷移・入力検証・multipart送信を
 * ブラウザから確認できるようにする。
 */
const installProductApiMocks = async (
    page: Page,
    options: ProductApiMockOptions = {}
) => {
    let updateRequestCount = 0;
    let updateRequestBody = "";

    await page.route(
        "**/proxy-api/product/**",
        async (route) => {
            const request = route.request();
            const url = new URL(request.url());

            if (
                request.method() === "GET" &&
                url.pathname ===
                    "/proxy-api/product/categories"
            ) {
                await route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify(categories),
                });
                return;
            }

            if (
                request.method() === "GET" &&
                url.pathname ===
                    "/proxy-api/product/category"
            ) {
                await route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify([product]),
                });
                return;
            }

            if (
                request.method() === "GET" &&
                url.pathname ===
                    "/proxy-api/product/validate"
            ) {
                const productName =
                    url.searchParams.get("productName");

                if (
                    options.duplicateName &&
                    productName === options.duplicateName
                ) {
                    await route.fulfill({
                        status: 400,
                        contentType: "application/json",
                        body: JSON.stringify({
                            message:
                                "同じ商品名が既に登録されています。",
                        }),
                    });
                    return;
                }

                await route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: "{}",
                });
                return;
            }

            if (
                request.method() === "PUT" &&
                url.pathname ===
                    `/proxy-api/product/edit/${PRODUCT_UUID}`
            ) {
                updateRequestCount++;
                updateRequestBody =
                    request.postData() ?? "";

                const status =
                    options.updateStatus ?? 200;

                await route.fulfill({
                    status,
                    contentType: "application/json",
                    body: JSON.stringify(
                        status === 200
                            ? { updated: true }
                            : {
                                  message:
                                      "商品情報を更新できませんでした。",
                              }
                    ),
                });
                return;
            }

            await route.fulfill({
                status: 404,
                contentType: "application/json",
                body: JSON.stringify({
                    message:
                        `未定義のE2Eモックです: ${request.method()} ${url.pathname}`,
                }),
            });
        }
    );

    return {
        getUpdateRequestCount: () =>
            updateRequestCount,
        getUpdateRequestBody: () =>
            updateRequestBody,
    };
};

type UpdateFormElements = {
    nameInput: Locator;
    priceInput: Locator;
    stockInput: Locator;
    categorySelect: Locator;
    imageInput: Locator;
    completeButton: Locator;
    cancelButton: Locator;
};

const getUpdateFormElements = (
    page: Page
): UpdateFormElements => ({
    nameInput: page.getByLabel("商品名", {
        exact: true,
    }),
    priceInput: page.getByLabel("単価", {
        exact: true,
    }),
    stockInput: page.getByLabel("在庫数", {
        exact: true,
    }),
    categorySelect: page.getByLabel(
        "商品カテゴリ",
        { exact: true }
    ),
    imageInput: page.getByLabel("商品画像", {
        exact: true,
    }),
    completeButton: page.getByRole("button", {
        name: "完了",
        exact: true,
    }),
    cancelButton: page.getByRole("button", {
        name: "キャンセル",
        exact: true,
    }),
});

/**
 * 商品検索画面から対象商品の変更入力画面を開く。
 */
const openUpdatePageFromSearch = async (
    page: Page
): Promise<void> => {
    await page.goto("/admin/product");

    const productCard = page
        .getByTestId("product-card")
        .filter({
            has: page.getByRole("heading", {
                name: product.name,
                exact: true,
            }),
        });

    await expect(productCard).toBeVisible();
    await productCard
        .getByRole("button", {
            name: "更新",
            exact: true,
        })
        .click();

    await expect(page).toHaveURL(
        `/admin/product/edit/${PRODUCT_UUID}`
    );
    await expect(
        page.getByRole("heading", {
            name: "商品変更（入力）",
            exact: true,
        })
    ).toBeVisible();
};

const fillValidUpdate = async (
    page: Page,
    name = "水性ボールペン青"
): Promise<void> => {
    const {
        nameInput,
        priceInput,
        stockInput,
        categorySelect,
    } = getUpdateFormElements(page);

    await nameInput.fill(name);
    await priceInput.fill("250");
    await stockInput.fill("40");
    await categorySelect.selectOption(
        categories[1].categoryUuid
    );
};

const openConfirmModal = async (
    page: Page
): Promise<Locator> => {
    await getUpdateFormElements(
        page
    ).completeButton.click();

    const dialog = page.getByRole("dialog");

    await expect(dialog).toBeVisible();
    await expect(
        dialog.locator(
            "#update-product-confirm-title"
        )
    ).toHaveText("商品変更（確認）");

    return dialog;
};

test.describe("UC012 商品修正", () => {
    let apiMock: Awaited<
        ReturnType<typeof installProductApiMocks>
    >;

    test.beforeEach(async ({ page }) => {
        apiMock =
            await installProductApiMocks(page);
    });

    test("商品検索の更新ボタンから入力画面へ遷移し既存値を表示する", async ({
        page,
    }) => {
        await openUpdatePageFromSearch(page);

        const {
            nameInput,
            priceInput,
            stockInput,
            categorySelect,
            imageInput,
            completeButton,
            cancelButton,
        } = getUpdateFormElements(page);

        await expect(nameInput).toHaveValue(product.name);
        await expect(priceInput).toHaveValue("120");
        await expect(stockInput).toHaveValue("80");
        await expect(categorySelect).toHaveValue(
            CATEGORY_UUID
        );
        await expect(imageInput).toBeVisible();
        await expect(completeButton).toBeVisible();
        await expect(cancelButton).toBeVisible();
        await expect(
            page.getByRole("dialog")
        ).toHaveCount(0);
    });

    test("必須項目を空にしてフォーカスを外すとエラーを表示する", async ({
        page,
    }) => {
        await openUpdatePageFromSearch(page);

        const {
            nameInput,
            priceInput,
            stockInput,
            categorySelect,
            completeButton,
        } = getUpdateFormElements(page);

        await nameInput.clear();
        await nameInput.blur();
        await priceInput.clear();
        await priceInput.blur();
        await stockInput.clear();
        await stockInput.blur();
        await categorySelect.selectOption("");
        await expect(categorySelect).toHaveValue("");
        await categorySelect.focus();
        await nameInput.focus();

        await expect(
            page.getByText(
                "商品名を入力してください。",
                { exact: true }
            )
        ).toBeVisible();
        await expect(
            page.getByText(
                "価格を入力してください。",
                { exact: true }
            )
        ).toBeVisible();
        await expect(
            page.getByText(
                "数量を入力してください。",
                { exact: true }
            )
        ).toBeVisible();
        await expect(
            page.getByText(
                "カテゴリを選択してください。",
                { exact: true }
            )
        ).toBeVisible();

        await completeButton.click();
        await expect(
            page.getByRole("dialog")
        ).toHaveCount(0);
    });

    test("文字数・文字種・価格上限・数量上限を検証する", async ({
        page,
    }) => {
        await openUpdatePageFromSearch(page);

        const {
            nameInput,
            priceInput,
            stockInput,
        } = getUpdateFormElements(page);

        await nameInput.fill("A");
        await nameInput.blur();
        await expect(
            page.getByText(
                "商品名は2～20文字で入力してください。",
                { exact: true }
            )
        ).toBeVisible();

        await nameInput.fill("商品@テスト");
        await nameInput.blur();
        await expect(
            page.getByText(
                "商品名は全角・半角英数字で入力してください。",
                { exact: true }
            )
        ).toBeVisible();

        await priceInput.fill("1000001");
        await priceInput.blur();
        await expect(
            page.getByText(
                "価格は100万円以下で入力してください。",
                { exact: true }
            )
        ).toBeVisible();

        await stockInput.fill("1001");
        await stockInput.blur();
        await expect(
            page.getByText(
                "数量は1000個以下で入力してください。",
                { exact: true }
            )
        ).toBeVisible();
    });

    test("重複する商品名では確認モーダルを開かない", async ({
        page,
    }) => {
        const duplicateName = "登録済み商品";

        await page.unroute("**/proxy-api/product/**");
        await installProductApiMocks(page, {
            duplicateName,
        });
        await openUpdatePageFromSearch(page);

        const { nameInput, completeButton } =
            getUpdateFormElements(page);

        await nameInput.fill(duplicateName);
        await nameInput.blur();

        await expect(
            page.getByText(
                "同じ商品名が既に登録されています。",
                { exact: true }
            )
        ).toBeVisible();

        await completeButton.click();
        await expect(
            page.getByRole("dialog")
        ).toHaveCount(0);
    });

    test("正常値では入力画面のURLを保ったまま確認モーダルを表示する", async ({
        page,
    }) => {
        await openUpdatePageFromSearch(page);
        await fillValidUpdate(page);

        const dialog = await openConfirmModal(page);

        await expect(page).toHaveURL(
            `/admin/product/edit/${PRODUCT_UUID}`
        );
        await expect(
            dialog.getByText("水性ボールペン青", {
                exact: true,
            })
        ).toBeVisible();
        await expect(
            dialog.getByText("250円", {
                exact: true,
            })
        ).toBeVisible();
        await expect(
            dialog.getByText("40個", {
                exact: true,
            })
        ).toBeVisible();
        await expect(
            dialog.getByText("事務用品", {
                exact: true,
            })
        ).toBeVisible();
        await expect(
            dialog.getByText(
                "画像は変更しません。",
                { exact: true }
            )
        ).toBeVisible();
    });

    test("確認モーダルから戻ると入力値を保持する", async ({
        page,
    }) => {
        await openUpdatePageFromSearch(page);
        await fillValidUpdate(page);

        const dialog = await openConfirmModal(page);

        await dialog
            .getByRole("button", {
                name: "戻る",
                exact: true,
            })
            .click();

        await expect(dialog).not.toBeVisible();

        const {
            nameInput,
            priceInput,
            stockInput,
            categorySelect,
        } = getUpdateFormElements(page);

        await expect(nameInput).toHaveValue(
            "水性ボールペン青"
        );
        await expect(priceInput).toHaveValue("250");
        await expect(stockInput).toHaveValue("40");
        await expect(categorySelect).toHaveValue(
            categories[1].categoryUuid
        );
    });

    test("入力画面でキャンセルすると商品検索へ戻る", async ({
        page,
    }) => {
        await openUpdatePageFromSearch(page);

        await getUpdateFormElements(
            page
        ).cancelButton.click();

        await expect(page).toHaveURL("/admin/product");
        await expect(
            page.getByRole("heading", {
                name: "商品検索",
                exact: true,
            })
        ).toBeVisible();
    });

    test("更新成功後に完了モーダルを表示して商品検索へ戻れる", async ({
        page,
    }) => {
        await openUpdatePageFromSearch(page);
        await fillValidUpdate(page);

        const dialog = await openConfirmModal(page);

        await dialog
            .getByRole("button", {
                name: "完了",
                exact: true,
            })
            .click();

        await expect(
            page.locator(
                "#update-product-complete-title"
            )
        ).toHaveText("商品変更（完了）");
        await expect(
            page.getByText(
                "商品情報の修正が完了しました。",
                { exact: true }
            )
        ).toBeVisible();
        await expect(page).toHaveURL(
            `/admin/product/edit/${PRODUCT_UUID}`
        );
        expect(
            apiMock.getUpdateRequestCount()
        ).toBe(1);

        const requestBody =
            apiMock.getUpdateRequestBody();
        expect(requestBody).toContain(
            'name="Name"'
        );
        expect(requestBody).toContain(
            "水性ボールペン青"
        );
        expect(requestBody).toContain(
            'name="Price"'
        );
        expect(requestBody).toContain("250");

        await page
            .getByRole("button", {
                name: "商品検索へ戻る",
                exact: true,
            })
            .click();

        await expect(page).toHaveURL("/admin/product");
    });

    test("更新API失敗時は確認モーダルにエラーを表示する", async ({
        page,
    }) => {
        await page.unroute("**/proxy-api/product/**");
        await installProductApiMocks(page, {
            updateStatus: 500,
        });
        await openUpdatePageFromSearch(page);
        await fillValidUpdate(page);

        const dialog = await openConfirmModal(page);

        await dialog
            .getByRole("button", {
                name: "完了",
                exact: true,
            })
            .click();

        await expect(
            dialog.getByText(
                "商品情報を修正できませんでした",
                { exact: true }
            )
        ).toBeVisible();
        await expect(
            dialog.getByText(
                "商品情報の修正に失敗しました。管理者に連絡してください。",
                { exact: true }
            )
        ).toBeVisible();
        await expect(
            page.locator(
                "#update-product-complete-title"
            )
        ).toHaveCount(0);
    });
});
