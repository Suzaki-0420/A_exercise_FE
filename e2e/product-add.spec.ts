import { expect, test, type Locator, type Page } from "@playwright/test";

/*
 * ログイン済みの認証情報を使用する。
 *
 * login.setup.tsがe2eフォルダ内にあり、
 * e2e/.auth/admin.jsonへ保存している想定。
 */
test.use({
  storageState: "e2e/.auth/admin.json",
});

/**
 * テストで使用する商品カテゴリ
 */
const TEST_CATEGORY_NAME = "筆記具";

/**
 * 確認モーダルのボタン名
 */
const MODAL_REGISTER_BUTTON_NAME = "確認";

const MODAL_CANCEL_BUTTON_NAME = "キャンセル";

/**
 * 商品登録画面を開く
 */
const openProductAddPage = async (page: Page): Promise<void> => {
  await page.goto("/admin/product/add");

  await expect(
    page.getByRole("heading", {
      name: "新商品登録（入力）",
    }),
  ).toBeVisible();
};

/**
 * 商品登録画面の要素
 */
type ProductFormElements = {
  productNameInput: Locator;
  priceInput: Locator;
  stockInput: Locator;
  categorySelect: Locator;
  imageInput: Locator;
  completeButton: Locator;
  cancelButton: Locator;
};

/**
 * 商品登録画面の各要素を取得する
 */
const getFormElements = (page: Page): ProductFormElements => {
  return {
    productNameInput: page.getByLabel("商品名"),

    priceInput: page.getByLabel("単価"),

    stockInput: page.getByLabel("在庫数"),

    categorySelect: page.getByLabel("商品カテゴリ"),

    imageInput: page.getByLabel("商品画像"),

    completeButton: page.getByRole("button", {
      name: "確認",
      exact: true,
    }),

    cancelButton: page.getByRole("button", {
      name: "キャンセル",
      exact: true,
    }),
  };
};

/**
 * テスト用のPNG画像
 *
 * ファイルを別途用意しなくても実行できるよう、
 * 1×1pxのPNG画像をBufferとして作成する。
 */
const createTestImage = () => {
  return {
    name: "e2e-product.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    ),
  };
};

/**
 * 正常な商品情報を入力する
 */
const fillValidProductForm = async (
  page: Page,
  productName = "E2Eテスト商品",
): Promise<void> => {
  const {
    productNameInput,
    priceInput,
    stockInput,
    categorySelect,
    imageInput,
  } = getFormElements(page);

  await productNameInput.fill(productName);

  await priceInput.fill("1200");

  await stockInput.fill("15");

  await categorySelect.selectOption({
    label: TEST_CATEGORY_NAME,
  });

  await imageInput.setInputFiles(createTestImage());
};

/**
 * 確認モーダルを取得する
 */
const getConfirmDialog = (page: Page): Locator => {
  return page.getByRole("dialog");
};

test.describe("BP012 新商品登録（入力）画面", () => {
  test.beforeEach(async ({ page }) => {
    await openProductAddPage(page);
  });

  /**
   * テスト1
   */
  test("入力項目と商品カテゴリが表示される", async ({ page }) => {
    const {
      productNameInput,
      priceInput,
      stockInput,
      categorySelect,
      imageInput,
      completeButton,
      cancelButton,
    } = getFormElements(page);

    await expect(productNameInput).toBeVisible();

    await expect(priceInput).toBeVisible();

    await expect(stockInput).toBeVisible();

    await expect(categorySelect).toBeVisible();

    await expect(imageInput).toBeVisible();

    await expect(completeButton).toBeVisible();

    await expect(cancelButton).toBeVisible();

    /*
     * 全カテゴリを確認するのではなく、
     * 代表として筆記具が存在することを確認する。
     */
    await expect(
      categorySelect.getByRole("option", {
        name: TEST_CATEGORY_NAME,
        exact: true,
      }),
    ).toBeAttached();
  });

  /**
   * テスト2
   */
  test("未入力の項目からフォーカスを外すと必須エラーが表示され確認モーダルは開かない", async ({
    page,
  }) => {
    const {
      productNameInput,
      priceInput,
      stockInput,
      categorySelect,
      imageInput,
      completeButton,
    } = getFormElements(page);

    /*
     * 商品名
     * 一度入力してから空に戻し、blurさせる
     */
    await productNameInput.fill("仮");
    await productNameInput.clear();
    await productNameInput.blur();

    await expect(
      page.getByText("商品名を入力してください。", {
        exact: true,
      }),
    ).toBeVisible();

    /*
     * 価格
     */
    await priceInput.fill("1");
    await priceInput.clear();
    await priceInput.blur();

    await expect(
      page.getByText("価格を入力してください。", {
        exact: true,
      }),
    ).toBeVisible();

    /*
     * 在庫数
     */
    await stockInput.fill("1");
    await stockInput.clear();
    await stockInput.blur();

    await expect(
      page.getByText("在庫数を入力してください。", {
        exact: true,
      }),
    ).toBeVisible();

    /*
     * カテゴリ
     *
     * 初期値が空の状態でfocus・blurを発生させる。
     */
    await categorySelect.focus();
    await categorySelect.blur();

    await expect(
      page.getByText("カテゴリを選択してください。", {
        exact: true,
      }),
    ).toBeVisible();

    /*
     * 入力エラーがあるため、確認ボタンは無効
     */
    await expect(completeButton).toBeDisabled();

    /*
     * 確認モーダルは開かない
     */
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  /**
   * テスト3
   */
  test("正常な値を入力して完了すると確認モーダルが表示される", async ({
    page,
  }) => {
    await fillValidProductForm(page);

    const { completeButton } = getFormElements(page);

    await completeButton.click();

    const dialog = getConfirmDialog(page);

    await expect(dialog).toBeVisible();

    await expect(
      dialog.getByRole("button", {
        name: "登録する",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      dialog.getByRole("button", {
        name: "登録する",
        exact: true,
      }),
    ).toBeVisible();
  });

  /**
   * テスト4
   */
  test("確認モーダルに入力した商品情報が表示される", async ({ page }) => {
    await fillValidProductForm(page);

    const { completeButton } = getFormElements(page);

    await completeButton.click();

    const dialog = getConfirmDialog(page);

    await expect(dialog).toBeVisible();

    await expect(
      dialog.getByText("E2Eテスト商品", {
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      dialog.getByText("1,200円", {
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      dialog.getByText("15個", {
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      dialog.getByText(TEST_CATEGORY_NAME, {
        exact: true,
      }),
    ).toBeVisible();

    await expect(dialog.getByRole("img")).toBeVisible();

    await expect(
      dialog.getByText("選択中の画像", {
        exact: true,
      }),
    ).toBeVisible();
  });

  /**
   * テスト5
   */
  test("確認モーダルでキャンセルするとモーダルが閉じ入力値が保持される", async ({
    page,
  }) => {
    await fillValidProductForm(page);

    const {
      productNameInput,
      priceInput,
      stockInput,
      categorySelect,
      completeButton,
    } = getFormElements(page);

    await completeButton.click();

    const dialog = getConfirmDialog(page);

    await expect(dialog).toBeVisible();

    await dialog
      .getByRole("button", {
        name: "戻る",
        exact: true,
      })
      .click();

    await expect(dialog).not.toBeVisible();

    await expect(productNameInput).toHaveValue("E2Eテスト商品");

    await expect(priceInput).toHaveValue("1200");

    await expect(stockInput).toHaveValue("15");

    await expect(categorySelect).toHaveValue(/.+/);
  });

  /**
   * テスト6
   */
  test("確認モーダルで登録すると商品登録が完了し商品検索画面へ遷移する", async ({
    page,
  }) => {
    /*
     * テストを繰り返しても商品名が重複しにくいよう、
     * 現在時刻を商品名に含める。
     *
     * 商品名が20文字以内になるよう短めにする。
     */
    const productName = `テスト${Date.now().toString().slice(-8)}`;

    await fillValidProductForm(page, productName);

    const { completeButton } = getFormElements(page);

    await completeButton.click();

    const dialog = getConfirmDialog(page);

    await expect(dialog).toBeVisible();

    await dialog
      .getByRole("button", {
        name: "登録する",
        exact: true,
      })
      .click();

    /*
     * 登録成功後、商品検索画面へ遷移することを確認する。
     */
    await expect(page).toHaveURL(/\/admin\/product\/add?$/);
  });
  test("商品名が2文字未満の場合は文字数エラーが表示される", async ({
    page,
  }) => {
    const { productNameInput } = getFormElements(page);

    await productNameInput.fill("A");
    await productNameInput.blur();

    await expect(
      page.getByText("商品名は2〜20文字で入力してください。", { exact: true }),
    ).toBeVisible();
  });

  test("商品名が20文字を超える場合は文字数エラーが表示される", async ({
    page,
  }) => {
    const { productNameInput } = getFormElements(page);

    /*
     * 22文字の商品名を入力
     */
    await productNameInput.fill("abcdefghijklmnopqrstuv");

    /*
     * blurでバリデーションを発生させる
     */
    await productNameInput.blur();

    /*
     * 文字数エラーが表示されることを確認
     */
    await expect(
      page.getByText("商品名は2〜20文字で入力してください。", {
        exact: true,
      }),
    ).toBeVisible();
  });

  test("単価が100万円を超える場合は数値範囲エラーが表示される", async ({
    page,
  }) => {
    const { priceInput } = getFormElements(page);

    await priceInput.fill("1000001");
    await priceInput.blur();

    await expect(
      page.getByText("価格は100万円以下で入力してください。", { exact: true }),
    ).toBeVisible();
  });

  test("単価が100万円の場合は数値範囲エラーが表示されない", async ({
    page,
  }) => {
    const { priceInput } = getFormElements(page);

    await priceInput.fill("1000000");
    await priceInput.blur();

    await expect(
      page.getByText("価格は100万円以下で入力してください。", { exact: true }),
    ).toHaveCount(0);
  });

  test("在庫数が1000個を超える場合は数値範囲エラーが表示される", async ({
    page,
  }) => {
    const { stockInput } = getFormElements(page);

    await stockInput.fill("1001");
    await stockInput.blur();

    await expect(
      page.getByText("在庫数は1000個以下で入力してください。", { exact: true }),
    ).toBeVisible();
  });

  test("在庫数が1000個の場合は数値範囲エラーが表示されない", async ({
    page,
  }) => {
    const { stockInput } = getFormElements(page);

    await stockInput.fill("1000");
    await stockInput.blur();

    await expect(
      page.getByText("在庫数は1000個以下で入力してください。", { exact: true }),
    ).toHaveCount(0);
  });

  test("画像を選択していない場合は必須エラーが表示される", async ({ page }) => {
    const {
      productNameInput,
      priceInput,
      stockInput,
      categorySelect,
      completeButton,
    } = getFormElements(page);

    /*
     * 画像以外は正常値を入力する
     */
    await productNameInput.fill("テスト商品");
    await productNameInput.blur();

    await priceInput.fill("1200");
    await priceInput.blur();

    await stockInput.fill("15");
    await stockInput.blur();

    await categorySelect.selectOption({
      label: TEST_CATEGORY_NAME,
    });
    await categorySelect.blur();

    /*
     * 商品画像だけ未選択の状態で確認
     */
    await completeButton.click();

    /*
     * 画像必須エラー
     */
    await expect(
      page.getByText("商品画像を選択してください。", {
        exact: true,
      }),
    ).toBeVisible();

    /*
     * 確認モーダルは開かない
     */
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("画像以外のファイルを選択すると画像形式エラーが表示される", async ({
    page,
  }) => {
    const { imageInput } = getFormElements(page);

    await imageInput.setInputFiles({
      name: "test.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("not image"),
    });

    await imageInput.blur();

    await expect(
      page.getByText("商品画像はJPEGまたはPNG形式を選択してください。", {
        exact: true,
      }),
    ).toBeVisible();
  });

  test("画像サイズが1000pxを超える場合は画像サイズエラーが表示される", async ({
    page,
  }) => {
    const { imageInput } = getFormElements(page);

    await imageInput.setInputFiles("e2e/fixtures/too-large-image.png");

    await expect(
      page.getByText("商品画像は縦横1000px以下を選択してください。", {
        exact: true,
      }),
    ).toBeVisible();
  });
});
