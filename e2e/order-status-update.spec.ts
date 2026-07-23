import { expect, test, type Locator, type Page } from "@playwright/test";

test.use({
  storageState: "e2e/.auth/admin.json",
});

/**
 * 購入履歴検索画面のURL
 */
const ORDER_HISTORY_URL = "/admin/order/search";

/**
 * 注文ステータス更新APIのURL
 *
 * 実際のURLに合わせて変更してください。
 */
const ORDER_STATUS_UPDATE_API_PATTERN = "**/proxy-api/order/**";

/**
 * DBを実際に更新するE2Eテストを
 * 実行するかどうか
 */
const SHOULD_RUN_MUTATION_TESTS =
  process.env.RUN_ORDER_STATUS_MUTATION_E2E === "true";

/**
 * 注文ステータス
 */
const ORDER_STATUS = {
  reception: "受付",
  paymentWaiting: "支払待ち",
  shipped: "発送済み",
} as const;

/**
 * テスト対象の注文
 *
 * 実際のテストDBに登録されている
 * 注文情報に合わせてください。
 */
const TARGET_ORDER = {
  orderUuid: "50000000-0000-0000-0000-000000000002",

  orderDate: "2026/7/14 13:20:00",

  customerAccountName: "sato_kenta",

  currentStatus: ORDER_STATUS.paymentWaiting,

  newStatus: ORDER_STATUS.shipped,

  orderDetails: [
    {
      productName: "クリアファイル",
      quantity: 2,
    },
    {
      productName: "無線キーボード",
      quantity: 1,
    },
    {
      productName: "事務用はさみ",
      quantity: 1,
    },
  ],
};

/**
 * 更新対象以外の注文
 *
 * 「ほかの注文が変更されない」ことを
 * 確認するために使用します。
 */
const OTHER_ORDER = {
  orderUuid: "50000000-0000-0000-0000-000000000001",

  currentStatus: ORDER_STATUS.reception,
};

/**
 * 購入履歴検索画面を開く
 */
const openOrderHistoryPage = async (page: Page): Promise<void> => {
  await page.goto(ORDER_HISTORY_URL);

  await expect(
    page.getByText("購入履歴検索", {
      exact: true,
    }),
  ).toBeVisible();

  /**
   * 対象注文が一覧に表示されるまで待つ。
   */
  await expect(page.getByText(new RegExp(TARGET_ORDER.orderUuid))).toBeVisible({
    timeout: 15_000,
  });
};

/**
 * UUIDを指定して注文行を取得する
 */
const getOrderRowByUuid = (page: Page, orderUuid: string): Locator => {
  return page.locator("tbody tr").filter({
    hasText: orderUuid,
  });
};

/**
 * テスト対象の注文行を取得する
 */
const getTargetOrderRow = (page: Page): Locator => {
  return getOrderRowByUuid(page, TARGET_ORDER.orderUuid);
};

/**
 * 対象注文の更新リンクを取得する
 */
const getTargetUpdateLink = (page: Page): Locator => {
  return getTargetOrderRow(page).getByRole("link", {
    name: "更新",
    exact: true,
  });
};

/**
 * 購入履歴一覧から
 * 注文ステータス更新画面を開く
 */
const openOrderStatusUpdatePage = async (page: Page): Promise<void> => {
  await openOrderHistoryPage(page);

  const targetOrderRow = getTargetOrderRow(page);

  await expect(targetOrderRow).toHaveCount(1);

  const updateLink = getTargetUpdateLink(page);

  await expect(updateLink).toBeVisible();

  await updateLink.click();

  await expect(
    page.getByRole("heading", {
      name: "注文ステータス更新（入力）",
      exact: true,
    }),
  ).toBeVisible();
};

/**
 * 新しいステータスの選択欄
 */
const getNewStatusSelect = (page: Page): Locator => {
  return page.getByLabel("新しいステータス");
};

/**
 * 入力画面の確認ボタン
 */
const getConfirmButton = (page: Page): Locator => {
  return page.getByRole("button", {
    name: "確認",
    exact: true,
  });
};

/**
 * 入力画面のキャンセルボタン
 */
const getCancelButton = (page: Page): Locator => {
  return page.getByRole("button", {
    name: "キャンセル",
    exact: true,
  });
};

/**
 * 新しいステータスを選択する
 */
const selectNewStatus = async (
  page: Page,
  statusName: string,
): Promise<void> => {
  const statusSelect = getNewStatusSelect(page);

  const statusOption = statusSelect.getByRole("option", {
    name: statusName,
    exact: true,
  });

  const optionValue = await statusOption.getAttribute("value");

  if (optionValue === null || optionValue === "") {
    throw new Error(`${statusName}のvalueを取得できませんでした。`);
  }

  await statusSelect.selectOption(optionValue);

  await expect(statusSelect).toHaveValue(optionValue);
};

/**
 * 確認モーダルを取得する
 */
const getConfirmationArea = (page: Page): Locator => {
  return page.getByRole("dialog", {
    name: "注文ステータス更新（確認）",
  });
};

/**
 * 確認画面を開く
 */
const openConfirmationArea = async (
  page: Page,
  newStatus: string = TARGET_ORDER.newStatus,
): Promise<Locator> => {
  await selectNewStatus(page, newStatus);

  await expect(getConfirmButton(page)).toBeEnabled();

  await getConfirmButton(page).click();

  const confirmationArea = getConfirmationArea(page);

  await expect(confirmationArea).toBeVisible();

  return confirmationArea;
};

/**
 * 確認画面の戻るボタン
 *
 * 実際のボタン名に応じて
 * 正規表現を調整してください。
 */
const getConfirmationBackButton = (page: Page): Locator => {
  return getConfirmationArea(page).getByRole("button", {
    name: /^(戻る|修正する|キャンセル)$/,
  });
};

/**
 * 確認画面の確定ボタン
 *
 * 実際のボタン名に応じて
 * 正規表現を調整してください。
 */
const getFinalUpdateButton = (page: Page): Locator => {
  return getConfirmationArea(page).getByRole("button", {
    name: /^(更新|確定|変更する)$/,
  });
};

/**
 * 現在のステータス表示領域
 */
const getCurrentStatusArea = (page: Page): Locator => {
  return page
    .getByText("現在のステータス", {
      exact: true,
    })
    .locator("..");
};

/**
 * 更新リクエストかどうかを判定する
 */
const isStatusUpdateRequest = (request: {
  method(): string;
  url(): string;
}): boolean => {
  const method = request.method();

  return (
    (method === "POST" || method === "PUT" || method === "PATCH") &&
    request.url().includes("/order")
  );
};

/**
 * 更新確認画面まで進む
 */
const openUpdateConfirmation = async (page: Page): Promise<Locator> => {
  await openOrderStatusUpdatePage(page);

  return await openConfirmationArea(page);
};

/**
 * 更新を確定する
 */
const executeStatusUpdate = async (page: Page): Promise<void> => {
  await openUpdateConfirmation(page);

  await getFinalUpdateButton(page).click();
};

test.describe("注文ステータス更新", () => {
  /**
   * 1.
   * 更新画面への遷移
   */
  test("更新ボタンを押すと選択した注文の更新画面へ遷移する", async ({
    page,
  }) => {
    await openOrderHistoryPage(page);

    await expect(getTargetUpdateLink(page)).toBeVisible();

    await getTargetUpdateLink(page).click();

    await expect(
      page.getByRole("heading", {
        name: "注文ステータス更新（入力）",
        exact: true,
      }),
    ).toBeVisible();
  });

  /**
   * 2.
   * 選択した注文情報の表示
   */
  test("更新画面に選択した注文の情報が表示される", async ({ page }) => {
    await openOrderStatusUpdatePage(page);

    await expect(
      page.getByText(TARGET_ORDER.orderUuid, {
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page.getByText(TARGET_ORDER.orderDate, {
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page.getByText(TARGET_ORDER.customerAccountName, {
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      getCurrentStatusArea(page).getByText(TARGET_ORDER.currentStatus, {
        exact: true,
      }),
    ).toBeVisible();

    for (const detail of TARGET_ORDER.orderDetails) {
      await expect(
        page.getByText(detail.productName, {
          exact: false,
        }),
      ).toBeVisible();
    }
  });

  /**
   * 3.
   * 初期状態
   */
  test("初期状態ではステータスが未選択で確認ボタンが無効である", async ({
    page,
  }) => {
    await openOrderStatusUpdatePage(page);

    await expect(getNewStatusSelect(page)).toHaveValue("0");

    await expect(getConfirmButton(page)).toBeDisabled();
  });

  /**
   * 4.
   * ステータス選択
   */
  test("新しいステータスを選択すると確認ボタンが有効になる", async ({
    page,
  }) => {
    await openOrderStatusUpdatePage(page);

    await selectNewStatus(page, TARGET_ORDER.newStatus);

    await expect(getConfirmButton(page)).toBeEnabled();
  });

  /**
   * 5.
   * 確認画面への遷移
   */
  test("確認ボタンを押すと確認画面が表示される", async ({ page }) => {
    await openOrderStatusUpdatePage(page);

    const confirmationArea = await openConfirmationArea(page);

    await expect(confirmationArea).toBeVisible();
  });

  /**
   * 6.
   * 変更前・変更後ステータスの表示
   */
  test("確認画面に変更前と変更後のステータスが表示される", async ({ page }) => {
    const confirmationArea = await openUpdateConfirmation(page);

    await expect(
      confirmationArea.getByText(TARGET_ORDER.currentStatus, {
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      confirmationArea.getByText(TARGET_ORDER.newStatus, {
        exact: true,
      }),
    ).toBeVisible();
  });

  /**
   * 7.
   * 確認画面から戻った場合の値保持
   */
  test("確認画面から戻ると入力画面へ戻り選択値が維持される", async ({
    page,
  }) => {
    await openUpdateConfirmation(page);

    await getConfirmationBackButton(page).click();

    await expect(
      page.getByRole("heading", {
        name: "注文ステータス更新（入力）",
        exact: true,
      }),
    ).toBeVisible();

    const selectedOption = getNewStatusSelect(page).locator("option:checked");

    await expect(selectedOption).toHaveText(TARGET_ORDER.newStatus);
  });

  /**
   * 8.
   * キャンセル処理
   */
  test("キャンセルすると一覧へ戻り注文ステータスは更新されない", async ({
    page,
  }) => {
    await openOrderStatusUpdatePage(page);

    await selectNewStatus(page, TARGET_ORDER.newStatus);

    await getCancelButton(page).click();

    await expect(
      page.getByText("購入履歴検索", {
        exact: true,
      }),
    ).toBeVisible();

    const targetOrderRow = getTargetOrderRow(page);

    await expect(targetOrderRow).toContainText(TARGET_ORDER.currentStatus);

    await expect(targetOrderRow).not.toContainText(TARGET_ORDER.newStatus);
  });

  /**
   * 9.
   * 現在と同じステータスへの更新防止
   *
   * 現在と同じ状態を選択できない仕様なら、
   * optionが存在しないことを確認する形に
   * 変更してください。
   */
  test("現在と同じステータスを選択した場合は確認できない", async ({ page }) => {
    await openOrderStatusUpdatePage(page);

    await selectNewStatus(page, TARGET_ORDER.currentStatus);

    await expect(getConfirmButton(page)).toBeDisabled();
  });

  /**
   * 10.
   * 確認画面の注文ID
   */
  test("確認画面に更新対象の注文IDが表示される", async ({ page }) => {
    const confirmationArea = await openUpdateConfirmation(page);

    await expect(
      confirmationArea.getByText(new RegExp(TARGET_ORDER.orderUuid)),
    ).toBeVisible();
  });
});

test.describe("注文ステータス更新の正常終了", () => {
  /**
   * DBを書き換えるテストなので、
   * 環境変数を指定した場合のみ実行する。
   */
  test.beforeEach(() => {
    test.skip(
      !SHOULD_RUN_MUTATION_TESTS,
      "DBを更新するため、RUN_ORDER_STATUS_MUTATION_E2E=trueの場合のみ実行します。",
    );
  });

  /**
   * 11.
   * 更新成功・一覧反映・永続化
   *
   * 更新を1回だけ実施し、
   * 一覧反映と再読み込み後の状態まで
   * まとめて確認する。
   */
  test("確定すると対象注文が更新され再読み込み後も維持される", async ({
    page,
  }) => {
    await executeStatusUpdate(page);

    await expect(
      page.getByText("購入履歴検索", {
        exact: true,
      }),
    ).toBeVisible({
      timeout: 15_000,
    });

    let targetOrderRow = getTargetOrderRow(page);

    await expect(targetOrderRow).toContainText(TARGET_ORDER.newStatus);

    await page.reload();

    targetOrderRow = getTargetOrderRow(page);

    await expect(targetOrderRow).toContainText(TARGET_ORDER.newStatus);
  });

  /**
   * 12.
   * 対象以外の注文は変更されない
   *
   * このテストを実行する前に、
   * TARGET_ORDERが更新前の状態であることが
   * 必要です。
   */
  test("対象注文を更新してもほかの注文は変更されない", async ({ page }) => {
    await openOrderHistoryPage(page);

    const otherOrderRow = getOrderRowByUuid(page, OTHER_ORDER.orderUuid);

    await expect(otherOrderRow).toContainText(OTHER_ORDER.currentStatus);

    await executeStatusUpdate(page);

    const updatedOtherOrderRow = getOrderRowByUuid(page, OTHER_ORDER.orderUuid);

    await expect(updatedOtherOrderRow).toContainText(OTHER_ORDER.currentStatus);
  });
});
