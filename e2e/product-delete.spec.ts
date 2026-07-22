import {
    test,
    expect,
    type Locator,
    type Page,
    type Request,
} from "@playwright/test";

/**
 * 商品APIのレスポンスで使用する最小限の型。
 */
type ProductResponse = {
    productUuid: string;
    name: string;
    price: number;
    productCategory?: {
        categoryUuid: string;
        name: string;
    };
    productStock?: {
        quantity: number;
    };
};

/**
 * 1×1ピクセルのPNG画像。
 *
 * テスト用画像をリポジトリへ保存せず、
 * APIから商品を登録するために使用する。
 */
const pngBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ" +
    "AAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
);

/**
 * API失敗テストで返すメッセージ。
 */
const DELETE_ERROR_MESSAGE =
    "商品削除E2Eテスト用エラーです。";

/**
 * テスト中に作成した商品の情報。
 */
let targetProductName = "";
let targetProductUuid = "";
let comparisonProductName = "";
let deletedByUi = false;

/**
 * 商品カードを取得する。
 *
 * ガイドに記載されているshadcn/uiの
 * data-slot属性と商品名の見出しを使用する。
 */
const getProductCard = (
    page: Page,
    productName: string,
): Locator => {
    return page
        .locator("[data-slot='card']")
        .filter({
            has: page.getByRole("heading", {
                name: productName,
                exact: true,
            }),
        });
};

/**
 * 商品カード内の削除ボタンを取得する。
 */
const getDeleteButton = (
    productCard: Locator,
): Locator => {
    return productCard.getByRole("button", {
        name: "削除",
        exact: true,
    });
};

/**
 * 商品の削除確認モーダルを開く。
 */
const openDeleteDialog = async (
    page: Page,
    productName: string,
): Promise<Locator> => {
    const productCard =
        getProductCard(
            page,
            productName,
        );

    await expect(
        productCard,
    ).toBeVisible();

    const deleteButton =
        getDeleteButton(
            productCard,
        );

    await expect(
        deleteButton,
    ).toBeVisible();

    await deleteButton.click();

    /**
     * 削除確認にはAlertDialogを使用している想定。
     * dialogではなくalertdialogとして取得する。
     */
    const dialog =
        page.getByRole(
            "alertdialog",
        );

    await expect(
        dialog,
    ).toBeVisible();

    return dialog;
};

/**
 * 商品一覧を検索する。
 */
const clickSearchButton = async (
    page: Page,
): Promise<void> => {
    await page
        .getByRole("button", {
            name: "検索",
            exact: true,
        })
        .click();
};

/**
 * 削除済み商品のみを表示する。
 *
 * showDeletedOnly=trueで検索される画面操作を再現する。
 */
const showDeletedProducts = async (
    page: Page,
): Promise<void> => {
    const deletedCheckbox =
        page.getByRole("checkbox", {
            name: "削除済み",
            exact: true,
        });

    await expect(
        deletedCheckbox,
    ).toBeVisible();

    if (
        !await deletedCheckbox.isChecked()
    ) {
        await deletedCheckbox.check();
    }

    await clickSearchButton(page);
};

/**
 * 通常商品のみを表示する。
 *
 * showDeletedOnly=falseで検索される画面操作を再現する。
 */
const showActiveProducts = async (
    page: Page,
): Promise<void> => {
    const deletedCheckbox =
        page.getByRole("checkbox", {
            name: "削除済み",
            exact: true,
        });

    await expect(
        deletedCheckbox,
    ).toBeVisible();

    if (
        await deletedCheckbox.isChecked()
    ) {
        await deletedCheckbox.uncheck();
    }

    await clickSearchButton(page);
};

/**
 * 商品削除APIへのリクエストかを判定する。
 *
 * 実際のRepository:
 * DELETE /proxy-api/product/delete/{productUuid}
 */
const isDeleteProductRequest = (
    request: Request,
): boolean => {
    if (
        request.method() !== "DELETE"
    ) {
        return false;
    }

    const pathname =
        new URL(
            request.url(),
        ).pathname;

    return (
        /\/proxy-api\/product\/delete\/[^/]+$/
            .test(pathname)
    );
};

/**
 * 商品カードに表示されている情報を比較可能な文字列へ変換する。
 *
 * 削除前と削除後で異なる操作ボタンや状態表示は除外する。
 */
const getProductCardInformation = async (
    productCard: Locator,
): Promise<string> => {
    const cardText =
        await productCard.innerText();

    return cardText
        .split(/\r?\n/)
        .map(
            (text) =>
                text
                    .replace(/\s+/g, " ")
                    .trim(),
        )
        .filter(
            (text) =>
                text.length > 0,
        )
        .filter(
            (text) =>
                ![
                    "変更",
                    "修正",
                    "削除",
                    "削除済み",
                ].includes(text),
        )
        .join("|");
};

/**
 * 商品削除のE2Eテスト。
 *
 * 同じE2E専用商品を順番に操作するため、
 * serialで記述順に実行する。
 */
test.describe.serial(
    "商品削除",
    () => {
        /**
         * E2Eテスト専用商品を作成する。
         *
         * chromiumプロジェクトで読み込んだ
         * e2e/.auth/admin.jsonの認証状態が
         * requestフィクスチャにも使用される。
         */
        test.beforeAll(
            async ({ request }) => {
                /**
                 * 登録に使用できる実在カテゴリを取得する。
                 *
                 * 固定のカテゴリUUIDには依存しない。
                 */
                const productResponse =
                    await request.get(
                        "/proxy-api/product/category" +
                        "?showDeletedOnly=false",
                    );

                if (
                    !productResponse.ok()
                ) {
                    throw new Error(
                        "商品一覧の取得に失敗しました。" +
                        ` status=${productResponse.status()}` +
                        ` body=${await productResponse.text()}`,
                    );
                }

                const products: ProductResponse[] =
                    await productResponse.json();

                /**
                 * カテゴリ情報を持つ実在商品を選択する。
                 */
                const sourceProduct:
                    ProductResponse | undefined =
                    products.find(
                        (product: ProductResponse) =>
                            Boolean(
                                product.productCategory
                                    ?.categoryUuid
                                && product.productCategory
                                    ?.name,
                            ),
                    );

                if (
                    !sourceProduct
                    || !sourceProduct
                        .productCategory
                ) {
                    throw new Error(
                        "テスト商品を登録するための" +
                        "商品カテゴリが見つかりません。",
                    );
                }

                /**
                 * 削除対象外の商品として使用する。
                 */
                comparisonProductName =
                    sourceProduct.name;

                /**
                 * 商品名の上限20文字以内で、
                 * 実行ごとに異なる名前を作成する。
                 */
                targetProductName =
                    `E2E削除${Date.now()
                        .toString()
                        .slice(-8)
                    }`;

                const registerResponse =
                    await request.post(
                        "/proxy-api/product/register",
                        {
                            multipart: {
                                name:
                                    targetProductName,
                                price:
                                    "1234",
                                stock:
                                    "7",
                                categoryUuid:
                                    sourceProduct
                                        .productCategory
                                        .categoryUuid,
                                categoryName:
                                    sourceProduct
                                        .productCategory
                                        .name,
                                image: {
                                    name:
                                        "e2e-delete.png",
                                    mimeType:
                                        "image/png",
                                    buffer:
                                        pngBuffer,
                                },
                            },
                        },
                    );

                if (
                    !registerResponse.ok()
                ) {
                    throw new Error(
                        "E2E専用商品の登録に失敗しました。" +
                        ` status=${registerResponse.status()}` +
                        ` body=${await registerResponse.text()}`,
                    );
                }

                const createdProduct: ProductResponse =
                    await registerResponse.json();

                targetProductUuid =
                    createdProduct.productUuid;
            },
        );

        /**
         * 正常削除テストより前で失敗した場合も、
         * E2E専用商品を通常一覧に残さない。
         */
        test.afterAll(
            async ({ request }) => {
                if (
                    !targetProductUuid
                    || deletedByUi
                ) {
                    return;
                }

                const deleteResponse =
                    await request.delete(
                        `/proxy-api/product/delete/${encodeURIComponent(
                            targetProductUuid,
                        )
                        }`,
                    );

                /**
                 * すでに削除されている404は問題にしない。
                 */
                if (
                    !deleteResponse.ok()
                    && deleteResponse.status()
                    !== 404
                ) {
                    console.error(
                        "E2E専用商品の後始末に失敗しました。",
                        await deleteResponse.text(),
                    );
                }
            },
        );

        /**
         * 各テストは商品一覧画面から開始する。
         */
        test.beforeEach(
            async ({ page }) => {
                await page.goto(
                    "/admin/product",
                );

                await expect(
                    page,
                ).toHaveURL(
                    "/admin/product",
                );

                await expect(
                    page.getByRole(
                        "heading",
                        {
                            name:
                                /商品検索|商品情報メンテナンス/,
                        },
                    ),
                ).toBeVisible();
            },
        );

        test(
            "ログイン済みの担当者が商品一覧画面を表示できる",
            async ({ page }) => {
                /**
 * 商品一覧の検索条件が表示されることを確認する。
 *
 * shadcn/uiのSelectは、
 * role="combobox"として公開される。
 */
                await expect(
                    page.getByRole(
                        "combobox",
                    ).first(),
                ).toBeVisible();

                await expect(
                    page.getByRole(
                        "button",
                        {
                            name: "検索",
                            exact: true,
                        },
                    ),
                ).toBeVisible();

                /**
                 * 初期状態では削除済み検索がOFFである。
                 */
                await expect(
                    page.getByRole(
                        "checkbox",
                        {
                            name:
                                "削除済み",
                            exact: true,
                        },
                    ),
                ).not.toBeChecked();

                /**
                 * 登録した削除対象商品が表示される。
                 */
                const targetCard =
                    getProductCard(
                        page,
                        targetProductName,
                    );

                await expect(
                    targetCard,
                ).toBeVisible();

                /**
                 * 削除対象商品に削除ボタンが表示される。
                 */
                await expect(
                    getDeleteButton(
                        targetCard,
                    ),
                ).toBeVisible();

                /**
                 * 削除対象ではない商品も表示される。
                 */
                await expect(
                    getProductCard(
                        page,
                        comparisonProductName,
                    ),
                ).toBeVisible();
            },
        );

        test(
            "削除ボタンを押すと確認モーダルの内容が正しく表示される",
            async ({ page }) => {
                const dialog =
                    await openDeleteDialog(
                        page,
                        targetProductName,
                    );

                /**
                 * 確認モーダルの見出しを確認する。
                 */
                await expect(
                    dialog.getByRole(
                        "heading",
                        {
                            name:
                                "商品を削除しますか？",
                            exact: true,
                        },
                    ),
                ).toBeVisible();

                /**
                 * 削除対象の商品名が表示される。
                 */
                await expect(
                    dialog.getByText(
                        targetProductName,
                        {
                            exact: true,
                        },
                    ),
                ).toBeVisible();

                /**
                 * 削除対象ではない商品名は表示されない。
                 */
                await expect(
                    dialog.getByText(
                        comparisonProductName,
                        {
                            exact: true,
                        },
                    ),
                ).toHaveCount(0);

                /**
                 * 削除ボタンとキャンセルボタンが表示される。
                 */
                await expect(
                    dialog.getByRole(
                        "button",
                        {
                            name:
                                "削除",
                            exact: true,
                        },
                    ),
                ).toBeVisible();

                await expect(
                    dialog.getByRole(
                        "button",
                        {
                            name:
                                "キャンセル",
                            exact: true,
                        },
                    ),
                ).toBeVisible();
            },
        );

        test(
            "確認モーダルでキャンセルすると商品は削除されない",
            async ({ page }) => {
                let deleteRequestCount = 0;

                page.on(
                    "request",
                    (request) => {
                        if (
                            isDeleteProductRequest(
                                request,
                            )
                        ) {
                            deleteRequestCount++;
                        }
                    },
                );

                const dialog =
                    await openDeleteDialog(
                        page,
                        targetProductName,
                    );

                await dialog
                    .getByRole(
                        "button",
                        {
                            name:
                                "キャンセル",
                            exact: true,
                        },
                    )
                    .click();

                /**
                 * モーダルが閉じる。
                 */
                await expect(
                    dialog,
                ).toBeHidden();

                /**
                 * キャンセル時は削除APIが呼ばれない。
                 */
                expect(
                    deleteRequestCount,
                ).toBe(0);

                /**
                 * 通常一覧に商品が残る。
                 */
                await expect(
                    getProductCard(
                        page,
                        targetProductName,
                    ),
                ).toBeVisible();

                /**
                 * 削除済み一覧には表示されない。
                 */
                await showDeletedProducts(
                    page,
                );

                await expect(
                    getProductCard(
                        page,
                        targetProductName,
                    ),
                ).toHaveCount(0);
            },
        );

        test(
            "削除処理中は二重送信されず、失敗時はエラーが表示される",
            async ({ page }) => {
                let releaseRequest:
                    (() => void)
                    | undefined;

                const requestGate =
                    new Promise<void>(
                        (resolve) => {
                            releaseRequest =
                                resolve;
                        },
                    );

                let deleteRequestCount = 0;

                page.on(
                    "request",
                    (request) => {
                        if (
                            isDeleteProductRequest(
                                request,
                            )
                        ) {
                            deleteRequestCount++;
                        }
                    },
                );

                /**
                 * DELETEリクエストを一時停止して、
                 * 削除中の画面状態を確認する。
                 */
                await page.route(
                    "**/proxy-api/product/delete/**",
                    async (route) => {
                        await requestGate;

                        await route.fulfill({
                            status: 500,
                            contentType:
                                "application/json",
                            body:
                                JSON.stringify({
                                    message:
                                        DELETE_ERROR_MESSAGE,
                                }),
                        });
                    },
                );

                const dialog =
                    await openDeleteDialog(
                        page,
                        targetProductName,
                    );

                await dialog
                    .getByRole(
                        "button",
                        {
                            name:
                                "削除",
                            exact: true,
                        },
                    )
                    .click();

                /**
                 * 削除中は削除ボタンが無効になるため、
                 * 連続クリックできない。
                 */
                await expect(
                    dialog.getByRole(
                        "button",
                        {
                            name:
                                /削除/,
                        },
                    ),
                ).toBeDisabled();

                /**
                 * 削除APIは1回だけ呼ばれる。
                 */
                await expect
                    .poll(
                        () =>
                            deleteRequestCount,
                    )
                    .toBe(1);

                /**
                 * APIを500エラーで終了させる。
                 */
                releaseRequest?.();

                /**
                 * Repositoryが返したエラーメッセージが表示される。
                 */
                await expect(
                    dialog.getByText(
                        DELETE_ERROR_MESSAGE,
                        {
                            exact: true,
                        },
                    ),
                ).toBeVisible();

                /**
                 * 失敗時はdeleteTargetが残るため、
                 * モーダルは閉じない。
                 */
                await expect(
                    dialog,
                ).toBeVisible();

                expect(
                    deleteRequestCount,
                ).toBe(1);

                await page.unroute(
                    "**/proxy-api/product/delete/**",
                );

                /**
                 * 実際のAPIで一覧を再取得し、
                 * 商品が削除されていないことを確認する。
                 */
                await page.reload();

                await expect(
                    getProductCard(
                        page,
                        targetProductName,
                    ),
                ).toBeVisible();

                await showDeletedProducts(
                    page,
                );

                await expect(
                    getProductCard(
                        page,
                        targetProductName,
                    ),
                ).toHaveCount(0);
            },
        );

        test(
            "商品を正常に論理削除し削除済み一覧で確認できる",
            async ({ page }) => {
                const targetCardBeforeDelete =
                    getProductCard(
                        page,
                        targetProductName,
                    );

                await expect(
                    targetCardBeforeDelete,
                ).toBeVisible();

                /**
                 * 削除前の商品情報を保存する。
                 */
                const informationBeforeDelete =
                    await getProductCardInformation(
                        targetCardBeforeDelete,
                    );

                const dialog =
                    await openDeleteDialog(
                        page,
                        targetProductName,
                    );

                const deleteResponsePromise =
                    page.waitForResponse(
                        (response) =>
                            response.request()
                                .method()
                            === "DELETE"
                            && /\/proxy-api\/product\/delete\/[^/]+$/
                                .test(
                                    new URL(
                                        response.url(),
                                    ).pathname,
                                ),
                    );

                await dialog
                    .getByRole(
                        "button",
                        {
                            name:
                                "削除",
                            exact: true,
                        },
                    )
                    .click();

                const deleteResponse =
                    await deleteResponsePromise;

                expect(
                    deleteResponse.ok(),
                ).toBe(true);

                deletedByUi = true;

                /**
                 * 正常終了時はモーダルが閉じる。
                 */
                await expect(
                    dialog,
                ).toBeHidden();

                /**
                 * 削除完了トーストが表示される。
                 */
                await expect(
                    page.getByText(
                        /商品を削除しました。|削除が完了しました。/,
                    ),
                ).toBeVisible();

                /**
                 * 通常一覧から削除対象商品が消える。
                 */
                await expect(
                    getProductCard(
                        page,
                        targetProductName,
                    ),
                ).toHaveCount(0);

                /**
                 * 削除対象ではない商品は通常一覧に残る。
                 */
                await expect(
                    getProductCard(
                        page,
                        comparisonProductName,
                    ),
                ).toBeVisible();

                /**
                 * 削除済み商品のみを表示する。
                 */
                await showDeletedProducts(
                    page,
                );

                const deletedProductCard =
                    getProductCard(
                        page,
                        targetProductName,
                    );

                /**
                 * 削除済み一覧に削除対象商品が表示される。
                 */
                await expect(
                    deletedProductCard,
                ).toBeVisible();

                /**
                 * 表示された商品名が削除対象と一致する。
                 */
                await expect(
                    deletedProductCard
                        .getByRole(
                            "heading",
                            {
                                name:
                                    targetProductName,
                                exact: true,
                            },
                        ),
                ).toBeVisible();

                /**
                 * 削除対象ではない商品は削除済みにならない。
                 */
                await expect(
                    getProductCard(
                        page,
                        comparisonProductName,
                    ),
                ).toHaveCount(0);

                /**
                 * 商品名・価格・カテゴリなどの表示情報が、
                 * 削除後も保持されている。
                 */
                const informationAfterDelete =
                    await getProductCardInformation(
                        deletedProductCard,
                    );

                expect(
                    informationAfterDelete,
                ).toBe(
                    informationBeforeDelete,
                );

                /**
                 * 再読み込み後も削除済み状態が保持される。
                 */
                await page.reload();

                await showDeletedProducts(
                    page,
                );

                await expect(
                    getProductCard(
                        page,
                        targetProductName,
                    ),
                ).toBeVisible();

                /**
                 * 通常表示へ戻すと削除した商品は表示されない。
                 */
                await showActiveProducts(
                    page,
                );

                await expect(
                    getProductCard(
                        page,
                        targetProductName,
                    ),
                ).toHaveCount(0);

                await expect(
                    getProductCard(
                        page,
                        comparisonProductName,
                    ),
                ).toBeVisible();
            },
        );
    },
);

/**
 * 未ログイン状態の商品削除テスト。
 *
 * auth.setup.tsで保存された認証状態を、
 * このdescribe内だけ空の状態で上書きする。
 */
test.describe(
    "商品削除・未ログイン",
    () => {
        test.use({
            storageState: {
                cookies: [],
                origins: [],
            },
        });

        test(
            "未ログイン状態では商品削除機能を利用できない",
            async ({ page }) => {
                await page.goto(
                    "/admin/product",
                );

                /**
                 * callbackUrlが付く可能性があるため、
                 * 正規表現でログイン画面を確認する。
                 */
                await expect(
                    page,
                ).toHaveURL(
                    /\/admin\/login/,
                );

                /**
                 * 商品カードと削除ボタンは表示されない。
                 */
                await expect(
                    page.locator(
                        "[data-slot='card']",
                    ),
                ).toHaveCount(0);

                await expect(
                    page.getByRole(
                        "button",
                        {
                            name:
                                "削除",
                            exact: true,
                        },
                    ),
                ).toHaveCount(0);
            },
        );
    },
);