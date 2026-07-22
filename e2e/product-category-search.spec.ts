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

/**
 * テストで使用するカテゴリ名
 *
 * 実際に商品が登録されているカテゴリへ
 * 変更してください。
 */
const TEST_CATEGORY_NAME =
    "筆記具";

/**
 * カテゴリ検索画面を開く
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
     * 初期の商品取得が終わるまで待つ。
     */
    await expect(
        page.getByTestId(
            "product-card"
        ).first()
    ).toBeVisible({
        timeout: 15_000,
    });
};

/**
 * 商品カード一覧を取得する
 */
const getProductCards = (
    page: Page
): Locator => {
    return page.getByTestId(
        "product-card"
    );
};

/**
 * 指定したカテゴリの商品カードを取得する
 */
const getCardsByCategory = (
    page: Page,
    categoryName: string
): Locator => {
    return getProductCards(
        page
    ).filter({
        hasText: categoryName,
    });
};

/**
 * カテゴリを選択する
 */
const selectCategory = async (
    page: Page,
    categoryName: string
): Promise<void> => {
    const categorySelect =
        page.getByRole(
            "combobox",
            {
                name: "商品カテゴリ",
            }
        );

    await expect(
        categorySelect
    ).toBeEnabled();

    await categorySelect.click();

    const categoryOption =
        page.getByRole(
            "option",
            {
                name: categoryName,
                exact: true,
            }
        );

    await expect(
        categoryOption
    ).toBeVisible();

    await categoryOption.click();

    await expect(
        categorySelect
    ).toContainText(
        categoryName
    );
};

test.describe(
    "商品カテゴリ検索",
    () => {
        test.beforeEach(
            async ({ page }) => {
                await openProductSearchPage(
                    page
                );
            }
        );

        test(
            "ページを開いたときはすべての商品が表示される",
            async ({ page }) => {
                const categorySelect =
                    page.getByLabel(
                        "商品カテゴリ"
                    );

                /*
                 * 初期状態が「すべてのカテゴリ」であることを確認
                 */
                await expect(
                    categorySelect
                ).toContainText(
                    "すべてのカテゴリ"
                );

                const productCards =
                    getProductCards(page);

                /*
                 * 商品が1件以上表示されることを確認
                 */
                await expect(
                    productCards.first()
                ).toBeVisible();

                expect(
                    await productCards.count()
                ).toBeGreaterThan(0);
            }
        );

        test(
            "カテゴリを選択するとそのカテゴリの商品だけが表示される",
            async ({ page }) => {
                await selectCategory(
                    page,
                    TEST_CATEGORY_NAME
                );

                const productCards =
                    getProductCards(page);

                /*
                 * 検索結果が表示されるまで待つ
                 */
                await expect(
                    productCards.first()
                ).toBeVisible({
                    timeout: 15_000,
                });

                const cardCount =
                    await productCards.count();

                expect(
                    cardCount
                ).toBeGreaterThan(0);

                /*
                 * 表示された全カードに
                 * 選択カテゴリ名が含まれることを確認
                 */
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
                        TEST_CATEGORY_NAME
                    );
                }
            }
        );

        test(
            "カテゴリを選択して削除済みのみを有効にするとそのカテゴリの削除済み商品が表示される",
            async ({ page }) => {
                await selectCategory(
                    page,
                    TEST_CATEGORY_NAME
                );

                const deletedCheckbox =
                    page.getByRole(
                        "checkbox",
                        {
                            name:
                                "削除済み",
                        }
                    );

                await deletedCheckbox.check();

                await expect(
                    deletedCheckbox
                ).toBeChecked();

                const deletedCards =
                    getProductCards(
                        page
                    );

                await expect(
                    deletedCards.first()
                ).toBeVisible({
                    timeout: 15_000,
                });

                const cardCount =
                    await deletedCards.count();

                expect(
                    cardCount
                ).toBeGreaterThan(0);

                /*
                 * 表示された全商品が
                 * 選択カテゴリに属していることを確認
                 */
                for (
                    let index = 0;
                    index < cardCount;
                    index++
                ) {
                    const card =
                        deletedCards.nth(
                            index
                        );

                    await expect(
                        card
                    ).toContainText(
                        TEST_CATEGORY_NAME
                    );

                    /*
                     * data-deleted属性を付けている場合
                     */
                    await expect(
                        card
                    ).toHaveAttribute(
                        "data-deleted",
                        "true"
                    );
                }
            }
        );

        test(
            "削除済み商品には更新ボタンと削除ボタンが表示されない",
            async ({ page }) => {
                await selectCategory(
                    page,
                    TEST_CATEGORY_NAME
                );

                const deletedCheckbox =
                    page.getByRole(
                        "checkbox",
                        {
                            name:
                                "削除済み",
                        }
                    );

                await deletedCheckbox.check();

                const deletedCards =
                    getProductCards(
                        page
                    );

                await expect(
                    deletedCards.first()
                ).toBeVisible({
                    timeout: 15_000,
                });

                const cardCount =
                    await deletedCards.count();

                expect(
                    cardCount
                ).toBeGreaterThan(0);

                /*
                 * 各削除済み商品カードの中に
                 * 更新・削除ボタンが存在しないことを確認
                 */
                for (
                    let index = 0;
                    index < cardCount;
                    index++
                ) {
                    const card =
                        deletedCards.nth(
                            index
                        );

                    await expect(
                        card.getByRole(
                            "button",
                            {
                                name: "更新",
                                exact: true,
                            }
                        )
                    ).toHaveCount(0);

                    await expect(
                        card.getByRole(
                            "button",
                            {
                                name: "削除",
                                exact: true,
                            }
                        )
                    ).toHaveCount(0);
                }
            }
        );
    }
);