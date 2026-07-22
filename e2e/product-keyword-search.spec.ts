import {
    expect,
    test,
    type Locator,
    type Page,
} from "@playwright/test";

test.use({
    storageState:
        "e2e/.auth/admin.json",
});

/*
 * 実際のDBに存在する商品名へ変更してください。
 */
const EXACT_PRODUCT_NAME =
    "文鎮";

/*
 * 部分一致検索に使用するキーワード。
 *
 */
const PARTIAL_KEYWORD =
    "キーボード";

/*
 * 複数件の商品名に含まれるキーワード。
 *
 * 例：
 * ボールペン、蛍光ペンなどが存在する場合は「ペン」
 */
const MULTIPLE_MATCH_KEYWORD =
    "付箋";

/*
 * 削除されていない通常商品。
 */
const ACTIVE_PRODUCT_NAME =
    "文鎮";

/*
 * 削除済みの商品。
 *
 * 実際にdeleteFlgが削除済みになっている
 * 商品名へ変更してください。
 */
const DELETED_PRODUCT_NAME =
    "油性ボールペン 黒";

/*
 * 連続検索で使用する商品名。
 */
const FIRST_SEARCH_PRODUCT_NAME =
    "文鎮";

const SECOND_SEARCH_PRODUCT_NAME =
    "筆ペン";

/**
 * 商品検索画面を開く
 */
const openProductSearchPage = async (
    page: Page
): Promise<void> => {
    await page.goto(
        "/admin/product"
    );

    await expect(
        page.getByRole("heading", {
            name: "商品検索",
            exact: true,
        })
    ).toBeVisible();

    /*
     * キーワード検索タブを選択する。
     *
     * 初期状態ですでにキーワード検索タブが
     * 選択されている場合でも問題ありません。
     */
    await page
        .getByRole("tab", {
            name: "キーワード検索",
            exact: true,
        })
        .click();
};

/**
 * キーワード検索画面の要素を取得する
 */
const getKeywordSearchElements = (
    page: Page
): {
    keywordInput: Locator;
    searchButton: Locator;
    deletedCheckbox: Locator;
} => {
    return {
        keywordInput:
            page.getByLabel(
                "商品名"
            ),

        searchButton:
            page.getByRole(
                "button",
                {
                    name: "キーワード検索",
                    exact: true,
                }
            ),

        deletedCheckbox:
            page.getByRole(
                "checkbox",
                {
                    name: "削除済み",
                    exact: true,
                }
            ),
    };
};

/**
 * 商品カード一覧
 */
const getProductCards = (
    page: Page
): Locator => {
    return page.getByTestId(
        "product-card"
    );
};

/**
 * 商品名から商品カードを取得する
 */
const getProductCardByName = (
    page: Page,
    productName: string
): Locator => {
    return getProductCards(page)
        .filter({
            has: page.getByText(
                productName,
                {
                    exact: true,
                }
            ),
        });
};

/**
 * キーワード検索を実行する
 */
const searchByKeyword = async (
    page: Page,
    keyword: string
): Promise<void> => {
    const {
        keywordInput,
        searchButton,
    } = getKeywordSearchElements(
        page
    );

    await keywordInput.fill(
        keyword
    );

    await searchButton.click();
};

test.describe(
    "商品キーワード検索",
    () => {
        test.beforeEach(
            async ({ page }) => {
                await openProductSearchPage(
                    page
                );
            }
        );

        /*
         * 1. 初期表示
         */
        test(
            "キーワード検索の入力項目が初期表示される",
            async ({ page }) => {
                const {
                    keywordInput,
                    searchButton,
                    deletedCheckbox,
                } = getKeywordSearchElements(
                    page
                );

                await expect(
                    keywordInput
                ).toBeVisible();

                await expect(
                    searchButton
                ).toBeVisible();

                await expect(
                    deletedCheckbox
                ).toBeVisible();

                await expect(
                    keywordInput
                ).toHaveValue("");

                await expect(
                    deletedCheckbox
                ).not.toBeChecked();

                await expect(
                    searchButton
                ).toBeDisabled();
            }
        );

        /*
         * 2. 完全一致
         */
        test(
            "商品名の完全一致で検索できる",
            async ({ page }) => {
                await searchByKeyword(
                    page,
                    EXACT_PRODUCT_NAME
                );

                const targetCard =
                    getProductCardByName(
                        page,
                        EXACT_PRODUCT_NAME
                    );

                await expect(
                    targetCard
                ).toBeVisible();

                /*
                 * 完全一致検索が1件だけ返す仕様の場合。
                 *
                 * 部分一致検索APIで完全な商品名を入れた結果、
                 * 類似商品も返る仕様なら削除してください。
                 */
                await expect(
                    targetCard
                ).toHaveCount(1);
            }
        );

        /*
         * 3. 部分一致
         */
        test(
            "商品名の部分一致で検索できる",
            async ({ page }) => {
                await searchByKeyword(
                    page,
                    PARTIAL_KEYWORD
                );

                const productCards =
                    getProductCards(page);

                await expect(
                    productCards.first()
                ).toBeVisible();

                const cardCount =
                    await productCards.count();

                expect(
                    cardCount
                ).toBeGreaterThan(0);

                for (
                    let index = 0;
                    index < cardCount;
                    index++
                ) {
                    await expect(
                        productCards.nth(
                            index
                        )
                    ).toContainText(
                        PARTIAL_KEYWORD
                    );
                }
            }
        );

        /*
         * 4. 複数件一致
         */
        test(
            "複数件に一致するキーワードで検索できる",
            async ({ page }) => {
                await searchByKeyword(
                    page,
                    MULTIPLE_MATCH_KEYWORD
                );

                const productCards =
                    getProductCards(page);

                await expect(
                    productCards.first()
                ).toBeVisible();

                await expect
                    .poll(
                        async () =>
                            productCards.count()
                    )
                    .toBeGreaterThan(1);

                const cardCount =
                    await productCards.count();

                for (
                    let index = 0;
                    index < cardCount;
                    index++
                ) {
                    await expect(
                        productCards.nth(
                            index
                        )
                    ).toContainText(
                        MULTIPLE_MATCH_KEYWORD
                    );
                }
            }
        );

        /*
         * 5. 0件
         */
        test(
            "存在しないキーワードでは0件メッセージが表示される",
            async ({ page }) => {
                await searchByKeyword(
                    page,
                    "存在しない商品XYZ999"
                );

                await expect(
                    page.getByText(
                        "商品が見つかりません。",
                        {
                            exact: true,
                        }
                    )
                ).toBeVisible();

                await expect(
                    getProductCards(page)
                ).toHaveCount(0);
            }
        );

        /*
         * 6. 空文字
         */
        test(
            "キーワードが空文字の場合は検索ボタンが無効になる",
            async ({ page }) => {
                const {
                    keywordInput,
                    searchButton,
                } = getKeywordSearchElements(
                    page
                );

                await keywordInput.fill(
                    "テスト"
                );

                await expect(
                    searchButton
                ).toBeEnabled();

                await keywordInput.clear();

                await expect(
                    keywordInput
                ).toHaveValue("");

                await expect(
                    searchButton
                ).toBeDisabled();
            }
        );

        /*
         * 7. 前後空白
         */
        test(
            "前後に空白を含むキーワードでも検索できる",
            async ({ page }) => {
                const {
                    keywordInput,
                    searchButton,
                } = getKeywordSearchElements(
                    page
                );

                await keywordInput.fill(
                    `  ${EXACT_PRODUCT_NAME}  `
                );

                await searchButton.click();

                await expect(
                    getProductCardByName(
                        page,
                        EXACT_PRODUCT_NAME
                    )
                ).toBeVisible();
            }
        );

        /*
         * 8. 通常商品のみ
         */
        test(
            "削除済みチェックなしでは通常商品のみ表示される",
            async ({ page }) => {
                const {
                    deletedCheckbox,
                } = getKeywordSearchElements(
                    page
                );

                await expect(
                    deletedCheckbox
                ).not.toBeChecked();

                await searchByKeyword(
                    page,
                    ACTIVE_PRODUCT_NAME
                );

                const activeCard =
                    getProductCardByName(
                        page,
                        ACTIVE_PRODUCT_NAME
                    );

                await expect(
                    activeCard
                ).toBeVisible();

                /*
                 * data-deletedを付けている場合
                 */
                await expect(
                    activeCard
                ).toHaveAttribute(
                    "data-deleted",
                    "false"
                );

                await expect(
                    getProductCards(page)
                        .locator(
                            '[data-deleted="true"]'
                        )
                ).toHaveCount(0);
            }
        );

        /*
         * 9. 削除済み検索
         */
        test(
            "キーワード入力と削除済みチェックで削除済み商品が表示される",
            async ({ page }) => {
                const {
                    keywordInput,
                    searchButton,
                    deletedCheckbox,
                } = getKeywordSearchElements(
                    page
                );

                await keywordInput.fill(
                    DELETED_PRODUCT_NAME
                );

                await deletedCheckbox.check();

                await expect(
                    deletedCheckbox
                ).toBeChecked();

                await searchButton.click();

                const deletedCard =
                    getProductCardByName(
                        page,
                        DELETED_PRODUCT_NAME
                    );

                await expect(
                    deletedCard
                ).toBeVisible();

                await expect(
                    deletedCard
                ).toHaveAttribute(
                    "data-deleted",
                    "true"
                );
            }
        );

        /*
         * 10. 削除済み商品のボタン
         */
        test(
            "削除済み商品に更新ボタンと削除ボタンが表示されない",
            async ({ page }) => {
                const {
                    keywordInput,
                    searchButton,
                    deletedCheckbox,
                } = getKeywordSearchElements(
                    page
                );

                await keywordInput.fill(
                    DELETED_PRODUCT_NAME
                );

                await deletedCheckbox.check();

                await searchButton.click();

                const deletedCard =
                    getProductCardByName(
                        page,
                        DELETED_PRODUCT_NAME
                    );

                await expect(
                    deletedCard
                ).toBeVisible();

                await expect(
                    deletedCard.getByRole(
                        "button",
                        {
                            name: "更新",
                            exact: true,
                        }
                    )
                ).toHaveCount(0);

                await expect(
                    deletedCard.getByRole(
                        "button",
                        {
                            name: "削除",
                            exact: true,
                        }
                    )
                ).toHaveCount(0);
            }
        );

        /*
         * 11. 削除済みチェック解除
         */
        test(
            "削除済みチェックを外すと通常商品検索へ戻る",
            async ({ page }) => {
                const {
                    keywordInput,
                    searchButton,
                    deletedCheckbox,
                } = getKeywordSearchElements(
                    page
                );

                /*
                 * 削除済み商品を検索する
                 */
                await keywordInput.fill(
                    DELETED_PRODUCT_NAME
                );

                await deletedCheckbox.check();

                await searchButton.click();

                await expect(
                    getProductCardByName(
                        page,
                        DELETED_PRODUCT_NAME
                    )
                ).toBeVisible();

                /*
                 * 通常商品へ切り替える
                 */
                await deletedCheckbox.uncheck();

                await keywordInput.fill(
                    ACTIVE_PRODUCT_NAME
                );

                await searchButton.click();

                await expect(
                    deletedCheckbox
                ).not.toBeChecked();

                const activeCard =
                    getProductCardByName(
                        page,
                        ACTIVE_PRODUCT_NAME
                    );

                await expect(
                    activeCard
                ).toBeVisible();

                await expect(
                    activeCard
                ).toHaveAttribute(
                    "data-deleted",
                    "false"
                );

                await expect(
                    getProductCardByName(
                        page,
                        DELETED_PRODUCT_NAME
                    )
                ).toHaveCount(0);
            }
        );

        /*
         * 12. 連続検索
         */
        test(
            "別のキーワードで再検索すると前回の検索結果が置き換わる",
            async ({ page }) => {
                await searchByKeyword(
                    page,
                    FIRST_SEARCH_PRODUCT_NAME
                );

                const firstCard =
                    getProductCardByName(
                        page,
                        FIRST_SEARCH_PRODUCT_NAME
                    );

                await expect(
                    firstCard
                ).toBeVisible();

                const {
                    keywordInput,
                    searchButton,
                } = getKeywordSearchElements(
                    page
                );

                await keywordInput.fill(
                    SECOND_SEARCH_PRODUCT_NAME
                );

                await searchButton.click();

                const secondCard =
                    getProductCardByName(
                        page,
                        SECOND_SEARCH_PRODUCT_NAME
                    );

                await expect(
                    secondCard
                ).toBeVisible();

                await expect(
                    getProductCardByName(
                        page,
                        FIRST_SEARCH_PRODUCT_NAME
                    )
                ).toHaveCount(0);
            }
        );
    }
);