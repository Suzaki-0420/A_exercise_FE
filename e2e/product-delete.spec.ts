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
  deleteFlg?: number;
  imageUrl?: string;
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
const DELETE_ERROR_MESSAGE = "商品削除E2Eテスト用エラーです。";

/**
 * 削除対象商品のカテゴリ情報。
 */
let targetCategoryName = "";
let targetCategoryUuid = "";

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
 * ProductCardにはdata-testid="product-card"が付与され、
 * 商品名はh3要素で表示される。
 */
const getProductCard = (page: Page, productName: string): Locator => {
  return page.getByTestId("product-card").filter({
    has: page.getByRole("heading", {
      name: productName,
      exact: true,
    }),
  });
};

/**
 * ページネーションを順番に移動し、
 * 指定した商品のカードを探す。
 */
const findProductCardAcrossPages =
  async (
    page: Page,
    productName: string,
  ): Promise<Locator> => {
    /*
   * 現在のページが2ページ目以降でも、
   * 必ず1ページ目から探す。
   */
    await goToFirstProductPage(
      page,
    );

    /*
     * 無限ループ防止のため、
     * 最大50ページまで確認する。
     */
    for (
      let pageNumber = 1;
      pageNumber <= 50;
      pageNumber++
    ) {
      const productCard =
        getProductCard(
          page,
          productName,
        );

      /*
       * 現在のページに対象商品があれば返す。
       */
      if (
        await productCard
          .isVisible()
          .catch(() => false)
      ) {
        return productCard;
      }

      /*
       * ページネーションがbuttonの場合と
       * linkの場合の両方に対応する。
       */
      const nextPageControl =
        page
          .getByRole(
            "button",
            {
              name:
                /次へ|次のページ/,
            },
          )
          .or(
            page.getByRole(
              "link",
              {
                name:
                  /次へ|次のページ/,
              },
            ),
          )
          .first();

      /*
       * 次ページが存在しなければ探索終了。
       */
      if (
        await nextPageControl.count() === 0
      ) {
        break;
      }

      const ariaDisabled =
        await nextPageControl
          .getAttribute(
            "aria-disabled",
          );

      const isDisabled =
        await nextPageControl
          .isDisabled()
          .catch(() => false);

      /*
       * 最終ページなら探索終了。
       */
      if (
        ariaDisabled === "true" ||
        isDisabled
      ) {
        break;
      }

      /*
       * ページ変更を確認するため、
       * 現在の先頭商品の表示内容を保持する。
       */
      const firstCardBefore =
        await page
          .getByTestId(
            "product-card",
          )
          .first()
          .innerText()
          .catch(() => "");

      await nextPageControl.click();

      /*
       * クライアント側ページングでは
       * API通信が発生しないことがあるため、
       * 先頭の商品が変わるまで待つ。
       */
      await expect
        .poll(
          async () => {
            const firstCardAfter =
              await page
                .getByTestId(
                  "product-card",
                )
                .first()
                .innerText()
                .catch(
                  () => "",
                );

            return (
              firstCardAfter !==
              firstCardBefore
            );
          },
          {
            timeout: 10_000,
          },
        )
        .toBe(true);
    }

    throw new Error(
      `ページネーションを最後まで確認しましたが、商品「${productName}」が見つかりませんでした。`,
    );
  };

/**
* 商品一覧を1ページ目へ戻す。
*/
const goToFirstProductPage = async (
  page: Page,
): Promise<void> => {
  const firstPageControl =
    page
      .getByRole(
        "button",
        {
          name: "最初",
          exact: true,
        },
      )
      .or(
        page.getByRole(
          "link",
          {
            name: "最初",
            exact: true,
          },
        ),
      )
      .first();

  /*
   * 1ページしかない場合は、
   * ページネーション自体が表示されない可能性がある。
   */
  if (
    await firstPageControl.count() === 0
  ) {
    return;
  }

  const ariaDisabled =
    await firstPageControl
      .getAttribute(
        "aria-disabled",
      );

  const isDisabled =
    await firstPageControl
      .isDisabled()
      .catch(() => false);

  /*
   * すでに1ページ目なら操作しない。
   */
  if (
    ariaDisabled === "true" ||
    isDisabled
  ) {
    return;
  }

  const firstCardBefore =
    await page
      .getByTestId(
        "product-card",
      )
      .first()
      .innerText()
      .catch(() => "");

  await firstPageControl.click();

  /*
   * ページの表示内容が変わるまで待つ。
   */
  await expect
    .poll(
      async () => {
        const firstCardAfter =
          await page
            .getByTestId(
              "product-card",
            )
            .first()
            .innerText()
            .catch(() => "");

        return (
          firstCardAfter !==
          firstCardBefore
        );
      },
      {
        timeout: 10_000,
      },
    )
    .toBe(true);
};

/**
 * 商品カード内の削除ボタンを取得する。
 */
const getDeleteButton = (productCard: Locator): Locator => {
  return productCard.getByRole("button", {
    name: "削除",
    exact: true,
  });
};

/**
 * 商品削除APIへのリクエストかを判定する。
 *
 * DELETE /proxy-api/product/delete/{productUuid}
 */
const isDeleteProductRequest = (request: Request): boolean => {
  if (request.method() !== "DELETE") {
    return false;
  }

  const pathname = new URL(request.url()).pathname;

  return /\/proxy-api\/product\/delete\/[^/]+$/.test(pathname);
};

/**
 * 商品一覧画面の初回表示で行われる、
 * 「すべてのカテゴリ・通常商品」の検索レスポンスを待つ。
 *
 * ProductSearchではuseEffectから初回検索が開始されるため、
 * その完了前にSelectを開くと、再レンダーによって
 * 選択肢が閉じることがある。
 */
const waitForInitialCategorySearchResponse = (page: Page) => {
  return page.waitForResponse((response) => {
    if (response.request().method() !== "GET") {
      return false;
    }

    const url = new URL(response.url());

    const categoryUuid = url.searchParams.get("productCategoryUuid") ?? "";

    return (
      url.pathname === "/proxy-api/product/category" &&
      categoryUuid === "" &&
      url.searchParams.get("showDeletedOnly") === "false"
    );
  });
};

/**
 * 選択したカテゴリの検索APIレスポンスを待つ。
 *
 * @param page PlaywrightのPage
 * @param showDeletedOnly 削除済みのみ表示するか
 */
const waitForCategorySearchResponse = (
  page: Page,
  showDeletedOnly: boolean,
) => {
  return page.waitForResponse((response) => {
    if (response.request().method() !== "GET") {
      return false;
    }

    const url = new URL(response.url());

    return (
      url.pathname === "/proxy-api/product/category" &&
      url.searchParams.get("productCategoryUuid") === targetCategoryUuid &&
      url.searchParams.get("showDeletedOnly") === String(showDeletedOnly)
    );
  });
};

/**
 * カテゴリ検索タブを表示する。
 */
const openCategorySearchTab = async (page: Page): Promise<void> => {
  const categoryTab = page.getByRole("tab", {
    name: "カテゴリ検索",
    exact: true,
  });

  await expect(categoryTab).toBeVisible();

  if ((await categoryTab.getAttribute("aria-selected")) !== "true") {
    await categoryTab.click();
  }

  await expect(categoryTab).toHaveAttribute("aria-selected", "true");
};

/**
 * カテゴリ検索タブで、
 * E2E商品のカテゴリを選択する。
 */
const selectTargetCategory = async (page: Page): Promise<void> => {
  await openCategorySearchTab(page);

  /**
   * CategorySearchFormのSelectTriggerには
   * aria-label="商品カテゴリ"が設定されている。
   */
  const categorySelect = page.getByRole("combobox", {
    name: "商品カテゴリ",
    exact: true,
  });

  await expect(categorySelect).toBeVisible();

  await expect(categorySelect).toBeEnabled({
    timeout: 15_000,
  });

  const categoryOption = page.getByRole("option", {
    name: targetCategoryName,
    exact: true,
  });

  /**
   * 初回検索やカテゴリ一覧取得の完了直後は、
   * Selectの再レンダーとクリックが競合することがある。
   * 対象optionが表示されるまでSelectを開き直す。
   */
  await expect(async () => {
    if (!(await categoryOption.isVisible().catch(() => false))) {
      await page.keyboard.press("Escape");

      await expect(categorySelect).toBeEnabled({
        timeout: 5_000,
      });

      await categorySelect.click();
    }

    await expect(categoryOption).toBeVisible({
      timeout: 2_000,
    });
  }).toPass({
    timeout: 15_000,
    intervals: [500, 1_000, 2_000],
  });

  /**
   * 選択操作より前にレスポンス待機を登録する。
   */
  const responsePromise = waitForCategorySearchResponse(page, false);

  await categoryOption.click();

  const response = await responsePromise;

  expect(response.ok()).toBe(true);

  /**
   * APIレスポンスにおける対象商品の状態を検証する。
   *
   * 削除前:
   * 通常商品APIにE2E商品が含まれる。
   *
   * 削除後:
   * 通常商品APIにE2E商品が含まれない。
   */
  const categoryProducts: ProductResponse[] = await response.json();

  const containsTargetProduct = categoryProducts.some(
    (product: ProductResponse) => product.name === targetProductName,
  );

  if (deletedByUi) {
    expect(
      containsTargetProduct,
      `削除後の通常商品APIに「${targetProductName}」が残っています。`,
    ).toBe(false);
  } else {
    expect(
      containsTargetProduct,
      `カテゴリ検索APIの結果に「${targetProductName}」が含まれていません。`,
    ).toBe(true);
  }

  const deletedCheckbox = page.getByRole("checkbox", {
    name: "削除済み",
    exact: true,
  });

  await expect(deletedCheckbox).toBeVisible();

  await expect(deletedCheckbox).toBeEnabled();

  await expect(deletedCheckbox).not.toBeChecked();
};

/**
 * 選択中のカテゴリについて、
 * 削除済み商品のみを表示する。
 */
const showDeletedProducts = async (page: Page): Promise<void> => {
  const deletedCheckbox = page.getByRole("checkbox", {
    name: "削除済み",
    exact: true,
  });

  await expect(deletedCheckbox).toBeVisible();

  await expect(deletedCheckbox).toBeEnabled();

  if (await deletedCheckbox.isChecked()) {
    return;
  }

  const responsePromise = waitForCategorySearchResponse(page, true);

  await deletedCheckbox.check();

  const response = await responsePromise;

  expect(response.ok()).toBe(true);

  await expect(deletedCheckbox).toBeChecked();
};

/**
 * 選択中のカテゴリについて、
 * 削除されていない商品を表示する。
 */
const showActiveProducts = async (page: Page): Promise<void> => {
  const deletedCheckbox = page.getByRole("checkbox", {
    name: "削除済み",
    exact: true,
  });

  await expect(deletedCheckbox).toBeVisible();

  await expect(deletedCheckbox).toBeEnabled();

  if (!(await deletedCheckbox.isChecked())) {
    return;
  }

  const responsePromise = waitForCategorySearchResponse(page, false);

  await deletedCheckbox.uncheck();

  const response = await responsePromise;

  expect(response.ok()).toBe(true);

  await expect(deletedCheckbox).not.toBeChecked();
};

/**
 * 商品削除確認モーダルを開く。
 */
const openDeleteDialog = async (
  page: Page,
  productName: string,
): Promise<Locator> => {
  const productCard = getProductCard(page, productName);

  await expect(productCard).toBeVisible();

  const deleteButton = getDeleteButton(productCard);

  await expect(deleteButton).toBeVisible();

  await deleteButton.click();

  /**
   * ProductSearchのモーダルは
   * role="dialog"で実装されている。
   */
  const dialog = page.getByRole("dialog");

  await expect(dialog).toBeVisible();

  return dialog;
};

/**
 * 商品カードに表示されている情報を取得する。
 *
 * 削除前後で変わる操作ボタンは除外する。
 */
const getProductCardInformation = async (
  productCard: Locator,
): Promise<string[]> => {
  const cardText = await productCard.innerText();

  return cardText
    .split(/\r?\n/)
    .map((text) => text.replace(/\s+/g, " ").trim())
    .filter((text) => text.length > 0)
    .filter((text) => !/^(更新|変更|修正|削除)$/.test(text));
};

/**
 * 商品削除のE2Eテスト。
 *
 * 同じE2E専用商品を順番に操作するため、
 * serialで記述順に実行する。
 */
test.describe.serial("商品削除", () => {
  /**
   * beforeEachの初期API待機や、
   * 異常系テストで意図的に通信を停止する処理を含むため、
   * このdescribe内のテストタイムアウトを延長する。
   */
  test.describe.configure({
    timeout: 90_000,
  });

  /**
   * E2Eテスト専用商品を作成する。
   *
   * auth.setup.tsで保存した認証状態を
   * requestフィクスチャも使用する。
   */
  test.beforeAll(async ({ request }) => {
    const productResponse = await request.get(
      "/proxy-api/product/category" + "?showDeletedOnly=false",
    );

    if (!productResponse.ok()) {
      throw new Error(
        "商品一覧の取得に失敗しました。" +
        ` status=${productResponse.status()}` +
        ` body=${await productResponse.text()}`,
      );
    }

    const products: ProductResponse[] = await productResponse.json();

    /**
     * カテゴリ情報を持つ通常商品を1件取得する。
     */
    const sourceProduct: ProductResponse | undefined = products.find(
      (product: ProductResponse) =>
        Boolean(
          product.productCategory?.categoryUuid &&
          product.productCategory?.name,
        ),
    );

    if (!sourceProduct || !sourceProduct.productCategory) {
      throw new Error(
        "テスト商品を登録するための" + "商品カテゴリが見つかりません。",
      );
    }

    /**
     * 削除対象外の比較商品として使用する。
     */
    comparisonProductName = sourceProduct.name;

    targetCategoryName = sourceProduct.productCategory.name;

    targetCategoryUuid = sourceProduct.productCategory.categoryUuid;

    /**
     * 商品名の上限20文字以内で、
     * 実行ごとに異なる名前を作成する。
     */
    targetProductName = `E2E削除${Date.now().toString().slice(-8)}`;

    const registerResponse = await request.post("/proxy-api/product/register", {
      multipart: {
        name: targetProductName,
        price: "1234",
        stock: "7",
        categoryUuid: targetCategoryUuid,
        categoryName: targetCategoryName,
        image: {
          name: "e2e-delete.png",
          mimeType: "image/png",
          buffer: pngBuffer,
        },
      },
    });

    if (!registerResponse.ok()) {
      throw new Error(
        "E2E専用商品の登録に失敗しました。" +
        ` status=${registerResponse.status()}` +
        ` body=${await registerResponse.text()}`,
      );
    }

    const createdProduct: ProductResponse = await registerResponse.json();

    targetProductUuid = createdProduct.productUuid;

    expect(targetProductUuid).not.toBe("");
  });

  /**
   * 正常削除テストより前で失敗した場合も、
   * E2E専用商品を通常一覧に残さない。
   */
  test.afterAll(async ({ request }) => {
    if (!targetProductUuid || deletedByUi) {
      return;
    }

    const deleteResponse = await request.delete(
      `/proxy-api/product/delete/${encodeURIComponent(targetProductUuid)}`,
    );

    /**
     * すでに削除されている404は問題にしない。
     */
    if (!deleteResponse.ok() && deleteResponse.status() !== 404) {
      console.error(
        "E2E専用商品の後始末に失敗しました。",
        await deleteResponse.text(),
      );
    }
  });

  /**
   * 各テストは認証済みの商品一覧画面から開始する。
   */
  test.beforeEach(async ({ page }) => {
    /**
     * page.gotoより前に待機を登録し、
     * ProductSearchのuseEffectによる初回検索を確実に待つ。
     */
    const initialSearchResponsePromise =
      waitForInitialCategorySearchResponse(page);

    await page.goto("/admin/product");

    await expect(page).toHaveURL("/admin/product");

    await expect(
      page.getByRole("heading", {
        name: "商品検索",
        exact: true,
      }),
    ).toBeVisible();

    const initialSearchResponse = await initialSearchResponsePromise;

    expect(
      initialSearchResponse.ok(),
      "商品一覧画面の初回検索に失敗しました。",
    ).toBe(true);

    /**
     * 商品一覧とカテゴリ一覧の読み込みが完了すると、
     * 商品カテゴリSelectが操作可能になる。
     *
     * 「商品を取得しています...」の表示状態は
     * Reactの再描画タイミングで揺れることがあるため、
     * 画面準備完了の判定にはSelectの有効状態を使用する。
     */
    const categorySelect = page.getByRole("combobox", {
      name: "商品カテゴリ",
      exact: true,
    });

    await expect(categorySelect).toBeVisible({
      timeout: 30_000,
    });

    await expect(categorySelect).toBeEnabled({
      timeout: 30_000,
    });
  });

  test("ログイン済みの担当者が商品一覧画面を表示できる", async ({ page }) => {
    const categoryTab = page.getByRole("tab", {
      name: "カテゴリ検索",
      exact: true,
    });

    const keywordTab = page.getByRole("tab", {
      name: "キーワード検索",
      exact: true,
    });

    await expect(categoryTab).toBeVisible();

    await expect(keywordTab).toBeVisible();

    await expect(categoryTab).toHaveAttribute("aria-selected", "true");

    /**
     * 初期表示では「すべてのカテゴリ」が選択されている。
     */
    await expect(
      page.getByRole("combobox", {
        name: "商品カテゴリ",
        exact: true,
      }),
    ).toContainText("すべてのカテゴリ");

    /**
     * カテゴリ未指定時もチェックボックスは表示されるが、
     * 無効で未チェックである。
     */
    const deletedCheckbox = page.getByRole("checkbox", {
      name: "削除済み",
      exact: true,
    });

    await expect(deletedCheckbox).toBeVisible();

    await expect(deletedCheckbox).toBeDisabled();

    await expect(deletedCheckbox).not.toBeChecked();

    await selectTargetCategory(page);

    /**
     * カテゴリ選択後は操作可能になり、
     * 初期状態は未チェックである。
     */
    await expect(deletedCheckbox).toBeEnabled();

    await expect(deletedCheckbox).not.toBeChecked();

    /**
     * 選択カテゴリの商品一覧に、
     * E2E商品が表示される。
     */
    const targetCard = getProductCard(page, targetProductName);

    await expect(targetCard).toBeVisible();

    /**
     * 削除対象商品に削除ボタンが表示される。
     */
    await expect(getDeleteButton(targetCard)).toBeVisible();

    /**
     * 同じカテゴリの比較商品も表示される。
     */
    await expect(getProductCard(page, comparisonProductName)).toBeVisible();
  });

  test("削除ボタンを押すと確認モーダルの内容が正しく表示される", async ({
    page,
  }) => {
    await selectTargetCategory(page);

    const dialog = await openDeleteDialog(page, targetProductName);

    await expect(
      dialog.getByRole("heading", {
        name: "商品削除の確認",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      dialog.getByText("以下の商品を削除しますか？", {
        exact: true,
      }),
    ).toBeVisible();

    /**
     * 削除対象の商品情報が表示される。
     */
    await expect(
      dialog.getByText(targetProductName, {
        exact: true,
      }),
    ).toBeVisible();

    await expect(dialog).toContainText("1,234円");

    await expect(dialog).toContainText(targetCategoryName);

    /**
     * 削除対象ではない商品名は表示されない。
     */
    await expect(
      dialog.getByText(comparisonProductName, {
        exact: true,
      }),
    ).toHaveCount(0);

    await expect(
      dialog.getByRole("button", {
        name: "削除する",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      dialog.getByRole("button", {
        name: "キャンセル",
        exact: true,
      }),
    ).toBeVisible();
  });

  test("確認モーダルでキャンセルすると商品は削除されない", async ({ page }) => {
    await selectTargetCategory(page);

    let deleteRequestCount = 0;

    const countDeleteRequest = (request: Request): void => {
      if (isDeleteProductRequest(request)) {
        deleteRequestCount++;
      }
    };

    page.on("request", countDeleteRequest);

    const dialog = await openDeleteDialog(page, targetProductName);

    await dialog
      .getByRole("button", {
        name: "キャンセル",
        exact: true,
      })
      .click();

    await expect(dialog).toBeHidden();

    expect(deleteRequestCount).toBe(0);

    await expect(getProductCard(page, targetProductName)).toBeVisible();

    await showDeletedProducts(page);

    await expect(getProductCard(page, targetProductName)).toHaveCount(0);

    page.off("request", countDeleteRequest);
  });

  test("削除処理中は二重送信されず、失敗時はエラーが表示される", async ({
    page,
  }) => {
    await selectTargetCategory(page);

    const routePattern = "**/proxy-api/product/delete/**";

    let releaseRequest: (() => void) | undefined;

    let notifyRequestStarted: (() => void) | undefined;

    const requestGate = new Promise<void>((resolve) => {
      releaseRequest = resolve;
    });

    /**
     * DELETEリクエストがrouteへ到達したことを
     * 明示的に待つためのPromise。
     */
    const requestStarted = new Promise<void>((resolve) => {
      notifyRequestStarted = resolve;
    });

    let deleteRequestCount = 0;

    /**
     * DELETE APIを一時停止し、
     * 削除処理中の画面状態を確認した後で
     * 500エラーを返す。
     */
    await page.route(routePattern, async (route) => {
      deleteRequestCount++;

      notifyRequestStarted?.();

      await requestGate;

      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          message: DELETE_ERROR_MESSAGE,
        }),
      });
    });

    try {
      const dialog = await openDeleteDialog(page, targetProductName);

      const confirmDeleteButton = dialog.getByRole("button", {
        name: "削除する",
        exact: true,
      });

      await expect(confirmDeleteButton).toBeVisible();

      await confirmDeleteButton.click();

      /**
       * DELETEリクエストがrouteへ到達するまで待つ。
       */
      await requestStarted;

      /**
       * 削除中は文言が「削除中...」へ変わり、
       * 削除・キャンセルの両方が無効になる。
       */
      const deletingButton = dialog.getByRole("button", {
        name: "削除中...",
        exact: true,
      });

      await expect(deletingButton).toBeVisible({
        timeout: 10_000,
      });

      await expect(deletingButton).toBeDisabled();

      await expect(
        dialog.getByRole("button", {
          name: "キャンセル",
          exact: true,
        }),
      ).toBeDisabled();

      /**
       * 削除APIは1回だけ呼ばれる。
       */
      expect(deleteRequestCount).toBe(1);

      /**
       * 停止していたAPIを500エラーで完了させる。
       */
      releaseRequest?.();

      /**
       * Repositoryから伝播したエラーが
       * モーダル内に表示される。
       */
      await expect(dialog.getByRole("alert")).toContainText(
        DELETE_ERROR_MESSAGE,
        {
          timeout: 10_000,
        },
      );

      /**
       * 失敗時は削除対象が保持されるため、
       * モーダルは閉じない。
       */
      await expect(dialog).toBeVisible();

      /**
       * 削除処理終了後は、
       * 再び削除操作ができる状態へ戻る。
       */
      await expect(
        dialog.getByRole("button", {
          name: "削除する",
          exact: true,
        }),
      ).toBeEnabled();

      expect(deleteRequestCount).toBe(1);
    } finally {
      /**
       * 途中の検証で失敗しても、
       * 待機中のrouteを必ず解放して解除する。
       */
      releaseRequest?.();

      await page.unroute(routePattern);
    }

    /**
     * 実APIで再取得しても商品は削除されていない。
     */
    await page.reload();

    await selectTargetCategory(page);

    await expect(getProductCard(page, targetProductName)).toBeVisible();

    await showDeletedProducts(page);

    await expect(getProductCard(page, targetProductName)).toHaveCount(0);
  });

  test("商品を正常に論理削除し削除済み一覧で確認できる", async ({ page }) => {
    await selectTargetCategory(page);

    const targetCardBeforeDelete = getProductCard(page, targetProductName);

    await expect(targetCardBeforeDelete).toBeVisible();

    const informationBeforeDelete = await getProductCardInformation(
      targetCardBeforeDelete,
    );

    expect(informationBeforeDelete.length).toBeGreaterThan(0);

    const dialog = await openDeleteDialog(page, targetProductName);

    let deleteRequestCount = 0;

    const countDeleteRequest = (request: Request): void => {
      if (isDeleteProductRequest(request)) {
        deleteRequestCount++;
      }
    };

    page.on("request", countDeleteRequest);

    const deleteResponsePromise = page.waitForResponse((response) =>
      isDeleteProductRequest(response.request()),
    );

    await dialog
      .getByRole("button", {
        name: "削除する",
        exact: true,
      })
      .click();

    const deleteResponse = await deleteResponsePromise;

    expect(deleteResponse.ok()).toBe(true);

    await expect.poll(() => deleteRequestCount).toBe(1);

    deletedByUi = true;

    await expect(dialog).toBeHidden();

    /**
     * この検証にはProductSearch側で
     * isDeleteToastVisibleを描画する実装が必要。
     */
    await expect(
      page.getByText("商品を削除しました。", {
        exact: true,
      }),
    ).toBeVisible();

    await expect(getProductCard(page, targetProductName)).toHaveCount(0);

    await expect(getProductCard(page, comparisonProductName)).toBeVisible();

    await showDeletedProducts(page);

    const deletedProductCard =
      await findProductCardAcrossPages(
        page,
        targetProductName,
      );

    await expect(
      deletedProductCard,
    ).toBeVisible({
      timeout: 10_000,
    });

    await expect(
      deletedProductCard.getByRole("heading", {
        name: targetProductName,
        exact: true,
      }),
    ).toBeVisible();

    /**
     * 削除済みカードでは更新・削除ボタンが表示されない。
     */
    await expect(
      deletedProductCard.getByRole("button", {
        name: "更新",
        exact: true,
      }),
    ).toHaveCount(0);

    await expect(
      deletedProductCard.getByRole("button", {
        name: "削除",
        exact: true,
      }),
    ).toHaveCount(0);

    await expect(getProductCard(page, comparisonProductName)).toHaveCount(0);

    /**
     * 削除前の商品情報が削除後も保持されている。
     */
    for (const information of informationBeforeDelete) {
      await expect(deletedProductCard).toContainText(information);
    }

    /**
     * data-deleted属性も削除済み状態を表している。
     */
    await expect(deletedProductCard).toHaveAttribute("data-deleted", "true");

    /**
     * 再読み込み後も削除済み状態が保持される。
     */
    await page.reload();

    await selectTargetCategory(page);
    await showDeletedProducts(page);

    const reloadedDeletedProductCard =
      await findProductCardAcrossPages(
        page,
        targetProductName,
      );

    await expect(
      reloadedDeletedProductCard,
    ).toBeVisible({
      timeout: 10_000,
    });

    await expect(
      reloadedDeletedProductCard,
    ).toHaveAttribute(
      "data-deleted",
      "true",
    );

    /**
     * 通常表示へ戻すと削除した商品は表示されない。
     */
    await showActiveProducts(page);

    /*
     * 比較商品がどのページにあるか分からないため、
     * 1ページ目から順番に探す。
     */
    const comparisonProductCard =
      await findProductCardAcrossPages(
        page,
        comparisonProductName,
      );

    await expect(
      comparisonProductCard,
    ).toBeVisible({
      timeout: 10_000,
    });

    page.off("request", countDeleteRequest);
  });
});

/**
 * 未ログイン状態の商品削除テスト。
 *
 * auth.setup.tsで保存された認証状態を、
 * このdescribe内だけ空の状態で上書きする。
 */
test.describe("商品削除・未ログイン", () => {
  test.use({
    storageState: {
      cookies: [],
      origins: [],
    },
  });

  test("未ログイン状態では商品削除機能を利用できない", async ({ page }) => {
    await page.goto("/admin/product");

    await expect(page).toHaveURL(/\/admin\/login/);

    await expect(page.getByTestId("product-card")).toHaveCount(0);

    await expect(
      page.getByRole("button", {
        name: "削除",
        exact: true,
      }),
    ).toHaveCount(0);
  });
});
