import { expect, test, type Page, type Response } from "@playwright/test";

/**
 * UC015 購入履歴検索APIのレスポンス
 */
type OrderSearchItem = {
  orderUuid: string;
  orderDate: string;
  customerAccountName: string;
  orderContent: string;
  orderStatus: string;
  statusUpdateUrl: string;
};

type SearchOrdersResponse = {
  orderList: OrderSearchItem[];
  message: string | null;
};

const ORDER_SEARCH_PATH = "/proxy-api/order/search";

const ORDER_SEARCH_RESULT_PATH = "/proxy-api/order/search/result";

const ORDER_ROWS_PER_PAGE = 10;

test.use({
  storageState: "e2e/.auth/admin.json",
});

/**
 * 指定した購入履歴APIのレスポンスを待つ
 */
const waitForOrderResponse = (
  page: Page,
  pathname: string,
): Promise<Response> => {
  return page.waitForResponse((response) => {
    const url = new URL(response.url());

    return url.pathname === pathname && response.request().method() === "GET";
  });
};

/**
 * 購入履歴検索画面を開き、初期表示データを返す
 */
const openOrderSearchPage = async (page: Page): Promise<OrderSearchItem[]> => {
  const responsePromise = waitForOrderResponse(page, ORDER_SEARCH_PATH);

  await page.goto("/admin/order/search");

  await expect(
    page.getByRole("heading", {
      name: "購入履歴検索",
      exact: true,
    }),
  ).toBeVisible();

  const response = await responsePromise;

  expect(response.ok()).toBe(true);

  const responseData = (await response.json()) as SearchOrdersResponse;

  await expect(
    page.getByText(
      responseData.orderList.length === 0
        ? "注文が登録されていません。"
        : `${responseData.orderList.length}件の購入履歴があります。`,
      { exact: true },
    ),
  ).toBeVisible();

  return responseData.orderList;
};

/**
 * APIの購入日時から日付入力欄へ設定できる値を取得する
 */
const toDateInputValue = (orderDate: string): string | null => {
  const matchedDate = orderDate.match(/\d{4}[-/]\d{2}[-/]\d{2}/);

  return matchedDate ? matchedDate[0].replaceAll("/", "-") : null;
};

/**
 * 検索を実行してレスポンスを返す
 */
const searchOrders = async (
  page: Page,
): Promise<{
  response: Response;
  responseData: SearchOrdersResponse;
}> => {
  const responsePromise = waitForOrderResponse(page, ORDER_SEARCH_RESULT_PATH);

  await page
    .getByRole("button", {
      name: "検索",
      exact: true,
    })
    .click();

  const response = await responsePromise;

  expect(response.ok()).toBe(true);

  const responseData = (await response.json()) as SearchOrdersResponse;

  return {
    response,
    responseData,
  };
};

/**
 * 一覧の1ページ目にAPIレスポンスの先頭10件が表示されることを確認する
 */
const expectResultRows = async (
  page: Page,
  orders: OrderSearchItem[],
): Promise<void> => {
  await expect(page.locator("tbody tr")).toHaveCount(
    Math.min(orders.length, ORDER_ROWS_PER_PAGE),
  );

  if (orders.length > 0) {
    await expect(
      page.locator("tbody tr").filter({
        hasText: orders[0].orderUuid,
      }),
    ).toBeVisible();
  }
};

test.describe("UC015 購入履歴検索", () => {
  test("初期表示で全購入履歴と検索項目を表示する", async ({ page }) => {
    const orders = await openOrderSearchPage(page);

    await expect(page.getByLabel("購入日", { exact: true })).toBeVisible();

    await expect(
      page.getByLabel("顧客アカウント名", { exact: true }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", {
        name: "検索",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("columnheader", { name: "購入日時" }),
    ).toBeVisible();

    await expect(
      page.getByRole("columnheader", {
        name: "顧客アカウント名",
      }),
    ).toBeVisible();

    await expectResultRows(page, orders);
  });

  test("購入日のみで検索できる", async ({ page }) => {
    const orders = await openOrderSearchPage(page);

    const searchTarget = orders.find(
      (order) => toDateInputValue(order.orderDate) !== null,
    );

    test.skip(!searchTarget, "検索に使用できる購入履歴がありません。");

    const orderDate = toDateInputValue(searchTarget!.orderDate)!;

    await page.getByLabel("購入日", { exact: true }).fill(orderDate);

    const { response, responseData } = await searchOrders(page);

    const requestUrl = new URL(response.url());

    expect(requestUrl.searchParams.get("orderDate")).toBe(orderDate);

    expect(requestUrl.searchParams.has("customerAccountName")).toBe(false);

    await expectResultRows(page, responseData.orderList);
  });

  test("顧客アカウント名のみで検索できる", async ({ page }) => {
    const orders = await openOrderSearchPage(page);

    const searchTarget = orders.find(
      (order) => order.customerAccountName.trim() !== "",
    );

    test.skip(!searchTarget, "検索に使用できる購入履歴がありません。");

    const customerAccountName = searchTarget!.customerAccountName;

    await page
      .getByLabel("顧客アカウント名", { exact: true })
      .fill(customerAccountName);

    const { response, responseData } = await searchOrders(page);

    const requestUrl = new URL(response.url());

    expect(requestUrl.searchParams.get("customerAccountName")).toBe(
      customerAccountName,
    );

    expect(requestUrl.searchParams.has("orderDate")).toBe(false);

    await expectResultRows(page, responseData.orderList);
  });

  test("購入日と顧客アカウント名を組み合わせて検索できる", async ({ page }) => {
    const orders = await openOrderSearchPage(page);

    const searchTarget = orders.find(
      (order) =>
        toDateInputValue(order.orderDate) !== null &&
        order.customerAccountName.trim() !== "",
    );

    test.skip(!searchTarget, "検索に使用できる購入履歴がありません。");

    const orderDate = toDateInputValue(searchTarget!.orderDate)!;

    const customerAccountName = searchTarget!.customerAccountName;

    await page.getByLabel("購入日", { exact: true }).fill(orderDate);

    await page
      .getByLabel("顧客アカウント名", { exact: true })
      .fill(customerAccountName);

    const { response, responseData } = await searchOrders(page);

    const requestUrl = new URL(response.url());

    expect(requestUrl.searchParams.get("orderDate")).toBe(orderDate);

    expect(requestUrl.searchParams.get("customerAccountName")).toBe(
      customerAccountName,
    );

    await expectResultRows(page, responseData.orderList);
  });

  test("該当注文がない場合はデータがないことを表すメッセージを表示する", async ({
    page,
  }) => {
    await openOrderSearchPage(page);

    const accountName = `NoData${Date.now().toString().slice(-10)}`;

    await page
      .getByLabel("顧客アカウント名", { exact: true })
      .fill(accountName);

    const { responseData } = await searchOrders(page);

    expect(responseData.orderList).toHaveLength(0);

    await expect(
      page.getByText("検索条件に一致する購入履歴はありません。", {
        exact: true,
      }),
    ).toBeVisible();
  });

  test("注文取得エラーでは仕様書のメッセージを表示する", async ({ page }) => {
    await page.route(`**${ORDER_SEARCH_PATH}`, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          message: "注文情報の取得に失敗しました",
        }),
      });
    });

    await page.goto("/admin/order/search");

    await expect(
      page.getByText("注文情報の取得に失敗しました", { exact: true }),
    ).toBeVisible();
  });

  test("購入履歴を1ページ10件で表示する", async ({ page }) => {
    const orders = Array.from({ length: 11 }, (_, index): OrderSearchItem => ({
      orderUuid: `e2e-order-${index + 1}`,
      orderDate: "2026-07-22 10:00",
      customerAccountName: `e2e-user-${index + 1}`,
      orderContent: `E2E注文${index + 1}`,
      orderStatus: "注文済",
      statusUpdateUrl: `/admin/order/status/update/e2e-order-${index + 1}`,
    }));

    await page.route(`**${ORDER_SEARCH_PATH}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          orderList: orders,
          message: null,
        } satisfies SearchOrdersResponse),
      });
    });

    await openOrderSearchPage(page);

    await expect(page.locator("tbody tr")).toHaveCount(ORDER_ROWS_PER_PAGE);

    await expect(
      page.getByRole("button", {
        name: /次/,
      }),
    ).toBeVisible();

    await expect(page.getByText("1 / 2ページ", { exact: true })).toBeVisible();

    await expect(
      page.locator("tbody tr").filter({
        hasText: "e2e-order-11",
      }),
    ).toHaveCount(0);

    const nextButton = page.getByRole("button", {
      name: "次へ",
      exact: true,
    });

    await nextButton.click();

    await expect(page.locator("tbody tr")).toHaveCount(1);

    await expect(
      page.locator("tbody tr").filter({
        hasText: "e2e-order-11",
      }),
    ).toBeVisible();

    await expect(page.getByText("2 / 2ページ", { exact: true })).toBeVisible();

    await expect(nextButton).toBeDisabled();

    const previousButton = page.getByRole("button", {
      name: "前へ",
      exact: true,
    });

    await previousButton.click();

    await expect(page.locator("tbody tr")).toHaveCount(ORDER_ROWS_PER_PAGE);

    await expect(page.getByText("1 / 2ページ", { exact: true })).toBeVisible();
  });

  test("ヘッダーの購入履歴から検索画面へ遷移できる", async ({ page }) => {
    await page.goto("/admin");

    const navigation = page.getByRole("navigation", {
      name: "管理画面メニュー",
    });

    const link = navigation.getByRole("link", {
      name: "購入履歴",
      exact: true,
    });

    await expect(link).toBeVisible();

    await link.click();

    await expect(page).toHaveURL(/\/admin\/order\/search$/);
  });
});

test.describe("UC015 購入履歴検索（未認証）", () => {
  test.use({
    storageState: {
      cookies: [],
      origins: [],
    },
  });

  test("未ログインではログイン画面へ遷移する", async ({ page }) => {
    await page.goto("/admin/order/search");

    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
